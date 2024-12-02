import React, { useState, useEffect, useCallback } from "react";
import ModalQuiz from "./ModalQuiz";
import ConfirmDeleteModal from "./ConfirmDeleteModal";
import Question from "./Question"; // Import Question component
import { updateQuiz, quizPublish , quizUnpublish } from "../services/quizService";
import {
  getQuestionsByQuiz,
  createQuestion,
} from "../services/questionService";
import ModalQuestion from "./ModalQuestion";

const Quiz = ({ quiz, onQuizUpdate, onQuizDelete, socketId}) => {
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showQuestionModal, setShowQuestionModal] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(true);
  const [questions, setQuestions] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const itemsPerPage = 5;

  // Fetch questions from the API
  const loadQuestions = useCallback(
    async (page) => {
      try {
        const response = await getQuestionsByQuiz(
          quiz.uuid,
          page,
          itemsPerPage
        );
        const data = response?.data || {};
        setQuestions(data.data || []);
        setTotalPages(data.pagination?.totalPages || 1);
      } catch (error) {
        console.error("Error loading questions:", error);
      }
    },
    [quiz.uuid, itemsPerPage]
  );

  const toggleCollapse = () => {
    setIsCollapsed((prev) => !prev);
    if (isCollapsed) {
      loadQuestions(currentPage);
    }
  };

  const handleUpdate = (updatedQuizData) => {
    onQuizUpdate(updatedQuizData);
    setShowUpdateModal(false);
  };

  const togglePublish = async () => {
    try {
      setIsPublishing(true);
      const updatedQuiz = { ...quiz, is_published: !quiz.is_published };
      await updateQuiz(quiz.uuid, updatedQuiz);
      if (updatedQuiz.is_published) {
        quizPublish(quiz.uuid, socketId);
      } else {
        quizUnpublish(quiz.uuid, socketId);
      }
      onQuizUpdate(updatedQuiz);
    } catch (error) {
      console.error("Error toggling publish status:", error);
    } finally {
      setIsPublishing(false);
    }
  };

  const handleDelete = () => {
    onQuizDelete(quiz.uuid);
    setShowDeleteModal(false);
  };

  const handleAddQuestion = async (newQuestion) => {
    try {
      await createQuestion(newQuestion);
      loadQuestions(currentPage); // Reload questions after adding
    } catch (error) {
      console.error("Error adding question:", error);
    }
    setShowQuestionModal(false);
  };

  useEffect(() => {
    if (!isCollapsed) {
      loadQuestions(currentPage);
    }
  }, [currentPage, isCollapsed, loadQuestions]);

  return (
    <div className="quiz-item card mb-3 shadow-sm">
      <div className="card-body">
        <div className="d-flex justify-content-between align-items-center">
          <div>
            <h5 className="card-title mb-1">{quiz.title}</h5>
            <p className="mb-1">
              Published: {quiz.is_published ? "Yes" : "No"}
            </p>
            <p className="mb-1 text-muted">
              Created: {new Date(quiz.created_at).toLocaleString()}
            </p>
            <p className="mb-1 text-muted">
              Updated: {new Date(quiz.updated_at).toLocaleString()}
            </p>
          </div>
          <div>
            <button
              className="btn btn-primary btn-sm me-2"
              onClick={togglePublish}
              disabled={isPublishing}
            >
              {quiz.is_published ? "Unpublish" : "Publish"}
            </button>

            <button
              className="btn btn-warning btn-sm me-2"
              onClick={() => setShowUpdateModal(true)}
            >
              Edit
            </button>

            <button
              className="btn btn-danger btn-sm me-2"
              onClick={() => setShowDeleteModal(true)}
            >
              Delete
            </button>

            <button className="btn btn-info btn-sm" onClick={toggleCollapse}>
              {isCollapsed ? "View Questions" : "Hide Questions"}
            </button>
          </div>
        </div>

        {!isCollapsed && (
          <div className="mt-3">
            <div className="d-flex justify-content-between align-items-center mb-3">
              <h6>Questions:</h6>
              <button
                className="btn btn-success btn-sm"
                onClick={() => setShowQuestionModal(true)}
              >
                Add Question
              </button>
            </div>
            {questions.length > 0 ? (
              <>
                {questions.map((question) => (
                  <Question
                    key={question.uuid}
                    question={question}
                    quizUuid={quiz.uuid}
                    onUpdate={(updatedQuestion) => {
                      setQuestions((prev) =>
                        prev.map((q) => {
                          if (q.uuid === updatedQuestion.uuid) {
                            return updatedQuestion;
                          }
                          return q;
                        })
                      );
                    }}
                    onDelete={(deletedQuestionUuid) => {
                      setQuestions((prev) =>
                        prev.filter((q) => q.uuid !== deletedQuestionUuid)
                      );
                    }}
                  />
                ))}

                {/* Pagination Controls */}
                <nav className="mt-3">
                  <ul className="pagination justify-content-center">
                    <li
                      className={`page-item ${
                        currentPage === 1 ? "disabled" : ""
                      }`}
                    >
                      <button
                        className="page-link"
                        onClick={() =>
                          setCurrentPage((prev) => Math.max(prev - 1, 1))
                        }
                      >
                        Previous
                      </button>
                    </li>
                    {Array.from({ length: totalPages }, (_, index) => (
                      <li
                        key={index + 1}
                        className={`page-item ${
                          currentPage === index + 1 ? "active" : ""
                        }`}
                      >
                        <button
                          className="page-link"
                          onClick={() => setCurrentPage(index + 1)}
                        >
                          {index + 1}
                        </button>
                      </li>
                    ))}
                    <li
                      className={`page-item ${
                        currentPage === totalPages ? "disabled" : ""
                      }`}
                    >
                      <button
                        className="page-link"
                        onClick={() =>
                          setCurrentPage((prev) =>
                            Math.min(prev + 1, totalPages)
                          )
                        }
                      >
                        Next
                      </button>
                    </li>
                  </ul>
                </nav>
              </>
            ) : (
              <p>No questions available.</p>
            )}
          </div>
        )}
      </div>

      {showUpdateModal && (
        <ModalQuiz
          show={showUpdateModal}
          action="edit"
          quizData={quiz}
          onClose={() => setShowUpdateModal(false)}
          onSave={handleUpdate}
        />
      )}

      {showDeleteModal && (
        <ConfirmDeleteModal
          show={showDeleteModal}
          onClose={() => setShowDeleteModal(false)}
          onConfirm={handleDelete}
        />
      )}

      {showQuestionModal && (
        <ModalQuestion
          show={showQuestionModal}
          question={null}
          quizUuid={quiz.uuid}
          onClose={() => setShowQuestionModal(false)}
          onSave={handleAddQuestion}
        />
      )}
    </div>
  );
};

export default Quiz;
