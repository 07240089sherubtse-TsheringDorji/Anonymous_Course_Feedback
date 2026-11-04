
const FeedbackSubmission = require('../models/FeedbackSubmission');
const Feedback = require('../models/Feedback');

async function submitFeedback(req, res, next) {
  let submissionRecord = null;

  try {
    const studentId = req.user.id;
    const courseId = Number(req.body.courseId);
    const rating = Number(req.body.rating);
    const comment = req.body.comment.trim();

   
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
        message: 'You have already submitted feedback for this course'
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
          message: 'You have already submitted feedback for this course'
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

module.exports = {
  submitFeedback
};
