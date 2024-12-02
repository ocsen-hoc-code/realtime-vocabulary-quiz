package routes

import (
	"quiz-api/controllers"
	"quiz-api/middlewares"

	"github.com/gin-gonic/gin"
	"go.uber.org/dig"
)

func UserRoutes(router *gin.Engine, container *dig.Container) error {
	err := container.Invoke(func(userController *controllers.UserController, quizController *controllers.QuizController, jwtMiddleware middlewares.JWTMiddleware, loggingMiddleware middlewares.LoggingMiddleware) {
		router.POST("/register", userController.Register)
		router.POST("/login", userController.Login)
		router.POST("/change-password", gin.HandlerFunc(jwtMiddleware), userController.ChangePassword)
		router.GET("/logout", gin.HandlerFunc(jwtMiddleware), userController.Logout)
		// router.GET("/quiz-test", quizController.GetQuizzes)
	})

	return err
}
