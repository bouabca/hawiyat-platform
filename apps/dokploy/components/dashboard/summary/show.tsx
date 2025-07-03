import { useRouter } from "next/router";
import { useMemo, useState, useEffect, useCallback } from "react";
import { api } from "@/utils/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Folder,
  Plus,
  Rocket,
  Activity,
  Users,
  Settings,
  Bell,
  BookOpen,
  Eye,
  EyeOff,
  ArrowRight,
  Loader2,
  UserPlus
} from "lucide-react";

import { ContainerFreeMonitoring } from "@/components/dashboard/monitoring/free/container/show-free-container-monitoring";
import { ShowPaidMonitoring } from "@/components/dashboard/monitoring/paid/servers/show-paid-monitoring";
import { WebServer } from "@/components/dashboard/settings/web-server";
import { useLocalStorage } from "@/hooks/useLocalStorage";
import { IS_CLOUD } from "@dokploy/server/constants";
import { validateRequest } from "@dokploy/server/lib/auth";
import type { GetServerSidePropsContext } from "next";
import type { ReactElement } from "react";

const BASE_URL = "http://localhost:3001/metrics";

const DEFAULT_TOKEN = "metrics";

// Types
const CARD_CONFIG = {
  stats: { name: "Quick Stats", icon: "📊" },
  quickActions: { name: "Quick Actions", icon: "⚡" },
  topDeployments: { name: "Top Deployments", icon: "🚀" },
  projects: { name: "Projects", icon: "📁" },
  recentActivity: { name: "Recent Activity", icon: "🔔" },
  userActions: { name: "User Actions", icon: "👤" },
} as const;

type CardKey = keyof typeof CARD_CONFIG;
const CARD_KEYS = Object.keys(CARD_CONFIG) as CardKey[];

// Modern Circular Progress Bar
function StatCircle({ value, label, color }: { value: number; label: string; color: string }) {
  const radius = 40;
  const stroke = 7;
  const normalizedRadius = radius - stroke / 2;
  const circumference = normalizedRadius * 2 * Math.PI;
  const percent = Math.min(Math.max(value, 0), 100);
  const strokeDashoffset = circumference - (percent / 100) * circumference;
  return (
    <div className="flex flex-col items-center">
      <svg height={radius * 2} width={radius * 2}>
        <circle
          stroke="#e5e7eb"
          fill="transparent"
          strokeWidth={stroke}
          r={normalizedRadius}
          cx={radius}
          cy={radius}
        />
        <circle
          stroke={color}
          fill="transparent"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circumference + ' ' + circumference}
          style={{ strokeDashoffset, transition: 'stroke-dashoffset 0.5s' }}
          r={normalizedRadius}
          cx={radius}
          cy={radius}
        />
        <text
          x="50%"
          y="50%"
          textAnchor="middle"
          dy="0.3em"
          fontSize="1.1em"
          fontWeight="bold"
          fill="#222"
        >
          {percent}%
        </text>
      </svg>
      <span className="mt-2 text-xs font-medium text-gray-700">{label}</span>
    </div>
  );
}

// System stats hook
function useSystemStats() {
  const [stats, setStats] = useState<{ cpu: number; memory: number; disk: number } | null>(null);
  useEffect(() => {
    let mounted = true;
    async function fetchStats() {
      try {
        const res = await fetch("/api/stats");
        const data = await res.json();
        if (mounted) setStats(data);
      } catch {}
    }
    fetchStats();
    const interval = setInterval(fetchStats, 5000);
    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, []);
  return stats;
}

export const Summary = () => {
  const router = useRouter();
  
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
    stats: true, quickActions: true, topDeployments: true, projects: true, recentActivity: true, userActions: true
  });
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [toggleMonitoring, setToggleMonitoring] = useLocalStorage("toggleMonitoring", false);

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
  const unreadCount = notifications?.filter((n: any) => !n.read)?.length || 0;

  const filteredNotifications = useMemo(() => {
    if (activityFilter === "all") return notifications || [];
    return (notifications || []).filter((n: any) => n.type === activityFilter || n.channel === activityFilter);
  }, [notifications, activityFilter]);

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

  const { data: metricsData, isLoading: loadingMetrics, error: metricsError, refetch: refetchMetrics } = 
    api.server.getServerMetrics.useQuery(
      { url: BASE_URL, token: TOKEN, dataPoints: "50" },
      { enabled: !!BASE_URL && !!TOKEN, refetchInterval: 10000 }
    );

  const metrics = useMemo(() => {
    if (!metricsData?.length) return {};
    const latest = metricsData[metricsData.length - 1];
    if (!latest) return {};
    
    return {
      cpu: Number.parseFloat(latest.cpu || "0"),
      memUsed: Number.parseFloat(latest.memUsed || "0"),
      memTotal: Number.parseFloat(latest.memTotal || "0"),
      diskUsed: Number.parseFloat(latest.diskUsed || "0"),
      totalDisk: Number.parseFloat(latest.totalDisk || "0"),
    };
  }, [metricsData]);

  const stats = useSystemStats();

  // For services: gather all services from all projects
  const services = useMemo(() => {
    if (!projects) return [];
    return projects.flatMap((p: any) => (p.compose || []).flatMap((c: any) => c.services || []));
  }, [projects]);

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

  // Event handlers
  const markAllAsRead = useCallback(() => {
    console.log("Mark all notifications as read");
  }, []);

  const handleToggleCard = useCallback((key: CardKey) => {
    setVisibleCards(prev => ({ ...prev, [key]: !prev[key] }));
  }, []);

  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    try {
      await Promise.all([refetchProjects(), refetchNotifications()]);
    } finally {
      setTimeout(() => setIsRefreshing(false), 1000);
    }
  }, [refetchProjects, refetchNotifications]);

  const handleNotificationClick = useCallback((notification: any) => {
    if (notification.projectId) {
      router.push(`/dashboard/projects/${notification.projectId}`);
    } else if (notification.deploymentId) {
      router.push(`/dashboard/compose/${notification.deploymentId}`);
    }
  }, [router]);

  const visibleCount = Object.values(visibleCards).filter(Boolean).length;

  // Helper functions for safe calculations
  const getMemoryPercentage = () => {
    if (!metrics.memUsed || !metrics.memTotal || metrics.memTotal === 0) return 0;
    return (metrics.memUsed / metrics.memTotal) * 100;
  };

  const getDiskPercentage = () => {
    if (!metrics.diskUsed || !metrics.totalDisk || metrics.totalDisk === 0) return 0;
    return (metrics.diskUsed / metrics.totalDisk) * 100;
  };

  const getMemoryGB = (value: number) => {
    return (value / 1024).toFixed(1);
  };

  return (
    <div className="flex flex-col gap-8 p-8 w-full max-w-5xl mx-auto">
      {/* System Stats Card - Modern UI */}
      <Card
        className="rounded-xl border bg-white shadow-sm hover:shadow-md transition cursor-pointer"
        onClick={() => router.push('/dashboard/monitoring')}
        tabIndex={0}
        role="button"
        aria-label="Go to Monitoring"
      >
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base font-semibold text-gray-900">
            <span className="inline-block w-2 h-2 rounded-full bg-blue-500 mr-2" />
            System Stats
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-row justify-center gap-10 py-4">
            <StatCircle value={stats?.cpu ?? 0} label="CPU" color="#2563eb" />
            <StatCircle value={stats?.memory ?? 0} label="Memory" color="#22c55e" />
            <StatCircle value={stats?.disk ?? 0} label="Disk" color="#f59e42" />
          </div>
        </CardContent>
      </Card>
      {/* Welcome Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-gray-900 mb-1">Welcome back, {user?.user?.name || 'User'}!</h1>
          <p className="text-gray-500 text-base">
            {org?.name ? `${org.name} • ` : ''}Dashboard Overview
          </p>
        </div>
        {unreadCount > 0 && (
          <Button variant="outline" size="sm" onClick={markAllAsRead} className="shadow-md">
            <Bell className="w-4 h-4 mr-2" />
            Mark all as read ({unreadCount})
          </Button>
        )}
      </div>

      {/* Dashboard Controls */}
      <div className="flex items-center justify-between gap-4 p-4 bg-gradient-to-r from-muted/30 to-muted/10 rounded-2xl border border-border/50 backdrop-blur-md shadow-sm">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <Eye className="w-4 h-4 text-muted-foreground" />
            <span className="text-sm font-medium text-muted-foreground">View:</span>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="h-8 px-3 rounded-lg">
                <Settings className="w-3 h-3 mr-2" />
                Sections
                <Badge variant="secondary" className="ml-2 h-5 px-1.5 text-xs">
                  {visibleCount}/{CARD_KEYS.length}
                </Badge>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-64 rounded-xl shadow-lg">
              <DropdownMenuLabel className="flex items-center gap-2">
                <Eye className="w-4 h-4" />
                Dashboard Sections
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              {CARD_KEYS.map((key) => (
                <DropdownMenuCheckboxItem
                  key={key}
                  checked={visibleCards[key]}
                  onCheckedChange={() => handleToggleCard(key)}
                  className="flex items-center gap-2 rounded hover:bg-muted/30 transition-colors"
                >
                  <span className="text-base">{CARD_CONFIG[key].icon}</span>
                  <span className="flex-1">{CARD_CONFIG[key].name}</span>
                  {visibleCards[key] ? (
                    <Eye className="w-3 h-3 text-green-600" />
                  ) : (
                    <EyeOff className="w-3 h-3 text-muted-foreground" />
                  )}
                </DropdownMenuCheckboxItem>
              ))}
              <DropdownMenuSeparator />
              <div className="px-2 py-1.5">
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full justify-start text-xs rounded"
                  onClick={() => {
                    const allVisible = Object.values(visibleCards).every(Boolean);
                    CARD_KEYS.forEach(key => {
                      if (allVisible) {
                        handleToggleCard(key);
                      } else if (!visibleCards[key]) {
                        handleToggleCard(key);
                      }
                    });
                  }}
                >
                  {Object.values(visibleCards).every(Boolean) ? "Hide All" : "Show All"}
                </Button>
              </div>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5">
            <span className="text-xs text-muted-foreground">Active:</span>
            <div className="flex items-center gap-1">
              {CARD_KEYS.filter(key => visibleCards[key]).slice(0, 3).map(key => (
                <Badge key={key} variant="outline" className="h-5 px-1.5 text-xs rounded shadow-sm">
                  {CARD_CONFIG[key].icon} {CARD_CONFIG[key].name}
                </Badge>
              ))}
              {visibleCount > 3 && (
                <Badge variant="outline" className="h-5 px-1.5 text-xs rounded shadow-sm">
                  +{visibleCount - 3} more
                </Badge>
              )}
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="h-8 px-3 rounded-lg shadow"
          >
            <Loader2 className={`w-3 h-3 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
            {isRefreshing ? 'Refreshing...' : 'Refresh'}
          </Button>
        </div>
      </div>

      {/* Quick Stats */}
      {visibleCards.stats && (
        <Card className="rounded-xl border bg-white shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              📊 Quick Stats
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-8 justify-center">
              <div className="flex flex-col items-center">
                <Folder className="h-8 w-8 text-blue-500 mb-1 drop-shadow" />
                <span className="font-extrabold text-2xl">{totalProjects}</span>
                <span className="text-xs text-gray-500">Projects</span>
              </div>
              <div className="flex flex-col items-center">
                <Rocket className="h-8 w-8 text-green-500 mb-1 drop-shadow" />
                <span className="font-extrabold text-2xl">{totalDeployments}</span>
                <span className="text-xs text-gray-500">Deployments</span>
              </div>
              <div className="flex flex-col items-center">
                <Rocket className="h-8 w-8 text-yellow-500 mb-1 drop-shadow" />
                <span className="font-extrabold text-2xl">{runningDeployments}</span>
                <span className="text-xs text-gray-500">Running</span>
              </div>
              <div className="flex flex-col items-center">
                <Rocket className="h-8 w-8 text-red-500 mb-1 drop-shadow" />
                <span className="font-extrabold text-2xl">{failedDeployments}</span>
                <span className="text-xs text-gray-500">Failed</span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Quick Actions */}
      {visibleCards.quickActions && (
        <Card className="rounded-2xl shadow-lg border-0 bg-gradient-to-br from-white via-gray-50 to-gray-100 dark:from-[#111] dark:via-[#18181b] dark:to-[#232326]">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              ⚡ Quick Actions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
              <Button
                variant="outline"
                className="h-20 flex-col gap-2 rounded-xl shadow hover:scale-105 transition-transform"
                onClick={() => router.push('/dashboard/projects')}
              >
                <Folder className="h-6 w-6" />
                <span className="text-sm">Projects</span>
              </Button>
              <Button
                variant="outline"
                className="h-20 flex-col gap-2 rounded-xl shadow hover:scale-105 transition-transform"
                onClick={() => router.push('/dashboard/projects/new')}
              >
                <Plus className="h-6 w-6" />
                <span className="text-sm">New Project</span>
              </Button>
              <Button
                variant="outline"
                className="h-20 flex-col gap-2 rounded-xl shadow hover:scale-105 transition-transform"
                onClick={() => router.push('/dashboard/compose')}
              >
                <Rocket className="h-6 w-6" />
                <span className="text-sm">Deploy Stack</span>
              </Button>
              <Button
                variant="outline"
                className="h-20 flex-col gap-2 rounded-xl shadow hover:scale-105 transition-transform"
                onClick={() => router.push('/dashboard/monitoring')}
              >
                <Activity className="h-6 w-6" />
                <span className="text-sm">Monitoring</span>
              </Button>
              <Button
                variant="outline"
                className="h-20 flex-col gap-2 rounded-xl shadow hover:scale-105 transition-transform"
                onClick={() => router.push('/dashboard/swarm')}
              >
                <Users className="h-6 w-6" />
                <span className="text-sm">Swarm</span>
              </Button>
              <Button
                variant="outline"
                className="h-20 flex-col gap-2 rounded-xl shadow hover:scale-105 transition-transform"
                onClick={() => router.push('/dashboard/settings')}
              >
                <Settings className="h-6 w-6" />
                <span className="text-sm">Settings</span>
              </Button>
              <Button
                variant="outline"
                className="h-20 flex-col gap-2 rounded-xl shadow hover:scale-105 transition-transform"
                onClick={() => router.push('/dashboard/settings/users')}
              >
                <UserPlus className="h-6 w-6" />
                <span className="text-sm">Add Users</span>
              </Button>
              <Button
                variant="outline"
                className="h-20 flex-col gap-2 rounded-xl shadow hover:scale-105 transition-transform"
                onClick={() => window.open('https://hawiyat.org/docs', '_blank')}
              >
                <BookOpen className="h-6 w-6" />
                <span className="text-sm">Documentation</span>
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Top Services & Projects */}
      {visibleCards.topDeployments && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Services Card */}
          <Card className="rounded-xl border bg-white shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                🛠️ Top Services
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {services.slice(0, 5).map((service: any, index: number) => (
                  <div
                    key={service.serviceId || index}
                    className="flex items-center justify-between p-2 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors cursor-pointer"
                    onClick={() => service.serviceId && router.push(`/dashboard/services/${service.serviceId}`)}
                  >
                    <Badge variant="outline">{service.status || 'active'}</Badge>
                    <span className="font-medium">{service.name || `Service ${index + 1}`}</span>
                    <ArrowRight className="h-4 w-4 text-gray-400" />
                  </div>
                ))}
                {services.length === 0 && (
                  <p className="text-gray-400 text-center py-4">No services found</p>
                )}
              </div>
            </CardContent>
          </Card>
          {/* Projects Card */}
          <Card className="rounded-xl border bg-white shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                📁 Most Active Projects
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {mostActiveProjects.slice(0, 5).map((project: any) => (
                  <div
                    key={project.projectId}
                    className="flex items-center justify-between p-2 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors cursor-pointer"
                    onClick={() => router.push(`/dashboard/projects/${project.projectId}`)}
                  >
                    <Folder className="h-4 w-4 text-gray-400" />
                    <span className="font-medium">{project.name}</span>
                    <ArrowRight className="h-4 w-4 text-gray-400" />
                  </div>
                ))}
                {mostActiveProjects.length === 0 && (
                  <p className="text-gray-400 text-center py-4">No projects found</p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Recent Activity */}
      {visibleCards.recentActivity && (
        <Card className="rounded-2xl shadow-lg border-0 bg-gradient-to-br from-white via-gray-50 to-gray-100 dark:from-[#111] dark:via-[#18181b] dark:to-[#232326]">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                🔔 Recent Activity
              </CardTitle>
              <Select value={activityFilter} onValueChange={setActivityFilter}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="slack">Slack</SelectItem>
                  <SelectItem value="email">Email</SelectItem>
                  <SelectItem value="telegram">Telegram</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {loadingNotifications ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin" />
                  <span className="ml-2">Loading notifications...</span>
                </div>
              ) : filteredNotifications.length > 0 ? (
                filteredNotifications.slice(0, 10).map((notification: any) => (
                  <div
                    key={notification.notificationId}
                    className="flex items-center justify-between p-3 rounded-lg border cursor-pointer hover:bg-muted/30 transition-colors shadow-sm"
                    onClick={() => handleNotificationClick(notification)}
                  >
                    <div className="flex items-center gap-3">
                      <Bell className={`h-4 w-4 ${notification.read ? 'text-muted-foreground' : 'text-blue-500'}`} />
                      <div>
                        <p className="font-medium">{notification.name || 'Notification'}</p>
                        <p className="text-sm text-muted-foreground">
                          {new Date(notification.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <Badge variant="outline">{notification.notificationType}</Badge>
                  </div>
                ))
              ) : (
                <p className="text-muted-foreground text-center py-8">No notifications found</p>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}