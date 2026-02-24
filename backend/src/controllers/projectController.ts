import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import Project from '../models/Project';
import Profile from '../models/Profile';
import { CompatibilityService } from '../services/matching/compatibility';

export const createProject = async (req: AuthRequest, res: Response) => {
    try {
        const project = new Project({
            ...req.body,
            ownerId: req.user?.id
        });
        await project.save();
        res.status(201).json(project);
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
};

export const getProjects = async (req: AuthRequest, res: Response) => {
    try {
        const projects = await Project.find().populate('ownerId', 'username');
        res.json(projects);
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
};

export const getProjectMatches = async (req: AuthRequest, res: Response) => {
    try {
        const { projectId } = req.params;
        const project = await Project.findById(projectId);
        const profile = await Profile.findOne({ userId: req.user?.id });

        if (!project || !profile) {
            return res.status(404).json({ message: 'Not found' });
        }

        const match = await CompatibilityService.computeCompatibility(profile, project);
        res.json(match);
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
};
