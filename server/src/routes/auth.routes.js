const express = require('express');
const rateLimit = require('express-rate-limit');
const { z } = require('zod');
const User = require('../models/User');
const { validate } = require('../middleware/validate');
const {
  generateToken,
  setAuthCookie,
  clearAuthCookie,
  requireAuth
} = require('../middleware/auth');

const router = express.Router();

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Too many login attempts. Please try again after 15 minutes.' }
});

const registerSchema = z.object({
  userId: z
    .string()
    .trim()
    .toLowerCase()
    .min(3, 'User ID must be at least 3 characters')
    .max(30, 'User ID cannot exceed 30 characters')
    .regex(/^[a-z0-9._-]+$/, 'User ID can only contain letters, numbers, dots, hyphens and underscores'),
  displayName: z
    .string()
    .trim()
    .min(2, 'Name must be at least 2 characters')
    .max(60, 'Name cannot exceed 60 characters'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
}).strict();

const setupSchema = z.object({
  userId: z
    .string()
    .trim()
    .toLowerCase()
    .min(3, 'User ID must be at least 3 characters')
    .max(30, 'User ID cannot exceed 30 characters')
    .regex(/^[a-z0-9._-]+$/, 'User ID can only contain letters, numbers, dots, hyphens and underscores'),
  displayName: z
    .string()
    .trim()
    .min(2, 'Name must be at least 2 characters')
    .max(60, 'Name cannot exceed 60 characters'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
}).strict();

const loginSchema = z.object({
  userId: z.string().trim().toLowerCase().min(1, 'User ID is required'),
  password: z.string().min(1, 'Password is required')
}).strict();

const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: z.string().min(8, 'New password must be at least 8 characters')
}).strict();

router.get('/setup-status', async (req, res, next) => {
  try {
    const userCount = await User.countDocuments();
    res.json({ needsSetup: userCount === 0 });
  } catch (err) {
    next(err);
  }
});

router.post('/register', validate(registerSchema), async (req, res, next) => {
  try {
    const { userId, displayName, password } = req.body;

    const existingUser = await User.findOne({ userId });
    if (existingUser) {
      return res.status(409).json({ message: 'User ID is already in use.' });
    }

    const totalUsers = await User.countDocuments();
    const role = totalUsers === 0 ? 'admin' : 'manager';

    const passwordHash = await User.hashPassword(password);
    const user = await User.create({
      userId,
      displayName,
      passwordHash,
      role,
      isActive: true,
      mustChangePassword: false,
      lastLoginAt: new Date()
    });

    const token = generateToken(user);
    setAuthCookie(res, token);

    res.status(201).json(user);
  } catch (err) {
    next(err);
  }
});

router.post('/setup', validate(setupSchema), async (req, res, next) => {
  try {
    const userCount = await User.countDocuments();
    if (userCount > 0) {
      return res.status(404).json({ message: 'Setup is already complete.' });
    }

    const { userId, displayName, password } = req.body;
    const passwordHash = await User.hashPassword(password);

    const user = await User.create({
      userId,
      displayName,
      passwordHash,
      role: 'admin',
      isActive: true,
      mustChangePassword: false,
      lastLoginAt: new Date()
    });

    const token = generateToken(user);
    setAuthCookie(res, token);

    res.status(201).json(user);
  } catch (err) {
    next(err);
  }
});

router.post('/login', loginLimiter, validate(loginSchema), async (req, res, next) => {
  try {
    const { userId, password } = req.body;
    const user = await User.findOne({ userId }).select('+passwordHash');

    if (!user || !user.isActive) {
      return res.status(401).json({ message: 'User ID or password is incorrect.' });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ message: 'User ID or password is incorrect.' });
    }

    user.lastLoginAt = new Date();
    await user.save();

    const token = generateToken(user);
    setAuthCookie(res, token);

    res.json(user);
  } catch (err) {
    next(err);
  }
});

router.post('/logout', (req, res) => {
  clearAuthCookie(res);
  res.json({ message: 'Logged out successfully.' });
});

router.get('/me', requireAuth, (req, res) => {
  res.json(req.user);
});

router.post('/change-password', requireAuth, validate(changePasswordSchema), async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const user = await User.findById(req.user._id).select('+passwordHash');

    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) {
      return res.status(400).json({ message: 'Current password is incorrect.' });
    }

    user.passwordHash = await User.hashPassword(newPassword);
    user.mustChangePassword = false;
    await user.save();

    res.json({ message: 'Password changed successfully.' });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
