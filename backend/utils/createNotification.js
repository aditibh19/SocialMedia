
const Notification = require("../models/Notification");

async function createNotification(req, {
  recipient,
  sender,
  type,
  post = null
}) {
  if (String(recipient) === String(sender)) {
    return null;
  }

  const notification = await Notification.create({
    recipient,
    sender,
    type,
    post
  });

  const populated = await notification.populate(
    "sender",
    "username avatar"
  );

  const io = req.app.get("io");

  if (io) {
    io.to(`user:${recipient}`).emit(
      "notification",
      populated
    );
  }

  return populated;
}

module.exports = createNotification;
