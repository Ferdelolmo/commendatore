
import { useState, useEffect, useCallback } from 'react';
import { Task, TaskStatus, TaskStats, TaskDay } from '@/types';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';

export function useTasks() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { userEmail } = useAuth();

  const fetchTasks = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('tasks')
        .select('*')
        .order('id', { ascending: true });

      if (error) throw error;

      if (data) {
        // Map snake_case database fields to camelCase frontend types
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const mappedTasks: Task[] = data.map((item: any) => ({
          ...item,
          eventTime: item.event_time,
          isPrivate: item.is_private
        }));

        // Filter private tasks
        const visibleTasks = mappedTasks.filter(t => {
          if (!t.isPrivate) return true;
          return userEmail === 'ciao@chiaraefer.com';
        });

        setTasks(visibleTasks);
      }
    } catch (error) {
      console.error('Error fetching tasks:', error);
      toast.error('Failed to load tasks');
    } finally {
      setIsLoading(false);
    }
  }, [userEmail]);

  // Subscribe to realtime changes
  useEffect(() => {
    fetchTasks();

    const channel = supabase
      .channel('tasks_changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'tasks' },
        (payload) => {
          fetchTasks();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchTasks]);

  const updateTaskStatus = useCallback(async (taskId: number, status: TaskStatus) => {
    // Optimistic update
    setTasks(prev => prev.map(t => t.id === taskId ? { ...t, status } : t));

    try {
      const { error } = await supabase
        .from('tasks')
        .update({ status })
        .eq('id', taskId);

      if (error) throw error;
    } catch (error) {
      console.error('Error updating status:', error);
      toast.error('Failed to update status');
      fetchTasks(); // Revert on error
    }
  }, [fetchTasks]);

  const addTask = useCallback(async (task: Omit<Task, 'id'>) => {
    try {
      // Map camelCase to snake_case for DB
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const dbTask: any = { ...task };
      dbTask.event_time = task.eventTime;
      delete dbTask.eventTime;

      if (task.isPrivate !== undefined) {
        dbTask.is_private = task.isPrivate;
        delete dbTask.isPrivate;
      }

      console.log('Sending task to Supabase:', dbTask);

      const { data, error } = await supabase
        .from('tasks')
        .insert([dbTask])
        .select();

      if (error) {
        console.error('Supabase INSERT Error Details:', {
          code: error.code,
          message: error.message,
          details: error.details,
          hint: error.hint
        });
        throw error;
      }

      console.log('Task added successfully:', data);
      toast.success('Task added successfully');
      fetchTasks();
    } catch (error) {
      console.error('CRITICAL: Failed to add task. See above for details.', error);
      toast.error('Failed to add task');
    }
  }, [fetchTasks]);

  const updateTask = useCallback(async (taskId: number, updates: Partial<Task>) => {
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const dbUpdates: any = { ...updates };
      if (updates.eventTime) {
        dbUpdates.event_time = updates.eventTime;
        delete dbUpdates.eventTime;
      }

      if (updates.isPrivate !== undefined) {
        dbUpdates.is_private = updates.isPrivate;
        delete dbUpdates.isPrivate;
      }

      const { error } = await supabase
        .from('tasks')
        .update(dbUpdates)
        .eq('id', taskId);

      if (error) throw error;
      toast.success('Task updated successfully');
      fetchTasks();
    } catch (error) {
      console.error('Error updating task:', error);
      toast.error('Failed to update task');
    }
  }, [fetchTasks]);

  const deleteTask = useCallback(async (taskId: number) => {
    // Optimistic update
    setTasks(prev => prev.filter(t => t.id !== taskId));

    try {
      const { error } = await supabase
        .from('tasks')
        .delete()
        .eq('id', taskId);

      if (error) throw error;
      toast.success('Task deleted');
    } catch (error) {
      console.error('Error deleting task:', error);
      toast.error('Failed to delete task');
      fetchTasks();
    }
  }, [fetchTasks]);

  const getTasksByDay = useCallback((day: TaskDay): Task[] => {
    return tasks
      .filter(task => task.day === day)
      .sort((a, b) => a.eventTime.localeCompare(b.eventTime));
  }, [tasks]);

  const getStats = useCallback((): TaskStats => {
    return {
      total: tasks.length,
      pending: tasks.filter(t => t.status === 'pending').length,
      inProgress: tasks.filter(t => t.status === 'in-progress').length,
      completed: tasks.filter(t => t.status === 'completed').length,
      highPriority: tasks.filter(t => t.priority === 'high' && t.status !== 'completed').length,
    };
  }, [tasks]);

  const getHighPriorityTasks = useCallback((): Task[] => {
    return tasks
      .filter(t => t.priority === 'high' && t.status !== 'completed')
      .sort((a, b) => {
        const dayOrder = { Friday: 0, Saturday: 1, Sunday: 2 };
        const dayDiff = dayOrder[a.day] - dayOrder[b.day];
        if (dayDiff !== 0) return dayDiff;
        return a.eventTime.localeCompare(b.eventTime);
      });
  }, [tasks]);

  const resetTasks = useCallback(async () => {
    // This functionality is dangerous in a real DB, maybe disable or warn?
    // For now we will just log a warning as it implies wiping DB and restoring defaults.
    // We can implement it if strictly needed, but better to avoid accidental resets.
    console.warn('Reset tasks is not supported in Supabase mode to prevent data loss.');
    toast.info('Reset function disabled in production mode');
  }, []);

  return {
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
  };
}
