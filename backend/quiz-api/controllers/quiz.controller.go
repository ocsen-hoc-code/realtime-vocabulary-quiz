package controllers

import (
	"fmt"
	"quiz-api/models"
	"quiz-api/services"
	"quiz-api/utils"
	"strconv"

	"github.com/gin-gonic/gin"
)

// QuizController handles quiz-related endpoints
type QuizController struct {
	quizService *services.QuizService
}

// NewQuizController initializes a new QuizController
func NewQuizController(quizService *services.QuizService) *QuizController {
	return &QuizController{quizService: quizService}
}

// CreateQuiz creates a new quiz
func (ctrl *QuizController) CreateQuiz(c *gin.Context) {
	var quiz models.Quiz
	if err := c.ShouldBindJSON(&quiz); err != nil {
		utils.SendError(c, 400, "Invalid input data")
		return
	}

	if err := ctrl.quizService.CreateQuiz(&quiz); err != nil {
		utils.SendError(c, 500, fmt.Sprintf("Failed to create quiz: %v", err))
		return
	}

	utils.SendCreated(c, quiz)
}

// GetQuiz retrieves a single quiz by UUID
func (ctrl *QuizController) GetQuiz(c *gin.Context) {
	uuid := c.Param("uuid")
	if uuid == "" {
		utils.SendError(c, 400, "UUID is required")
		return
	}

	quiz, err := ctrl.quizService.GetQuizByUUID(uuid)
	if err != nil {
		utils.SendError(c, 404, fmt.Sprintf("Quiz with UUID %s not found: %v", uuid, err))
		return
	}

	utils.SendSuccess(c, quiz)
}

// GetQuizzes retrieves all quizzes
func (ctrl *QuizController) GetQuizzes(c *gin.Context) {
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "10"))

	if page < 1 {
		page = 1
	}
	if limit < 1 || limit > 100 {
		limit = 10
	}

	quizzes, total, err := ctrl.quizService.GetQuizzesWithPagination(page, limit)
	if err != nil {
		utils.SendError(c, 500, fmt.Sprintf("Failed to retrieve quizzes: %v", err))
		return
	}

	totalPages := (int(total) + limit - 1) / limit // Fixed type mismatch

	response := map[string]interface{}{
		"data": quizzes,
		"pagination": map[string]interface{}{
			"currentPage": page,
			"pageSize":    limit,
			"totalItems":  total,
			"totalPages":  totalPages,
		},
	}

	utils.SendSuccess(c, response)
}

// UpdateQuiz updates an existing quiz
func (ctrl *QuizController) UpdateQuiz(c *gin.Context) {
	uuid := c.Param("uuid")
	var quiz models.Quiz
	if err := c.ShouldBindJSON(&quiz); err != nil {
		utils.SendError(c, 400, "Invalid input data")
		return
	}

	if err := ctrl.quizService.UpdateQuiz(uuid, &quiz); err != nil {
		utils.SendError(c, 500, fmt.Sprintf("Failed to update quiz with UUID %s: %v", uuid, err))
		return
	}

	utils.SendSuccess(c, quiz)
}

// DeleteQuiz deletes a quiz by UUID
func (ctrl *QuizController) DeleteQuiz(c *gin.Context) {
	uuid := c.Param("uuid")
	if uuid == "" {
		utils.SendError(c, 400, "UUID is required")
		return
	}

	if err := ctrl.quizService.DeleteQuiz(uuid); err != nil {
		utils.SendError(c, 500, fmt.Sprintf("Failed to delete quiz with UUID %s: %v", uuid, err))
		return
	}

	utils.SendSuccess(c, nil)
}

// QuizExport exports a quiz using Kafka
func (ctrl *QuizController) QuizExport(c *gin.Context) {
	uuid := c.Param("uuid")
	socketID := c.Query("socket_id")

	if uuid == "" || socketID == "" {
		utils.SendError(c, 400, "UUID and socket_id are required")
		return
	}

	if err := ctrl.quizService.QuizExport(uuid, socketID); err != nil {
		utils.SendError(c, 500, fmt.Sprintf("Failed to export quiz with UUID %s: %v", uuid, err))
		return
	}

	utils.SendSuccess(c, nil)
}
