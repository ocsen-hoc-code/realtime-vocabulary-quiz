import api from './axios';

export const login = async (username, password) => {
  try {
    const response = await api.post('/login', { username, password });
    const { token, fullname, is_admin } = response.data;
    localStorage.setItem('token', token);
    localStorage.setItem('fullname', fullname);
    return { success: true, token, is_admin };
  } catch (error) {
    return {
      success: false,
      message: error.response?.data?.message || 'Login failed',
    };
  }
};

export const logout = async () => {
  try {
    const response = await api.get('/logout');
    localStorage.removeItem('token');
    localStorage.removeItem('fullname');
    return { success: true, message: response.data.message };
  } catch (error) {
    return {
      success: false,
      message: error.response?.data?.message || 'Logout failed',
    };
  }
};

export const changePassword = async (old_password, new_password) => {
  try {
    const response = await api.put('/change-password', { old_password, new_password });
    const { message } = response.data;
    return { status: response.status, message };
  } catch (error) {
    return {
      success: false,
      message: error.response?.data?.message || 'Change password failed',
    };
  }
};