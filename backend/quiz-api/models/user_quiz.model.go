package models

import "time"

type UserQuiz struct {
	UserUUID            string    `json:"user_uuid"`
	QuizUUID            string    `json:"quiz_uuid"`
	CurrentQuestionUUID string    `json:"current_question_uuid"`
	Score               int       `json:"score"`
	CreatedAt           time.Time `json:"created_at"`
	UpdatedAt           time.Time `json:"updated_at"`
}
