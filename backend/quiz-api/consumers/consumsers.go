package consumers

import (
	"fmt"
	"quiz-api/services"

	"github.com/sirupsen/logrus"
)

// KafkaHandlerFunc is the type for Kafka message processing functions
type KafkaConsumer func(key string, value string)

func RegisterKafkaConsumers(logger *logrus.Logger, quizExportSerice *services.QuizExportService) map[string]func(key, value string) {
	return map[string]func(key, value string){
		"quiz_export": func(key string, value string) {
			quizExport(logger, quizExportSerice, key, value)
		},
		"revoke_quiz": func(key string, value string) {
			revokeQuiz(logger, quizExportSerice, key, value)
		},
	}
}

func quizExport(logger *logrus.Logger, quizExportSerice *services.QuizExportService, key string, value string) {
	fmt.Println("Consumed message:", key, value)
	quizExportSerice.ExportQuiz(key, value)
	logger.WithFields(logrus.Fields{
		"key":   key,
		"value": value,
	}).Info("Message consumed")
}

func revokeQuiz(logger *logrus.Logger, quizExportSerice *services.QuizExportService, key string, value string) {
	quizExportSerice.RevokeQuiz(key, value)
	fmt.Println("Consumed message:", key, value)
	logger.WithFields(logrus.Fields{
		"key":   key,
		"value": value,
	}).Info("Message consumed")
}
