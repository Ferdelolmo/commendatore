import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Communication } from '@/types';
import { useToast } from '@/hooks/use-toast';

export function useCommunications() {
    const [communications, setCommunications] = useState<Communication[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const { toast } = useToast();

    const fetchCommunications = async () => {
        try {
            setIsLoading(true);
            const { data, error } = await supabase
                .from('communications')
                .select('*')
                .order('scheduled_at', { ascending: true });

            if (error) {
                console.error('Error fetching communications:', error);
                // Return empty if table not created yet
                if (error.code === '42P01') {
                    setCommunications([]);
                    return;
                }
                throw error;
            }

            setCommunications(data || []);
        } catch (error) {
            console.error('Error fetching communications:', error);
            toast({
                title: 'Error',
                description: 'Failed to fetch communications',
                variant: 'destructive'
            });
            setCommunications([]);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchCommunications();

        // Subscribe to changes
        const subscription = supabase
            .channel('communications_changes')
            .on('postgres_changes', 
                { event: '*', schema: 'public', table: 'communications' }, 
                () => {
                    fetchCommunications();
                }
            )
            .subscribe();

        return () => {
            subscription.unsubscribe();
        };
    }, []);

    const addCommunication = async (comm: Omit<Communication, 'id' | 'created_at'>) => {
        try {
            const { error } = await supabase
                .from('communications')
                .insert([comm]);

            if (error) throw error;
            
            toast({
                title: 'Success',
                description: 'Communication draft created successfully',
            });
            await fetchCommunications();
        } catch (error) {
            console.error('Error adding communication:', error);
            toast({
                title: 'Error',
                description: 'Failed to create communication',
                variant: 'destructive'
            });
            throw error;
        }
    };

    const updateCommunication = async (id: string, updates: Partial<Omit<Communication, 'id' | 'created_at'>>) => {
        try {
            const { error } = await supabase
                .from('communications')
                .update(updates)
                .eq('id', id);

            if (error) throw error;
            
            toast({
                title: 'Success',
                description: 'Communication draft updated successfully',
            });
            await fetchCommunications();
        } catch (error) {
            console.error('Error updating communication:', error);
            toast({
                title: 'Error',
                description: 'Failed to update communication',
                variant: 'destructive'
            });
            throw error;
        }
    };

    const deleteCommunication = async (id: string) => {
        try {
            const { error } = await supabase
                .from('communications')
                .delete()
                .eq('id', id);

            if (error) throw error;
            
            toast({
                title: 'Success',
                description: 'Communication draft deleted',
            });
            await fetchCommunications();
        } catch (error) {
            console.error('Error deleting communication:', error);
            toast({
                title: 'Error',
                description: 'Failed to delete communication',
                variant: 'destructive'
            });
            throw error;
        }
    };

    return {
        communications,
        isLoading,
        addCommunication,
        updateCommunication,
        deleteCommunication,
        refreshCommunications: fetchCommunications
    };
}
