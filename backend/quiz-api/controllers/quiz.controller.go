package controllers

import (
	"quiz-api/models"
	"quiz-api/services"
	"quiz-api/utils"

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
		utils.SendError(c, 500, "Failed to create quiz")
		return
	}

	utils.SendCreated(c, quiz, "Quiz created successfully")
}

// GetQuiz retrieves a single quiz by UUID
func (ctrl *QuizController) GetQuiz(c *gin.Context) {
	uuid := c.Param("uuid")
	quiz, err := ctrl.quizService.GetQuizByUUID(uuid)
	if err != nil {
		utils.SendError(c, 404, "Quiz not found")
		return
	}

	utils.SendSuccess(c, quiz, "Quiz retrieved successfully")
}

// GetQuizzes retrieves all quizzes
func (ctrl *QuizController) GetQuizzes(c *gin.Context) {
	quizzes, err := ctrl.quizService.GetAllQuizzes()
	if err != nil {
		utils.SendError(c, 500, "Failed to retrieve quizzes")
		return
	}

	utils.SendSuccess(c, quizzes, "Quizzes retrieved successfully")
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
		utils.SendError(c, 500, "Failed to update quiz")
		return
	}

	utils.SendSuccess(c, quiz, "Quiz updated successfully")
}

// DeleteQuiz deletes a quiz by UUID
func (ctrl *QuizController) DeleteQuiz(c *gin.Context) {
	uuid := c.Param("uuid")
	if err := ctrl.quizService.DeleteQuiz(uuid); err != nil {
		utils.SendError(c, 500, "Failed to delete quiz")
		return
	}

	utils.SendSuccess(c, nil, "Quiz deleted successfully")
}
