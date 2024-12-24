import React, { useState, useEffect } from "react";

const Question = ({ question, onSubmit, correctAnswer }) => {
  const { description, position, time_limit, answers, type } = question;
  const [selectedAnswers, setSelectedAnswers] = useState([]);
  const [timeLeft, setTimeLeft] = useState(time_limit);

  useEffect(() => {
    setTimeLeft(time_limit);
  }, [time_limit]);

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prev) => Math.max(prev - 1, 0));
    }, 1000);

    return () => clearInterval(timer);
  }, [timeLeft]);

  useEffect(() => {
    if (timeLeft === 0) {
      handleSubmit();
    }
  }, [timeLeft]);

  const handleAnswerSelect = (uuid) => {
    if (timeLeft === 0 || correctAnswer) return;

    if (type === 1) {
      setSelectedAnswers([uuid]);
    } else {
      setSelectedAnswers((prev) =>
        prev.includes(uuid) ? prev.filter((id) => id !== uuid) : [...prev, uuid]
      );
    }
  };

  const handleSubmit = () => {
    onSubmit(selectedAnswers);
  };

  const getAnswerStyle = (uuid) => {
    if (!correctAnswer) return "";

    const isCorrect = correctAnswer.includes(uuid);
    const isSelected = selectedAnswers.includes(uuid);

    if (isCorrect) return "bg-success text-white";
    if (!isCorrect && isSelected) return "bg-danger text-white";
    return "";
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
              className={`list-group-item d-flex align-items-center ${getAnswerStyle(
                answer.uuid
              )}`}
              style={{
                cursor:
                  timeLeft > 0 && !correctAnswer ? "pointer" : "not-allowed",
              }}
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
            disabled={
              selectedAnswers.length === 0 || timeLeft === 0 || !!correctAnswer
            }
          >
            Submit
          </button>
        </div>
      </div>
    </div>
  );
};

export default Question;
