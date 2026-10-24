const jwt = require('jsonwebtoken');
const { getJwtSecret } = require('../utils/jwt');

function authenticateToken(req, res, next) {
  const authorization = req.headers.authorization;

  if (!authorization || !authorization.startsWith('Bearer ')) {
    return res.status(401).json({
      success: false,
      message: 'Authentication required'
    });
  }

  const token = authorization.slice(7).trim();

  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Authentication required'
    });
  }

  try {
    const payload = jwt.verify(token, getJwtSecret(), {
      algorithms: ['HS256']
    });

    const userId = Number(payload.sub);

    if (
      !Number.isSafeInteger(userId) ||
      userId <= 0 ||
      typeof payload.email !== 'string' ||
      !['student', 'admin'].includes(payload.role)
    ) {
      return res.status(401).json({
        success: false,
        message: 'Invalid or expired token'
      });
    }

    req.user = {
      id: userId,
      email: payload.email,
      role: payload.role
    };

    next();
  } catch (error) {
    if (error.message.startsWith('JWT_SECRET is missing')) {
      return next(error);
    }

    return res.status(401).json({
      success: false,
      message: 'Invalid or expired token'
    });
  }
}

module.exports = authenticateToken;