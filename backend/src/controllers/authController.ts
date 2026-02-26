import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import User from '../models/User';
import Profile from '../models/Profile';
import { AuthRequest } from '../middleware/auth';

export const register = async (req: Request, res: Response) => {
    try {
        const { email, password, username } = req.body;

        const existingUser = await User.findOne({ $or: [{ email }, { username }] });
        if (existingUser) {
            return res.status(400).json({ message: 'User already exists' });
        }

        const user = new User({ email, password, username });
        await user.save();

        // Create empty profile
        const profile = new Profile({ userId: user._id });
        await profile.save();

        const token = jwt.sign(
            { id: user._id, email: user.email, username: user.username },
            process.env.JWT_SECRET || 'hackathon_secret',
            { expiresIn: '24h' }
        );

        res.status(201).json({ token, user: { id: user._id, email, username } });
    } catch (error: any) {
        console.error('Registration error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

export const login = async (req: Request, res: Response) => {
    try {
        const { email, password } = req.body;

        const user = await User.findOne({ email });
        if (!user || !(await user.comparePassword(password))) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        const token = jwt.sign(
            { id: user._id, email: user.email, username: user.username },
            process.env.JWT_SECRET || 'hackathon_secret',
            { expiresIn: '24h' }
        );

        res.json({ token, user: { id: user._id, email: user.email, username: user.username } });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

export const updateMe = async (req: AuthRequest, res: Response) => {
    try {
        const { username } = req.body;

        if (!username || !username.trim()) {
            return res.status(400).json({ message: 'Username is required' });
        }

        const trimmed = username.trim().toLowerCase().replace(/\s+/g, '_');

        // Check if another user already owns this username
        const existing = await User.findOne({ username: trimmed });
        if (existing && String(existing._id) !== req.user?.id) {
            return res.status(409).json({ message: 'Username is already taken' });
        }

        const user = await User.findByIdAndUpdate(
            req.user?.id,
            { username: trimmed },
            { new: true }
        );

        if (!user) return res.status(404).json({ message: 'User not found' });

        res.json({ user: { id: user._id, email: user.email, username: user.username } });
    } catch (error) {
        console.error('Update user error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};
