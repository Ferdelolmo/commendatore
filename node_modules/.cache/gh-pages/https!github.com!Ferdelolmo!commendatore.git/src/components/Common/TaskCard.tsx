import { Task, TaskStatus } from '@/types';
import { cn } from '@/lib/utils';
import { Clock, Tag, CheckCircle2, Circle, Loader2, Pencil, Trash2, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface TaskCardProps {
  task: Task;
  onStatusChange: (taskId: number, status: TaskStatus) => void;
  onEdit?: (task: Task) => void;
  onDelete?: (taskId: number) => void;
  isAdmin?: boolean;
}

const statusConfig = {
  pending: {
    label: 'Pending',
    icon: Circle,
    className: 'status-pending',
  },
  'in-progress': {
    label: 'In Progress',
    icon: Loader2,
    className: 'status-in-progress',
  },
  completed: {
    label: 'Completed',
    icon: CheckCircle2,
    className: 'status-completed',
  },
};

const priorityConfig = {
  high: 'priority-high',
  medium: 'priority-medium',
  low: 'priority-low',
};

export function TaskCard({ task, onStatusChange, onEdit, onDelete, isAdmin = false }: TaskCardProps) {
  const status = statusConfig[task.status];
  const StatusIcon = status.icon;

  return (
    <div
      className={cn(
        'task-card animate-fade-in',
        priorityConfig[task.priority],
        task.status === 'completed' && 'opacity-75'
      )}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex-1 min-w-0">
          <h3 className={cn(
            'font-semibold text-foreground leading-tight',
            task.status === 'completed' && 'line-through text-muted-foreground'
          )}>
            {task.title}
          </h3>
          <p className="text-sm text-muted-foreground mt-1">{task.event}</p>
        </div>
        <div className="flex gap-2 shrink-0">
          {task.assignee && (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border bg-secondary/50 text-secondary-foreground border-secondary">
              <User className="h-3 w-3" />
              {task.assignee}
            </span>
          )}
          <span className={cn(
            'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border',
            status.className
          )}>
            <StatusIcon className={cn('h-3 w-3', task.status === 'in-progress' && 'animate-spin')} />
            {status.label}
          </span>
        </div>
      </div>

      {/* Meta */}
      <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground mb-3">
        <span className="inline-flex items-center gap-1.5">
          <Clock className="h-4 w-4" />
          {task.eventTime}
        </span>
        <span className="inline-flex items-center gap-1.5">
          <Tag className="h-4 w-4" />
          {task.category}
        </span>
      </div>

      {/* Description */}
      <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
        {task.description}
      </p>

      {/* Actions */}
      <div className="flex items-center justify-between gap-3 pt-3 border-t border-border">
        <Select
          value={task.status}
          onValueChange={(value: TaskStatus) => onStatusChange(task.id, value)}
          disabled={!isAdmin}
        >
          <SelectTrigger className="w-[140px] h-9 text-sm">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="in-progress">In Progress</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
          </SelectContent>
        </Select>

        {isAdmin && (
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onEdit?.(task)}
              className="h-9 px-3"
            >
              <Pencil className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onDelete?.(task.id)}
              className="h-9 px-3 text-destructive hover:text-destructive hover:bg-destructive/10"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
