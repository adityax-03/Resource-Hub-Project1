const express = require("express");
const router = express.Router();
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const rateLimit = require("express-rate-limit");
const User = require("../models/user");
const authMiddleware = require("../middleware/authMiddleware");
const { registerSchema, loginSchema, validate } = require("../middleware/validators");

// ── Rate Limiters ──

// Strict limiter for login (10 attempts per 15 min)
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: "Too many login attempts. Please try again after 15 minutes."
  }
});

// Moderate limiter for registration (10 per hour)
const registerLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: "Too many registration attempts. Please try again later."
  }
});

// REGISTER USER
router.post("/register", registerLimiter, validate(registerSchema), async (req, res, next) => {
  try {
    const { name, email, password, username } = req.body;

    // Normalize email to lowercase to prevent duplicates
    const normalizedEmail = email.toLowerCase().trim();
    const normalizedUsername = username.toLowerCase().trim();

    const existingEmail = await User.findOne({ email: normalizedEmail });
    if (existingEmail) {
      return res.status(400).json({
        success: false,
        message: "Email already exists"
      });
    }

    const existingUsername = await User.findOne({ username: normalizedUsername });
    if (existingUsername) {
      return res.status(400).json({
        success: false,
        message: "Username is already taken"
      });
    }

    const salt = await bcrypt.genSalt(12);
    const hashedPassword = await bcrypt.hash(password, salt);

    const newUser = new User({
      name: name.trim(),
      username: normalizedUsername,
      email: normalizedEmail,
      password: hashedPassword
    });

    await newUser.save();

    res.status(201).json({
      success: true,
      message: "User registered successfully"
    });

  } catch (error) {
    next(error);
  }
});

// LOGIN USER
router.post("/login", loginLimiter, validate(loginSchema), async (req, res, next) => {
  try {
    const { email, password } = req.body;

    // Normalize email to lowercase
    const normalizedEmail = email.toLowerCase().trim();

    // Generic error message prevents user enumeration
    const INVALID_CREDS = { success: false, message: "Invalid credentials" };

    const user = await User.findOne({ email: normalizedEmail });
    if (!user) {
      return res.status(401).json(INVALID_CREDS);
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json(INVALID_CREDS);
    }

    const token = jwt.sign(
      { id: user._id },
      process.env.JWT_SECRET,
      { expiresIn: "1d" }
    );

    const userResponse = {
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      teamId: user.teamId
    };

    res.json({
      success: true,
      message: "Login successful",
      token,
      user: userResponse
    });

  } catch (error) {
    next(error);
  }
});

// UPDATE PROFILE
router.post("/update-profile", authMiddleware, async (req, res, next) => {
  try {
    const { name, password } = req.body;
    const updateData = {};

    if (name && name.trim()) {
      updateData.name = name.trim();
    }
    
    if (password && password.length >= 6) {
      const salt = await bcrypt.genSalt(12);
      updateData.password = await bcrypt.hash(password, salt);
    }

    if (Object.keys(updateData).length === 0) {
      return res.status(400).json({ success: false, message: "Nothing to update" });
    }

    const updatedUser = await User.findByIdAndUpdate(req.user._id, updateData, { new: true });
    
    // Generate new token to keep session alive gracefully (optional, but good practice)
    const token = jwt.sign(
      { id: updatedUser._id },
      process.env.JWT_SECRET,
      { expiresIn: "1d" }
    );

    res.json({
      success: true,
      message: "Profile updated successfully",
      token,
      user: {
        _id: updatedUser._id,
        name: updatedUser.name,
        email: updatedUser.email,
        role: updatedUser.role,
        teamId: updatedUser.teamId
      }
    });

  } catch (error) {
    next(error);
  }
});

// VERIFY USER TOKEN
router.get("/verify", authMiddleware, (req, res) => {
  res.json({ success: true, message: "Token is valid", user: req.user });
});

// DELETE ACCOUNT (ACCOUNT DEACTIVATION)
router.delete("/delete-account", authMiddleware, async (req, res, next) => {
  try {
    const userId = req.user._id;

    // Remove user completely
    await User.findByIdAndDelete(userId);

    // Also remove from all teams they belong to
    const Team = require("../models/Team");
    await Team.updateMany(
      { members: userId },
      { $pull: { members: userId } }
    );

    // Option B Implementation: Keep resources uploaded by the user so we don't break logic.
    // They will just remain attached to the unresolvable userId (functioning like an "Unknown User").

    res.json({ success: true, message: "Account successfully deactivated and deleted." });
  } catch (error) {
    next(error);
  }
});

module.exports = router;