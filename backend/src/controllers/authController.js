import jwt from 'jsonwebtoken';
import User from '../models/User.js';

const createToken = (user) => jwt.sign({ id: user._id }, process.env.JWT_SECRET || 'change-this-secret', { expiresIn: '7d' });

export const signup = async (req, res) => {
  try {
    const { name, email, companyName, password, confirmPassword } = req.body;

    if (!name || !email || !password || !confirmPassword) {
      return res.status(400).json({ message: 'Name, email, company name, password, and confirmation are required' });
    }

    if (password !== confirmPassword) {
      return res.status(400).json({ message: 'Passwords do not match' });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(409).json({ message: 'User already exists' });
    }

    const user = await User.create({ name, email, companyName, password });
    const token = createToken(user);

    return res.status(201).json({
      token,
      user: { id: user._id, name: user.name, email: user.email, companyName: user.companyName }
    });
  } catch (error) {
    return res.status(500).json({ message: 'Signup failed', error: error.message });
  }
};

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const token = createToken(user);
    return res.json({
      token,
      user: { id: user._id, name: user.name, email: user.email, companyName: user.companyName }
    });
  } catch (error) {
    return res.status(500).json({ message: 'Login failed', error: error.message });
  }
};

export const logout = async (_req, res) => {
  return res.json({ message: 'Logged out successfully' });
};

export const profile = async (req, res) => {
  return res.json({
    user: {
      id: req.user._id,
      name: req.user.name,
      email: req.user.email,
      companyName: req.user.companyName,
      githubUsername: req.user.githubUsername
    }
  });
};
