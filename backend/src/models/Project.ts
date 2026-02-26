import mongoose, { Schema, Document } from 'mongoose';

const SkillRequirementSchema = new Schema({
    skill: { type: String, required: true },
    priority: { type: String, enum: ['low', 'medium', 'high'], default: 'medium' }
}, { _id: false });

export interface IProjectDocument extends Document {
    ownerId: mongoose.Types.ObjectId;
    title: string;
    description: string;
    requiredSkills: any[];
    urgency: string;
    teamSize: number;
    status: string;
    members: mongoose.Types.ObjectId[];
}

const ProjectSchema: Schema = new Schema({
    ownerId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    title: { type: String, required: true },
    description: { type: String, required: true },
    requiredSkills: [SkillRequirementSchema],
    urgency: { type: String, enum: ['low', 'medium', 'high'], default: 'medium' },
    teamSize: { type: Number, default: 1 },
    status: { type: String, enum: ['open', 'in-progress', 'completed'], default: 'open' },
    members: [{ type: Schema.Types.ObjectId, ref: 'User' }]
}, { timestamps: true });

export default mongoose.model<IProjectDocument>('Project', ProjectSchema);
