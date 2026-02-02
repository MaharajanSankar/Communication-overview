
const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

// In-memory OTP store (for development only — later use Redis or DB)
const otpStore = {};

// @route   POST /api/auth/register
router.post('/register', async (req, res) => {
  const { username, email, password } = req.body;

  try {
    let user = await User.findOne({ email });
    if (user) {
      return res.status(400).json({ success: false, message: 'User already exists' });
    }

    user = new User({ username, email, password });
    await user.save();

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRE });

    res.json({
      success: true,
      token,
      user: { id: user._id, username: user.username, email: user.email }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// @route   POST /api/auth/login
router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      return res.status(400).json({ success: false, message: 'Invalid credentials' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ success: false, message: 'Invalid credentials' });
    }

    // Generate 4-digit OTP (or 6-digit if you prefer)
    const otp = Math.floor(1000 + Math.random() * 9000);
    otpStore[user._id] = { otp, expires: Date.now() + 5 * 60 * 1000 }; // 5 min expiry

    console.log(`\n🔐 OTP for ${user.username} (${user.email}):`);
    console.log(`   🎯 ${otp}`);
    console.log(`   ⏰ Expires in 5 minutes\n`);

    res.json({
      success: true,
      message: 'Password correct. Check console for OTP.',
      userId: user._id,
      requiresOtp: true
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// @route   POST /api/auth/verify-otp
router.post('/verify-otp', async (req, res) => {
  const { userId, otp } = req.body;

  try {
    const record = otpStore[userId];
    if (!record) {
      return res.status(400).json({ success: false, message: 'No OTP found or expired' });
    }

    if (record.expires < Date.now()) {
      delete otpStore[userId];
      return res.status(400).json({ success: false, message: 'OTP expired' });
    }

    if (record.otp.toString() !== otp) {
      return res.status(400).json({ success: false, message: 'Invalid OTP' });
    }

    // OTP correct → clear it and issue real token
    delete otpStore[userId];

    const user = await User.findById(userId);
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRE });

    res.json({
      success: true,
      token,
      user: { id: user._id, username: user.username, email: user.email }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

module.exports = router;