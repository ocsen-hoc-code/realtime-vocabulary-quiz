package services

import (
	"quiz-api/models"
	"quiz-api/repositories"
)

// QuestionService provides business logic for questions
type QuestionService struct {
	questionRepo *repositories.QuestionRepository
}

// NewQuestionService initializes a new QuestionService
func NewQuestionService(questionRepo *repositories.QuestionRepository) *QuestionService {
	return &QuestionService{questionRepo: questionRepo}
}

// CreateQuestion creates a new question
func (s *QuestionService) CreateQuestion(question *models.Question) error {
	return s.questionRepo.CreateQuestion(question)
}

// GetQuestionsByQuiz retrieves questions by quiz UUID with pagination
func (s *QuestionService) GetQuestionsByQuiz(quizUUID string, page, limit int) ([]models.Question, error) {
	offset := (page - 1) * limit
	return s.questionRepo.GetQuestionsByQuizUUID(quizUUID, offset, limit)
}

// UpdateQuestion updates an existing question
func (s *QuestionService) UpdateQuestion(uuid string, updatedQuestion *models.Question) error {
	return s.questionRepo.UpdateQuestion(uuid, updatedQuestion)
}

// DeleteQuestion deletes a question by its UUID
func (s *QuestionService) DeleteQuestion(uuid string) error {
	return s.questionRepo.DeleteQuestion(uuid)
}
