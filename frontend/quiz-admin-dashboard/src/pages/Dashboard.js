import React, { useState, useEffect } from "react";
import {
  getQuizzes,
  createQuiz,
  updateQuiz,
  deleteQuiz,
} from "../services/quizService";
import { logout } from "../services/authService"; // Import logout from authService
import Quiz from "../components/Quiz";
import ModalQuiz from "../components/ModalQuiz";
import { FaPlus, FaSignOutAlt } from "react-icons/fa";

const Dashboard = () => {
  const [quizzes, setQuizzes] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [showCreateModal, setShowCreateModal] = useState(false);

  const itemsPerPage = 5;

  const loadQuizzes = async (page) => {
    try {
      const response = await getQuizzes(page, itemsPerPage);
      const data = response?.data?.data || {};
      setQuizzes(data || []);
      setTotalPages(data.pagination?.totalPages || 1);
    } catch (error) {
      console.error("Error loading quizzes:", error);
    }
  };

  const handleSaveQuiz = async (quizData) => {
    try {
      if (!quizData.uuid) {
        await createQuiz(quizData);
      } else {
        await updateQuiz(quizData.uuid, quizData);
      }
      loadQuizzes(currentPage);
    } catch (error) {
      console.error("Error saving quiz:", error);
    }
  };

  const handleDeleteQuiz = async (quizUuid) => {
    try {
      await deleteQuiz(quizUuid);
      loadQuizzes(currentPage);
    } catch (error) {
      console.error("Error deleting quiz:", error);
    }
  };

  const handleLogout = async () => {
    try {
      await logout(); // Call the API to perform server-side logout
      localStorage.removeItem("userToken"); // Remove token from localStorage
      sessionStorage.clear(); // Clear session storage
      window.location.href = "/login"; // Redirect to login page
    } catch (error) {
      console.error("Error logging out:", error);
    }
  };

  useEffect(() => {
    loadQuizzes(currentPage);
  }, [currentPage]);

  return (
    <div className="container mt-5">
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
              className={`page-item ${currentPage === index + 1 ? "active" : ""}`}
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
