import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
    Euro,
    ShieldCheck,
    Pencil,
    Save,
    Trash2,
    Plus,
    RefreshCw,
    Minus,
    Gift as GiftIcon,
    TrendingDown
} from 'lucide-react';
import { useBudget } from '@/hooks/useBudget';
import { useGuests } from '@/hooks/useGuests';
import { useGifts } from '@/hooks/useGifts';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useTranslation } from 'react-i18next';

export function BudgetView() {
    const { t } = useTranslation();
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
    const { guests } = useGuests();
    const { totalAmount: totalGifts } = useGifts();

    const [isEditing, setIsEditing] = useState(false);

    const totalBudget = budgetItems.reduce((acc, item) => acc + item.amount, 0);
    const totalBudgetWithGuardrail = totalBudget * 1.1;

    const distribution = useMemo(() => {
        let chiaraCount = 0;
        let fernandoCount = 0;

        // Only count confirmed guests for cost-sharing percentage
        guests.filter(g => g.confirmation_status === 'Confirmed').forEach(guest => {
            const side = guest.side?.toLowerCase();
            if (side === 'chiara') {
                chiaraCount += 1;
            } else if (side === 'fernando') {
                fernandoCount += 1;
            } else if (side === 'both') {
                // Guests from both sides are shared equally
                chiaraCount += 0.5;
                fernandoCount += 0.5;
            }
        });

        const totalCount = chiaraCount + fernandoCount;
        // If no confirmed guests yet, default to 50/50
        if (totalCount === 0) return { chiaraPct: 0.5, fernandoPct: 0.5 };

        const chiaraPct = chiaraCount / totalCount;
        const fernandoPct = fernandoCount / totalCount;

        // Net cost each person owes: (total projected - gifts received) * their share
        const netCost = totalBudgetWithGuardrail - totalGifts;

        return {
            chiaraPct,
            fernandoPct,
            chiaraOwes: netCost * chiaraPct,
            fernandoOwes: netCost * fernandoPct,
        };
    }, [guests, totalBudgetWithGuardrail, totalGifts]);

    if (isLoading && budgetItems.length === 0) {
        return <div className="p-8 text-center text-muted-foreground animate-pulse">{t('common.loading')}</div>;
    }

    return (
        <div className="space-y-6 animate-fade-in pb-20">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-serif font-semibold text-foreground">{t('common.budgetOverview')}</h2>
                    <p className="text-muted-foreground">{t('common.trackExpenses')}</p>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid gap-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <div className="flex items-center gap-2">
                            <CardTitle className="text-sm font-medium">{t('common.totalBudget')}</CardTitle>
                            <ShieldCheck className="h-4 w-4 text-primary" />
                        </div>
                        <Euro className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                            <div>
                                <div className="text-2xl font-bold">€{totalBudgetWithGuardrail.toLocaleString(undefined, { maximumFractionDigits: 0 })}</div>
                                <p className="text-xs text-muted-foreground">{t('common.totalProjectedCost')}</p>
                            </div>
                            {(totalBudgetWithGuardrail > 0) ? (
                                <div className="flex flex-col items-end gap-1 mt-2 md:mt-0">
                                    <p className="text-[11px] text-muted-foreground text-right">
                                        Net cost after gifts ({Math.round(distribution.chiaraPct * 100)}% / {Math.round(distribution.fernandoPct * 100)}%)
                                    </p>
                                    <div className="flex gap-6">
                                        <div className="flex flex-col items-end">
                                            <span className="text-sm text-muted-foreground">Chiara</span>
                                            <span className={`text-lg font-bold ${(distribution.chiaraOwes ?? 0) > 0 ? 'text-orange-500' : 'text-green-600'}`}>
                                                €{(distribution.chiaraOwes ?? 0).toLocaleString(undefined, { maximumFractionDigits: 0 })}
                                            </span>
                                        </div>
                                        <div className="flex flex-col items-end">
                                            <span className="text-sm text-muted-foreground">Fernando</span>
                                            <span className={`text-lg font-bold ${(distribution.fernandoOwes ?? 0) > 0 ? 'text-orange-500' : 'text-green-600'}`}>
                                                €{(distribution.fernandoOwes ?? 0).toLocaleString(undefined, { maximumFractionDigits: 0 })}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            ) : null}
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Budget Tables */}
            <Tabs defaultValue="breakdown" className="w-full">
                <TabsList>
                    <TabsTrigger value="breakdown">{t('common.detailedBreakdown')}</TabsTrigger>
                    <TabsTrigger value="payments">{t('common.payments')}</TabsTrigger>
                </TabsList>

                <TabsContent value="breakdown">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between">
                            <CardTitle>{t('common.detailedBreakdown')}</CardTitle>
                            {isEditing && (
                                <Button size="sm" variant="outline" onClick={() => addBudgetItem({ category: 'New Item', amount: 0 })}>
                                    <Plus className="h-4 w-4 mr-2" /> {t('common.addItem')}
                                </Button>
                            )}
                        </CardHeader>
                        <CardContent>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead className="w-[140px]">{t('common.category')}</TableHead>
                                        <TableHead className="text-right">{t('common.amount')}</TableHead>
                                        {isEditing && <TableHead className="w-[50px]"></TableHead>}
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {budgetItems.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={isEditing ? 3 : 2} className="text-center py-8 text-muted-foreground">
                                                {t('common.noItemsFound')}
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
                    {/* Payments Summary Card - Only visible in Payments tab */}
                    <div className="grid gap-4 mb-6 md:grid-cols-2">
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">{t('common.totalPaid')}</CardTitle>
                                <Euro className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                <div className="flex flex-col gap-2">
                                    <div>
                                        <div className="text-2xl font-bold">€{paymentItems.reduce((acc, item) => acc + item.paid, 0).toLocaleString(undefined, { maximumFractionDigits: 0 })}</div>
                                        <p className="text-xs text-muted-foreground">{t('common.amountPaid')}</p>
                                    </div>
                                    {(paymentItems.length > 0) ? (() => {
                                        const total = paymentItems.reduce((acc, item) => acc + item.paid, 0);
                                        if (total === 0) return null;
                                        const cashPaid = paymentItems.filter(item => item.method === 'Cash').reduce((acc, item) => acc + item.paid, 0);
                                        const transferPaid = paymentItems.filter(item => item.method === 'Transfer').reduce((acc, item) => acc + item.paid, 0);
                                        return (
                                            <>
                                                <div className="flex justify-between items-center text-sm border-t pt-2 mt-2">
                                                    <div className="flex flex-col">
                                                        <span className="text-muted-foreground">{t('common.cash')}</span>
                                                        <span className="font-semibold text-green-600">€{cashPaid.toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
                                                    </div>
                                                    <div className="flex flex-col items-end">
                                                        <span className="text-muted-foreground">{t('common.transfer')}</span>
                                                        <span className="font-semibold text-blue-600">€{transferPaid.toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
                                                    </div>
                                                </div>
                                                {(distribution.chiaraPct > 0 || distribution.fernandoPct > 0) && (
                                                    <div className="flex justify-between items-center text-sm border-t pt-2 mt-2">
                                                        <div className="flex flex-col">
                                                            <span className="text-muted-foreground">Chiara</span>
                                                            <span className="font-semibold">€{(total * distribution.chiaraPct).toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
                                                        </div>
                                                        <div className="flex flex-col items-end">
                                                            <span className="text-muted-foreground">Fernando</span>
                                                            <span className="font-semibold">€{(total * distribution.fernandoPct).toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
                                                        </div>
                                                    </div>
                                                )}
                                            </>
                                        );
                                    })() : null}
                                </div>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">{t('common.totalPending')}</CardTitle>
                                <Euro className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                <div className="flex flex-col gap-2">
                                    <div>
                                        <div className="text-2xl font-bold">€{paymentItems.reduce((acc, item) => acc + (item.amount - item.paid), 0).toLocaleString(undefined, { maximumFractionDigits: 0 })}</div>
                                        <p className="text-xs text-muted-foreground">{t('common.amountRemaining')}</p>
                                    </div>
                                    {(paymentItems.length > 0) ? (() => {
                                        const total = paymentItems.reduce((acc, item) => acc + (item.amount - item.paid), 0);
                                        if (total === 0) return null;
                                        const cashPending = paymentItems.filter(item => item.method === 'Cash').reduce((acc, item) => acc + (item.amount - item.paid), 0);
                                        const transferPending = paymentItems.filter(item => item.method === 'Transfer').reduce((acc, item) => acc + (item.amount - item.paid), 0);
                                        return (
                                            <>
                                                <div className="flex justify-between items-center text-sm border-t pt-2 mt-2">
                                                    <div className="flex flex-col">
                                                        <span className="text-muted-foreground">{t('common.cash')}</span>
                                                        <span className="font-semibold text-orange-500">€{cashPending.toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
                                                    </div>
                                                    <div className="flex flex-col items-end">
                                                        <span className="text-muted-foreground">{t('common.transfer')}</span>
                                                        <span className="font-semibold text-orange-500">€{transferPending.toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
                                                    </div>
                                                </div>
                                                {(distribution.chiaraPct > 0 || distribution.fernandoPct > 0) && (
                                                    <div className="flex justify-between items-center text-sm border-t pt-2 mt-2">
                                                        <div className="flex flex-col">
                                                            <span className="text-muted-foreground">Chiara</span>
                                                            <span className="font-semibold">€{(total * distribution.chiaraPct).toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
                                                        </div>
                                                        <div className="flex flex-col items-end">
                                                            <span className="text-muted-foreground">Fernando</span>
                                                            <span className="font-semibold">€{(total * distribution.fernandoPct).toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
                                                        </div>
                                                    </div>
                                                )}
                                            </>
                                        );
                                    })() : null}
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between">
                            <CardTitle>{t('common.payments')}</CardTitle>
                            {isEditing && (
                                <Button size="sm" variant="outline" onClick={() => addPaymentItem({ description: 'New Payment', amount: 0, paid: 0, pending: 0, method: 'Transfer' })}>
                                    <Plus className="h-4 w-4 mr-2" /> {t('common.addPayment')}
                                </Button>
                            )}
                        </CardHeader>
                        <CardContent>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead className="w-[140px]">{t('common.concept')}</TableHead>
                                        <TableHead className="w-[120px]">{t('common.method')}</TableHead>
                                        <TableHead className="text-right">{t('common.total')}</TableHead>
                                        <TableHead className="text-right">{t('common.paid')}</TableHead>
                                        <TableHead className="text-right">{t('common.pending')}</TableHead>
                                        {isEditing && <TableHead className="w-[50px]"></TableHead>}
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {paymentItems.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={isEditing ? 6 : 5} className="text-center py-8 text-muted-foreground">
                                                {t('common.noPaymentsFound')}
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
                                                <TableCell>
                                                    {isEditing ? (
                                                        <Select
                                                            value={item.method || ''}
                                                            onValueChange={(value) => updatePaymentItem(item.id, { method: value as 'Cash' | 'Transfer' })}
                                                        >
                                                            <SelectTrigger>
                                                                <SelectValue placeholder={t('common.method')} />
                                                            </SelectTrigger>
                                                            <SelectContent>
                                                                <SelectItem value="Cash">{t('common.cash')}</SelectItem>
                                                                <SelectItem value="Transfer">{t('common.transfer')}</SelectItem>
                                                            </SelectContent>
                                                        </Select>
                                                    ) : (
                                                        item.method === 'Cash' ? t('common.cash') : item.method === 'Transfer' ? t('common.transfer') : '-'
                                                    )}
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    {isEditing ? (
                                                        <Input
                                                            type="number"
                                                            className="text-right"
                                                            value={item.amount}
                                                            onChange={(e) => {
                                                                const newAmount = parseFloat(e.target.value) || 0;
                                                                updatePaymentItem(item.id, { amount: newAmount, pending: newAmount - item.paid });
                                                            }}
                                                        />
                                                    ) : `€${item.amount.toLocaleString()}`}
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    {isEditing ? (
                                                        <Input
                                                            type="number"
                                                            className="text-right"
                                                            value={item.paid}
                                                            onChange={(e) => {
                                                                const newPaid = parseFloat(e.target.value) || 0;
                                                                updatePaymentItem(item.id, { paid: newPaid, pending: item.amount - newPaid });
                                                            }}
                                                        />
                                                    ) : `€${item.paid.toLocaleString()}`}
                                                </TableCell>
                                                <TableCell className="text-right font-medium">
                                                    €{(item.amount - item.paid).toLocaleString()}
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
                            <Save className="mr-2 h-4 w-4" /> {t('common.doneEditing')}
                        </>
                    ) : (
                        <>
                            <Pencil className="mr-2 h-4 w-4" /> {t('common.editBudget')}
                        </>
                    )}
                </Button>
            </div>
        </div>
    );
}
