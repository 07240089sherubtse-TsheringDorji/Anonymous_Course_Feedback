
const express = require('express');
const { body, param } = require('express-validator');

const enrollmentController =
  require('../controllers/enrollmentController');

const authenticateToken =
  require('../middleware/authMiddleware');

const requireRole =
  require('../middleware/roleMiddleware');

const validateRequest =
  require('../middleware/validateRequest');

const router = express.Router();

router.use(authenticateToken);

const studentIdValidation = param('studentId')
  .isInt({ min: 1 })
  .withMessage('Student ID must be a positive integer');

const courseIdValidation = param('courseId')
  .isInt({ min: 1 })
  .withMessage('Course ID must be a positive integer');

router.post(
  '/',
  requireRole('admin'),
  [
    body('studentId')
      .isInt({ min: 1 })
      .withMessage('Student ID must be a positive integer'),

    body('courseId')
      .isInt({ min: 1 })
      .withMessage('Course ID must be a positive integer')
  ],
  validateRequest,
  enrollmentController.enrollStudent
);

router.get(
  '/me',
  requireRole('student'),
  enrollmentController.getMyEnrollments
);

router.get(
  '/student/:studentId',
  requireRole('admin'),
  [studentIdValidation],
  validateRequest,
  enrollmentController.getStudentEnrollments
);

router.get(
  '/check/:studentId/:courseId',
  requireRole('admin'),
  [studentIdValidation, courseIdValidation],
  validateRequest,
  enrollmentController.checkEnrollment
);

// Admin removes a student's enrollment.
router.delete(
  '/student/:studentId/course/:courseId',
  requireRole('admin'),
  [studentIdValidation, courseIdValidation],
  validateRequest,
  enrollmentController.removeEnrollment
);

module.exports = router;
