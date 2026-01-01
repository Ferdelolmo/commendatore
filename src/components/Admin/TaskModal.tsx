import { useState, useEffect } from 'react';
import { Task, TaskDay, TaskStatus, TaskPriority, TaskCategory } from '@/types';
import { getGoogleCalendarUrl } from '@/lib/calendar';
import { Calendar as CalendarIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useTranslation } from 'react-i18next';

interface TaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (task: Omit<Task, 'id'> | Task) => void;
  task?: Task | null;
}

const days: TaskDay[] = ['Friday', 'Saturday', 'Sunday'];
const statuses: TaskStatus[] = ['pending', 'in-progress', 'completed'];
const priorities: TaskPriority[] = ['high', 'medium', 'low'];
const categories: TaskCategory[] = [
  'Preparation',
  'Logistics',
  'Setup',
  'Communication',
  'Safety',
  'Ceremony',
  'Reception',
  'Guest Management',
  'Photography',
  'Catering',
  'Entertainment',
];

const eventNames = [
  'Pre Wedding',
  'Paint & Wine',
  'Petanca',
  'Wedding Day',
  'Preparation',
];

const assignees = [
  'Fernando',
  'Chiara',
  'Wedding Planner',
  'Ruben',
  'Alessia',
  'Rubio',
  'José Ángel',
  'Adolfo',
  'Elisa',
  'Adrian',
  'Javier Maitre',
  'Marzia',
  'Ugo',
  'Amparito',
  'Mari Pili',
  'Emmanuel',
  'Rosetta',
  'Padre Fernando',
  'Sonia',
  'Laia',
  'Yivan',
];

const dateMap: Record<string, string> = {
  Friday: 'June 19, 2026',
  Saturday: 'June 20, 2026',
  Sunday: 'June 21, 2026',
};

const defaultTask: Omit<Task, 'id'> = {
  day: 'Sunday',
  date: 'June 21, 2026',
  eventTime: '12:00',
  event: '',
  category: 'Preparation',
  title: '',
  description: '',
  status: 'pending',
  priority: 'medium',
  assignee: '',
};

export function TaskModal({ isOpen, onClose, onSave, task }: TaskModalProps) {
  const { t } = useTranslation();
  const [formData, setFormData] = useState<Omit<Task, 'id'>>(defaultTask);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [taskType, setTaskType] = useState<'wedding' | 'preparation'>('wedding');

  useEffect(() => {
    if (task) {
      const { id, ...taskData } = task;

      // If ID is -1, treat as new task ("Draft Promotion")
      if (id === -1) {
        setFormData(taskData);
        setTaskType('wedding'); // or heuristic
      } else {
        setFormData(taskData);
        // Determine if it's a wedding day task or preparation
        const isWeddingDay = ['June 19, 2026', 'June 20, 2026', 'June 21, 2026'].includes(taskData.date);
        setTaskType(isWeddingDay ? 'wedding' : 'preparation');
      }
    } else {
      setFormData(defaultTask);
      setTaskType('wedding');
    }
    setErrors({});
  }, [task, isOpen]);

  const handleDayChange = (day: TaskDay) => {
    setFormData(prev => ({
      ...prev,
      day,
      date: dateMap[day],
    }));
  };

  const handleDateChange = (dateString: string) => {
    // dateString comes as YYYY-MM-DD from input type="date"
    const dateObj = new Date(dateString);
    const formattedDate = dateObj.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
    const dayName = dateObj.toLocaleDateString('en-US', { weekday: 'long' });

    setFormData(prev => ({
      ...prev,
      date: formattedDate,
      day: dayName,
    }));
  };

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.title.trim()) {
      newErrors.title = t('common.titleRequired');
    }
    if (!formData.event.trim()) {
      newErrors.event = t('common.eventRequired');
    }
    if (!formData.description.trim()) {
      newErrors.description = t('common.descriptionRequired');
    }
    if (!formData.eventTime.match(/^\d{2}:\d{2}$/)) {
      newErrors.eventTime = t('common.timeFormatError');
    }
    if (!formData.assignee) {
      newErrors.assignee = t('common.assigneeRequired');
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = () => {
    if (!validate()) return;

    if (task && task.id !== -1) {
      onSave({ ...formData, id: task.id });
    } else {
      onSave(formData);
    }
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-serif text-xl">
            {task && task.id !== -1 ? t('common.editTask') : t('common.addNewTask')}
          </DialogTitle>
          <DialogDescription>
            {task ? t('common.updateTaskDetails') : t('common.enterTaskDetails')}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Title */}
          <div>
            <Label htmlFor="title">{t('common.taskTitle')} *</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
              placeholder={t('common.taskTitlePlaceholder')}
              className={errors.title ? 'border-destructive' : ''}
            />
            {errors.title && <p className="text-xs text-destructive mt-1">{errors.title}</p>}
          </div>

          {/* Task Phase Toggle */}
          <div className="flex p-1 bg-muted rounded-lg mb-4">
            <button
              type="button"
              className={`flex-1 py-1.5 text-sm font-medium rounded-md transition-all ${taskType === 'wedding' ? 'bg-white shadow-sm text-primary' : 'text-muted-foreground hover:text-foreground'}`}
              onClick={() => {
                setTaskType('wedding');
                // Reset to default date
                handleDayChange('Friday');
              }}
            >
              {t('common.weddingWeekend')}
            </button>
            <button
              type="button"
              className={`flex-1 py-1.5 text-sm font-medium rounded-md transition-all ${taskType === 'preparation' ? 'bg-white shadow-sm text-primary' : 'text-muted-foreground hover:text-foreground'}`}
              onClick={() => {
                setTaskType('preparation');
              }}
            >
              {t('common.preparationOther')}
            </button>
          </div>

          {/* Day/Date and Time */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>{taskType === 'wedding' ? t('common.day') : t('common.date')} *</Label>
              {taskType === 'wedding' ? (
                <Select value={formData.day} onValueChange={(v: string) => handleDayChange(v)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {days.map(day => (
                      <SelectItem key={day} value={day}>
                        {t(`days.${day}`)} ({dateMap[day].split(',')[0]})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <Input
                  type="date"
                  onChange={(e) => handleDateChange(e.target.value)}
                  className="w-full"
                />
              )}
            </div>
            <div>
              <Label htmlFor="eventTime">{t('common.time')} *</Label>
              <Input
                id="eventTime"
                type="time"
                value={formData.eventTime}
                onChange={(e) => setFormData(prev => ({ ...prev, eventTime: e.target.value }))}
                className={errors.eventTime ? 'border-destructive' : ''}
              />
              {errors.eventTime && <p className="text-xs text-destructive mt-1">{errors.eventTime}</p>}
            </div>
          </div>

          {/* Event */}
          <div>
            <Label htmlFor="event">{t('common.eventName')} *</Label>
            <Select
              value={formData.event}
              onValueChange={(v) => setFormData(prev => ({ ...prev, event: v }))}
            >
              <SelectTrigger className={errors.event ? 'border-destructive' : ''}>
                <SelectValue placeholder={t('common.selectEvent')} />
              </SelectTrigger>
              <SelectContent>
                {eventNames.map(name => (
                  <SelectItem key={name} value={name}>{name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.event && <p className="text-xs text-destructive mt-1">{errors.event}</p>}
          </div>

          {/* Category and Priority */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>{t('common.category')}</Label>
              <Select
                value={formData.category}
                onValueChange={(v: TaskCategory) => setFormData(prev => ({ ...prev, category: v }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {categories.map(cat => (
                    <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>{t('common.priority')}</Label>
              <Select
                value={formData.priority}
                onValueChange={(v: TaskPriority) => setFormData(prev => ({ ...prev, priority: v }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {priorities.map(p => (
                    <SelectItem key={p} value={p} className="capitalize">{p}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Status (only for editing) */}
          {task && (
            <div>
              <Label>{t('common.statusLabel')}</Label>
              <Select
                value={formData.status}
                onValueChange={(v: TaskStatus) => setFormData(prev => ({ ...prev, status: v }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {statuses.map(s => (
                    <SelectItem key={s} value={s} className="capitalize">
                      {t(`status.${s}`)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Assignee */}
          <div>
            <Label>{t('common.assignee')}</Label>
            <Select
              value={formData.assignee || ''}
              onValueChange={(v) => setFormData(prev => ({ ...prev, assignee: v }))}
            >
              <SelectTrigger>
                <SelectValue placeholder={t('common.selectAssignee')} />
              </SelectTrigger>
              <SelectContent>
                {assignees.map(person => (
                  <SelectItem key={person} value={person}>{person}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.assignee && <p className="text-xs text-destructive mt-1">{errors.assignee}</p>}
          </div>

          {/* Description */}
          <div>
            <Label htmlFor="description">{t('common.description')} *</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              placeholder={t('common.descriptionPlaceholder')}
              rows={3}
              className={errors.description ? 'border-destructive' : ''}
            />
            {errors.description && <p className="text-xs text-destructive mt-1">{errors.description}</p>}
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          {task && (
            <Button
              type="button"
              variant="secondary"
              onClick={() => {
                if (task) {
                  const url = getGoogleCalendarUrl({ ...formData, id: task.id } as Task);
                  window.open(url, '_blank');
                }
              }}
              className="mr-auto"
            >
              <CalendarIcon className="h-4 w-4 mr-2" />
              {t('common.addToCalendar')}
            </Button>
          )}
          <div className="flex gap-2">
            <Button variant="outline" onClick={onClose}>
              {t('common.cancel')}
            </Button>
            <Button onClick={handleSubmit}>
              {task ? t('common.saveChanges') : t('common.addTask')}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
