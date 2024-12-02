package registry

import (
	"os"
	"quiz-api/consumers"
	"quiz-api/services"

	"github.com/sirupsen/logrus"
)

// RegisterTopics sets up topics and their associated handlers
func RegisterTopics(logger *logrus.Logger, quizExportSerice *services.QuizExportService) services.KafkaConfig {
	return services.KafkaConfig{
		Broker:    os.Getenv("KAFKA_BROKER"),
		GroupID:   os.Getenv("KAFKA_GROUP_ID"),
		Username:  os.Getenv("KAFKA_USERNAME"),
		Password:  os.Getenv("KAFKA_PASSWORD"),
		Topics:    []string{"quiz_export", "revoke_quiz"},
		Consumers: consumers.RegisterKafkaConsumers(logger, quizExportSerice),
		Logger:    logger,
	}
}
