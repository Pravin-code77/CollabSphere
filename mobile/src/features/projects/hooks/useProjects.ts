import { useState, useEffect } from 'react';
import client from '../../../api/client';

export const useProjects = () => {
    const [projects, setProjects] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const fetchProjects = async () => {
        setLoading(true);
        try {
            const response = await client.get('/projects');
            setProjects(response.data);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const createProject = async (projectData: any) => {
        try {
            const response = await client.post('/projects', projectData);
            setProjects(prev => [...prev, response.data]);
            return response.data;
        } catch (err: any) {
            setError(err.message);
            throw err;
        }
    };

    useEffect(() => {
        fetchProjects();
    }, []);

    return { projects, loading, error, fetchProjects, createProject };
};
