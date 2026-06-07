import { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import { Users, Armchair, Edit2, Info } from 'lucide-react';
import { useTables } from '@/hooks/useTables';
import { useGuests } from '@/hooks/useGuests';
import { Guest, Table } from '@/types';
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

export function SeatingPlanView() {
    const { t } = useTranslation();
    const { tables, isLoading: tablesLoading, updateTable } = useTables();
    const { guests, isLoading: guestsLoading, updateGuest, updateGuestsBulk } = useGuests();
    
    const [selectedTableId, setSelectedTableId] = useState<string | null>(null);
    const [draggedGuestId, setDraggedGuestId] = useState<string | null>(null);
    const [draggedTableId, setDraggedTableId] = useState<string | null>(null);

    const selectedTable = useMemo(() => tables.find(t => t.id === selectedTableId) || null, [tables, selectedTableId]);
    
    const tableGuests = useMemo(() => {
        if (!selectedTableId) return [];
        return guests.filter(g => g.table_id === selectedTableId);
    }, [guests, selectedTableId]);

    // Ensure all guests at the table have a unique seat_index if they don't already
    const assignedSeats = useMemo(() => {
        if (!selectedTable) return [];
        const seats: (Guest | null)[] = Array(selectedTable.capacity.max).fill(null);
        
        // Place guests with a valid seat_index
        tableGuests.forEach(g => {
            if (typeof g.seat_index === 'number' && g.seat_index >= 0 && g.seat_index < selectedTable.capacity.max) {
                if (!seats[g.seat_index]) {
                    seats[g.seat_index] = g;
                }
            }
        });

        // Place guests without a valid seat_index in the first available empty seat
        tableGuests.forEach(g => {
            if (typeof g.seat_index !== 'number' || g.seat_index < 0 || g.seat_index >= selectedTable.capacity.max || seats[g.seat_index] !== g) {
                const emptyIndex = seats.findIndex(s => s === null);
                if (emptyIndex !== -1) {
                    seats[emptyIndex] = g;
                    // We technically should save this to DB, but we'll let it be visual until they move someone
                }
            }
        });

        return seats;
    }, [selectedTable, tableGuests]);

    const handleDragStart = (e: React.DragEvent, guestId: string) => {
        e.dataTransfer.setData('text/plain', guestId);
        setDraggedGuestId(guestId);
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
    };

    const handleDrop = async (e: React.DragEvent, targetIndex: number) => {
        e.preventDefault();
        e.stopPropagation();
        const guestId = e.dataTransfer.getData('text/plain');
        if (!guestId || !selectedTable) return;

        const draggedGuest = tableGuests.find(g => g.id === guestId);
        if (!draggedGuest) return;

        const targetGuest = assignedSeats[targetIndex];
        
        // Find if this dragged guest has a partner (same group_id)
        const partner = draggedGuest.group_id ? tableGuests.find(g => g.group_id === draggedGuest.group_id && g.id !== draggedGuest.id) : null;

        const updates: {id: string, updates: Partial<Guest>}[] = [];

        if (partner) {
            // It's a couple, we need to place them in targetIndex and targetIndex + 1
            const nextIndex = (targetIndex + 1) % selectedTable.capacity.max;
            updates.push({ id: draggedGuest.id, updates: { seat_index: targetIndex } });
            updates.push({ id: partner.id, updates: { seat_index: nextIndex } });

            // What happens to the people already in targetIndex and nextIndex?
            // Swap them to the original positions of the couple
            const originalDraggedIndex = assignedSeats.findIndex(g => g?.id === draggedGuest.id);
            const originalPartnerIndex = assignedSeats.findIndex(g => g?.id === partner.id);
            
            if (targetGuest && targetGuest.id !== draggedGuest.id && targetGuest.id !== partner.id) {
                updates.push({ id: targetGuest.id, updates: { seat_index: originalDraggedIndex } });
            }
            
            const nextTargetGuest = assignedSeats[nextIndex];
            if (nextTargetGuest && nextTargetGuest.id !== draggedGuest.id && nextTargetGuest.id !== partner.id) {
                updates.push({ id: nextTargetGuest.id, updates: { seat_index: originalPartnerIndex !== -1 ? originalPartnerIndex : (originalDraggedIndex + 1) % selectedTable.capacity.max } });
            }
        } else {
            // Single person swap
            updates.push({ id: draggedGuest.id, updates: { seat_index: targetIndex } });
            if (targetGuest) {
                const originalIndex = assignedSeats.findIndex(g => g?.id === draggedGuest.id);
                updates.push({ id: targetGuest.id, updates: { seat_index: originalIndex } });
            }
        }

        if (updates.length > 0) {
            await updateGuestsBulk(updates);
        }
        setDraggedGuestId(null);
    };

    const handleTableDragStart = (e: React.DragEvent, tableId: string) => {
        e.dataTransfer.setData('tableId', tableId);
        setDraggedTableId(tableId);
    };

    const handleMapDrop = async (e: React.DragEvent) => {
        e.preventDefault();
        const tableId = e.dataTransfer.getData('tableId');
        if (!tableId) return;
        
        // Calculate percentages
        const rect = e.currentTarget.getBoundingClientRect();
        const x = ((e.clientX - rect.left) / rect.width) * 100;
        const y = ((e.clientY - rect.top) / rect.height) * 100;
        
        await updateTable(tableId, { position: { x, y } });
        setDraggedTableId(null);
    };

    if (tablesLoading || guestsLoading) {
        return <div className="p-8 text-center text-muted-foreground">{t('common.loading', 'Loading...')}</div>;
    }

    // Math for positioning seats in a circle/square
    const getSeatStyle = (index: number, total: number, shape: string) => {
        if (shape === 'circle') {
            const angle = (index / total) * 2 * Math.PI - Math.PI / 2;
            const radius = 42; // Percentage of container width
            return {
                left: `${50 + radius * Math.cos(angle)}%`,
                top: `${50 + radius * Math.sin(angle)}%`,
                transform: 'translate(-50%, -50%)'
            };
        } else if (shape === 'square') {
            // Approximate perimeter positioning
            const side = total / 4;
            let x = 0, y = 0;
            if (index < side) { // Top edge
                x = 10 + (80 / side) * index; y = 5;
            } else if (index < 2 * side) { // Right edge
                x = 95; y = 10 + (80 / side) * (index - side);
            } else if (index < 3 * side) { // Bottom edge
                x = 90 - (80 / side) * (index - 2 * side); y = 95;
            } else { // Left edge
                x = 5; y = 90 - (80 / side) * (index - 3 * side);
            }
            return {
                left: `${x}%`,
                top: `${y}%`,
                transform: 'translate(-50%, -50%)'
            };
        } else { // rectangle
            const longSide = Math.ceil(total * 0.35);
            const shortSide = Math.floor(total * 0.15);
            // Very simplified approximation for rectangle
            return getSeatStyle(index, total, 'circle'); // fallback to circle if math gets too complex for simple UI
        }
    };

    return (
        <div className="flex flex-col lg:flex-row gap-4 lg:gap-6 items-start h-[calc(100vh-10rem)]">
            {/* Sidebar - Guest List */}
            {selectedTable && (
                <Card className="w-full lg:w-80 h-48 lg:h-full flex flex-col bg-slate-50 border-none shadow-md shrink-0 lg:sticky lg:top-4 z-10 overflow-hidden">
                    <CardHeader className="pb-3 bg-white rounded-t-lg border-b">
                        <CardTitle className="text-lg">{selectedTable.name} Guests</CardTitle>
                        <CardDescription>Drag to reorder seats. Couples move together.</CardDescription>
                    </CardHeader>
                    <div className="flex-1 overflow-y-auto p-4 space-y-2">
                        {assignedSeats.map((guest, index) => {
                            if (!guest) return null;
                            const isDragged = draggedGuestId === guest.id;
                            return (
                                <div
                                    key={guest.id}
                                    draggable
                                    onDragStart={(e: any) => handleDragStart(e, guest.id)}
                                    onDragOver={handleDragOver}
                                    onDrop={(e) => handleDrop(e, index)}
                                    className={`bg-white border rounded-md p-3 shadow-sm cursor-grab active:cursor-grabbing flex items-center justify-between transition-all ${isDragged ? 'opacity-50 scale-95 border-primary border-dashed' : 'hover:border-slate-300'}`}
                                >
                                    <div className="flex items-center gap-3">
                                        <div className="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center text-xs font-semibold text-slate-500">
                                            {index + 1}
                                        </div>
                                        <div className="text-sm font-medium">{guest.name}</div>
                                    </div>
                                    <div className="flex items-center gap-1">
                                        {guest.is_table_captain && <span title="Table Captain" className="text-xs">👑</span>}
                                        {guest.needs_baby_gift && <span title="Baby Gift" className="text-xs">🍼</span>}
                                        {guest.allergies && <span title={guest.allergies} className="text-xs">🥜</span>}
                                    </div>
                                </div>
                            );
                        })}
                        {assignedSeats.filter(g => g === null).length > 0 && (
                            <div className="text-xs text-center text-muted-foreground mt-4 py-2 border-2 border-dashed border-slate-200 rounded-md">
                                + {assignedSeats.filter(g => g === null).length} Empty Seats
                            </div>
                        )}
                    </div>
                </Card>
            )}

            {/* Main Area - Visual Seating Plan */}
            <div className="flex-1 w-full bg-white rounded-xl shadow-sm border border-slate-100 p-6 flex flex-col min-h-[600px] overflow-hidden relative">
                {!selectedTable ? (
                    <div className="flex-1 flex flex-col">
                        <div className="mb-4">
                            <h2 className="text-2xl font-serif font-semibold">{t('seating.venueMap', 'Venue Map')}</h2>
                            <p className="text-muted-foreground text-sm">{t('seating.venueMapDesc', 'Drag tables to position them. Click a table to arrange its guests.')}</p>
                        </div>
                        <div 
                            className="flex-1 relative bg-slate-50/50 border-2 border-dashed border-slate-200 rounded-xl overflow-hidden"
                            onDragOver={handleDragOver}
                            onDrop={handleMapDrop}
                        >
                            {tables.map((table, index) => {
                                // Fallback position if not set
                                const cols = Math.max(2, Math.ceil(Math.sqrt(tables.length)));
                                const defaultX = 15 + (index % cols) * (70 / Math.max(1, cols - 1));
                                const defaultY = 15 + Math.floor(index / cols) * (70 / Math.max(1, Math.ceil(tables.length / cols) - 1));
                                
                                const x = table.position?.x ?? defaultX;
                                const y = table.position?.y ?? defaultY;
                                const isDragged = draggedTableId === table.id;

                                return (
                                    <motion.div
                                        key={table.id}
                                        draggable
                                        onDragStart={(e: any) => handleTableDragStart(e, table.id)}
                                        onClick={() => setSelectedTableId(table.id)}
                                        className={`absolute z-10 flex items-center justify-center cursor-pointer transition-all hover:scale-105
                                            ${isDragged ? 'opacity-50' : 'opacity-100 shadow-md hover:shadow-lg'}
                                            ${table.shape === 'circle' ? 'w-20 h-20 rounded-full' : table.shape === 'square' ? 'w-20 h-20 rounded-xl' : 'w-28 h-16 rounded-lg'}
                                            bg-white border-2 border-slate-300 hover:border-primary
                                        `}
                                        style={{
                                            left: `${x}%`,
                                            top: `${y}%`,
                                            transform: 'translate(-50%, -50%)'
                                        }}
                                    >
                                        <div className="text-center p-1">
                                            <div className="font-bold text-xs text-slate-700 truncate w-full">{table.name}</div>
                                            <div className="text-[10px] text-slate-500">{guests.filter(g => g.table_id === table.id).length}/{table.capacity.max}</div>
                                        </div>
                                    </motion.div>
                                );
                            })}
                        </div>
                    </div>
                ) : (
                    <>
                        <div className="mb-8 flex items-start justify-between">
                            <div>
                                <h2 className="text-2xl font-serif font-semibold">{selectedTable.name}</h2>
                                <p className="text-muted-foreground text-sm">Review the seating arrangement here. Use the sidebar to change the order.</p>
                            </div>
                            <Button variant="outline" size="sm" onClick={() => setSelectedTableId(null)} className="shrink-0 ml-4">
                                {t('seating.backToMap', 'Back to Map')}
                            </Button>
                        </div>
                        
                        <div className="flex-1 flex items-center justify-center relative">
                            {/* The Table Graphic */}
                            <div className={`relative bg-slate-100 border-4 border-slate-200 shadow-inner flex items-center justify-center z-0 transition-all duration-500
                                ${selectedTable.shape === 'circle' ? 'w-64 h-64 rounded-full' : 
                                  selectedTable.shape === 'square' ? 'w-64 h-64 rounded-2xl' : 
                                  'w-96 h-48 rounded-xl'}
                            `}>
                                <div className="text-center">
                                    <div className="text-3xl font-serif font-bold text-slate-300">{selectedTable.name}</div>
                                </div>
                            </div>

                            {/* The Seats */}
                            {assignedSeats.map((guest, index) => {
                                const style = getSeatStyle(index, selectedTable.capacity.max, selectedTable.shape);
                                const isDragged = draggedGuestId === guest?.id;
                                
                                return (
                                    <div 
                                        key={index}
                                        className="absolute z-10"
                                        style={style}
                                    >
                                        {guest ? (
                                            <>
                                                <div 
                                                    className={`relative w-20 h-20 rounded-full bg-white border-2 flex flex-col items-center justify-center shadow-md transition-all
                                                        ${isDragged ? 'border-primary border-dashed scale-110 shadow-lg' : 'border-slate-300'}
                                                    `}
                                                >
                                                    {/* Floating Badges */}
                                                    <div className="absolute -top-3 flex gap-1 text-base z-20">
                                                        {guest.is_table_captain && <span title="Table Captain">👑</span>}
                                                        {guest.needs_baby_gift && <span title="Baby Gift">🍼</span>}
                                                        {guest.allergies && <span title={guest.allergies}>🥜</span>}
                                                    </div>
                                                    
                                                    {guest.side === 'Fernando' && <img src="https://i.imgur.com/bqNCQ7n.jpeg" alt="" className="absolute inset-0 w-full h-full object-cover rounded-full opacity-20 pointer-events-none" />}
                                                    {guest.side === 'Chiara' && <img src="https://i.imgur.com/MtxJGhX.jpeg" alt="" className="absolute inset-0 w-full h-full object-cover rounded-full opacity-20 pointer-events-none" />}
                                                    
                                                    <span className="text-[11px] font-bold text-center px-2 leading-tight break-words z-10 w-full pointer-events-none">{guest.name}</span>

                                                    <Popover>
                                                        <PopoverTrigger asChild>
                                                            <div 
                                                                className="absolute -bottom-2 bg-white rounded-full p-1 border shadow-sm cursor-pointer hover:bg-slate-50 z-30"
                                                                onPointerDown={(e) => e.stopPropagation()} // Prevent drag conflict when clicking edit
                                                            >
                                                                <Edit2 className="w-3 h-3 text-slate-500" />
                                                            </div>
                                                        </PopoverTrigger>
                                                        <PopoverContent className="w-64 p-4 z-50">
                                                            <div className="space-y-4">
                                                                <div className="font-semibold pb-2 border-b">{guest.name}</div>
                                                        <div className="flex items-center justify-between">
                                                            <Label htmlFor={`captain-${guest.id}`} className="flex items-center gap-2 cursor-pointer">
                                                                👑 Capitan de mesa
                                                            </Label>
                                                            <Checkbox 
                                                                id={`captain-${guest.id}`}
                                                                checked={!!guest.is_table_captain} 
                                                                onCheckedChange={(c) => updateGuest(guest.id, { is_table_captain: !!c })} 
                                                            />
                                                        </div>
                                                        <div className="flex items-center justify-between">
                                                            <Label htmlFor={`baby-${guest.id}`} className="flex items-center gap-2 cursor-pointer">
                                                                🍼 Baby gifts
                                                            </Label>
                                                            <Checkbox 
                                                                id={`baby-${guest.id}`}
                                                                checked={!!guest.needs_baby_gift} 
                                                                onCheckedChange={(c) => updateGuest(guest.id, { needs_baby_gift: !!c })} 
                                                            />
                                                        </div>
                                                        <div className="space-y-2">
                                                            <Label className="flex items-center gap-2">🥜 Allergies / Menu</Label>
                                                            <Input 
                                                                value={guest.allergies || ''} 
                                                                onChange={(e) => updateGuest(guest.id, { allergies: e.target.value })}
                                                                placeholder="None"
                                                                className="h-8 text-sm"
                                                            />
                                                        </div>
                                                    </div>
                                                </PopoverContent>
                                                </Popover>
                                                </div>
                                            </>
                                        ) : (
                                            <div className="w-12 h-12 rounded-full border-2 border-dashed border-slate-300 bg-slate-50/50 flex items-center justify-center">
                                                <span className="text-xs text-slate-400 font-medium">{index + 1}</span>
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}
