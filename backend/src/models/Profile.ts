import mongoose, { Schema, Document } from 'mongoose';

const SkillSchema = new Schema({
    name: { type: String, required: true },
    level: { type: String, enum: ['beginner', 'intermediate', 'advanced', 'expert'], default: 'intermediate' },
    verified: { type: Boolean, default: false },
    source: { type: String, enum: ['manual', 'github'], default: 'manual' },
    confidenceScore: { type: Number, default: 0 }
}, { _id: false });

export interface IProfileDocument extends Document {
    userId: mongoose.Types.ObjectId;
    bio: string;
    skills: any[];
    availability: string;
    timezone: string;
    githubUsername: string;
    avatarUrl?: string;
}

const ProfileSchema: Schema = new Schema({
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    bio: { type: String, default: '' },
    skills: [SkillSchema],
    availability: { type: String, default: 'full-time' },
    timezone: { type: String, default: 'UTC' },
    githubUsername: { type: String, default: '' },
    avatarUrl: { type: String }
}, { timestamps: true });

export default mongoose.model<IProfileDocument>('Profile', ProfileSchema);
