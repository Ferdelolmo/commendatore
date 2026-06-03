import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { PhotoGroup } from '@/types';
import { useToast } from '@/hooks/use-toast';

export function usePhotoGroups() {
    const [photoGroups, setPhotoGroups] = useState<PhotoGroup[]>([]);
    const [isLoadingGroups, setIsLoadingGroups] = useState(true);
    const { toast } = useToast();

    const fetchGroups = async () => {
        try {
            setIsLoadingGroups(true);
            const { data, error } = await supabase
                .from('photo_groups')
                .select('*')
                .order('group_number', { ascending: true });

            if (error) throw error;
            setPhotoGroups(data || []);
        } catch (error) {
            console.error('Error fetching photo groups:', error);
            toast({
                title: 'Error',
                description: 'Failed to fetch photo groups',
                variant: 'destructive',
            });
        } finally {
            setIsLoadingGroups(false);
        }
    };

    const addGroup = async (group: Omit<PhotoGroup, 'id'>) => {
        try {
            const { data, error } = await supabase
                .from('photo_groups')
                .insert([group])
                .select()
                .single();

            if (error) throw error;

            setPhotoGroups((prev) => [...prev, data].sort((a, b) => a.group_number - b.group_number));
            toast({
                title: 'Success',
                description: 'Photo group created successfully',
            });
            return data;
        } catch (error) {
            console.error('Error adding photo group:', error);
            toast({
                title: 'Error',
                description: 'Failed to create photo group',
                variant: 'destructive',
            });
            throw error;
        }
    };

    const updateGroup = async (id: string, updates: Partial<PhotoGroup>) => {
        try {
            const { data, error } = await supabase
                .from('photo_groups')
                .update(updates)
                .eq('id', id)
                .select()
                .single();

            if (error) throw error;

            setPhotoGroups((prev) =>
                prev.map((g) => (g.id === id ? { ...g, ...updates } : g)).sort((a, b) => a.group_number - b.group_number)
            );
            toast({
                title: 'Success',
                description: 'Photo group updated successfully',
            });
            return data;
        } catch (error) {
            console.error('Error updating photo group:', error);
            toast({
                title: 'Error',
                description: 'Failed to update photo group',
                variant: 'destructive',
            });
            throw error;
        }
    };

    const deleteGroup = async (id: string) => {
        try {
            const { error } = await supabase
                .from('photo_groups')
                .delete()
                .eq('id', id);

            if (error) throw error;

            setPhotoGroups((prev) => prev.filter((g) => g.id !== id));
            toast({
                title: 'Success',
                description: 'Photo group deleted successfully',
            });
        } catch (error) {
            console.error('Error deleting photo group:', error);
            toast({
                title: 'Error',
                description: 'Failed to delete photo group',
                variant: 'destructive',
            });
            throw error;
        }
    };

    useEffect(() => {
        fetchGroups();
    }, []);

    return {
        photoGroups,
        isLoadingGroups,
        addGroup,
        updateGroup,
        deleteGroup,
        refreshGroups: fetchGroups,
    };
}
