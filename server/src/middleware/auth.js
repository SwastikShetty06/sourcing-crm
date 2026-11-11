const jwt = require('jsonwebtoken');
const env = require('../config/env');
const User = require('../models/User');

const COOKIE_NAME = 'cpl_session';

function generateToken(user) {
  return jwt.sign(
    {
      sub: user._id.toString(),
      userId: user.userId,
      role: user.role
    },
    env.JWT_SECRET,
    { expiresIn: '7d' }
  );
}

function setAuthCookie(res, token) {
  res.cookie(COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: env.NODE_ENV === 'production',
    maxAge: 7 * 24 * 60 * 60 * 1000
  });
}

function clearAuthCookie(res) {
  res.clearCookie(COOKIE_NAME, {
    httpOnly: true,
    sameSite: 'lax',
    secure: env.NODE_ENV === 'production'
  });
}

async function requireAuth(req, res, next) {
  try {
    const token = req.cookies[COOKIE_NAME];
    if (!token) {
      return res.status(401).json({ message: 'Authentication required.' });
    }

    let decoded;
    try {
      decoded = jwt.verify(token, env.JWT_SECRET);
    } catch {
      clearAuthCookie(res);
      return res.status(401).json({ message: 'Session expired. Please log in again.' });
    }

    const user = await User.findById(decoded.sub);
    if (!user || !user.isActive) {
      clearAuthCookie(res);
      return res.status(401).json({ message: 'User account is inactive or not found.' });
    }

    req.user = user;

    if (user.mustChangePassword) {
      const allowedPaths = [
        '/api/auth/me',
        '/api/auth/change-password',
        '/api/auth/logout'
      ];
      const isAllowed = allowedPaths.some(p => req.originalUrl.startsWith(p));
      if (!isAllowed) {
        return res.status(403).json({
          message: 'Password change required before using other features.',
          mustChangePassword: true
        });
      }
    }

    next();
  } catch (err) {
    next(err);
  }
}

function requireAdmin(req, res, next) {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Admin access required.' });
  }
  next();
}

module.exports = {
  COOKIE_NAME,
  generateToken,
  setAuthCookie,
  clearAuthCookie,
  requireAuth,
  requireAdmin
};
