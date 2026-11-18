
const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const User = require("../models/User");

const router = express.Router();

function generateToken(userId) {
  return jwt.sign(
    { userId: userId.toString() },
    process.env.JWT_SECRET,
    {
      expiresIn: "1h",
      algorithm: "HS256"
    }
  );
}

// REGISTER USER
router.post("/register", async (req, res) => {
  const { username, email, password } = req.body || {};

  if (
    typeof username !== "string" ||
    typeof email !== "string" ||
    typeof password !== "string"
  ) {
    return res.status(400).json({
      message: "All fields are required"
    });
  }

  const cleanUsername = username.trim();
  const cleanEmail = email.trim().toLowerCase();

  if (
    cleanUsername.length < 3 ||
    cleanUsername.length > 30
  ) {
    return res.status(400).json({
      message: "Username must be 3-30 characters"
    });
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
    return res.status(400).json({
      message: "Invalid email address"
    });
  }

  if (password.length < 8 || password.length > 72) {
    return res.status(400).json({
      message: "Password must be 8-72 characters"
    });
  }

  const existingUser = await User.findOne({
    $or: [
      { email: cleanEmail },
      { username: cleanUsername }
    ]
  });

  if (existingUser) {
    return res.status(409).json({
      message: "Email or username already registered"
    });
  }

  const hashedPassword = await bcrypt.hash(password, 12);

  const user = await User.create({
    username: cleanUsername,
    email: cleanEmail,
    password: hashedPassword
  });

  const token = generateToken(user._id);

  res.status(201).json({
    message: "Registration successful",
    token,
    user: {
      id: user.id,
      username: user.username,
      email: user.email
    }
  });
});

// LOGIN USER
router.post("/login", async (req, res) => {
  const { email, password } = req.body || {};

  if (
    typeof email !== "string" ||
    typeof password !== "string"
  ) {
    return res.status(400).json({
      message: "Email and password are required"
    });
  }

  const user = await User.findOne({
    email: email.trim().toLowerCase()
  }).select("+password");

  if (!user) {
    return res.status(401).json({
      message: "Invalid email or password"
    });
  }

  const passwordMatches = await bcrypt.compare(
    password,
    user.password
  );

  if (!passwordMatches) {
    return res.status(401).json({
      message: "Invalid email or password"
    });
  }

  const token = generateToken(user._id);

  res.status(200).json({
    message: "Login successful",
    token,
    user: {
      id: user.id,
      username: user.username,
      email: user.email
    }
  });
});

module.exports = router;
