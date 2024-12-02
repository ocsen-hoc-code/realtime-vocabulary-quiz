import React, { useState, useEffect } from "react";

const ModalAnswer = ({ show, answer, onClose, onSave }) => {
  const [description, setDescription] = useState("");
  const [isCorrect, setIsCorrect] = useState(false);

  useEffect(() => {
    if (answer) {
      setDescription(answer.description || "");
      setIsCorrect(answer.is_correct || false);
    } else {
      setDescription("");
      setIsCorrect(false);
    }
  }, [answer]);

  const handleSave = () => {
    const newAnswer = {
      ...answer,
      description,
      is_correct: isCorrect,
    };
    onSave(newAnswer); // Send data to parent component
  };

  if (!show) return null;

  return (
    <div className="modal d-block" tabIndex="-1">
      <div className="modal-dialog">
        <div className="modal-content">
          <div className="modal-header">
            <h5 className="modal-title">{answer ? "Edit Answer" : "Add Answer"}</h5>
            <button
              type="button"
              className="btn-close"
              onClick={onClose}
              aria-label="Close"
            ></button>
          </div>
          <div className="modal-body">
            <div className="mb-3">
              <label className="form-label">Description</label>
              <input
                type="text"
                className="form-control"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Enter answer description"
              />
            </div>
            <div className="form-check mb-3">
              <input
                className="form-check-input"
                type="checkbox"
                id="isCorrect"
                checked={isCorrect}
                onChange={(e) => setIsCorrect(e.target.checked)}
              />
              <label className="form-check-label" htmlFor="isCorrect">
                Is Correct
              </label>
            </div>
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              Cancel
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

export default ModalAnswer;
