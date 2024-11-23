package repositories

import (
	"quiz-api/models"

	"gorm.io/gorm"
)

// AnswerRepository defines the repository for Answer
type AnswerRepository struct {
	db *gorm.DB
}

// NewAnswerRepository initializes a new AnswerRepository
func NewAnswerRepository(db *gorm.DB) *AnswerRepository {
	return &AnswerRepository{db: db}
}

// CreateAnswer creates a new answer
func (r *AnswerRepository) CreateAnswer(answer *models.Answer) error {
	return r.db.Create(answer).Error
}

// GetAnswersByQuestionUUID retrieves answers by the question UUID
func (r *AnswerRepository) GetAnswersByQuestionUUID(questionUUID string) ([]models.Answer, error) {
	var answers []models.Answer
	err := r.db.Where("question_uuid = ?", questionUUID).Find(&answers).Error
	return answers, err
}

// UpdateAnswer updates an existing answer
func (r *AnswerRepository) UpdateAnswer(uuid string, updatedAnswer *models.Answer) error {
	return r.db.Model(&models.Answer{}).Where("uuid = ?", uuid).Updates(updatedAnswer).Error
}

// DeleteAnswer deletes an answer by its UUID
func (r *AnswerRepository) DeleteAnswer(uuid string) error {
	return r.db.Delete(&models.Answer{}, "uuid = ?", uuid).Error
}
