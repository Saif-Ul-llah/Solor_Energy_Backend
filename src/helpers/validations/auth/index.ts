// const { body } = require('express-validator');
import { body } from "express-validator";

export const loginValidation = [
  // Validate that the email is a valid email address
  body("email").isEmail().withMessage("Invalid email address"),

  // Validate that the password has a minimum length of 6 characters
  body("password")
    .isLength({ min: 6 })
    .withMessage("Password must be at least 6 characters long"),
];
