import React from "react";

const BootstrapToast = ({ show, onClose, message, type = "info" }) => {
  return (
    <div
      className={`toast align-items-center text-bg-${type} border-0 ${
        show ? "show" : ""
      }`}
      role="alert"
      aria-live="assertive"
      aria-atomic="true"
      style={{
        position: "fixed",
        bottom: "1rem",
        right: "1rem",
        zIndex: 1050,
      }}
    >
      <div className="d-flex">
        <div className="toast-body">{message}</div>
        <button
          type="button"
          className="btn-close btn-close-white me-2 m-auto"
          aria-label="Close"
          onClick={onClose}
        ></button>
      </div>
    </div>
  );
};

export default BootstrapToast;
