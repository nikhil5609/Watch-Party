const { body } = require('express-validator');

exports.signupValidator = [
  body('username')
    .trim()
    .notEmpty()
    .withMessage('Username is required')
    .isLength({ min: 3 })
    .withMessage('Username must be at least 3 characters'),

  body('email')
    .trim()
    .isEmail()
    .withMessage('Invalid email'),

  body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters'),
];

exports.loginValidator = [
  body('email')
    .trim()
    .isEmail()
    .withMessage('Invalid email'),

  body('password')
    .notEmpty()
    .withMessage('Password is required'),
];
