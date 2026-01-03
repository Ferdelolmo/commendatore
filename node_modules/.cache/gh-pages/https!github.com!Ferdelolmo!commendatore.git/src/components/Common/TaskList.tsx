import { Task, TaskStatus } from '@/types';
import { TaskCard } from './TaskCard';

interface TaskListProps {
  tasks: Task[];
  onStatusChange: (taskId: number, status: TaskStatus) => void;
  onEdit?: (task: Task) => void;
  onDelete?: (taskId: number) => void;
  isAdmin?: boolean;
  emptyMessage?: string;
}

export function TaskList({ 
  tasks, 
  onStatusChange, 
  onEdit, 
  onDelete, 
  isAdmin = false,
  emptyMessage = 'No tasks found'
}: TaskListProps) {
  if (tasks.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">{emptyMessage}</p>
      </div>
    );
  }

  // Group tasks by event
  const groupedTasks = tasks.reduce((acc, task) => {
    if (!acc[task.event]) {
      acc[task.event] = [];
    }
    acc[task.event].push(task);
    return acc;
  }, {} as Record<string, Task[]>);

  return (
    <div className="space-y-8">
      {Object.entries(groupedTasks).map(([event, eventTasks]) => (
        <div key={event}>
          <h3 className="text-lg font-serif font-semibold text-foreground mb-4 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-primary" />
            {event}
          </h3>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {eventTasks.map((task, index) => (
              <div 
                key={task.id} 
                style={{ animationDelay: `${index * 0.05}s` }}
              >
                <TaskCard
                  task={task}
                  onStatusChange={onStatusChange}
                  onEdit={onEdit}
                  onDelete={onDelete}
                  isAdmin={isAdmin}
                />
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
