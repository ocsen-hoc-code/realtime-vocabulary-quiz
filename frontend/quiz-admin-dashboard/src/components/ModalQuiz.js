import React, { useState, useEffect } from "react";

const ModalQuiz = ({ show, action, quizData, onClose, onSave }) => {
  const [title, setTitle] = useState("");

  useEffect(() => {
    if (quizData && quizData.title) {
      setTitle(quizData.title);
    } else {
      setTitle(""); // Clear the title when creating a new quiz
    }
  }, [quizData]);

  const handleSave = () => {
    onSave({ ...quizData, title });
  };

  if (!show) return null;

  return (
    <div className="modal d-block" tabIndex="-1">
      <div className="modal-dialog">
        <div className="modal-content">
          <div className="modal-header">
            <h5 className="modal-title">
              {action === "create" ? "Create Quiz" : "Edit Quiz"}
            </h5>
            <button
              type="button"
              className="btn-close"
              onClick={onClose}
              aria-label="Close"
            ></button>
          </div>
          <div className="modal-body">
            <div className="mb-3">
              <label className="form-label">Quiz Title</label>
              <input
                type="text"
                className="form-control"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </div>
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              Close
            </button>
            <button type="button" className="btn btn-primary" onClick={handleSave}>
              Save
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ModalQuiz;
