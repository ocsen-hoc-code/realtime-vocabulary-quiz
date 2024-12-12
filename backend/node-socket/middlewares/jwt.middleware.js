const jwt = require("jsonwebtoken");
const RedisClient = require("../config/redis"); // Import Redis client singleton

/**
 * Socket.IO JWT Middleware with session validation via Redis.
 */
const authSocket = async (socket, next) => {
  try {
    const token = socket.handshake.auth?.token;

    if (!token) {
      console.error("❌ No token provided in socket handshake");
      return next(new Error("Authentication error: No token provided"));
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (!decoded) {
      console.error("❌ Invalid token");
      return next(new Error("Authentication error: Invalid token"));
    }

    const { user_id, session_uuid } = decoded;

    if (!user_id || !session_uuid) {
      console.error("❌ Missing user_id or session_uuid in token claims");
      return next(new Error("Authentication error: Invalid token claims"));
    }

    const redisKey = `user:${user_id}`;
    const redisClient = RedisClient.getClient();

    const storedSessionUUID = await redisClient.get(redisKey);

    if (!storedSessionUUID) {
      console.error("❌ Session not found in Redis");
      return next(new Error("Authentication error: Session not found"));
    }
  
    if (storedSessionUUID.replaceAll('"', "") !== session_uuid) {
      console.error("❌ Session mismatch");
      return next(new Error("Authentication error: Session mismatch"));
    }

    socket.user = { user_id, session_uuid };
    console.log("✅ Authentication successful for user:", user_id);

    next();
  } catch (err) {
    console.error("❌ Authentication error:", err.message);
    return next(new Error("Authentication error: " + err.message));
  }
};

module.exports = authSocket;
