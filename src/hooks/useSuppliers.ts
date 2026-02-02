import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Supplier } from '@/types';
import { useToast } from '@/hooks/use-toast';

export function useSuppliers() {
    const [suppliers, setSuppliers] = useState<Supplier[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const { toast } = useToast();

    const fetchSuppliers = async () => {
        try {
            setIsLoading(true);
            const { data, error } = await supabase
                .from('suppliers')
                .select('*')
                .order('created_at', { ascending: false });

            if (error) throw error;

            setSuppliers(data || []);
        } catch (error) {
            console.error('Error fetching suppliers:', error);
            toast({
                title: 'Error',
                description: 'Failed to fetch suppliers',
                variant: 'destructive',
            });
        } finally {
            setIsLoading(false);
        }
    };

    const addSupplier = async (supplier: Omit<Supplier, 'id' | 'created_at'>) => {
        try {
            const { data, error } = await supabase
                .from('suppliers')
                .insert([supplier])
                .select()
                .single();

            if (error) throw error;

            setSuppliers((prev) => [data, ...prev]);
            toast({
                title: 'Success',
                description: 'Supplier added successfully',
            });
            return data;
        } catch (error) {
            console.error('Error adding supplier:', error);
            toast({
                title: 'Error',
                description: 'Failed to add supplier',
                variant: 'destructive',
            });
            throw error;
        }
    };

    const updateSupplier = async (id: string, updates: Partial<Supplier>) => {
        try {
            const { data, error } = await supabase
                .from('suppliers')
                .update(updates)
                .eq('id', id)
                .select()
                .single();

            if (error) throw error;

            setSuppliers((prev) =>
                prev.map((s) => (s.id === id ? { ...s, ...updates } : s))
            );
            toast({
                title: 'Success',
                description: 'Supplier updated successfully',
            });
            return data;
        } catch (error) {
            console.error('Error updating supplier:', error);
            toast({
                title: 'Error',
                description: 'Failed to update supplier',
                variant: 'destructive',
            });
            throw error;
        }
    };

    const deleteSupplier = async (id: string) => {
        try {
            const { error } = await supabase
                .from('suppliers')
                .delete()
                .eq('id', id);

            if (error) throw error;

            setSuppliers((prev) => prev.filter((s) => s.id !== id));
            toast({
                title: 'Success',
                description: 'Supplier deleted successfully',
            });
        } catch (error) {
            console.error('Error deleting supplier:', error);
            toast({
                title: 'Error',
                description: 'Failed to delete supplier',
                variant: 'destructive',
            });
            throw error;
        }
    };

    useEffect(() => {
        fetchSuppliers();
    }, []);

    return {
        suppliers,
        isLoading,
        addSupplier,
        updateSupplier,
        deleteSupplier,
        refreshSuppliers: fetchSuppliers,
    };
}
