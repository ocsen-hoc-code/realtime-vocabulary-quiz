import React, { useEffect, useState, useRef, useCallback } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { logout } from "../services/authService";
import { FaArrowLeft, FaSignOutAlt } from "react-icons/fa";
import {
  getQuizzeByUUID,
  getQuizzeLogs,
  getQuizzeStatus,
  getTopScores,
} from "../services/quizService";
import { getQuestionByUUID } from "../services/questionService";
import Question from "../components/Question";
import Leaderboard from "../components/Leaderboard";
import { io } from "socket.io-client";

const Quiz = () => {
  const { id } = useParams();
  const [quiz, setQuiz] = useState(null);
  const [currentQuestion, setCurrentQuestion] = useState(null);
  const [correctAnswer, setCorrectAnswer] = useState(null);
  const [score, setScore] = useState(0);
  const [leaderboard, setLeaderboard] = useState([]);
  const [error, setError] = useState(null);
  const [isTestFinished, setIsTestFinished] = useState(false);
  const [isLoadingQuestion, setIsLoadingQuestion] = useState(false);
  const [fullname, setFullname] = useState(""); // State to store fullname
  const navigate = useNavigate();
  const socketRef = useRef(null);

  useEffect(() => {
    // Get fullname from localStorage when the component mounts
    const storedFullname = localStorage.getItem("fullname") || "Guest User";
    setFullname(storedFullname);
  }, []);

  const fetchLeaderboard = useCallback(async () => {
    try {
      const response = await getTopScores(id);
      if (response.status === 200) {
        setLeaderboard(
          response.data
            .map(({user_uuid, fullname, score, updated_at }) => ({ user_uuid, fullname, score, updated_at }))
        );
        // setLeaderboard(
        //   response.data
        //     .map(({ fullname, score, updated_at }) => ({ username: fullname, score, updated_at }))
        //     .sort((a, b) => b.score - a.score) // Sort by score descending
        // );
      } else {
        console.error("Failed to fetch leaderboard data:", response);
        setLeaderboard([]);
      }
    } catch (err) {
      console.error("Error fetching leaderboard:", err.message);
      setLeaderboard([]);
    }
  }, [id]);

  const updateLeaderboard = (userUUID, fullName, newScore, updatedAt) => {
    setLeaderboard((prevLeaderboard) => {
      const existingUserIndex = prevLeaderboard.findIndex(
        (user) => user.user_uuid === userUUID
      );
      let updatedLeaderboard = [...prevLeaderboard];
  
      if (existingUserIndex !== -1) {
        // Update score if user exists
        updatedLeaderboard[existingUserIndex].score = Math.max(
          updatedLeaderboard[existingUserIndex].score,
          newScore
        );
        updatedLeaderboard[existingUserIndex].updated_at = updatedAt;
      } else {
        // Add new user if not in the leaderboard
        updatedLeaderboard.push({ user_uuid: userUUID, fullname: fullName, score: newScore, updated_at: updatedAt });
      }
  
      updatedLeaderboard.sort((a, b) => {
        if (b.score === a.score) {
          return new Date(b.updated_at) - new Date(a.updated_at); // Sort by updatedAt descending
        }
        return b.score - a.score; // Sort by score descending
      });
  
      // Keep only top 10 entries
      // return updatedLeaderboard.slice(0, 10);
      return updatedLeaderboard;
    });
  };  

  const checkQuizTime = (createdAt, totalTime) => {
    const parsedTime = new Date(createdAt).getTime();
  
    if (isNaN(parsedTime)) {
      console.error("Invalid created_at format:", createdAt);
      return false;
    }
  
    const currentTime = Date.now();
    const endTime = parsedTime + totalTime*1000;
  
    return currentTime <= endTime;
  };

  useEffect(() => {
    const fetchQuizData = async () => {
      try {
        const quizData = await getQuizzeByUUID(id);
        setQuiz(quizData);

        let currentQuestionUUID;
        let fetchedScore = 0;
        let createdAt;
        let totalTime;

        try {
          const logResponse = await getQuizzeLogs(id);
          if (logResponse.status === 200) {
            currentQuestionUUID = logResponse.data.current_question_uuid;
            fetchedScore = logResponse.data.score || 0;
            createdAt = logResponse.data.created_at;
            totalTime = quizData.total_time || 0;
          }
        } catch (logError) {
          if (logError.response && logError.response.status === 404) {
            const statusResponse = await getQuizzeStatus(id);
            if (statusResponse.status === 200) {
              currentQuestionUUID =
                statusResponse.data.data.current_question_uuid;
              fetchedScore = statusResponse.data.data.score || 0;
              createdAt = statusResponse.data.data.created_at;
              totalTime = quizData.total_time || 0;
            } else {
              throw new Error("Unable to fetch quiz status.");
            }
          } else {
            throw new Error("Failed to fetch quiz logs.");
          }
        }
        if (socketRef.current) {
          socketRef.current.emit("user_online", { quiz_id: id });
        }
        const storedFullname = localStorage.getItem("fullname") || "Guest User";
        const storedUserUUID = localStorage.getItem("uuid") || "";
        updateLeaderboard(storedUserUUID, storedFullname, fetchedScore, createdAt);

        if (!checkQuizTime(createdAt, totalTime)) {
          setIsTestFinished(true);
          setScore(fetchedScore);
          await fetchLeaderboard();
          return;
        }

        if (
          !currentQuestionUUID ||
          currentQuestionUUID === "00000000-0000-0000-0000-000000000000"
        ) {
          setIsTestFinished(true);
          setScore(fetchedScore);
          await fetchLeaderboard();
          return;
        }

        const question = await getQuestionByUUID(id, currentQuestionUUID);
        setCurrentQuestion(question);
        setScore(fetchedScore);
      } catch (err) {
        console.error("❌ Error fetching quiz data:", err.message);
        setError("Failed to load quiz data. Please try again later.");
      }
    };

    fetchQuizData();
    fetchLeaderboard();
  }, [id, fetchLeaderboard]);

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
      if (data.result && data.result.score !== undefined) {
        setScore(data.result.score);
        updateLeaderboard(data.result.user_uuid, data.result.fullname, data.result.score, data.result.updated_at);
      }

      setCorrectAnswer(data.correct_answers);
      setTimeout(async () => {
        setCorrectAnswer(null);
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
      }, 300);
    });

    socket.on("update_leaderboard", (data) => {
      updateLeaderboard(data.user_uuid, data.fullname, data.score, data.updated_at);
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
        <div className="d-flex align-items-center">
          <span className="me-3 text-primary fw-bold">{fullname}</span>
          <button className="btn btn-danger" onClick={handleLogout}>
            <FaSignOutAlt className="me-2" /> Logout
          </button>
        </div>
      </div>
      <div className="row">
        <div className="col-md-8 mb-4">
          {isTestFinished ? (
            <div className="card p-4 shadow">
              <h1 className="text-success text-center">Test Finished!</h1>
              <p className="text-muted text-center">
                Thank you for completing the quiz.
              </p>
              <h2 className="text-center">Your Score: {score}</h2>
            </div>
          ) : isLoadingQuestion ? (
            <div className="text-center">
              <div className="spinner-border text-primary" role="status">
                <span className="visually-hidden">Loading next question...</span>
              </div>
              <p className="mt-3 text-muted">Loading next question...</p>
            </div>
          ) : quiz && currentQuestion ? (
            <div className="card p-4 shadow">
              <div className="d-flex justify-content-between align-items-center mb-3">
                <h1 className="text-primary mb-0">{quiz.title}</h1>
                <h4 className="mb-0">Score: {score}</h4>
              </div>
              <Question
                question={currentQuestion}
                correctAnswer={correctAnswer}
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
        <div className="col-md-4">
          <div className="card shadow p-3">
            <Leaderboard scores={leaderboard} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Quiz;
