/**
 * Custom NoSQL injection sanitizer compatible with Express 5.
 *
 * express-mongo-sanitize tries to reassign req.query, which is a
 * read-only getter in Express 5. This middleware sanitizes req.body
 * and req.params only (query strings are already read-only and the
 * query parser in Express 5 does not allow object injection by default).
 */

function sanitizeObject(obj) {
  if (obj === null || obj === undefined) return obj;
  if (typeof obj !== "object") return obj;

  for (const key of Object.keys(obj)) {
    // Remove keys that start with '$' (MongoDB operator injection)
    if (key.startsWith("$")) {
      delete obj[key];
      continue;
    }

    // Remove keys that contain '.' (nested field injection)
    if (key.includes(".")) {
      delete obj[key];
      continue;
    }

    // Recursively sanitize nested objects and arrays
    if (typeof obj[key] === "object") {
      sanitizeObject(obj[key]);
    }

    // Sanitize string values containing $ operators
    if (typeof obj[key] === "string" && obj[key].startsWith("$")) {
      obj[key] = obj[key].replace(/^\$/, "");
    }
  }

  return obj;
}

const mongoSanitize = (req, res, next) => {
  if (req.body) {
    sanitizeObject(req.body);
  }
  if (req.params) {
    sanitizeObject(req.params);
  }
  next();
};

module.exports = mongoSanitize;
