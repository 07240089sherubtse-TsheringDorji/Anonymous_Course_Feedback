const bcrypt = require('bcrypt');
const User = require('../models/User');
const { createToken } = require('../utils/jwt');

async function register(req, res, next) {
  try {
    const { name, email, password } = req.body;

    const existingUser = await User.findUserByEmail(email);

    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: 'An account with this email already exists'
      });
    }

    const passwordHash = await bcrypt.hash(password, 12);

    const user = await User.createUser({
      name,
      email,
      passwordHash
    });

    return res.status(201).json({
      success: true,
      message: 'Student registered successfully',
      data: {
        user
      }
    });
  } catch (error) {
    // Handles a duplicate email if two requests arrive concurrently.
    if (error.code === '23505') {
      return res.status(409).json({
        success: false,
        message: 'An account with this email already exists'
      });
    }

    next(error);
  }
}

async function login(req, res, next) {
  try {
    const { email, password } = req.body;

    const user = await User.findUserByEmail(email);

    // Keep the public error identical for unknown email and wrong password.
    if (!user || !(await bcrypt.compare(password, user.password_hash))) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    const token = createToken(user);

    return res.status(200).json({
      success: true,
      message: 'Login successful',
      data: {
        token,
        tokenType: 'Bearer',
        expiresIn: process.env.JWT_EXPIRES_IN || '1h',
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role
        }
      }
    });
  } catch (error) {
    next(error);
  }
}

async function getMe(req, res, next) {
  try {
    const user = await User.findUserById(req.user.id);

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'User account is no longer available'
      });
    }

    return res.status(200).json({
      success: true,
      message: 'User profile retrieved successfully',
      data: {
        user
      }
    });
  } catch (error) {
    next(error);
  }
}

function adminCheck(req, res) {
  return res.status(200).json({
    success: true,
    message: 'Admin authorization successful',
    data: {
      userId: req.user.id,
      role: req.user.role
    }
  });
}

module.exports = {
  register,
  login,
  getMe,
  adminCheck
};