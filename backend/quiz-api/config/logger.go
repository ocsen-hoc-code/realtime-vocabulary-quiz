package config

import (
	"log"
	"net"
	"os"

	"github.com/joho/godotenv"
	"github.com/sirupsen/logrus"
)

func NewLogger() *logrus.Logger {
	err := godotenv.Load()
	if err != nil {
		log.Fatalf("Error loading .env file")
	}
	logger := logrus.New()
	logger.SetFormatter(&logrus.JSONFormatter{})

	logstashHost := os.Getenv("LOGSTASH_HOST")
	if logstashHost == "" {
		logger.Warn("LOGSTASH_HOST environment variable is not set. Defaulting to stdout")
		logger.Out = os.Stdout
		return logger
	}

	conn, err := net.Dial("tcp", logstashHost)
	if err != nil {
		logger.WithError(err).Warn("Failed to connect to Logstash at " + logstashHost + ". Falling back to stdout")
		logger.Out = os.Stdout
	} else {
		logger.Info("Connected to Logstash at " + logstashHost)
		logger.Out = conn
	}

	return logger
}
