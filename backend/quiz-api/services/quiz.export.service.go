package services

import (
	"crypto/md5"
	"encoding/hex"
	"encoding/json"
	"fmt"
	"os"
	"path/filepath"
	"sort"
	"strings"

	"quiz-api/repositories"
)

type QuizExportService struct {
	quizRepo   *repositories.QuizRepository
	scyllaRepo *repositories.ScyllaDBRepository
}

func NewQuizExportService(quizRepo *repositories.QuizRepository, scyllaRepo *repositories.ScyllaDBRepository) *QuizExportService {
	return &QuizExportService{
		quizRepo:   quizRepo,
		scyllaRepo: scyllaRepo,
	}
}

func (s *QuizExportService) ExportQuiz(quizUUID string, socketId string) (error, string) {
	quiz, err := s.quizRepo.GetQuizByUUID(quizUUID)
	if err != nil {
		return fmt.Errorf("failed to fetch quiz: %v", err), ""
	}

	quizDir := filepath.Join("./static", quiz.UUID)
	if err := os.MkdirAll(quizDir, os.ModePerm); err != nil {
		return fmt.Errorf("failed to create quiz directory: %v", err), quiz.Title
	}

	questionsDir := filepath.Join(quizDir, "questions")
	if err := os.MkdirAll(questionsDir, os.ModePerm); err != nil {
		return fmt.Errorf("failed to create questions directory: %v", err), quiz.Title
	}

	totalTime := 0
	var firstQuestionUUID string

	sort.SliceStable(quiz.Questions, func(i, j int) bool {
		return quiz.Questions[i].Position < quiz.Questions[j].Position
	})

	for i, question := range quiz.Questions {
		totalTime += question.TimeLimit

		if question.Position == 1 {
			firstQuestionUUID = question.UUID
		}

		questionFilePath := filepath.Join(questionsDir, question.UUID+".json")
		answers := make([]struct {
			UUID        string `json:"uuid"`
			Description string `json:"description"`
		}, len(question.Answers))
		correctAnswerUUIDs := []string{}

		for j, answer := range question.Answers {
			answers[j] = struct {
				UUID        string `json:"uuid"`
				Description string `json:"description"`
			}{
				UUID:        answer.UUID,
				Description: answer.Description,
			}

			if answer.IsCorrect {
				correctAnswerUUIDs = append(correctAnswerUUIDs, answer.UUID)
			}
		}

		sort.Strings(correctAnswerUUIDs)
		correctAnswersString := strings.Join(correctAnswerUUIDs, ",")

		hash := md5.Sum([]byte(correctAnswersString))
		answerHash := hex.EncodeToString(hash[:])

		var nextQuestionUUID interface{}
		var prevQuestionUUID interface{}

		if i+1 < len(quiz.Questions) {
			nextQuestionUUID = quiz.Questions[i+1].UUID
		} else {
			nextQuestionUUID = nil
		}

		if i-1 >= 0 {
			prevQuestionUUID = quiz.Questions[i-1].UUID
		} else {
			prevQuestionUUID = nil
		}
		uuidStr, ok := nextQuestionUUID.(string)
		if !ok {
			uuidStr = ""
		}

		questionData := struct {
			UUID             string      `json:"uuid"`
			Description      string      `json:"description"`
			Position         int         `json:"position"`
			Type             int         `json:"type"`
			TimeLimit        int         `json:"time_limit"`
			Answers          interface{} `json:"answers"`
			NextQuestionUUID string      `json:"next_question_uuid,omitempty"`
		}{
			UUID:             question.UUID,
			Description:      question.Description,
			Position:         question.Position,
			Type:             question.Type,
			TimeLimit:        question.TimeLimit,
			Answers:          answers,
			NextQuestionUUID: uuidStr,
		}

		data, err := json.MarshalIndent(questionData, "", "  ")
		if err != nil {
			return fmt.Errorf("failed to marshal question data: %v", err), quiz.Title
		}

		if err := os.WriteFile(questionFilePath, data, 0644); err != nil {
			return fmt.Errorf("failed to write question file: %v", err), quiz.Title
		}

		columns := []string{"quiz_uuid", "question_uuid", "prev_question_uuid", "next_question_uuid", "answer_hash"}

		questionRecord := map[string]interface{}{
			"quiz_uuid":          quiz.UUID,
			"question_uuid":      question.UUID,
			"prev_question_uuid": prevQuestionUUID,
			"next_question_uuid": nextQuestionUUID,
			"answer_hash":        answerHash,
		}

		if err := s.scyllaRepo.InsertRecord("questions", questionRecord, columns); err != nil {
			return fmt.Errorf("failed to insert question into ScyllaDB: %v", err), quiz.Title
		}
	}

	quizFilePath := filepath.Join(quizDir, "quiz.json")
	quizData := struct {
		UUID         string `json:"uuid"`
		Title        string `json:"title"`
		IsPublished  bool   `json:"is_published"`
		TotalTime    int    `json:"total_time"`
		QuestionUUID string `json:"question_uuid"`
		CreatedAt    string `json:"created_at"`
		UpdatedAt    string `json:"updated_at"`
	}{
		UUID:         quiz.UUID,
		Title:        quiz.Title,
		IsPublished:  quiz.IsPublished,
		TotalTime:    totalTime,
		QuestionUUID: firstQuestionUUID,
		CreatedAt:    quiz.CreatedAt.String(),
		UpdatedAt:    quiz.UpdatedAt.String(),
	}

	data, err := json.MarshalIndent(quizData, "", "  ")
	if err != nil {
		return fmt.Errorf("failed to marshal quiz data: %v", err), quiz.Title
	}

	if err := os.WriteFile(quizFilePath, data, 0644); err != nil {
		return fmt.Errorf("failed to write quiz.json: %v", err), quiz.Title
	}

	quizRecord := map[string]interface{}{
		"quiz_uuid":     quiz.UUID,
		"question_uuid": firstQuestionUUID,
		"total_time":    totalTime,
	}

	quizColumns := []string{"quiz_uuid", "question_uuid", "total_time"}

	if err := s.scyllaRepo.InsertRecord("quizs", quizRecord, quizColumns); err != nil {
		return fmt.Errorf("failed to insert quiz into ScyllaDB: %v", err), quiz.Title
	}

	return nil, quiz.Title
}

func (s *QuizExportService) RevokeQuiz(quizUUID string, socketId string) (string, error) {
	quizDir := filepath.Join("./static", quizUUID)
	quizFile := filepath.Join(quizDir, "quiz.json")

	if _, err := os.Stat(quizDir); os.IsNotExist(err) {
		return "", fmt.Errorf("quiz folder does not exist: %v", err)
	}

	if _, err := os.Stat(quizFile); os.IsNotExist(err) {
		return "", fmt.Errorf("quiz file does not exist: %v", err)
	}

	file, err := os.Open(quizFile)
	if err != nil {
		return "", fmt.Errorf("failed to open quiz file: %v", err)
	}
	defer file.Close()

	type Quiz struct {
		Title string `json:"title"`
	}

	var quiz Quiz
	if err := json.NewDecoder(file).Decode(&quiz); err != nil {
		return "", fmt.Errorf("failed to decode quiz file: %v", err)
	}

	if err := os.RemoveAll(quizDir); err != nil {
		return "", fmt.Errorf("failed to remove quiz folder: %v", err)
	}

	conditions := map[string]interface{}{
		"quiz_uuid": quizUUID,
	}

	if err := s.scyllaRepo.DeleteRecord("quizs", conditions); err != nil {
		return "", fmt.Errorf("failed to delete quiz from ScyllaDB: %v", err)
	}

	if err := s.scyllaRepo.DeleteRecord("questions", conditions); err != nil {
		return "", fmt.Errorf("failed to delete questions from ScyllaDB: %v", err)
	}

	return quiz.Title, nil
}
