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

    const filteredUnits = useMemo(() => {
        if (filter === 'couples') return units.filter(u => u.guests.length > 1);
        if (filter === 'singles') return units.filter(u => u.guests.length === 1);
        return units;
    }, [units, filter]);

    const toggleBomboniere = async (unit: { id: string; guests: Guest[]; bomboniere_given: boolean }) => {
        const newValue = !unit.bomboniere_given;
        // Optimistically we could update local state, but useGuests updateGuest should handle it
        for (const guest of unit.guests) {
            await updateGuest(guest.id, { bomboniere_given: newValue });
        }
    };

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
                        <p className="text-slate-500 mt-1">{t('bomboniere.distributionDesc', 'Click on a circle to mark their bomboniere as distributed.')}</p>
                    </div>
                    <div className="flex bg-slate-100 p-1 rounded-lg shrink-0">
                        <button
                            onClick={() => setFilter('all')}
                            className={`px-4 py-2 text-sm font-medium rounded-md transition-all ${filter === 'all' ? 'bg-white shadow-sm text-slate-800' : 'text-slate-500 hover:text-slate-700'}`}
                        >
                            {t('common.all', 'All')}
                        </button>
                        <button
                            onClick={() => setFilter('couples')}
                            className={`px-4 py-2 text-sm font-medium rounded-md transition-all ${filter === 'couples' ? 'bg-white shadow-sm text-slate-800' : 'text-slate-500 hover:text-slate-700'}`}
                        >
                            {t('bomboniere.couples', 'Couples')}
                        </button>
                        <button
                            onClick={() => setFilter('singles')}
                            className={`px-4 py-2 text-sm font-medium rounded-md transition-all ${filter === 'singles' ? 'bg-white shadow-sm text-slate-800' : 'text-slate-500 hover:text-slate-700'}`}
                        >
                            {t('bomboniere.singles', 'Singles')}
                        </button>
                    </div>
                </div>

                <ScrollArea className="flex-1 -mx-2 px-2 pb-4">
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6 auto-rows-max p-2">
                        <AnimatePresence>
                            {filteredUnits.map(unit => {
                                const names = unit.guests.map(g => g.name).join(' & ');
                                const isGiven = unit.bomboniere_given;
                                
                                return (
                                    <motion.div
                                        key={unit.id}
                                        layout
                                        initial={{ opacity: 0, scale: 0.9 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        exit={{ opacity: 0, scale: 0.9 }}
                                        whileHover={{ scale: 1.05 }}
                                        whileTap={{ scale: 0.95 }}
                                        onClick={() => toggleBomboniere(unit)}
                                        className={`
                                            relative group cursor-pointer rounded-full aspect-square flex flex-col items-center justify-center p-4 text-center transition-all duration-300 border-4 shadow-sm
                                            ${isGiven 
                                                ? 'bg-primary/5 border-primary text-primary hover:bg-primary/10 hover:shadow-md shadow-primary/20' 
                                                : 'bg-slate-50 border-slate-200 text-slate-600 hover:border-slate-300 hover:shadow-md'
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
                                        
                                        <span className={`text-[9px] sm:text-[10px] mt-1 sm:mt-2 px-2 py-0.5 rounded-full ${isGiven ? 'bg-primary/10' : 'bg-slate-200/50'}`}>
                                            {unit.guests.length > 1 ? t('bomboniere.couple', 'Couple') : t('bomboniere.single', 'Single')}
                                        </span>
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
