package routes

import (
	"quiz-api/controllers"
	"quiz-api/middlewares"

	"github.com/gin-gonic/gin"
	"go.uber.org/dig"
)

// RegisterQuizRoutes sets up routes for managing quizzes
func QuizRoutes(router *gin.Engine, container *dig.Container) error {
	err := container.Invoke(func(quizController *controllers.QuizController, jwtMiddleware middlewares.JWTMiddleware, adminMiddleware middlewares.AdminMiddleware, loggingMiddleware middlewares.LoggingMiddleware) {

		router.GET("quizzes/", gin.HandlerFunc(jwtMiddleware), quizController.GetQuizzes)
		router.GET("quiz-status/:quiz-uuid", gin.HandlerFunc(jwtMiddleware), gin.HandlerFunc(adminMiddleware), quizController.GetQuizStatus)
		quizGroup := router.Group("/quizzes")
		{
			quizGroup.Use(gin.HandlerFunc(adminMiddleware))
			quizGroup.POST("/", quizController.CreateQuiz)
			quizGroup.GET("/:uuid", quizController.GetQuiz)
			quizGroup.PUT("/:uuid", quizController.UpdateQuiz)
			quizGroup.DELETE("/:uuid", quizController.DeleteQuiz)
			quizGroup.GET("/quiz-export/:uuid", quizController.QuizExport)
			quizGroup.GET("/revoke-quiz/:uuid", quizController.RevokeQuiz)
		}
	})

	return err
}
