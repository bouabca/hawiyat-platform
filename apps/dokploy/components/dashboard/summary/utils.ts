// Utility functions for summary components

export const formatNumber = (num: number): string => {
  if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
  if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
  return num.toString();
};

export const getTimeAgo = (date: string): string => {
  const now = new Date();
  const past = new Date(date);
  const diffInMinutes = Math.floor((now.getTime() - past.getTime()) / (1000 * 60));
  
  if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
  if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
  return `${Math.floor(diffInMinutes / 1440)}d ago`;
};

export const getHealthStatus = (metrics: any, loading: boolean) => {
  if (loading) return { status: 'loading', color: 'text-muted-foreground', icon: 'Loader2' };
  if (!metrics.cpu && !metrics.memUsed) return { status: 'unknown', color: 'text-yellow-600', icon: 'AlertTriangle' };
  
  const cpuUsage = parseFloat(metrics.cpu) || 0;
  const memUsage = parseFloat(metrics.memUsed) || 0;
  
  if (cpuUsage > 90 || memUsage > 90) return { status: 'critical', color: 'text-red-600', icon: 'AlertTriangle' };
  if (cpuUsage > 70 || memUsage > 70) return { status: 'warning', color: 'text-yellow-600', icon: 'AlertTriangle' };
  return { status: 'healthy', color: 'text-green-600', icon: 'CheckCircle' };
};

export const getNotificationIcon = (type: string) => {
  switch (type?.toLowerCase()) {
    case 'deployment': return 'Rocket';
    case 'project': return 'Database';
    case 'error': return 'AlertTriangle';
    default: return 'Activity';
  }
}; 