import api from './axios';

export const getQuizzes = async (page, limit) => {
  const response = await api.get(`/quizzes/?page=${page}&limit=${limit}`);
  return response.data;
};


export const getQuizzeByUUID = async (quizUuid) => {
  const response =  await api.get(`static/${quizUuid}/quiz.json`);
  return response.data;
};

export const getQuizzeLogs = async (quizUuid) => {
  const uuid = localStorage.getItem('uuid');
  const response =  await api.get(`static/logs/${uuid}-${quizUuid}.json`);
  return {status: response.status, data: response.data};
};

export const getQuizzeStatus = async (quizUuid) => {
  const response =  await api.get(`quiz-status/${quizUuid}`);
  return {status: response.status, data: response.data};
};

export const getTopScores = async (quizUUID) => {
  const response = await api.get(`/top-scores/${quizUUID}`);
  return response.data;
};