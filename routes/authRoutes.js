const express = require('express');
const { body } = require('express-validator');

const authController = require('../controllers/authController');
const authenticateToken = require('../middleware/authMiddleware');
const requireRole = require('../middleware/roleMiddleware');
const validateRequest = require('../middleware/validateRequest');

const router = express.Router();

const emailValidation = body('email')
  .trim()
  .isEmail()
  .withMessage('Enter a valid email address')
  .normalizeEmail();

router.post(
  '/register',
  [
    body('name')
      .trim()
      .isLength({ min: 2, max: 100 })
      .withMessage('Name must contain between 2 and 100 characters'),

    emailValidation,

    body('password')
      .isString()
      .withMessage('Password must be a string')
      .bail()
      .custom((password) => {
        const byteLength = Buffer.byteLength(password, 'utf8');

        if (password.length < 12 || byteLength > 72) {
          throw new Error(
            'Password must be at least 12 characters and no more than 72 UTF-8 bytes'
          );
        }

        return true;
      })
  ],
  validateRequest,
  authController.register
);

router.post(
  '/login',
  [
    emailValidation,

    body('password')
      .isString()
      .withMessage('Password is required')
      .bail()
      .notEmpty()
      .withMessage('Password is required')
  ],
  validateRequest,
  authController.login
);

router.get(
  '/me',
  authenticateToken,
  authController.getMe
);

// Diagnostic endpoint to test role-based access.
// Keep it for the lab; it can also serve as an authorization self-check.
router.get(
  '/admin-check',
  authenticateToken,
  requireRole('admin'),
  authController.adminCheck
);

module.exports = router;