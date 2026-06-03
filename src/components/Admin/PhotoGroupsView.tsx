import { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import { Camera, Plus, Hash, Tag, Users, GripVertical, Trash2, Edit3, X, Check, AlertCircle } from 'lucide-react';
import { Card, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { useGuests } from '@/hooks/useGuests';
import { Guest } from '@/types';

// ── Photo Group metadata (persisted in localStorage) ──────────────────────
interface PhotoGroup {
    id: string;
    alias: string;
    groupNumber: number;
}

const STORAGE_KEY = 'commendatore_photo_groups';

function loadGroups(): PhotoGroup[] {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        return raw ? JSON.parse(raw) : [];
    } catch { return []; }
}

function saveGroups(groups: PhotoGroup[]) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(groups));
}

// ── Entity: a couple or single (same logic as BomboniereView) ─────────────
interface Entity {
    unitId: string;
    guests: Guest[];
    label: string;
    photoGroupId: string | null; // which photo group this entity belongs to
}

export function PhotoGroupsView() {
    const { t } = useTranslation();
    const { guests, isLoading, updateGuest } = useGuests();

    // ── Photo groups state ────────────────────────────────────────────────
    const [photoGroups, setPhotoGroups] = useState<PhotoGroup[]>(loadGroups);
    useEffect(() => { saveGroups(photoGroups); }, [photoGroups]);

    // ── Modal state ───────────────────────────────────────────────────────
    const [modalOpen, setModalOpen] = useState(false);
    const [editingGroup, setEditingGroup] = useState<PhotoGroup | null>(null);
    const [alias, setAlias] = useState('');
    const [groupNumber, setGroupNumber] = useState('');
    const [numberError, setNumberError] = useState('');

    // ── Drag state ────────────────────────────────────────────────────────
    const [draggedUnitId, setDraggedUnitId] = useState<string | null>(null);
    const [dragOverTarget, setDragOverTarget] = useState<string | null>(null);

    // ── Build entities from guests (reusing BomboniereView pattern) ──────
    const entities: Entity[] = useMemo(() => {
        const map = new Map<string, Guest[]>();
        guests.forEach(guest => {
            if (guest.confirmation_status === 'Declined') return;
            const unitId = guest.group_id || guest.id;
            if (!map.has(unitId)) map.set(unitId, []);
            map.get(unitId)!.push(guest);
        });

        return Array.from(map.entries()).map(([unitId, guestList]) => {
            const label = guestList.map(g => g.name).join(' & ');
            // Derive photo_group_id from the first guest that has one
            const photoGroupId = guestList.find(g => g.photo_group_id)?.photo_group_id || null;
            return { unitId, guests: guestList, label, photoGroupId };
        }).sort((a, b) => a.label.localeCompare(b.label));
    }, [guests]);

    // ── Derived: unassigned entities ─────────────────────────────────────
    const unassigned = useMemo(() =>
        entities.filter(e => !e.photoGroupId),
        [entities]
    );

    // ── Helpers ──────────────────────────────────────────────────────────
    const getEntitiesForGroup = useCallback((groupId: string) =>
        entities.filter(e => e.photoGroupId === groupId),
        [entities]
    );

    const usedNumbers = useMemo(() =>
        photoGroups.map(g => g.groupNumber),
        [photoGroups]
    );

    // ── Modal handlers ───────────────────────────────────────────────────
    const openCreateModal = () => {
        setEditingGroup(null);
        setAlias('');
        setGroupNumber('');
        setNumberError('');
        setModalOpen(true);
    };

    const openEditModal = (group: PhotoGroup) => {
        setEditingGroup(group);
        setAlias(group.alias);
        setGroupNumber(group.groupNumber.toString());
        setNumberError('');
        setModalOpen(true);
    };

    const handleSaveGroup = () => {
        const trimmedAlias = alias.trim();
        const num = parseInt(groupNumber, 10);

        if (!trimmedAlias) return;
        if (isNaN(num) || num < 1) {
            setNumberError(t('photoGroups.invalidNumber', 'Enter a valid number (≥ 1)'));
            return;
        }

        // Uniqueness check (exclude current group when editing)
        const conflict = photoGroups.find(g =>
            g.groupNumber === num && g.id !== editingGroup?.id
        );
        if (conflict) {
            setNumberError(t('photoGroups.numberTaken', `Number ${num} is already used by "${conflict.alias}"`));
            return;
        }

        if (editingGroup) {
            setPhotoGroups(prev =>
                prev.map(g => g.id === editingGroup.id ? { ...g, alias: trimmedAlias, groupNumber: num } : g)
            );
        } else {
            const newGroup: PhotoGroup = {
                id: crypto.randomUUID(),
                alias: trimmedAlias,
                groupNumber: num,
            };
            setPhotoGroups(prev => [...prev, newGroup].sort((a, b) => a.groupNumber - b.groupNumber));
        }

        setModalOpen(false);
    };

    const handleDeleteGroup = async (groupId: string) => {
        // Unassign all entities in this group
        const entsInGroup = getEntitiesForGroup(groupId);
        await Promise.all(
            entsInGroup.flatMap(e =>
                e.guests.map(g => updateGuest(g.id, { photo_group_id: null } as any))
            )
        );
        setPhotoGroups(prev => prev.filter(g => g.id !== groupId));
    };

    // ── Drag & Drop handlers ─────────────────────────────────────────────
    const handleDragStart = (e: React.DragEvent, unitId: string) => {
        setDraggedUnitId(unitId);
        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setData('text/plain', unitId);
    };

    const handleDragOver = (e: React.DragEvent, targetId: string) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
        setDragOverTarget(targetId);
    };

    const handleDragLeave = () => {
        setDragOverTarget(null);
    };

    const handleDrop = async (e: React.DragEvent, targetGroupId: string | null) => {
        e.preventDefault();
        setDragOverTarget(null);
        const unitId = e.dataTransfer.getData('text/plain');
        if (!unitId) return;

        const entity = entities.find(ent => ent.unitId === unitId);
        if (!entity) return;

        // If already in this group, do nothing
        if (entity.photoGroupId === targetGroupId) return;

        // Update all guests in this entity
        await Promise.all(
            entity.guests.map(g =>
                updateGuest(g.id, { photo_group_id: targetGroupId } as any)
            )
        );

        setDraggedUnitId(null);
    };

    const handleDragEnd = () => {
        setDraggedUnitId(null);
        setDragOverTarget(null);
    };

    // ── Suggest next number ──────────────────────────────────────────────
    const suggestedNumber = useMemo(() => {
        if (usedNumbers.length === 0) return 1;
        return Math.max(...usedNumbers) + 1;
    }, [usedNumbers]);

    if (isLoading) {
        return <div className="p-8 text-center text-muted-foreground">{t('common.loading', 'Loading...')}</div>;
    }

    return (
        <div className="flex flex-col h-[calc(100vh-10rem)] gap-4 lg:gap-6">
            {/* ── KPI Cards ─────────────────────────────────────────── */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 shrink-0">
                <Card className="border-none shadow-md bg-gradient-to-br from-white to-slate-50">
                    <CardHeader className="py-5">
                        <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
                            {t('photoGroups.totalGroups', 'Groups')}
                        </CardTitle>
                        <div className="text-4xl font-bold mt-1 text-violet-600">{photoGroups.length}</div>
                    </CardHeader>
                </Card>
                <Card className="border-none shadow-md bg-gradient-to-br from-white to-slate-50">
                    <CardHeader className="py-5">
                        <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
                            {t('photoGroups.totalEntities', 'Total Entities')}
                        </CardTitle>
                        <div className="text-4xl font-bold mt-1">{entities.length}</div>
                    </CardHeader>
                </Card>
                <Card className="border-none shadow-md bg-gradient-to-br from-white to-slate-50">
                    <CardHeader className="py-5">
                        <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
                            {t('photoGroups.assigned', 'Assigned')}
                        </CardTitle>
                        <div className="text-4xl font-bold mt-1 text-emerald-600">
                            {entities.length - unassigned.length}
                        </div>
                    </CardHeader>
                </Card>
                <Card className="border-none shadow-md bg-gradient-to-br from-white to-slate-50">
                    <CardHeader className="py-5">
                        <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
                            {t('photoGroups.unassigned', 'Unassigned')}
                        </CardTitle>
                        <div className="text-4xl font-bold mt-1 text-amber-600">{unassigned.length}</div>
                    </CardHeader>
                </Card>
            </div>

            {/* ── Main content: Unassigned pool + Groups ────────────── */}
            <div className="flex-1 flex gap-4 lg:gap-6 overflow-hidden">
                {/* ── Left: Unassigned pool ─────────────────────────── */}
                <div
                    className={`w-72 lg:w-80 shrink-0 flex flex-col bg-white rounded-xl shadow-sm border transition-colors duration-200 ${
                        dragOverTarget === 'unassigned'
                            ? 'border-amber-400 bg-amber-50/30'
                            : 'border-slate-100'
                    }`}
                    onDragOver={(e) => handleDragOver(e, 'unassigned')}
                    onDragLeave={handleDragLeave}
                    onDrop={(e) => handleDrop(e, null)}
                >
                    <div className="px-4 py-4 border-b border-slate-100">
                        <h3 className="text-sm font-semibold text-slate-700 uppercase tracking-wider flex items-center gap-2">
                            <Users className="h-4 w-4 text-amber-500" />
                            {t('photoGroups.unassignedPool', 'Unassigned')}
                            <span className="ml-auto text-xs font-normal bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full">
                                {unassigned.length}
                            </span>
                        </h3>
                    </div>
                    <ScrollArea className="flex-1 p-2">
                        <div className="space-y-1">
                            <AnimatePresence>
                                {unassigned.map(entity => (
                                    <EntityChip
                                        key={entity.unitId}
                                        entity={entity}
                                        isDragging={draggedUnitId === entity.unitId}
                                        onDragStart={handleDragStart}
                                        onDragEnd={handleDragEnd}
                                    />
                                ))}
                            </AnimatePresence>
                            {unassigned.length === 0 && (
                                <div className="text-center text-sm text-slate-400 py-8">
                                    {t('photoGroups.allAssigned', 'All entities assigned! 🎉')}
                                </div>
                            )}
                        </div>
                    </ScrollArea>
                </div>

                {/* ── Right: Photo Groups grid ─────────────────────── */}
                <div className="flex-1 flex flex-col overflow-hidden">
                    <div className="flex items-center justify-between mb-4 shrink-0">
                        <div>
                            <h2 className="text-2xl font-serif font-semibold text-slate-800">
                                {t('photoGroups.title', 'Photo Groups')}
                            </h2>
                            <p className="text-slate-500 text-sm mt-0.5">
                                {t('photoGroups.subtitle', 'Drag entities into groups to organize photo calls')}
                            </p>
                        </div>
                        <Button onClick={openCreateModal} className="gap-2">
                            <Plus className="h-4 w-4" />
                            {t('photoGroups.newGroup', 'New Group')}
                        </Button>
                    </div>

                    <ScrollArea className="flex-1 -mx-1 px-1">
                        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4 pb-4">
                            {photoGroups
                                .sort((a, b) => a.groupNumber - b.groupNumber)
                                .map(group => {
                                    const groupEntities = getEntitiesForGroup(group.id);
                                    const totalPeople = groupEntities.reduce((s, e) => s + e.guests.length, 0);
                                    const isOver = dragOverTarget === group.id;

                                    return (
                                        <motion.div
                                            key={group.id}
                                            layout
                                            initial={{ opacity: 0, y: 12 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            className={`
                                                rounded-xl border-2 transition-all duration-200 bg-white shadow-sm overflow-hidden
                                                ${isOver
                                                    ? 'border-violet-400 shadow-violet-100 shadow-lg scale-[1.01]'
                                                    : 'border-slate-200 hover:border-slate-300'
                                                }
                                            `}
                                            onDragOver={(e) => handleDragOver(e, group.id)}
                                            onDragLeave={handleDragLeave}
                                            onDrop={(e) => handleDrop(e, group.id)}
                                        >
                                            {/* Group header */}
                                            <div className="flex items-center gap-3 px-4 py-3 bg-gradient-to-r from-violet-50 to-slate-50 border-b border-slate-100">
                                                <div className="flex items-center justify-center w-10 h-10 rounded-full bg-violet-600 text-white font-bold text-lg shadow-sm">
                                                    {group.groupNumber}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <h4 className="font-semibold text-slate-800 truncate">{group.alias}</h4>
                                                    <p className="text-xs text-slate-500">
                                                        {groupEntities.length} {groupEntities.length === 1 ? 'entity' : 'entities'} · {totalPeople} {totalPeople === 1 ? 'person' : 'people'}
                                                    </p>
                                                </div>
                                                <div className="flex items-center gap-1 shrink-0">
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-8 w-8 text-slate-400 hover:text-violet-600"
                                                        onClick={() => openEditModal(group)}
                                                    >
                                                        <Edit3 className="h-3.5 w-3.5" />
                                                    </Button>
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-8 w-8 text-slate-400 hover:text-red-500"
                                                        onClick={() => handleDeleteGroup(group.id)}
                                                    >
                                                        <Trash2 className="h-3.5 w-3.5" />
                                                    </Button>
                                                </div>
                                            </div>

                                            {/* Group body — droppable area */}
                                            <div className={`p-2 min-h-[80px] transition-colors ${isOver ? 'bg-violet-50/40' : ''}`}>
                                                <AnimatePresence>
                                                    {groupEntities.map(entity => (
                                                        <EntityChip
                                                            key={entity.unitId}
                                                            entity={entity}
                                                            isDragging={draggedUnitId === entity.unitId}
                                                            onDragStart={handleDragStart}
                                                            onDragEnd={handleDragEnd}
                                                            variant="group"
                                                        />
                                                    ))}
                                                </AnimatePresence>
                                                {groupEntities.length === 0 && (
                                                    <div className={`flex flex-col items-center justify-center py-6 text-sm rounded-lg border-2 border-dashed transition-colors ${
                                                        isOver ? 'border-violet-300 text-violet-500' : 'border-slate-200 text-slate-400'
                                                    }`}>
                                                        <Camera className="h-5 w-5 mb-1 opacity-50" />
                                                        {t('photoGroups.dropHere', 'Drop entities here')}
                                                    </div>
                                                )}
                                            </div>
                                        </motion.div>
                                    );
                                })}

                            {photoGroups.length === 0 && (
                                <div className="col-span-full flex flex-col items-center justify-center py-16 text-slate-400">
                                    <Camera className="h-12 w-12 mb-3 opacity-30" />
                                    <p className="text-lg font-medium">{t('photoGroups.noGroups', 'No groups yet')}</p>
                                    <p className="text-sm mt-1">{t('photoGroups.createFirst', 'Create your first photo group to get started')}</p>
                                    <Button onClick={openCreateModal} variant="outline" className="mt-4 gap-2">
                                        <Plus className="h-4 w-4" />
                                        {t('photoGroups.newGroup', 'New Group')}
                                    </Button>
                                </div>
                            )}
                        </div>
                    </ScrollArea>
                </div>
            </div>

            {/* ── Create / Edit Modal ───────────────────────────────── */}
            <Dialog open={modalOpen} onOpenChange={setModalOpen}>
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <Camera className="h-5 w-5 text-violet-600" />
                            {editingGroup
                                ? t('photoGroups.editGroup', 'Edit Group')
                                : t('photoGroups.createGroup', 'Create Photo Group')}
                        </DialogTitle>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid gap-2">
                            <Label htmlFor="pg-alias" className="flex items-center gap-2">
                                <Tag className="h-3.5 w-3.5" />
                                {t('photoGroups.aliasLabel', 'Group Alias')}
                            </Label>
                            <Input
                                id="pg-alias"
                                value={alias}
                                onChange={e => setAlias(e.target.value)}
                                placeholder={t('photoGroups.aliasPlaceholder', 'e.g. Bride\'s Family')}
                                autoFocus
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="pg-number" className="flex items-center gap-2">
                                <Hash className="h-3.5 w-3.5" />
                                {t('photoGroups.numberLabel', 'Group Number (unique)')}
                            </Label>
                            <Input
                                id="pg-number"
                                type="number"
                                min={1}
                                value={groupNumber}
                                onChange={e => { setGroupNumber(e.target.value); setNumberError(''); }}
                                placeholder={`${t('photoGroups.suggested', 'Suggested')}: ${suggestedNumber}`}
                            />
                            {numberError && (
                                <p className="text-sm text-red-500 flex items-center gap-1.5">
                                    <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                                    {numberError}
                                </p>
                            )}
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setModalOpen(false)}>
                            {t('common.cancel', 'Cancel')}
                        </Button>
                        <Button onClick={handleSaveGroup} disabled={!alias.trim() || !groupNumber.trim()}>
                            {editingGroup ? t('common.saveChanges', 'Save Changes') : t('photoGroups.create', 'Create')}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}

// ── Draggable Entity Chip ─────────────────────────────────────────────────
function EntityChip({
    entity,
    isDragging,
    onDragStart,
    onDragEnd,
    variant = 'pool',
}: {
    entity: Entity;
    isDragging: boolean;
    onDragStart: (e: React.DragEvent, unitId: string) => void;
    onDragEnd: () => void;
    variant?: 'pool' | 'group';
}) {
    const isCouple = entity.guests.length > 1;

    return (
        <motion.div
            layout
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: isDragging ? 0.5 : 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ duration: 0.15 }}
            draggable
            onDragStart={(e: any) => onDragStart(e, entity.unitId)}
            onDragEnd={onDragEnd}
            className={`
                flex items-center gap-2 px-3 py-2 rounded-lg cursor-grab active:cursor-grabbing
                transition-all duration-150 select-none group
                ${variant === 'pool'
                    ? 'bg-slate-50 hover:bg-slate-100 border border-slate-200'
                    : 'bg-white hover:bg-violet-50/50 border border-slate-150'
                }
                ${isDragging ? 'opacity-50 shadow-lg ring-2 ring-violet-300' : 'hover:shadow-sm'}
            `}
        >
            <GripVertical className="h-3.5 w-3.5 text-slate-300 group-hover:text-slate-500 shrink-0 transition-colors" />
            <span className="text-sm font-medium text-slate-700 truncate flex-1">
                {entity.label}
            </span>
            <span className={`
                text-[10px] px-1.5 py-0.5 rounded-full shrink-0
                ${isCouple ? 'bg-violet-100 text-violet-700' : 'bg-slate-200 text-slate-600'}
            `}>
                {isCouple ? `${entity.guests.length}p` : '1p'}
            </span>
        </motion.div>
    );
}
