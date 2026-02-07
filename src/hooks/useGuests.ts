import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Guest } from '@/types';
import { useToast } from '@/hooks/use-toast';

export function useGuests() {
    const [guests, setGuests] = useState<Guest[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const { toast } = useToast();

    const fetchGuests = async () => {
        try {
            setIsLoading(true);
            const { data, error } = await supabase
                .from('guests')
                .select('*')
                .order('name', { ascending: true });

            if (error) throw error;

            setGuests(data || []);
        } catch (error) {
            console.error('Error fetching guests:', error);
            toast({
                title: 'Error',
                description: 'Failed to fetch guest list',
                variant: 'destructive',
            });
        } finally {
            setIsLoading(false);
        }
    };

    const addGuest = async (guest: Omit<Guest, 'id'>) => {
        try {
            const { data, error } = await supabase
                .from('guests')
                .insert([guest])
                .select()
                .single();

            if (error) throw error;

            setGuests((prev) => [...prev, data].sort((a, b) => a.name.localeCompare(b.name)));
            toast({
                title: 'Success',
                description: 'Guest added successfully',
            });
            return data;
        } catch (error) {
            console.error('Error adding guest:', error);
            toast({
                title: 'Error',
                description: 'Failed to add guest',
                variant: 'destructive',
            });
            throw error;
        }
    };
    const addGuests = async (newGuests: Omit<Guest, 'id'>[]) => {
        try {
            const { data, error } = await supabase
                .from('guests')
                .insert(newGuests)
                .select();

            if (error) throw error;

            if (data) {
                setGuests((prev) => [...prev, ...data].sort((a, b) => a.name.localeCompare(b.name)));
                toast({
                    title: 'Success',
                    description: `${data.length} guests added successfully`,
                });
            }
            return data;
        } catch (error) {
            console.error('Error adding guests:', error);
            toast({
                title: 'Error',
                description: 'Failed to add guests',
                variant: 'destructive',
            });
            throw error;
        }
    };


    const updateGuest = async (id: string, updates: Partial<Guest>) => {
        try {
            const { data, error } = await supabase
                .from('guests')
                .update(updates)
                .eq('id', id)
                .select()
                .single();

            if (error) throw error;

            setGuests((prev) =>
                prev.map((g) => (g.id === id ? { ...g, ...updates } : g))
            );
            toast({
                title: 'Success',
                description: 'Guest updated successfully',
            });
            return data;
        } catch (error) {
            console.error('Error updating guest:', error);
            toast({
                title: 'Error',
                description: 'Failed to update guest',
                variant: 'destructive',
            });
            throw error;
        }
    };

    const deleteGuest = async (id: string) => {
        try {
            const { error } = await supabase
                .from('guests')
                .delete()
                .eq('id', id);

            if (error) throw error;

            setGuests((prev) => prev.filter((g) => g.id !== id));
            toast({
                title: 'Success',
                description: 'Guest deleted successfully',
            });
        } catch (error) {
            console.error('Error deleting guest:', error);
            toast({
                title: 'Error',
                description: 'Failed to delete guest',
                variant: 'destructive',
            });
            throw error;
        }
    };

    const getStats = () => {
        const total = guests.length;
        const confirmed = guests.filter(g => g.confirmation_status === 'Confirmed').length;
        const declined = guests.filter(g => g.confirmation_status === 'Declined').length;
        const pending = guests.filter(g => g.confirmation_status === 'Pending').length;
        const preWedding = guests.filter(g => g.attending_pre_wedding && g.confirmation_status === 'Confirmed').length;
        const needsTransport = guests.filter(g => g.transport_needs !== 'None' && g.confirmation_status === 'Confirmed').length;

        return { total, confirmed, declined, pending, preWedding, needsTransport };
    };

    useEffect(() => {
        fetchGuests();
    }, []);

    return {
        guests,
        isLoading,
        addGuest,
        addGuests,
        updateGuest,
        deleteGuest,
        refreshGuests: fetchGuests,
        stats: getStats(),
    };
}
