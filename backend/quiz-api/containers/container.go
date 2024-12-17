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
	container.Provide(config.NewScyllaConfig)
	container.Provide(config.NewScyllaDB)
	container.Provide(config.NewRedisClient)

	container.Provide(middlewares.NewLoggingMiddleware)
	container.Provide(middlewares.NewAdminMiddleware)
	container.Provide(middlewares.NewJWTMiddleware)

	container.Provide(repositories.NewScyllaDBRepository)

	container.Provide(repositories.NewUserRepository)
	container.Provide(services.NewUserService)
	container.Provide(controllers.NewUserController)

	container.Provide(repositories.NewQuizRepository)
	container.Provide(services.NewQuizService)
	container.Provide(controllers.NewQuizController)

	container.Provide(repositories.NewQuestionRepository)
	container.Provide(services.NewQuestionService)
	container.Provide(controllers.NewQuestionController)

	container.Provide(repositories.NewAnswerRepository)
	container.Provide(services.NewAnswerService)
	container.Provide(controllers.NewAnswerController)

	container.Provide(services.NewQuizExportService)

	container.Provide(registry.RegisterTopics)
	container.Provide(func(cfg services.KafkaConfig) *services.KafkaService {
		return services.NewKafkaService(cfg, 10)
	})

	return container
}

func RunKafkaConsumer(container *dig.Container) {
	err := container.Invoke(func(kafkaService *services.KafkaService, cfg services.KafkaConfig) {
		defer kafkaService.Close()
		// _ = kafkaService.PublishMessage("quiz_export", "test-key", "test-value")
		go kafkaService.StartConsumer(cfg.Topics)
		select {}
	})

	if err != nil {
		log.Fatalf("Failed to start application: %v", err)
	}
}
