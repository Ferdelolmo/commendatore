import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase';

export interface BudgetItem {
    id: number;
    category: string;
    amount: number;
}

export interface PaymentItem {
    id: number;
    description: string;
    amount: number;
    paid: number;
    pending: number;
}

export function useBudget() {
    const [budgetItems, setBudgetItems] = useState<BudgetItem[]>([]);
    const [paymentItems, setPaymentItems] = useState<PaymentItem[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isSyncing, setIsSyncing] = useState(false);

    const fetchBudget = async () => {
        setIsLoading(true);
        try {
            const { data: budgetData, error: budgetError } = await supabase
                .from('budget_items')
                .select('*')
                .order('id', { ascending: true });

            if (budgetError) throw budgetError;

            const { data: paymentData, error: paymentError } = await supabase
                .from('budget_payments')
                .select('*')
                .order('id', { ascending: true });

            if (paymentError) throw paymentError;

            setBudgetItems(budgetData || []);
            setPaymentItems(paymentData || []);

        } catch (error) {
            console.error('Error loading budget:', error);
            toast.error('Failed to load budget data');
        } finally {
            setIsLoading(false);
            setIsSyncing(false);
        }
    };

    // Load budget on mount
    useEffect(() => {
        fetchBudget();

        // Subscribe to realtime changes (optional but good for multi-admin)
        const budgetChannel = supabase
            .channel('budget-changes')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'budget_items' }, () => fetchBudget())
            .on('postgres_changes', { event: '*', schema: 'public', table: 'budget_payments' }, () => fetchBudget())
            .subscribe();

        return () => {
            supabase.removeChannel(budgetChannel);
        };
    }, []);

    const refreshBudget = async () => {
        setIsSyncing(true);
        await fetchBudget();
        toast.success('Budget refreshed');
    };

    const addBudgetItem = async (item: Omit<BudgetItem, 'id'>) => {
        try {
            const { error } = await supabase.from('budget_items').insert(item);
            if (error) throw error;
            toast.success('Item added');
            fetchBudget();
        } catch (error) {
            toast.error('Failed to add item');
            console.error(error);
        }
    };

    const updateBudgetItem = async (id: number, updates: Partial<BudgetItem>) => {
        try {
            const { error } = await supabase.from('budget_items').update(updates).eq('id', id);
            if (error) throw error;
            toast.success('Item updated');
            fetchBudget();
        } catch (error) {
            toast.error('Failed to update item');
            console.error(error);
        }
    };

    const deleteBudgetItem = async (id: number) => {
        try {
            const { error } = await supabase.from('budget_items').delete().eq('id', id);
            if (error) throw error;
            toast.success('Item deleted');
            fetchBudget();
        } catch (error) {
            toast.error('Failed to delete item');
            console.error(error);
        }
    };

    const addPaymentItem = async (item: Omit<PaymentItem, 'id'>) => {
        try {
            const { error } = await supabase.from('budget_payments').insert(item);
            if (error) throw error;
            toast.success('Payment added');
            fetchBudget();
        } catch (error) {
            toast.error('Failed to add payment');
            console.error(error);
        }
    };

    const updatePaymentItem = async (id: number, updates: Partial<PaymentItem>) => {
        try {
            const { error } = await supabase.from('budget_payments').update(updates).eq('id', id);
            if (error) throw error;
            toast.success('Payment updated');
            fetchBudget();
        } catch (error) {
            toast.error('Failed to update payment');
            console.error(error);
        }
    };

    const deletePaymentItem = async (id: number) => {
        try {
            const { error } = await supabase.from('budget_payments').delete().eq('id', id);
            if (error) throw error;
            toast.success('Payment deleted');
            fetchBudget();
        } catch (error) {
            toast.error('Failed to delete payment');
            console.error(error);
        }
    };

    return {
        budgetItems,
        paymentItems,
        isLoading,
        isSyncing,
        refreshBudget,
        addBudgetItem,
        updateBudgetItem,
        deleteBudgetItem,
        addPaymentItem,
        updatePaymentItem,
        deletePaymentItem
    };
}
