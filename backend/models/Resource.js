const mongoose = require("mongoose");

const resourceSchema = new mongoose.Schema({
  resourceName: {
    type: String,
    required: true,
    trim: true
  },

  description: {
    type: String,
    trim: true
  },

  filePath: {
    type: String
  },

  fileUrl: {
    type: String
  },

  cloudinaryId: {
    type: String
  },

  teamId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Team",
    index: true
  },

  visibility: {
    type: String,
    enum: ["public", "team_only"],
    default: "public"
  },

  uploadedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    index: true
  },

  version: {
    type: Number,
    default: 1
  },
  
  downloadCount: {
    type: Number,
    default: 0
  },

  createdAt: {
    type: Date,
    default: Date.now,
    index: true
  }
});

// Compound index for version history queries
resourceSchema.index({ resourceName: 1, version: 1 });

module.exports = mongoose.model("Resource", resourceSchema);