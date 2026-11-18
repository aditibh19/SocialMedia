
const router = require("express").Router();
const multer = require("multer");
const { Readable } = require("stream");
const auth = require("../middleware/authMiddleware");
const cloudinary = require("../config/cloudinary");

const upload = multer({
  storage: multer.memoryStorage(),

  limits: {
    fileSize: 5 * 1024 * 1024
  },

  fileFilter: (req, file, cb) =>
    cb(
      null,
      [
        "image/jpeg",
        "image/png",
        "image/webp",
        "image/gif"
      ].includes(file.mimetype)
    )
});

router.post(
  "/image",
  auth,
  upload.single("image"),
  async (req, res) => {
    if (!req.file) {
      return res.status(400).json({
        message: "Provide a JPEG, PNG, WebP or GIF image (max 5MB)"
      });
    }

    if (
      !process.env.CLOUDINARY_CLOUD_NAME ||
      !process.env.CLOUDINARY_API_KEY ||
      !process.env.CLOUDINARY_API_SECRET
    ) {
      return res.status(503).json({
        message: "Cloudinary is not configured"
      });
    }

    try {
      const result = await new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
          {
            folder: "social-media",
            resource_type: "image"
          },
          (error, uploaded) =>
            error ? reject(error) : resolve(uploaded)
        );

        Readable.from(req.file.buffer).pipe(stream);
      });

      res.status(201).json({
        url: result.secure_url,
        publicId: result.public_id
      });
    } catch (error) {
      console.error("Upload error:", error.message);

      res.status(502).json({
        message: "Image upload failed"
      });
    }
  }
);

module.exports = router;
