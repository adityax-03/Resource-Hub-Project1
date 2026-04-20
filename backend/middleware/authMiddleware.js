const jwt = require("jsonwebtoken");
const User = require("../models/user");

const authMiddleware = async (req, res, next) => {
  const authHeader = req.header("Authorization");
  const queryToken = req.query.token;
  
  let token;
  if (authHeader && authHeader.startsWith("Bearer ")) {
    token = authHeader.split(" ")[1];
  } else if (queryToken) {
    token = queryToken;
  }

  if (!token) {
    return res.status(401).json({ message: "No token, authorization denied" });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Fetch full user, exclude password, and update lastActive
    req.user = await User.findByIdAndUpdate(
      decoded.id,
      { lastActive: new Date() },
      { new: true }
    ).select("-password");
    
    if (!req.user) {
      return res.status(401).json({ message: "User does not exist" });
    }

    next();
  } catch (err) {
    res.status(401).json({ message: "Token is not valid" });
  }
};

module.exports = authMiddleware;
