const scyllaRepo = require("../repositories/scyllaRepository");
const kafkaProducer = require("../config/kafkaProducer");
const logger = require("../utils/logger"); // Logger for better logging management
require("dotenv").config();

/**
 * Calculates the user's score for a quiz question.
 * @param {string} quizUUID - The unique identifier of the quiz.
 * @param {string} questionUUID - The unique identifier of the question.
 * @param {string} userUUID - The unique identifier of the user.
 * @param {Object} answers - The user's answer input.
 * @returns {Object} An object containing the operation result and updated user data.
 */
const calculateScore = async (quizUUID, questionUUID, userUUID, answers) => {
  try {
    const currentTime = Date.now();
    let updatedUserQuiz = null;

    // Fetch quiz, user quiz, and question data in parallel
    const [quizResult, userQuizResult, questionResult] = await Promise.all([
      scyllaRepo.selectRecords("quizs", ["total_time"], {
        quiz_uuid: quizUUID,
      }),
      scyllaRepo.selectRecords(
        "user_quizs_by_user",
        ["score", "created_at", "fullname", "current_question_uuid"],
        { quiz_uuid: quizUUID, user_uuid: userUUID }
      ),
      scyllaRepo.selectRecords(
        "questions",
        ["answers", "score", "next_question_uuid"],
        {
          quiz_uuid: quizUUID,
          question_uuid: questionUUID,
        }
      ),
    ]);

    // Validate if all required records exist
    if (
      quizResult.length === 0 ||
      userQuizResult.length === 0 ||
      questionResult.length === 0
    ) {
      logger.error(
        "❌ Invalid data: Missing quiz, user quiz, or question records."
      );
      return { success: false, result: null };
    }

    // Extract quiz duration and user quiz creation time
    const totalTime = quizResult[0].total_time;
    const { score, fullname, created_at } = userQuizResult[0];
    const quizEndTime = new Date(created_at).getTime() + totalTime;

    // Check if the quiz time has expired
    // if (currentTime > quizEndTime) {
    //   logger.warn("❌ Quiz time has expired.");
    //   return { success: false, result: userQuizResult[0] };
    // }

    // Extract correct answers and question score
    const correctAnswers = questionResult[0].answers;
    const questionScore = questionResult[0].score;
    const nextQuestionUUID = questionResult[0].next_question_uuid;
    let updatedScore = score;
    // Check if the user's answer is correct
    if (correctAnswers === answers) {
      updatedScore += questionScore;
    }

    // Update user's score in the database
    await scyllaRepo.deleteRecord("user_quizs", {
      quiz_uuid: quizUUID,
      score: score,
      user_uuid: userUUID,
    });

    await scyllaRepo.insertRecord(
      "user_quizs",
      {
        quiz_uuid: quizUUID,
        score: updatedScore,
        user_uuid: userUUID,
        fullname,
        current_question_uuid: nextQuestionUUID,
        created_at,
        updated_at: new Date(),
      },
      [
        "quiz_uuid",
        "score",
        "user_uuid",
        "fullname",
        "current_question_uuid",
        "created_at",
        "updated_at",
      ]
    );

    // Prepare updated user data
    updatedUserQuiz = { ...userQuizResult[0] };
    updatedUserQuiz.score = updatedScore;
    updatedUserQuiz.current_question_uuid = nextQuestionUUID;
    // Send updated data to Kafka for further processing
    sendKafkaMessage(userUUID, quizUUID, updatedUserQuiz);

    // Return success with updated score
    return {
      success: true,
      result: updatedUserQuiz,
      correct_answers: correctAnswers,
    };
  } catch (error) {
    // Log any errors that occur during score calculation
    logger.error(`❌ Error calculating score: ${error.message}`);
    return { success: false, result: null };
  }
};

/**
 * Sends the updated user quiz data to Kafka for asynchronous processing.
 * @param {string} userUUID - The unique identifier of the user.
 * @param {string} quizUUID - The unique identifier of the quiz.
 * @param {Object} updatedUserQuiz - The updated user quiz data.
 */
const sendKafkaMessage = (userUUID, quizUUID, updatedUserQuiz) => {
  const messageKey = `${userUUID}|${quizUUID}`;
  const messageValue = JSON.stringify(updatedUserQuiz);

  kafkaProducer
    .sendMessage("user_quiz_export", [{ key: messageKey, value: messageValue }])
    .catch((error) => {
      // Log any Kafka message sending errors
      logger.error(`❌ Failed to send Kafka message: ${error.message}`);
    });
};

module.exports = { calculateScore };
