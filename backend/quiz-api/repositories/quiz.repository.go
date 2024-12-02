package repositories

import (
	"quiz-api/models"

	"gorm.io/gorm"
)

// QuizRepository defines the repository for Quiz
type QuizRepository struct {
	db *gorm.DB
}

// NewQuizRepository initializes a new QuizRepository
func NewQuizRepository(db *gorm.DB) *QuizRepository {
	return &QuizRepository{db: db}
}

// CreateQuiz creates a new quiz
func (r *QuizRepository) CreateQuiz(quiz *models.Quiz) error {
	return r.db.Create(quiz).Error
}

// GetQuizByUUID retrieves a quiz by its UUID
func (r *QuizRepository) GetQuizByUUID(uuid string) (*models.Quiz, error) {
	var quiz models.Quiz
	err := r.db.Preload("Questions.Answers").First(&quiz, "uuid = ?", uuid).Error
	return &quiz, err
}

// GetQuizzesWithPagination retrieves paginated quizzes with a total count
func (r *QuizRepository) GetQuizzesWithPagination(offset, limit int) ([]models.Quiz, int64, error) {
	var quizzes []models.Quiz
	var total int64

	// Count the total number of quizzes
	err := r.db.Model(&models.Quiz{}).Count(&total).Error
	if err != nil {
		return nil, 0, err
	}

	// Retrieve the quizzes with offset and limit
	err = r.db.Order("created_at DESC").Offset(offset).Limit(limit).Find(&quizzes).Error
	return quizzes, total, err
}

// UpdateQuiz updates an existing quiz
func (r *QuizRepository) UpdateQuiz(uuid string, updatedQuiz *models.Quiz) error {
	return r.db.Model(&models.Quiz{}).Where("uuid = ?", uuid).Save(updatedQuiz).Error
}

// DeleteQuiz deletes a quiz by its UUID
func (r *QuizRepository) DeleteQuiz(uuid string) error {
	return r.db.Delete(&models.Quiz{}, "uuid = ?", uuid).Error
}
