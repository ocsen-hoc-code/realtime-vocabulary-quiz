package repositories

import (
	"errors"
	"quiz-api/models"

	"gorm.io/gorm"
)

type UserRepository struct {
	DB *gorm.DB
}

func NewUserRepository(db *gorm.DB) *UserRepository {
	return &UserRepository{DB: db}
}

func (r *UserRepository) Create(user *models.User) error {
	return r.DB.Create(user).Error
}

func (r *UserRepository) FindByUsername(username string) (*models.User, error) {
	var user models.User
	err := r.DB.Where("username = ?", username).First(&user).Error
	if errors.Is(err, gorm.ErrRecordNotFound) {
		return nil, nil
	}
	return &user, err
}

func (r *UserRepository) FindById(userId uint) (*models.User, error) {
	var user models.User
	err := r.DB.Where("id = ?", userId).First(&user).Error
	return &user, err
}

func (r *UserRepository) UpdatePassword(userID uint, newPassword string) error {
	return r.DB.Model(&models.User{}).Where("id = ?", userID).Update("password", newPassword).Error
}
