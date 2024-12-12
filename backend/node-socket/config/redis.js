const { createClient } = require("redis");

class RedisClient {
  constructor() {
    if (!RedisClient.instance) {
      this.client = createClient({
        url: `redis://:${process.env.REDIS_PASSWORD}@${process.env.REDIS_HOST}:${process.env.REDIS_PORT}`,
      });
      this.isConnected = false; // Flag to track connection status
      RedisClient.instance = this;
    }
    return RedisClient.instance;
  }

  async connect() {
    if (!this.isConnected) {
      await this.client.connect();
      this.isConnected = true;
      console.log("✅ Redis connected successfully");
    }
  }

  getClient() {
    return this.client;
  }

  duplicate() {
    return this.client.duplicate();
  }
}

module.exports = new RedisClient();
