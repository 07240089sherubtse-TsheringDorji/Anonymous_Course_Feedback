
const express = require('express');
const { param } = require('express-validator');

const {
  getDashboard,
  getCourseFeedback,
  getCourseSummary,
  testFeedbackStorage
} = require('../controllers/adminController');

const authenticateToken = require('../middleware/authMiddleware');
const requireRole = require('../middleware/roleMiddleware');
const validateRequest = require('../middleware/validateRequest');

const router = express.Router();

router.use(authenticateToken);
router.use(requireRole('admin'));

const courseIdValidation = [
  param('courseId')
    .isInt({ min: 1 })
    .withMessage('Course ID must be a positive integer')
];

router.get('/dashboard', getDashboard);

// router.get('/test-feedback-storage', testFeedbackStorage);

router.get(
  '/feedback/:courseId',
  courseIdValidation,
  validateRequest,
  getCourseFeedback
);

router.get(
  '/feedback/:courseId/summary',
  courseIdValidation,
  validateRequest,
  getCourseSummary
);

module.exports = router;
