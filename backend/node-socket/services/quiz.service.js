const scyllaRepo = require("../repositories/scyllaRepository");

const calculateScore = async (quizUUID, questionUUID, answerHash) => {
  let score = 0;
  let total = 0;

  try {
    const tableName = "questions";
    const columns = ["answer_hash, awnsers"];
    const conditions = {
      quiz_uuid: quizUUID,
      question_uuid: questionUUID,
    };

    const result = await scyllaRepo.selectRecords(
      tableName,
      columns,
      conditions
    );

    if (result.length === 0) {
      return { total, score };
    }

    const correctAnswerHash = result[0].answer_hash;
    if (correctAnswerHash === answerHash) {
      score = 1;
    }
    return { total, score };
  } catch (error) {
    console.error("❌ Error calculating score:", error.message);
    return { total, score };
  }
};

module.exports = { calculateScore };
