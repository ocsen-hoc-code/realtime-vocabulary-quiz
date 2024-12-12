import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { logout } from "../services/authService";
import { FaArrowLeft, FaSignOutAlt } from "react-icons/fa";
import { getQuizzeByUUID } from "../services/quizService";
import { getQuestionByUUID } from "../services/questionService";
import Question from "../components/Question";

const Quiz = () => {
  const { id } = useParams();
  const [quiz, setQuiz] = useState(null);
  const [currentQuestion, setCurrentQuestion] = useState(null);
  const [currentQuestionUUID, setCurrentQuestionUUID] = useState(null);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchQuiz = async () => {
      try {
        const quiz = await getQuizzeByUUID(id);
        if (quiz) {
          setQuiz(quiz);
          setCurrentQuestionUUID(quiz.question_uuid);
        } else {
          setError("Quiz not found.");
        }
      } catch (err) {
        setError("Failed to load quiz.");
      }
    };
    fetchQuiz();
  }, [id]);

  useEffect(() => {
    const fetchQuestion = async () => {
      try {
        if (currentQuestionUUID) {
          const question = await getQuestionByUUID(quiz.uuid ,currentQuestionUUID);
          setCurrentQuestion(question);
        }
      } catch (err) {
        setError("Failed to load question.");
      }
    };
    fetchQuestion();
  }, [currentQuestionUUID]);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const handleBack = () => {
    navigate("/dashboard");
  };

  const handleSubmit = (selectedAnswers) => {
    console.log("Selected Answers:", selectedAnswers);
    // Logic to go to next question (this could be extended)
  };

  return (
    <div className="container mt-5">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <button className="btn btn-primary text-white" onClick={handleBack}>
          <FaArrowLeft className="me-2" /> Back
        </button>
        <button className="btn btn-danger" onClick={handleLogout}>
          <FaSignOutAlt className="me-2" /> Logout
        </button>
      </div>

      {quiz && currentQuestion ? (
        <div className="card shadow-sm p-4">
          <div className="d-flex justify-content-between align-items-center mb-3">
            <h1 className="text-primary mb-0">{quiz.title}</h1>
          </div>
          <Question question={currentQuestion} onSubmit={handleSubmit} />
        </div>
      ) : error ? (
        <div className="alert alert-danger text-center">{error}</div>
      ) : (
        <div className="text-center">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
          <p className="mt-3 text-muted">Loading...</p>
        </div>
      )}
    </div>
  );
};

export default Quiz;
