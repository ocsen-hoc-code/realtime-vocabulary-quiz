package routes

import (
	"quiz-api/controllers"
	"quiz-api/middlewares"

	"github.com/gin-gonic/gin"
	"go.uber.org/dig"
)

// RegisterQuizRoutes sets up routes for managing quizzes
func QuizRoutes(router *gin.Engine, container *dig.Container) error {
	err := container.Invoke(func(quizController *controllers.QuizController, adminMiddleware middlewares.AdminMiddleware, loggingMiddleware middlewares.LoggingMiddleware) {

		quizGroup := router.Group("/quizzes")
		{
			quizGroup.Use(gin.HandlerFunc(adminMiddleware))
			quizGroup.POST("/", quizController.CreateQuiz)
			quizGroup.GET("/", quizController.GetQuizzes)
			quizGroup.GET("/:uuid", quizController.GetQuiz)
			quizGroup.PUT("/:uuid", quizController.UpdateQuiz)
			quizGroup.DELETE("/:uuid", quizController.DeleteQuiz)
		}
	})

	return err
}
