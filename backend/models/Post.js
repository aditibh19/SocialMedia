
const mongoose = require("mongoose");

const postSchema = new mongoose.Schema({
  author: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
    index: true
  },

  text: {
    type: String,
    default: "",
    maxlength: 2000
  },

  image: {
    type: String,
    default: ""
  },

  likes: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: "User"
  }],

  bookmarks: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: "User"
  }],

  comments: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },

    text: {
      type: String,
      required: true,
      maxlength: 1000
    },

    createdAt: {
      type: Date,
      default: Date.now
    }
  }]
}, { timestamps: true });

postSchema.index({ createdAt: -1 });

module.exports = mongoose.models.Post ||
  mongoose.model("Post", postSchema);
