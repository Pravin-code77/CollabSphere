import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import Project from '../models/Project';
import Profile from '../models/Profile';
import JoinRequest from '../models/JoinRequest';
import Notification from '../models/Notification';
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
        const { search, status, urgency, skill } = req.query;
        let query: any = { status: { $ne: 'completed' } };

        if (search) {
            query.$or = [
                { title: { $regex: search, $options: 'i' } },
                { description: { $regex: search, $options: 'i' } },
                { 'requiredSkills.skill': { $regex: search, $options: 'i' } }
            ];
        }

        if (status) query.status = status;
        if (urgency) query.urgency = urgency;
        if (skill) {
            query['requiredSkills.skill'] = { $regex: skill, $options: 'i' };
        }

        const projects = await Project.find(query)
            .populate('ownerId', 'username githubUsername')
            .populate('members', 'username avatarUrl')
            .sort({ createdAt: -1 });
        res.json(projects);
    } catch (error) {
        console.error('Get projects error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

export const getRecommendedProjects = async (req: AuthRequest, res: Response) => {
    try {
        const profile = await Profile.findOne({ userId: req.user?.id });
        if (!profile) {
            return res.status(404).json({ message: 'Profile not found' });
        }

        // Fetch open projects not owned by or containing the user
        const projects = await Project.find({
            status: 'open',
            ownerId: { $ne: req.user?.id },
            members: { $ne: req.user?.id }
        }).populate('ownerId', 'username githubUsername');

        const matches = await Promise.all(projects.map(async (project) => {
            const match = await CompatibilityService.computeCompatibility(profile, project);
            return {
                ...project.toObject(),
                matchScore: match.score,
                matchBreakdown: match.breakdown
            };
        }));

        // Sort by match score descending and take top 5
        const recommended = matches
            .sort((a, b) => b.matchScore - a.matchScore)
            .slice(0, 5);

        res.json(recommended);
    } catch (error) {
        console.error('Get recommended projects error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

export const getMyProjects = async (req: AuthRequest, res: Response) => {
    try {
        const projects = await Project.find({ ownerId: req.user?.id })
            .populate('members', 'username')
            .sort({ createdAt: -1 });
        res.json(projects);
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
};

export const requestToJoin = async (req: AuthRequest, res: Response) => {
    try {
        const { projectId } = req.params;
        const { message } = req.body;

        // Check if project exists
        const project = await Project.findById(projectId);
        if (!project) {
            return res.status(404).json({ message: 'Project not found' });
        }

        // Check if user is owner
        if (project.ownerId.toString() === req.user?.id) {
            return res.status(400).json({ message: 'Owner cannot join their own project' });
        }

        // Check if already requested
        const existing = await JoinRequest.findOne({ projectId, senderId: req.user?.id });
        if (existing) {
            return res.status(400).json({ message: 'Join request already sent' });
        }

        const joinRequest = new JoinRequest({
            projectId,
            senderId: req.user?.id,
            message
        });
        await joinRequest.save();

        // Send notification to project owner
        const notification = new Notification({
            recipient: project.ownerId,
            type: 'request',
            title: 'New Join Request',
            message: `${req.user?.username} wants to join your project: ${project.title}`,
            data: {
                projectId: project._id,
                joinRequestId: joinRequest._id,
                senderId: req.user?.id,
                senderName: req.user?.username
            }
        });
        await notification.save();

        res.status(201).json(joinRequest);
    } catch (error) {
        console.error('Join request error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

export const respondToJoinRequest = async (req: AuthRequest, res: Response) => {
    try {
        const { requestId } = req.params;
        const { status } = req.body; // 'accepted' or 'rejected'

        if (!['accepted', 'rejected'].includes(status)) {
            return res.status(400).json({ message: 'Invalid status' });
        }

        const joinRequest = await JoinRequest.findById(requestId).populate('projectId');
        if (!joinRequest) {
            return res.status(404).json({ message: 'Join request not found' });
        }

        const project = joinRequest.projectId as any;
        if (project.ownerId.toString() !== req.user?.id) {
            return res.status(403).json({ message: 'Unauthorized' });
        }

        joinRequest.status = status;
        await joinRequest.save();

        if (status === 'accepted') {
            const projectToUpdate = await Project.findById(project._id);
            if (projectToUpdate && !projectToUpdate.members.some(m => String(m) === String(joinRequest.senderId))) {
                projectToUpdate.members.push(joinRequest.senderId);
                await projectToUpdate.save();
            }
        }

        // Notify the sender
        const notification = new Notification({
            recipient: joinRequest.senderId,
            type: 'system',
            title: `Join Request ${status.charAt(0).toUpperCase() + status.slice(1)}`,
            message: `Your request to join "${project.title}" has been ${status}.`,
            data: {
                projectId: project._id,
                status
            }
        });
        await notification.save();

        res.json({ message: `Request ${status} successfully`, joinRequest });
    } catch (error) {
        console.error('Respond to join request error:', error);
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

export const updateProject = async (req: AuthRequest, res: Response) => {
    try {
        const { projectId } = req.params;
        const { title, description, requiredSkills, status } = req.body;

        const project = await Project.findById(projectId);
        if (!project) {
            return res.status(404).json({ message: 'Project not found' });
        }

        if (project.ownerId.toString() !== req.user?.id) {
            return res.status(403).json({ message: 'Only the project owner can edit the project' });
        }

        if (title) project.title = title;
        if (description) project.description = description;
        if (requiredSkills) project.requiredSkills = requiredSkills;
        if (status) project.status = status;

        await project.save();
        const updatedProject = await Project.findById(projectId)
            .populate('ownerId', 'username')
            .populate('members', 'username');

        res.json(updatedProject);
    } catch (error) {
        console.error('Update project error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

export const deleteProject = async (req: AuthRequest, res: Response) => {
    try {
        const { projectId } = req.params;

        const project = await Project.findById(projectId);
        if (!project) {
            return res.status(404).json({ message: 'Project not found' });
        }

        if (project.ownerId.toString() !== req.user?.id) {
            return res.status(403).json({ message: 'Only the project owner can delete the project' });
        }

        await Project.findByIdAndDelete(projectId);
        res.json({ message: 'Project deleted successfully' });
    } catch (error) {
        console.error('Delete project error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};
