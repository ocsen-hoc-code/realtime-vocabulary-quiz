const express = require("express");
const notificationRoutes = require("../routes/notification.routes");

class App {
  constructor() {
    if (!App.instance) {
      this.app = express();
      this.app.use(express.json());

      // Register routes
      this._registerRoutes();
      App.instance = this;
    }
    return App.instance;
  }

  _registerRoutes() {
    this.app.use("/notification", notificationRoutes);
  }

  getApp() {
    return this.app;
  }
}

module.exports = new App().getApp();
