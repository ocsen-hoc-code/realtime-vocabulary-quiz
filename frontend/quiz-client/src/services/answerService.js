import axios from './axios';

export const getAnswersByQuestion = async (questionUuid) => {
  const response = await axios.get(`/answers/question/${questionUuid}`);
  return response.data;
};

export const createAnswer = async (answerData) => {
  const response = await axios.post('/answers/', answerData);
  return response.data;
};

export const updateAnswer = async (uuid, answerData) => {
  const response = await axios.put(`/answers/${uuid}`, answerData);
  return response.data;
};

export const deleteAnswer = async (uuid) => {
  const response = await axios.delete(`/answers/${uuid}`);
  return response.data;
};
