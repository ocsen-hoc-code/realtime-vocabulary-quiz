import api from './axios';

export const getQuizzes = async (page, limit) => {
  const response = await api.get(`/quizzes/?page=${page}&limit=${limit}`);
  return response.data;
};

export const createQuiz = async (quizData) => {
  const response = await api.post('/quizzes/', quizData);
  return response.data;
};

export const updateQuiz = async (uuid, quizData) => {
  const response = await api.put(`/quizzes/${uuid}`, quizData);
  return response.data;
};

export const deleteQuiz = async (uuid) => {
  const response = await api.delete(`/quizzes/${uuid}`);
  return response.data;
};

export const quizPublish = async (uuid, socketId) => {
  const response = await api.get(`/quizzes/quiz-export/${uuid}?socket_id=${socketId}`);
  return response.data;
};

export const quizUnpublish = async (uuid, socketId) => {
  const response = await api.get(`/quizzes/revoke-quiz/${uuid}?socket_id=${socketId}`);
  return response.data;
};
