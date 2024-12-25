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
const calculateScore = async (quizUUID, questionUUID, userUUID, answers, redisClient) => {
  try {
    const currentTime = Date.now();
    let updatedUserQuiz = null;

    // Fetch quiz, user quiz, and question data in parallel
    const [quizResult, userQuizResult, questionResult, topScoresResult] = await Promise.all([
      scyllaRepo.selectRecords("quizs", ["total_time"], {
        quiz_uuid: quizUUID,
      }),
      scyllaRepo.selectRecords(
        "user_quizs_by_user",
        ["user_uuid", "score", "created_at", "updated_at", "fullname", "current_question_uuid"],
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
      scyllaRepo.selectRecords(
        "user_quizs_by_updated_at",
        ["user_uuid", "score", "fullname", "created_at"],
        { quiz_uuid: quizUUID },
        10
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

    // Extract correct answers and question score
    const correctAnswers = questionResult[0].answers;
    const questionScore = questionResult[0].score;
    const nextQuestionUUID = questionResult[0].next_question_uuid;
    let updatedScore = score;

    // Check if the user's answer is correct
    if (correctAnswers === answers) {
      updatedScore += questionScore;
    }

    // Determine if the user has a top score
    let isTopScore = false;
    if (updatedScore > 0) {
      if (topScoresResult.length === 0) {
        isTopScore = true; // Automatically true if no top scores exist
      } else {
        isTopScore = topScoresResult.some((user) => {
          if (user.user_uuid === userUUID && user.score === updatedScore) {
            return false; // Same user with the same score
          }
          return updatedScore >= user.score;
        });
      }
    }

    // Update user's score in the database
    await scyllaRepo.deleteRecord("user_quizs", {
      quiz_uuid: quizUUID,
      score: score,
      user_uuid: userUUID,
    });
    const updatedAt = new Date();
    scyllaRepo.insertRecord(
      "user_quizs",
      {
        quiz_uuid: quizUUID,
        score: updatedScore,
        user_uuid: userUUID,
        fullname,
        current_question_uuid: nextQuestionUUID,
        created_at,
        updated_at: updatedAt,
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
    
    scyllaRepo.insertRecord(
      "user_answers",
      {
        quiz_uuid: quizUUID,
        user_uuid: userUUID,
        question_uuid: questionUUID,
        answers,
        answer_time: updatedAt,
      },
      ["quiz_uuid", "user_uuid", "question_uuid", "answers", "answer_time"]
    );

    // If the user is a top scorer, update Redis
    if (isTopScore) {
      const topScoresKey = `top_scores:${quizUUID}`;
      redisClient.del(topScoresKey, (err, reply) => {
        if (err) {
          console.error(`❌ Redis delete error: ${err.message}`);
        } else {
          console.log(`✅ Redis delete success. Deleted keys: ${reply}`);
        }
      });
      // const updatedTopScores = [
      //   ...topScoresResult.filter(
      //     (user) => user.user_uuid != userUUID // Remove the old entry of the user
      //   ),
      //   { user_uuid: userUUID, fullname, score: updatedScore, updated_at: updatedAt }, // Add new/updated user
      // ]
      //   .sort((a, b) => {
      //     if (b.score === a.score) {
      //       return new Date(b.updatedAt) - new Date(a.updatedAt); // Sort by updatedAt descending
      //     }
      //     return b.score - a.score; // Sort by score descending
      //   })
      //   .slice(0, 10); // Keep top 10

      // // Save to Redis
      // redisClient.set(
      //   topScoresKey, // Key
      //   JSON.stringify(updatedTopScores), // Value
      //   "EX", // Expiry mode
      //   300, // Time-to-live in seconds
      //   (err, reply) => {
      //     // Callback
      //     if (err) {
      //       console.error(`❌ Redis set error: ${err.message}`);
      //     } else {
      //       console.log(`✅ Redis set success: ${reply}`);
      //     }
      //   }
      // );
    }

    // Prepare updated user data
    updatedUserQuiz = { ...userQuizResult[0] };
    updatedUserQuiz.score = updatedScore;
    updatedUserQuiz.current_question_uuid = nextQuestionUUID;

    // Send updated data to Kafka for further processing
    sendKafkaMessage(userUUID, quizUUID, updatedUserQuiz);

    return {
      success: true,
      result: updatedUserQuiz,
      correct_answers: correctAnswers,
      is_top_score: isTopScore,
    };
  } catch (error) {
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
      logger.error(`❌ Failed to send Kafka message: ${error.message}`);
    });
};

module.exports = { calculateScore };
