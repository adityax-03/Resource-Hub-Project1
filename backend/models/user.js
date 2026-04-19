const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },

  username: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
    index: true
  },

  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
    index: true
  },

  password: {
    type: String,
    required: true
  },

  teamId: {
    type: String,
    default: null
  },

  role: {
    type: String,
    enum: ["admin", "member"],
    default: "member"
  },

  lastActive: {
    type: Date,
    default: Date.now
  },

  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Prevent OverwriteModelError — reuse existing model if already compiled
module.exports = mongoose.models.User || mongoose.model("User", userSchema);