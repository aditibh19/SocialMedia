
const multer = require("multer");

function errorMiddleware(err, req, res, next) {
  console.error("Backend error:", err.message);

  if (err.code === "LIMIT_FILE_SIZE") {
    return res.status(413).json({
      message: "Image must be smaller than 5MB"
    });
  }

  if (err instanceof multer.MulterError) {
    return res.status(400).json({
      message: "Invalid file upload"
    });
  }

  if (err.name === "ValidationError") {
    return res.status(400).json({
      message: "Invalid data provided"
    });
  }

  if (err.name === "CastError") {
    return res.status(400).json({
      message: "Invalid ID format"
    });
  }

  if (err.code === 11000) {
    return res.status(409).json({
      message: "This value already exists"
    });
  }

  if (err instanceof SyntaxError && "body" in err) {
    return res.status(400).json({
      message: "Invalid JSON body"
    });
  }

  return res.status(500).json({
    message: "Internal server error"
  });
}

module.exports = errorMiddleware;
