package services

import (
	"fmt"
	"quiz-api/models"
	"quiz-api/repositories"

	"github.com/google/uuid"
)

// QuizService provides business logic for quizzes
type QuizService struct {
	quizRepo     *repositories.QuizRepository
	kafkaService *KafkaService
}

// NewQuizService initializes a new QuizService
func NewQuizService(quizRepo *repositories.QuizRepository, kafkaService *KafkaService) *QuizService {
	return &QuizService{quizRepo: quizRepo, kafkaService: kafkaService}
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
