package utils

import (
	"os"
	"quiz-api/models"
	"time"

	"github.com/golang-jwt/jwt/v5"
)

func GenerateToken(user *models.User) (string, error) {
	claims := jwt.MapClaims{
		"userID":   user.ID,
		"username": user.Username,
		"exp":      time.Now().Add(time.Hour * 24).Unix(),
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	return token.SignedString([]byte(os.Getenv("JWT_SECRET")))
}
