package services

import (
	"quiz-api/models"
	"quiz-api/repositories"
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
	return s.quizRepo.CreateQuiz(quiz)
}

// GetQuizByUUID retrieves a quiz by its UUID
func (s *QuizService) GetQuizByUUID(uuid string) (*models.Quiz, error) {
	return s.quizRepo.GetQuizByUUID(uuid)
}

// GetAllQuizzes retrieves all quizzes
func (s *QuizService) GetAllQuizzes() ([]models.Quiz, error) {
	return s.quizRepo.GetAllQuizzes()
}

// UpdateQuiz updates an existing quiz
func (s *QuizService) UpdateQuiz(uuid string, updatedQuiz *models.Quiz) error {
	return s.quizRepo.UpdateQuiz(uuid, updatedQuiz)
}

// DeleteQuiz deletes a quiz by its UUID
func (s *QuizService) DeleteQuiz(uuid string) error {
	return s.quizRepo.DeleteQuiz(uuid)
}

func (s *QuizService) QuizExport(uuid string, socketID string) error {
	err := s.kafkaService.PublishMessage("quiz_export", uuid, socketID)
	return err
}
