const Joi = require("joi");

const registerSchema = Joi.object({
  name: Joi.string().trim().min(2).max(50).required()
    .messages({
      "string.min": "Name must be at least 2 characters",
      "string.max": "Name must not exceed 50 characters",
      "any.required": "Name is required"
    }),
  username: Joi.string().trim().alphanum().min(3).max(20).required()
    .messages({
      "string.alphanum": "Username must only contain letters and numbers",
      "string.min": "Username must be at least 3 characters",
      "string.max": "Username must not exceed 20 characters",
      "any.required": "Username is required"
    }),
  email: Joi.string().trim().email().required()
    .messages({
      "string.email": "Please enter a valid email address",
      "any.required": "Email is required"
    }),
  password: Joi.string().min(6).max(128).required()
    .messages({
      "string.min": "Password must be at least 6 characters",
      "string.max": "Password must not exceed 128 characters",
      "any.required": "Password is required"
    })
});

const loginSchema = Joi.object({
  email: Joi.string().trim().email().required()
    .messages({
      "string.email": "Please enter a valid email address",
      "any.required": "Email is required"
    }),
  password: Joi.string().required()
    .messages({
      "any.required": "Password is required"
    })
});

const resourceUploadSchema = Joi.object({
  resourceName: Joi.string().trim().min(1).max(200).required()
    .messages({
      "string.min": "Resource name is required",
      "string.max": "Resource name must not exceed 200 characters",
      "any.required": "Resource name is required"
    }),
  description: Joi.string().trim().max(1000).allow("", null),
  teamId: Joi.string().allow("", null),
  userId: Joi.string().allow("", null),
  visibility: Joi.string().valid("public", "team_only").default("public")
});

// Middleware factory — validates req.body against a schema
const validate = (schema) => {
  return (req, res, next) => {
    const { error } = schema.validate(req.body, { abortEarly: false });
    if (error) {
      const messages = error.details.map(d => d.message);
      return res.status(400).json({
        success: false,
        message: messages[0],
        errors: messages
      });
    }
    next();
  };
};

module.exports = {
  registerSchema,
  loginSchema,
  resourceUploadSchema,
  validate
};
