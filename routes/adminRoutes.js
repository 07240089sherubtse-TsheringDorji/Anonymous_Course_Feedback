
const express = require('express');
const { param } = require('express-validator');

const {
  getDashboard,
  getCourseFeedback,
  getCourseSummary
} = require('../controllers/adminController');

const authenticateToken = require('../middleware/authMiddleware');
const requireRole = require('../middleware/roleMiddleware');
const validateRequest = require('../middleware/validateRequest');

const router = express.Router();

router.use(authenticateToken);
router.use(requireRole('admin'));

router.get('/dashboard', getDashboard);

router.get(
  '/feedback/:courseId',
  [
    param('courseId')
      .isInt({ min: 1 })
      .withMessage('Course ID must be a positive integer')
  ],
  validateRequest,
  getCourseFeedback
);

router.get(
  '/feedback/:courseId/summary',
  [
    param('courseId')
      .isInt({ min: 1 })
      .withMessage('Course ID must be a positive integer')
  ],
  validateRequest,
  getCourseSummary
);

module.exports = router;
