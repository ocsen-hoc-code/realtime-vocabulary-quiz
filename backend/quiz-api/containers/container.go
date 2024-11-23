package containers

import (
	"log"
	"quiz-api/config"
	"quiz-api/controllers"
	"quiz-api/middlewares"
	"quiz-api/registry"
	"quiz-api/repositories"
	"quiz-api/services"

	"go.uber.org/dig"
)

func BuildContainer() *dig.Container {
	container := dig.New()
	container.Provide(config.InitDB)
	container.Provide(config.NewLogger)

	container.Provide(registry.RegisterTopics)
	container.Provide(func(cfg services.KafkaConfig) *services.KafkaService {
		return services.NewKafkaService(cfg)
	})

	container.Provide(middlewares.NewLoggingMiddleware)
	container.Provide(middlewares.NewJWTMiddleware)

	container.Provide(repositories.NewUserRepository)
	container.Provide(services.NewUserService)
	container.Provide(controllers.NewUserController)

	return container
}

func RunKafkaConsumer(container *dig.Container) {
	err := container.Invoke(func(kafkaService *services.KafkaService, cfg services.KafkaConfig) {
		defer kafkaService.Close()
		_ = kafkaService.PublishMessage("quiz_export", "test-key", "test-value")
		go kafkaService.StartConsumer(cfg.Topics)
		select {}
	})

	if err != nil {
		log.Fatalf("Failed to start application: %v", err)
	}
}
