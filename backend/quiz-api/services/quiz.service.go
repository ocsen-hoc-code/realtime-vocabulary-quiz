package services

import (
	"encoding/json"
	"fmt"
	"quiz-api/models"
	"quiz-api/repositories"
	"time"

	"github.com/gocql/gocql"
	"github.com/google/uuid"
)

// QuizService provides business logic for quizzes
type QuizService struct {
	quizRepo     *repositories.QuizRepository
	kafkaService *KafkaService
	scyllaRepo   *repositories.ScyllaDBRepository
}

// NewQuizService initializes a new QuizService
func NewQuizService(quizRepo *repositories.QuizRepository, kafkaService *KafkaService, scyllaRepo *repositories.ScyllaDBRepository) *QuizService {
	return &QuizService{quizRepo: quizRepo, kafkaService: kafkaService, scyllaRepo: scyllaRepo}
}

// CreateQuiz creates a new quiz
func (s *QuizService) CreateQuiz(quiz *models.Quiz) error {
	quiz.UUID = uuid.New().String()
	if err := s.quizRepo.CreateQuiz(quiz); err != nil {
		return fmt.Errorf("failed to create quiz: %w", err)
	}
	return nil
}

// GetQuizByUUID retrieves a quiz by its UUID
func (s *QuizService) GetQuizByUUID(uuid string) (*models.Quiz, error) {
	quiz, err := s.quizRepo.GetQuizByUUID(uuid)
	if err != nil {
		return nil, fmt.Errorf("failed to retrieve quiz with UUID %s: %w", uuid, err)
	}
	return quiz, nil
}

// UpdateQuiz updates an existing quiz
func (s *QuizService) UpdateQuiz(uuid string, updatedQuiz *models.Quiz) error {
	if err := s.quizRepo.UpdateQuiz(uuid, updatedQuiz); err != nil {
		return fmt.Errorf("failed to update quiz with UUID %s: %w", uuid, err)
	}
	return nil
}

// DeleteQuiz deletes a quiz by its UUID
func (s *QuizService) DeleteQuiz(uuid string) error {
	if err := s.quizRepo.DeleteQuiz(uuid); err != nil {
		return fmt.Errorf("failed to delete quiz with UUID %s: %w", uuid, err)
	}
	return nil
}

// QuizExport triggers an export of the quiz through Kafka
func (s *QuizService) QuizExport(uuid string, socketID string) error {
	// Validate UUID format
	if uuid == "" {
		return fmt.Errorf("invalid UUID: cannot be empty")
	}

	// Attempt to publish the export message
	if err := s.kafkaService.PublishMessage("quiz_export", uuid, socketID); err != nil {
		return fmt.Errorf("failed to publish quiz export message for UUID %s: %w", uuid, err)
	}

	return nil
}

// GetQuizzesWithPagination retrieves quizzes with pagination
func (s *QuizService) GetQuizzesWithPagination(page, limit int) ([]models.Quiz, int64, error) {
	offset := (page - 1) * limit
	quizzes, total, err := s.quizRepo.GetQuizzesWithPagination(offset, limit)
	if err != nil {
		return nil, 0, fmt.Errorf("failed to retrieve paginated quizzes: %w", err)
	}
	return quizzes, total, nil
}

func (s *QuizService) RevokeQuiz(uuid string, socketID string) error {
	// Validate UUID format
	if uuid == "" {
		return fmt.Errorf("invalid UUID: cannot be empty")
	}

	// Attempt to publish the export message
	if err := s.kafkaService.PublishMessage("revoke_quiz", uuid, socketID); err != nil {
		return fmt.Errorf("failed to publish quiz export message for UUID %s: %w", uuid, err)
	}

	return nil
}

func (s *QuizService) QuizStatus(userUUID, quizUUID string) (*models.UserQuiz, error) {
	conditions := map[string]interface{}{
		"user_uuid": userUUID,
		"quiz_uuid": quizUUID,
	}

	records, err := s.scyllaRepo.SelectRecords("user_quizs", []string{"current_question_uuid", "score", "created_at", "updated_at"}, conditions, "", 1)
	if err == nil && len(records) > 0 {
		record := records[0]
		questionUUID, ok := record["current_question_uuid"].(gocql.UUID)
		if !ok {
			return nil, fmt.Errorf("invalid or missing current_question_uuid")
		}
		userQuiz := &models.UserQuiz{
			UserUUID:            userUUID,
			QuizUUID:            quizUUID,
			CurrentQuestionUUID: questionUUID.String(),
			Score:               record["score"].(int),
			CreatedAt:           record["created_at"].(time.Time),
			UpdatedAt:           record["updated_at"].(time.Time),
		}

		return userQuiz, nil
	}

	quizRecords, err := s.scyllaRepo.SelectRecords("quizs", []string{"question_uuid"}, map[string]interface{}{"quiz_uuid": quizUUID}, "", 1)
	if err != nil || len(quizRecords) == 0 {
		return nil, err
	}

	questionUUID, ok := quizRecords[0]["question_uuid"].(gocql.UUID)
	if !ok {
		return nil, fmt.Errorf("invalid or missing question_uuid")
	}
	newUserQuiz := &models.UserQuiz{
		UserUUID:            userUUID,
		QuizUUID:            quizUUID,
		CurrentQuestionUUID: questionUUID.String(),
		Score:               0,
		CreatedAt:           time.Now(),
		UpdatedAt:           time.Now(),
	}

	data := map[string]interface{}{
		"user_uuid":             newUserQuiz.UserUUID,
		"quiz_uuid":             newUserQuiz.QuizUUID,
		"current_question_uuid": newUserQuiz.CurrentQuestionUUID,
		"score":                 newUserQuiz.Score,
		"created_at":            newUserQuiz.CreatedAt,
		"updated_at":            newUserQuiz.UpdatedAt,
	}

	if err := s.scyllaRepo.InsertRecord("user_quizs", data, []string{"user_uuid", "quiz_uuid", "current_question_uuid", "score", "created_at", "updated_at"}); err != nil {
		return nil, err
	}

	message, _ := json.Marshal(newUserQuiz)
	s.kafkaService.PublishMessage("user_quiz_export", fmt.Sprintf("%s|%s", userUUID, quizUUID), string(message))

	return newUserQuiz, nil
}
