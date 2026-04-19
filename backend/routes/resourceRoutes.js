const express = require("express");
const router = express.Router();
const multer = require("multer");
const path = require("path");
const Resource = require("../models/Resource");
const Team = require("../models/Team");
const Notification = require("../models/Notification");
const authMiddleware = require("../middleware/authMiddleware");
const roleMiddleware = require("../middleware/roleMiddleware");
const { resourceUploadSchema, validate } = require("../middleware/validators");

// Apply authentication universally to all resource routes
router.use(authMiddleware);

// ── Allowed file types ──
const ALLOWED_EXTENSIONS = /\.(jpg|jpeg|png|gif|pdf|doc|docx|xls|xlsx|ppt|pptx|txt|zip|csv)$/i;
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

const fileFilter = (req, file, cb) => {
  if (ALLOWED_EXTENSIONS.test(file.originalname)) {
    cb(null, true);
  } else {
    cb(new Error("File type not allowed. Accepted: jpg, png, gif, pdf, doc, docx, xls, xlsx, ppt, pptx, txt, zip, csv"), false);
  }
};

// ── Storage Configuration ──
// Use Cloudinary if credentials are configured, otherwise fallback to local disk
let upload;
const isCloudinaryConfigured =
  process.env.CLOUD_NAME &&
  process.env.CLOUD_NAME !== "your_cloud_name" &&
  process.env.CLOUD_API_KEY &&
  process.env.CLOUD_API_KEY !== "your_api_key";

let cloudinary = null;

if (isCloudinaryConfigured) {
  const cloudinaryConfig = require("../config/cloudinary");
  cloudinary = cloudinaryConfig.cloudinary;
  upload = multer({
    storage: cloudinaryConfig.storage,
    limits: { fileSize: MAX_FILE_SIZE },
    fileFilter
  });
} else {
  console.log("⚠ Cloudinary not configured — using local disk storage for uploads.");
  const localStorage = multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, path.join(__dirname, "..", "uploads"));
    },
    filename: (req, file, cb) => {
      const uniqueName = Date.now() + "-" + Math.round(Math.random() * 1e9) + path.extname(file.originalname);
      cb(null, uniqueName);
    }
  });
  upload = multer({
    storage: localStorage,
    limits: { fileSize: MAX_FILE_SIZE },
    fileFilter
  });
}

// UPLOAD RESOURCE — validate body BEFORE accepting file via a pre-check,
// then multer processes the file, then full schema validation runs.
router.post("/upload", upload.single("file"), validate(resourceUploadSchema), async (req, res, next) => {
  try {
    const { resourceName, description, teamId, visibility } = req.body;

    if (!req.file) {
      return res.status(400).json({ success: false, message: "No file uploaded" });
    }

    // SECURITY: Use authenticated user's ID, not client-supplied userId
    const newResource = new Resource({
      resourceName,
      description,
      fileUrl: req.file.path || req.file.location,
      cloudinaryId: req.file.filename,
      filePath: req.file.path || req.file.location,
      teamId: teamId || undefined,
      visibility: visibility || "public",
      uploadedBy: req.user._id
    });

    await newResource.save();

    // -- Generate notifications for team members if applicable --
    if (teamId) {
      const team = await Team.findById(teamId);
      if (team && team.members && team.members.length > 0) {
        // Exclude the uploader from receiving their own notification
        const otherMembers = team.members.filter(m => m.toString() !== req.user._id.toString());
        
        if (otherMembers.length > 0) {
          const notifications = otherMembers.map(memberId => ({
            user: memberId,
            title: "New Team Resource",
            message: `${req.user.name} uploaded "${resourceName}" to ${team.teamName}`,
            link: "/resources"
          }));
          await Notification.insertMany(notifications);
        }
      }
    }

    res.json({
      success: true,
      message: "Resource uploaded successfully",
      resource: newResource
    });

  } catch (error) {
    next(error);
  }
});

// GET ALL RESOURCES (for the authenticated user)
router.get("/all", async (req, res, next) => {
  try {
    const Team = require("../models/Team");
    const userTeams = await Team.find({ members: req.user._id }).select("_id");
    const teamIds = userTeams.map(t => t._id);

    const query = req.user.role === "admin" ? {} : {
      $or: [
        { visibility: "public" },
        { visibility: "team_only", teamId: { $in: teamIds } },
        { uploadedBy: req.user._id }
      ]
    };

    const resources = await Resource.find(query)
      .populate("uploadedBy", "name username")
      .sort({ createdAt: -1 });
    res.json({ resources });
  } catch (error) {
    next(error);
  }
});

// GET DASHBOARD STATS
router.get("/stats", async (req, res, next) => {
  try {
    const Team = require("../models/Team");
    const userTeams = await Team.find({ members: req.user._id }).select("_id");
    const teamIds = userTeams.map(t => t._id);

    const query = req.user.role === "admin" ? {} : {
      $or: [
        { visibility: "public" },
        { visibility: "team_only", teamId: { $in: teamIds } },
        { uploadedBy: req.user._id }
      ]
    };

    const totalResources = await Resource.countDocuments(query);

    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    const uploadsThisWeek = await Resource.countDocuments({
      ...query,
      createdAt: { $gte: oneWeekAgo }
    });

    const totalDownloads = await Resource.aggregate([
      { $match: query },
      { $group: { _id: null, total: { $sum: "$downloadCount" } } }
    ]);

    res.json({
      totalResources,
      uploadsThisWeek,
      totalDownloads: totalDownloads[0]?.total || 0
    });
  } catch (error) {
    next(error);
  }
});

// GET TEAM RESOURCES
router.get("/team/:teamId", async (req, res, next) => {
  try {
    const resources = await Resource.find({ teamId: req.params.teamId });
    res.json({ resources });
  } catch (error) {
    next(error);
  }
});

// UPDATE RESOURCE (NEW VERSION) — only uploader or admin can update
router.put("/update/:resourceId", upload.single("file"), async (req, res, next) => {
  try {
    const resource = await Resource.findById(req.params.resourceId);

    if (!resource) {
      return res.status(404).json({ message: "Resource not found" });
    }

    // SECURITY: Only the original uploader or admin may update
    const isOwner = resource.uploadedBy?.toString() === req.user._id.toString();
    const isAdmin = req.user.role === "admin";
    if (!isOwner && !isAdmin) {
      return res.status(403).json({ success: false, message: "Forbidden: You can only update your own resources" });
    }

    if (!req.file) {
      return res.status(400).json({ message: "No file provided for update" });
    }

    // Delete old file from Cloudinary if it exists and Cloudinary is configured
    if (resource.cloudinaryId && cloudinary) {
      try {
        await cloudinary.uploader.destroy(resource.cloudinaryId);
      } catch (e) {
        console.warn("Could not delete old Cloudinary file:", e.message);
      }
    }

    // Update with new file
    resource.fileUrl = req.file.path || req.file.location;
    resource.cloudinaryId = req.file.filename;
    resource.filePath = req.file.path || req.file.location;
    resource.version += 1;

    await resource.save();

    res.json({
      message: "Resource updated successfully",
      resource
    });

  } catch (error) {
    next(error);
  }
});

// GET RESOURCE VERSION HISTORY
router.get("/versions/:resourceName", async (req, res, next) => {
  try {
    const resources = await Resource.find({
      resourceName: req.params.resourceName
    }).sort({ version: 1 });

    res.json({ versions: resources });

  } catch (error) {
    next(error);
  }
});

// DOWNLOAD RESOURCE (increment count and serve file)
router.get("/download/:resourceId", async (req, res, next) => {
  try {
    const resource = await Resource.findById(req.params.resourceId);

    if (!resource) {
      return res.status(404).json({ message: "Resource not found" });
    }

    // SECURITY: Ensure user has permission to download
    const Team = require("../models/Team");
    const userTeams = await Team.find({ members: req.user._id }).select("_id");
    const teamIds = userTeams.map(t => t._id.toString());
    const isOwner = resource.uploadedBy?.toString() === req.user._id.toString();
    const isAdmin = req.user.role === "admin";
    
    if (resource.visibility === "team_only" && !isOwner && !isAdmin) {
      if (!resource.teamId || !teamIds.includes(resource.teamId.toString())) {
        return res.status(403).json({ message: "Forbidden: You do not have access to this team resource" });
      }
    }

    resource.downloadCount += 1;
    await resource.save();

    // SECURITY: Only serve safe URLs (Cloudinary or local paths)
    const downloadUrl = resource.fileUrl || resource.filePath;
    if (!downloadUrl) {
      return res.status(404).json({ message: "File URL not available" });
    }

    // Validate URL to prevent open redirect
    const isCloudinaryUrl = downloadUrl.startsWith("https://res.cloudinary.com/");
    const isLocalPath = !downloadUrl.startsWith("http");
    if (!isCloudinaryUrl && !isLocalPath) {
      return res.status(400).json({ message: "Invalid download URL" });
    }

    // For local files, use res.download() since the path is a filesystem path
    if (isLocalPath) {
      const fs = require("fs");
      if (!fs.existsSync(downloadUrl)) {
        return res.status(404).json({ message: "File not found on disk" });
      }
      return res.download(downloadUrl, resource.resourceName + path.extname(downloadUrl));
    }

    // For Cloudinary URLs, redirect
    res.redirect(downloadUrl);

  } catch (error) {
    next(error);
  }
});

// DELETE RESOURCE (Uploader or Admin)
router.delete("/delete/:resourceId", async (req, res, next) => {
  try {
    const resource = await Resource.findById(req.params.resourceId);
    if (!resource) {
      return res.status(404).json({ message: "Resource not found" });
    }

    // SECURITY: Only original uploader or admin may delete
    const isOwner = resource.uploadedBy?.toString() === req.user._id.toString();
    const isAdmin = req.user.role === "admin";
    if (!isOwner && !isAdmin) {
      return res.status(403).json({ success: false, message: "Forbidden: You can only delete your own resources" });
    }

    // Delete file from Cloudinary if configured
    if (resource.cloudinaryId && cloudinary) {
      try {
        await cloudinary.uploader.destroy(resource.cloudinaryId);
      } catch (e) {
        console.warn("Could not delete Cloudinary file:", e.message);
      }
    }

    // Delete document from MongoDB
    await Resource.findByIdAndDelete(req.params.resourceId);

    res.json({ message: "Resource deleted successfully" });
  } catch (error) {
    next(error);
  }
});

module.exports = router;