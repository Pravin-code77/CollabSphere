import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';

import authRoutes from './routes/authRoutes';
import projectRoutes from './routes/projectRoutes';
import profileRoutes from './routes/profileRoutes';
import notificationRoutes from './routes/notificationRoutes';

dotenv.config();

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
    cors: { origin: '*' }
});

app.use(cors());
app.use(express.json());

// Request logger
app.use((req, res, next) => {
    console.log(`${req.method} ${req.url}`);
    next();
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/profiles', profileRoutes);
app.use('/api/notifications', notificationRoutes);

app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', message: 'Backend is connected', timestamp: new Date() });
});

import Message from './models/Message';
import Project from './models/Project';
import Notification from './models/Notification';

// Socket.io handlers
io.on('connection', (socket) => {
    console.log('User connected:', socket.id);

    socket.on('join_project', (data) => {
        const { projectId, userId } = typeof data === 'string' ? { projectId: data, userId: null } : data;
        socket.join(projectId);
        if (userId) (socket as any).userId = userId;
        console.log(`User ${userId || socket.id} joined project room: ${projectId}`);
    });

    socket.on('send_message', async (data) => {
        try {
            // data: { projectId, senderId, text, senderName }
            const newMessage = new Message({
                projectId: data.projectId,
                senderId: data.senderId,
                text: data.text
            });
            await newMessage.save();

            // Broadcast message to everyone in the project room
            const messagePayload = {
                ...data,
                createdAt: newMessage.createdAt
            };
            io.to(data.projectId).emit('new_message', messagePayload);

            // Notify offline members
            const project = await Project.findById(data.projectId);
            if (project) {
                const members = [project.ownerId.toString(), ...project.members.map(m => m.toString())];

                // Get list of users currently in the project room
                const socketsInRoom = await io.in(data.projectId).fetchSockets();
                const activeUserIds = new Set(socketsInRoom.map(s => (s as any).userId));

                // Identify members who are NOT in the room and NOT the sender
                const offlineMembers = members.filter(mId =>
                    mId !== data.senderId && !activeUserIds.has(mId)
                );

                for (const memberId of offlineMembers) {
                    const notification = new Notification({
                        recipient: memberId,
                        type: 'message',
                        title: `New Message: ${project.title}`,
                        message: `${data.senderName}: ${data.text.substring(0, 50)}${data.text.length > 50 ? '...' : ''}`,
                        data: {
                            projectId: project._id,
                            project: project
                        }
                    });
                    await notification.save();
                }
            }
        } catch (error) {
            console.error('Socket send_message error:', error);
        }
    });

    socket.on('disconnect', () => {
        console.log('User disconnected');
    });
});

// Database connection
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/collabsphere';

mongoose.connect(MONGODB_URI)
    .then(() => {
        console.log('Connected to MongoDB');
        const PORT = process.env.PORT || 5000;
        server.listen(PORT, () => {
            console.log(`Server running on port ${PORT}`);
        });
    })
    .catch(err => console.error('MongoDB connection error:', err));
