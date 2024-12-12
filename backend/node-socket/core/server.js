const { createServer } = require("http");
const app = require("./app");

class Server {
  constructor() {
    if (!Server.instance) {
      this.server = createServer(app);
      Server.instance = this;
    }
    return Server.instance;
  }

  getServer() {
    return this.server;
  }
}

module.exports = new Server();
