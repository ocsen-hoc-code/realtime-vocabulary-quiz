package repositories

import (
	"fmt"
	"quiz-api/models"

	"github.com/google/uuid"
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
	question.UUID = uuid.New().String()
	return r.db.Create(question).Error
}

// GetQuestionsByQuizUUID retrieves questions by the quiz UUID with pagination
// GetQuestionsByQuiz retrieves paginated questions for a quiz
func (r *QuestionRepository) GetQuestionsByQuiz(quizUUID string, offset, limit int) ([]models.Question, int64, error) {
	var questions []models.Question
	var total int64

	// Count total questions for the quiz
	err := r.db.Model(&models.Question{}).Where("quiz_uuid = ?", quizUUID).Count(&total).Error
	if err != nil {
		return nil, 0, fmt.Errorf("failed to count questions: %w", err)
	}

	// Retrieve paginated questions
	err = r.db.Where("quiz_uuid = ?", quizUUID).Offset(offset).Limit(limit).Find(&questions).Error
	if err != nil {
		return nil, 0, fmt.Errorf("failed to fetch questions: %w", err)
	}

	return questions, total, nil
}

// UpdateQuestion updates an existing question
func (r *QuestionRepository) UpdateQuestion(uuid string, updatedQuestion *models.Question) error {
	return r.db.Model(&models.Question{}).Where("uuid = ?", uuid).Updates(updatedQuestion).Error
}

// DeleteQuestion deletes a question by its UUID
func (r *QuestionRepository) DeleteQuestion(uuid string) error {
	return r.db.Delete(&models.Question{}, "uuid = ?", uuid).Error
}
