
// const Course = require('../models/Course');

// async function createCourse(req, res, next) {
//   try {
//     const { code, title, description } = req.body;

//     const course = await Course.createCourse({
//       code,
//       title,
//       description: description || null,
//       createdBy: req.user.id
//     });

//     return res.status(201).json({
//       success: true,
//       message: 'Course created successfully',
//       data: { course }
//     });
//   } catch (error) {
//     if (error.code === '23505') {
//       return res.status(409).json({
//         success: false,
//         message: 'A course with this code already exists'
//       });
//     }

//     next(error);
//   }
// }

// async function getAllCourses(req, res, next) {
//   try {
//     const courses = await Course.findAllCourses();

//     return res.status(200).json({
//       success: true,
//       message: 'Courses retrieved successfully',
//       data: {
//         count: courses.length,
//         courses
//       }
//     });
//   } catch (error) {
//     next(error);
//   }
// }

// async function getCourseById(req, res, next) {
//   try {
//     const course = await Course.findCourseById(Number(req.params.id));

//     if (!course) {
//       return res.status(404).json({
//         success: false,
//         message: 'Course not found'
//       });
//     }

//     return res.status(200).json({
//       success: true,
//       message: 'Course retrieved successfully',
//       data: { course }
//     });
//   } catch (error) {
//     next(error);
//   }
// }

// async function updateCourse(req, res, next) {
//   try {
//     const { code, title, description } = req.body;

//     const course = await Course.updateCourse(
//       Number(req.params.id),
//       {
//         code,
//         title,
//         description: description || null
//       }
//     );

//     if (!course) {
//       return res.status(404).json({
//         success: false,
//         message: 'Course not found'
//       });
//     }

//     return res.status(200).json({
//       success: true,
//       message: 'Course updated successfully',
//       data: { course }
//     });
//   } catch (error) {
//     if (error.code === '23505') {
//       return res.status(409).json({
//         success: false,
//         message: 'A course with this code already exists'
//       });
//     }

//     next(error);
//   }
// }

// async function deleteCourse(req, res, next) {
//   try {
//     const id = Number(req.params.id);

//     const existingCourse = await Course.findCourseById(id);

//     if (!existingCourse) {
//       return res.status(404).json({
//         success: false,
//         message: 'Course not found'
//       });
//     }

//     const deletedCourse = await Course.deleteCourse(id);

//     if (!deletedCourse) {
//       return res.status(409).json({
//         success: false,
//         message: 'Course cannot be deleted because it has enrollments or feedback submissions'
//       });
//     }

//     return res.status(200).json({
//       success: true,
//       message: 'Course deleted successfully'
//     });
//   } catch (error) {
//     if (error.code === '23503') {
//       return res.status(409).json({
//         success: false,
//         message: 'Course cannot be deleted because related records exist'
//       });
//     }

//     next(error);
//   }
// }

// module.exports = {
//   createCourse,
//   getAllCourses,
//   getCourseById,
//   updateCourse,
//   deleteCourse
// };



const Course = require('../models/Course');

async function createCourse(req, res, next) {
  try {
    const { code, title, description } = req.body;

    const course = await Course.createCourse({
      code,
      title,
      description: description || null,
      createdBy: req.user.id
    });

    return res.status(201).json({
      success: true,
      message: 'Course created successfully',
      data: { course }
    });
  } catch (error) {
    if (error.code === '23505') {
      return res.status(409).json({
        success: false,
        message: 'A course with this code already exists'
      });
    }

    next(error);
  }
}

async function getAllCourses(req, res, next) {
  try {
    const courses = await Course.findAllCourses();

    return res.status(200).json({
      success: true,
      message: 'Courses retrieved successfully',
      data: {
        count: courses.length,
        courses
      }
    });
  } catch (error) {
    next(error);
  }
}

async function getCourseById(req, res, next) {
  try {
    const course = await Course.findCourseById(Number(req.params.id));

    if (!course) {
      return res.status(404).json({
        success: false,
        message: 'Course not found'
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Course retrieved successfully',
      data: { course }
    });
  } catch (error) {
    next(error);
  }
}

async function updateCourse(req, res, next) {
  try {
    const { code, title, description } = req.body;

    const course = await Course.updateCourse(
      Number(req.params.id),
      {
        code,
        title,
        description: description || null
      }
    );

    if (!course) {
      return res.status(404).json({
        success: false,
        message: 'Course not found'
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Course updated successfully',
      data: { course }
    });
  } catch (error) {
    if (error.code === '23505') {
      return res.status(409).json({
        success: false,
        message: 'A course with this code already exists'
      });
    }

    next(error);
  }
}

async function deleteCourse(req, res, next) {
  try {
    const id = Number(req.params.id);

    const existingCourse = await Course.findCourseById(id);

    if (!existingCourse) {
      return res.status(404).json({
        success: false,
        message: 'Course not found'
      });
    }

    const deletedCourse = await Course.deleteCourse(id);

    if (!deletedCourse) {
      return res.status(409).json({
        success: false,
        message: 'This course cannot be deleted because it has existing enrollments or feedback submissions. Please keep the course to protect its records.'
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Course deleted successfully',
      data: {
        course: existingCourse
      }
    });
  } catch (error) {
    if (error.code === '23503') {
      return res.status(409).json({
        success: false,
        message: 'This course cannot be deleted because related records exist.'
      });
    }

    next(error);
  }
}

module.exports = {
  createCourse,
  getAllCourses,
  getCourseById,
  updateCourse,
  deleteCourse
};
