const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const PersonalDetails = require('../models/PersonalDetails');
const User = require('../models/User');
const { protect } = require('../middleware/auth');

// Create uploads directory if it doesn't exist
const uploadDir = path.join(__dirname, '../uploads/personal-details');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + '-' + file.originalname);
  },
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: (req, file, cb) => {
    const allowedTypes = /pdf|doc|docx|jpg|jpeg|png/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);

    if (extname && mimetype) {
      cb(null, true);
    } else {
      cb(new Error('Only PDF, DOC, DOCX, JPG, JPEG, PNG files are allowed'));
    }
  },
});

// @route   POST /api/details/save
// @desc    Save personal details
// @access  Private
router.post(
  '/save',
  protect,
  upload.fields([
    { name: 'document', maxCount: 1 },
    { name: 'marksheet', maxCount: 1 },
  ]),
  async (req, res, next) => {
    try {
      const userId = req.user._id;

      // Prepare documents data
      const documents = {};
      if (req.files['document']) {
        const file = req.files['document'][0];
        documents.idDocument = {
          filename: file.filename,
          originalName: file.originalname,
          path: file.path,
          size: file.size,
        };
      }
      if (req.files['marksheet']) {
        const file = req.files['marksheet'][0];
        documents.marksheet = {
          filename: file.filename,
          originalName: file.originalname,
          path: file.path,
          size: file.size,
        };
      }

      // Check if details already exist
      let personalDetails = await PersonalDetails.findOne({ userId });

      if (personalDetails) {
        // Update existing
        Object.assign(personalDetails, req.body);
        personalDetails.documents = documents;
        await personalDetails.save();
      } else {
        // Create new
        personalDetails = await PersonalDetails.create({
          userId,
          ...req.body,
          documents,
        });
      }

      // Update user to mark profile as completed
      await User.findByIdAndUpdate(userId, { hasCompletedProfile: true });

      res.json({
        success: true,
        message: 'Personal details saved successfully',
        userId: userId,
        fullName: `${req.body.firstName} ${req.body.lastName}`,
      });
    } catch (error) {
      // Clean up uploaded files on error
      if (req.files) {
        Object.values(req.files).forEach((fileArray) => {
          fileArray.forEach((file) => {
            if (fs.existsSync(file.path)) {
              fs.unlinkSync(file.path);
            }
          });
        });
      }

      if (error.name === 'ValidationError') {
        const messages = Object.values(error.errors).map((err) => err.message);
        return res.status(400).json({ success: false, error: messages.join(', ') });
      }
      next(error);
    }
  }
);

// @route   GET /api/details/me
// @desc    Get current user's personal details
// @access  Private
router.get('/me', protect, async (req, res, next) => {
  try {
    const personalDetails = await PersonalDetails.findOne({ userId: req.user._id });

    if (!personalDetails) {
      return res.status(404).json({
        success: false,
        message: 'Personal details not found',
      });
    }

    res.json({
      success: true,
      data: personalDetails,
    });
  } catch (error) {
    next(error);
  }
});

// @route   GET /api/details/check
// @desc    Check if user has completed personal details
// @access  Private
router.get('/check', protect, async (req, res) => {
  try {
    const personalDetails = await PersonalDetails.findOne({ userId: req.user._id });
    
    res.json({
      success: true,
      hasCompleted: !!personalDetails,
    });
  } catch (error) {
    res.json({
      success: true,
      hasCompleted: false,
    });
  }
});

module.exports = router;