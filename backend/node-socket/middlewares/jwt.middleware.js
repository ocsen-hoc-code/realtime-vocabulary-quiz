const jwt = require("jsonwebtoken");
const RedisClient = require("../config/redis");
const logger = require("../utils/logger"); // Import centralized logger

/**
 * Socket.IO JWT Middleware with session validation via Redis.
 */
const authSocket = async (socket, next) => {
  try {
    const token = socket.handshake.auth?.token;

    // Check if token exists
    if (!token) {
      logger.error("Authentication error: No token provided");
      return next(new Error("Authentication error: No token provided"));
    }

    // Verify JWT token
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (err) {
      logger.error(`Authentication error: Invalid token - ${err.message}`);
      return next(new Error("Authentication error: Invalid token"));
    }

    const { user_id, session_uuid, fullname } = decoded;

    // Validate token claims
    if (!user_id || !session_uuid) {
      logger.error("Authentication error: Missing user_id or session_uuid in token");
      return next(new Error("Authentication error: Invalid token claims"));
    }

    // Check session in Redis
    const redisClient = RedisClient.getClient();
    if (!redisClient) {
      logger.error("Authentication error: Redis client not initialized");
      return next(new Error("Authentication error: Redis unavailable"));
    }

    const storedSessionUUID = await redisClient.get(`user:${user_id}`);
    if (!storedSessionUUID) {
      logger.error("Authentication error: Session not found in Redis");
      return next(new Error("Authentication error: Session not found"));
    }

    if (storedSessionUUID.replaceAll('"', "") !== session_uuid.trim()) {
      logger.error("Authentication error: Session mismatch");
      return next(new Error("Authentication error: Session mismatch"));
    }

    // Attach user info to socket
    socket.user = { user_id, session_uuid, fullname };
    next();
  } catch (err) {
    logger.error(`Unexpected authentication error: ${err.message}`);
    return next(new Error("Authentication error: Internal server error"));
  }
};

module.exports = authSocket;
