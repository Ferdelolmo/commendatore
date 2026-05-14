import { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import { Gift, CheckCircle2, Circle } from 'lucide-react';
import { Card, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useGuests } from '@/hooks/useGuests';
import { Guest } from '@/types';

export function BomboniereView() {
    const { t } = useTranslation();
    const { guests, isLoading, updateGuest } = useGuests();
    const [filter, setFilter] = useState<'all' | 'couples' | 'singles'>('all');
    const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'confirmed'>('all');

    const units = useMemo(() => {
        const map = new Map<string, { id: string; guests: Guest[]; bomboniere_given: boolean }>();
        guests.forEach(guest => {
            // Skip declined guests
            if (guest.confirmation_status === 'Declined') return;

            const unitId = guest.group_id || guest.id;
            if (!map.has(unitId)) {
                // Assume the first guest's bomboniere_given state represents the whole unit's
                map.set(unitId, { id: unitId, guests: [], bomboniere_given: !!guest.bomboniere_given });
            }
            map.get(unitId)!.guests.push(guest);
        });
        
        // Sort units by name for better display
        return Array.from(map.values()).sort((a, b) => {
            const nameA = a.guests.map(g => g.name).join(' & ');
            const nameB = b.guests.map(g => g.name).join(' & ');
            return nameA.localeCompare(nameB);
        });
    }, [guests]);

    const couplesCount = units.filter(u => u.guests.length > 1).length;
    const singlesCount = units.filter(u => u.guests.length === 1).length;
    const totalUnits = units.length;
    
    const pendingCount = units.filter(u => u.guests.some(g => g.confirmation_status === 'Pending')).length;
    const confirmedCount = units.filter(u => !u.guests.some(g => g.confirmation_status === 'Pending')).length;

    const filteredUnits = useMemo(() => {
        let result = units;
        
        if (filter === 'couples') result = result.filter(u => u.guests.length > 1);
        if (filter === 'singles') result = result.filter(u => u.guests.length === 1);
        
        if (statusFilter === 'pending') result = result.filter(u => u.guests.some(g => g.confirmation_status === 'Pending'));
        if (statusFilter === 'confirmed') result = result.filter(u => !u.guests.some(g => g.confirmation_status === 'Pending'));
        
        return result;
    }, [units, filter, statusFilter]);


    if (isLoading) {
        return <div className="p-8 text-center">{t('common.loading', 'Loading...')}</div>;
    }

    return (
        <div className="flex flex-col h-[calc(100vh-10rem)] gap-4 lg:gap-6">
            {/* Top Section - KPIs */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 shrink-0">
                <Card className="border-none shadow-md bg-gradient-to-br from-white to-slate-50">
                    <CardHeader className="py-6">
                        <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
                            {t('bomboniere.couples', 'Couples')}
                        </CardTitle>
                        <div className="text-4xl font-bold mt-2">
                            {couplesCount}
                        </div>
                    </CardHeader>
                </Card>
                <Card className="border-none shadow-md bg-gradient-to-br from-white to-slate-50">
                    <CardHeader className="py-6">
                        <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
                            {t('bomboniere.singles', 'Singles')}
                        </CardTitle>
                        <div className="text-4xl font-bold mt-2">
                            {singlesCount}
                        </div>
                    </CardHeader>
                </Card>
                <Card className="border-none shadow-md bg-gradient-to-br from-white to-slate-50">
                    <CardHeader className="py-6">
                        <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
                            {t('bomboniere.totalUnits', 'Total Units')}
                        </CardTitle>
                        <div className="text-4xl font-bold text-primary mt-2">
                            {totalUnits}
                        </div>
                    </CardHeader>
                </Card>
            </div>

            {/* Main View - Circle/Bird's Eye View */}
            <div className="flex-1 flex flex-col overflow-hidden bg-white rounded-xl shadow-sm border border-slate-100 p-6">
                <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                        <h2 className="text-2xl font-serif font-semibold text-slate-800">{t('bomboniere.distributionView', 'Distribution Overview')}</h2>
                        <p className="text-slate-500 mt-1">{t('bomboniere.distributionDesc', 'Overview of units and their confirmation status.')}</p>
                    </div>
                    <div className="flex flex-wrap items-center gap-2 shrink-0">
                        <div className="flex bg-slate-100 p-1 rounded-lg">
                            <button
                                onClick={() => setFilter('all')}
                                className={`flex flex-col items-center px-4 py-1 text-sm font-medium rounded-md transition-all ${filter === 'all' ? 'bg-white shadow-sm text-slate-800' : 'text-slate-500 hover:text-slate-700'}`}
                            >
                                <span>{t('common.all', 'All')}</span>
                                <span className="text-[10px] opacity-70">{totalUnits}</span>
                            </button>
                            <button
                                onClick={() => setFilter('couples')}
                                className={`flex flex-col items-center px-4 py-1 text-sm font-medium rounded-md transition-all ${filter === 'couples' ? 'bg-white shadow-sm text-slate-800' : 'text-slate-500 hover:text-slate-700'}`}
                            >
                                <span>{t('bomboniere.couples', 'Couples')}</span>
                                <span className="text-[10px] opacity-70">{couplesCount}</span>
                            </button>
                            <button
                                onClick={() => setFilter('singles')}
                                className={`flex flex-col items-center px-4 py-1 text-sm font-medium rounded-md transition-all ${filter === 'singles' ? 'bg-white shadow-sm text-slate-800' : 'text-slate-500 hover:text-slate-700'}`}
                            >
                                <span>{t('bomboniere.singles', 'Singles')}</span>
                                <span className="text-[10px] opacity-70">{singlesCount}</span>
                            </button>
                        </div>
                        
                        <div className="flex bg-slate-100 p-1 rounded-lg">
                            <button
                                onClick={() => setStatusFilter('all')}
                                className={`flex flex-col items-center px-4 py-1 text-sm font-medium rounded-md transition-all ${statusFilter === 'all' ? 'bg-white shadow-sm text-slate-800' : 'text-slate-500 hover:text-slate-700'}`}
                            >
                                <span>{t('common.all', 'All')}</span>
                                <span className="text-[10px] opacity-70">{totalUnits}</span>
                            </button>
                            <button
                                onClick={() => setStatusFilter('pending')}
                                className={`flex flex-col items-center px-4 py-1 text-sm font-medium rounded-md transition-all ${statusFilter === 'pending' ? 'bg-white shadow-sm text-amber-700' : 'text-slate-500 hover:text-amber-700'}`}
                            >
                                <span>{t('common.pending', 'Pending')}</span>
                                <span className="text-[10px] opacity-70">{pendingCount}</span>
                            </button>
                            <button
                                onClick={() => setStatusFilter('confirmed')}
                                className={`flex flex-col items-center px-4 py-1 text-sm font-medium rounded-md transition-all ${statusFilter === 'confirmed' ? 'bg-white shadow-sm text-emerald-700' : 'text-slate-500 hover:text-emerald-700'}`}
                            >
                                <span>{t('common.confirmed', 'Confirmed')}</span>
                                <span className="text-[10px] opacity-70">{confirmedCount}</span>
                            </button>
                        </div>
                    </div>
                </div>

                <ScrollArea className="flex-1 -mx-2 px-2 pb-4">
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6 auto-rows-max p-2">
                        <AnimatePresence>
                            {filteredUnits.map(unit => {
                                const names = unit.guests.map(g => g.name).join(' & ');
                                const isGiven = unit.bomboniere_given;
                                const isPending = unit.guests.some(g => g.confirmation_status === 'Pending');
                                
                                return (
                                    <motion.div
                                        key={unit.id}
                                        layout
                                        initial={{ opacity: 0, scale: 0.9 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        exit={{ opacity: 0, scale: 0.9 }}
                                        className={`
                                            relative rounded-full aspect-square flex flex-col items-center justify-center p-4 text-center transition-all duration-300 border-4 shadow-sm
                                            ${isGiven 
                                                ? 'bg-primary/5 border-primary text-primary shadow-primary/20' 
                                                : 'bg-slate-50 border-slate-200 text-slate-600'
                                            }
                                        `}
                                    >
                                        <div className="absolute top-3 right-3 sm:top-4 sm:right-4">
                                            {isGiven ? (
                                                <CheckCircle2 className="w-5 h-5 sm:w-6 sm:h-6 text-primary" />
                                            ) : (
                                                <Circle className="w-5 h-5 sm:w-6 sm:h-6 text-slate-300" />
                                            )}
                                        </div>
                                        
                                        <Gift className={`w-8 h-8 sm:w-10 sm:h-10 mb-2 sm:mb-3 transition-colors ${isGiven ? 'text-primary' : 'text-slate-400'}`} />
                                        
                                        <span className="text-xs sm:text-sm font-semibold leading-tight line-clamp-2 w-full px-1 sm:px-4">
                                            {names}
                                        </span>
                                        
                                        <div className="flex flex-col sm:flex-row gap-1 mt-1 sm:mt-2">
                                            <span className={`text-[9px] sm:text-[10px] px-2 py-0.5 rounded-full ${isGiven ? 'bg-primary/10' : 'bg-slate-200/50'}`}>
                                                {unit.guests.length > 1 ? t('bomboniere.couple', 'Couple') : t('bomboniere.single', 'Single')}
                                            </span>
                                            <span className={`text-[9px] sm:text-[10px] px-2 py-0.5 rounded-full ${isPending ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'}`}>
                                                {isPending ? t('common.pending', 'Pending') : t('common.confirmed', 'Confirmed')}
                                            </span>
                                        </div>
                                    </motion.div>
                                );
                            })}
                        </AnimatePresence>
                    </div>
                </ScrollArea>
            </div>
        </div>
    );
}
