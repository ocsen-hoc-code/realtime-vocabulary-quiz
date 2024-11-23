package services

import (
	"context"
	"fmt"

	"github.com/segmentio/kafka-go"
	"github.com/segmentio/kafka-go/sasl/plain"
	"github.com/sirupsen/logrus"
)

// KafkaService handles Kafka producer and consumer operations
type KafkaService struct {
	writer        *kafka.Writer
	readerConfig  kafka.ReaderConfig
	topicHandlers map[string]func(key, value string)
	logger        *logrus.Logger
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
	// Create a SASL Dialer for authentication
	dialer := &kafka.Dialer{
		SASLMechanism: plain.Mechanism{
			Username: username,
			Password: password,
		},
	}

	// Connect to the Kafka broker
	conn, err := dialer.DialContext(context.Background(), "tcp", broker)
	if err != nil {
		return fmt.Errorf("failed to connect to broker: %v", err)
	}
	defer conn.Close()

	// List existing topics
	_, err = conn.Brokers()
	if err != nil {
		return fmt.Errorf("failed to fetch brokers metadata: %v", err)
	}

	// Check if the topic already exists
	partitions, err := conn.ReadPartitions(topic)
	if err == nil && len(partitions) > 0 {
		fmt.Printf("Topic %s already exists\n", topic)
		return nil
	}

	// If topic doesn't exist, create it
	err = conn.CreateTopics(kafka.TopicConfig{
		Topic:             topic,
		NumPartitions:     numPartitions,
		ReplicationFactor: replicationFactor,
	})
	if err != nil {
		return fmt.Errorf("failed to create topic: %v", err)
	}

	fmt.Printf("Topic %s created successfully\n", topic)
	return nil
}

// NewKafkaService initializes the KafkaService with SASL/PLAIN authentication
func NewKafkaService(cfg KafkaConfig) *KafkaService {
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

	return &KafkaService{
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
			CommitInterval: 0,    // Manual offset commit
			StartOffset:    kafka.FirstOffset,
		},
		topicHandlers: cfg.Consumers,
		logger:        cfg.Logger,
	}
}

// PublishMessage publishes a message to a Kafka topic
func (k *KafkaService) PublishMessage(topic, key, value string) error {
	message := kafka.Message{
		Key:   []byte(key),
		Value: []byte(value),
		Topic: topic, // Set topic explicitly for the message
	}

	err := k.writer.WriteMessages(context.Background(), message)
	if err != nil {
		k.logger.WithFields(logrus.Fields{
			"topic": topic,
			"key":   key,
			"error": err.Error(),
		}).Error("Failed to publish message")
		return err
	}

	k.logger.WithFields(logrus.Fields{
		"topic": topic,
		"key":   key,
		"value": value,
	}).Info("Message published successfully")
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
				CommitInterval: 0, // Disable auto-commit for manual commits
				StartOffset:    kafka.FirstOffset,
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
						k.logger.WithFields(logrus.Fields{
							"topic": topic,
							"key":   string(msg.Key),
							"error": err.Error(),
						}).Error("Error committing message")
					} else {
						k.logger.WithFields(logrus.Fields{
							"topic": topic,
							"key":   string(msg.Key),
						}).Info("Message committed successfully")
					}
				} else {
					k.logger.WithField("topic", topic).Warn("No handler found for topic")
				}
			}
		}(topic)
	}
}

// Close releases resources and flushes logs
func (k *KafkaService) Close() {
	if k.writer != nil {
		k.writer.Close()
	}
	k.logger.Info("KafkaService shut down successfully")
}
