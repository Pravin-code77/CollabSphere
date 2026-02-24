export interface MatchResult {
    score: number;
    breakdown: {
        skillOverlap: number;
        complementarySkills: number;
        availabilityMatch: number;
    };
    recommendations: string[];
}

export interface SkillScore {
    name: string;
    score: number;
}
