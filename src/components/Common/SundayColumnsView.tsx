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
    return tasks.filter(t => t.day === 'Sunday' && t.status !== 'completed' && t.status !== 'deleted');
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

  // --- Timeline Calculations ---
  const PIXELS_PER_MINUTE = 2.5; // 150px per hour
  const DEFAULT_DURATION_MINS = 45; // Default visual height

  // Calculate min and max hours for the timeline scale
  const { minHour, maxHour } = useMemo(() => {
    if (sundayTasks.length === 0) return { minHour: 8, maxHour: 20 };
    
    let minMinutes = 24 * 60;
    let maxMinutes = 0;

    sundayTasks.forEach(task => {
      const [hours, minutes] = task.eventTime.split(':').map(Number);
      if (!isNaN(hours) && !isNaN(minutes)) {
        const total = hours * 60 + minutes;
        minMinutes = Math.min(minMinutes, total);
        maxMinutes = Math.max(maxMinutes, total + DEFAULT_DURATION_MINS);
      }
    });

    return {
      minHour: Math.max(0, Math.floor(minMinutes / 60) - 1),
      maxHour: Math.min(24, Math.ceil(maxMinutes / 60) + 1)
    };
  }, [sundayTasks]);

  const totalMinutes = (maxHour - minHour) * 60;
  const gridHeight = totalMinutes * PIXELS_PER_MINUTE;

  const hoursList = useMemo(() => {
    const hours = [];
    for (let h = minHour; h <= maxHour; h++) {
      hours.push(h);
    }
    return hours;
  }, [minHour, maxHour]);

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
        <div className="flex min-w-max pb-2 relative">
          
          {/* Timeline Y-Axis Container */}
          <div className="w-16 shrink-0 relative mt-[73px] mr-2 z-20 bg-background/90 backdrop-blur-sm">
            {hoursList.map(hour => (
              <div 
                key={hour} 
                className="absolute w-full text-right pr-2 text-xs font-medium text-muted-foreground -translate-y-1/2"
                style={{ top: `${(hour - minHour) * 60 * PIXELS_PER_MINUTE}px` }}
              >
                {hour.toString().padStart(2, '0')}:00
              </div>
            ))}
          </div>

          <div className="flex gap-4">
            {visibleColumns.map(columnName => {
              const columnTasks = groupedTasks[columnName] || [];
              const isHighlighted = myName && columnName === myName;
              const memberInfo = members.find(m => m.name === columnName);
              const avatarUrl = memberInfo?.avatarUrl;

              return (
                <div
                  key={columnName}
                  className={cn(
                    "w-72 shrink-0 flex flex-col rounded-xl border transition-all duration-300 relative",
                    isHighlighted
                      ? "border-primary/40 bg-gradient-to-b from-primary/5 via-card to-card shadow-md shadow-primary/5"
                      : "border-border bg-card/60"
                  )}
                >
                  {/* Column Header */}
                  <div
                    className={cn(
                      "flex items-center justify-between p-4 border-b rounded-t-xl sticky top-0 z-30 h-[73px]",
                      isHighlighted ? "bg-primary/10 border-primary/20 backdrop-blur-md" : "bg-muted/80 border-border backdrop-blur-md"
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

                  {/* Column Body / Timeline Grid */}
                  <div className="relative w-full" style={{ height: `${gridHeight}px` }}>
                    
                    {/* Horizontal Grid Lines */}
                    {hoursList.map(hour => (
                      <div 
                        key={`grid-${hour}`} 
                        className="absolute w-full border-t border-border/40 pointer-events-none"
                        style={{ top: `${(hour - minHour) * 60 * PIXELS_PER_MINUTE}px` }}
                      />
                    ))}

                    {/* Half-Hour Grid Lines */}
                    {hoursList.slice(0, -1).map(hour => (
                      <div 
                        key={`grid-half-${hour}`} 
                        className="absolute w-full border-t border-border/10 border-dashed pointer-events-none"
                        style={{ top: `${((hour - minHour) * 60 + 30) * PIXELS_PER_MINUTE}px` }}
                      />
                    ))}

                    {columnTasks.length === 0 ? (
                      <div className="absolute inset-0 flex flex-col items-center justify-center text-center text-muted-foreground opacity-50">
                        <Circle className="h-8 w-8 mb-2" />
                        <p className="text-xs">No tasks</p>
                      </div>
                    ) : (
                      columnTasks.map(task => {
                        const isMyTask = myName && (task.assignee === myName || task.collaborator === myName);
                        const isExpanded = !!expandedTasks[task.id];
                        
                        // Calculate absolute positioning
                        const [hours, minutes] = task.eventTime.split(':').map(Number);
                        const totalMinutes = hours * 60 + minutes;
                        const offsetMinutes = totalMinutes - (minHour * 60);
                        const topPx = offsetMinutes * PIXELS_PER_MINUTE;
                        
                        // Base height is 45 mins, but expands if clicked
                        const heightPx = DEFAULT_DURATION_MINS * PIXELS_PER_MINUTE;
                        
                        return (
                          <div
                            key={task.id}
                            onClick={() => toggleTaskExpand(task.id)}
                            className={cn(
                              "absolute left-2 right-2 rounded-lg border transition-all duration-300 cursor-pointer select-none overflow-hidden z-10",
                              isMyTask
                                ? "border-primary bg-primary/10 hover:bg-primary/20 shadow-sm"
                                : "border-border bg-card/95 hover:border-muted-foreground/30 hover:bg-accent/20 backdrop-blur-sm",
                              task.status === 'completed' && "opacity-50 bg-muted/30",
                              isExpanded ? "z-20 shadow-lg h-auto min-h-fit pb-2" : "overflow-hidden"
                            )}
                            style={{ 
                              top: `${topPx}px`, 
                              minHeight: `${heightPx}px`,
                              height: isExpanded ? 'auto' : `${heightPx}px`
                            }}
                          >
                            {/* Top indicator bar */}
                            <div className={cn(
                              "absolute left-0 top-0 bottom-0 w-1",
                              task.status === 'completed' ? "bg-success" :
                              task.status === 'in-progress' ? "bg-info" :
                              task.priority === 'high' ? "bg-destructive" : "bg-warning"
                            )} />

                            <div className="p-2 pl-3">
                              {/* Time & Priority Row */}
                              <div className="flex items-center justify-between gap-1 mb-1">
                                <span className="inline-flex items-center gap-1 text-[10px] font-bold text-primary">
                                  <Clock className="h-3 w-3" />
                                  {task.eventTime}
                                </span>
                                <div className="flex gap-1 items-center">
                                  {isMyTask && (
                                    <Badge variant="outline" className="text-[8px] px-1 py-0 h-3 border-primary text-primary bg-primary/5 font-semibold">
                                      Mine
                                    </Badge>
                                  )}
                                  <div className={cn(
                                    "w-2 h-2 rounded-full",
                                    task.status === 'completed' ? "bg-success" :
                                    task.status === 'in-progress' ? "bg-info" : "bg-warning"
                                  )} title={task.status} />
                                </div>
                              </div>

                              {/* Title & Event */}
                              <h4 className={cn(
                                "font-semibold text-xs leading-tight group-hover:text-primary transition-colors",
                                task.status === 'completed' && "line-through text-muted-foreground",
                                !isExpanded && "line-clamp-1"
                              )}>
                                {task.title}
                              </h4>
                              
                              <div className={cn(
                                "text-[9px] text-muted-foreground mt-0.5",
                                !isExpanded && "line-clamp-1"
                              )}>
                                {task.event}
                              </div>

                              {/* Collapsible Details */}
                              {isExpanded && (
                                <div className="mt-2 pt-2 border-t border-border/50 space-y-2 animate-fade-in">
                                  {task.description && (
                                    <p className="text-[10px] text-muted-foreground leading-relaxed whitespace-pre-line">
                                      {task.description}
                                    </p>
                                  )}
                                  
                                  <div className="flex items-center justify-between mt-2">
                                    {task.collaborator ? (
                                      <div className="flex items-center gap-1 text-[9px] text-muted-foreground bg-secondary/30 px-1.5 py-0.5 rounded w-fit border border-secondary/20">
                                        <User className="h-2.5 w-2.5" />
                                        <span>With {task.collaborator}</span>
                                      </div>
                                    ) : <div />}

                                    {onEdit && (
                                      <button
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          onEdit(task);
                                        }}
                                        className="p-1 rounded bg-secondary/50 hover:bg-primary hover:text-primary-foreground text-muted-foreground transition-colors"
                                        title="Edit Task"
                                      >
                                        <Pencil className="h-3 w-3" />
                                      </button>
                                    )}
                                  </div>
                                </div>
                              )}
                            </div>
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
    </div>
  );
}
