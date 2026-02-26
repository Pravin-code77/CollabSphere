import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL || 'https://your-project.supabase.co';
const supabaseKey = process.env.SUPABASE_ANON_KEY || 'your-anon-key';

export const supabase = createClient(supabaseUrl, supabaseKey);

/**
 * SCAFFOLD: Real-time messaging logic
 * This is designed to plug into points where Socket.io is currently used.
 */
export const subscribeToProjectChat = (projectId: string, onMessage: (payload: any) => void) => {
    return supabase
        .channel(`project:${projectId}`)
        .on('postgres_changes', {
            event: 'INSERT',
            schema: 'public',
            table: 'messages',
            filter: `project_id=eq.${projectId}`
        }, onMessage)
        .subscribe();
};
