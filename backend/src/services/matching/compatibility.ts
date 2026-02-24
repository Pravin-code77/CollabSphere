import { ScoringService } from './scoring';
import { MatchResult } from './types';

export class CompatibilityService {
    /**
     * Main matching engine entry point
     */
    static async computeCompatibility(user: any, project: any): Promise<MatchResult> {
        const skillOverlap = ScoringService.calculateSkillOverlap(user.skills, project.requiredSkills);
        const availabilityMatch = ScoringService.calculateAvailabilityScore(user.availability, project.urgency);

        // Complementary skills would require team context, passing empty for now
        const complementarySkills = ScoringService.calculateComplementaryScore(user.skills, []);

        // Weighted final score
        const totalScore = (skillOverlap * 0.5) + (availabilityMatch * 0.3) + (complementarySkills * 0.2);

        // TODO hooks for AI:
        // 1. Fetch embeddings for user bio vs project description
        // 2. Use OpenAI to refine the score based on context

        return {
            score: Math.round(totalScore * 100),
            breakdown: {
                skillOverlap,
                complementarySkills,
                availabilityMatch
            },
            recommendations: this.generateRecommendations(skillOverlap, availabilityMatch)
        };
    }

    private static generateRecommendations(skillOverlap: number, availability: number): string[] {
        const recs: string[] = [];
        if (skillOverlap < 0.5) recs.push('Consider learning more the required tech stack');
        if (availability < 0.5) recs.push('High urgency project: Ensure you can commit enough time');
        return recs;
    }
}
