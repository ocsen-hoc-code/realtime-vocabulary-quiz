import api from './axios';

export const getQuizzes = async (page, limit) => {
  const response = await api.get(`/quizzes/?page=${page}&limit=${limit}`);
  return response.data;
};


export const getQuizzeByUUID = async (quizUuid) => {
  const response =  await api.get(`static/${quizUuid}/quiz.json`);
  return response.data;
};