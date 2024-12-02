import React, { useState } from "react";
import ModalAnswer from "./ModalAnswer";
import ConfirmDeleteModal from "./ConfirmDeleteModal";
import { updateAnswer, deleteAnswer } from "../services/answerService";

const Answer = ({ answer, questionUuid, onUpdate, onDelete }) => {
  const [showEditModal, setShowEditModal] = useState(false); // Control for edit modal
  const [showDeleteModal, setShowDeleteModal] = useState(false); // Control for delete confirmation

  const handleEdit = async (updatedAnswer) => {
    try {
      await updateAnswer(questionUuid, {
        updatedAnswer,
        question_uuid: questionUuid,
      }); // Update API call
      onUpdate(updatedAnswer); // Update the state in parent component
      setShowEditModal(false); // Close the modal
    } catch (error) {
      console.error("Error updating answer:", error);
    }
  };

  const handleDelete = async () => {
    try {
      await deleteAnswer(answer.uuid); // Delete API call
      onDelete(answer.uuid); // Remove answer from parent component
      setShowDeleteModal(false); // Close the confirmation modal
    } catch (error) {
      console.error("Error deleting answer:", error);
    }
  };

  return (
    <li className="list-group-item d-flex justify-content-between align-items-center">
      <div>
        <span>{answer.description}</span>
        {answer.is_correct && (
          <span className="badge bg-success ms-2">Correct</span>
        )}
      </div>
      <div>
        <button
          className="btn btn-warning btn-sm me-2"
          onClick={() => setShowEditModal(true)}
        >
          Edit
        </button>
        <button
          className="btn btn-danger btn-sm"
          onClick={() => setShowDeleteModal(true)}
        >
          Delete
        </button>
      </div>

      {/* Modal for Editing Answer */}
      {showEditModal && (
        <ModalAnswer
          show={showEditModal}
          answer={answer} // Pass current answer for editing
          onClose={() => setShowEditModal(false)}
          onSave={handleEdit}
        />
      )}

      {/* Confirmation Modal for Deleting Answer */}
      {showDeleteModal && (
        <ConfirmDeleteModal
          show={showDeleteModal}
          onClose={() => setShowDeleteModal(false)}
          onConfirm={handleDelete}
        />
      )}
    </li>
  );
};

export default Answer;
