package consumers

import "github.com/sirupsen/logrus"

// KafkaHandlerFunc is the type for Kafka message processing functions
type KafkaConsumer func(key string, value string)

func RegisterKafkaConsumers(logger *logrus.Logger) map[string]func(key, value string) {
	return map[string]func(key, value string){
		"quiz_export": func(key string, value string) {
			logger.WithFields(logrus.Fields{
				"key":   key,
				"value": value,
			}).Info("Message consumed")
		},
	}
}
