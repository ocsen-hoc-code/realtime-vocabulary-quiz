package controllers

import (
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
		utils.SendError(c, 500, "Failed to create answer")
		return
	}

	utils.SendCreated(c, answer, "Answer created successfully")
}

// GetAnswersByQuestion retrieves all answers for a question
func (ctrl *AnswerController) GetAnswersByQuestion(c *gin.Context) {
	questionUUID := c.Param("uuid")
	answers, err := ctrl.answerService.GetAnswersByQuestion(questionUUID)
	if err != nil {
		utils.SendError(c, 500, "Failed to retrieve answers")
		return
	}

	utils.SendSuccess(c, answers, "Answers retrieved successfully")
}

// UpdateAnswer updates an existing answer
func (ctrl *AnswerController) UpdateAnswer(c *gin.Context) {
	uuid := c.Param("uuid")
	var answer models.Answer
	if err := c.ShouldBindJSON(&answer); err != nil {
		utils.SendError(c, 400, "Invalid input data")
		return
	}

	if err := ctrl.answerService.UpdateAnswer(uuid, &answer); err != nil {
		utils.SendError(c, 500, "Failed to update answer")
		return
	}

	utils.SendSuccess(c, answer, "Answer updated successfully")
}

// DeleteAnswer deletes an answer by UUID
func (ctrl *AnswerController) DeleteAnswer(c *gin.Context) {
	uuid := c.Param("uuid")
	if err := ctrl.answerService.DeleteAnswer(uuid); err != nil {
		utils.SendError(c, 500, "Failed to delete answer")
		return
	}

	utils.SendSuccess(c, nil, "Answer deleted successfully")
}
