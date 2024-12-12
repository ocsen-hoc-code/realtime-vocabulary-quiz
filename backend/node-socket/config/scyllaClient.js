const cassandra = require("cassandra-driver");
require("dotenv").config();

class ScyllaClient {
  constructor() {
    if (!ScyllaClient.instance) {
      this.client = new cassandra.Client({
        contactPoints: [process.env.SCYLLA_HOST],
        localDataCenter: process.env.SCYLLA_DATACENTER,
        keyspace: process.env.SCYLLA_KEYSPACE,
        credentials: {
          username: process.env.SCYLLA_USERNAME,
          password: process.env.SCYLLA_PASSWORD,
        },
      });
      ScyllaClient.instance = this;
      console.log("✅ ScyllaDB Client initialized");
    }
    return ScyllaClient.instance;
  }

  getClient() {
    return this.client;
  }
}

module.exports = new ScyllaClient().getClient();
