import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';

export interface BudgetItem {
    id: number;
    category: string;
    amount: number;
}

const STORAGE_KEY = 'budget_csv_url';

// Helper to parse CSV lines correctly handling quoted fields containing commas
const parseCSVLine = (line: string): string[] => {
    const result: string[] = [];
    let startValueIndex = 0;
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
        const char = line[i];

        if (char === '"') {
            inQuotes = !inQuotes;
        } else if (char === ',' && !inQuotes) {
            let value = line.substring(startValueIndex, i).trim();
            // Remove wrapping quotes if present
            if (value.startsWith('"') && value.endsWith('"')) {
                value = value.slice(1, -1);
            }
            // Handle double double-quotes (escaped quotes)
            value = value.replace(/""/g, '"');
            result.push(value);
            startValueIndex = i + 1;
        }
    }

    // Add last value
    let lastValue = line.substring(startValueIndex).trim();
    if (lastValue.startsWith('"') && lastValue.endsWith('"')) {
        lastValue = lastValue.slice(1, -1);
    }
    lastValue = lastValue.replace(/""/g, '"');
    result.push(lastValue);

    return result;
};

export function useBudget() {
    const [budgetItems, setBudgetItems] = useState<BudgetItem[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isSyncing, setIsSyncing] = useState(false);
    const [savedUrl, setSavedUrl] = useState<string>('');

    // Load URL from local storage on mount
    useEffect(() => {
        const url = localStorage.getItem(STORAGE_KEY);
        if (url) {
            setSavedUrl(url);
            fetchFromUrl(url);
        }
    }, []);

    const fetchFromUrl = async (url: string) => {
        setIsLoading(true);
        try {
            const response = await fetch(url);
            if (!response.ok) throw new Error('Failed to fetch CSV');
            const csvText = await response.text();

            // Split lines but handle potential CRLF
            const lines = csvText.replace(/\r\n/g, '\n').split('\n');

            // Assume strict structure based on user request:
            // Range A2:B21
            // Column A (0): Category
            // Column B (1): Amount

            const newItems = lines.slice(1) // Skip header (row 1)
                .slice(0, 20) // Limit to 20 data rows (rows 2-21)
                .map(line => parseCSVLine(line))
                .filter(row => row.length >= 2 && row[0]?.trim()) // Valid row check
                .map((row, index) => ({
                    id: index + 1,
                    category: row[0].trim(),
                    // Remove currency symbols, non-breaking spaces, and handle "28,576" -> 28576
                    amount: parseFloat(row[1]?.replace(/[^\d.-]/g, '') || '0')
                }));

            setBudgetItems(newItems);
        } catch (error) {
            console.error('Error loading budget:', error);
            toast.error(error instanceof Error ? error.message : 'Failed to load budget data');
        } finally {
            setIsLoading(false);
            setIsSyncing(false);
        }
    };

    const updateSourceUrl = async (url: string) => {
        setIsSyncing(true);
        localStorage.setItem(STORAGE_KEY, url);
        setSavedUrl(url);
        await fetchFromUrl(url);
        toast.success('Budget source updated');
    };

    const refreshBudget = async () => {
        if (!savedUrl) return;
        setIsSyncing(true);
        await fetchFromUrl(savedUrl);
        toast.success('Budget refreshed');
    };

    return {
        budgetItems,
        isLoading,
        isSyncing,
        savedUrl,
        updateSourceUrl,
        refreshBudget
    };
}
