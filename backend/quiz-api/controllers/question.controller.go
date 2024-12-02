package controllers

import (
	"fmt"
	"strconv"

	"quiz-api/models"
	"quiz-api/services"
	"quiz-api/utils"

	"github.com/gin-gonic/gin"
)

// QuestionController handles question-related endpoints
type QuestionController struct {
	questionService *services.QuestionService
}

// NewQuestionController initializes a new QuestionController
func NewQuestionController(questionService *services.QuestionService) *QuestionController {
	return &QuestionController{questionService: questionService}
}

// CreateQuestion creates a new question
func (ctrl *QuestionController) CreateQuestion(c *gin.Context) {
	var question models.Question
	if err := c.ShouldBindJSON(&question); err != nil {
		utils.SendError(c, 400, "Invalid input data")
		return
	}

	if err := ctrl.questionService.CreateQuestion(&question); err != nil {
		utils.SendError(c, 500, "Failed to create question")
		return
	}

	utils.SendCreated(c, question)
}

// GetQuestionsByQuiz retrieves paginated questions for a quiz
func (ctrl *QuestionController) GetQuestionsByQuiz(c *gin.Context) {
	quizUUID := c.Param("uuid")
	if quizUUID == "" {
		utils.SendError(c, 400, "Quiz UUID is required")
		return
	}

	// Parse pagination parameters from query
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "10"))
	if page < 1 {
		page = 1
	}
	if limit < 1 || limit > 100 {
		limit = 10
	}

	// Fetch paginated questions and total count
	questions, total, err := ctrl.questionService.GetQuestionsByQuiz(quizUUID, page, limit)
	if err != nil {
		utils.SendError(c, 500, fmt.Sprintf("Failed to retrieve questions: %v", err))
		return
	}

	// Calculate total pages
	totalPages := (int(total) + limit - 1) / limit // Round up for remaining items

	// Create response structure
	response := map[string]interface{}{
		"data": questions,
		"pagination": map[string]interface{}{
			"currentPage": page,
			"pageSize":    limit,
			"totalItems":  total,
			"totalPages":  totalPages,
		},
	}

	// Send response
	utils.SendSuccess(c, response)
}

// UpdateQuestion updates an existing question
func (ctrl *QuestionController) UpdateQuestion(c *gin.Context) {
	uuid := c.Param("uuid")
	var question models.Question
	if err := c.ShouldBindJSON(&question); err != nil {
		utils.SendError(c, 400, "Invalid input data")
		return
	}

	if err := ctrl.questionService.UpdateQuestion(uuid, &question); err != nil {
		utils.SendError(c, 500, "Failed to update question")
		return
	}

	utils.SendSuccess(c, question)
}

// DeleteQuestion deletes a question by UUID
func (ctrl *QuestionController) DeleteQuestion(c *gin.Context) {
	uuid := c.Param("uuid")
	if err := ctrl.questionService.DeleteQuestion(uuid); err != nil {
		utils.SendError(c, 500, "Failed to delete question")
		return
	}

	utils.SendSuccess(c, nil)
}
