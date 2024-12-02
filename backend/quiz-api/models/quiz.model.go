package models

import (
	"time"
)

// Quiz represents a quiz with a title and associated questions
type Quiz struct {
	UUID        string     `gorm:"type:uuid;primary_key;" json:"uuid"`
	Title       string     `json:"title"`
	IsPublished bool       `gorm:"default:false" json:"is_published"` // Indicates if the quiz is published
	Questions   []Question `gorm:"foreignKey:QuizUUID;constraint:OnDelete:CASCADE;" json:"questions,omitempty"`
	CreatedAt   time.Time  `json:"created_at"`
	UpdatedAt   time.Time  `json:"updated_at"`
}

// Question represents a question in a quiz
type Question struct {
	UUID        string    `gorm:"type:uuid;primary_key;" json:"uuid"`
	QuizUUID    string    `gorm:"type:uuid;" json:"quiz_uuid"`
	Description string    `json:"description"`
	Position    int       `json:"position"`
	Type        int       `json:"type"`
	TimeLimit   int       `json:"time_limit"`
	Answers     []Answer  `gorm:"foreignKey:QuestionUUID;constraint:OnDelete:CASCADE;" json:"answers,omitempty"`
	CreatedAt   time.Time `json:"created_at"`
	UpdatedAt   time.Time `json:"updated_at"`
}

// Answer represents a possible answer to a question
type Answer struct {
	UUID         string    `gorm:"type:uuid;primary_key;" json:"uuid"`
	QuestionUUID string    `gorm:"type:uuid;" json:"question_uuid"`
	Description  string    `json:"description"`
	IsCorrect    bool      `json:"is_correct"`
	CreatedAt    time.Time `json:"created_at"`
	UpdatedAt    time.Time `json:"updated_at"`
}
