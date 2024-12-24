require("dotenv").config();
const { Kafka } = require("kafkajs");

class KafkaProducer {
  constructor() {
    if (!KafkaProducer.instance) {
      // Initialize Kafka client
      this.kafka = new Kafka({
        clientId: "quiz-app",
        brokers: [process.env.KAFKA_BROKER],
        sasl: {
          mechanism: "plain", // Authentication mechanism
          username: process.env.KAFKA_USERNAME, // SASL username
          password: process.env.KAFKA_PASSWORD, // SASL password
        },
        ssl: false, // Change to true if using SSL
      });

      // Create Kafka producer instance
      this.producer = this.kafka.producer();
      this.isConnected = false; // Track connection status
      KafkaProducer.instance = this; // Ensure singleton instance
    }
    return KafkaProducer.instance;
  }

  // Connect to Kafka broker
  async connect() {
    if (!this.isConnected) {
      try {
        await this.producer.connect(); // Establish connection
        console.log("✅ Kafka producer connected successfully.");
        this.isConnected = true; // Update connection status
      } catch (error) {
        console.error("❌ Kafka connection failed:", error.message);
        throw error; // Rethrow error for caller to handle
      }
    }
  }

  // Send a message to a Kafka topic
  async sendMessage(topic, messages) {
    await this.connect(); // Ensure producer is connected
    try {
      await this.producer.send({ topic, messages }); // Send messages
      console.log(`✅ Message sent to topic "${topic}":`, messages);
    } catch (error) {
      console.error("❌ Failed to send message to Kafka:", error.message);
      throw error; // Rethrow error for caller to handle
    }
  }

  // Disconnect the producer gracefully
  async disconnect() {
    if (this.isConnected) {
      try {
        await this.producer.disconnect(); // Disconnect producer
        console.log("✅ Kafka producer disconnected.");
        this.isConnected = false; // Update connection status
      } catch (error) {
        console.error("❌ Failed to disconnect Kafka producer:", error.message);
      }
    }
  }
}

// Singleton instance for KafkaProducer
const kafkaProducer = new KafkaProducer();

// Export the producer instance
module.exports = kafkaProducer;

// Optional: Handle graceful shutdown
process.on("SIGINT", async () => {
  console.log("\n🔄 Gracefully shutting down Kafka producer...");
  await kafkaProducer.disconnect();
  process.exit(0);
});
