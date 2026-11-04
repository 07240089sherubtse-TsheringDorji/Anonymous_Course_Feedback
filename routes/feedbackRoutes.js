
const express = require('express');
const { body } = require('express-validator');

const feedbackController =
  require('../controllers/feedbackController');

const authenticateToken =
  require('../middleware/authMiddleware');

const requireRole =
  require('../middleware/roleMiddleware');

const validateRequest =
  require('../middleware/validateRequest');

const router = express.Router();


router.use(authenticateToken);


router.post(
  '/',
  requireRole('student'),
  [
    body('courseId')
      .isInt({ min: 1 })
      .withMessage('Course ID must be a positive integer'),

    body('rating')
      .isInt({ min: 1, max: 5 })
      .withMessage('Rating must be an integer between 1 and 5'),

    body('comment')
      .isString()
      .trim()
      .isLength({ min: 5, max: 1000 })
      .withMessage('Comment must contain 5 to 1000 characters')
  ],
  validateRequest,
  feedbackController.submitFeedback
);

module.exports = router;
