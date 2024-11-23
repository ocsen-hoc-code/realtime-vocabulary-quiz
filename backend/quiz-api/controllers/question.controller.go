package controllers

import (
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

	utils.SendCreated(c, question, "Question created successfully")
}

// GetQuestionsByQuiz retrieves paginated questions for a quiz
func (ctrl *QuestionController) GetQuestionsByQuiz(c *gin.Context) {
	quizUUID := c.Param("uuid")
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "10"))

	questions, err := ctrl.questionService.GetQuestionsByQuiz(quizUUID, page, limit)
	if err != nil {
		utils.SendError(c, 500, "Failed to retrieve questions")
		return
	}

	utils.SendSuccess(c, questions, "Questions retrieved successfully")
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

	utils.SendSuccess(c, question, "Question updated successfully")
}

// DeleteQuestion deletes a question by UUID
func (ctrl *QuestionController) DeleteQuestion(c *gin.Context) {
	uuid := c.Param("uuid")
	if err := ctrl.questionService.DeleteQuestion(uuid); err != nil {
		utils.SendError(c, 500, "Failed to delete question")
		return
	}

	utils.SendSuccess(c, nil, "Question deleted successfully")
}
