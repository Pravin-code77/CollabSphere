import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import Profile from '../models/Profile';
import User from '../models/User';
import Project from '../models/Project';
import JoinRequest from '../models/JoinRequest';
import { GitHubService } from '../services/github/githubService';

export const getProfile = async (req: AuthRequest, res: Response) => {
    try {
        let profile = await Profile.findOne({ userId: req.user?.id });
        if (!profile) {
            profile = new Profile({ userId: req.user?.id });
            await profile.save();
        }
        res.json(profile);
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
};

export const updateProfile = async (req: AuthRequest, res: Response) => {
    try {
        const profile = await Profile.findOneAndUpdate(
            { userId: req.user?.id },
            { $set: req.body },
            { new: true, upsert: true }
        );
        res.json(profile);
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
};

export const getGitHubSkills = async (req: AuthRequest, res: Response) => {
    try {
        const { githubUsername } = req.body;
        if (!githubUsername) {
            return res.status(400).json({ message: 'GitHub username required' });
        }

        const skills = await GitHubService.fetchUserSkills(githubUsername);

        // Update profile with new skills
        const profile = await Profile.findOneAndUpdate(
            { userId: req.user?.id },
            {
                $set: { githubUsername },
                $push: { skills: { $each: skills } }
            },
            { new: true }
        );

        res.json({ skills, profile });
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
};

export const deleteAccount = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user?.id;
        await Profile.findOneAndDelete({ userId });
        await User.findByIdAndDelete(userId);
        res.json({ message: 'Account deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
};

export const getDashboardData = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user?.id;

        const activeProjects = await Project.find({
            $or: [
                { ownerId: userId },
                { members: userId }
            ]
        }).populate('ownerId', 'username').sort({ updatedAt: -1 }).limit(5);

        const myProjectIds = await Project.find({ ownerId: userId }).distinct('_id');
        const pendingRequests = await JoinRequest.find({
            projectId: { $in: myProjectIds },
            status: 'pending'
        }).populate('senderId', 'username').populate('projectId', 'title');

        const profile = await Profile.findOne({ userId });
        const stats = {
            projectsCount: activeProjects.length,
            skillsCount: profile?.skills?.length || 0,
            requestsCount: pendingRequests.length
        };

        res.json({
            activeProjects,
            pendingRequests,
            stats,
            profile
        });
    } catch (error) {
        console.error('Dashboard error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};
