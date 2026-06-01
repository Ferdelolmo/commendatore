import React, { useState, useEffect, useMemo } from 'react';
import { Task, TaskStatus } from '@/types';
import { useTeam } from '@/hooks/useTeam';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Clock, User, CheckCircle2, Circle, Loader2, Star, Eye, EyeOff, Pencil } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SundayColumnsViewProps {
  tasks: Task[];
  onStatusChange: (taskId: number, status: TaskStatus) => void;
  onEdit?: (task: Task) => void;
  isAdmin?: boolean;
}

const LOCAL_STORAGE_KEY = 'sunday-columns-my-name';

export function SundayColumnsView({ tasks, onStatusChange, onEdit, isAdmin = false }: SundayColumnsViewProps) {
  const { t } = useTranslation();
  const { members } = useTeam();
  const [myName, setMyName] = useState<string>('');
  const [onlyShowMine, setOnlyShowMine] = useState<boolean>(false);
  const [expandedTasks, setExpandedTasks] = useState<Record<number, boolean>>({});

  // Initialize selected name from localStorage
  useEffect(() => {
    const stored = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (stored) {
      setMyName(stored);
    }
  }, []);

  // Save selected name to localStorage
  const handleNameChange = (name: string) => {
    setMyName(name);
    if (name) {
      localStorage.setItem(LOCAL_STORAGE_KEY, name);
    } else {
      localStorage.removeItem(LOCAL_STORAGE_KEY);
      setOnlyShowMine(false);
    }
  };

  // Toggle task card expansion to show description
  const toggleTaskExpand = (taskId: number) => {
    setExpandedTasks(prev => ({
      ...prev,
      [taskId]: !prev[taskId]
    }));
  };

  // Filter tasks to Sunday only
  const sundayTasks = useMemo(() => {
    return tasks.filter(t => t.day === 'Sunday');
  }, [tasks]);

  // Extract list of all unique assignees present on Sunday
  const assignees = useMemo(() => {
    const list = new Set<string>();
    sundayTasks.forEach(task => {
      if (task.assignee) {
        list.add(task.assignee);
      }
    });
    // Sort alphabetically, placing Unassigned at the end
    return Array.from(list).sort();
  }, [sundayTasks]);

  // Group Sunday tasks by assignee
  const groupedTasks = useMemo(() => {
    const groups: Record<string, Task[]> = {};
    
    // Initialize groups
    assignees.forEach(name => {
      groups[name] = [];
    });
    groups['Unassigned'] = [];

    sundayTasks.forEach(task => {
      const assigneeKey = task.assignee || 'Unassigned';
      if (!groups[assigneeKey]) {
        groups[assigneeKey] = [];
      }
      groups[assigneeKey].push(task);
    });

    // Sort tasks in each group chronologically by time
    Object.keys(groups).forEach(key => {
      groups[key].sort((a, b) => a.eventTime.localeCompare(b.eventTime));
    });

    return groups;
  }, [sundayTasks, assignees]);

  // Filter the columns to display based on state
  const visibleColumns = useMemo(() => {
    const columns = [...assignees];
    
    // Add Unassigned if there are any unassigned tasks
    if (groupedTasks['Unassigned'] && groupedTasks['Unassigned'].length > 0) {
      columns.push('Unassigned');
    }

    if (onlyShowMine && myName) {
      return columns.filter(c => c === myName);
    }

    return columns;
  }, [assignees, groupedTasks, onlyShowMine, myName]);

  // List of all options for the dropdown selector (unique assignees on Sunday + team members)
  const allPossibleNames = useMemo(() => {
    const names = new Set<string>(assignees);
    members.forEach(m => names.add(m.name));
    return Array.from(names).sort();
  }, [assignees, members]);

  return (
    <div className="space-y-6">
      {/* Header Controls Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl border border-primary/10 bg-card/50 backdrop-blur-sm shadow-sm">
        <div className="space-y-1">
          <h3 className="text-lg font-serif font-semibold text-foreground">Sunday Columnar Timeline</h3>
          <p className="text-xs text-muted-foreground">
            {sundayTasks.length} tasks scheduled • Columns sorted by assignee and timeline
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          {/* My Name Selector */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-muted-foreground whitespace-nowrap">Highlight My Tasks:</span>
            <select
              value={myName}
              onChange={(e) => handleNameChange(e.target.value)}
              className="h-9 px-3 text-sm rounded-lg border border-input bg-background shadow-sm outline-none focus:ring-2 focus:ring-primary/20 cursor-pointer pr-8"
            >
              <option value="">Select your name...</option>
              {allPossibleNames.map(name => (
                <option key={name} value={name}>{name}</option>
              ))}
            </select>
          </div>

          {/* Toggle Only Mine */}
          {myName && (
            <button
              onClick={() => setOnlyShowMine(!onlyShowMine)}
              className={cn(
                "inline-flex items-center gap-1.5 h-9 px-3 rounded-lg text-sm font-medium transition-colors border shadow-sm",
                onlyShowMine
                  ? "bg-primary text-primary-foreground border-primary hover:bg-primary/95"
                  : "bg-background text-foreground border-input hover:bg-accent/50"
              )}
            >
              {onlyShowMine ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
              {onlyShowMine ? "Show All Columns" : "Show Only Mine"}
            </button>
          )}
        </div>
      </div>

      {/* Board Scroll Container */}
      <div className="w-full overflow-x-auto pb-4 -mx-4 px-4 md:mx-0 md:px-0 scrollbar-thin scrollbar-thumb-muted">
        <div className="flex gap-6 min-w-max pb-2">
          {visibleColumns.map(columnName => {
            const columnTasks = groupedTasks[columnName] || [];
            const isHighlighted = myName && columnName === myName;
            const memberInfo = members.find(m => m.name === columnName);
            const avatarUrl = memberInfo?.avatarUrl;

            return (
              <div
                key={columnName}
                className={cn(
                  "w-80 shrink-0 flex flex-col rounded-xl border transition-all duration-300",
                  isHighlighted
                    ? "border-primary/40 bg-gradient-to-b from-primary/5 via-card to-card shadow-md shadow-primary/5"
                    : "border-border bg-card/60"
                )}
              >
                {/* Column Header */}
                <div
                  className={cn(
                    "flex items-center justify-between p-4 border-b rounded-t-xl",
                    isHighlighted ? "bg-primary/5 border-primary/20" : "bg-muted/30 border-border"
                  )}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <Avatar className="h-8 w-8 shrink-0">
                      <AvatarImage src={avatarUrl} alt={columnName} className="object-cover" />
                      <AvatarFallback className="bg-primary/10 text-primary text-xs font-semibold">
                        {columnName === 'Unassigned' ? '?' : columnName.substring(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="truncate">
                      <div className="font-semibold text-sm text-foreground flex items-center gap-1">
                        {columnName}
                        {isHighlighted && <Star className="h-3 w-3 fill-primary text-primary shrink-0 animate-pulse" />}
                      </div>
                      <p className="text-[10px] text-muted-foreground uppercase tracking-wider">
                        {columnName === 'Unassigned' ? 'Needs Assignee' : memberInfo?.role || 'Coordinator'}
                      </p>
                    </div>
                  </div>
                  <Badge variant="secondary" className={cn("text-xs font-semibold", isHighlighted && "bg-primary/20 text-primary border-primary/30")}>
                    {columnTasks.length}
                  </Badge>
                </div>

                {/* Column Body / Task List */}
                <div className="p-4 space-y-4 flex-1 min-h-[400px] max-h-[600px] overflow-y-auto scrollbar-thin">
                  {columnTasks.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-center py-12 text-muted-foreground">
                      <Circle className="h-8 w-8 opacity-20 mb-2" />
                      <p className="text-xs">No tasks for Sunday</p>
                    </div>
                  ) : (
                    columnTasks.map(task => {
                      const isMyTask = myName && (task.assignee === myName || task.collaborator === myName);
                      const isExpanded = !!expandedTasks[task.id];
                      
                      return (
                        <div
                          key={task.id}
                          onClick={() => toggleTaskExpand(task.id)}
                          className={cn(
                            "group relative flex flex-col p-4 rounded-lg border transition-all duration-300 cursor-pointer select-none",
                            isMyTask
                              ? "border-primary bg-primary/5 hover:bg-primary/10 shadow-sm"
                              : "border-border bg-card/90 hover:border-muted-foreground/30 hover:bg-accent/10",
                            task.status === 'completed' && "opacity-60 bg-muted/20"
                          )}
                        >
                          {/* Top indicator bar */}
                          <div className={cn(
                            "absolute left-0 top-0 bottom-0 w-1 rounded-l-lg",
                            task.status === 'completed' ? "bg-success" :
                            task.status === 'in-progress' ? "bg-info" :
                            task.priority === 'high' ? "bg-destructive" : "bg-warning"
                          )} />

                          {/* Time & Priority Row */}
                          <div className="flex items-center justify-between gap-2 mb-2">
                            <span className="inline-flex items-center gap-1 text-xs font-semibold text-primary">
                              <Clock className="h-3 w-3" />
                              {task.eventTime}
                            </span>
                            <div className="flex gap-1.5 items-center">
                              {isMyTask && (
                                <Badge variant="outline" className="text-[9px] px-1 py-0 h-4 border-primary text-primary bg-primary/5 font-semibold">
                                  My Task
                                </Badge>
                              )}
                              <Badge variant="outline" className={cn(
                                "text-[9px] px-1 py-0 h-4 capitalize font-medium",
                                task.status === 'completed' ? "text-success border-success/20 bg-success/5" :
                                task.status === 'in-progress' ? "text-info border-info/20 bg-info/5" :
                                "text-warning border-warning/20 bg-warning/5"
                              )}>
                                {t(`status.${task.status}`, task.status)}
                              </Badge>
                              <Badge variant="outline" className={cn(
                                "text-[9px] px-1 py-0 h-4 capitalize font-medium",
                                task.priority === 'high' ? "text-destructive border-destructive/20 bg-destructive/5" :
                                task.priority === 'medium' ? "text-amber-500 border-amber-500/20 bg-amber-500/5" :
                                "text-muted-foreground border-border bg-muted/5"
                              )}>
                                {task.priority}
                              </Badge>
                              {onEdit && (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    onEdit(task);
                                  }}
                                  className="p-1 rounded hover:bg-accent text-muted-foreground hover:text-foreground transition-colors ml-1"
                                  title="Edit Task"
                                >
                                  <Pencil className="h-3 w-3" />
                                </button>
                              )}
                            </div>
                          </div>

                          {/* Title & Event */}
                          <h4 className={cn(
                            "font-semibold text-sm text-foreground leading-tight group-hover:text-primary transition-colors",
                            task.status === 'completed' && "line-through text-muted-foreground"
                          )}>
                            {task.title}
                          </h4>
                          <span className="text-[10px] text-muted-foreground mt-1">
                            {task.event} • {task.category}
                          </span>

                          {/* Collapsible Details */}
                          {isExpanded && (
                            <div className="mt-3 pt-3 border-t border-border/50 space-y-2 animate-fade-in">
                              {task.description ? (
                                <p className="text-xs text-muted-foreground leading-relaxed whitespace-pre-line">
                                  {task.description}
                                </p>
                              ) : (
                                <p className="text-xs text-muted-foreground italic">No description provided.</p>
                              )}
                              
                              {task.collaborator && (
                                <div className="flex items-center gap-1.5 mt-2 text-[10px] text-muted-foreground bg-secondary/30 px-2 py-1 rounded w-fit border border-secondary/20">
                                  <User className="h-3 w-3" />
                                  <span>Collaborator: {task.collaborator}</span>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })
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
