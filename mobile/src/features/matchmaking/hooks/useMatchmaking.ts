import { useState } from 'react';
import client from '../../../api/client';

export const useMatchmaking = () => {
    const [matchResult, setMatchResult] = useState<any>(null);
    const [loading, setLoading] = useState(false);

    const checkCompatibility = async (projectId: string) => {
        setLoading(true);
        try {
            const response = await client.get(`/projects/${projectId}/match`);
            setMatchResult(response.data);
            return response.data;
        } catch (err) {
            console.error('Matchmaking error:', err);
        } finally {
            setLoading(false);
        }
    };

    return { matchResult, loading, checkCompatibility };
};
