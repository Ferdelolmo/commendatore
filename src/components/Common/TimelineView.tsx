import { Task, TaskStatus } from '@/types';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';
import { Clock, History, ChevronDown, ChevronRight } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useTeam } from '@/hooks/useTeam';
import { Button } from '@/components/ui/button';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { useTranslation } from 'react-i18next';

interface TimelineViewProps {
    tasks: Task[];
    onEdit?: (task: Task) => void;
    onStatusChange?: (taskId: number, status: TaskStatus) => void;
    highlightedTaskId?: number | null;
    variant?: 'default' | 'smart';
}

export function TimelineView({ tasks, onEdit, highlightedTaskId, onStatusChange, variant = 'default' }: TimelineViewProps) {
    const { t } = useTranslation();
    const [showPast, setShowPast] = useState(false);
    const { members } = useTeam();

    // Scroll to highlighted task
    useEffect(() => {
        if (highlightedTaskId) {
            const element = document.getElementById(`task-${highlightedTaskId}`);
            if (element) {
                element.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
        }
    }, [highlightedTaskId]);

    // Helper to sort tasks
    const sortTasks = (taskList: Task[]) => {
        return [...taskList].sort((a, b) => {
            const dateA = new Date(a.date + ' ' + a.eventTime);
            const dateB = new Date(b.date + ' ' + b.eventTime);
            if (isNaN(dateA.getTime()) || isNaN(dateB.getTime())) {
                return a.date.localeCompare(b.date) || a.eventTime.localeCompare(b.eventTime);
            }
            return dateA.getTime() - dateB.getTime();
        });
    };

    // Split tasks
    const upcomingTasks = sortTasks(tasks.filter(t => t.status !== 'completed'));
    const pastTasks = sortTasks(tasks.filter(t => t.status === 'completed'));

    // Helper to Group by Date (Legacy/Default)
    const groupTasks = (taskList: Task[]) => {
        return taskList.reduce((groups, task) => {
            const date = task.date;
            if (!groups[date]) {
                groups[date] = [];
            }
            groups[date].push(task);
            return groups;
        }, {} as Record<string, Task[]>);
    };

    const renderTaskCard = (task: Task, isExpired = false) => {
        const member = members.find(m => m.name === task.assignee);
        const avatarUrl = member?.avatarUrl;
        const isSmart = variant === 'smart';

        return (
            <Card
                key={task.id}
                id={`task-${task.id}`}
                className={cn(
                    "relative overflow-hidden transition-all duration-500",
                    onEdit ? "hover:shadow-md cursor-pointer" : "",
                    highlightedTaskId === task.id ? "ring-2 ring-primary shadow-lg scale-[1.02]" : "",
                    task.status === 'completed' && "opacity-75 bg-muted/30",
                    isExpired && "border-destructive/50 bg-destructive/5"
                )}
                onClick={() => onEdit?.(task)}
            >
                <div className={cn(
                    "absolute left-0 top-0 bottom-0 w-1",
                    task.status === 'completed' ? "bg-success" :
                        isExpired ? "bg-destructive" :
                            task.status === 'in-progress' ? "bg-info" : "bg-warning"
                )} />
                <CardContent className="p-4">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-2">
                        <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                                <Badge variant="outline" className={cn(
                                    "text-xs font-normal",
                                    isExpired && "border-destructive text-destructive"
                                )}>
                                    <Clock className="w-3 h-3 mr-1" />
                                    {task.eventTime}
                                </Badge>
                                {task.assignee && (
                                    <div className="flex items-center gap-1.5 bg-secondary/20 px-2 py-0.5 rounded-full border border-secondary/20">
                                        <Avatar className="w-4 h-4">
                                            <AvatarImage src={avatarUrl} className="object-cover" />
                                            <AvatarFallback className="text-[8px] bg-primary/10 text-primary">{task.assignee.substring(0, 2).toUpperCase()}</AvatarFallback>
                                        </Avatar>
                                        <span className="text-xs font-medium text-foreground/80">{task.assignee}</span>
                                    </div>
                                )}
                                {task.collaborator && (
                                    <div className="flex items-center gap-1.5 bg-secondary/20 px-2 py-0.5 rounded-full border border-secondary/20">
                                        <Avatar className="w-4 h-4">
                                            {/* Ideally we fetch collaborator avatar too, but we need to look it up */}
                                            <AvatarImage src={members.find(m => m.name === task.collaborator)?.avatarUrl} className="object-cover" />
                                            <AvatarFallback className="text-[8px] bg-primary/10 text-primary">{task.collaborator.substring(0, 2).toUpperCase()}</AvatarFallback>
                                        </Avatar>
                                        <span className="text-xs font-medium text-foreground/80">{task.collaborator}</span>
                                    </div>
                                )}
                                <Badge variant="secondary" className="text-xs font-normal">
                                    {task.event}
                                </Badge>
                                {!isSmart && (
                                    <Badge variant="outline" className={cn(
                                        "text-xs capitalize",
                                        task.priority === 'high' ? "text-destructive border-destructive/50 bg-destructive/5" :
                                            task.priority === 'medium' ? "text-warning border-warning/50 bg-warning/5" :
                                                "text-success border-success/50 bg-success/5"
                                    )}>
                                        {task.priority}
                                    </Badge>
                                )}
                                {isExpired && (
                                    <Badge variant="destructive" className="text-[10px] h-5 px-1.5 uppercase">
                                        Expired
                                    </Badge>
                                )}
                            </div>
                            <h4 className={cn("font-semibold text-foreground/90", task.status === 'completed' && "line-through text-muted-foreground")}>{task.title}</h4>
                            {!isSmart && task.description && (
                                <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                                    {task.description}
                                </p>
                            )}
                        </div>

                        {!isSmart && (
                            <div className="flex items-center gap-2 mt-2 md:mt-0" onClick={(e) => e.stopPropagation()}>
                                {onStatusChange ? (
                                    <select
                                        className={cn(
                                            "h-6 px-2 text-xs rounded-full border shadow-sm outline-none focus:ring-2 focus:ring-primary/20 cursor-pointer appearance-none pr-6 relative",
                                            task.status === 'completed' ? "bg-success text-success-foreground border-success/20" :
                                                isExpired ? "bg-destructive text-destructive-foreground border-destructive/20" :
                                                    task.status === 'in-progress' ? "bg-info text-info-foreground border-info/20" :
                                                        "bg-warning text-warning-foreground border-warning/20"
                                        )}
                                        value={task.status}
                                        onChange={(e) => onStatusChange(task.id, e.target.value as TaskStatus)}
                                        style={{
                                            backgroundImage: 'url("data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22292.4%22%20height%3D%22292.4%22%3E%3Cpath%20fill%3D%22currentColor%22%20d%3D%22M287%2069.4a17.6%2017.6%200%200%200-13-5.4H18.4c-5%200-9.3%201.8-12.9%205.4A17.6%2017.6%200%200%200%200%2082.2c0%205%201.8%209.3%205.4%2012.9l128%20127.9c3.6%203.6%207.8%205.4%2012.8%205.4s9.2-1.8%2012.8-5.4L287%2095c3.5-3.5%205.4-7.8%205.4-12.8%200-5-1.9-9.2-5.5-12.8z%22%2F%3E%3C%2Fsvg%3E")',
                                            backgroundRepeat: 'no-repeat',
                                            backgroundPosition: 'right 0.5rem center',
                                            backgroundSize: '0.65em auto',
                                        }}
                                    >
                                        <option value="pending" className="bg-background text-foreground">{t('status.pending')}</option>
                                        <option value="in-progress" className="bg-background text-foreground">{t('status.in-progress')}</option>
                                        <option value="completed" className="bg-background text-foreground">{t('status.completed')}</option>
                                    </select>
                                ) : (
                                    <Badge className={cn(
                                        "capitalize shadow-sm",
                                        task.status === 'completed' ? "bg-success hover:bg-success/90" :
                                            task.status === 'in-progress' ? "bg-info hover:bg-info/90" : "bg-warning hover:bg-warning/90"
                                    )}>
                                        {t(`status.${task.status}`)}
                                    </Badge>
                                )}
                            </div>
                        )}
                    </div>
                </CardContent>
            </Card>
        );
    };

    // --- Default Layout Renderers ---
    const renderTaskGroupDefault = (taskList: Task[]) => {
        const grouped = groupTasks(taskList);
        const sortedDates = Object.keys(grouped).sort((a, b) => new Date(a).getTime() - new Date(b).getTime());

        return sortedDates.map(date => (
            <div key={date} className="relative">
                {/* Date Header */}
                <div className="absolute -left-[25px] top-0 p-1 bg-background rounded-full border-2 border-primary">
                    <div className="w-3 h-3 bg-primary rounded-full" />
                </div>

                <h3 className="text-xl font-serif font-bold text-primary mb-4 pl-4 -mt-1.5 flex items-center">
                    {date}
                </h3>

                <div className="space-y-4 pl-4">
                    {grouped[date].map((task) => renderTaskCard(task))}
                </div>
            </div>
        ));
    };

    const renderDefaultTimeline = (taskList: Task[]) => {
        const now = new Date();
        const elements: JSX.Element[] = [];
        let lastDate: string | null = null;
        let nowLineRendered = false;

        taskList.forEach((task) => {
            const taskDate = new Date(task.date + ' ' + task.eventTime);
            const isTaskExpired = taskDate < now;

            if (!nowLineRendered && !isTaskExpired) {
                elements.push(
                    <div key="now-line" className="relative py-6 flex items-center">
                        <div className="absolute -left-[30px] w-4 h-4 rounded-full bg-destructive animate-pulse border-4 border-background z-10" />
                        <div className="flex-1 border-t-2 border-destructive border-dashed relative">
                            <span className="absolute left-4 -top-3 bg-background px-2 text-xs font-bold text-destructive uppercase tracking-wider">
                                {t('common.present', { defaultValue: 'Current Time' })}
                            </span>
                        </div>
                    </div>
                );
                nowLineRendered = true;
            }

            if (task.date !== lastDate) {
                elements.push(
                    <div key={`header-${task.date}`} className="relative mt-2 mb-4">
                        <div className="absolute -left-[25px] top-1 p-1 bg-background rounded-full border-2 border-primary">
                            <div className="w-3 h-3 bg-primary rounded-full" />
                        </div>
                        <h3 className="text-xl font-serif font-bold text-primary pl-4 flex items-center">
                            {task.date}
                        </h3>
                    </div>
                );
                lastDate = task.date;
            }

            elements.push(
                <div key={task.id} className="pl-4">
                    {renderTaskCard(task, isTaskExpired)}
                </div>
            );
        });

        if (!nowLineRendered && taskList.length > 0) {
            elements.push(
                <div key="now-line-end" className="relative py-6 flex items-center">
                    <div className="absolute -left-[30px] w-4 h-4 rounded-full bg-destructive animate-pulse border-4 border-background z-10" />
                    <div className="flex-1 border-t-2 border-destructive border-dashed relative">
                        <span className="absolute left-4 -top-3 bg-background px-2 text-xs font-bold text-destructive uppercase tracking-wider">
                            {t('common.present', { defaultValue: 'Current Time' })}
                        </span>
                    </div>
                </div>
            );
        }

        return <div className="space-y-4">{elements}</div>;
    };

    // --- Smart Layout Renderers ---
    const renderSmartTimeline = (taskList: Task[]) => {
        const now = new Date();
        const groupedByTime: { date: string; time: string; tasks: Task[]; timestamp: number }[] = [];

        taskList.forEach(task => {
            const date = task.date;
            const time = task.eventTime;
            const dateTimeStr = `${date} ${time}`;
            const timestamp = new Date(dateTimeStr).getTime();

            const existingGroup = groupedByTime.find(g => g.date === date && g.time === time);
            if (existingGroup) {
                existingGroup.tasks.push(task);
            } else {
                groupedByTime.push({ date, time, tasks: [task], timestamp: isNaN(timestamp) ? 0 : timestamp });
            }
        });

        const elements: JSX.Element[] = [];
        let lastDate: string | null = null;
        let nowLineRendered = false;

        groupedByTime.forEach((group) => {
            const groupDateObj = new Date(group.date + ' ' + group.time);
            const isGroupExpired = !isNaN(groupDateObj.getTime()) && groupDateObj < now;

            if (!nowLineRendered && !isGroupExpired) {
                elements.push(
                    <div key="now-line" className="relative py-8 flex items-center md:justify-center">
                        <div className="absolute left-6 md:left-1/2 w-full md:w-1/2 border-t-2 border-destructive border-dashed" />
                        <div className="absolute left-6 md:left-auto md:right-1/2 w-0 md:w-1/2 border-t-2 border-destructive border-dashed" />
                        <span className="relative z-10 bg-background px-3 py-1 text-xs font-bold text-destructive uppercase tracking-wider border border-destructive rounded-full shadow-sm">
                            {t('common.present', { defaultValue: 'Now' })}
                        </span>
                    </div>
                );
                nowLineRendered = true;
            }

            if (group.date !== lastDate) {
                elements.push(
                    <div key={`header-${group.date}`} className="relative mt-8 mb-8 text-center">
                        <div className="inline-block px-4 py-1.5 bg-primary/10 rounded-full border border-primary/20">
                            <h3 className="text-lg font-serif font-bold text-primary flex items-center gap-2">
                                {group.date}
                            </h3>
                        </div>
                    </div>
                );
                lastDate = group.date;
            }

            elements.push(
                <div key={`${group.date}-${group.time}`} className="relative mb-8 last:mb-0">
                    <div className="absolute left-6 md:left-1/2 -translate-x-1/2 bg-background border-2 border-primary/30 rounded-full w-14 h-14 flex items-center justify-center z-10 font-bold text-sm text-primary shadow-sm">
                        {group.time}
                    </div>

                    <div className="flex flex-col md:flex-row w-full">
                        <div className="w-full md:w-1/2 md:pr-12 md:text-right pl-16 md:pl-0 space-y-4">
                            {group.tasks.map((task, i) => {
                                if (i % 2 === 0) return (
                                    <div key={task.id} className="md:ml-auto md:max-w-md opacity-0 animate-fade-in" style={{ animationDelay: `${i * 100}ms`, animationFillMode: 'forwards' }}>
                                        {renderTaskCard(task, isGroupExpired)}
                                    </div>
                                );
                                return null;
                            })}
                        </div>

                        <div className="w-full md:w-1/2 md:pl-12 pl-16 md:pl-0 space-y-4 mt-4 md:mt-0">
                            {group.tasks.map((task, i) => {
                                if (i % 2 !== 0) return (
                                    <div key={task.id} className="md:mr-auto md:max-w-md opacity-0 animate-fade-in" style={{ animationDelay: `${i * 100}ms`, animationFillMode: 'forwards' }}>
                                        {renderTaskCard(task, isGroupExpired)}
                                    </div>
                                );
                                return null;
                            })}
                        </div>
                    </div>
                </div>
            );
        });

        if (!nowLineRendered && taskList.length > 0) {
            elements.push(
                <div key="now-line-end" className="relative py-8 flex items-center justify-center">
                    <span className="relative z-10 bg-background px-3 py-1 text-xs font-bold text-destructive uppercase tracking-wider border border-destructive rounded-full shadow-sm">
                        {t('common.endOfTasks', { defaultValue: 'End of Timeline' })}
                    </span>
                </div>
            );
        }

        return (
            <div className="relative pb-12">
                <div className="hidden md:block absolute left-1/2 top-0 bottom-0 w-0.5 bg-primary/20 -translate-x-1/2" />
                <div className="md:hidden absolute left-12 top-0 bottom-0 w-0.5 bg-primary/20" />
                {elements}
            </div>
        );
    };

    return (
        <div className={cn("space-y-8 md:ml-4", variant === 'default' ? "pl-4 border-l-2 border-primary/20 ml-2" : "ml-2")}>
            {/* Back to the past Section */}
            {pastTasks.length > 0 && (
                <Collapsible open={showPast} onOpenChange={setShowPast} className="relative">
                    {variant === 'default' && (
                        <div className="absolute -left-[29px] top-0 bg-background py-1">
                            <Button
                                variant="outline"
                                size="icon"
                                className="h-8 w-8 rounded-full border-2 border-muted-foreground/30 text-muted-foreground hover:border-primary hover:text-primary transition-colors"
                                onClick={() => setShowPast(!showPast)}
                            >
                                <History className="h-4 w-4" />
                            </Button>
                        </div>
                    )}

                    <CollapsibleTrigger asChild>
                        {variant === 'default' ? (
                            <Button variant="ghost" className="w-full flex items-center justify-between text-muted-foreground hover:text-foreground mb-4 group pl-4">
                                <span className="flex items-center gap-2 font-medium">
                                    <History className="h-4 w-4" />
                                    {t('common.backToPast')}
                                    <Badge variant="secondary" className="ml-2 text-xs">
                                        {pastTasks.length} {t('common.done')}
                                    </Badge>
                                </span>
                                {showPast ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                            </Button>
                        ) : (
                            <Button variant="ghost" className="w-full flex items-center justify-center text-muted-foreground hover:text-foreground mb-8 group">
                                <span className="flex items-center gap-2 font-medium">
                                    <History className="h-4 w-4" />
                                    {t('common.backToPast')}
                                    <Badge variant="secondary" className="ml-2 text-xs">
                                        {pastTasks.length} {t('common.done')}
                                    </Badge>
                                </span>
                                {showPast ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                            </Button>
                        )}
                    </CollapsibleTrigger>

                    <CollapsibleContent className="space-y-4 animate-slide-down mb-8 opacity-70">
                        {variant === 'default' ? (
                            renderTaskGroupDefault(pastTasks)
                        ) : (
                            <>
                                {pastTasks.map(task => (
                                    <div key={task.id} className="ml-4 md:ml-0 md:max-w-2xl md:mx-auto">
                                        {renderTaskCard(task)}
                                    </div>
                                ))}
                            </>
                        )}
                        <div className={cn("relative my-8", variant === 'smart' && "flex items-center justify-center")}>
                            {variant === 'default' ? (
                                <>
                                    <div className="absolute inset-0 flex items-center">
                                        <span className="w-full border-t border-dashed border-muted-foreground/30" />
                                    </div>
                                    <div className="relative flex justify-center text-xs uppercase">
                                        <span className="bg-background px-2 text-muted-foreground">{t('common.present')}</span>
                                    </div>
                                </>
                            ) : (
                                <div className="border-t border-dashed border-muted-foreground/30 w-full max-w-xs" />
                            )}
                        </div>
                    </CollapsibleContent>
                </Collapsible>
            )}

            {/* Upcoming Tasks */}
            {upcomingTasks.length > 0 ? (
                variant === 'smart' ? renderSmartTimeline(upcomingTasks) : renderDefaultTimeline(upcomingTasks)
            ) : (
                !showPast && (
                    <div className="text-center py-12 text-muted-foreground">
                        {tasks.length > 0 ? t('common.allTasksCompleted') : t('common.noTasksFound')}
                    </div>
                )
            )}
        </div>
    );
}
