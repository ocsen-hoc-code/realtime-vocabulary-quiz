package routes

import (
	"quiz-api/controllers"
	"quiz-api/middlewares"

	"github.com/gin-gonic/gin"
	"go.uber.org/dig"
)

// RegisterAnswerRoutes sets up routes for managing answers
func AnswerRoutes(router *gin.Engine, container *dig.Container) error {
	err := container.Invoke(func(answerController *controllers.AnswerController, adminMiddleware middlewares.AdminMiddleware, loggingMiddleware middlewares.LoggingMiddleware) {

		answerGroup := router.Group("/answers")
		{
			answerGroup.Use(gin.HandlerFunc(adminMiddleware))
			answerGroup.POST("/", answerController.CreateAnswer)
			answerGroup.GET("/question/:uuid", answerController.GetAnswersByQuestion)
			answerGroup.PUT("/:uuid", answerController.UpdateAnswer)
			answerGroup.DELETE("/:uuid", answerController.DeleteAnswer)
		}
	})

	return err
}
