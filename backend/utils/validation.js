
const mongoose = require("mongoose");

// Check whether an ID is a valid MongoDB ObjectId
function isValidId(id) {
  return typeof id === "string" &&
    mongoose.isObjectIdOrHexString(id);
}

// Return user details without sensitive information
function safeUser(user) {
  if (!user) return null;

  const data =
    typeof user.toObject === "function"
      ? user.toObject()
      : { ...user };

  delete data.password;
  delete data.__v;

  return data;
}

module.exports = {
  isValidId,
  safeUser
};
