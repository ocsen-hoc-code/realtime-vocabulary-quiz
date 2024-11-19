package containers

import (
	"quiz-api/config"
	"quiz-api/controllers"
	"quiz-api/middlewares"
	"quiz-api/repositories"
	"quiz-api/services"

	"go.uber.org/dig"
)

func BuildContainer() *dig.Container {
	container := dig.New()
	container.Provide(config.InitDB)
	container.Provide(config.NewLogger)

	container.Provide(middlewares.NewLoggingMiddleware)
	container.Provide(middlewares.NewJWTMiddleware)

	container.Provide(repositories.NewUserRepository)
	container.Provide(services.NewUserService)
	container.Provide(controllers.NewUserController)

	return container
}
