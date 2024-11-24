package services

import (
	"context"
	"errors"
	"fmt"
	"quiz-api/config"
	"quiz-api/models"
	"quiz-api/repositories"
	"quiz-api/utils"
	"time"

	"golang.org/x/crypto/bcrypt"
)

type UserService struct {
	UserRepo *repositories.UserRepository
	Client   *config.RedisClient
}

func NewUserService(repo *repositories.UserRepository, client *config.RedisClient) *UserService {
	return &UserService{UserRepo: repo, Client: client}
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
	if err != nil || user == nil {
		return nil, "", errors.New("user not found")
	}

	err = bcrypt.CompareHashAndPassword([]byte(user.Password), []byte(password))
	if err != nil {
		return nil, "", errors.New("invalid credentials")
	}

	// Generate JWT token
	sessionUUID, token, err := utils.GenerateToken(user)

	if err != nil {
		return nil, "", err
	}

	// Store session UUID in Redis
	s.Client.Set(context.Background(), "user:"+fmt.Sprint(user.ID), sessionUUID, 24*time.Hour)
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
