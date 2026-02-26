import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import Message from '../models/Message';

export const getProjectMessages = async (req: AuthRequest, res: Response) => {
    try {
        const { projectId } = req.params;
        const messages = await Message.find({ projectId })
            .populate('senderId', 'username')
            .sort({ createdAt: 1 });

        const formattedMessages = messages.map(m => ({
            projectId: m.projectId,
            senderId: (m.senderId as any)._id,
            senderName: (m.senderId as any).username,
            text: m.text,
            createdAt: m.createdAt
        }));

        res.json(formattedMessages);
    } catch (error) {
        console.error('Get messages error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};
