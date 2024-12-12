import React, { useState, useEffect } from "react";

const Question = ({ question, onSubmit }) => {
  const { description, position, time_limit, answers, type } = question;
  const [selectedAnswers, setSelectedAnswers] = useState([]);
  const [timeLeft, setTimeLeft] = useState(time_limit);

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prev) => Math.max(prev - 1, 0));
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const handleAnswerSelect = (uuid) => {
    if (timeLeft === 0) return;

    if (type === 1) {
      setSelectedAnswers([uuid]);
    } else {
      setSelectedAnswers((prev) =>
        prev.includes(uuid) ? prev.filter((id) => id !== uuid) : [...prev, uuid]
      );
    }
  };

  const handleSubmit = () => {
    if (selectedAnswers.length > 0) {
      onSubmit(selectedAnswers);
    }
  };

  return (
    <div className="card shadow-sm mb-4">
      <div className="card-header bg-primary text-white d-flex justify-content-between">
        <h5 className="mb-0">Question {position}</h5>
        <span>Time Left: {timeLeft}s</span>
      </div>
      <div className="card-body">
        <p className="card-text">{description}</p>
        <ul className="list-group">
          {answers.map((answer) => (
            <li
              key={answer.uuid}
              className="list-group-item d-flex align-items-center"
              style={{ cursor: timeLeft > 0 ? "pointer" : "not-allowed" }}
              onClick={() => handleAnswerSelect(answer.uuid)}
            >
              {type === 1 ? (
                <input
                  type="radio"
                  name="single-select"
                  checked={selectedAnswers.includes(answer.uuid)}
                  readOnly
                  className="me-2"
                />
              ) : (
                <input
                  type="checkbox"
                  checked={selectedAnswers.includes(answer.uuid)}
                  readOnly
                  className="me-2"
                />
              )}
              <span>{answer.description}</span>
            </li>
          ))}
        </ul>
        <div className="mt-3 d-flex justify-content-end">
          <button
            className="btn btn-success"
            onClick={handleSubmit}
            disabled={selectedAnswers.length === 0 || timeLeft === 0}
          >
            Submit
          </button>
        </div>
      </div>
    </div>
  );
};

export default Question;
