
import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Users,
    Plus,
    Trash2,
    Edit2,
    Circle,
    Square,
    MoreVertical,
    Maximize2,
    Minimize2,
    Save,
    X
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { useTables } from '@/hooks/useTables';
import { useGuests } from '@/hooks/useGuests';
import { Guest, Table } from '@/types';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';

interface TableModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (table: Omit<Table, 'id' | 'guests'>) => void;
    initialData?: Table | null;
}

function TableModal({ isOpen, onClose, onSave, initialData }: TableModalProps) {
    const { t } = useTranslation();
    const [name, setName] = useState('');
    const [shape, setShape] = useState<'circle' | 'square' | 'rectangle'>('circle');
    const [minCapacity, setMinCapacity] = useState(2);
    const [maxCapacity, setMaxCapacity] = useState(10);

    useEffect(() => {
        if (initialData) {
            setName(initialData.name);
            setShape(initialData.shape);
            setMinCapacity(initialData.capacity.min);
            setMaxCapacity(initialData.capacity.max);
        } else {
            setName('');
            setShape('circle');
            setMinCapacity(2);
            setMaxCapacity(10);
        }
    }, [initialData, isOpen]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave({
            name,
            shape,
            capacity: {
                min: minCapacity,
                max: maxCapacity
            }
        });
        onClose();
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>{initialData ? t('tables.editTable') : t('tables.addTable')}</DialogTitle>
                    <DialogDescription>
                        {t('tables.configureTableDetails')}
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="name">{t('tables.tableName')}</Label>
                        <Input
                            id="name"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder={t('tables.tableNamePlaceholder')}
                            required
                        />
                    </div>

                    <div className="space-y-2">
                        <Label>{t('tables.shape')}</Label>
                        <div className="flex gap-4">
                            <div
                                onClick={() => setShape('circle')}
                                className={`cursor-pointer flex flex-col items-center p-3 rounded-lg border-2 transition-all ${shape === 'circle' ? 'border-primary bg-primary/5' : 'border-transparent hover:bg-muted'}`}
                            >
                                <div className="w-12 h-12 rounded-full border-2 border-current mb-2 flex items-center justify-center">
                                    <Users className="w-4 h-4" />
                                </div>
                                <span className="text-xs font-medium">{t('tables.circle')}</span>
                            </div>
                            <div
                                onClick={() => setShape('square')}
                                className={`cursor-pointer flex flex-col items-center p-3 rounded-lg border-2 transition-all ${shape === 'square' ? 'border-primary bg-primary/5' : 'border-transparent hover:bg-muted'}`}
                            >
                                <div className="w-12 h-12 rounded-none border-2 border-current mb-2 flex items-center justify-center">
                                    <Users className="w-4 h-4" />
                                </div>
                                <span className="text-xs font-medium">{t('tables.square')}</span>
                            </div>
                            <div
                                onClick={() => setShape('rectangle')}
                                className={`cursor-pointer flex flex-col items-center p-3 rounded-lg border-2 transition-all ${shape === 'rectangle' ? 'border-primary bg-primary/5' : 'border-transparent hover:bg-muted'}`}
                            >
                                <div className="w-16 h-8 rounded-sm border-2 border-current my-2 flex items-center justify-center">
                                    <Users className="w-4 h-4" />
                                </div>
                                <span className="text-xs font-medium">{t('tables.rectangle')}</span>
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="min">{t('tables.minCapacity')}</Label>
                            <Input
                                id="min"
                                type="number"
                                min={2}
                                value={minCapacity}
                                onChange={(e) => setMinCapacity(parseInt(e.target.value))}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="max">{t('tables.maxCapacity')}</Label>
                            <Input
                                id="max"
                                type="number"
                                min={minCapacity}
                                value={maxCapacity}
                                onChange={(e) => setMaxCapacity(parseInt(e.target.value))}
                            />
                        </div>
                    </div>

                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={onClose}>{t('common.cancel')}</Button>
                        <Button type="submit">{t('common.save')}</Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}

export function TablesView() {
    const { t } = useTranslation();
    const { tables, isLoading: tablesLoading, addTable, updateTable, deleteTable, assignGuestToTable, refreshTables } = useTables();
    const { guests, isLoading: guestsLoading, refreshGuests } = useGuests();

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingTable, setEditingTable] = useState<Table | null>(null);
    const [draggedGuest, setDraggedGuest] = useState<Guest | null>(null);

    // Combine tables with guests
    const enrichedTables = tables.map(table => ({
        ...table,
        guests: guests.filter(g => g.table_id === table.id)
    }));

    const unassignedGuests = guests.filter(g => !g.table_id && g.confirmation_status === 'Confirmed');

    const handleDragStart = (e: React.DragEvent, guest: Guest) => {
        e.dataTransfer.setData('guestId', guest.id);
        setDraggedGuest(guest);
    };

    const handleDrop = async (e: React.DragEvent, tableId: string | null) => {
        e.preventDefault();
        const guestId = e.dataTransfer.getData('guestId');
        if (guestId) {
            await assignGuestToTable(guestId, tableId);
            refreshGuests(); // Refresh guests to update the list
            refreshTables();
        }
        setDraggedGuest(null);
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
    };

    const handleEditTable = (table: Table) => {
        setEditingTable(table);
        setIsModalOpen(true);
    };

    const handleSaveTable = async (tableData: Omit<Table, 'id' | 'guests'>) => {
        if (editingTable) {
            await updateTable(editingTable.id, tableData);
        } else {
            await addTable(tableData);
        }
        setEditingTable(null);
    };

    const handleDeleteTable = async (tableId: string) => {
        if (confirm(t('tables.confirmDelete'))) {
            // Unassign guests first? Or let database handle it (if cascade set null)
            // For now just delete table
            await deleteTable(tableId);
        }
    };

    if (tablesLoading || guestsLoading) {
        return <div className="p-8 text-center">{t('common.loading')}</div>;
    }

    return (
        <div className="flex h-[calc(100vh-10rem)] gap-6">
            {/* Sidebar - Unassigned Guests */}
            <Card className="w-80 flex flex-col h-full bg-slate-50 border-none shadow-md">
                <CardHeader className="pb-3 bg-white rounded-t-lg border-b">
                    <CardTitle className="text-lg flex justify-between items-center">
                        {t('tables.unassignedGuests')}
                        <Badge variant="secondary">{unassignedGuests.length}</Badge>
                    </CardTitle>
                    <CardDescription>{t('tables.dragToAssign')}</CardDescription>
                </CardHeader>
                <div
                    className="flex-1 overflow-auto p-4 space-y-2 bg-slate-50/50"
                    onDragOver={handleDragOver}
                    onDrop={(e) => handleDrop(e, null)} // Drop back to unassigned
                >
                    <AnimatePresence>
                        {unassignedGuests.map(guest => (
                            <motion.div
                                key={guest.id}
                                layout
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.9 }}
                                draggable
                                onDragStart={(e) => handleDragStart(e as unknown as React.DragEvent, guest)}
                                className="p-3 bg-white rounded-lg shadow-sm border border-slate-200 cursor-move hover:shadow-md transition-all flex items-center justify-between group"
                            >
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xs">
                                        {guest.name.charAt(0)}
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="text-sm font-medium">{guest.name}</span>
                                        {guest.plus_one && <span className="text-[10px] text-muted-foreground">+1</span>}
                                    </div>
                                </div>
                                <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                                    <MoreVertical className="w-4 h-4 text-slate-400" />
                                </div>
                            </motion.div>
                        ))}
                        {unassignedGuests.length === 0 && (
                            <div className="text-center py-8 text-muted-foreground text-sm italic">
                                {t('tables.allGuestsAssigned')}
                            </div>
                        )}
                    </AnimatePresence>
                </div>
            </Card>

            {/* Main Area - Tables */}
            <div className="flex-1 flex flex-col h-full overflow-hidden">
                <div className="flex justify-between items-center mb-6 px-1">
                    <div>
                        <h2 className="text-2xl font-serif font-semibold">{t('tables.receptionPlan')}</h2>
                        <p className="text-muted-foreground">{t('tables.manageSeating')}</p>
                    </div>
                    <Button onClick={() => { setEditingTable(null); setIsModalOpen(true); }} className="shadow-lg hover:shadow-xl transition-all">
                        <Plus className="w-4 h-4 mr-2" />
                        {t('tables.addTable')}
                    </Button>
                </div>

                <ScrollArea className="flex-1 -mx-4 px-4 pb-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 auto-rows-max">
                        <AnimatePresence>
                            {enrichedTables.map(table => (
                                <motion.div
                                    key={table.id}
                                    layout
                                    initial={{ opacity: 0, scale: 0.9 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0, scale: 0.9 }}
                                >
                                    <div
                                        className={`relative group bg-white rounded-xl shadow-sm border-2 transition-all p-4 flex flex-col items-center
                                ${draggedGuest ? 'border-dashed border-primary/50 bg-primary/5' : 'border-transparent hover:border-slate-200'}
                            `}
                                        onDragOver={handleDragOver}
                                        onDrop={(e) => handleDrop(e, table.id)}
                                        style={{ minHeight: '280px' }}
                                    >
                                        {/* Actions Header */}
                                        <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleEditTable(table)}>
                                                <Edit2 className="w-3 h-3" />
                                            </Button>
                                            <Button variant="ghost" size="icon" className="h-7 w-7 text-red-500 hover:text-red-600 hover:bg-red-50" onClick={() => handleDeleteTable(table.id)}>
                                                <Trash2 className="w-3 h-3" />
                                            </Button>
                                        </div>

                                        {/* Table Shape Visualization */}
                                        <div className={`mt-2 mb-4 relative flex items-center justify-center transition-all duration-300
                                ${table.shape === 'circle' ? 'w-32 h-32 rounded-full' : table.shape === 'square' ? 'w-32 h-32 rounded-xl' : 'w-48 h-24 rounded-lg'}
                                border-4 border-slate-200 bg-slate-50
                            `}>
                                            <div className="text-center z-10">
                                                <div className="font-bold text-lg text-slate-700">{table.name}</div>
                                                <div className="text-xs text-muted-foreground mt-1">
                                                    {table.guests?.length || 0} / {table.capacity.max}
                                                </div>
                                            </div>

                                            {/* Capacity Indicator Ring (rough) */}
                                            <div
                                                className={`absolute inset-0 rounded-full border-4 border-primary transition-all duration-500`}
                                                style={{
                                                    clipPath: `inset(0 0 ${(1 - ((table.guests?.length || 0) / table.capacity.max)) * 100}% 0)`
                                                }}
                                            />
                                        </div>

                                        {/* Assigned Guests List */}
                                        <div className="w-full flex-1 space-y-1">
                                            <div className="flex items-center justify-between text-xs font-semibold text-muted-foreground mb-2 px-1">
                                                <span>{t('tables.guests')}</span>
                                                <span>{table.guests?.length || 0}</span>
                                            </div>
                                            <div className="space-y-1 w-full max-h-[120px] overflow-y-auto pr-1">
                                                {table.guests?.map(guest => (
                                                    <div
                                                        key={guest.id}
                                                        draggable
                                                        onDragStart={(e) => handleDragStart(e as unknown as React.DragEvent, guest)}
                                                        className="text-xs p-2 bg-slate-50 rounded border border-slate-100 flex justify-between items-center cursor-move hover:bg-white hover:shadow-sm"
                                                    >
                                                        <span className="truncate">{guest.name}</span>
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            className="h-4 w-4 opacity-50 hover:opacity-100"
                                                            onClick={() => assignGuestToTable(guest.id, null)}
                                                        >
                                                            <X className="w-3 h-3" />
                                                        </Button>
                                                    </div>
                                                ))}
                                                {(!table.guests || table.guests.length === 0) && (
                                                    <div className="text-center py-4 text-xs text-muted-foreground border-2 border-dashed border-slate-100 rounded">
                                                        {t('tables.dropGuestsHere')}
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        {/* Warning if capacity exceeded or under min */}
                                        <div className="mt-3 w-full">
                                            {table.guests && table.guests.length > table.capacity.max && (
                                                <div className="px-2 py-1 bg-red-100 text-red-700 text-[10px] rounded text-center font-medium animate-pulse">
                                                    {t('tables.overCapacity')}
                                                </div>
                                            )}
                                            {table.guests && table.guests.length > 0 && table.guests.length < table.capacity.min && (
                                                <div className="px-2 py-1 bg-amber-100 text-amber-700 text-[10px] rounded text-center font-medium">
                                                    {t('tables.underCapacity')}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </motion.div>
                            ))}
                        </AnimatePresence>

                        {/* Empty State */}
                        {enrichedTables.length === 0 && (
                            <div className="col-span-full flex flex-col items-center justify-center p-12 text-center text-muted-foreground border-2 border-dashed rounded-xl">
                                <Users className="w-12 h-12 mb-4 opacity-20" />
                                <h3 className="text-lg font-medium mb-1">{t('tables.noTablesYet')}</h3>
                                <p className="text-sm mb-4">{t('tables.startWithTables')}</p>
                                <Button variant="outline" onClick={() => setIsModalOpen(true)}>
                                    {t('tables.createFirstTable')}
                                </Button>
                            </div>
                        )}
                    </div>
                </ScrollArea>
            </div>

            <TableModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSave={handleSaveTable}
                initialData={editingTable}
            />
        </div>
    );
}
