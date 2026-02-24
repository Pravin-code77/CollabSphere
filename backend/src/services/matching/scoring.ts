export class ScoringService {
    /**
     * Calculate skill overlap score (0-1)
     */
    static calculateSkillOverlap(userSkills: any[], projectRequirements: any[]): number {
        if (projectRequirements.length === 0) return 1;

        const userSkillNames = userSkills.map(s => s.name.toLowerCase());
        const matches = projectRequirements.filter(req =>
            userSkillNames.includes(req.skill.toLowerCase())
        );

        return matches.length / projectRequirements.length;
    }

    /**
     * Placeholder for complementary skill scoring (e.g. Designer + Developer)
     */
    static calculateComplementaryScore(userSkills: any[], currentTeamSkills: any[]): number {
        // TODO: Implement graph-based complementary matching
        // For now, return a deterministic placeholder
        return 0.5;
    }

    /**
     * Calculate availability overlap
     */
    static calculateAvailabilityScore(userAvailability: string, projectUrgency: string): number {
        const scores: Record<string, number> = {
            'full-time': 1,
            'part-time': 0.6,
            'weekends': 0.3
        };

        const baseScore = scores[userAvailability] || 0.5;

        // If project is high urgency, part-time is less ideal
        if (projectUrgency === 'high' && userAvailability !== 'full-time') {
            return baseScore * 0.7;
        }

        return baseScore;
    }
}
