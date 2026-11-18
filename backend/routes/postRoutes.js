
const router = require("express").Router();

const Post = require("../models/Post");
const User = require("../models/User");
const auth = require("../middleware/authMiddleware");

const { isValidId } = require("../utils/validation");
const createNotification = require("../utils/createNotification");

router.use(auth);

// Helper: Paginated post list
const list = async (req, res, query) => {
  const page = Math.max(
    1,
    Math.min(10000, parseInt(req.query.page, 10) || 1)
  );

  const posts = await Post.find(query)
    .sort({ createdAt: -1 })
    .skip((page - 1) * 20)
    .limit(20)
    .populate("author", "username avatar")
    .populate("comments.user", "username avatar");

  res.status(200).json({
    posts,
    page
  });
};

// Get all posts
router.get("/", (req, res) => {
  return list(req, res, {});
});

// Get personalized feed
router.get("/feed", async (req, res) => {
  const user = await User.findById(req.user.id)
    .select("following");

  return list(req, res, {
    author: {
      $in: [...user.following, req.user.id]
    }
  });
});

// Get bookmarked posts
router.get("/bookmarks", (req, res) => {
  return list(req, res, {
    bookmarks: req.user.id
  });
});

// Search posts
router.get("/search", async (req, res) => {
  if (typeof req.query.q !== "string") {
    return res.status(400).json({
      message: "Provide a search query"
    });
  }

  const query = req.query.q.trim();

  if (query.length < 2 || query.length > 100) {
    return res.status(400).json({
      message: "Search must contain 2-100 characters"
    });
  }

  const escaped = query.replace(
    /[.*+?^${}()|[\]\\]/g,
    "\\$&"
  );

  const posts = await Post.find({
    text: {
      $regex: escaped,
      $options: "i"
    }
  })
    .sort({ createdAt: -1 })
    .limit(20)
    .populate("author", "username avatar");

  res.status(200).json({ posts });
});

// Create post
router.post("/", async (req, res) => {
  const { text = "", image = "" } = req.body || {};

  if (
    typeof text !== "string" ||
    typeof image !== "string" ||
    text.length > 2000 ||
    (!text.trim() && !image) ||
    (
      image &&
      !/^https:\/\/res\.cloudinary\.com\//.test(image)
    )
  ) {
    return res.status(400).json({
      message: "Provide text or a valid Cloudinary image"
    });
  }

  const post = await Post.create({
    author: req.user.id,
    text: text.trim(),
    image
  });

  res.status(201).json({
    message: "Post created successfully",
    post
  });
});

// Edit post
router.patch("/:id", async (req, res) => {
  if (!isValidId(req.params.id)) {
    return res.status(400).json({
      message: "Invalid post ID"
    });
  }

  const post = await Post.findById(req.params.id);

  if (!post) {
    return res.status(404).json({
      message: "Post not found"
    });
  }

  if (post.author.toString() !== req.user.id) {
    return res.status(403).json({
      message: "Not your post"
    });
  }

  const { text, image } = req.body || {};

  if (text !== undefined) {
    if (
      typeof text !== "string" ||
      text.length > 2000
    ) {
      return res.status(400).json({
        message: "Invalid post text"
      });
    }

    post.text = text.trim();
  }

  if (image !== undefined) {
    if (
      typeof image !== "string" ||
      (
        image &&
        !/^https:\/\/res\.cloudinary\.com\//.test(image)
      )
    ) {
      return res.status(400).json({
        message: "Invalid image URL"
      });
    }

    post.image = image;
  }

  if (!post.text && !post.image) {
    return res.status(400).json({
      message: "Post cannot be empty"
    });
  }

  await post.save();

  res.status(200).json({
    message: "Post updated",
    post
  });
});

// Delete post
router.delete("/:id", async (req, res) => {
  if (!isValidId(req.params.id)) {
    return res.status(400).json({
      message: "Invalid post ID"
    });
  }

  const result = await Post.deleteOne({
    _id: req.params.id,
    author: req.user.id
  });

  if (!result.deletedCount) {
    return res.status(404).json({
      message: "Post not found or not yours"
    });
  }

  res.status(200).json({
    message: "Post deleted"
  });
});

// Like post
router.post("/:id/like", async (req, res) => {
  if (!isValidId(req.params.id)) {
    return res.status(400).json({
      message: "Invalid post ID"
    });
  }

  const result = await Post.updateOne(
    {
      _id: req.params.id,
      likes: { $ne: req.user.id }
    },
    {
      $addToSet: {
        likes: req.user.id
      }
    }
  );

  const post = await Post.findById(req.params.id);

  if (!post) {
    return res.status(404).json({
      message: "Post not found"
    });
  }

  if (
    result.modifiedCount > 0 &&
    post.author.toString() !== req.user.id
  ) {
    await createNotification(req, {
      recipient: post.author,
      sender: req.user.id,
      type: "like",
      post: post.id
    });
  }

  res.status(200).json({
    message: "Post liked",
    likes: post.likes.length
  });
});

// Unlike post
router.delete("/:id/like", async (req, res) => {
  if (!isValidId(req.params.id)) {
    return res.status(400).json({
      message: "Invalid post ID"
    });
  }

  const post = await Post.findByIdAndUpdate(
    req.params.id,
    {
      $pull: {
        likes: req.user.id
      }
    },
    { new: true }
  );

  if (!post) {
    return res.status(404).json({
      message: "Post not found"
    });
  }

  res.status(200).json({
    message: "Post unliked",
    likes: post.likes.length
  });
});

// Bookmark post
router.post("/:id/bookmark", async (req, res) => {
  if (!isValidId(req.params.id)) {
    return res.status(400).json({
      message: "Invalid post ID"
    });
  }

  const post = await Post.findByIdAndUpdate(
    req.params.id,
    {
      $addToSet: {
        bookmarks: req.user.id
      }
    },
    { new: true }
  );

  if (!post) {
    return res.status(404).json({
      message: "Post not found"
    });
  }

  res.status(200).json({
    message: "Post bookmarked"
  });
});

// Remove bookmark
router.delete("/:id/bookmark", async (req, res) => {
  if (!isValidId(req.params.id)) {
    return res.status(400).json({
      message: "Invalid post ID"
    });
  }

  const post = await Post.findByIdAndUpdate(
    req.params.id,
    {
      $pull: {
        bookmarks: req.user.id
      }
    },
    { new: true }
  );

  if (!post) {
    return res.status(404).json({
      message: "Post not found"
    });
  }

  res.status(200).json({
    message: "Bookmark removed"
  });
});

// Add comment
router.post("/:id/comments", async (req, res) => {
  if (!isValidId(req.params.id)) {
    return res.status(400).json({
      message: "Invalid post ID"
    });
  }

  const text = req.body?.text;

  if (
    typeof text !== "string" ||
    !text.trim() ||
    text.length > 1000
  ) {
    return res.status(400).json({
      message: "Comment must be 1-1000 characters"
    });
  }

  const post = await Post.findByIdAndUpdate(
    req.params.id,
    {
      $push: {
        comments: {
          user: req.user.id,
          text: text.trim()
        }
      }
    },
    { new: true }
  );

  if (!post) {
    return res.status(404).json({
      message: "Post not found"
    });
  }

  if (post.author.toString() !== req.user.id) {
    await createNotification(req, {
      recipient: post.author,
      sender: req.user.id,
      type: "comment",
      post: post.id
    });
  }

  res.status(201).json({
    message: "Comment added",
    comment: post.comments[post.comments.length - 1]
  });
});

// Delete comment
router.delete("/:id/comments/:commentId", async (req, res) => {
  if (
    !isValidId(req.params.id) ||
    !isValidId(req.params.commentId)
  ) {
    return res.status(400).json({
      message: "Invalid ID"
    });
  }

  const post = await Post.findById(req.params.id);

  if (!post) {
    return res.status(404).json({
      message: "Post not found"
    });
  }

  const comment = post.comments.id(
    req.params.commentId
  );

  if (!comment) {
    return res.status(404).json({
      message: "Comment not found"
    });
  }

  if (
    comment.user.toString() !== req.user.id &&
    post.author.toString() !== req.user.id
  ) {
    return res.status(403).json({
      message: "Not allowed"
    });
  }

  post.comments.pull({
    _id: comment._id
  });

  await post.save();

  res.status(200).json({
    message: "Comment deleted"
  });
});

module.exports = router;
