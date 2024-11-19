package middlewares

import (
	"bytes"
	"fmt"
	"io"
	"net/http"
	"runtime"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/sirupsen/logrus"
)

type LoggingMiddleware gin.HandlerFunc

// NewLoggingMiddleware logs request, response, and error details.
func NewLoggingMiddleware(logger *logrus.Logger) LoggingMiddleware {
	return func(c *gin.Context) {
		// Record the start time
		startTime := time.Now()

		defer func() {
			if r := recover(); r != nil {
				// Log panic details
				logPanicDetails(c, r, logger)

				// Respond with internal server error
				c.JSON(http.StatusInternalServerError, gin.H{"error": "Internal server error"})
				c.Abort()
			}
		}()

		// Process the request
		c.Next()

		// Calculate response time
		duration := time.Since(startTime).Milliseconds()

		// Log request and response
		logRequest(logger, c, duration)
	}
}

// logRequest logs the details of the request and response.
func logRequest(logger *logrus.Logger, c *gin.Context, duration int64) {
	statusCode := c.Writer.Status()
	fields := logrus.Fields{
		"method":        c.Request.Method,
		"path":          c.Request.URL.Path,
		"ip":            c.ClientIP(),
		"status_code":   statusCode,
		"response_time": formatDuration(duration),
	}

	// Log errors if present
	if len(c.Errors) > 0 {
		fields["errors"] = c.Errors.String()
		logger.WithFields(fields).Error("Request resulted in an error")
		return
	}

	// Log based on status code
	switch {
	case statusCode >= 500:
		logger.WithFields(fields).Error("Server error occurred")
	case statusCode >= 400:
		logger.WithFields(fields).Warn("Client error occurred")
	default:
		logger.WithFields(fields).Info("Request completed successfully")
	}
}

// formatDuration formats the duration in ms or seconds.
func formatDuration(duration int64) string {
	if duration < 1000 {
		return fmt.Sprintf("%dms", duration)
	}
	return fmt.Sprintf("%.2fs", float64(duration)/1000)
}

// logPanicDetails logs all context and panic details including stack trace and headers.
func logPanicDetails(c *gin.Context, recovered interface{}, logger *logrus.Logger) {
	// Collect the stack trace
	stackTrace := make([]byte, 2048)
	stackSize := runtime.Stack(stackTrace, false)

	// Read the body of the request
	var requestBody string
	if c.Request.Body != nil {
		bodyBytes, _ := io.ReadAll(c.Request.Body)
		requestBody = string(bodyBytes)
		c.Request.Body = io.NopCloser(bytes.NewBuffer(bodyBytes)) // Reset the body for further use
	}

	// Log detailed panic information
	logger.WithFields(logrus.Fields{
		"method":        c.Request.Method,
		"path":          c.Request.URL.Path,
		"ip":            c.ClientIP(),
		"headers":       c.Request.Header,
		"body":          requestBody,
		"recovered":     fmt.Sprintf("%v", recovered),
		"stack_trace":   string(stackTrace[:stackSize]),
		"status_code":   http.StatusInternalServerError,
		"response_time": fmt.Sprintf("%dms", time.Since(time.Now()).Milliseconds()),
	}).Error("Panic recovered")
}
