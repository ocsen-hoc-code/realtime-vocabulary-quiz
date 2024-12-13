import React, { useState, useEffect } from "react";

const ModalQuestion = ({ show, question, quizUuid, onClose, onSave }) => {
  const [description, setDescription] = useState("");
  const [position, setPosition] = useState(1);
  const [type, setType] = useState(1); // Default: Single Choice
  const [timeLimit, setTimeLimit] = useState(60); // Default: 60 seconds
  const [score, setScore] = useState(0); // New: Default score

  useEffect(() => {
    if (question) {
      setDescription(question.description || "");
      setPosition(question.position || 1);
      setType(question.type || 1);
      setTimeLimit(question.time_limit || 60);
      setScore(question.score || 0); // Set score from question
    } else {
      setDescription("");
      setPosition(1);
      setType(1);
      setTimeLimit(60);
      setScore(0); // Reset to default score
    }
  }, [question]);

  const handleSave = () => {
    const newQuestion = {
      uuid: question?.uuid || "",
      description,
      quiz_uuid: quizUuid, // Link to the quiz
      position,
      type,
      time_limit: timeLimit,
      score, // Include score in the saved data
    };

    onSave(newQuestion); // Pass data to parent component
  };

  if (!show) return null;

  return (
    <div className="modal d-block" tabIndex="-1">
      <div className="modal-dialog">
        <div className="modal-content">
          <div className="modal-header">
            <h5 className="modal-title">{question ? "Edit Question" : "Add Question"}</h5>
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
                placeholder="Enter the question description"
              />
            </div>
            <div className="mb-3">
              <label className="form-label">Position</label>
              <input
                type="number"
                className="form-control"
                value={position}
                onChange={(e) => setPosition(Number(e.target.value))}
                min="1"
              />
            </div>
            <div className="mb-3">
              <label className="form-label">Type</label>
              <select
                className="form-select"
                value={type}
                onChange={(e) => setType(Number(e.target.value))}
              >
                <option value={1}>Single Choice</option>
                <option value={2}>Multiple Choice</option>
              </select>
            </div>
            <div className="mb-3">
              <label className="form-label">Time Limit (seconds)</label>
              <input
                type="number"
                className="form-control"
                value={timeLimit}
                onChange={(e) => setTimeLimit(Number(e.target.value))}
                min="10"
              />
            </div>
            <div className="mb-3">
              <label className="form-label">Score</label>
              <input
                type="number"
                className="form-control"
                value={score}
                onChange={(e) => setScore(Number(e.target.value))}
                min="0"
              />
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

export default ModalQuestion;
