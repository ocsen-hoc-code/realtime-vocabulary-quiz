import React, { useState, useEffect, useRef } from "react";
import { getQuizzes } from "../services/quizService";
import { logout, changePassword } from "../services/authService";
import ModalChangePassword from "../components/ModalChangePassword";
import BootstrapToast from "../components/BootstrapToast";
import { FaSignOutAlt, FaLock, FaUserEdit } from "react-icons/fa";

const Dashboard = () => {
  const [quizzes, setQuizzes] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [showChangePasswordModal, setShowChangePasswordModal] = useState(false);
  const [toast, setToast] = useState({ show: false, message: "", type: "" });
  const [fullName, setFullName] = useState("");
  const [dropdownVisible, setDropdownVisible] = useState(false);
  const dropdownRef = useRef(null);

  const itemsPerPage = 5;

  const loadQuizzes = async (page) => {
    try {
      const response = await getQuizzes(page, itemsPerPage);
      const data = response?.data || {};
      setQuizzes(data.data || []);
      setTotalPages(data.pagination?.totalPages || 1);
    } catch (error) {
      showToast("Error loading quizzes", "danger");
    }
  };

  const showToast = (message, type) => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast({ show: false, message: "", type: "" }), 3000);
  };

  const handleLogout = async () => {
    try {
      await logout();
      localStorage.removeItem("userToken");
      localStorage.removeItem("fullname");
      showToast("Logged out successfully", "info");
      window.location.href = "/login";
    } catch (error) {
      showToast("Error logging out", "danger");
    }
  };

  const handleSavePassword = async (passwordData) => {
    try {
      const { current_password, new_password } = passwordData;
      await changePassword(current_password, new_password);
      showToast("Password changed successfully", "success");
      setShowChangePasswordModal(false);
    } catch (error) {
      showToast("Change password failed", "danger");
    }
  };

  useEffect(() => {
    const storedFullName = localStorage.getItem("fullname") || "Guest User";
    setFullName(storedFullName);
    loadQuizzes(currentPage);

    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownVisible(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
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

      {/* Header */}
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h1>Quiz Dashboard</h1>

        <div className="position-relative" ref={dropdownRef}>
          <button
            className="btn btn-outline-secondary d-flex align-items-center"
            onClick={() => setDropdownVisible(!dropdownVisible)}
          >
            <FaUserEdit className="me-2" /> {fullName}
          </button>

          {dropdownVisible && (
            <div className="dropdown-menu show" style={{ display: "block" }}>
              <button
                className="dropdown-item d-flex align-items-center"
                onClick={() => setShowChangePasswordModal(true)}
              >
                <FaLock className="me-2" /> Change Password
              </button>
              <button
                className="dropdown-item d-flex align-items-center"
                onClick={handleLogout}
              >
                <FaSignOutAlt className="me-2" /> Logout
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Quiz List */}
      {quizzes.length > 0 ? (
        <div className="row row-cols-1 row-cols-md-2 row-cols-lg-3 g-4">
          {quizzes.map((quiz) => (
            <div className="col" key={quiz.uuid}>
              <div className="card h-100">
                <div className="card-body">
                  <h5 className="card-title">{quiz.title}</h5>
                  <p className="card-text">{quiz.description}</p>
                  <button
                    className="btn btn-success"
                    onClick={() =>
                      (window.location.href = `/quiz/${quiz.uuid}`)
                    }
                  >
                    Start
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p>No quizzes available.</p>
      )}

      {/* Pagination */}
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

      {/* Modal Change Password */}
      {showChangePasswordModal && (
        <ModalChangePassword
          show={showChangePasswordModal}
          onClose={() => setShowChangePasswordModal(false)}
          onSave={handleSavePassword}
        />
      )}
    </div>
  );
};

export default Dashboard;
