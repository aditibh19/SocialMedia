
require("dotenv").config();

const express = require("express");
const http = require("http");
const cors = require("cors");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const { Server } = require("socket.io");
const jwt = require("jsonwebtoken");
const mongoose = require("mongoose");

const connectDB = require("./config/db");

const User = require("./models/User");
const Message = require("./models/Message");

// Import routes
const authRoutes = require("./routes/authRoutes");
const userRoutes = require("./routes/userRoutes");
const postRoutes = require("./routes/postRoutes");
const messageRoutes = require("./routes/messageRoutes");
const uploadRoutes = require("./routes/uploadRoutes");
const aiRoutes = require("./routes/aiRoutes");
const notificationRoutes = require("./routes/notificationRoutes");
const circleRoutes = require("./routes/circleRoutes");

// Error handling middleware
const errorMiddleware = require("./middleware/errorMiddleware");

// Create Express app
const app = express();

// Create HTTP server
const server = http.createServer(app);

const PORT = Number(process.env.PORT) || 5000;

// Allowed frontend origins
const allowedOrigins = (
  process.env.CLIENT_ORIGIN || "http://localhost:5173"
)
  .split(",")
  .map(origin => origin.trim());

// Security middleware
app.use(helmet());

app.use(cors({
  origin: allowedOrigins
}));

// Parse JSON requests
app.use(express.json({
  limit: "1mb"
}));

// General API rate limiter
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 300,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  message: {
    message: "Too many requests. Please try again later."
  }
});

app.use("/api", apiLimiter);

// Authentication rate limiter
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 30,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  message: {
    message: "Too many authentication requests."
  }
});

// AI rate limiter
const aiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 15,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  message: {
    message: "AI request limit reached. Try again later."
  }
});

// Create Socket.IO server
const io = new Server(server, {
  cors: {
    origin: allowedOrigins,
    methods: ["GET", "POST"]
  }
});

// Make Socket.IO available in routes
app.set("io", io);

// Register API routes
app.use("/api/auth", authLimiter, authRoutes);

app.use("/api/users", userRoutes);

app.use("/api/posts", postRoutes);

app.use("/api/messages", messageRoutes);

app.use("/api/uploads", uploadRoutes);

app.use("/api/ai", aiLimiter, aiRoutes);

app.use("/api/notifications", notificationRoutes);

// Purposeful Gen Z activities (lessons, games, offline quests).
app.use("/api/circle", circleRoutes);

// Home route
app.get("/", (req, res) => {
  res.status(200).json({
    message: "Social Media Backend is running"
  });
});

// Health check
app.get("/api/health", (req, res) => {
  res.status(200).json({
    status: "success",
    message: "Backend API is healthy"
  });
});

// Authenticate Socket.IO users using JWT
io.use(async (socket, next) => {
  try {
    const token = socket.handshake.auth?.token;

    if (!token) {
      return next(
        new Error("Authentication required")
      );
    }

    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET,
      { algorithms: ["HS256"] }
    );

    const user = await User.findById(
      decoded.userId
    ).select("_id");

    if (!user) {
      return next(
        new Error("User not found")
      );
    }

    socket.userId = user.id;

    next();

  } catch (error) {
    next(
      new Error("Invalid or expired token")
    );
  }
});

// Real-time Socket.IO events
io.on("connection", (socket) => {
  console.log(
    "User connected:",
    socket.userId
  );

  // Each user joins their own room
  socket.join(`user:${socket.userId}`);

  // Real-time private messaging
  socket.on("send_message", async (data, callback) => {
    try {
      const recipient = data?.recipient;
      const text = data?.text;

      if (
        typeof recipient !== "string" ||
        !mongoose.isValidObjectId(recipient) ||
        recipient === socket.userId ||
        typeof text !== "string" ||
        !text.trim() ||
        text.length > 2000
      ) {
        return callback?.({
          success: false,
          message: "Invalid message data"
        });
      }

      // Check recipient exists
      const recipientExists = await User.exists({
        _id: recipient
      });

      if (!recipientExists) {
        return callback?.({
          success: false,
          message: "Recipient not found"
        });
      }

      // Save message in MongoDB
      const message = await Message.create({
        sender: socket.userId,
        recipient,
        text: text.trim()
      });

      const messageData = {
        id: message.id,
        sender: socket.userId,
        recipient,
        text: message.text,
        createdAt: message.createdAt
      };

      // Send message to recipient
      io.to(`user:${recipient}`).emit(
        "new_message",
        messageData
      );

      // Sync sender's other devices
      socket.to(`user:${socket.userId}`).emit(
        "new_message",
        messageData
      );

      // Confirm message was sent
      callback?.({
        success: true,
        message: messageData
      });

    } catch (error) {
      console.error(
        "Socket message error:",
        error.message
      );

      callback?.({
        success: false,
        message: "Unable to send message"
      });
    }
  });

  // User disconnects
  socket.on("disconnect", (reason) => {
    console.log(
      "User disconnected:",
      socket.userId,
      reason
    );
  });
});

// Handle unknown routes
app.use((req, res) => {
  res.status(404).json({
    message: "Route not found"
  });
});

// Express 5 automatically forwards async errors here
app.use(errorMiddleware);

// Start server after MongoDB connects
async function startServer() {
  try {
    if (
      !process.env.JWT_SECRET ||
      process.env.JWT_SECRET.length < 32
    ) {
      throw new Error(
        "JWT_SECRET must contain at least 32 characters"
      );
    }

    await connectDB();

    server.listen(PORT, () => {
      console.log(
        `Server running on port ${PORT}`
      );

      console.log(
        `API URL: http://localhost:${PORT}`
      );

      console.log(
        "Socket.IO initialized successfully"
      );
    });

  } catch (error) {
    console.error(
      "Server startup failed:",
      error.message
    );

    process.exit(1);
  }
}

// Handle port errors
server.on("error", (error) => {
  console.error(
    "HTTP server error:",
    error.message
  );

  process.exit(1);
});

startServer();
