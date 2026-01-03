export type TaskDay = string;
export type TaskStatus = 'pending' | 'in-progress' | 'completed';
export type TaskPriority = 'high' | 'medium' | 'low';
export type TaskCategory =
  | 'Preparation'
  | 'Logistics'
  | 'Setup'
  | 'Communication'
  | 'Safety'
  | 'Ceremony'
  | 'Reception'
  | 'Guest Management'
  | 'Photography'
  | 'Catering'
  | 'Entertainment';

export interface Task {
  id: number;
  day: TaskDay;
  date: string;
  eventTime: string;
  event: string;
  category: TaskCategory;
  title: string;
  description: string;
  status: TaskStatus;
  priority: TaskPriority;
  assignee?: string;
}

export type UserRole = 'coordinator' | 'admin';

export interface AuthState {
  isAuthenticated: boolean;
  role: UserRole | null;
}

export interface AppState {
  isAuthenticated: boolean;
  isAdmin: boolean;
  currentView: 'admin' | 'coordinator';
  tasks: Task[];
  editingTask: Task | null;
}

export interface TaskStats {
  total: number;
  pending: number;
  inProgress: number;
  completed: number;
  highPriority: number;
}

export interface TeamMember {
  id: string;
  name: string;
  email: string; // Optional in case they just want names
  role: 'admin' | 'coordinator' | 'staff'; // Optional
  avatarUrl?: string;
  phoneNumber?: string;
}
