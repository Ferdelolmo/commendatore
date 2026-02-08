import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Table, Guest } from '@/types';
import { useToast } from '@/hooks/use-toast';

export function useTables() {
    const [tables, setTables] = useState<Table[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const { toast } = useToast();

    const fetchTables = async () => {
        try {
            setIsLoading(true);
            const { data, error } = await supabase
                .from('tables')
                .select(`
                    *,
                    guests (*)
                `)
                .order('name', { ascending: true });

            if (error) {
                // If table doesn't exist, we might want to return empty or handle gracefully
                // For now, throw to catch block
                throw error;
            }

            // Transform data to match our Table interface if needed
            // Assuming DB structure matches for now, but capacity might be stored differently in DB
            // If DB stores capacity as jsonb, it works directly. 
            // If DB stores min_capacity and max_capacity columns, we need to map.
            // Let's assume JSONB for 'capacity' column or individual columns.
            // For robustness, let's map assuming individual columns if JSON fails, 
            // but since we are defining the schema, let's stick to the interface.
            // Actually, querying guests via foreign key might require correct setup.
            // If the relationship isn't set up in Supabase, this join will fail.

            // To be safe, let's just fetch tables and we can join manually on the client if needed,
            // but the `select(*, guests(*))` is the best way if relations exist.

            setTables(data || []);
        } catch (error) {
            console.error('Error fetching tables:', error);
            // Don't show toast on 404/missing table to avoid annoying users if feature is new
        } finally {
            setIsLoading(false);
        }
    };

    const addTable = async (table: Omit<Table, 'id' | 'guests'>) => {
        try {
            const { data, error } = await supabase
                .from('tables')
                .insert([table])
                .select()
                .single();

            if (error) throw error;

            setTables((prev) => [...prev, { ...data, guests: [] }]);
            toast({
                title: 'Success',
                description: 'Table created successfully',
            });
            return data;
        } catch (error) {
            console.error('Error adding table:', error);
            toast({
                title: 'Error',
                description: 'Failed to create table',
                variant: 'destructive',
            });
            throw error;
        }
    };

    const updateTable = async (id: string, updates: Partial<Table>) => {
        try {
            // Remove guests from updates if present, as it's a relation
            const { guests, ...tableUpdates } = updates;

            const { data, error } = await supabase
                .from('tables')
                .update(tableUpdates)
                .eq('id', id)
                .select()
                .single();

            if (error) throw error;

            setTables((prev) =>
                prev.map((t) => (t.id === id ? { ...t, ...data } : t))
            );
            toast({
                title: 'Success',
                description: 'Table updated successfully',
            });
            return data;
        } catch (error) {
            console.error('Error updating table:', error);
            toast({
                title: 'Error',
                description: 'Failed to update table',
                variant: 'destructive',
            });
            throw error;
        }
    };

    const deleteTable = async (id: string) => {
        try {
            const { error } = await supabase
                .from('tables')
                .delete()
                .eq('id', id);

            if (error) throw error;

            setTables((prev) => prev.filter((t) => t.id !== id));
            toast({
                title: 'Success',
                description: 'Table deleted successfully',
            });
        } catch (error) {
            console.error('Error deleting table:', error);
            toast({
                title: 'Error',
                description: 'Failed to delete table',
                variant: 'destructive',
            });
            throw error;
        }
    };

    const assignGuestToTable = async (guestId: string, tableId: string | null) => {
        try {
            // Check if guest has a group
            const { data: guestData } = await supabase
                .from('guests')
                .select('group_id')
                .eq('id', guestId)
                .single();

            let query = supabase
                .from('guests')
                .update({ table_id: tableId });

            if (guestData?.group_id) {
                // If in a group, update everyone in that group
                query = query.eq('group_id', guestData.group_id);
            } else {
                // Otherwise just update the single guest
                query = query.eq('id', guestId);
            }

            const { error } = await query;

            if (error) throw error;

            fetchTables();
            return true;
        } catch (error) {
            console.error('Error assigning guest:', error);
            toast({
                title: 'Error',
                description: 'Failed to assign guest',
                variant: 'destructive',
            });
            throw error;
        }
    };

    useEffect(() => {
        fetchTables();
    }, []);

    return {
        tables,
        isLoading,
        addTable,
        updateTable,
        deleteTable,
        assignGuestToTable,
        refreshTables: fetchTables
    };
}
