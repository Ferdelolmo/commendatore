import { TaskStats, Task } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  ListTodo,
  Clock,
  Loader2,
  CheckCircle2,
  AlertTriangle,
  TrendingUp
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTranslation } from 'react-i18next';

interface StatsOverviewProps {
  stats: TaskStats;
  highPriorityTasks: Task[];
  onFilterClick: (filter: 'all' | 'pending' | 'in-progress' | 'completed') => void;
}

export function StatsOverview({ stats, highPriorityTasks, onFilterClick }: StatsOverviewProps) {
  const { t } = useTranslation();
  const completionRate = stats.total > 0
    ? Math.round((stats.completed / stats.total) * 100)
    : 0;

  const statCards = [
    {
      title: t('common.totalTasks'),
      value: stats.total,
      icon: ListTodo,
      color: 'text-primary',
      bgColor: 'bg-primary/10',
      filter: 'all' as const,
    },
    {
      title: t('status.pending'),
      value: stats.pending,
      icon: Clock,
      color: 'text-warning',
      bgColor: 'bg-warning/10',
      filter: 'pending' as const,
    },
    {
      title: t('status.in-progress'),
      value: stats.inProgress,
      icon: Loader2,
      color: 'text-info',
      bgColor: 'bg-info/10',
      filter: 'in-progress' as const,
    },
    {
      title: t('status.completed'),
      value: stats.completed,
      icon: CheckCircle2,
      color: 'text-success',
      bgColor: 'bg-success/10',
      filter: 'completed' as const,
    },
  ];

  return (
    <div className="space-y-6">
      {/* Stats Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {statCards.map((stat, index) => (
          <Card
            key={stat.title}
            className="animate-fade-in cursor-pointer transition-all hover:shadow-md hover:scale-[1.02]"
            style={{ animationDelay: `${index * 0.1}s` }}
            onClick={() => onFilterClick(stat.filter)}
          >
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">{stat.title}</p>
                  <p className="text-3xl font-bold mt-1">{stat.value}</p>
                </div>
                <div className={cn('p-3 rounded-full', stat.bgColor)}>
                  <stat.icon className={cn('h-6 w-6', stat.color)} />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Progress Card */}
      <Card className="animate-fade-in" style={{ animationDelay: '0.4s' }}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <TrendingUp className="h-5 w-5 text-primary" />
            {t('common.overallProgress')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <div className="h-4 bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-primary to-success transition-all duration-500 rounded-full"
                  style={{ width: `${completionRate}%` }}
                />
              </div>
            </div>
            <span className="text-2xl font-bold text-primary">{completionRate}%</span>
          </div>
          <p className="text-sm text-muted-foreground mt-2">
            {t('common.completedOfTotal', { completed: stats.completed, total: stats.total })}
          </p>
        </CardContent>
      </Card>

      {/* High Priority Tasks */}
      {highPriorityTasks.length > 0 && (
        <Card className="animate-fade-in border-destructive/30" style={{ animationDelay: '0.5s' }}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              {t('common.highPriorityTasks')} ({highPriorityTasks.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {highPriorityTasks.slice(0, 5).map((task) => (
                <div
                  key={task.id}
                  className="flex items-center justify-between p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                >
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">{task.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {task.day} • {task.eventTime} • {task.event}
                    </p>
                  </div>
                  <span className={cn(
                    'text-xs px-2 py-1 rounded-full ml-3 shrink-0',
                    task.status === 'pending' ? 'status-pending' : 'status-in-progress'
                  )}>
                    {t(`status.${task.status}`)}
                  </span>
                </div>
              ))}
              {highPriorityTasks.length > 5 && (
                <p className="text-sm text-muted-foreground text-center pt-2">
                  {t('common.moreHighPriorityTasks', { count: highPriorityTasks.length - 5 })}
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
