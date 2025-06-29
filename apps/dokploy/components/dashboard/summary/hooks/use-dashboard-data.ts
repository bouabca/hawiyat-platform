import { useMemo, useState, useEffect, useCallback } from "react";
import { api } from "@/utils/api";
import { CardKey, CARD_KEYS, MetricData, UserAction } from "../types";
import { Database, Rocket, Settings } from "lucide-react";

export const useDashboardData = () => {
  // API queries
  const { data: projects, isLoading: loadingProjects, refetch: refetchProjects } = api.project.all.useQuery();
  const { data: notifications, isLoading: loadingNotifications, refetch: refetchNotifications } = api.notification.all.useQuery();
  const { data: user } = api.user.get.useQuery();
  const { data: org } = api.organization.one.useQuery(
    { organizationId: user?.organizationId || "" }, 
    { enabled: !!user?.organizationId }
  );
  const { data: monitoring, isLoading: loadingMonitoring } = api.user.getMetricsToken.useQuery();

  // Local state
  const [activityFilter, setActivityFilter] = useState<string>("all");
  const [visibleCards, setVisibleCards] = useState<Record<CardKey, boolean>>({
    stats: true,
    quickActions: true,
    resourceUsage: true,
    trends: true,
    topDeployments: true,
    projects: true,
    recentActivity: true,
    userActions: true,
  });
  const [historicalData, setHistoricalData] = useState<any[]>([]);
  const [metrics, setMetrics] = useState<any>({});
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Computed values
  const deployments = useMemo(() => {
    if (!projects) return [];
    return projects.flatMap((p: any) => p.compose || []).flatMap((c: any) => c.deployments || []);
  }, [projects]);

  const totalProjects = projects?.length || 0;
  const totalDeployments = deployments?.length || 0;
  const runningDeployments = deployments?.filter((d: any) => d.status === "running").length || 0;
  const failedDeployments = deployments?.filter((d: any) => d.status === "failed").length || 0;

  const topDeployments = deployments?.slice(0, 5) || [];
  const mostActiveProjects = projects?.slice(0, 5) || [];

  const filteredNotifications = useMemo(() => {
    if (activityFilter === "all") return notifications;
    return notifications?.filter((n: any) => n.type === activityFilter || n.channel === activityFilter);
  }, [notifications, activityFilter]);

  const unreadCount = notifications?.filter((n: any) => !n.read)?.length || 0;

  // Metrics configuration
  const BASE_URL = useMemo(() => {
    if (process.env.NODE_ENV === "production" && monitoring?.serverIp && monitoring?.metricsConfig?.server?.port) {
      return `http://${monitoring.serverIp}:${monitoring.metricsConfig.server.port}/metrics`;
    }
    return "http://localhost:3001/metrics";
  }, [monitoring]);

  const TOKEN = useMemo(() => {
    if (process.env.NODE_ENV === "production" && monitoring?.metricsConfig?.server?.token) {
      return monitoring.metricsConfig.server.token;
    }
    return "metrics";
  }, [monitoring]);

  const {
    data: metricsData,
    isLoading: loadingMetrics,
    error: metricsError,
    refetch: refetchMetrics,
  } = api.server.getServerMetrics.useQuery(
    {
      url: BASE_URL,
      token: TOKEN,
      dataPoints: "50",
    },
    {
      enabled: !!BASE_URL && !!TOKEN,
      refetchInterval: 10000,
    }
  );

  // Effects
  useEffect(() => {
    const saved = sessionStorage.getItem('dashboardVisibleCards');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        const filtered: Record<CardKey, boolean> = CARD_KEYS.reduce((acc, key) => {
          acc[key] = parsed[key] ?? true;
          return acc;
        }, {} as Record<CardKey, boolean>);
        setVisibleCards(filtered);
      } catch {}
    }
  }, []);

  useEffect(() => {
    sessionStorage.setItem('dashboardVisibleCards', JSON.stringify(visibleCards));
  }, [visibleCards]);

  useEffect(() => {
    if (!metricsData) return;
    const formattedData = metricsData.map((metric: any) => ({
      ...metric,
      cpu: Number.parseFloat(metric.cpu),
      memUsed: Number.parseFloat(metric.memUsed),
      memUsedGB: Number.parseFloat(metric.memUsedGB),
      memTotal: Number.parseFloat(metric.memTotal),
      networkIn: Number.parseFloat(metric.networkIn),
      networkOut: Number.parseFloat(metric.networkOut),
      diskUsed: Number.parseFloat(metric.diskUsed),
      totalDisk: Number.parseFloat(metric.totalDisk),
    }));
    setHistoricalData(formattedData);
    setMetrics(formattedData[formattedData.length - 1] || {});
  }, [metricsData]);

  // Event handlers
  const markAllAsRead = useCallback(() => {
    // TODO: Implement mark all as read API call
    console.log("Mark all notifications as read");
  }, []);

  const handleToggleCard = useCallback((key: CardKey) => {
    setVisibleCards(prev => ({ ...prev, [key]: !prev[key] }));
  }, []);

  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    try {
      await Promise.all([
        refetchProjects(),
        refetchNotifications(),
        refetchMetrics(),
      ]);
    } finally {
      setIsRefreshing(false);
    }
  }, [refetchProjects, refetchNotifications, refetchMetrics]);

  // Mock data for trends and user actions
  const projectGrowth: MetricData[] = [
    { date: '2024-05-01', value: 2 },
    { date: '2024-05-10', value: 3 },
    { date: '2024-05-20', value: 4 },
    { date: '2024-06-01', value: totalProjects },
  ];

  const deploymentFrequency: MetricData[] = [
    { date: '2024-05-01', value: 1 },
    { date: '2024-05-10', value: 2 },
    { date: '2024-05-20', value: 3 },
    { date: '2024-06-01', value: totalDeployments },
  ];

  const cpuTrend: MetricData[] = [
    { date: '2024-05-01', value: 20 },
    { date: '2024-05-10', value: 40 },
    { date: '2024-05-20', value: 30 },
    { date: '2024-06-01', value: 50 },
  ];

  const userActions: UserAction[] = [
    { type: 'project', message: 'Created project "Alpha"', date: '2024-06-01 10:00', icon: Database },
    { type: 'deployment', message: 'Deployed stack "web-app"', date: '2024-06-01 11:00', icon: Rocket },
    { type: 'settings', message: 'Changed organization logo', date: '2024-06-01 12:00', icon: Settings },
  ];

  return {
    // Data
    projects,
    notifications,
    user,
    org,
    monitoring,
    deployments,
    topDeployments,
    mostActiveProjects,
    filteredNotifications,
    historicalData,
    metrics,
    userActions,
    
    // Computed values
    totalProjects,
    totalDeployments,
    runningDeployments,
    failedDeployments,
    unreadCount,
    projectGrowth,
    deploymentFrequency,
    cpuTrend,
    
    // Loading states
    loadingProjects,
    loadingNotifications,
    loadingMonitoring,
    loadingMetrics,
    isRefreshing,
    
    // Errors
    metricsError,
    
    // State
    activityFilter,
    visibleCards,
    
    // Event handlers
    setActivityFilter,
    markAllAsRead,
    handleToggleCard,
    handleRefresh,
  };
}; 