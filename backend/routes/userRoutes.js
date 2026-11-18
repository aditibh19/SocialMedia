
const router = require("express").Router();

const User = require("../models/User");
const auth = require("../middleware/authMiddleware");

const {
  isValidId,
  safeUser
} = require("../utils/validation");

const createNotification = require("../utils/createNotification");

// Get logged-in user's profile
router.get("/profile", auth, async (req, res) => {
  const user = await User.findById(req.user.id);

  if (!user) {
    return res.status(404).json({
      message: "User not found"
    });
  }

  res.status(200).json({
    user: safeUser(user)
  });
});

// Update logged-in user's profile
router.patch("/profile", auth, async (req, res) => {
  const { username, bio, avatar } = req.body || {};

  const changes = {};

  if (username !== undefined) {
    if (
      typeof username !== "string" ||
      username.trim().length < 3 ||
      username.trim().length > 30
    ) {
      return res.status(400).json({
        message: "Username must be 3-30 characters"
      });
    }

    changes.username = username.trim();
  }

  if (bio !== undefined) {
    if (
      typeof bio !== "string" ||
      bio.length > 300
    ) {
      return res.status(400).json({
        message: "Bio must be 300 characters or fewer"
      });
    }

    changes.bio = bio;
  }

  if (avatar !== undefined) {
    if (
      typeof avatar !== "string" ||
      (
        avatar &&
        !/^https:\/\/res\.cloudinary\.com\//.test(avatar)
      )
    ) {
      return res.status(400).json({
        message: "Use a Cloudinary avatar URL"
      });
    }

    changes.avatar = avatar;
  }

  const user = await User.findByIdAndUpdate(
    req.user.id,
    { $set: changes },
    {
      new: true,
      runValidators: true
    }
  );

  res.status(200).json({
    message: "Profile updated successfully",
    user: safeUser(user)
  });
});

// Search users by username
router.get("/search", auth, async (req, res) => {
  if (typeof req.query.q !== "string") {
    return res.status(400).json({
      message: "Provide a search query"
    });
  }

  const query = req.query.q.trim();

  if (query.length < 2 || query.length > 50) {
    return res.status(400).json({
      message: "Search must contain 2-50 characters"
    });
  }

  // Escape special regex characters
  const escaped = query.replace(
    /[.*+?^${}()|[\]\\]/g,
    "\\$&"
  );

  const users = await User.find({
    username: {
      $regex: escaped,
      $options: "i"
    }
  })
    .select("username bio avatar")
    .limit(20);

  res.status(200).json({ users });
});

// View another user's public profile
router.get("/:id", auth, async (req, res) => {
  if (!isValidId(req.params.id)) {
    return res.status(400).json({
      message: "Invalid user ID"
    });
  }

  const user = await User.findById(req.params.id)
    .select(
      "username bio avatar followers following createdAt"
    );

  if (!user) {
    return res.status(404).json({
      message: "User not found"
    });
  }

  res.status(200).json({ user });
});

// Follow a user
router.post("/:id/follow", auth, async (req, res) => {
  const targetId = req.params.id;

  if (
    !isValidId(targetId) ||
    targetId === req.user.id
  ) {
    return res.status(400).json({
      message: "Invalid follow target"
    });
  }

  const target = await User.findById(targetId);

  if (!target) {
    return res.status(404).json({
      message: "User not found"
    });
  }

  // Add target to current user's following list
  const result = await User.updateOne(
    {
      _id: req.user.id,
      following: { $ne: targetId }
    },
    {
      $addToSet: { following: targetId }
    }
  );

  // Add current user to target's followers list
  await User.updateOne(
    { _id: targetId },
    {
      $addToSet: {
        followers: req.user.id
      }
    }
  );

  // Create notification only for a new follow
  if (result.modifiedCount > 0) {
    await createNotification(req, {
      recipient: targetId,
      sender: req.user.id,
      type: "follow"
    });
  }

  res.status(200).json({
    message: "Following user"
  });
});

// Unfollow a user
router.delete("/:id/follow", auth, async (req, res) => {
  const targetId = req.params.id;

  if (!isValidId(targetId)) {
    return res.status(400).json({
      message: "Invalid user ID"
    });
  }

  await User.updateOne(
    { _id: req.user.id },
    {
      $pull: {
        following: targetId
      }
    }
  );

  await User.updateOne(
    { _id: targetId },
    {
      $pull: {
        followers: req.user.id
      }
    }
  );

  res.status(200).json({
    message: "Unfollowed user"
  });
});

module.exports = router;
