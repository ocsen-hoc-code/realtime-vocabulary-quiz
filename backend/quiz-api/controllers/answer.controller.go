package controllers

import (
	"fmt"

	"quiz-api/models"
	"quiz-api/services"
	"quiz-api/utils"

	"github.com/gin-gonic/gin"
)

// AnswerController handles answer-related endpoints
type AnswerController struct {
	answerService *services.AnswerService
}

// NewAnswerController initializes a new AnswerController
func NewAnswerController(answerService *services.AnswerService) *AnswerController {
	return &AnswerController{answerService: answerService}
}

// CreateAnswer creates a new answer
func (ctrl *AnswerController) CreateAnswer(c *gin.Context) {
	var answer models.Answer
	if err := c.ShouldBindJSON(&answer); err != nil {
		utils.SendError(c, 400, "Invalid input data")
		return
	}

	if err := ctrl.answerService.CreateAnswer(&answer); err != nil {
		utils.SendError(c, 500, fmt.Sprintf("Failed to create answer: %v", err))
		return
	}

	utils.SendCreated(c, answer, "Answer created successfully")
}

// GetAnswersByQuestion retrieves all answers for a question
func (ctrl *AnswerController) GetAnswersByQuestion(c *gin.Context) {
	questionUUID := c.Param("uuid")
	if questionUUID == "" {
		utils.SendError(c, 400, "Question UUID is required")
		return
	}

	answers, err := ctrl.answerService.GetAnswersByQuestion(questionUUID)
	if err != nil {
		utils.SendError(c, 500, fmt.Sprintf("Failed to retrieve answers: %v", err))
		return
	}

	utils.SendSuccess(c, answers, "Answers retrieved successfully")
}

// UpdateAnswer updates an existing answer
func (ctrl *AnswerController) UpdateAnswer(c *gin.Context) {
	uuid := c.Param("uuid")
	if uuid == "" {
		utils.SendError(c, 400, "Answer UUID is required")
		return
	}

	var answer models.Answer
	if err := c.ShouldBindJSON(&answer); err != nil {
		utils.SendError(c, 400, "Invalid input data")
		return
	}

	if err := ctrl.answerService.UpdateAnswer(uuid, &answer); err != nil {
		utils.SendError(c, 500, fmt.Sprintf("Failed to update answer: %v", err))
		return
	}

	utils.SendSuccess(c, answer, "Answer updated successfully")
}

// DeleteAnswer deletes an answer by UUID
func (ctrl *AnswerController) DeleteAnswer(c *gin.Context) {
	uuid := c.Param("uuid")
	if uuid == "" {
		utils.SendError(c, 400, "Answer UUID is required")
		return
	}

	if err := ctrl.answerService.DeleteAnswer(uuid); err != nil {
		utils.SendError(c, 500, fmt.Sprintf("Failed to delete answer: %v", err))
		return
	}

	utils.SendSuccess(c, nil, "Answer deleted successfully")
}
