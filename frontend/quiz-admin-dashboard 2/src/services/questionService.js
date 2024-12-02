import axios from './axios';

export const getQuestionsByQuiz = async (quizUuid, page, limit) => {
  const response = await axios.get(`/questions/quiz/${quizUuid}?page=${page}&limit=${limit}`);
  return response.data;
};

export const createQuestion = async (questionData) => {
  const response = await axios.post('/questions/', questionData);
  return response.data;
};

export const updateQuestion = async (uuid, questionData) => {
  const response = await axios.put(`/questions/${uuid}`, questionData);
  return response.data;
};

export const deleteQuestion = async (uuid) => {
  const response = await axios.delete(`/questions/${uuid}`);
  return response.data;
};
