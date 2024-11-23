package dto

import "time"

// QuestionDTO represents the structure for creating or updating a question
type QuestionDTO struct {
	UUID        string              `json:"uuid,omitempty"` // Optional, provided when responding
	Description string              `json:"description" binding:"required"`
	Position    int                 `json:"position"`             // Position of the question in the quiz
	Answers     []AnswerResponseDTO `json:"answers,omitempty"`    // Nested answers
	QuizUUID    string              `json:"quiz_uuid,omitempty"`  // Optional, included in responses
	CreatedAt   time.Time           `json:"created_at,omitempty"` // Timestamp, optional for responses
	UpdatedAt   time.Time           `json:"updated_at,omitempty"` // Timestamp, optional for responses
}

// QuestionResponseDTO is used for question responses
type QuestionResponseDTO struct {
	UUID        string              `json:"uuid"`
	Description string              `json:"description"`
	Position    int                 `json:"position"`
	Answers     []AnswerResponseDTO `json:"answers,omitempty"`
	CreatedAt   time.Time           `json:"created_at"`
	UpdatedAt   time.Time           `json:"updated_at"`
}
