import React, { useState, useEffect, useRef } from "react";
import {
  getQuizzes,
  createQuiz,
  updateQuiz,
  deleteQuiz,
} from "../services/quizService";
import { logout, changePassword } from "../services/authService";
import Quiz from "../components/Quiz";
import ModalQuiz from "../components/ModalQuiz";
import ModalChangePassword from "../components/ModalChangePassword";
import BootstrapToast from "../components/BootstrapToast";
import { FaPlus, FaSignOutAlt, FaUserEdit, FaLock } from "react-icons/fa";
import { io } from "socket.io-client";

const Dashboard = () => {
  const [quizzes, setQuizzes] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showChangePasswordModal, setShowChangePasswordModal] = useState(false);
  const [socketId, setSocketId] = useState("");
  const [toast, setToast] = useState({ show: false, message: "", type: "" });
  const [fullName, setFullName] = useState("");
  const [dropdownVisible, setDropdownVisible] = useState(false);
  const dropdownRef = useRef(null);

  const itemsPerPage = 5;

  const loadQuizzes = async (page) => {
    try {
      const response = await getQuizzes(page, itemsPerPage);
      const data = response?.data?.data || [];
      setQuizzes(data || []);
      setTotalPages(response?.data?.pagination?.totalPages || 1);
    } catch (error) {
      showToast("Error loading quizzes", "danger");
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
    }
  };

  const handleDeleteQuiz = async (quizUuid) => {
    try {
      await deleteQuiz(quizUuid);
      showToast("Quiz deleted successfully", "success");
      loadQuizzes(currentPage);
    } catch (error) {
      showToast("Error deleting quiz", "danger");
    }
  };

  const handleSavePassword = async (passwordData) => {
    const { current_password, new_password } = passwordData;
    try {
      const response = await changePassword(current_password, new_password);
      if (response.status !== 200) {
        showToast(response.message, "danger");
      } else {
        showToast("Password changed successfully", "success");
        setShowChangePasswordModal(false);
      }
    } catch (error) {
      showToast("Change password failed", "danger");
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
    }
  };

  const showToast = (message, type) => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast({ show: false, message: "", type: "" }), 3000);
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownVisible(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  useEffect(() => {
    const storedFullName = localStorage.getItem("fullname") || "Guest User";
    setFullName(storedFullName);

    const userToken = localStorage.getItem("token");
    const socket = io("http://127.0.0.1:8082", {
      auth: { token: userToken },
      transports: ["websocket", "polling"],
    });

    socket.on("connect", () => setSocketId(socket.id));
    socket.on("notification", (notification) =>
      showToast(`Notification: ${notification.data}`, "info")
    );

    return () => socket.disconnect();
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

      <div className="d-flex justify-content-between align-items-center mb-3">
        <button
          className="btn btn-primary"
          onClick={() => setShowCreateModal(true)}
        >
          <FaPlus /> Create Quiz
        </button>

        <div className="position-relative" ref={dropdownRef}>
          <button
            className="btn btn-outline-secondary"
            onClick={() => setDropdownVisible(!dropdownVisible)}
          >
            <FaUserEdit className="me-2" /> {fullName}
          </button>
          {dropdownVisible && (
            <div
              className="dropdown-menu show"
              style={{ display: "block", right: 0 }}
            >
              <button
                className="dropdown-item"
                onClick={() => setShowChangePasswordModal(true)}
              >
                <FaLock className="me-2" /> Change Password
              </button>
              <button className="dropdown-item" onClick={handleLogout}>
                <FaSignOutAlt className="me-2" /> Logout
              </button>
            </div>
          )}
        </div>
      </div>

      {showChangePasswordModal && (
        <ModalChangePassword
          show={showChangePasswordModal}
          onClose={() => setShowChangePasswordModal(false)}
          onSave={handleSavePassword}
        />
      )}

      {quizzes.length > 0 ? (
        quizzes.map((quiz) => (
          <Quiz
            key={quiz.uuid}
            quiz={quiz}
            socketId={socketId}
            onQuizUpdate={(updatedQuiz) => handleSaveQuiz(updatedQuiz)}
            onQuizDelete={(quizUuid) => handleDeleteQuiz(quizUuid)}
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
