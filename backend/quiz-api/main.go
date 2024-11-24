package main

import (
	"quiz-api/containers"
	"quiz-api/routes"

	"github.com/gin-gonic/gin"
)

func main() {
	container := containers.BuildContainer()

	router := gin.Default()

	err := routes.RegisterRoutes(router, container)
	go containers.RunKafkaConsumer(container)

	if err != nil {
		panic(err)
	}

	router.Run(":8080")
}
