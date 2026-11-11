const express = require('express');
const { z } = require('zod');
const User = require('../models/User');
const { validate } = require('../middleware/validate');
const { requireAuth, requireAdmin } = require('../middleware/auth');

const router = express.Router();

router.use(requireAuth, requireAdmin);

const createUserSchema = z.object({
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
    .min(8, 'Temporary password must be at least 8 characters'),
  role: z.enum(['admin', 'manager']).default('manager')
}).strict();

const updateUserSchema = z.object({
  displayName: z
    .string()
    .trim()
    .min(2, 'Name must be at least 2 characters')
    .max(60, 'Name cannot exceed 60 characters')
    .optional(),
  isActive: z.boolean().optional(),
  role: z.enum(['admin', 'manager']).optional()
}).strict();

const resetPasswordSchema = z.object({
  password: z
    .string()
    .min(8, 'Temporary password must be at least 8 characters')
}).strict();

router.get('/', async (req, res, next) => {
  try {
    const users = await User.find().sort({ createdAt: -1 });
    res.json(users);
  } catch (err) {
    next(err);
  }
});

router.post('/', validate(createUserSchema), async (req, res, next) => {
  try {
    const { userId, displayName, password, role } = req.body;

    const existing = await User.findOne({ userId });
    if (existing) {
      return res.status(409).json({ message: 'User ID is already in use.' });
    }

    const passwordHash = await User.hashPassword(password);
    const user = await User.create({
      userId,
      displayName,
      passwordHash,
      role: role || 'manager',
      isActive: true,
      mustChangePassword: true
    });

    res.status(201).json(user);
  } catch (err) {
    next(err);
  }
});

router.patch('/:id', validate(updateUserSchema), async (req, res, next) => {
  try {
    const targetUser = await User.findById(req.params.id);
    if (!targetUser) {
      return res.status(404).json({ message: 'User not found.' });
    }

    if (targetUser._id.equals(req.user._id)) {
      if (req.body.isActive === false) {
        return res.status(400).json({ message: 'You cannot deactivate your own account.' });
      }
      if (req.body.role && req.body.role !== 'admin') {
        return res.status(400).json({ message: 'You cannot remove your own admin privileges.' });
      }
    }

    if (req.body.displayName !== undefined) targetUser.displayName = req.body.displayName;
    if (req.body.isActive !== undefined) targetUser.isActive = req.body.isActive;
    if (req.body.role !== undefined) targetUser.role = req.body.role;

    await targetUser.save();
    res.json(targetUser);
  } catch (err) {
    next(err);
  }
});

router.post('/:id/reset-password', validate(resetPasswordSchema), async (req, res, next) => {
  try {
    const targetUser = await User.findById(req.params.id);
    if (!targetUser) {
      return res.status(404).json({ message: 'User not found.' });
    }

    targetUser.passwordHash = await User.hashPassword(req.body.password);
    targetUser.mustChangePassword = true;
    await targetUser.save();

    res.json({ message: 'Temporary password set successfully.' });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
