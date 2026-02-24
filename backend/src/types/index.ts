export interface IUser {
    id: string;
    email: string;
    username: string;
    createdAt: Date;
}

export interface IProfile {
    userId: string;
    bio: string;
    skills: ISkill[];
    availability: string;
    timezone: string;
    githubUsername: string;
    avatarUrl?: string;
}

export interface ISkill {
    name: string;
    level: 'beginner' | 'intermediate' | 'advanced' | 'expert';
    verified: boolean;
    source: 'manual' | 'github';
    confidenceScore?: number;
}

export interface IProject {
    id: string;
    ownerId: string;
    title: string;
    description: string;
    requiredSkills: ISkillRequirement[];
    urgency: 'low' | 'medium' | 'high';
    teamSize: number;
    status: 'open' | 'in-progress' | 'completed';
}

export interface ISkillRequirement {
    skill: string;
    priority: 'low' | 'medium' | 'high';
}

export interface IMatch {
    userId: string;
    projectId: string;
    score: number;
    breakdown: {
        skillOverlap: number;
        complementarySkills: number;
        availabilityMatch: number;
    };
}

export interface IMessage {
    id: string;
    projectId: string;
    senderId: string;
    text: string;
    createdAt: Date;
}
