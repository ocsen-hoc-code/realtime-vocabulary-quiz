require("dotenv").config();
const RedisClient = require("./config/redis");
const Server = require("./core/server");
const SocketServer = require("./config/socket");
const authSocket = require("./middlewares/jwt.middleware");

(async () => {
  // Connect to Redis
  await RedisClient.connect();

  // Initialize Socket.IO
  const httpServer = Server.getServer();
  const socketServer = new SocketServer(httpServer);
  await socketServer.initialize(authSocket);

  const io = socketServer.getIO();

  // Handle Socket.IO events
  io.on("connection", (socket) => {
    console.log("User connected:", socket.id);

    socket.on("disconnect", () => {
      console.log("User disconnected:", socket.id);
    });
  });

  // Start the HTTP server
  const PORT = process.env.PORT || 8082;
  httpServer.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
  });
})();
