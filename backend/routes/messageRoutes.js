
const router = require("express").Router();
const Message = require("../models/Message");
const User = require("../models/User");
const auth = require("../middleware/authMiddleware");
const { isValidId } = require("../utils/validation");

router.use(auth);

// Get conversation history
router.get("/:userId", async (req, res) => {
  const other = req.params.userId;

  if (!isValidId(other)) {
    return res.status(400).json({
      message: "Invalid user ID"
    });
  }

  const messages = await Message.find({
    $or: [
      { sender: req.user.id, recipient: other },
      { sender: other, recipient: req.user.id }
    ]
  })
    .sort({ createdAt: -1 })
    .limit(100);

  res.json({ messages: messages.reverse() });
});

// Send a message
router.post("/:userId", async (req, res) => {
  const recipient = req.params.userId;
  const text = req.body?.text;

  if (
    !isValidId(recipient) ||
    recipient === req.user.id ||
    typeof text !== "string" ||
    !text.trim() ||
    text.length > 2000
  ) {
    return res.status(400).json({
      message: "Invalid message"
    });
  }

  if (!await User.exists({ _id: recipient })) {
    return res.status(404).json({
      message: "Recipient not found"
    });
  }

  const message = await Message.create({
    sender: req.user.id,
    recipient,
    text: text.trim()
  });

  req.app.get("io")
    .to(`user:${recipient}`)
    .emit("new_message", message);

  res.status(201).json({ message });
});

module.exports = router;
