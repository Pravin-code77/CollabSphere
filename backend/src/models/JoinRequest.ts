import mongoose, { Schema, Document } from 'mongoose';

export interface IJoinRequest extends Document {
    projectId: mongoose.Types.ObjectId;
    senderId: mongoose.Types.ObjectId;
    message: string;
    status: 'pending' | 'accepted' | 'rejected';
    createdAt: Date;
    updatedAt: Date;
}

const JoinRequestSchema: Schema = new Schema({
    projectId: { type: Schema.Types.ObjectId, ref: 'Project', required: true },
    senderId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    message: { type: String, required: true },
    status: { type: String, enum: ['pending', 'accepted', 'rejected'], default: 'pending' }
}, { timestamps: true });

export default mongoose.model<IJoinRequest>('JoinRequest', JoinRequestSchema);
