const { Server } = require("socket.io");
const { createAdapter } = require("@socket.io/redis-adapter");
const RedisClient = require("./redis");
const { calculateScore } = require("../services/quiz.service");

class SocketServer {
  constructor(httpServer) {
    if (!SocketServer.instance) {
      this.io = new Server(httpServer, {
        cors: {
          origin: "*",
          methods: ["GET", "POST"],
        },
      });
      SocketServer.instance = this;
    }
    return SocketServer.instance;
  }

  /**
   * Initialize Socket.IO Redis Adapter
   * @param {Function} authSocket - Middleware for Socket.IO authentication
   */
  async initialize(authSocket) {
    const pubClient = RedisClient.getClient(); // Publisher
    const subClient = pubClient.duplicate(); // Subscriber

    // Connect only the duplicated subscriber
    if (!subClient.isOpen) {
      await subClient.connect();
    }

    // Setup Redis Adapter
    this.io.adapter(createAdapter(pubClient, subClient));
    this.io.use(authSocket);
    console.log("✅ Socket.IO initialized with Redis adapter");
  }

  /**
   * Attach Socket.IO events
   */
  attachEventListeners() {
    this.io.on("connection", (socket) => {
      console.log(`✅ User connected: ${socket.id}`);

      // Join quiz room
      socket.on("join_quiz", (quiz_id) => {
        socket.join(quiz_id);
        console.log(`User ${socket.id} joined quiz: ${quiz_id}`);
      });

      // Update score event
      socket.on("update_score", ({ quiz_id, question_id, answerHash }) => {
        calculateScore(quiz_id, question_id, answerHash).then(
          (result) => {
            socket.emit("update_result", { result });
            if (socket.user && result.score > 0) {
              this.io.to(quiz_id).emit("update_leaderboard", {
                user: socket.user,
                score: result.total,
              });
            }
          }
        );
      });

      // Disconnect event
      socket.on("disconnect", () => {
        console.log(`❌ User disconnected: ${socket.id}`);
      });
    });
  }

  getIO() {
    return this.io;
  }
}

module.exports = SocketServer;
