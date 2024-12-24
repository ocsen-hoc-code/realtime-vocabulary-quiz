import React, { useState, useEffect } from "react";

const Question = ({ question, onSubmit, correctAnswer }) => {
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
    if (timeLeft === 0 || correctAnswer) return; // Disable selection after time out or when correctAnswer exists

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

  const getAnswerStyle = (uuid) => {
    if (!correctAnswer) return ""; // Default style if no correctAnswer is provided

    const isCorrect = correctAnswer.includes(uuid);
    const isSelected = selectedAnswers.includes(uuid);

    if (isCorrect) return "bg-success text-white"; // Green for correct answers
    if (!isCorrect && isSelected) return "bg-danger text-white"; // Red for incorrect selected answers
    return ""; // Default for others
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
              className={`list-group-item d-flex align-items-center ${getAnswerStyle(answer.uuid)}`}
              style={{ cursor: timeLeft > 0 && !correctAnswer ? "pointer" : "not-allowed" }}
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
            disabled={selectedAnswers.length === 0 || timeLeft === 0 || !!correctAnswer}
          >
            Submit
          </button>
        </div>
      </div>
    </div>
  );
};

export default Question;
