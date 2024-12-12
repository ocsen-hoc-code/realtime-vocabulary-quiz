const cassandra = require("cassandra-driver");
require("dotenv").config();

class ScyllaClient {
  constructor() {
    if (!ScyllaClient.instance) {
      this.client = new cassandra.Client({
        contactPoints: process.env.SCYLLADB_HOSTS.split(","),
        localDataCenter: "datacenter1",
        keyspace: process.env.SCYLLADB_KEYSPACE,
        credentials: {
          username: process.env.SCYLLADB_USERNAME,
          password: process.env.SCYLLADB_PASSWORD,
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
