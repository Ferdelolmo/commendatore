import { useState, useMemo } from 'react';
import { Task } from '@/types';
import {
    format,
    startOfMonth,
    endOfMonth,
    startOfWeek,
    endOfWeek,
    eachDayOfInterval,
    isSameMonth,
    isSameDay,
    addMonths,
    subMonths,
} from 'date-fns';
import { enUS, es, it } from 'date-fns/locale';
import { ChevronLeft, ChevronRight, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import {
    HoverCard,
    HoverCardContent,
    HoverCardTrigger,
} from "@/components/ui/hover-card";
import { Badge } from '@/components/ui/badge';
import { useTranslation } from 'react-i18next';

interface CalendarViewProps {
    tasks: Task[];
    onTaskClick?: (task: Task) => void;
}

export function CalendarView({ tasks, onTaskClick }: CalendarViewProps) {
    const { t, i18n } = useTranslation();

    // Determine current locale for date-fns
    const dateLocale = useMemo(() => {
        switch (i18n.language) {
            case 'es': return es;
            case 'it': return it;
            default: return enUS;
        }
    }, [i18n.language]);

    // Determine initial month based on tasks or current date
    const initialDate = useMemo(() => {
        return new Date();
    }, []);

    const [currentMonth, setCurrentMonth] = useState(initialDate);

    const days = useMemo(() => {
        const start = startOfWeek(startOfMonth(currentMonth), { locale: dateLocale });
        const end = endOfWeek(endOfMonth(currentMonth), { locale: dateLocale });
        return eachDayOfInterval({ start, end });
    }, [currentMonth, dateLocale]);

    const tasksByDay = useMemo(() => {
        const map = new Map<string, Task[]>();
        tasks.forEach(task => {
            // Attempt to parse date string (e.g. "June 19, 2026" or "2026-06-19")
            const d = new Date(task.date);
            if (!isNaN(d.getTime())) {
                const dateKey = format(d, 'yyyy-MM-dd');
                if (!map.has(dateKey)) map.set(dateKey, []);
                map.get(dateKey)?.push(task);
            }
        });
        return map;
    }, [tasks]);

    const nextMonth = () => setCurrentMonth(addMonths(currentMonth, 1));
    const prevMonth = () => setCurrentMonth(subMonths(currentMonth, 1));

    // Get localized week days (short)
    const weekDays = useMemo(() => {
        const now = new Date();
        const start = startOfWeek(now, { locale: dateLocale });
        const days = [];
        for (let i = 0; i < 7; i++) {
            const d = new Date(start);
            d.setDate(start.getDate() + i);
            days.push(format(d, 'EEE', { locale: dateLocale }));
        }
        return days;
    }, [dateLocale]);

    return (
        <div className="space-y-4 animate-fade-in">
            <div className="flex items-center justify-between">
                <h2 className="text-2xl font-serif font-semibold text-foreground capitalize">
                    {format(currentMonth, 'MMMM yyyy', { locale: dateLocale })}
                </h2>
                <div className="flex items-center gap-2">
                    <Button variant="outline" size="icon" onClick={prevMonth}>
                        <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <Button variant="outline" size="icon" onClick={nextMonth}>
                        <ChevronRight className="h-4 w-4" />
                    </Button>
                </div>
            </div>

            <div className="border rounded-lg bg-card shadow-sm overflow-hidden">
                {/* Weekday Headers */}
                <div className="grid grid-cols-7 bg-muted/50 border-b">
                    {weekDays.map(day => (
                        <div key={day} className="py-3 text-center text-sm font-medium text-muted-foreground capitalize">
                            {day}
                        </div>
                    ))}
                </div>

                {/* Days Grid */}
                <div className="grid grid-cols-7 divide-x divide-y bg-background">
                    {days.map((day, idx) => {
                        const dateKey = format(day, 'yyyy-MM-dd');
                        const dayTasks = tasksByDay.get(dateKey) || [];
                        // Sort tasks by time
                        dayTasks.sort((a, b) => a.eventTime.localeCompare(b.eventTime));

                        const isCurrentMonth = isSameMonth(day, currentMonth);

                        return (
                            <div
                                key={day.toISOString()}
                                className={cn(
                                    "min-h-[120px] p-2 transition-colors hover:bg-muted/10 flex flex-col gap-1",
                                    !isCurrentMonth && "bg-secondary/10 text-muted-foreground"
                                )}
                            >
                                <div className="text-right text-sm p-1 font-medium text-muted-foreground">
                                    <span className={cn(
                                        isSameDay(day, new Date()) && "bg-primary text-primary-foreground rounded-full w-7 h-7 flex items-center justify-center inline-block -mr-1"
                                    )}>
                                        {format(day, 'd')}
                                    </span>
                                </div>

                                <div className="flex-1 flex flex-col gap-1 min-w-0">
                                    {dayTasks.map(task => (
                                        <HoverCard key={task.id}>
                                            <HoverCardTrigger asChild>
                                                <button
                                                    onClick={() => onTaskClick?.(task)}
                                                    className={cn(
                                                        "w-full text-left text-xs px-2 py-1.5 rounded truncate transition-all duration-200 border group",
                                                        task.status === 'completed'
                                                            ? "bg-muted/50 text-muted-foreground line-through border-transparent"
                                                            : task.priority === 'high'
                                                                ? "bg-destructive/10 text-destructive border-destructive/20 hover:bg-destructive/15"
                                                                : "bg-primary/10 text-primary border-primary/10 hover:bg-primary/15"
                                                    )}
                                                >
                                                    <span className="font-semibold mr-1 opacity-70 inline-block w-[32px]">{task.eventTime}</span>
                                                    {task.title}
                                                </button>
                                            </HoverCardTrigger>
                                            <HoverCardContent className="w-80">
                                                <div className="space-y-2">
                                                    <h4 className="text-sm font-semibold">{task.title}</h4>
                                                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                                        <Badge variant="secondary">{task.event}</Badge>
                                                        <span className="flex items-center gap-1">
                                                            <Clock className="w-3 h-3" /> {task.eventTime}
                                                        </span>
                                                    </div>
                                                    <p className="text-xs text-muted-foreground line-clamp-3">
                                                        {task.description}
                                                    </p>
                                                    <div className="flex gap-1 mt-2">
                                                        <Badge variant="outline" className={cn(
                                                            "uppercase text-[10px]",
                                                            task.status === 'completed' ? "text-success border-success" :
                                                                task.status === 'in-progress' ? "text-info border-info" : "text-warning border-warning"
                                                        )}>
                                                            {t(`status.${task.status}`)}
                                                        </Badge>
                                                    </div>
                                                </div>
                                            </HoverCardContent>
                                        </HoverCard>
                                    ))}
                                    {dayTasks.length > 4 && (
                                        <div className="text-xs text-muted-foreground pl-1">
                                            + {dayTasks.length - 4} more
                                        </div>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}
