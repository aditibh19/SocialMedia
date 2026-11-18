
const router = require("express").Router();

const Notification = require("../models/Notification");
const auth = require("../middleware/authMiddleware");
const { isValidId } = require("../utils/validation");

router.use(auth);

// Get all notifications for logged-in user
router.get("/", async (req, res) => {
  const page = Math.max(
    1,
    Math.min(10000, parseInt(req.query.page, 10) || 1)
  );

  const notifications = await Notification.find({
    recipient: req.user.id
  })
    .populate("sender", "username avatar")
    .populate("post", "text image")
    .sort({ createdAt: -1 })
    .skip((page - 1) * 20)
    .limit(20);

  res.status(200).json({
    notifications,
    page
  });
});

// Get unread notification count
router.get("/unread-count", async (req, res) => {
  const unreadCount = await Notification.countDocuments({
    recipient: req.user.id,
    isRead: false
  });

  res.status(200).json({ unreadCount });
});

// Mark all notifications as read
router.patch("/read-all", async (req, res) => {
  await Notification.updateMany(
    {
      recipient: req.user.id,
      isRead: false
    },
    {
      $set: { isRead: true }
    }
  );

  res.status(200).json({
    message: "All notifications marked as read"
  });
});

// Mark one notification as read
router.patch("/:id/read", async (req, res) => {
  if (!isValidId(req.params.id)) {
    return res.status(400).json({
      message: "Invalid notification ID"
    });
  }

  const notification = await Notification.findOneAndUpdate(
    {
      _id: req.params.id,
      recipient: req.user.id
    },
    {
      $set: { isRead: true }
    },
    { new: true }
  );

  if (!notification) {
    return res.status(404).json({
      message: "Notification not found"
    });
  }

  res.status(200).json({ notification });
});

module.exports = router;
