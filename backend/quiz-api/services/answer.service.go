package services

import (
	"quiz-api/models"
	"quiz-api/repositories"
)

// AnswerService provides business logic for answers
type AnswerService struct {
	answerRepo *repositories.AnswerRepository
}

// NewAnswerService initializes a new AnswerService
func NewAnswerService(answerRepo *repositories.AnswerRepository) *AnswerService {
	return &AnswerService{answerRepo: answerRepo}
}

// CreateAnswer creates a new answer
func (s *AnswerService) CreateAnswer(answer *models.Answer) error {
	return s.answerRepo.CreateAnswer(answer)
}

// GetAnswersByQuestion retrieves all answers for a specific question
func (s *AnswerService) GetAnswersByQuestion(questionUUID string) ([]models.Answer, error) {
	return s.answerRepo.GetAnswersByQuestionUUID(questionUUID)
}

// UpdateAnswer updates an existing answer
func (s *AnswerService) UpdateAnswer(uuid string, updatedAnswer *models.Answer) error {
	return s.answerRepo.UpdateAnswer(uuid, updatedAnswer)
}

// DeleteAnswer deletes an answer by its UUID
func (s *AnswerService) DeleteAnswer(uuid string) error {
	return s.answerRepo.DeleteAnswer(uuid)
}
