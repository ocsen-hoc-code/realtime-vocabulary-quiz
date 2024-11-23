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

// GetAllQuizzes retrieves all quizzes
func (r *QuizRepository) GetAllQuizzes() ([]models.Quiz, error) {
	var quizzes []models.Quiz
	err := r.db.Find(&quizzes).Error
	return quizzes, err
}

// UpdateQuiz updates an existing quiz
func (r *QuizRepository) UpdateQuiz(uuid string, updatedQuiz *models.Quiz) error {
	return r.db.Model(&models.Quiz{}).Where("uuid = ?", uuid).Updates(updatedQuiz).Error
}

// DeleteQuiz deletes a quiz by its UUID
func (r *QuizRepository) DeleteQuiz(uuid string) error {
	return r.db.Delete(&models.Quiz{}, "uuid = ?", uuid).Error
}
