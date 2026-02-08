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

    const linkGuests = async (guestId1: string, guestId2: string) => {
        try {
            // 1. Get both guests to check existing groups
            const { data: guestsData, error: fetchError } = await supabase
                .from('guests')
                .select('id, group_id')
                .in('id', [guestId1, guestId2]);

            if (fetchError || !guestsData) throw fetchError;

            const g1 = guestsData.find(g => g.id === guestId1);
            const g2 = guestsData.find(g => g.id === guestId2);

            if (!g1 || !g2) throw new Error('Guests not found');

            // 2. Determine target group_id
            let targetGroupId = g1.group_id || g2.group_id;

            if (!targetGroupId) {
                // Creates a new group if neither has one
                targetGroupId = crypto.randomUUID();
            }

            // 3. Update both guests (and anyone else in their old groups if we were merging, but let's keep it simple: just these two join the target group)
            // Actually, if we link A (group X) and B (group Y), usually we want to merge groups.
            // For simplicity, let's say we merge all of g2's group into g1's group (or target).

            const groupIdsToMerge = [g1.group_id, g2.group_id].filter(Boolean);

            // If they are already in the same group, do nothing
            if (g1.group_id && g2.group_id && g1.group_id === g2.group_id) return;

            // If we have distinct existing groups, we merge them. 
            // If one is null, we just add that person to the other's group.
            // If both null, new group.

            // The query: Update all guests who have group_id matching EITHER g1 or g2 (if they exist) OR are the specific guests.
            // Simplified: Just update any guest in the 'old' groups to the new 'target' group.
            // But if they were null, they aren't in a group.

            // Let's just update specific IDs for now unless they already have a group, then update that whole group?
            // "Twins" implies comprehensive linking. 
            // Strategy: 
            // - If g1 has group, target is g1.group.
            // - If g2 has group, and g1 didn't, target is g2.group.
            // - If both have different groups, target is g1.group (merge g2's group into it).
            // - If neither, new ID.

            const finalGroupId = g1.group_id || g2.group_id || crypto.randomUUID();

            // Find which IDs need updating. 
            // If g2 had a group, everyone in g2.group needs to move to finalGroupId.
            // If g2 was solo (null), just g2 moves.

            let query = supabase.from('guests').update({ group_id: finalGroupId });

            const orConditions = [`id.eq.${g1.id}`, `id.eq.${g2.id}`];
            if (g1.group_id) orConditions.push(`group_id.eq.${g1.group_id}`);
            if (g2.group_id) orConditions.push(`group_id.eq.${g2.group_id}`);

            query = query.or(orConditions.join(','));

            const { error: updateError } = await query;

            if (updateError) throw updateError;

            // 4. Refresh local state
            await fetchGuests(); // Easiest way to sync everything

            toast({
                title: 'Success',
                description: 'Guests linked successfully',
            });

        } catch (error) {
            console.error('Error linking guests:', error);
            toast({
                title: 'Error',
                description: 'Failed to link guests',
                variant: 'destructive',
            });
            throw error;
        }
    };

    return {
        guests,
        isLoading,
        addGuest,
        addGuests,
        updateGuest,
        deleteGuest,
        linkGuests,
        refreshGuests: fetchGuests,
        stats: getStats(),
    };
}
