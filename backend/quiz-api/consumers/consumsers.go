package consumers

import (
	"fmt"
	"quiz-api/services"
	"quiz-api/utils"

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
	err, title := quizExportSerice.ExportQuiz(key, value)
	if err != nil {
		utils.SendNotification(value, fmt.Sprintf("Publish Quiz %s Falied", title))
	} else {
		utils.SendNotification(value, fmt.Sprintf("Publish Quiz %s Completed", title))
	}
	logger.WithFields(logrus.Fields{
		"key":   key,
		"value": value,
	}).Info("Message consumed")
}

func revokeQuiz(logger *logrus.Logger, quizExportSerice *services.QuizExportService, key string, value string) {
	title, err := quizExportSerice.RevokeQuiz(key, value)
	if err != nil {
		utils.SendNotification(value, fmt.Sprintf("Unpublish Quiz %s Falied", title))
	} else {
		utils.SendNotification(value, fmt.Sprintf("Unpublish Quiz %s Completed", title))
	}
	fmt.Println("Consumed message:", key, value)
	logger.WithFields(logrus.Fields{
		"key":   key,
		"value": value,
	}).Info("Message consumed")
}
