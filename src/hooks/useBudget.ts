import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';

export interface BudgetItem {
    id: number;
    category: string;
    amount: number;
}

export interface PaymentItem {
    id: number;
    col1: string;
    col2: string;
    col3: string;
    col4: string;
}

const CSV_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vQDpo77k17ulqhe1aodYGlAZ2jBAF_cpcrnmxsvdSBOCUurdRf6bCHS8t2eYIq9TTflMhhtGnqllihg/pub?output=csv';

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
    const [paymentItems, setPaymentItems] = useState<PaymentItem[]>([]);
    const [paymentHeaders, setPaymentHeaders] = useState<string[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isSyncing, setIsSyncing] = useState(false);

    const fetchBudget = async () => {
        setIsLoading(true);
        setIsSyncing(true);
        try {
            const response = await fetch(CSV_URL);
            if (!response.ok) throw new Error('Failed to fetch CSV');
            const csvText = await response.text();

            const lines = csvText.replace(/\r\n/g, '\n').split('\n');
            const parsedLines = lines.map(line => parseCSVLine(line));

            // Budget Parsing (A2:B23 corresponds to indices 1 to 22)
            const newBudgetItems = parsedLines.slice(1, 23)
                .filter(row => row.length >= 2 && row[0]?.trim())
                .map((row, index) => ({
                    id: index + 1,
                    category: row[0].trim(),
                    amount: parseFloat(row[1]?.replace(/[^\d.-]/g, '') || '0')
                }));

            setBudgetItems(newBudgetItems);

            // Payments Parsing (F1:I24 corresponds to indices 0 to 23)
            // Header at Row 1 (Index 0), cols 5-8 (F-I)
            if (parsedLines[0] && parsedLines[0].length >= 9) {
                const headers = parsedLines[0].slice(5, 9).map(h => h.trim());
                setPaymentHeaders(headers);
            } else {
                setPaymentHeaders(['Date', 'Description', 'Amount', 'Status']); // Fallback
            }

            // Data at Rows 2-24 (Indices 1-23), cols 5-8
            const newPaymentItems = parsedLines.slice(1, 24)
                .filter(row => row.length >= 6 && (row[5]?.trim() || row[6]?.trim())) // Check if F or G has data
                .map((row, index) => ({
                    id: index + 1,
                    col1: row[5]?.trim() || '',
                    col2: row[6]?.trim() || '',
                    col3: row[7]?.trim() || '',
                    col4: row[8]?.trim() || ''
                }));

            setPaymentItems(newPaymentItems);
        } catch (error) {
            console.error('Error loading budget:', error);
            toast.error(error instanceof Error ? error.message : 'Failed to load budget data');
        } finally {
            setIsLoading(false);
            setIsSyncing(false);
        }
    };

    // Load budget from constant URL on mount
    useEffect(() => {
        fetchBudget();
    }, []);

    const refreshBudget = async () => {
        setIsSyncing(true);
        await fetchBudget();
        toast.success('Budget refreshed');
    };

    return {
        budgetItems,
        paymentItems,
        paymentHeaders,
        isLoading,
        isSyncing,
        refreshBudget
    };
}
