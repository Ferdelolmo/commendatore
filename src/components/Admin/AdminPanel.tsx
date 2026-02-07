
import { useState } from 'react';
import { Task, TaskDay, TaskStatus } from '@/types';
import { useTasks } from '@/hooks/useTasks';
import { Header } from '@/components/Common/Header';
import { Navigation } from '@/components/Common/Navigation';
import { TaskList } from '@/components/Common/TaskList';
import { TimelineView } from '@/components/Common/TimelineView';
import { TeamOverview } from '@/components/Common/TeamOverview';
import { CalendarView } from '@/components/Common/CalendarView';
import { IdeasBoard } from '@/components/Common/IdeasBoard';
import { BudgetView } from '@/components/Common/BudgetView';
import { StatsOverview } from './StatsOverview';
import { TaskModal } from './TaskModal';
import { UserManagement } from './UserManagement';
import { SuppliersView } from '@/components/Common/SuppliersView';
import { GuestList } from './GuestList';
import { TablesView } from './TablesView';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Plus, ArrowLeft } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/contexts/AuthContext';

export function AdminPanel() {
  const { t } = useTranslation();
  const { role } = useAuth();
  const {
    tasks,
    isLoading,
    updateTaskStatus,
    addTask,
    updateTask,
    deleteTask,
    getTasksByDay,
    getStats,
    getHighPriorityTasks,
    resetTasks,
  } = useTasks();

  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<
    TaskDay | 'overview' | 'team' | 'calendar' | 'timeline' | 'users' | 'cajon-sastre' | 'budget' | 'suppliers' | 'guests' | 'tables'
  >('overview');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'in-progress' | 'completed' | string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [deleteTaskId, setDeleteTaskId] = useState<number | null>(null);
  const [deleteConfirmation, setDeleteConfirmation] = useState('');
  // const [showResetDialog, setShowResetDialog] = useState(false); // Unused
  const [highlightedTaskId, setHighlightedTaskId] = useState<number | null>(null);

  // Helper to translate tab names based on activeTab
  const getTranslatedTabName = (tab: string) => {
    switch (tab) {
      case 'overview': return t('nav.overview');
      case 'timeline': return t('nav.timeline');
      case 'team': return t('nav.team');
      case 'calendar': return t('nav.calendar');
      case 'cajon-sastre': return t('nav.cajonSastre');
      case 'budget': return t('nav.budget');
      case 'suppliers': return t('nav.suppliers');
      case 'guests': return t('nav.guests');
      case 'tables': return t('nav.tables');
      case 'Friday': return t('days.Friday');
      case 'Saturday': return t('days.Saturday');
      case 'Sunday': return t('days.Sunday');
      default: return tab;
    }
  };

  // Clear highlight after animation 
  const triggerHighlight = (taskId: number) => {
    setHighlightedTaskId(taskId);
    // Remove highlight after 2 seconds
    setTimeout(() => setHighlightedTaskId(null), 2000);
  };

  const handleTaskJump = (task: Task) => {
    // Switch to timeline
    setActiveTab('timeline');
    // Wait for render, then highlight
    setTimeout(() => triggerHighlight(task.id), 100);
  };

  const handleStatusChange = (taskId: number, status: TaskStatus) => {
    updateTaskStatus(taskId, status);
    toast({
      title: t('common.statusUpdated'),
      description: t('common.taskStatusChanged', { status: status.replace('-', ' ') }),
    });
  };

  const handleEdit = (task: Task) => {
    setEditingTask(task);
    setIsModalOpen(true);
  };

  const handleDelete = (taskId: number) => {
    setDeleteConfirmation('');
    setDeleteTaskId(taskId);
  };

  const confirmDelete = () => {
    if (deleteTaskId !== null) {
      deleteTask(deleteTaskId);
      toast({
        title: t('common.taskDeleted'),
        description: t('common.taskRemoved'),
        variant: 'destructive',
      });
      setDeleteTaskId(null);
    }
  };

  const handleSaveTask = (taskData: Omit<Task, 'id'> | Task) => {
    if ('id' in taskData) {
      updateTask(taskData.id, taskData);
      toast({
        title: 'Task Updated',
        description: 'Your changes have been saved.',
      });
    } else {
      addTask(taskData);
      toast({
        title: 'Task Created',
        description: 'New task has been added.',
      });
    }
    setEditingTask(null);
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
    setEditingTask(null);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">{t('common.loading')}</div>
      </div>
    );
  }

  const stats = getStats();
  const highPriorityTasks = getHighPriorityTasks();

  return (
    <div className="min-h-screen bg-background">
      <Header
        onUsersClick={() => setActiveTab('users')}
        onCajonSastreClick={() => setActiveTab('cajon-sastre')}
      />
      <Navigation
        activeTab={activeTab}
        onTabChange={(tab) => {
          setActiveTab(tab as any);
          setStatusFilter(null);
        }}
        showOverview
        isAdmin={role === 'admin'}
      />

      <main className="max-w-7xl mx-auto px-4 md:px-6 py-6">
        {/* Action Bar */}
        {activeTab !== 'cajon-sastre' && activeTab !== 'users' && activeTab !== 'budget' && activeTab !== 'suppliers' && activeTab !== 'guests' && activeTab !== 'tables' && (
          <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
            <div className="flex items-center gap-4">
              {statusFilter && (
                <Button variant="ghost" size="icon" onClick={() => setStatusFilter(null)}>
                  <ArrowLeft className="h-5 w-5" />
                </Button>
              )}
              <div>
                <h2 className="text-2xl font-serif font-semibold text-foreground capitalize">
                  {statusFilter
                    ? t('common.viewingTasks', { filter: statusFilter === 'all' ? t('common.allTasks') : t(`status.${statusFilter}`) })
                    : activeTab === 'overview' ? t('common.dashboardOverview') : t('common.tasksSuffix', { name: getTranslatedTabName(activeTab as string) })}
                </h2>
                <p className="text-sm text-muted-foreground mt-1">
                  {statusFilter
                    ? t('common.viewingTasks', { filter: statusFilter })
                    : activeTab === 'overview'
                      ? t('common.monitorProgress')
                      : t('common.manageTasksScheduledFor', { name: getTranslatedTabName(activeTab as string) })}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Button onClick={() => setIsModalOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                {t('common.addTask')}
              </Button>
            </div>
          </div>
        )}

        {/* Content */}
        {activeTab === 'timeline' ? (
          <TimelineView
            tasks={tasks}
            onEdit={handleEdit}
            onStatusChange={handleStatusChange}
            highlightedTaskId={highlightedTaskId}
          />
        ) : activeTab === 'users' ? (
          <UserManagement />
        ) : activeTab === 'team' ? (
          <div className="space-y-8">
            <TeamOverview
              tasks={tasks}
              selectedAssignee={statusFilter as string}
              onSelectAssignee={(assignee) => setStatusFilter(assignee as any)}
              onTaskClick={handleTaskJump}
            />
          </div>
        ) : activeTab === 'calendar' ? (
          <CalendarView tasks={tasks} onTaskClick={handleTaskJump} />
        ) : activeTab === 'budget' ? (
          <BudgetView />
        ) : activeTab === 'suppliers' ? (
          <SuppliersView />
        ) : activeTab === 'guests' ? (
          <GuestList />
        ) : activeTab === 'tables' && role === 'admin' ? (
          <TablesView />
        ) : activeTab === 'cajon-sastre' ? (
          <IdeasBoard onPromote={(content) => {
            setEditingTask(null); // Ensure new task mode
            // Hack: define a temporary ID -1 to signal "Draft".
            setEditingTask({
              id: -1, // signal new
              title: content,
              description: content,
              status: 'pending',
              priority: 'medium',
              day: 'Friday',
              date: 'June 19, 2026',
              eventTime: '12:00',
              event: 'Preparation',
              category: 'Preparation',
              assignee: ''
            } as any);
            setIsModalOpen(true);
          }} />
        ) : activeTab === 'overview' && !statusFilter ? (
          <StatsOverview
            stats={stats}
            highPriorityTasks={highPriorityTasks}
            onFilterClick={(filter) => setStatusFilter(filter)}
          />
        ) : (activeTab === 'Friday' || activeTab === 'Saturday' || activeTab === 'Sunday') ? (
          <TimelineView
            tasks={getTasksByDay(activeTab as TaskDay)}
            onEdit={handleEdit}
            onStatusChange={handleStatusChange}
            highlightedTaskId={highlightedTaskId}
            variant="smart"
          />
        ) : (
          <TaskList
            tasks={statusFilter
              ? tasks.filter(t => statusFilter === 'all' || t.status === statusFilter)
              : getTasksByDay(activeTab as TaskDay)
            }
            onStatusChange={handleStatusChange}
            onEdit={handleEdit}
            onDelete={handleDelete}
            isAdmin
            emptyMessage={statusFilter
              ? t('common.noTasksFound')
              : t('common.noTasksFound')
            }
          />
        )}
      </main>

      {/* Task Modal */}
      <TaskModal
        isOpen={isModalOpen}
        onClose={handleModalClose}
        onSave={handleSaveTask}
        task={editingTask}
      />

      {/* Delete Confirmation */}
      <AlertDialog open={deleteTaskId !== null} onOpenChange={() => setDeleteTaskId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('common.deleteTask')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('common.confirmDelete')}
            </AlertDialogDescription>
            <div className="py-4">
              <Label htmlFor="confirm-delete" className="text-sm font-medium mb-2 block">
                {t('common.typeDelete')}
              </Label>
              <Input
                id="confirm-delete"
                value={deleteConfirmation}
                onChange={(e) => setDeleteConfirmation(e.target.value)}
                placeholder="Type 'delete' here"
                className={deleteConfirmation !== 'delete' ? 'border-red-300' : 'border-green-500'}
              />
            </div>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              disabled={deleteConfirmation !== 'delete'}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {t('common.delete')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

    </div>
  );
}
