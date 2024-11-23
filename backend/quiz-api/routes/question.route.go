package routes

import (
	"quiz-api/controllers"
	"quiz-api/middlewares"

	"github.com/gin-gonic/gin"
	"go.uber.org/dig"
)

// RegisterQuizRoutes sets up routes for managing quizzes
func QuestionRoutes(router *gin.Engine, container *dig.Container) error {
	err := container.Invoke(func(questionController *controllers.QuestionController, adminMiddleware middlewares.AdminMiddleware, loggingMiddleware middlewares.LoggingMiddleware) {

		questionGroup := router.Group("/questions")
		{
			questionGroup.Use(gin.HandlerFunc(adminMiddleware))
			questionGroup.POST("/", questionController.CreateQuestion)
			questionGroup.GET("/quiz/:uuid", questionController.GetQuestionsByQuiz)
			questionGroup.PUT("/:uuid", questionController.UpdateQuestion)
			questionGroup.DELETE("/:uuid", questionController.DeleteQuestion)
		}
	})

	return err
}
