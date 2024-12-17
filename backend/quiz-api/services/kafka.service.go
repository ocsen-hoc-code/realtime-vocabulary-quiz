package services

import (
	"context"
	"fmt"
	"sync"
	"time"

	"github.com/segmentio/kafka-go"
	"github.com/segmentio/kafka-go/sasl/plain"
	"github.com/sirupsen/logrus"
)

// KafkaMessage defines the structure of a Kafka message
type KafkaMessage struct {
	Topic string
	Key   string
	Value string
}

// KafkaService handles Kafka producer and consumer operations
type KafkaService struct {
	writer        *kafka.Writer
	readerConfig  kafka.ReaderConfig
	topicHandlers map[string]func(key, value string)
	logger        *logrus.Logger
	messageQueue  chan KafkaMessage // Channel for worker pool
	workerCount   int
	wg            sync.WaitGroup
}

// KafkaConfig holds configuration for KafkaService
type KafkaConfig struct {
	Broker    string
	Topics    []string
	GroupID   string
	Username  string
	Password  string
	Consumers map[string]func(key, value string)
	Logger    *logrus.Logger
}

// EnsureTopicExists checks if a topic exists and creates it if it doesn't
func EnsureTopicExists(broker, topic, username, password string, numPartitions, replicationFactor int) error {
	dialer := &kafka.Dialer{
		SASLMechanism: plain.Mechanism{
			Username: username,
			Password: password,
		},
	}

	conn, err := dialer.DialContext(context.Background(), "tcp", broker)
	if err != nil {
		return fmt.Errorf("failed to connect to broker: %v", err)
	}
	defer conn.Close()

	partitions, err := conn.ReadPartitions(topic)
	if err == nil && len(partitions) > 0 {
		return nil
	}

	err = conn.CreateTopics(kafka.TopicConfig{
		Topic:             topic,
		NumPartitions:     numPartitions,
		ReplicationFactor: replicationFactor,
	})
	if err != nil {
		return fmt.Errorf("failed to create topic: %v", err)
	}

	return nil
}

// NewKafkaService initializes the KafkaService with SASL/PLAIN authentication
func NewKafkaService(cfg KafkaConfig, workerCount int) *KafkaService {
	dialer := &kafka.Dialer{
		SASLMechanism: plain.Mechanism{
			Username: cfg.Username,
			Password: cfg.Password,
		},
	}

	cfg.Logger.WithFields(logrus.Fields{
		"broker":   cfg.Broker,
		"groupID":  cfg.GroupID,
		"username": cfg.Username,
	}).Info("Initializing KafkaService with SASL/PLAIN authentication")

	// Ensure all topics exist
	for _, topic := range cfg.Topics {
		err := EnsureTopicExists(cfg.Broker, topic, cfg.Username, cfg.Password, 1, 1)
		if err != nil {
			cfg.Logger.WithFields(logrus.Fields{
				"topic": topic,
				"error": err.Error(),
			}).Error("Failed to ensure topic exists")
		}
	}

	service := &KafkaService{
		writer: &kafka.Writer{
			Addr:     kafka.TCP(cfg.Broker),
			Balancer: &kafka.LeastBytes{},
			Transport: &kafka.Transport{
				SASL: plain.Mechanism{
					Username: cfg.Username,
					Password: cfg.Password,
				},
			},
		},
		readerConfig: kafka.ReaderConfig{
			Brokers:        []string{cfg.Broker},
			GroupID:        cfg.GroupID,
			Dialer:         dialer,
			MinBytes:       10e3, // 10KB
			MaxBytes:       10e6, // 10MB
			CommitInterval: 0,
			StartOffset:    kafka.FirstOffset,
		},
		topicHandlers: cfg.Consumers,
		logger:        cfg.Logger,
		messageQueue:  make(chan KafkaMessage, 100), // Buffered channel
		workerCount:   workerCount,
	}

	// Start worker pool
	service.startWorkerPool()

	return service
}

// startWorkerPool initializes the worker pool
func (k *KafkaService) startWorkerPool() {
	for i := 0; i < k.workerCount; i++ {
		k.wg.Add(1)
		go k.worker(i)
	}
}

// worker listens to the messageQueue and processes messages
func (k *KafkaService) worker(workerID int) {
	defer k.wg.Done()
	for msg := range k.messageQueue {
		err := k.writer.WriteMessages(context.Background(), kafka.Message{
			Topic: msg.Topic,
			Key:   []byte(msg.Key),
			Value: []byte(msg.Value),
		})
		if err != nil {
			k.logger.Errorf("Worker %d: Failed to publish message to topic %s: %v", workerID, msg.Topic, err)
		} else {
			k.logger.Infof("Worker %d: Published message to topic %s", workerID, msg.Topic)
		}
	}
}

// PublishMessage adds a message to the queue for worker processing
func (k *KafkaService) PublishMessage(topic, key, value string) error {
	k.messageQueue <- KafkaMessage{Topic: topic, Key: key, Value: value}
	return nil
}

// StartConsumer creates a consumer for each topic and processes messages with manual offset commits
func (k *KafkaService) StartConsumer(topics []string) {
	for _, topic := range topics {
		go func(topic string) {
			reader := kafka.NewReader(kafka.ReaderConfig{
				Dialer:         k.readerConfig.Dialer,
				Brokers:        k.readerConfig.Brokers,
				GroupID:        k.readerConfig.GroupID,
				Topic:          topic,
				MinBytes:       k.readerConfig.MinBytes,
				MaxBytes:       k.readerConfig.MaxBytes,
				CommitInterval: 0,
				StartOffset:    kafka.LastOffset,
				MaxWait:        100 * time.Millisecond,
			})
			defer reader.Close()

			k.logger.WithField("topic", topic).Info("Starting consumer")

			for {
				msg, err := reader.FetchMessage(context.Background())
				if err != nil {
					k.logger.WithFields(logrus.Fields{
						"topic": topic,
						"error": err.Error(),
					}).Error("Error fetching message")
					continue
				}

				if handler, ok := k.topicHandlers[topic]; ok {
					handler(string(msg.Key), string(msg.Value))
					err = reader.CommitMessages(context.Background(), msg)
					if err != nil {
						k.logger.Errorf("Error committing message: %v", err)
					}
				}
			}
		}(topic)
	}
}

// Close releases resources and flushes logs
func (k *KafkaService) Close() {
	close(k.messageQueue)
	k.wg.Wait()
	if k.writer != nil {
		k.writer.Close()
	}
	k.logger.Info("KafkaService shut down successfully")
}
