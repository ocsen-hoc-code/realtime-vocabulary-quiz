package consumers

import (
	"encoding/json"
	"fmt"
	"os"
	"path/filepath"
	"quiz-api/services"
	"quiz-api/utils"
	"strings"

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
		"user_quiz_export": func(key, value string) {
			exportUserQuizToFile(logger, key, value)
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

func exportUserQuizToFile(logger *logrus.Logger, key string, value string) {
	parts := strings.Split(key, "|")
	if len(parts) != 2 {
		logger.Errorf("Invalid key format for user_quiz_export: %s", key)
		return
	}

	userUUID := parts[0]
	quizUUID := parts[1]

	filePath := filepath.Join("static", "logs", fmt.Sprintf("%s-%s.json", userUUID, quizUUID))

	if err := os.MkdirAll(filepath.Dir(filePath), 0755); err != nil {
		logger.Errorf("Failed to create directory for log file: %v", err)
		return
	}

	var data map[string]interface{}
	if err := json.Unmarshal([]byte(value), &data); err != nil {
		logger.Errorf("Failed to unmarshal message value: %v", err)
		return
	}

	fileData, err := json.MarshalIndent(data, "", "  ")
	if err != nil {
		logger.Errorf("Failed to format JSON data: %v", err)
		return
	}

	if err := os.WriteFile(filePath, fileData, 0644); err != nil {
		logger.Errorf("Failed to write file: %v", err)
		return
	}

	logger.Infof("User quiz data successfully exported to %s", filePath)
}
