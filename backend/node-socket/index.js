const { createServer } = require("http");
const express = require("express");
const { Server } = require("socket.io");
const { createAdapter } = require("@socket.io/redis-adapter");
const { createClient } = require("redis");
const whiteListIP = require("./middlewares/ip.middleware");
const dotenv = require("dotenv");

dotenv.config();

const app = express();
const server = createServer(app);

(async () => {
  const pubClient = createClient({
    url: `redis://:${process.env.REDIS_PASSWORD}@${process.env.REDIS_HOST}:${process.env.REDIS_PORT}`,
  });
  const subClient = pubClient.duplicate();

  try {
    await Promise.all([pubClient.connect(), subClient.connect()]);
    console.log("Connected to Redis");
  } catch (err) {
    console.error("Redis connection error", err);
    process.exit(1);
  }

  const io = new Server(server, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"],
    },
  });
  io.adapter(createAdapter(pubClient, subClient));

  io.on("connection", (socket) => {
    console.log("User connected:", socket.id);

    socket.on("join_quiz", (quiz_id) => {
      socket.join(quiz_id);
      console.log(`User ${socket.id} joined quiz: ${quiz_id}`);
    });

    socket.on("update_score", ({ quiz_id, data }) => {
      io.to(quiz_id).emit("update_score", { data, quiz_id });
    });

    socket.on("disconnect", () => {
      console.log("User disconnected:", socket.id);
    });
  });

  app.use(express.json());

  app.post("/notification", whiteListIP, (req, res) => {
    const { socket_id, data } = req.body;

    if (!socket_id || !data) {
      return res.status(400).json({ error: "socket_id and data are required" });
    }

    const targetSocket = io.sockets.sockets.get(socket_id);
    if (targetSocket) {
      targetSocket.emit("notification", { data });
      return res.status(200).json({ success: true, message: "Message sent" });
    } else {
      return res.status(404).json({ error: "Socket ID not found" });
    }
  });

  const PORT = process.env.PORT || 8082;
  server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
})();
