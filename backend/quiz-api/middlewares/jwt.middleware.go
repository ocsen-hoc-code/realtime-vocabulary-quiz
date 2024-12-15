package middlewares

import (
	"context"
	"fmt"
	"net/http"
	"os"
	"quiz-api/config"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/golang-jwt/jwt/v5"
)

type JWTMiddleware gin.HandlerFunc

func NewJWTMiddleware(redisClient *config.RedisClient) JWTMiddleware {
	return func(c *gin.Context) {
		authHeader := c.GetHeader("Authorization")
		if authHeader == "" {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Authorization header is required"})
			c.Abort()
			return
		}

		tokenString := strings.TrimPrefix(authHeader, "Bearer ")
		if tokenString == "" {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Token is required"})
			c.Abort()
			return
		}

		token, err := jwt.Parse(tokenString, func(token *jwt.Token) (interface{}, error) {
			return []byte(os.Getenv("JWT_SECRET")), nil
		})
		if err != nil || !token.Valid {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid token"})
			c.Abort()
			return
		}

		claims, ok := token.Claims.(jwt.MapClaims)
		if !ok || claims["user_id"] == nil || claims["session_uuid"] == nil {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid token claims"})
			c.Abort()
			return
		}

		userID := uint(claims["user_id"].(float64))
		userUUID := claims["user_uuid"].(string)
		sessionUUID := claims["session_uuid"].(string)
		fullName := claims["fullname"].(string)

		ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
		defer cancel()

		redisKey := "user:" + fmt.Sprint(userID)
		keySession := ""
		err = redisClient.Get(ctx, redisKey, &keySession)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to check session in Redis"})
			c.Abort()
			return
		}

		if keySession != sessionUUID {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Session not found or mismatch"})
			c.Abort()
			return
		}

		c.Set("userID", userID)
		c.Set("userUUID", userUUID)
		c.Set("fullName", fullName)
		c.Next()
	}
}
