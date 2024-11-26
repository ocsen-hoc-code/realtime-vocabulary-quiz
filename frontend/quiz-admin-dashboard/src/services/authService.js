import axios from './axios';

export const login = async (username, password) => {
  try {
    const response = await axios.post('/login', { username, password });
    const { token } = response.data;
    localStorage.setItem('token', token);
    return { success: true, token };
  } catch (error) {
    return {
      success: false,
      message: error.response?.data?.message || 'Login failed',
    };
  }
};

export const logout = async () => {
  try {
    const response = await axios.get('/logout');
    localStorage.removeItem('token');
    return { success: true, message: response.data.message };
  } catch (error) {
    return {
      success: false,
      message: error.response?.data?.message || 'Logout failed',
    };
  }
};
