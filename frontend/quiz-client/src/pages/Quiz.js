import React, { useEffect, useState, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { logout } from "../services/authService";
import { FaArrowLeft, FaSignOutAlt } from "react-icons/fa";
import {
  getQuizzeByUUID,
  getQuizzeLogs,
  getQuizzeStatus,
} from "../services/quizService";
import { getQuestionByUUID } from "../services/questionService";
import Question from "../components/Question";
import { io } from "socket.io-client";

const Quiz = () => {
  const { id } = useParams(); // Extract the quiz ID from the route parameters
  const [quiz, setQuiz] = useState(null); // Store quiz information
  const [currentQuestion, setCurrentQuestion] = useState(null); // Store the current question
  const [correctAnswer, setCorrectAnswer] = useState(null); // Store the correct answer
  const [score, setScore] = useState(0); // Store the user's score
  const [error, setError] = useState(null); // Handle errors
  const [isTestFinished, setIsTestFinished] = useState(false); // Track test completion state
  const [isLoadingQuestion, setIsLoadingQuestion] = useState(false); // Track lazy loading state
  const navigate = useNavigate(); // Navigation hook
  const socketRef = useRef(null); // Reference for WebSocket connection

  // Fetch initial quiz data and score
  useEffect(() => {
    const fetchQuizData = async () => {
      try {
        const quizData = await getQuizzeByUUID(id);
        setQuiz(quizData);

        let currentQuestionUUID;
        let fetchedScore = 0;

        // Try to fetch quiz logs
        try {
          const logResponse = await getQuizzeLogs(id);
          if (logResponse.status === 200) {
            currentQuestionUUID = logResponse.data.current_question_uuid;
            fetchedScore = logResponse.data.score || 0; // Get score from logs
          }
        } catch (logError) {
          // If logs are unavailable, fallback to quiz status
          if (logError.response && logError.response.status === 404) {
            const statusResponse = await getQuizzeStatus(id);
            if (statusResponse.status === 200) {
              currentQuestionUUID =
                statusResponse.data.data.current_question_uuid;
              fetchedScore = statusResponse.data.data.score || 0; // Get score from status
            } else {
              throw new Error("Unable to fetch quiz status.");
            }
          } else {
            throw new Error("Failed to fetch quiz logs.");
          }
        }

        if (
          !currentQuestionUUID ||
          currentQuestionUUID === "00000000-0000-0000-0000-000000000000"
        ) {
          setIsTestFinished(true);
          setScore(fetchedScore); // Update score
          return;
        }

        // Fetch the current question
        const question = await getQuestionByUUID(id, currentQuestionUUID);
        setCurrentQuestion(question);
        setScore(fetchedScore); // Update score
      } catch (err) {
        console.error("❌ Error fetching quiz data:", err.message);
        setError("Failed to load quiz data. Please try again later.");
      }
    };

    fetchQuizData();
  }, [id]);

  // Setup WebSocket and handle events
  useEffect(() => {
    if (!socketRef.current) {
      socketRef.current = io("http://127.0.0.1:8082", {
        auth: { token: localStorage.getItem("token") },
        transports: ["websocket", "polling"],
      });
    }

    const socket = socketRef.current;

    socket.emit("join_quiz", id);

    socket.on("update_result", (data) => {
      console.log("Received update_result:", data);

      // Update score from WebSocket event
      if (data.result && data.result.score !== undefined) {
        setScore(data.result.score);
      }

      // Display correct answer for 2 seconds
      setCorrectAnswer(data.correct_answers);
      setTimeout(async () => {
        setCorrectAnswer(null); // Clear correct answer
        try {
          if (!data.result.current_question_uuid) {
            setIsTestFinished(true);
            setCurrentQuestion(null);
            return;
          }

          const question = await getQuestionByUUID(
            id,
            data.result.current_question_uuid
          );
          setCurrentQuestion(question);
        } catch (fetchError) {
          console.error("❌ Failed to fetch new question:", fetchError.message);
          setError("Failed to load new question.");
        } finally {
          setIsLoadingQuestion(false);
        }
      }, 500); // 2-second delay
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [id]);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const handleBack = () => {
    navigate("/dashboard");
  };

  const handleAnswerSubmit = (answers) => {
    if (!currentQuestion || !socketRef.current) return;

    const sortedAnswers = [...answers].sort();
    const joinedAnswers = sortedAnswers.join(",");
    socketRef.current.emit("update_score", {
      quiz_id: id,
      question_id: currentQuestion.uuid,
      answers: joinedAnswers,
    });
  };

  const handleSubmit = (selectedAnswers) => {
    handleAnswerSubmit(selectedAnswers);
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

      {isTestFinished ? (
        <div
          className="d-flex justify-content-center align-items-center"
          style={{ height: "50vh", textAlign: "center" }}
        >
          <div>
            <h1 className="text-success">Test Finished!</h1>
            <p className="text-muted">Thank you for completing the quiz.</p>
            <h2>Your Score: {score}</h2>
          </div>
        </div>
      ) : isLoadingQuestion ? (
        <div className="text-center">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading next question...</span>
          </div>
          <p className="mt-3 text-muted">Loading next question...</p>
        </div>
      ) : quiz && currentQuestion ? (
        <div className="card shadow-sm p-4">
          <div className="d-flex justify-content-between align-items-center mb-3">
            <h1 className="text-primary mb-0">{quiz.title}</h1>
            <h4 className="mb-0">Score: {score}</h4>
          </div>
          <Question
            question={currentQuestion}
            correctAnswer={correctAnswer} // Pass the correct answer
            onSubmit={handleSubmit}
          />
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
