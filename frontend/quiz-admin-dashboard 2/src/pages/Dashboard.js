import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  getQuizzes,
  createQuiz,
  updateQuiz,
  deleteQuiz,
} from "../services/quizService";
import {
  getQuestionsByQuiz,
  createQuestion,
  updateQuestion,
  deleteQuestion,
} from "../services/questionService";
import {
  getAnswersByQuestion,
  createAnswer,
  updateAnswer,
  deleteAnswer,
} from "../services/answerService";
import { logout } from "../services/authService";
import {
  FaTrash,
  FaEdit,
  FaPlus,
  FaChevronDown,
  FaChevronUp,
  FaSignOutAlt,
} from "react-icons/fa";
import Modal from "react-bootstrap/Modal";
import Button from "react-bootstrap/Button";
import Form from "react-bootstrap/Form";

const Dashboard = () => {
  const navigate = useNavigate();
  const [quizzes, setQuizzes] = useState([]);
  const [expandedQuiz, setExpandedQuiz] = useState(null);
  const [expandedQuestion, setExpandedQuestion] = useState(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [showModal, setShowModal] = useState(false);
  const [modalData, setModalData] = useState({});
  const [modalType, setModalType] = useState("");
  const [modalAction, setModalAction] = useState("");
  const [confirmDelete, setConfirmDelete] = useState({ show: false, action: null });

  const loadQuizzes = () => {
    getQuizzes(page, 5)
      .then((data) => {
        setQuizzes(data.data.data);
        setTotalPages(data.data.pagination.totalPages);
      })
      .catch((error) => console.error("Error loading quizzes:", error));
  };

  const handleLogout = () => {
    logout()
      .then(() => {
        localStorage.removeItem("token");
        navigate("/login");
      })
      .catch((error) => console.error("Logout failed:", error));
  };

  const handleExpandQuiz = (quizUuid) => {
    if (expandedQuiz?.uuid === quizUuid) {
      setExpandedQuiz(null);
    } else {
      getQuestionsByQuiz(quizUuid, 1, 5)
        .then((questions) => {
          setExpandedQuiz({ uuid: quizUuid, questions: questions.data.data });
          setExpandedQuestion(null);
        })
        .catch((error) => console.error("Error loading questions:", error));
    }
  };

  const handleExpandQuestion = (questionUuid) => {
    if (expandedQuestion?.uuid === questionUuid) {
      setExpandedQuestion(null);
    } else {
      getAnswersByQuestion(questionUuid)
        .then((answers) =>
          setExpandedQuestion({ uuid: questionUuid, answers: answers.data })
        )
        .catch((error) => console.error("Error loading answers:", error));
    }
  };

  const handleOpenModal = (type, action, data = {}) => {
    setModalType(type);
    setModalAction(action);
    setModalData(data);
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setModalData({});
    setModalType("");
    setModalAction("");
  };

  const handleSaveModal = () => {
    if (modalType === "quiz") {
      const { uuid, title, is_published } = modalData;
      if (modalAction === "create") {
        createQuiz({ title, is_published: !!is_published })
          .then(() => loadQuizzes())
          .catch((error) => console.error("Error creating quiz:", error));
      } else if (modalAction === "edit") {
        updateQuiz(uuid, { title, is_published: !!is_published })
          .then(() => loadQuizzes())
          .catch((error) => console.error("Error updating quiz:", error));
      }
    } else if (modalType === "question") {
      const { uuid, quiz_uuid, description, position, type, time_limit } = modalData;

      const payload = {
        description,
        position: Number(position) > 0 ? Number(position) : 1,
        type: Number(type),
        time_limit: Number(time_limit) > 0 ? Number(time_limit) : 1,
      };

      if (modalAction === "create") {
        createQuestion({ ...payload, quiz_uuid })
          .then(() => handleExpandQuiz(quiz_uuid))
          .catch((error) => console.error("Error creating question:", error));
      } else if (modalAction === "edit") {
        updateQuestion(uuid, payload)
          .then(() => handleExpandQuiz(quiz_uuid))
          .catch((error) => console.error("Error updating question:", error));
      }
    } else if (modalType === "answer") {
      const { uuid, question_uuid, description, is_correct } = modalData;
      const payload = {
        description,
        is_correct: !!is_correct,
      };

      if (modalAction === "create") {
        createAnswer({ ...payload, question_uuid })
          .then(() => handleExpandQuestion(question_uuid))
          .catch((error) => console.error("Error creating answer:", error));
      } else if (modalAction === "edit") {
        updateAnswer(uuid, payload)
          .then(() => handleExpandQuestion(question_uuid))
          .catch((error) => console.error("Error updating answer:", error));
      }
    }
    handleCloseModal();
  };

  const handleDelete = (action) => {
    if (action) {
      action()
        .then(() => {
          loadQuizzes();
          setConfirmDelete({ show: false, action: null });
        })
        .catch((error) => console.error("Error deleting:", error));
    }
  };

  const handleConfirmDelete = (deleteFunction) => {
    setConfirmDelete({
      show: true,
      action: deleteFunction,
    });
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setModalData((prev) => ({
      ...prev,
      [name]: name === "type" ? (checked ? 2 : 1) : type === "checkbox" ? checked : value,
    }));
  };

  useEffect(() => {
    loadQuizzes();
  }, [page]);

  return (
    <div className="container mt-5">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h1>Manage Quizzes</h1>
        <Button variant="danger" onClick={handleLogout}>
          <FaSignOutAlt /> Logout
        </Button>
      </div>
      <Button
        className="mb-3"
        variant="primary"
        onClick={() => handleOpenModal("quiz", "create")}
      >
        <FaPlus /> Create Quiz
      </Button>
      <table className="table table-bordered">
        <thead className="table-light">
          <tr>
            <th>Title</th>
            <th>Published</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {quizzes.map((quiz) => (
            <React.Fragment key={quiz.uuid}>
              <tr>
                <td>{quiz.title}</td>
                <td>{quiz.is_published ? "Yes" : "No"}</td>
                <td>
                  <Button
                    variant="warning"
                    size="sm"
                    className="me-2"
                    onClick={() => handleOpenModal("quiz", "edit", quiz)}
                  >
                    <FaEdit /> Edit
                  </Button>
                  <Button
                    variant="danger"
                    size="sm"
                    onClick={() =>
                      handleConfirmDelete(() => deleteQuiz(quiz.uuid))
                    }
                  >
                    <FaTrash /> Delete
                  </Button>
                  <Button
                    variant="info"
                    size="sm"
                    onClick={() => handleExpandQuiz(quiz.uuid)}
                  >
                    {expandedQuiz?.uuid === quiz.uuid ? <FaChevronUp /> : <FaChevronDown />}
                  </Button>
                </td>
              </tr>
              {expandedQuiz?.uuid === quiz.uuid && (
                <tr>
                  <td colSpan="3">
                    <h5>Questions</h5>
                    <Button
                      variant="primary"
                      className="mb-2"
                      onClick={() =>
                        handleOpenModal("question", "create", {
                          quiz_uuid: quiz.uuid,
                        })
                      }
                    >
                      <FaPlus /> Create Question
                    </Button>
                    <table className="table table-sm table-bordered">
                      <thead className="table-light">
                        <tr>
                          <th>Description</th>
                          <th>Type</th>
                          <th>Position</th>
                          <th>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {expandedQuiz.questions.map((question) => (
                          <React.Fragment key={question.uuid}>
                            <tr>
                              <td>{question.description}</td>
                              <td>{question.type === 1 ? "Default" : "Multiple"}</td>
                              <td>{question.position}</td>
                              <td>
                                <Button
                                  variant="warning"
                                  size="sm"
                                  className="me-2"
                                  onClick={() =>
                                    handleOpenModal("question", "edit", question)
                                  }
                                >
                                  <FaEdit /> Edit
                                </Button>
                                <Button
                                  variant="danger"
                                  size="sm"
                                  onClick={() =>
                                    handleConfirmDelete(() =>
                                      deleteQuestion(question.uuid)
                                    )
                                  }
                                >
                                  <FaTrash /> Delete
                                </Button>
                              </td>
                            </tr>
                          </React.Fragment>
                        ))}
                      </tbody>
                    </table>
                  </td>
                </tr>
              )}
            </React.Fragment>
          ))}
        </tbody>
      </table>
      <Modal show={showModal} onHide={handleCloseModal}>
        <Modal.Header closeButton>
          <Modal.Title>
            {modalAction === "create" ? "Create" : "Edit"} {modalType}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {modalType === "quiz" && (
            <>
              <Form.Group className="mb-3">
                <Form.Label>Title</Form.Label>
                <Form.Control
                  type="text"
                  name="title"
                  value={modalData.title || ""}
                  onChange={handleInputChange}
                />
              </Form.Group>
              <Form.Group className="mb-3">
                <Form.Check
                  type="checkbox"
                  label="Published"
                  name="is_published"
                  checked={modalData.is_published || false}
                  onChange={handleInputChange}
                />
              </Form.Group>
            </>
          )}

          {modalType === "question" && (
            <>
              <Form.Group className="mb-3">
                <Form.Label>Description</Form.Label>
                <Form.Control
                  type="text"
                  name="description"
                  value={modalData.description || ""}
                  onChange={handleInputChange}
                />
              </Form.Group>
              <Form.Group className="mb-3">
                <Form.Label>Position</Form.Label>
                <Form.Control
                  type="number"
                  name="position"
                  value={modalData.position || ""}
                  onChange={handleInputChange}
                  min="1"
                />
              </Form.Group>
              <Form.Group className="mb-3">
                <Form.Label>Time Limit</Form.Label>
                <Form.Control
                  type="number"
                  name="time_limit"
                  value={modalData.time_limit || ""}
                  onChange={handleInputChange}
                  min="1"
                />
              </Form.Group>
              <Form.Group className="mb-3">
                <Form.Check
                  type="checkbox"
                  label="Multiple Select"
                  name="type"
                  checked={modalData.type === 2}
                  onChange={(e) =>
                    handleInputChange({
                      ...e,
                      target: {
                        ...e.target,
                        value: e.target.checked ? 2 : 1,
                      },
                    })
                  }
                />
              </Form.Group>
            </>
          )}

          {modalType === "answer" && (
            <>
              <Form.Group className="mb-3">
                <Form.Label>Description</Form.Label>
                <Form.Control
                  type="text"
                  name="description"
                  value={modalData.description || ""}
                  onChange={handleInputChange}
                />
              </Form.Group>
              <Form.Group className="mb-3">
                <Form.Check
                  type="checkbox"
                  label="Correct Answer"
                  name="is_correct"
                  checked={modalData.is_correct || false}
                  onChange={handleInputChange}
                />
              </Form.Group>
            </>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={handleCloseModal}>
            Close
          </Button>
          <Button variant="primary" onClick={handleSaveModal}>
            Save
          </Button>
        </Modal.Footer>
      </Modal>
      <Modal
        show={confirmDelete.show}
        onHide={() => setConfirmDelete({ show: false, action: null })}
      >
        <Modal.Header closeButton>
          <Modal.Title>Confirm Delete</Modal.Title>
        </Modal.Header>
        <Modal.Body>Are you sure you want to delete?</Modal.Body>
        <Modal.Footer>
          <Button
            variant="secondary"
            onClick={() => setConfirmDelete({ show: false, action: null })}
          >
            Cancel
          </Button>
          <Button variant="danger" onClick={() => handleDelete(confirmDelete.action)}>
            Confirm
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default Dashboard;
