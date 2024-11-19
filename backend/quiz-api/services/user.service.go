package services

import (
	"errors"
	"fmt"
	"quiz-api/models"
	"quiz-api/repositories"
	"quiz-api/utils"

	"golang.org/x/crypto/bcrypt"
)

type UserService struct {
	UserRepo *repositories.UserRepository
}

func NewUserService(repo *repositories.UserRepository) *UserService {
	return &UserService{UserRepo: repo}
}

// Register a new user
func (s *UserService) Register(username, password string) (*models.User, error) {

	existingUser, err := s.UserRepo.FindByUsername(username)
	if err != nil {
		return nil, err
	}

	if existingUser != nil {
		return nil, fmt.Errorf("username already exists")
	}

	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(password), bcrypt.DefaultCost)
	if err != nil {
		return nil, err
	}

	user := &models.User{
		Username: username,
		Password: string(hashedPassword),
	}

	err = s.UserRepo.Create(user)
	return user, err
}

// Login a user and return JWT token
func (s *UserService) Login(username, password string) (*models.User, string, error) {
	user, err := s.UserRepo.FindByUsername(username)
	if err != nil {
		return nil, "", errors.New("user not found")
	}

	err = bcrypt.CompareHashAndPassword([]byte(user.Password), []byte(password))
	if err != nil {
		return nil, "", errors.New("invalid credentials")
	}

	// Generate JWT token
	token, err := utils.GenerateToken(user)
	if err != nil {
		return nil, "", err
	}

	return user, token, nil
}

// Change password for a user
func (s *UserService) ChangePassword(userId uint, oldPassword, newPassword string) error {
	user, err := s.UserRepo.FindById(userId)
	if err != nil {
		return errors.New("user not found")
	}

	err = bcrypt.CompareHashAndPassword([]byte(user.Password), []byte(oldPassword))
	if err != nil {
		return errors.New("incorrect old password")
	}

	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(newPassword), bcrypt.DefaultCost)
	if err != nil {
		return err
	}

	return s.UserRepo.UpdatePassword(user.ID, string(hashedPassword))
}

// Helper function to generate JWT token
