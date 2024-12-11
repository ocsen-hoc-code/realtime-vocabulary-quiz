package main

import (
	"net/http"
	"quiz-api/containers"
	"quiz-api/routes"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
)

func main() {
	container := containers.BuildContainer()

	router := gin.Default()

	router.Use(cors.New(cors.Config{
		AllowOrigins: []string{"*"},
		AllowMethods: []string{"GET", "POST", "PUT", "DELETE", "OPTIONS"},
		AllowHeaders: []string{"Origin", "Content-Type", "Authorization"},
	}))

	staticHandler := http.FileServer(http.Dir("./static"))
	router.GET("/static/*filepath", func(c *gin.Context) {
		http.StripPrefix("/static", staticHandler).ServeHTTP(c.Writer, c.Request)
	})

	err := routes.RegisterRoutes(router, container)
	go containers.RunKafkaConsumer(container)

	if err != nil {
		panic(err)
	}

	router.Run(":8080")
}
