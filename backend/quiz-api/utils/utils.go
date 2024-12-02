package utils

import (
	"net/http"
	"os"
	"quiz-api/models"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/golang-jwt/jwt/v5"
	"github.com/google/uuid"
)

func GenerateToken(user *models.User) (string, string, error) {
	sessionUUID := uuid.New()
	claims := jwt.MapClaims{
		"user_id":      user.ID,
		"session_uuid": sessionUUID,
		"username":     user.Username,
		"is_admin":     user.IsAdmin,
		"exp":          time.Now().Add(time.Hour * 24).Unix(),
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	jwtToken, err := token.SignedString([]byte(os.Getenv("JWT_SECRET")))
	return sessionUUID.String(), jwtToken, err
}

// SuccessResponse represents a standard success response
type SuccessResponse struct {
	Status int         `json:"status"` // e.g., "success"
	Data   interface{} `json:"data"`   // Response payload
}

// ErrorResponse represents a standard error response
type ErrorResponse struct {
	Status  int    `json:"status"`  // e.g., "error"
	Message string `json:"message"` // Error description
}

// SendCreated sends a standardized success response for resource creation
func SendCreated(c *gin.Context, data interface{}) {
	c.JSON(http.StatusCreated, SuccessResponse{
		Status: http.StatusCreated,
		Data:   data,
	})
}

// SendCreated sends a standardized success response for resource creation
func SendSuccess(c *gin.Context, data interface{}) {
	c.JSON(http.StatusOK, SuccessResponse{
		Status: http.StatusOK,
		Data:   data,
	})
}

// SendError sends a standardized error response
func SendError(c *gin.Context, statusCode int, message string) {
	c.JSON(statusCode, ErrorResponse{
		Status:  statusCode,
		Message: message,
	})
}
