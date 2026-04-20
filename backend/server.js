const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const path = require("path");
const rateLimit = require("express-rate-limit");
const mongoSanitize = require("./middleware/sanitize");
require("dotenv").config();

const connectDB = require("./config/db");
const authRoutes = require("./routes/authRoutes");
const teamRoutes = require("./routes/teamRoutes");
const resourceRoutes = require("./routes/resourceRoutes");
const notificationRoutes = require("./routes/notificationRoutes");
const errorHandler = require("./middleware/errorHandler");

// ── Startup Validation — fail fast if critical env vars are missing ──
const requiredEnv = ["MONGO_URI", "JWT_SECRET"];
for (const key of requiredEnv) {
  if (!process.env[key]) {
    console.error(`FATAL: Missing required environment variable: ${key}`);
    process.exit(1);
  }
}

const app = express();
const isProd = process.env.NODE_ENV === "production";

// ── Security Middleware ──

// Secure HTTP headers
app.use(helmet({
  contentSecurityPolicy: false, // Disable CSP to allow inline styles in React
  crossOriginEmbedderPolicy: false
}));

// CORS — restricted to allowed origins (not needed in production if same origin)
const allowedOrigins = (process.env.CORS_ORIGIN || "http://localhost:3000")
  .split(",")
  .map(o => o.trim());

app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (like Postman)
    if (!origin) return callback(null, true);

    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    } else {
      return callback(new Error("Not allowed by CORS"));
    }
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
  allowedHeaders: ["Content-Type", "Authorization"],
  exposedHeaders: ["Content-Disposition"]
}));


// Body parser with size limit
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// Prevent NoSQL injection attacks
app.use(mongoSanitize);

// Global rate limiter (300 requests per 15 min per IP)
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: "Too many requests, please try again later."
  }
});
app.use("/api", globalLimiter);

// ── Connect Database ──
connectDB();

// ── API Routes ──
app.use("/api/auth", authRoutes);
app.use("/api/team", teamRoutes);
app.use("/api/resource", resourceRoutes);
app.use("/api/notifications", notificationRoutes);

// Health check
app.get("/api/health", (req, res) => {
  res.json({ success: true, message: "API Running", environment: process.env.NODE_ENV || "development" });
});

// ── 404 handler for undefined API routes ──
app.use("/api", (req, res) => {
  res.status(404).json({ success: false, message: "API endpoint not found" });
});

// ── Serve React Frontend in Production ──
if (isProd) {
  const buildPath = path.join(__dirname, "..", "frontend", "build");
  app.use(express.static(buildPath));

  // SPA catch-all — serve index.html for all non-API routes
  app.use((req, res) => {
    res.sendFile(path.join(buildPath, "index.html"));
  });
} else {
  app.get("/", (req, res) => {
    res.json({ success: true, message: "API Running — Development Mode" });
  });
}

// ── Global Error Handler (must be last) ──
app.use(errorHandler);

// ── Graceful Shutdown ──
const shutdown = (signal) => {
  console.log(`\n${signal} received. Shutting down gracefully...`);
  server.close(() => {
    console.log("Server closed.");
    process.exit(0);
  });
  // Force shutdown after 10 seconds
  setTimeout(() => process.exit(1), 10000);
};

// ── Start Server ──
const PORT = process.env.PORT || 5001;

const server = app.listen(PORT, () => {
  console.log(`Server running on port ${PORT} [${process.env.NODE_ENV || "development"}]`);
});

process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT", () => shutdown("SIGINT"));
