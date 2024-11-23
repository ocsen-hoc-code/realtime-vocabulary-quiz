package middlewares

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/golang-jwt/jwt/v5"
)

type AdminMiddleware gin.HandlerFunc

// AdminMiddleware checks if the user is an admin based on the JWT token
func NewAdminMiddleware() AdminMiddleware {
	return func(c *gin.Context) {
		// Retrieve the token claims from the context (set by JWT middleware)
		claims, exists := c.Get("claims")
		if !exists {
			c.JSON(http.StatusForbidden, gin.H{"error": "Unauthorized"})
			c.Abort()
			return
		}

		// Assert the type of claims
		jwtClaims, ok := claims.(jwt.MapClaims)
		if !ok {
			c.JSON(http.StatusForbidden, gin.H{"error": "Invalid token claims"})
			c.Abort()
			return
		}

		// Check the isAdmin field
		isAdmin, ok := jwtClaims["isAdmin"].(bool)
		if !ok || !isAdmin {
			c.JSON(http.StatusForbidden, gin.H{"error": "Admin access required"})
			c.Abort()
			return
		}

		// User is an admin; proceed with the request
		c.Next()
	}
}
