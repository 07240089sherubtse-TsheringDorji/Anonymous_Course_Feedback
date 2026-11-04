
const { db } = require('../config/db');
const { getDb } = require('../config/mongo');

const getDashboard = async (req, res, next) => {
  try {
    const courses = await db.any(`
      SELECT id, code, title
      FROM courses
      ORDER BY id
    `);

    const feedbackCollection = getDb().collection('feedback');

    const results = await Promise.all(
      courses.map(async (course) => {
        const courseId = Number(course.id);

        const stats = await feedbackCollection.aggregate([
          { $match: { courseId } },
          {
            $group: {
              _id: '$courseId',
              totalFeedback: { $sum: 1 },
              averageRating: { $avg: '$rating' }
            }
          }
        ]).toArray();

        return {
          courseId,
          courseCode: course.code,
          courseTitle: course.title,
          totalFeedback: stats[0]?.totalFeedback || 0,
          averageRating: stats[0]
            ? Number(stats[0].averageRating.toFixed(2))
            : 0
        };
      })
    );

    res.status(200).json({
      success: true,
      message: 'Admin dashboard retrieved successfully',
      data: { courses: results }
    });
  } catch (error) {
    next(error);
  }
};

const getCourseFeedback = async (req, res, next) => {
  try {
    const courseId = Number(req.params.courseId);

    const course = await db.oneOrNone(
      'SELECT id, code, title FROM courses WHERE id = $1',
      [courseId]
    );

    if (!course) {
      return res.status(404).json({
        success: false,
        message: 'Course not found'
      });
    }

    const feedbackCollection = getDb().collection('feedback');

    const totalFeedback = await feedbackCollection.countDocuments({
      courseId
    });

    if (totalFeedback < 5) {
      return res.status(200).json({
        success: true,
        message: 'Individual feedback is hidden to protect anonymity',
        data: {
          course: {
            id: course.id,
            code: course.code,
            title: course.title
          },
          totalFeedback,
          commentsHidden: true,
          feedback: []
        }
      });
    }

    const feedback = await feedbackCollection.find(
      { courseId },
      {
        projection: {
          _id: 0,
          courseId: 1,
          rating: 1,
          comment: 1,
          createdAt: 1
        }
      }
    ).sort({ createdAt: -1 }).toArray();

    res.status(200).json({
      success: true,
      message: 'Course feedback retrieved successfully',
      data: {
        course: {
          id: course.id,
          code: course.code,
          title: course.title
        },
        totalFeedback,
        commentsHidden: false,
        feedback
      }
    });
  } catch (error) {
    next(error);
  }
};

const getCourseSummary = async (req, res, next) => {
  try {
    const courseId = Number(req.params.courseId);

    const course = await db.oneOrNone(
      'SELECT id, code, title FROM courses WHERE id = $1',
      [courseId]
    );

    if (!course) {
      return res.status(404).json({
        success: false,
        message: 'Course not found'
      });
    }

    const feedbackCollection = getDb().collection('feedback');

    const result = await feedbackCollection.aggregate([
      { $match: { courseId } },
      {
        $group: {
          _id: '$courseId',
          totalFeedback: { $sum: 1 },
          averageRating: { $avg: '$rating' },
          rating1: {
            $sum: { $cond: [{ $eq: ['$rating', 1] }, 1, 0] }
          },
          rating2: {
            $sum: { $cond: [{ $eq: ['$rating', 2] }, 1, 0] }
          },
          rating3: {
            $sum: { $cond: [{ $eq: ['$rating', 3] }, 1, 0] }
          },
          rating4: {
            $sum: { $cond: [{ $eq: ['$rating', 4] }, 1, 0] }
          },
          rating5: {
            $sum: { $cond: [{ $eq: ['$rating', 5] }, 1, 0] }
          }
        }
      }
    ]).toArray();

    const stats = result[0] || {
      totalFeedback: 0,
      averageRating: 0,
      rating1: 0,
      rating2: 0,
      rating3: 0,
      rating4: 0,
      rating5: 0
    };

    res.status(200).json({
      success: true,
      message: 'Course feedback summary retrieved successfully',
      data: {
        course: {
          id: course.id,
          code: course.code,
          title: course.title
        },
        totalFeedback: stats.totalFeedback,
        averageRating: Number(stats.averageRating.toFixed(2)),
        ratingDistribution: {
          1: stats.rating1,
          2: stats.rating2,
          3: stats.rating3,
          4: stats.rating4,
          5: stats.rating5
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getDashboard,
  getCourseFeedback,
  getCourseSummary
};
