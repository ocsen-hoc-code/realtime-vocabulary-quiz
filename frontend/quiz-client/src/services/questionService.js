import axios from './axios';

export const getQuestionByUUID = async (quizUuid, questionUuid) => {
  const response = await axios.get(`static/${quizUuid}/questions/${questionUuid}.json`);
  return response.data;
};