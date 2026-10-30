const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Student = require('../models/Student');
const { protect } = require('../middleware/authMiddleware');

// Helper to generate JWT token and send response
const sendTokenResponse = async (user, statusCode, res, message = 'Authentication successful') => {
  const token = jwt.sign(
    { id: user._id, email: user.email, role: user.role },
    process.env.JWT_SECRET || 'skillsync_ai_super_secret_jwt_key_2026_secured',
    { expiresIn: process.env.JWT_EXPIRE || '30d' }
  );

  let studentProfile = null;
  if (user.student) {
    studentProfile = await Student.findById(user.student);
  }
  if (!studentProfile) {
    studentProfile = await Student.findOne({ email: user.email });
  }

  res.status(statusCode).json({
    success: true,
    message,
    token,
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      studentId: studentProfile ? studentProfile._id : null
    },
    student: studentProfile
  });
};

// @route   POST /api/auth/register
// @desc    Register new user & create/link student profile
// @access  Public
router.post('/register', async (req, res) => {
  try {
    const { name, email, password, role = 'student', college, department, targetRole } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        error: 'Please provide name, email, and password'
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        error: 'Password must be at least 6 characters long'
      });
    }

    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        error: 'An account with this email address already exists. Please log in.'
      });
    }

    // Find or create associated student profile
    let student = await Student.findOne({ email: email.toLowerCase() });
    if (!student) {
      student = await Student.create({
        fullName: name,
        email: email.toLowerCase(),
        college: college || 'Annasaheb Dange College of Engineering and Technology, Ashta',
        department: department || 'Department of Artificial Intelligence & Data Science',
        targetRole: targetRole || 'ai_ml'
      });
    }

    const user = await User.create({
      name,
      email: email.toLowerCase(),
      password,
      role,
      student: student._id
    });

    sendTokenResponse(user, 201, res, 'User account registered and authenticated successfully');
  } catch (err) {
    console.error('[Register Error]:', err);
    res.status(500).json({
      success: false,
      error: err.message || 'Server error during registration'
    });
  }
});

// @route   POST /api/auth/login
// @desc    Authenticate user credentials & issue JWT token
// @access  Public
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        error: 'Please provide email and password'
      });
    }

    const user = await User.findOne({ email: email.toLowerCase() }).select('+password');
    if (!user) {
      return res.status(401).json({
        success: false,
        error: 'Invalid email or password credentials'
      });
    }

    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        error: 'Invalid email or password credentials'
      });
    }

    // Ensure user has student profile linked
    if (!user.student) {
      let student = await Student.findOne({ email: user.email });
      if (!student) {
        student = await Student.create({
          fullName: user.name,
          email: user.email
        });
      }
      user.student = student._id;
      await user.save();
    }

    sendTokenResponse(user, 200, res, 'User logged in successfully');
  } catch (err) {
    console.error('[Login Error]:', err);
    res.status(500).json({
      success: false,
      error: err.message || 'Server error during login'
    });
  }
});

// @route   GET /api/auth/me
// @desc    Get currently authenticated user & linked student details
// @access  Private (JWT)
router.get('/me', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    let student = null;
    if (user.student) {
      student = await Student.findById(user.student);
    }
    if (!student) {
      student = await Student.findOne({ email: user.email });
    }

    res.json({
      success: true,
      data: {
        user,
        student
      }
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      error: err.message || 'Server error retrieving authenticated profile'
    });
  }
});

// @route   POST /api/auth/logout
// @desc    Logout user / clear token on client
// @access  Public
router.post('/logout', (req, res) => {
  res.json({
    success: true,
    message: 'User logged out successfully. Token discarded on client.'
  });
});

module.exports = router;
