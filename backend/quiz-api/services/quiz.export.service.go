package services

import (
	"encoding/json"
	"fmt"
	"os"
	"path/filepath"

	"quiz-api/repositories"
)

type QuizExportService struct {
	quizRepo *repositories.QuizRepository
}

func NewQuizExportService(quizRepo *repositories.QuizRepository) *QuizExportService {
	return &QuizExportService{
		quizRepo: quizRepo,
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

	quizFilePath := filepath.Join(quizDir, "quiz.json")
	quizData := struct {
		UUID        string `json:"uuid"`
		Title       string `json:"title"`
		IsPublished bool   `json:"is_published"`
		CreatedAt   string `json:"created_at"`
		UpdatedAt   string `json:"updated_at"`
	}{
		UUID:        quiz.UUID,
		Title:       quiz.Title,
		IsPublished: quiz.IsPublished,
		CreatedAt:   quiz.CreatedAt.String(),
		UpdatedAt:   quiz.UpdatedAt.String(),
	}

	data, err := json.MarshalIndent(quizData, "", "  ")
	if err != nil {
		return fmt.Errorf("failed to marshal quiz data: %v", err), quiz.Title
	}
	if err := os.WriteFile(quizFilePath, data, 0644); err != nil {
		return fmt.Errorf("failed to write quiz.json: %v", err), quiz.Title
	}

	questionsDir := filepath.Join(quizDir, "questions")
	if err := os.MkdirAll(questionsDir, os.ModePerm); err != nil {
		return fmt.Errorf("failed to create questions directory: %v", err), quiz.Title
	}

	for _, question := range quiz.Questions {
		questionFilePath := filepath.Join(questionsDir, question.UUID+".json")
		answers := make([]struct {
			UUID        string `json:"uuid"`
			Description string `json:"description"`
		}, len(question.Answers))
		for i, answer := range question.Answers {
			answers[i] = struct {
				UUID        string `json:"uuid"`
				Description string `json:"description"`
			}{
				UUID:        answer.UUID,
				Description: answer.Description,
			}
		}

		questionData := struct {
			UUID        string      `json:"uuid"`
			Description string      `json:"description"`
			Position    int         `json:"position"`
			Type        int         `json:"type"`
			TimeLimit   int         `json:"time_limit"`
			Answers     interface{} `json:"answers"`
		}{
			UUID:        question.UUID,
			Description: question.Description,
			Position:    question.Position,
			Type:        question.Type,
			TimeLimit:   question.TimeLimit,
			Answers:     answers,
		}

		data, err := json.MarshalIndent(questionData, "", "  ")
		if err != nil {
			return fmt.Errorf("failed to marshal question data: %v", err), quiz.Title
		}
		if err := os.WriteFile(questionFilePath, data, 0644); err != nil {
			return fmt.Errorf("failed to write question file: %v", err), quiz.Title
		}
	}

	return nil, quiz.Title
}

func (s *QuizExportService) RevokeQuiz(quizUUID string, socketId string) (string, error) {
	// Path to the quiz folder
	quizDir := filepath.Join("./static", quizUUID)
	quizFile := filepath.Join(quizDir, "quiz.json") // JSON file path

	// Check if the directory exists
	if _, err := os.Stat(quizDir); os.IsNotExist(err) {
		return "", fmt.Errorf("quiz folder does not exist: %v", err)
	}

	// Check if the JSON file exists
	if _, err := os.Stat(quizFile); os.IsNotExist(err) {
		return "", fmt.Errorf("quiz file does not exist: %v", err)
	}

	// Open and read the JSON file
	file, err := os.Open(quizFile)
	if err != nil {
		return "", fmt.Errorf("failed to open quiz file: %v", err)
	}
	defer file.Close()

	// Define struct to decode JSON
	type Quiz struct {
		Title string `json:"title"`
	}

	var quiz Quiz
	if err := json.NewDecoder(file).Decode(&quiz); err != nil {
		return "", fmt.Errorf("failed to decode quiz file: %v", err)
	}

	// Remove the directory and its contents
	if err := os.RemoveAll(quizDir); err != nil {
		return "", fmt.Errorf("failed to remove quiz folder: %v", err)
	}

	// Return the title from the JSON file
	return quiz.Title, nil
}
