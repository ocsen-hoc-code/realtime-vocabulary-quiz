package main

import (
	"quiz-api/containers"
	"quiz-api/routes"
	"time"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
)

func main() {
	container := containers.BuildContainer()

	router := gin.Default()

	router.Use(cors.New(cors.Config{
		AllowOrigins:     []string{"*"},
		AllowMethods:     []string{"GET", "POST", "PUT", "DELETE", "OPTIONS"},
		AllowHeaders:     []string{"Origin", "Content-Type", "Authorization"},
		ExposeHeaders:    []string{"Content-Length"},
		AllowCredentials: true,
		MaxAge:           12 * time.Hour,
	}))

	err := routes.RegisterRoutes(router, container)
	go containers.RunKafkaConsumer(container)

	if err != nil {
		panic(err)
	}

	router.Run(":8080")
}
