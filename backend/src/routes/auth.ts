import { Router, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import User from '../models/User';
import Account from '../models/Account';
import { emailService } from '../services/emailService';
import { UserStatus, UserRole } from '../constants/enums';

const router = Router();
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

// Login endpoint
router.post('/login', async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    // Validate input
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email and password are required',
      });
    }

    // Find user by email
    const user = await User.findOne({ email }).select('+password');

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password',
      });
    }

    // Check if user is active
    if (user.status !== UserStatus.ACTIVE) {
      return res.status(403).json({
        success: false,
        message: 'Account is inactive',
      });
    }

    // Compare password
    const isPasswordValid = await user.comparePassword(password);

    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password',
      });
    }

    // Get user's account to include Account._id in JWT
    const account = await Account.findOne({ userId: user._id }).lean();

    // Generate JWT token with Account._id as accountId
    const token = jwt.sign(
      {
        userId: user._id.toString(),
        email: user.email,
        role: user.role,
        accountId: account?._id.toString() || user._id.toString(),
      },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    // Return user data (without password)
    const userResponse = {
      userId: user._id.toString(),
      email: user.email,
      name: user.name,
      role: user.role,
      accountId: account?._id.toString() || null,
    };

    res.json({
      success: true,
      message: 'Login successful',
      token,
      user: userResponse,
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
});

// Register endpoint with email verification
router.post('/register', async (req: Request, res: Response) => {
  try {
    const { email, password, name, role = 'client', accountId } = req.body;

    // Validate input
    if (!email || !password || !name) {
      return res.status(400).json({
        success: false,
        message: 'Email, password, and name are required',
      });
    }

    // Check if user exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: 'Email already registered',
      });
    }

    // Create new user
    const newUser = new User({
      email,
      password,
      name,
      role,
      accountId: role === 'client' ? accountId : null,
    });

    await newUser.save();

    // Send welcome email (async, don't wait for it)
    emailService.sendWelcomeEmail(email, name).catch((err: any) => {
      console.error('Failed to send welcome email:', err.message);
    });

    // Send admin notification (async)
    emailService.sendAdminSignupNotification(email, name, undefined, role).catch((err: any) => {
      console.error('Failed to send admin notification:', err.message);
    });

    // Get user's account to include Account._id in JWT
    const account = await Account.findOne({ userId: newUser._id }).lean();

    // Generate JWT token with Account._id as accountId
    const token = jwt.sign(
      {
        userId: newUser._id.toString(),
        email: newUser.email,
        role: newUser.role,
        accountId: account?._id.toString() || newUser._id.toString(),
      },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    const userResponse = {
      userId: newUser._id.toString(),
      email: newUser.email,
      name: newUser.name,
      role: newUser.role,
    };

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      token,
      user: userResponse,
    });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
});

module.exports = router;
