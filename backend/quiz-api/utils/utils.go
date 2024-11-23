package utils

import (
	"net/http"
	"os"
	"quiz-api/models"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/golang-jwt/jwt/v5"
)

func GenerateToken(user *models.User) (string, error) {
	claims := jwt.MapClaims{
		"userID":   user.ID,
		"username": user.Username,
		"isAdmin":  user.IsAdmin,
		"exp":      time.Now().Add(time.Hour * 24).Unix(),
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	return token.SignedString([]byte(os.Getenv("JWT_SECRET")))
}

// SuccessResponse represents a standard success response
type SuccessResponse struct {
	Status  string      `json:"status"`  // e.g., "success"
	Message string      `json:"message"` // Optional descriptive message
	Data    interface{} `json:"data"`    // Response payload
}

// ErrorResponse represents a standard error response
type ErrorResponse struct {
	Status  string `json:"status"`  // e.g., "error"
	Message string `json:"message"` // Error description
}

// SendCreated sends a standardized success response for resource creation
func SendCreated(c *gin.Context, data interface{}, message string) {
	c.JSON(http.StatusCreated, SuccessResponse{
		Status:  "success",
		Message: message,
		Data:    data,
	})
}

// SendCreated sends a standardized success response for resource creation
func SendSuccess(c *gin.Context, data interface{}, message string) {
	c.JSON(http.StatusOK, SuccessResponse{
		Status:  "success",
		Message: message,
		Data:    data,
	})
}

// SendError sends a standardized error response
func SendError(c *gin.Context, statusCode int, message string) {
	c.JSON(statusCode, ErrorResponse{
		Status:  "error",
		Message: message,
	})
}
