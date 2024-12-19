require("dotenv").config();
const { Kafka } = require("kafkajs");

class KafkaProducer {
  constructor() {
    if (!KafkaProducer.instance) {
      this.kafka = new Kafka({
        clientId: "quiz-app",
        brokers: [process.env.KAFKA_BROKER],
        sasl: {
          mechanism: "plain",
          username: process.env.KAFKA_USERNAME,
          password: process.env.KAFKA_PASSWORD,
        },
        ssl: true,
      });
      this.producer = this.kafka.producer();
      this.isConnected = false;
      KafkaProducer.instance = this;
    }
    return KafkaProducer.instance;
  }

  async connect() {
    if (!this.isConnected) {
      try {
        await this.producer.connect();
        console.log("✅ Kafka producer connected successfully.");
        this.isConnected = true;
      } catch (error) {
        console.error("❌ Kafka connection failed:", error.message);
        throw error;
      }
    }
  }

  async sendMessage(topic, messages) {
    await this.connect();
    try {
      await this.producer.send({ topic, messages });
      console.log(`✅ Message sent to topic "${topic}".`);
    } catch (error) {
      console.error("❌ Failed to send message to Kafka:", error.message);
      throw error;
    }
  }

  async disconnect() {
    if (this.isConnected) {
      await this.producer.disconnect();
      console.log("✅ Kafka producer disconnected.");
      this.isConnected = false;
    }
  }
}

const kafkaProducer = new KafkaProducer();
Object.freeze(kafkaProducer);

module.exports = kafkaProducer;
