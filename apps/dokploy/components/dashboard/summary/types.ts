// Types and interfaces for summary components

export interface DashboardCard {
  id: string;
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  visible: boolean;
}

export interface MetricData {
  date: string;
  value: number;
}

export interface UserAction {
  type: 'project' | 'deployment' | 'settings' | 'backup';
  message: string;
  date: string;
  icon: React.ComponentType<{ className?: string }>;
}

export interface Notification {
  id: string;
  type?: string;
  channel?: string;
  message?: string;
  title?: string;
  createdAt?: string;
  read?: boolean;
  projectId?: string;
  deploymentId?: string;
}

export interface Project {
  projectId: string;
  name: string;
  status?: string;
  compose?: any[];
}

export interface Deployment {
  composeId: string;
  name?: string;
  status: string;
}

export interface Metrics {
  cpu?: string;
  memUsed?: string;
  memUsedGB?: string;
  memTotal?: string;
  networkIn?: string;
  networkOut?: string;
  diskUsed?: string;
  totalDisk?: string;
}

// Constants
export const CARD_KEYS = [
  'stats',
  'quickActions',
  'resourceUsage',
  'trends',
  'topDeployments',
  'projects',
  'recentActivity',
  'userActions',
] as const;

export type CardKey = typeof CARD_KEYS[number]; 