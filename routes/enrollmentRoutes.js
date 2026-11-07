
const express = require('express');
const { body, param } = require('express-validator');

const enrollmentController = require('../controllers/enrollmentController');
const authenticateToken = require('../middleware/authMiddleware');
const requireRole = require('../middleware/roleMiddleware');
const validateRequest = require('../middleware/validateRequest');

const router = express.Router();

router.use(authenticateToken);

const studentIdValidation = param('studentId')
    .isInt({ min: 1 })
    .withMessage('Student ID must be a positive integer.');

const courseIdValidation = param('courseId')
    .isInt({ min: 1 })
    .withMessage('Course ID must be a positive integer.');

const courseBodyValidation = body('courseId')
    .isInt({ min: 1 })
    .withMessage('Course ID must be a positive integer.');

router.get(
    '/available',
    requireRole('student'),
    enrollmentController.getAvailableCourses
);

router.post(
    '/self',
    requireRole('student'),
    [courseBodyValidation],
    validateRequest,
    enrollmentController.enrollSelf
);

router.delete(
    '/self/:courseId',
    requireRole('student'),
    [courseIdValidation],
    validateRequest,
    enrollmentController.unenrollSelf
);

router.get(
    '/me',
    requireRole('student'),
    enrollmentController.getMyEnrollments
);

router.post(
    '/',
    requireRole('admin'),
    [
        body('studentId')
            .isInt({ min: 1 })
            .withMessage('Valid student ID is required.'),
        courseBodyValidation
    ],
    validateRequest,
    enrollmentController.enrollStudent
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

router.delete(
    '/student/:studentId/course/:courseId',
    requireRole('admin'),
    [studentIdValidation, courseIdValidation],
    validateRequest,
    enrollmentController.removeEnrollment
);

module.exports = router;
