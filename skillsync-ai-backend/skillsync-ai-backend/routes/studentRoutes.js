const express = require('express');
const router = express.Router();
const Student = require('../models/Student');
const User = require('../models/User');
const { optionalAuth } = require('../middleware/authMiddleware');

// @route   GET /api/students/profile
// @desc    Get primary student profile (authenticated user or latest)
router.get('/profile', optionalAuth, async (req, res) => {
  try {
    let student = null;
    if (req.user) {
      if (req.user.student) {
        student = await Student.findById(req.user.student);
      }
      if (!student) {
        student = await Student.findOne({ email: req.user.email });
      }
    }

    if (!student) {
      student = await Student.findOne().sort({ updatedAt: -1 });
    }

    if (!student) {
      student = await Student.create({
        fullName: req.user ? req.user.name : 'Alex Morgan',
        email: req.user ? req.user.email : 'student@university.edu',
        college: 'Annasaheb Dange College of Engineering and Technology, Ashta',
        department: 'Department of Artificial Intelligence & Data Science'
      });
    }

    res.json({ success: true, data: student });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// @route   PUT /api/students/profile
// @desc    Update student personal, academic, and platform information
router.put('/profile', optionalAuth, async (req, res) => {
  try {
    let student = null;
    if (req.user) {
      if (req.user.student) {
        student = await Student.findById(req.user.student);
      }
      if (!student) {
        student = await Student.findOne({ email: req.user.email });
      }
    }

    if (!student) {
      student = await Student.findOne().sort({ updatedAt: -1 });
    }

    if (!student) {
      student = new Student(req.body);
    } else {
      // Clean targetRole and customTargetRole
      if (req.body.targetRole) {
        student.targetRole = req.body.targetRole;
      }
      if (req.body.customTargetRole !== undefined) {
        student.customTargetRole = req.body.customTargetRole;
      }
      Object.assign(student, req.body);
    }
    await student.save();

    res.json({
      success: true,
      message: 'Student Profile updated in MongoDB database successfully',
      data: student
    });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
});

// @route   POST /api/students/reset
// @desc    Reset student profile to template defaults
router.post('/reset', optionalAuth, async (req, res) => {
  try {
    let targetEmail = req.user ? req.user.email : 'student@university.edu';
    let targetName = req.user ? req.user.name : 'Alex Morgan';

    await Student.deleteMany({ email: targetEmail });
    const newStudent = await Student.create({
      fullName: targetName,
      email: targetEmail,
      college: 'Annasaheb Dange College of Engineering and Technology, Ashta',
      department: 'Department of Artificial Intelligence & Data Science'
    });

    if (req.user) {
      req.user.student = newStudent._id;
      await req.user.save();
    }

    res.json({
      success: true,
      message: 'Database reset to default candidate profile',
      data: newStudent
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
