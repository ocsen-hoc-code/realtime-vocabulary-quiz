package routes

import (
	"quiz-api/controllers"
	"quiz-api/middlewares"

	"github.com/gin-gonic/gin"
	"go.uber.org/dig"
)

func UserRoute(router *gin.Engine, container *dig.Container) error {
	err := container.Invoke(func(userController *controllers.UserController, jwtMiddleware middlewares.JWTMiddleware, loggingMiddleware middlewares.LoggingMiddleware) {
		router.POST("/register", userController.Register)
		router.POST("/login", userController.Login)
		router.POST("/change-password", gin.HandlerFunc(jwtMiddleware), userController.ChangePassword)
	})

	return err
}
