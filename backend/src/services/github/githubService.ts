import axios from 'axios';

export class GitHubService {
    private static BASE_URL = 'https://api.github.com';

    static async fetchUserSkills(username: string): Promise<any> {
        try {
            const config = {
                headers: process.env.GITHUB_TOKEN ? { Authorization: `token ${process.env.GITHUB_TOKEN}` } : {}
            };

            // 1. Fetch repos
            const reposResponse = await axios.get(`${this.BASE_URL}/users/${username}/repos`, config);
            const repos = reposResponse.data;

            const languages: Record<string, number> = {};

            // 2. Aggregate languages (this can be slow for many repos, in production use pagination/hooks)
            for (const repo of repos.slice(0, 10)) { // Limit to 10 repos for MVP
                const langResponse = await axios.get(repo.languages_url, config);
                const repoLangs = langResponse.data;

                for (const [lang, bytes] of Object.entries(repoLangs)) {
                    languages[lang] = (languages[lang] || 0) + (bytes as number);
                }
            }

            // 3. Transform to our skill model
            return this.processLanguages(languages);
        } catch (error) {
            console.error('Error fetching GitHub data:', error);
            return [];
        }
    }

    private static processLanguages(languages: Record<string, number>) {
        const totalBytes = Object.values(languages).reduce((a, b) => a + b, 0);

        return Object.entries(languages).map(([name, bytes]) => ({
            name,
            level: this.mapBytesToLevel(bytes, totalBytes),
            verified: true,
            source: 'github',
            confidenceScore: (bytes / totalBytes)
        })).sort((a, b) => b.confidenceScore - a.confidenceScore);
    }

    private static mapBytesToLevel(bytes: number, total: number) {
        const percentage = (bytes / total) * 100;
        if (percentage > 30) return 'advanced';
        if (percentage > 10) return 'intermediate';
        return 'beginner';
    }
}
