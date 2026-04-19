const express = require("express");
const router = express.Router();
const Notification = require("../models/Notification");
const authMiddleware = require("../middleware/authMiddleware");

router.use(authMiddleware);

// GET ALL NOTIFICATIONS FOR USER
router.get("/", async (req, res, next) => {
  try {
    const notifications = await Notification.find({ user: req.user._id })
      .sort({ createdAt: -1 })
      .limit(50); // Get latest 50

    const unreadCount = notifications.filter(n => !n.isRead).length;

    res.json({ success: true, notifications, unreadCount });
  } catch (error) {
    next(error);
  }
});

// MARK A NOTIFICATION AS READ
router.put("/:id/read", async (req, res, next) => {
  try {
    const notification = await Notification.findOneAndUpdate(
      { _id: req.params.id, user: req.user._id },
      { isRead: true },
      { new: true }
    );
    
    if (!notification) {
      return res.status(404).json({ success: false, message: "Notification not found" });
    }

    res.json({ success: true, notification });
  } catch (error) {
    next(error);
  }
});

// MARK ALL AS READ
router.put("/read-all", async (req, res, next) => {
  try {
    await Notification.updateMany(
      { user: req.user._id, isRead: false },
      { isRead: true }
    );
    res.json({ success: true, message: "All notifications marked as read" });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
