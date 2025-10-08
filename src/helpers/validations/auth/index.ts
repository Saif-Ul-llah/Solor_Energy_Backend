import Joi from "joi";

// Login Validation schema
export const loginValidation = Joi.object({
  email: Joi.string()
    .email({ tlds: { allow: false } }) // disables top-level domain validation to allow any domain
    .required()
    .messages({
      "string.email": "Invalid email address",
      "any.required": "Email is required",
    }),

  password: Joi.string().min(6).required().messages({
    "string.min": "Password must be at least 6 characters long",
    "any.required": "Password is required",
  }),
});

// Register Validation schema
export const registerValidation = Joi.object({
  email: Joi.string()
    .email({ tlds: { allow: false } })
    .required()
    .messages({
      "string.email": "Invalid email address",
      "any.required": "Email is required",
    }),

  password: Joi.string().min(6).required().messages({
    "string.min": "Password must be at least 6 characters long",
    "any.required": "Password is required",
  }),

  fullName: Joi.string().min(1).required().messages({
    "string.base": "Full name must be a string",
    "string.empty": "Full name must be a string and not empty",
    "any.required": "Full name is required",
  }),

  phoneNumber: Joi.string().min(1).required().messages({
    "string.base": "Phone number must be a string",
    "string.empty": "Phone number must be a string and not empty",
    "any.required": "Phone number is required",
  }),

  role: Joi.string()
    .valid("ADMIN", "SUB_ADMIN", "DISTRIBUTOR", "INSTALLER", "CUSTOMER")
    .default("CUSTOMER")
    .messages({
      "any.only":
        "Role must be one of: ADMIN, SUB_ADMIN, DISTRIBUTOR, INSTALLER, CUSTOMER",
      "any.required": "Role is required",
    }),
  // when role == admin then parentId is not required
  parentId: Joi.string()
    .when("role", {
      is: "ADMIN",
      then: Joi.optional(),
      otherwise: Joi.required(),
    })
    .messages({
      "string.base": "Parent ID must be a string",
      "string.empty": "Parent ID must be a string and not empty",
      "any.required": "Parent ID is required unless role is ADMIN",
    }),
  imageUrl: Joi.string().uri().messages({
    "string.uri": "Image URL must be a valid URI",
    "string.base": "Image URL must be a string",
  }),
  language: Joi.string().required().messages({
    "string.base": "Language must be a string",
    "string.empty": "Language cannot be empty",
  }),
});

// reset password validation schema
export const resetPasswordValidation = Joi.object({
  newPassword: Joi.string().min(6).required().messages({
    "string.min": "Password must be at least 6 characters long",
    "any.required": "Password is required",
  }),

  email: Joi.string()
    .email({ tlds: { allow: false } })
    .required()
    .messages({
      "string.email": "Invalid email address",
      "any.required": "Email is required",
    }),
});

// Update user validation schema
export const updateUserValidation = Joi.object({
  userId: Joi.string().guid().required().messages({
    "string.base": "User ID must be a string",
    "string.guid": "User ID must be a valid UUID",
  }),
  
  fullName: Joi.string().min(1).optional().allow(null, "").messages({
    "string.base": "Full name must be a string",
    "string.empty": "Full name cannot be empty",
    "any.required": "Full name is required",
  }),

  phoneNumber: Joi.string().min(1).optional().allow(null, "").messages({
    "string.base": "Phone number must be a string",
    "string.empty": "Phone number cannot be empty",
    "any.required": "Phone number is required",
  }),

  imageUrl: Joi.string().uri().optional().allow(null, "").messages({
    "string.uri": "Image URL must be a valid URI",
    "string.base": "Image URL must be a string",
  }),

  parentId: Joi.string().optional().allow(null, "").messages({
    "string.base": "Parent ID must be a string",
    "string.empty": "Parent ID cannot be empty",
  }),
  TFA_enabled: Joi.boolean().optional().allow(null, "").messages({
    "boolean.base": "TFA_enabled must be a boolean",
  }),
  address: Joi.string().optional().allow(null, "").messages({
    "string.base": "Address must be a string",
    "string.empty": "Address cannot be empty",
  }),
 fcmToken: Joi.string().optional().allow(null, "").messages({
    "string.base": "FCM Token must be a string",
    "string.empty": "FCM Token cannot be empty",
  }),
});
