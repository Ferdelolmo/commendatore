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
  collaborator?: string;
  isPrivate?: boolean;
}

export type UserRole = 'coordinator' | 'admin';

export interface AuthState {
  isAuthenticated: boolean;
  role: UserRole | null;
  userEmail?: string | null;
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

export interface Supplier {
  id: string;
  name: string;
  category: string;
  contact_info?: string;
  status: 'Proposed' | 'Contacted' | 'Booked' | 'Rejected';
  price?: number;
  notes?: string;
  created_at?: string;
}

export interface Guest {
  id: string;
  name: string;
  confirmation_status: 'Pending' | 'Confirmed' | 'Declined';
  menu_preference: string;
  allergies?: string;
  attending_pre_wedding: boolean;
  transport_needs: string;
  notes?: string;
}
