const whitelist = ["127.0.0.1"]; // Danh sách các IP được phép

const whiteListIP = (req, res, next) => {
  let clientIP = req.ip || req.connection.remoteAddress;
  if (clientIP.startsWith("::ffff:")) {
    clientIP = clientIP.replace("::ffff:", "");
  }
  if (clientIP && !whitelist.includes(clientIP)) {
    return res
      .status(403)
      .json({ error: "Your IP is not allowed to access this resource." });
  }

  next();
};

module.exports = whiteListIP;
