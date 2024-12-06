import React from 'react';
import { useNavigate } from 'react-router-dom';
import { logout } from '../services/authService'; // Hàm logout (nếu có)
import 'bootstrap/dist/css/bootstrap.min.css';
import { FaSignOutAlt } from 'react-icons/fa'; // FontAwesome icon

const Header = () => {
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="d-flex justify-content-between align-items-center p-3 bg-light border-bottom">
      <h4 className="m-0">Dashboard</h4>
      <button
        onClick={handleLogout}
        className="btn btn-outline-danger d-flex align-items-center"
        style={{ cursor: 'pointer' }}
      >
        <FaSignOutAlt className="me-2" /> Logout
      </button>
    </div>
  );
};

export default Header;
