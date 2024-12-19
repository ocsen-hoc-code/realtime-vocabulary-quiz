const pino = require("pino");

const logger = pino({
  level: process.env.LOG_LEVEL || "info", // Log level can be set in .env (debug, info, error)
  transport: process.env.NODE_ENV === "production"
    ? undefined // No pretty print in production
    : {
        target: "pino-pretty", // Pretty print logs in development
        options: { colorize: true },
      },
});

module.exports = logger;
