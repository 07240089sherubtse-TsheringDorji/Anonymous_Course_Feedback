
const express = require('express');
const { body, param } = require('express-validator');

const courseController = require('../controllers/courseController');
const authenticateToken = require('../middleware/authMiddleware');
const requireRole = require('../middleware/roleMiddleware');
const validateRequest = require('../middleware/validateRequest');

const router = express.Router();

router.use(authenticateToken);

const courseIdValidation = param('id')
  .isInt({ min: 1 })
  .withMessage('Course ID must be a positive integer');

const courseBodyValidation = [
  body('code')
    .trim()
    .isLength({ min: 2, max: 30 })
    .withMessage('Course code must contain 2 to 30 characters'),

  body('title')
    .trim()
    .isLength({ min: 2, max: 150 })
    .withMessage('Course title must contain 2 to 150 characters'),

  body('description')
    .optional({ values: 'null' })
    .isString()
    .withMessage('Description must be a string')
    .bail()
    .isLength({ max: 1000 })
    .withMessage('Description cannot exceed 1000 characters')
];

router.get('/', courseController.getAllCourses);

router.get(
  '/:id',
  [courseIdValidation],
  validateRequest,
  courseController.getCourseById
);

router.post(
  '/',
  requireRole('admin'),
  courseBodyValidation,
  validateRequest,
  courseController.createCourse
);

router.put(
  '/:id',
  requireRole('admin'),
  [courseIdValidation, ...courseBodyValidation],
  validateRequest,
  courseController.updateCourse
);

router.delete(
  '/:id',
  requireRole('admin'),
  [courseIdValidation],
  validateRequest,
  courseController.deleteCourse
);

module.exports = router;
