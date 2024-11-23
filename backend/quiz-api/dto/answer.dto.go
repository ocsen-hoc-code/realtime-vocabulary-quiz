package dto

import "time"

// AnswerDTO represents the structure for creating or updating an answer
type AnswerDTO struct {
	UUID         string    `json:"uuid,omitempty"` // Optional, provided when responding
	Description  string    `json:"description" binding:"required"`
	IsCorrect    bool      `json:"is_correct"`              // Indicates if the answer is correct
	QuestionUUID string    `json:"question_uuid,omitempty"` // Optional, included in responses
	CreatedAt    time.Time `json:"created_at,omitempty"`    // Timestamp, optional for responses
	UpdatedAt    time.Time `json:"updated_at,omitempty"`    // Timestamp, optional for responses
}

// AnswerResponseDTO is used for answer responses
type AnswerResponseDTO struct {
	UUID        string    `json:"uuid"`
	Description string    `json:"description"`
	IsCorrect   bool      `json:"is_correct"`
	CreatedAt   time.Time `json:"created_at"`
	UpdatedAt   time.Time `json:"updated_at"`
}
