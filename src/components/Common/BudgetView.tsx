import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Euro, ArrowUpRight, ArrowDownRight, Printer, RefreshCw, ShieldCheck } from 'lucide-react';
import { useBudget } from '@/hooks/useBudget';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export function BudgetView() {
    const { budgetItems, paymentItems, paymentHeaders, isLoading, isSyncing, refreshBudget } = useBudget();

    const totalBudget = budgetItems.reduce((acc, item) => acc + item.amount, 0);
    const totalBudgetWithGuardrail = totalBudget * 1.1;

    if (isLoading && budgetItems.length === 0) {
        return <div className="p-8 text-center text-muted-foreground animate-pulse">Loading budget data...</div>;
    }

    return (
        <div className="space-y-6 animate-fade-in">
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

                    <Button variant="outline" size="sm">
                        <Printer className="mr-2 h-4 w-4" />
                        Export
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
                        <CardHeader>
                            <CardTitle>Detailed Breakdown</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Category</TableHead>
                                        <TableHead className="text-right">Amount</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {budgetItems.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={2} className="text-center py-8 text-muted-foreground">
                                                No budget items found. Sync from Google Sheets to get started.
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        budgetItems.map((item) => (
                                            <TableRow key={item.id}>
                                                <TableCell className="font-medium">{item.category}</TableCell>
                                                <TableCell className="text-right">€{item.amount.toLocaleString()}</TableCell>
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
                        <CardHeader>
                            <CardTitle>Payments</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        {paymentHeaders.length > 0 ? (
                                            paymentHeaders.map((header, idx) => (
                                                <TableHead key={idx} className={idx > 0 && idx < 3 ? "text-right" : ""}>{header}</TableHead>
                                            ))
                                        ) : (
                                            <>
                                                <TableHead>Date</TableHead>
                                                <TableHead>Description</TableHead>
                                                <TableHead>Amount</TableHead>
                                                <TableHead>Status</TableHead>
                                            </>
                                        )}
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {paymentItems.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                                                No payment items found.
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        paymentItems.map((item) => (
                                            <TableRow key={item.id}>
                                                <TableCell>{item.col1}</TableCell>
                                                <TableCell>{item.col2}</TableCell>
                                                <TableCell className="text-right">{item.col3}</TableCell>
                                                <TableCell>{item.col4}</TableCell>
                                            </TableRow>
                                        ))
                                    )}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
}
