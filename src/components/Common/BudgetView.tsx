import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
    Euro,
    ShieldCheck,
    Pencil,
    Save,
    Trash2,
    Plus,
    RefreshCw
} from 'lucide-react';
import { useBudget } from '@/hooks/useBudget';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export function BudgetView() {
    const {
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
    } = useBudget();

    const [isEditing, setIsEditing] = useState(false);

    const totalBudget = budgetItems.reduce((acc, item) => acc + item.amount, 0);
    const totalBudgetWithGuardrail = totalBudget * 1.1;

    if (isLoading && budgetItems.length === 0) {
        return <div className="p-8 text-center text-muted-foreground animate-pulse">Loading budget data...</div>;
    }

    return (
        <div className="space-y-6 animate-fade-in pb-20">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-serif font-semibold text-foreground">Budget Overview</h2>
                    <p className="text-muted-foreground">Track projected expenses</p>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={refreshBudget} disabled={isSyncing}>
                        <RefreshCw className={`mr-2 h-4 w-4 ${isSyncing ? 'animate-spin' : ''}`} />
                        Refresh
                    </Button>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid gap-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <div className="flex items-center gap-2">
                            <CardTitle className="text-sm font-medium">Total Budget</CardTitle>
                            <ShieldCheck className="h-4 w-4 text-primary" />
                        </div>
                        <Euro className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">€{totalBudgetWithGuardrail.toLocaleString(undefined, { maximumFractionDigits: 0 })}</div>
                        <p className="text-xs text-muted-foreground">Total projected cost</p>
                    </CardContent>
                </Card>
            </div>

            {/* Budget Tables */}
            <Tabs defaultValue="breakdown" className="w-full">
                <TabsList>
                    <TabsTrigger value="breakdown">Detailed Breakdown</TabsTrigger>
                    <TabsTrigger value="payments">Payments</TabsTrigger>
                </TabsList>

                <TabsContent value="breakdown">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between">
                            <CardTitle>Detailed Breakdown</CardTitle>
                            {isEditing && (
                                <Button size="sm" variant="outline" onClick={() => addBudgetItem({ category: 'New Item', amount: 0 })}>
                                    <Plus className="h-4 w-4 mr-2" /> Add Item
                                </Button>
                            )}
                        </CardHeader>
                        <CardContent>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Category</TableHead>
                                        <TableHead className="text-right">Amount</TableHead>
                                        {isEditing && <TableHead className="w-[50px]"></TableHead>}
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {budgetItems.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={isEditing ? 3 : 2} className="text-center py-8 text-muted-foreground">
                                                No items found.
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        budgetItems.map((item) => (
                                            <TableRow key={item.id}>
                                                <TableCell className="font-medium">
                                                    {isEditing ? (
                                                        <Input
                                                            value={item.category}
                                                            onChange={(e) => updateBudgetItem(item.id, { category: e.target.value })}
                                                        />
                                                    ) : item.category}
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    {isEditing ? (
                                                        <Input
                                                            type="number"
                                                            className="text-right"
                                                            value={item.amount}
                                                            onChange={(e) => updateBudgetItem(item.id, { amount: parseFloat(e.target.value) || 0 })}
                                                        />
                                                    ) : `€${item.amount.toLocaleString()}`}
                                                </TableCell>
                                                {isEditing && (
                                                    <TableCell>
                                                        <Button variant="ghost" size="icon" onClick={() => deleteBudgetItem(item.id)}>
                                                            <Trash2 className="h-4 w-4 text-destructive" />
                                                        </Button>
                                                    </TableCell>
                                                )}
                                            </TableRow>
                                        ))
                                    )}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="payments">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between">
                            <CardTitle>Payments</CardTitle>
                            {isEditing && (
                                <Button size="sm" variant="outline" onClick={() => addPaymentItem({ description: 'New Payment', amount: 0, paid: 0, pending: 0 })}>
                                    <Plus className="h-4 w-4 mr-2" /> Add Payment
                                </Button>
                            )}
                        </CardHeader>
                        <CardContent>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Concept</TableHead>
                                        <TableHead className="text-right">Total</TableHead>
                                        <TableHead className="text-right">Paid</TableHead>
                                        <TableHead className="text-right">Pending</TableHead>
                                        {isEditing && <TableHead className="w-[50px]"></TableHead>}
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {paymentItems.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={isEditing ? 5 : 4} className="text-center py-8 text-muted-foreground">
                                                No payment items found.
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        paymentItems.map((item) => (
                                            <TableRow key={item.id}>
                                                <TableCell>
                                                    {isEditing ? (
                                                        <Input
                                                            value={item.description}
                                                            onChange={(e) => updatePaymentItem(item.id, { description: e.target.value })}
                                                        />
                                                    ) : item.description}
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    {isEditing ? (
                                                        <Input
                                                            type="number"
                                                            className="text-right"
                                                            value={item.amount}
                                                            onChange={(e) => updatePaymentItem(item.id, { amount: parseFloat(e.target.value) || 0 })}
                                                        />
                                                    ) : `€${item.amount.toLocaleString()}`}
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    {isEditing ? (
                                                        <Input
                                                            type="number"
                                                            className="text-right"
                                                            value={item.paid}
                                                            onChange={(e) => updatePaymentItem(item.id, { paid: parseFloat(e.target.value) || 0 })}
                                                        />
                                                    ) : `€${item.paid.toLocaleString()}`}
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    {isEditing ? (
                                                        <Input
                                                            type="number"
                                                            className="text-right"
                                                            value={item.pending}
                                                            onChange={(e) => updatePaymentItem(item.id, { pending: parseFloat(e.target.value) || 0 })}
                                                        />
                                                    ) : `€${item.pending.toLocaleString()}`}
                                                </TableCell>
                                                {isEditing && (
                                                    <TableCell>
                                                        <Button variant="ghost" size="icon" onClick={() => deletePaymentItem(item.id)}>
                                                            <Trash2 className="h-4 w-4 text-destructive" />
                                                        </Button>
                                                    </TableCell>
                                                )}
                                            </TableRow>
                                        ))
                                    )}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>

            {/* Floating Edit/Save Action Button */}
            <div className="fixed bottom-6 right-6 z-50">
                <Button
                    size="lg"
                    className="shadow-lg rounded-full px-6"
                    onClick={() => setIsEditing(!isEditing)}
                    variant={isEditing ? "default" : "secondary"}
                >
                    {isEditing ? (
                        <>
                            <Save className="mr-2 h-4 w-4" /> Done Editing
                        </>
                    ) : (
                        <>
                            <Pencil className="mr-2 h-4 w-4" /> Edit Budget
                        </>
                    )}
                </Button>
            </div>
        </div>
    );
}
