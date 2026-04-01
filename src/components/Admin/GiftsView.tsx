import { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useGifts } from '@/hooks/useGifts';
import { useGuests } from '@/hooks/useGuests';
import { Gift, Guest } from '@/types';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Pencil, Trash2, Search, Link as LinkIcon, Gift as GiftIcon } from 'lucide-react';
import { Card, CardHeader, CardTitle } from '@/components/ui/card';

export function GiftsView() {
    const { t } = useTranslation();
    const { gifts, saveGift, deleteGift, totalAmount } = useGifts();
    const { guests, isLoading: isLoadingGuests } = useGuests();
    const [searchTerm, setSearchTerm] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingGift, setEditingGift] = useState<Gift | null>(null);
    const [formData, setFormData] = useState<Partial<Gift>>({});

    const getLinkedGuests = (guest: Guest) => {
        if (!guest.group_id) return [];
        return guests.filter(g => g.group_id === guest.group_id && g.id !== guest.id);
    };

    // Group guests for the dropdown
    const guestOptions = useMemo(() => {
        const options: { id: string; label: string; group_id?: string; guest_id: string }[] = [];
        const processedGroups = new Set<string>();

        guests.forEach(guest => {
            if (guest.group_id && !processedGroups.has(guest.group_id)) {
                // It's a group
                processedGroups.add(guest.group_id);
                const groupMembers = [guest, ...getLinkedGuests(guest)];
                options.push({
                    id: guest.group_id, // we use group_id as unique key for dropdown, but we will store guest_id and group_id
                    label: groupMembers.map(g => g.name).join(' + '),
                    group_id: guest.group_id,
                    guest_id: guest.id // primary contact for the group
                });
            } else if (!guest.group_id) {
                // Solo guest
                options.push({
                    id: guest.id,
                    label: guest.name,
                    guest_id: guest.id
                });
            }
        });
        return options;
    }, [guests]);

    const distribution = useMemo(() => {
        let chiaraCount = 0;
        let fernandoCount = 0;

        guests.forEach(guest => {
            const side = guest.side?.toLowerCase();
            if (side === 'chiara') {
                chiaraCount += 1;
            } else if (side === 'fernando') {
                fernandoCount += 1;
            } else if (side === 'both') {
                chiaraCount += 0.5;
                fernandoCount += 0.5;
            }
        });

        const totalCount = chiaraCount + fernandoCount;
        if (totalCount === 0) return { chiaraAmount: 0, fernandoAmount: 0, chiaraPct: 0, fernandoPct: 0 };

        const chiaraPct = chiaraCount / totalCount;
        const fernandoPct = fernandoCount / totalCount;

        return {
            chiaraAmount: totalAmount * chiaraPct,
            fernandoAmount: totalAmount * fernandoPct,
            chiaraPct,
            fernandoPct
        };
    }, [guests, totalAmount]);

    const filteredGifts = useMemo(() => {
        return gifts.filter(gift => {
            if (!searchTerm) return true;
            // Find the associated guest or group to search by name
            const assignedOption = guestOptions.find(opt =>
                (gift.group_id && opt.group_id === gift.group_id) ||
                (gift.guest_id === opt.guest_id && !opt.group_id)
            );
            return assignedOption?.label.toLowerCase().includes(searchTerm.toLowerCase()) ||
                gift.notes?.toLowerCase().includes(searchTerm.toLowerCase());
        });
    }, [gifts, searchTerm, guestOptions]);

    const handleOpenModal = (gift?: Gift) => {
        if (gift) {
            setEditingGift(gift);
            setFormData(gift);
        } else {
            setEditingGift(null);
            setFormData({ amount: 0, notes: '' });
        }
        setIsModalOpen(true);
    };

    const handleSave = async () => {
        if (!formData.amount || formData.amount <= 0) return;
        await saveGift(formData);
        setIsModalOpen(false);
    };

    return (
        <div className="space-y-6">
            <Card>
                <CardHeader className="py-4">
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                        <div>
                            <CardTitle className="text-sm font-medium text-muted-foreground">{t('gifts.totalReceived', 'Total Received')}</CardTitle>
                            <div className="text-3xl font-bold text-green-600">€{totalAmount.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}</div>
                        </div>
                        {(totalAmount > 0 && (distribution.chiaraPct > 0 || distribution.fernandoPct > 0)) ? (
                            <div className="flex gap-6">
                                <div className="flex flex-col items-end">
                                    <span className="text-sm text-muted-foreground">{t('gifts.chiaraShare', "Chiara")} ({Math.round(distribution.chiaraPct * 100)}%)</span>
                                    <span className="text-xl font-semibold text-green-600">€{distribution.chiaraAmount.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}</span>
                                </div>
                                <div className="flex flex-col items-end">
                                    <span className="text-sm text-muted-foreground">{t('gifts.fernandoShare', "Fernando")} ({Math.round(distribution.fernandoPct * 100)}%)</span>
                                    <span className="text-xl font-semibold text-green-600">€{distribution.fernandoAmount.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}</span>
                                </div>
                            </div>
                        ) : null}
                    </div>
                </CardHeader>
            </Card>

            <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                <div className="relative w-full md:w-72">
                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder={t('gifts.searchPlaceholder', 'Search by guest...')}
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-8"
                    />
                </div>
                <div className="flex items-center gap-2">
                    <Button onClick={() => handleOpenModal()}>
                        <Plus className="h-4 w-4 mr-2" />
                        {t('gifts.addGift', 'Add Gift')}
                    </Button>
                </div>
            </div>

            <div className="rounded-md border bg-card overflow-hidden">
                <Table>
                    <TableHeader className="bg-secondary/20">
                        <TableRow>
                            <TableHead className="w-[35%]">{t('gifts.guestName', 'Guest / Couple')}</TableHead>
                            <TableHead className="w-[20%]">{t('gifts.amountEuros', 'Amount (€)')}</TableHead>
                            <TableHead className="w-[30%]">{t('gifts.notes', 'Notes')}</TableHead>
                            <TableHead className="w-[15%] text-right">{t('gifts.actions', 'Actions')}</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {filteredGifts.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={4} className="h-24 text-center text-muted-foreground">
                                    {t('gifts.noGiftsFound', 'No gifts recorded yet.')}
                                </TableCell>
                            </TableRow>
                        ) : (
                            filteredGifts.map((gift) => {
                                const matchedOption = guestOptions.find(opt =>
                                    (gift.group_id && opt.group_id === gift.group_id) ||
                                    (gift.guest_id === opt.guest_id)
                                );
                                return (
                                    <TableRow key={gift.id}>
                                        <TableCell className="font-medium">
                                            <div className="flex items-center gap-2">
                                                <GiftIcon className="h-4 w-4 text-muted-foreground" />
                                                {matchedOption?.label || t('common.unknown', 'Unknown')}
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <span className="font-semibold text-green-600">€{gift.amount}</span>
                                        </TableCell>
                                        <TableCell className="max-w-[200px] truncate text-muted-foreground" title={gift.notes}>
                                            {gift.notes || '-'}
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <div className="flex justify-end gap-2">
                                                <Button variant="ghost" size="icon" onClick={() => handleOpenModal(gift)}>
                                                    <Pencil className="h-4 w-4" />
                                                </Button>
                                                <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive hover:bg-destructive/10" onClick={() => deleteGift(gift.id)}>
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                );
                            })
                        )}
                    </TableBody>
                </Table>
            </div>

            <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <DialogTitle>{editingGift ? t('gifts.editGift', 'Edit Gift') : t('gifts.addGift', 'Add Gift')}</DialogTitle>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid gap-2">
                            <Label>{t('gifts.guestName', 'Guest / Couple')}</Label>
                            <Select
                                value={formData.group_id || formData.guest_id || ''}
                                onValueChange={(val) => {
                                    const selected = guestOptions.find(opt => opt.id === val);
                                    if (selected) {
                                        setFormData({
                                            ...formData,
                                            guest_id: selected.guest_id,
                                            group_id: selected.group_id
                                        });
                                    }
                                }}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder={t('gifts.groupPlaceholder', 'Select a guest or couple')} />
                                </SelectTrigger>
                                <SelectContent className="max-h-[250px]">
                                    {guestOptions.map(opt => (
                                        <SelectItem key={opt.id} value={opt.id}>
                                            <div className="flex items-center gap-2">
                                                <span>{opt.label}</span>
                                                {opt.group_id && <LinkIcon className="h-3 w-3 text-muted-foreground" />}
                                            </div>
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="grid gap-2">
                            <Label htmlFor="amount">{t('gifts.amountEuros', 'Amount (€)')}</Label>
                            <Input
                                id="amount"
                                type="number"
                                min="0"
                                step="1"
                                value={formData.amount || ''}
                                onChange={(e) => setFormData({ ...formData, amount: parseFloat(e.target.value) || 0 })}
                            />
                        </div>

                        <div className="grid gap-2">
                            <Label htmlFor="notes">{t('gifts.notes', 'Notes')}</Label>
                            <Textarea
                                id="notes"
                                value={formData.notes || ''}
                                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                                placeholder="Bank transfer, cash, etc."
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsModalOpen(false)}>
                            {t('common.cancel', 'Cancel')}
                        </Button>
                        <Button
                            onClick={handleSave}
                            disabled={!formData.amount || !(formData.guest_id || formData.group_id)}
                        >
                            {t('common.saveChanges', 'Save Changes')}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
