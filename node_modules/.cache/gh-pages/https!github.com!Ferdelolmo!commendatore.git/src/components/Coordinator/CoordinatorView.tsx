import { useState } from 'react';
import { TaskDay, TaskStatus } from '@/types';
import { useTasks } from '@/hooks/useTasks';
import { Header } from '@/components/Common/Header';
import { Navigation } from '@/components/Common/Navigation';
import { TaskList } from '@/components/Common/TaskList';
import { TimelineView } from '@/components/Common/TimelineView';
import { TeamOverview } from '@/components/Common/TeamOverview';
import { CalendarView } from '@/components/Common/CalendarView';
import { Card, CardContent } from '@/components/ui/card';
import { Info, CheckCircle2, Clock, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export function CoordinatorView() {
  const { isLoading, updateTaskStatus, getTasksByDay, getStats, tasks: allTasks } = useTasks();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<TaskDay | 'timeline' | 'team' | 'calendar' | 'cajon-sastre'>('Friday');
  const [selectedAssignee, setSelectedAssignee] = useState<string | null>(null);

  const handleStatusChange = (taskId: number, status: TaskStatus) => {
    updateTaskStatus(taskId, status);

    const statusMessages = {
      'pending': 'Task marked as pending',
      'in-progress': 'Task is now in progress',
      'completed': 'Great job! Task completed',
    };

    toast({
      title: 'Status Updated',
      description: statusMessages[status],
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    );
  }


  const stats = getStats();
  // If activeTab is timeline, we need access to ALL tasks, but getTasksByDay only filters.
  // We need to use 'tasks' from useTasks directly if we want all tasks.
  // Wait, I need to destructure 'tasks' from useTasks first.


  const tasks = (activeTab === 'timeline' || activeTab === 'team') ? allTasks : getTasksByDay(activeTab);

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <Navigation
        activeTab={activeTab}
        onTabChange={(tab) => tab !== 'overview' && setActiveTab(tab)}
      />

      <main className="max-w-7xl mx-auto px-4 md:px-6 py-6">
        {/* Welcome Banner */}
        <Card className="mb-6 border-primary/20 bg-secondary/30 animate-fade-in">
          <CardContent className="py-4">
            <div className="flex items-start gap-3">
              <Info className="h-5 w-5 text-primary mt-0.5 shrink-0" />
              <div>
                <h3 className="font-semibold text-foreground">Welcome, Coordinator!</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  Use this view as your source of truth for the wedding day. Update task statuses as you complete them
                  to keep everyone in sync. You can change status using the dropdown on each task card.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Quick Stats */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <Card className="animate-fade-in" style={{ animationDelay: '0.1s' }}>
            <CardContent className="py-4 flex items-center gap-3">
              <div className="p-2 rounded-full bg-warning/10">
                <Clock className="h-5 w-5 text-warning" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.pending}</p>
                <p className="text-xs text-muted-foreground">Pending</p>
              </div>
            </CardContent>
          </Card>
          <Card className="animate-fade-in" style={{ animationDelay: '0.2s' }}>
            <CardContent className="py-4 flex items-center gap-3">
              <div className="p-2 rounded-full bg-info/10">
                <Loader2 className="h-5 w-5 text-info" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.inProgress}</p>
                <p className="text-xs text-muted-foreground">In Progress</p>
              </div>
            </CardContent>
          </Card>
          <Card className="animate-fade-in" style={{ animationDelay: '0.3s' }}>
            <CardContent className="py-4 flex items-center gap-3">
              <div className="p-2 rounded-full bg-success/10">
                <CheckCircle2 className="h-5 w-5 text-success" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.completed}</p>
                <p className="text-xs text-muted-foreground">Completed</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Day Header */}
        <div className="mb-6">
          <h2 className="text-2xl font-serif font-semibold text-foreground">
            {activeTab}'s Schedule
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            {tasks.length} tasks for this day • Update status as you complete each task
          </p>
        </div>

        {/* Task List */}
        {/* Task List or Timeline or Team or Calendar */}
        {activeTab === 'timeline' ? (
          <TimelineView
            tasks={tasks}
          /* Read-only: No onEdit prop */
          /* Read-only: No onStatusChange prop */
          />
        ) : activeTab === 'team' ? (
          <div className="space-y-8">
            <TeamOverview
              tasks={tasks} // accessing all tasks from hook
              selectedAssignee={selectedAssignee}
              onSelectAssignee={setSelectedAssignee}
            // onEdit not passed means read-only behavior if supported
            />
            {selectedAssignee && (
              // ...
              <div className="animate-fade-in">
                <h3 className="text-xl font-serif font-semibold mb-4 text-foreground">
                  Tasks Assigned to {selectedAssignee}
                </h3>
                <TaskList
                  tasks={tasks.filter(t => t.assignee === selectedAssignee)}
                  onStatusChange={handleStatusChange}
                  isAdmin={false}
                  emptyMessage="No tasks assigned to this person."
                />
              </div>
            )}
          </div>
        ) : activeTab === 'calendar' ? (
          <CalendarView tasks={tasks} />
        ) : (
          <TaskList
            tasks={tasks}
            onStatusChange={handleStatusChange}
            isAdmin={false}
            emptyMessage={`No tasks scheduled for ${activeTab}`}
          />
        )}
      </main>
    </div>
  );
}
