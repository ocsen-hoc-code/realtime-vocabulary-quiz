package repositories

import (
	"quiz-api/models"

	"gorm.io/gorm"
)

// QuestionRepository defines the repository for Question
type QuestionRepository struct {
	db *gorm.DB
}

// NewQuestionRepository initializes a new QuestionRepository
func NewQuestionRepository(db *gorm.DB) *QuestionRepository {
	return &QuestionRepository{db: db}
}

// CreateQuestion creates a new question
func (r *QuestionRepository) CreateQuestion(question *models.Question) error {
	return r.db.Create(question).Error
}

// GetQuestionsByQuizUUID retrieves questions by the quiz UUID with pagination
func (r *QuestionRepository) GetQuestionsByQuizUUID(quizUUID string, offset int, limit int) ([]models.Question, error) {
	var questions []models.Question
	err := r.db.Where("quiz_uuid = ?", quizUUID).
		Order("position ASC").
		Offset(offset).Limit(limit).
		Find(&questions).Error
	return questions, err
}

// UpdateQuestion updates an existing question
func (r *QuestionRepository) UpdateQuestion(uuid string, updatedQuestion *models.Question) error {
	return r.db.Model(&models.Question{}).Where("uuid = ?", uuid).Updates(updatedQuestion).Error
}

// DeleteQuestion deletes a question by its UUID
func (r *QuestionRepository) DeleteQuestion(uuid string) error {
	return r.db.Delete(&models.Question{}, "uuid = ?", uuid).Error
}
