package routes

import (
	"quiz-api/middlewares"

	"github.com/gin-gonic/gin"
	"go.uber.org/dig"
)

func RegisterRoutes(router *gin.Engine, container *dig.Container) error {
	if err := container.Invoke(func(loggingMiddleware middlewares.LoggingMiddleware) {
		router.Use(gin.HandlerFunc(loggingMiddleware))
	}); err != nil {
		return err
	}

	if err := UserRoutes(router, container); err != nil {
		return err
	}
	if err := QuizRoutes(router, container); err != nil {
		return err
	}
	if err := QuestionRoutes(router, container); err != nil {
		return err
	}
	if err := AnswerRoutes(router, container); err != nil {
		return err
	}
	return nil
}
