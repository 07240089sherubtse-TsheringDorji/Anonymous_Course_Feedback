
const FeedbackSubmission = require('../models/FeedbackSubmission');
const Feedback = require('../models/Feedback');
const { db } = require('../config/db');

async function submitFeedback(req, res, next) {
  let submissionRecord = null;

  try {
    const studentId = req.user.id;
    const courseId = Number(req.body.courseId);
    const rating = Number(req.body.rating);
    const comment = typeof req.body.comment === 'string'
      ? req.body.comment.trim()
      : '';

    if (!Number.isInteger(courseId) || courseId < 1) {
      return res.status(400).json({
        success: false,
        message: 'A valid course ID is required'
      });
    }

    if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
      return res.status(400).json({
        success: false,
        message: 'Rating must be an integer between 1 and 5'
      });
    }

    if (!comment) {
      return res.status(400).json({
        success: false,
        message: 'A feedback comment is required'
      });
    }

    const enrollment = await FeedbackSubmission.findEnrollment(
      studentId,
      courseId
    );

    if (!enrollment) {
      return res.status(403).json({
        success: false,
        message: 'You must be enrolled in this course to submit feedback'
      });
    }

    const existingSubmission =
      await FeedbackSubmission.findSubmission(studentId, courseId);

    if (existingSubmission) {
      return res.status(409).json({
        success: false,
        message: 'You have already submitted feedback for this course this month'
      });
    }

    try {
      submissionRecord = await FeedbackSubmission.createSubmission(
        studentId,
        courseId
      );
    } catch (error) {
      if (error.code === '23505') {
        return res.status(409).json({
          success: false,
          message: 'You have already submitted feedback for this course this month'
        });
      }

      throw error;
    }

    try {
      const feedback = await Feedback.createFeedback(
        courseId,
        rating,
        comment
      );

      return res.status(201).json({
        success: true,
        message: 'Anonymous feedback submitted successfully',
        data: {
          feedback: {
            courseId: feedback.courseId,
            rating: feedback.rating,
            comment: feedback.comment,
            createdAt: feedback.createdAt
          }
        }
      });
    } catch (mongoError) {
      try {
        await FeedbackSubmission.deleteSubmissionById(
          submissionRecord.id
        );
      } catch (rollbackError) {
        console.error(
          'Could not roll back feedback submission:',
          rollbackError
        );
      }

      throw mongoError;
    }
  } catch (error) {
    next(error);
  }
}

const getMyFeedbackCount = async (req, res, next) => {
  try {
    const studentId = req.user.id;

    const result = await db.one(
      `SELECT COUNT(*)::int AS "feedbackCount"
       FROM feedback_submissions
       WHERE student_id = $1`,
      [studentId]
    );

    return res.status(200).json({
      success: true,
      message: 'Feedback submission count retrieved successfully',
      data: {
        feedbackCount: result.feedbackCount
      }
    });
  } catch (error) {
    next(error);
  }
};

const getMyMonthlyFeedbackStatus = async (req, res, next) => {
  try {
    const studentId = req.user.id;

    const dateResult = await db.one(
      `SELECT TO_CHAR(CURRENT_DATE, 'YYYY-MM-DD') AS "currentDate",
              TO_CHAR(
                DATE_TRUNC('month', CURRENT_DATE),
                'YYYY-MM'
              ) AS "submissionMonth"`
    );

    const submissions = await db.any(
      `SELECT
         course_id AS "courseId",
         TO_CHAR(submitted_on, 'YYYY-MM-DD') AS "submittedOn",
         TO_CHAR(
           (submission_month + INTERVAL '1 month')::DATE,
           'YYYY-MM-DD'
         ) AS "nextEligibleDate"
       FROM feedback_submissions
       WHERE student_id = $1
         AND submission_month =
             DATE_TRUNC('month', CURRENT_DATE)::DATE
       ORDER BY course_id`,
      [studentId]
    );

    return res.status(200).json({
      success: true,
      message: 'Monthly feedback status retrieved successfully',
      data: {
        currentDate: dateResult.currentDate,
        submissionMonth: dateResult.submissionMonth,
        submittedCourseIds: submissions.map(
          submission => Number(submission.courseId)
        ),
        submissions
      }
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  submitFeedback,
  getMyFeedbackCount,
  getMyMonthlyFeedbackStatus
};
