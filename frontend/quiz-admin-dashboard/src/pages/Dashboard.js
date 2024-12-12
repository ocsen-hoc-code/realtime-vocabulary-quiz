import React, { useState, useEffect } from "react";
import {
  getQuizzes,
  createQuiz,
  updateQuiz,
  deleteQuiz,
} from "../services/quizService";
import { logout } from "../services/authService";
import Quiz from "../components/Quiz";
import ModalQuiz from "../components/ModalQuiz";
import BootstrapToast from "../components/BootstrapToast"; // Import Toast Component
import { FaPlus, FaSignOutAlt } from "react-icons/fa";
import { io } from "socket.io-client";

const Dashboard = () => {
  const [quizzes, setQuizzes] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [socketId, setSocketId] = useState("");
  const [toast, setToast] = useState({ show: false, message: "", type: "" });

  const itemsPerPage = 5;

  const loadQuizzes = async (page) => {
    try {
      const response = await getQuizzes(page, itemsPerPage);
      const data = response?.data?.data || {};
      setQuizzes(data || []);
      setTotalPages(data.pagination?.totalPages || 1);
    } catch (error) {
      showToast("Error loading quizzes", "danger");
      console.error("Error loading quizzes:", error);
    }
  };

  const handleSaveQuiz = async (quizData) => {
    try {
      if (!quizData.uuid) {
        await createQuiz(quizData);
        showToast("Quiz created successfully", "success");
      } else {
        await updateQuiz(quizData.uuid, quizData);
        showToast("Quiz updated successfully", "success");
      }
      loadQuizzes(currentPage);
    } catch (error) {
      showToast("Error saving quiz", "danger");
      console.error("Error saving quiz:", error);
    }
  };

  const handleDeleteQuiz = async (quizUuid) => {
    try {
      await deleteQuiz(quizUuid);
      showToast("Quiz deleted successfully", "success");
      loadQuizzes(currentPage);
    } catch (error) {
      showToast("Error deleting quiz", "danger");
      console.error("Error deleting quiz:", error);
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
      localStorage.removeItem("userToken");
      sessionStorage.clear();
      showToast("Logged out successfully", "info");
      window.location.href = "/login";
    } catch (error) {
      showToast("Error logging out", "danger");
      console.error("Error logging out:", error);
    }
  };

  const handleShareQuiz = (link) => {
    showToast(`Link copied to clipboard: ${link}`, "info");
  };

  const showToast = (message, type) => {
    setToast({ show: true, message, type });

    setTimeout(() => {
      setToast({ show: false, message: "", type: "" });
    }, 3000);
  };

  useEffect(() => {
    const userToken = localStorage.getItem("userToken");
    const socketInstance = io("http://127.0.0.1:8082", {
      auth: {
        token: userToken,
      },
      transports: ["websocket", "polling"],
    });

    socketInstance.on("connect", () => {
      setSocketId(socketInstance.id);
    });

    socketInstance.on("notification", (notification) => {
      showToast(`Notification: ${notification.data}`, "info");
    });

    return () => {
      socketInstance.disconnect();
    };
  }, []);

  useEffect(() => {
    loadQuizzes(currentPage);
  }, [currentPage]);

  return (
    <div className="container mt-5">
      {toast.show && (
        <BootstrapToast
          show={toast.show}
          message={toast.message}
          type={toast.type}
          onClose={() => setToast({ show: false, message: "", type: "" })}
        />
      )}
      <div className="d-flex justify-content-between align-items-center">
        <h1>Manage Quizzes</h1>
        <button className="btn btn-danger" onClick={handleLogout}>
          <FaSignOutAlt className="me-2" /> Logout
        </button>
      </div>
      <button
        className="btn btn-primary mb-3"
        onClick={() => setShowCreateModal(true)}
      >
        <FaPlus /> Create Quiz
      </button>
      {quizzes.length > 0 ? (
        quizzes.map((quiz) => (
          <Quiz
            key={quiz.uuid}
            quiz={quiz}
            socketId={socketId}
            onQuizUpdate={(updatedQuiz) => handleSaveQuiz(updatedQuiz)}
            onQuizDelete={(quizUuid) => handleDeleteQuiz(quizUuid)}
            onShare={(link) => handleShareQuiz(link)}
          />
        ))
      ) : (
        <p>No quizzes available.</p>
      )}

      {showCreateModal && (
        <ModalQuiz
          show={showCreateModal}
          action="create"
          quizData={{}}
          onClose={() => setShowCreateModal(false)}
          onSave={(newQuiz) => {
            handleSaveQuiz(newQuiz);
            setShowCreateModal(false);
          }}
        />
      )}

      <nav className="mt-4">
        <ul className="pagination justify-content-center">
          <li className={`page-item ${currentPage === 1 ? "disabled" : ""}`}>
            <button
              className="page-link"
              onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
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
                setCurrentPage((prev) => Math.min(prev + 1, totalPages))
              }
            >
              Next
            </button>
          </li>
        </ul>
      </nav>
    </div>
  );
};

export default Dashboard;
