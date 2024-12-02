package main

import (
	"quiz-api/containers"
	"quiz-api/routes"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
)

func main() {
	container := containers.BuildContainer()

	router := gin.Default()

	router.Static("/static", "./static")

	router.Use(cors.New(cors.Config{
		AllowOrigins: []string{"*"},
		AllowMethods: []string{"GET", "POST", "PUT", "DELETE", "OPTIONS"},
		AllowHeaders: []string{"Origin", "Content-Type", "Authorization"},
	}))

	err := routes.RegisterRoutes(router, container)
	go containers.RunKafkaConsumer(container)

	if err != nil {
		panic(err)
	}

	router.Run(":8080")
}
