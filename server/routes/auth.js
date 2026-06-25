const express = require('express');
const rateLimit = require('express-rate-limit');
const User = require('../models/User');
const { generateToken, authMiddleware } = require('../middleware/auth');

const router = express.Router();
const authLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 20 });

router.post('/register', authLimiter, async (req, res) => {
  try {
    const { email, password, name } = req.body;
    if (!email || !password) return res.status(400).json({ message: 'Email and password required' });
    if (password.length < 6) return res.status(400).json({ message: 'Password must be at least 6 characters' });
    if (name && name.length < 2) return res.status(400).json({ message: 'Name must be at least 2 characters' });
    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing) return res.status(400).json({ message: 'Email already registered' });
    const user = await User.create({ email, password, name: name || 'User' });
    const token = generateToken(user._id);
    res.status(201).json({ token, user: { _id: user._id, email: user.email, name: user.name } });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.post('/login', authLimiter, async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ message: 'Email and password required' });
    const user = await User.findOne({ email: email.toLowerCase() }).select('+password');
    if (!user) return res.status(401).json({ message: 'Invalid credentials' });
    const isMatch = await user.comparePassword(password);
    if (!isMatch) return res.status(401).json({ message: 'Invalid credentials' });
    const token = generateToken(user._id);
    res.json({ token, user: { _id: user._id, email: user.email, name: user.name } });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.get('/me', authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json(user);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.put('/profile', authMiddleware, async (req, res) => {
  try {
    const { name, title, location, skills, bio } = req.body;
    const updates = {};
    if (name !== undefined) { if (name.length > 100) return res.status(400).json({ message: 'Name too long' }); updates.name = name; }
    if (title !== undefined) { if (title.length > 100) return res.status(400).json({ message: 'Title too long' }); updates.title = title; }
    if (location !== undefined) { if (location.length > 100) return res.status(400).json({ message: 'Location too long' }); updates.location = location; }
    if (skills !== undefined) { if (skills.length > 20) return res.status(400).json({ message: 'Too many skills' }); updates.skills = skills; }
    if (bio !== undefined) { if (bio.length > 500) return res.status(400).json({ message: 'Bio too long' }); updates.bio = bio; }
    const user = await User.findByIdAndUpdate(req.userId, updates, { new: true });
    res.json(user);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.post('/logout', authMiddleware, async (req, res) => {
  res.json({ message: 'Logged out successfully' });
});

module.exports = router;
