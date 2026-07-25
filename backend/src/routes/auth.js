const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const userService = require('../services/userService');
const auth = require('../middleware/auth');

// @route   POST api/auth/login
// @desc    Authenticate user & get token
// @access  Public
router.post('/login', async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ message: 'Please provide both username and password' });
  }

  try {
    // Check for user
    const user = await userService.findUserByUsername(username);
    if (!user) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    // Compare passwords
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    // Generate JWT
    const payload = {
      user: {
        id: user._id || user.id,
        username: user.username,
        role: user.role
      }
    };

    const secret = process.env.JWT_SECRET || 'sekar-dairy-farm-fallback-secret-key-123';
    jwt.sign(
      payload,
      secret,
      { expiresIn: '7d' }, // 7 days expiration
      (err, token) => {
        if (err) throw err;
        res.json({
          token,
          user: {
            id: user._id || user.id,
            username: user.username,
            role: user.role
          }
        });
      }
    );
  } catch (err) {
    console.error('Login error:', err.message);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET api/auth/verify
// @desc    Verify current JWT token and return user details
// @access  Private
router.get('/verify', auth, async (req, res) => {
  try {
    const user = await userService.findUserByUsername(req.user.username);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json({
      user: {
        id: user._id || user.id,
        username: user.username,
        role: user.role
      }
    });
  } catch (err) {
    console.error('Verify error:', err.message);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
