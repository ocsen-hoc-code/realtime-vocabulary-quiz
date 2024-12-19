package dto

import "time"

// QuizDTO represents the structure for creating or responding with a quiz
type QuizDTO struct {
	UUID        string                `json:"uuid,omitempty"` // Optional, provided when responding
	Title       string                `json:"title" binding:"required"`
	IsPublished bool                  `json:"is_published"`         // Publish status
	Questions   []QuestionResponseDTO `json:"questions,omitempty"`  // Nested questions
	CreatedAt   time.Time             `json:"created_at,omitempty"` // Timestamp, optional for responses
	UpdatedAt   time.Time             `json:"updated_at,omitempty"` // Timestamp, optional for responses
}

// QuizResponseDTO is used for quiz responses with questions
type QuizResponseDTO struct {
	UUID        string                `json:"uuid"`
	Title       string                `json:"title"`
	IsPublished bool                  `json:"is_published"`
	Questions   []QuestionResponseDTO `json:"questions"`
	CreatedAt   time.Time             `json:"created_at"`
	UpdatedAt   time.Time             `json:"updated_at"`
}

type UserQuizDTO struct {
	UserUUID string `json:"user_uuid"`
	QuizUUID string `json:"quiz_uuid"`
	FullName string `json:"fullname"`
	Score    int    `json:"score"`
}
