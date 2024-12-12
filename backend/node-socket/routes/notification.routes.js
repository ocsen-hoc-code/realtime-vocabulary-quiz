const { Router } = require("express");
const whiteListIP = require("../middlewares/ip.middleware");
const SocketServer = require("../config/socket");

const router = Router();

router.post("/", whiteListIP, (req, res) => {
  const { socket_id, data } = req.body;

  if (!socket_id || !data) {
    return res.status(400).json({ error: "socket_id and data are required" });
  }

  const io = SocketServer.instance.getIO();
  const targetSocket = io.sockets.sockets.get(socket_id);

  if (targetSocket) {
    targetSocket.emit("notification", { data });
    return res.status(200).json({ success: true, message: "Notification sent" });
  } else {
    return res.status(404).json({ error: "Socket ID not found" });
  }
});

module.exports = router;
