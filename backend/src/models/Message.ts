import mongoose, { Schema, Document } from 'mongoose';

export interface IMessageDocument extends Document {
    projectId: mongoose.Types.ObjectId;
    senderId: mongoose.Types.ObjectId;
    text: string;
}

const MessageSchema: Schema = new Schema({
    projectId: { type: Schema.Types.ObjectId, ref: 'Project', required: true },
    senderId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    text: { type: String, required: true }
}, { timestamps: true });

export default mongoose.model<IMessageDocument>('Message', MessageSchema);
