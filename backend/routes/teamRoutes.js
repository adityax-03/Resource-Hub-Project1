const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");
const Team = require("../models/Team");
const authMiddleware = require("../middleware/authMiddleware");
const roleMiddleware = require("../middleware/roleMiddleware");

// Apply authentication universally to all team routes
router.use(authMiddleware);

// create team — any user can create a team giving them ownership over the group
router.post("/create", async (req, res, next) => {
  try {
    const { teamName } = req.body;

    if (!teamName || !teamName.trim()) {
      return res.status(400).json({ success: false, message: "Team name is required" });
    }

    // SECURITY: Use authenticated user's ID, not client-supplied userId
    const newTeam = new Team({
      teamName: teamName.trim(),
      createdBy: req.user._id,
      members: [req.user._id]
    });

    await newTeam.save();

    res.json({
      message: "Team created successfully",
      team: newTeam
    });

  } catch (error) {
    next(error);
  }
});

// GET ALL TEAMS (with populated members)
router.get("/all", async (req, res, next) => {
  try {
    const teams = await Team.find()
      .populate("members", "name username role")
      .populate("createdBy", "name username")
      .sort({ createdAt: -1 });
    res.json({ teams });
  } catch (error) {
    next(error);
  }
});

// GET ALL REGISTERED USERS (for team member listing)
router.get("/members", async (req, res, next) => {
  try {
    const User = mongoose.model("User");
    const users = await User.find()
      .select("name username role lastActive createdAt")
      .sort({ createdAt: -1 });
    res.json({ users, count: users.length });
  } catch (error) {
    next(error);
  }
});

// ADD MEMBER TO TEAM — open to all users who create a team
router.post("/add-member", async (req, res, next) => {
    try {
  
      const { teamId, userId } = req.body;

      if (!teamId || !userId) {
        return res.status(400).json({ success: false, message: "teamId and userId are required" });
      }
  
      const team = await Team.findById(teamId);
  
      if (!team) {
        return res.status(404).json({
          message: "Team not found"
        });
      }
  
      // Prevent adding duplicate members
      if (team.members.map(m => m.toString()).includes(userId)) {
        return res.status(400).json({
          message: "User is already a member of this team"
        });
      }

      // Verify userId is a valid user
      const User = mongoose.model("User");
      const userToAdd = await User.findById(userId);
      if (!userToAdd) {
        return res.status(404).json({ message: "User not found" });
      }

      // add user to members array
      team.members.push(userId);
  
      await team.save();
  
      res.json({
        message: "Member added successfully",
        team
      });
  
    } catch (error) {
      next(error);
    }
  });
// REMOVE MEMBER FROM TEAM — Only global admin OR team creator
router.post("/remove-member", async (req, res, next) => {
  try {
    const { teamId, userId } = req.body;

    if (!teamId || !userId) {
      return res.status(400).json({ success: false, message: "teamId and userId are required" });
    }

    const team = await Team.findById(teamId);
    if (!team) {
      return res.status(404).json({ success: false, message: "Team not found" });
    }

    // SECURITY VERIFICATION
    const isGlobalAdmin = req.user.role === "admin";
    const isTeamCreator = team.createdBy?.toString() === req.user._id.toString();
    
    if (!isGlobalAdmin && !isTeamCreator) {
      return res.status(403).json({ success: false, message: "Forbidden: Only admins or the team creator can remove members" });
    }

    // Protect creator from being entirely removed
    if (userId === team.createdBy?.toString() && !isGlobalAdmin) {
      return res.status(400).json({ success: false, message: "Team creator cannot be removed" });
    }

    // Remove user from the members array
    team.members = team.members.filter(m => m.toString() !== userId);
    await team.save();

    res.json({
      success: true,
      message: "Member removed successfully",
      team
    });

  } catch (error) {
    next(error);
  }
});

module.exports = router;