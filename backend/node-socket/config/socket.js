const { Server } = require("socket.io");
const { createAdapter } = require("@socket.io/redis-adapter");
const RedisClient = require("./redis");
const { calculateScore, getUserQuiz } = require("../services/quiz.service");
const logger = require("../utils/logger"); // Replace console.log with a proper logger

class SocketServer {
  static instance;

  constructor(httpServer) {
    if (!SocketServer.instance) {
      this.io = new Server(httpServer, {
        cors: {
          origin: process.env.ALLOWED_ORIGINS
            ? process.env.ALLOWED_ORIGINS.split(",")
            : "*",
          methods: ["GET", "POST"],
        },
      });
      SocketServer.instance = this;
      logger.info("✅ Socket.IO Server Created");
    }
    return SocketServer.instance;
  }

  async initialize(authSocket) {
    try {
      const pubClient = RedisClient.getClient();
      const subClient = pubClient.duplicate();

      if (!subClient.isOpen) {
        await subClient.connect();
      }
      this.io.adapter(createAdapter(pubClient, subClient));
      logger.info("✅ Socket.IO initialized with Redis adapter");
    } catch (error) {
      logger.error("❌ Error initializing Redis Adapter:", error.message);
      setTimeout(() => this.initialize(authSocket), 5000); // Retry connection
    }

    this.io.use(authSocket);
  }

  attachEventListeners() {
    this.io.on("connection", (socket) => {
      logger.info(`✅ User connected: ${socket.id}`);
      this.handleJoinQuiz(socket);
      this.handleUpdateScore(socket);
      this.handleDisconnect(socket);
    });
  }

  handleJoinQuiz(socket) {
    socket.on("join_quiz", (quiz_id) => {
      if (!quiz_id) {
        logger.error("❌ Missing quiz_id");
        return;
      }
      socket.join(quiz_id);
      logger.info(`✅ User ${socket.id} joined quiz: ${quiz_id}`);
    });
  }

  handleUpdateScore(socket) {
    socket.on("user_online", async ({ quiz_id }) => {
      const result = await getUserQuiz(quiz_id, socket.user.user_uuid);
      if (result) {
        socket.to(quiz_id).emit("update_leaderboard", {
          user_uuid: socket.user.user_uuid,
          fullname: socket.user.fullname,
          score: result.score,
          updated_at: result.updated_at,
        });
      }
    });

    socket.on("update_score", async ({ quiz_id, question_id, answers }) => {
      if (!quiz_id || !question_id || (!answers && answers != '') || !socket.user?.user_uuid) {
        logger.error("❌ Invalid payload or unauthenticated user");
        socket.emit("error", { message: "Invalid payload or user session" });
        return;
      }

      try {
        const { success, result, correct_answers, is_shoudl_update } = await calculateScore(
          quiz_id,
          question_id,
          socket.user.user_uuid,
          answers
        );

        if (!success) {
          socket.emit("error", { message: "Score update failed" });
          return;
        }

        socket.emit("update_result", { result, correct_answers });

        if (socket.user?.user_uuid && is_shoudl_update) {
          socket.to(quiz_id).emit("update_leaderboard", {
            user_uuid: socket.user.user_uuid,
            fullname: socket.user.fullname,
            score: result.score,
            updated_at: result.updated_at,
          });
        }
      } catch (error) {
        logger.error("❌ Error in update_score event:", error.message);
        socket.emit("error", { message: "Internal server error" });
      }
    });
  }

  handleDisconnect(socket) {
    socket.on("disconnect", () => {
      logger.info(`❌ User disconnected: ${socket.id}`);
    });
  }

  getIO() {
    return this.io;
  }

  static getInstance(httpServer) {
    if (!SocketServer.instance) {
      SocketServer.instance = new SocketServer(httpServer);
    }
    return SocketServer.instance;
  }
}

module.exports = SocketServer;
