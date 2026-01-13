import { Task } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, Clock, Loader2, Circle, AlertCircle } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useTeam } from '@/hooks/useTeam';
import { useTranslation } from 'react-i18next';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { enUS, es, it } from 'date-fns/locale';

interface TeamOverviewProps {
    tasks: Task[];
    onSelectAssignee?: (assignee: string) => void;
    selectedAssignee?: string | null;
    onTaskClick?: (task: Task) => void;
}

export function TeamOverview({ tasks, onSelectAssignee, selectedAssignee, onTaskClick }: TeamOverviewProps) {
    const { members } = useTeam();
    const { t, i18n } = useTranslation();

    // Determine current locale for date-fns
    const dateLocale = i18n.language === 'es' ? es : i18n.language === 'it' ? it : enUS;

    // Group tasks by assignee
    const assigneeGroups = tasks.reduce((acc, task) => {
        const assignee = task.assignee || 'Unassigned';
        if (!acc[assignee]) {
            acc[assignee] = [];
        }
        acc[assignee].push(task);
        return acc;
    }, {} as Record<string, Task[]>);

    const assignees = Object.keys(assigneeGroups).sort();

    if (assignees.length === 0) {
        return (
            <div className="text-center py-12">
                <AlertCircle className="h-10 w-10 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-foreground">No Assignments Yet</h3>
                <p className="text-muted-foreground mt-2">
                    Assign tasks to team members to see them appear here.
                </p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {assignees.map((assignee) => {
                    const assigneeTasks = assigneeGroups[assignee];
                    // Sort tasks: pending/in-progress first, then completed
                    assigneeTasks.sort((a, b) => {
                        if (a.status === 'completed' && b.status !== 'completed') return 1;
                        if (a.status !== 'completed' && b.status === 'completed') return -1;
                        return 0;
                    });

                    const member = members.find(m => m.name === assignee);
                    const avatarUrl = member?.avatarUrl;

                    return (
                        <Card key={assignee} className="flex flex-col h-full max-h-[500px]">
                            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0 border-b bg-muted/40">
                                <CardTitle className="text-base font-semibold truncate items-center flex gap-2">
                                    <Avatar className="h-8 w-8">
                                        <AvatarImage src={avatarUrl} alt={assignee} className="object-cover" />
                                        <AvatarFallback className="bg-primary/10 text-primary text-xs">
                                            {assignee.substring(0, 2).toUpperCase()}
                                        </AvatarFallback>
                                    </Avatar>
                                    {assignee}
                                </CardTitle>
                                <Badge variant="secondary" className="ml-2">
                                    {assigneeTasks.length}
                                </Badge>
                            </CardHeader>
                            <CardContent className="p-0 flex-1 min-h-0">
                                <ScrollArea className="h-full">
                                    <div className="p-4 space-y-3">
                                        {assigneeTasks.map(task => {
                                            // Format date
                                            let dateDisplay = task.date;
                                            try {
                                                const dateObj = new Date(task.date);
                                                if (!isNaN(dateObj.getTime())) {
                                                    dateDisplay = format(dateObj, 'PP', { locale: dateLocale });
                                                }
                                            } catch (e) {
                                                // Fallback to original string if parse fails
                                            }

                                            return (
                                                <div
                                                    key={task.id}
                                                    onClick={() => onTaskClick?.(task)}
                                                    className={`group flex items-start gap-3 text-sm p-3 rounded-lg hover:bg-accent/50 transition-colors border border-transparent hover:border-border ${onTaskClick ? 'cursor-pointer' : ''}`}
                                                >
                                                    <div className="mt-0.5 shrink-0">
                                                        {task.status === 'completed' ? (
                                                            <CheckCircle2 className="h-4 w-4 text-success" />
                                                        ) : task.status === 'in-progress' ? (
                                                            <Loader2 className="h-4 w-4 text-info animate-spin" />
                                                        ) : (
                                                            <Circle className="h-4 w-4 text-muted-foreground" />
                                                        )}
                                                    </div>
                                                    <div className="flex-1 min-w-0 space-y-1.5">
                                                        <div>
                                                            <p className={`font-medium leading-none ${task.status === 'completed' ? 'text-muted-foreground line-through' : 'text-foreground'}`}>
                                                                {task.title}
                                                            </p>
                                                            <p className="text-xs text-muted-foreground mt-1 truncate">
                                                                {task.event}
                                                            </p>
                                                        </div>

                                                        <div className="flex flex-wrap gap-2">
                                                            <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-5 font-medium text-muted-foreground bg-secondary/30 border-secondary">
                                                                {dateDisplay}
                                                            </Badge>
                                                            <Badge variant="outline" className={cn(
                                                                "text-[10px] px-1.5 py-0 h-5 font-medium capitalize",
                                                                task.priority === 'high' ? "text-destructive border-destructive/30 bg-destructive/5" :
                                                                    task.priority === 'medium' ? "text-amber-500 border-amber-500/30 bg-amber-500/5" :
                                                                        "text-muted-foreground border-border bg-muted/30"
                                                            )}>
                                                                {task.priority}
                                                            </Badge>
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </ScrollArea>
                            </CardContent>
                        </Card>
                    );
                })}
            </div>
        </div>
    );
}
