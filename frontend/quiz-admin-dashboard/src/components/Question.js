import React, { useState, useCallback } from "react";
import ModalAnswer from "./ModalAnswer";
import ModalQuestion from "./ModalQuestion";
import ConfirmDeleteModal from "./ConfirmDeleteModal";
import Answer from "./Answer";
import { getAnswersByQuestion, createAnswer } from "../services/answerService";
import { deleteQuestion, updateQuestion } from "../services/questionService";

const Question = ({ question, quizUuid, onUpdate, onDelete }) => {
  const [answers, setAnswers] = useState([]); // List of answers
  const [showAnswers, setShowAnswers] = useState(false); // Control for showing/hiding answers
  const [showAnswerModal, setShowAnswerModal] = useState(false); // Control for answer modal
  const [showQuestionModal, setShowQuestionModal] = useState(false); // Control for question edit modal
  const [currentAnswer, setCurrentAnswer] = useState(null); // Current answer being edited/added
  const [showDeleteModal, setShowDeleteModal] = useState(false); // Control for delete confirmation

  // Fetch answers for the question
  const loadAnswers = useCallback(async () => {
    try {
      const response = await getAnswersByQuestion(question.uuid);
      setAnswers(response && Array.isArray(response.data) ? response.data : []); // Ensure response is an array
    } catch (error) {
      console.error("Error loading answers:", error);
    }
  }, [question.uuid]);

  const handleCreateAnswer = async (newAnswer) => {
    try {
      const response = await createAnswer({
        ...newAnswer,
        question_uuid: question.uuid,
      });
      const createdAnswer = response?.data; // Extract the newly created answer
      setAnswers((prev) => (Array.isArray(prev) ? [...prev, createdAnswer] : [createdAnswer]));
    } catch (error) {
      console.error("Error creating answer:", error);
    }
    setShowAnswerModal(false);
  };

  const handleUpdateAnswer = (updatedAnswer) => {
    setAnswers((prev) =>
      Array.isArray(prev)
        ? prev.map((a) => (a.uuid === updatedAnswer.uuid ? updatedAnswer : a))
        : []
    );
  };

  const handleDeleteAnswer = (answerUuid) => {
    setAnswers((prev) =>
      Array.isArray(prev) ? prev.filter((a) => a.uuid !== answerUuid) : []
    );
  };

  const toggleShowAnswers = () => {
    if (!showAnswers) {
      loadAnswers(); // Load answers when expanding
    }
    setShowAnswers((prev) => !prev); // Toggle show/hide state
  };

  const handleDeleteQuestion = async () => {
    try {
      await deleteQuestion(question.uuid); // Call the deleteQuestion API
      onDelete(question.uuid); // Notify parent component to remove the question
    } catch (error) {
      console.error("Error deleting question:", error);
    } finally {
      setShowDeleteModal(false); // Close the delete confirmation modal
    }
  };

  const handleEditQuestion = async (updatedQuestion) => {
    try {
      const response = await updateQuestion(question.uuid, updatedQuestion); // Call the updateQuestion API
      onUpdate(response?.data); // Notify parent component with the updated question
    } catch (error) {
      console.error("Error updating question:", error);
    }
    setShowQuestionModal(false); // Close the modal
  };

  return (
    <div className="card mb-3 shadow-sm">
      <div className="card-body">
        <div className="d-flex justify-content-between align-items-center">
          <div>
            <h5 className="card-title text-primary fw-bold">{question.description}</h5>
            <p className="mb-1">
              <span className="fw-bold">Position:</span> {question.position} |{" "}
              <span className="fw-bold">Type:</span>{" "}
              {question.type === 1
                ? "Single Choice"
                : question.type === 2
                ? "Multiple Choice"
                : "Short Answer"}{" "}
              | <span className="fw-bold">Time Limit:</span> {question.time_limit} seconds |{" "}
              <span className="fw-bold">Score:</span> {question.score || 0}
            </p>
          </div>
          <div>
            <button
              className="btn btn-primary btn-sm me-2"
              onClick={toggleShowAnswers}
            >
              {showAnswers ? "Hide Answers" : "Show Answers"}
            </button>
            {showAnswers && (
              <button
                className="btn btn-success btn-sm me-2"
                onClick={() => {
                  setCurrentAnswer(null);
                  setShowAnswerModal(true);
                }}
              >
                Add Answer
              </button>
            )}
            <button
              className="btn btn-warning btn-sm me-2"
              onClick={() => setShowQuestionModal(true)}
            >
              Edit
            </button>
            <button
              className="btn btn-danger btn-sm"
              onClick={() => setShowDeleteModal(true)}
            >
              Delete
            </button>
          </div>
        </div>

        {/* List of answers */}
        {showAnswers && (
          <div className="mt-3">
            <h6 className="text-secondary">Answers:</h6>
            {answers.length > 0 ? (
              <ul className="list-group">
                {answers.map((answer) => (
                  <Answer
                    key={answer.uuid}
                    answer={answer}
                    questionUuid={question.uuid}
                    onUpdate={handleUpdateAnswer}
                    onDelete={handleDeleteAnswer}
                  />
                ))}
              </ul>
            ) : (
              <p className="text-muted">No answers available.</p>
            )}
          </div>
        )}
      </div>

      {/* Modal for Adding/Editing Answer */}
      {showAnswerModal && (
        <ModalAnswer
          show={showAnswerModal}
          answer={currentAnswer}
          onClose={() => setShowAnswerModal(false)}
          onSave={(answer) =>
            currentAnswer
              ? handleUpdateAnswer(answer)
              : handleCreateAnswer(answer)
          }
        />
      )}

      {/* Modal for Editing Question */}
      {showQuestionModal && (
        <ModalQuestion
          show={showQuestionModal}
          question={question} // Pass the question for editing
          quizUuid={quizUuid} // Pass the quiz ID for linking
          onClose={() => setShowQuestionModal(false)} // Close modal
          onSave={handleEditQuestion} // Save the updated question
        />
      )}

      {/* Confirmation Modal for Deleting Question */}
      {showDeleteModal && (
        <ConfirmDeleteModal
          show={showDeleteModal}
          onClose={() => setShowDeleteModal(false)}
          onConfirm={handleDeleteQuestion}
        />
      )}
    </div>
  );
};

export default Question;
