import { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import { Gift, CheckCircle2, Circle, Users } from 'lucide-react';
import { Card, CardHeader, CardTitle } from '@/components/ui/card';
import { useGuests } from '@/hooks/useGuests';
import { useTables } from '@/hooks/useTables';
import { Guest } from '@/types';

export function BomboniereView() {
    const { t } = useTranslation();
    const { guests, isLoading, updateGuest } = useGuests();
    const { tables, isLoading: tablesLoading } = useTables();
    const [filter, setFilter] = useState<'all' | 'couples' | 'singles'>('all');
    const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'confirmed'>('all');

    const units = useMemo(() => {
        const map = new Map<string, { id: string; guests: Guest[]; bomboniere_given: boolean; table_name: string }>();
        guests.forEach(guest => {
            // Skip declined guests
            if (guest.confirmation_status === 'Declined') return;

            const unitId = guest.group_id || guest.id;
            if (!map.has(unitId)) {
                let tableName = t('bomboniere.unassigned', 'Unassigned');
                if (guest.table_id) {
                    const table = tables.find(t => t.id === guest.table_id);
                    if (table) tableName = table.name;
                }
                // Assume the first guest's bomboniere_given state represents the whole unit's
                map.set(unitId, { 
                    id: unitId, 
                    guests: [], 
                    bomboniere_given: !!guest.bomboniere_given,
                    table_name: tableName
                });
            }
            map.get(unitId)!.guests.push(guest);
        });
        
        // Sort units by table name then by name
        return Array.from(map.values()).sort((a, b) => {
            if (a.table_name !== b.table_name) {
                const unassignedStr = t('bomboniere.unassigned', 'Unassigned');
                if (a.table_name === unassignedStr) return 1;
                if (b.table_name === unassignedStr) return -1;
                return a.table_name.localeCompare(b.table_name);
            }
            const nameA = a.guests.map(g => g.name).join(' & ');
            const nameB = b.guests.map(g => g.name).join(' & ');
            return nameA.localeCompare(nameB);
        });
    }, [guests, tables, t]);

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

    const groupedUnits = useMemo(() => {
        const groups: Record<string, typeof filteredUnits> = {};
        filteredUnits.forEach(unit => {
            if (!groups[unit.table_name]) groups[unit.table_name] = [];
            groups[unit.table_name].push(unit);
        });
        return groups;
    }, [filteredUnits]);

    if (isLoading || tablesLoading) {
        return <div className="p-8 text-center">{t('common.loading', 'Loading...')}</div>;
    }

    return (
        <div className="flex flex-col gap-4 lg:gap-6 print:block">
            <style>{`
                @media print {
                    body, html, #root { height: auto !important; overflow: visible !important; background: white !important; }
                    /* Override layout restrictions */
                    div[class*="h-[calc"] { height: auto !important; overflow: visible !important; display: block !important; }
                    main { height: auto !important; overflow: visible !important; padding: 0 !important; background: white !important; }
                    nav, aside, .print-hidden { display: none !important; }
                }
            `}</style>
            
            {/* Top Section - KPIs */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 shrink-0 print-hidden">
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
            <div className="flex flex-col bg-white rounded-xl shadow-sm border border-slate-100 p-6 print:border-none print:shadow-none print:p-0 print:bg-white">
                <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                        <h2 className="text-2xl font-serif font-semibold text-slate-800">{t('bomboniere.distributionView', 'Distribution Overview')}</h2>
                        <p className="text-slate-500 mt-1 print-hidden">{t('bomboniere.distributionDesc', 'Overview of units and their confirmation status.')}</p>
                    </div>
                    <div className="flex flex-wrap items-center gap-2 shrink-0 print-hidden">
                        <button
                            onClick={() => window.print()}
                            className="flex items-center gap-2 px-4 py-2 text-sm font-medium bg-slate-800 text-white rounded-md hover:bg-slate-700 transition-colors shadow-sm"
                        >
                            {t('common.print', 'Print PDF')}
                        </button>
                        <div className="w-px h-8 bg-slate-200 mx-1"></div>
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

                <div className="px-2 pb-4">
                    <div className="flex flex-col gap-8">
                        {Object.entries(groupedUnits).map(([tableName, tableUnits]) => (
                            <div key={tableName} className="bg-slate-50/80 p-6 sm:p-8 rounded-3xl border border-slate-100 shadow-sm relative overflow-hidden">
                                {/* Decorative background element */}
                                <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-bl-[100px] -z-0 pointer-events-none" />
                                
                                <div className="flex items-center gap-4 mb-8 relative z-10 border-b border-slate-200/60 pb-4">
                                    <div className="p-3 bg-white shadow-sm rounded-2xl border border-slate-100 text-primary">
                                        <Users className="w-6 h-6" />
                                    </div>
                                    <div>
                                        <h3 className="text-2xl font-serif font-bold text-slate-800">
                                            {tableName}
                                        </h3>
                                        <div className="text-sm font-medium text-slate-500 mt-1.5 flex items-center gap-2">
                                            <span className="bg-white px-2.5 py-1 rounded-full shadow-sm border border-slate-100 text-xs">
                                                {tableUnits.length} {t('bomboniere.entities', 'Entities')}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                                
                                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6 auto-rows-max relative z-10">
                                    <AnimatePresence>
                                        {tableUnits.map(unit => {
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
                                                        relative rounded-full aspect-square flex flex-col items-center justify-center p-4 text-center transition-all duration-300 border-4 shadow-md hover:shadow-lg cursor-default
                                                        ${isGiven 
                                                            ? 'bg-gradient-to-br from-primary/10 to-primary/5 border-primary text-primary shadow-primary/20 hover:scale-105' 
                                                            : 'bg-white border-slate-100 text-slate-600 hover:border-slate-200 hover:scale-105'
                                                        }
                                                    `}
                                                >
                                                    <div className="absolute top-3 right-3 sm:top-4 sm:right-4">
                                                        {isGiven ? (
                                                            <CheckCircle2 className="w-5 h-5 sm:w-6 sm:h-6 text-primary drop-shadow-sm" />
                                                        ) : (
                                                            <Circle className="w-5 h-5 sm:w-6 sm:h-6 text-slate-200" />
                                                        )}
                                                    </div>
                                                    
                                                    <Gift className={`w-8 h-8 sm:w-10 sm:h-10 mb-2 sm:mb-3 transition-colors ${isGiven ? 'text-primary' : 'text-slate-300'}`} />
                                                    
                                                    <span className="text-xs sm:text-sm font-semibold leading-tight line-clamp-2 w-full px-1 sm:px-4">
                                                        {names}
                                                    </span>
                                                    
                                                    <div className="flex flex-col sm:flex-row gap-1 mt-2 sm:mt-3">
                                                        <span className={`text-[9px] sm:text-[10px] px-2 py-0.5 rounded-full font-medium ${isGiven ? 'bg-primary/20 text-primary-800' : 'bg-slate-100 text-slate-500'}`}>
                                                            {unit.guests.length > 1 ? t('bomboniere.couple', 'Couple') : t('bomboniere.single', 'Single')}
                                                        </span>
                                                        <span className={`text-[9px] sm:text-[10px] px-2 py-0.5 rounded-full font-medium ${isPending ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'}`}>
                                                            {isPending ? t('common.pending', 'Pending') : t('common.confirmed', 'Confirmed')}
                                                        </span>
                                                    </div>
                                                </motion.div>
                                            );
                                        })}
                                    </AnimatePresence>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
