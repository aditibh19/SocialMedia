
const jwt = require("jsonwebtoken");
const User = require("../models/User");

module.exports = async function authMiddleware(req, res, next) {
  const match = /^Bearer (\S+)$/.exec(
    req.headers.authorization || ""
  );

  if (!match) {
    return res.status(401).json({
      message: "Access denied. No token provided"
    });
  }

  try {
    const payload = jwt.verify(
      match[1],
      process.env.JWT_SECRET,
      { algorithms: ["HS256"] }
    );

    const user = await User.findById(payload.userId)
      .select("_id");

    if (!user) {
      return res.status(401).json({
        message: "User no longer exists"
      });
    }

    req.user = { id: user.id };

    next();
  } catch {
    return res.status(401).json({
      message: "Invalid or expired token"
    });
  }
};
