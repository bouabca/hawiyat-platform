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
  RefreshCw, Settings, Eye, EyeOff, Database, Rocket, 
  Activity, Bell, Plus, ArrowRight, 
  Cpu, HardDrive, Loader2, Users, UserPlus, BookOpen, Server
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
type CardKey = 'stats' | 'quickActions' | 'resourceUsage' | 'trends' | 'topDeployments' | 'projects' | 'recentActivity' | 'userActions' | 'hawiyatConfig';
const CARD_KEYS: CardKey[] = ['stats', 'quickActions', 'resourceUsage', 'trends', 'topDeployments', 'projects', 'recentActivity', 'userActions', 'hawiyatConfig'];

const CARD_CONFIG = {
  stats: { name: "Quick Stats", icon: "📊" },
  quickActions: { name: "Quick Actions", icon: "⚡" },
  resourceUsage: { name: "Resource Usage", icon: "📈" },
  trends: { name: "Trends & Analytics", icon: "📉" },
  topDeployments: { name: "Top Deployments", icon: "🚀" },
  projects: { name: "Projects", icon: "📁" },
  recentActivity: { name: "Recent Activity", icon: "🔔" },
  userActions: { name: "User Actions", icon: "👤" },
  hawiyatConfig: { name: "Hawiyat Client Config", icon: "🌐" },
} as const;

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
    stats: true, quickActions: true, resourceUsage: true, trends: true,
    topDeployments: true, projects: true, recentActivity: true, userActions: true,
    hawiyatConfig: true,
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
      await Promise.all([refetchProjects(), refetchNotifications(), refetchMetrics()]);
    } finally {
      setTimeout(() => setIsRefreshing(false), 1000);
    }
  }, [refetchProjects, refetchNotifications, refetchMetrics]);

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
    <div className="flex flex-col gap-6 p-6 w-full max-w-7xl mx-auto">
      {/* Welcome Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Welcome back, {user?.user?.name || 'User'}!</h1>
          <p className="text-muted-foreground">
            {org?.name ? `${org.name} • ` : ''}Dashboard Overview
          </p>
        </div>
        {unreadCount > 0 && (
          <Button variant="outline" size="sm" onClick={markAllAsRead}>
            <Bell className="w-4 h-4 mr-2" />
            Mark all as read ({unreadCount})
          </Button>
        )}
      </div>

      {/* Dashboard Controls */}
      <div className="flex items-center justify-between gap-4 p-4 bg-gradient-to-r from-muted/20 to-muted/10 rounded-xl border border-border/50 backdrop-blur-sm">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <Eye className="w-4 h-4 text-muted-foreground" />
            <span className="text-sm font-medium text-muted-foreground">View:</span>
          </div>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="h-8 px-3">
                <Settings className="w-3 h-3 mr-2" />
                Sections
                <Badge variant="secondary" className="ml-2 h-5 px-1.5 text-xs">
                  {visibleCount}/{CARD_KEYS.length}
                </Badge>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-64">
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
                  className="flex items-center gap-2"
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
                  className="w-full justify-start text-xs"
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
                <Badge key={key} variant="outline" className="h-5 px-1.5 text-xs">
                  {CARD_CONFIG[key].icon} {CARD_CONFIG[key].name}
                </Badge>
              ))}
              {visibleCount > 3 && (
                <Badge variant="outline" className="h-5 px-1.5 text-xs">
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
            className="h-8 px-3"
          >
            <RefreshCw className={`w-3 h-3 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
            {isRefreshing ? 'Refreshing...' : 'Refresh'}
          </Button>
        </div>
      </div>

      {/* Quick Stats */}
      {visibleCards.stats && (
        <div className="space-y-4 pb-10">
          {loadingMonitoring ? (
            <Card className="bg-sidebar p-2.5 rounded-xl mx-auto items-center">
              <div className="rounded-xl bg-background flex shadow-md px-4 min-h-[50vh] justify-center items-center text-muted-foreground">
                Loading...
                <Loader2 className="h-4 w-4 animate-spin ml-2" />
              </div>
            </Card>
          ) : (
            <>
              {monitoring?.enabledFeatures && (
                <div className="flex flex-row border w-fit p-4 rounded-lg items-center gap-2">
                  <span className="text-muted-foreground">Change Monitoring</span>
                  <Button
                    variant={toggleMonitoring ? "default" : "outline"}
                    size="sm"
                    onClick={() => setToggleMonitoring(!toggleMonitoring)}
                  >
                    {toggleMonitoring ? "Paid" : "Free"}
                  </Button>
                </div>
              )}
              {toggleMonitoring ? (
                <Card className="bg-sidebar p-2.5 rounded-xl mx-auto">
                  <div className="rounded-xl bg-background shadow-md">
                    <ShowPaidMonitoring
                      BASE_URL={
                        process.env.NODE_ENV === "production"
                          ? `http://${monitoring?.serverIp}:${monitoring?.metricsConfig?.server?.port}/metrics`
                          : BASE_URL
                      }
                      token={
                        process.env.NODE_ENV === "production"
                          ? monitoring?.metricsConfig?.server?.token
                          : TOKEN
                      }
                    />
                  </div>
                </Card>
              ) : (
                <Card className="h-full bg-sidebar p-2.5 rounded-xl">
                  <div className="rounded-xl bg-background shadow-md p-6">
                    <ContainerFreeMonitoring appName="dokploy" />
                  </div>
                </Card>
              )}
            </>
          )}
        </div>
      )}

      {/* Quick Actions */}
      {visibleCards.quickActions && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              ⚡ Quick Actions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
              <Button 
                variant="outline" 
                className="h-20 flex-col gap-2" 
                onClick={() => router.push('/dashboard/projects')}
              >
                <Database className="h-6 w-6" />
                <span className="text-sm">Projects</span>
              </Button>
              
              <Button 
                variant="outline" 
                className="h-20 flex-col gap-2" 
                onClick={() => router.push('/dashboard/projects/new')}
              >
                <Plus className="h-6 w-6" />
                <span className="text-sm">New Project</span>
              </Button>
              
              <Button 
                variant="outline" 
                className="h-20 flex-col gap-2" 
                onClick={() => router.push('/dashboard/compose')}
              >
                <Rocket className="h-6 w-6" />
                <span className="text-sm">Deploy Stack</span>
              </Button>
              
              <Button 
                variant="outline" 
                className="h-20 flex-col gap-2" 
                onClick={() => router.push('/dashboard/monitoring')}
              >
                <Activity className="h-6 w-6" />
                <span className="text-sm">Monitoring</span>
              </Button>
              
              <Button 
                variant="outline" 
                className="h-20 flex-col gap-2" 
                onClick={() => router.push('/dashboard/swarm')}
              >
                <Users className="h-6 w-6" />
                <span className="text-sm">Swarm</span>
              </Button>
              
              <Button 
                variant="outline" 
                className="h-20 flex-col gap-2" 
                onClick={() => router.push('/dashboard/settings')}
              >
                <Settings className="h-6 w-6" />
                <span className="text-sm">Settings</span>
              </Button>
              
              <Button 
                variant="outline" 
                className="h-20 flex-col gap-2" 
                onClick={() => router.push('/dashboard/settings/users')}
              >
                <UserPlus className="h-6 w-6" />
                <span className="text-sm">Add Users</span>
              </Button>
              
              <Button 
                variant="outline" 
                className="h-20 flex-col gap-2" 
                onClick={() => window.open('https://hawiyat.org/docs', '_blank')}
              >
                <BookOpen className="h-6 w-6" />
                <span className="text-sm">Documentation</span>
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Hawiyat Client Config */}
      {visibleCards.hawiyatConfig && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Server className="h-5 w-5" />
              Hawiyat Client Config
            </CardTitle>
          </CardHeader>
          <CardContent>
            <WebServer />
          </CardContent>
        </Card>
      )}

      {/* Resource Usage */}
      {visibleCards.resourceUsage && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              📈 Resource Usage
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loadingMetrics ? (
              <div className="flex items-center justify-center h-32">
                <RefreshCw className="h-6 w-6 animate-spin" />
                <span className="ml-2">Loading metrics...</span>
              </div>
            ) : metricsError ? (
              <div className="flex items-center justify-center h-32 text-muted-foreground">
                Failed to load metrics
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>CPU</span>
                    <span>{metrics.cpu?.toFixed(1) || 0}%</span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-2">
                    <div 
                      className="bg-blue-500 h-2 rounded-full transition-all" 
                      style={{ width: `${metrics.cpu || 0}%` }}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Memory</span>
                    <span>{getMemoryPercentage().toFixed(1)}%</span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-2">
                    <div 
                      className="bg-green-500 h-2 rounded-full transition-all" 
                      style={{ width: `${getMemoryPercentage()}%` }}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Disk</span>
                    <span>{getDiskPercentage().toFixed(1)}%</span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-2">
                    <div 
                      className="bg-orange-500 h-2 rounded-full transition-all" 
                      style={{ width: `${getDiskPercentage()}%` }}
                    />
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Top Deployments & Projects */}
      {visibleCards.topDeployments && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                🚀 Top Deployments
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {topDeployments.slice(0, 5).map((deployment: any, index: number) => (
                  <div key={deployment.composeId} className="flex items-center justify-between p-2 rounded-lg bg-muted/50">
                    <div className="flex items-center gap-3">
                      <Badge variant={deployment.status === 'running' ? 'default' : 'secondary'}>
                        {deployment.status}
                      </Badge>
                      <span className="font-medium">{deployment.name || `Deployment ${index + 1}`}</span>
                    </div>
                    <ArrowRight className="h-4 w-4 text-muted-foreground" />
                  </div>
                ))}
                {topDeployments.length === 0 && (
                  <p className="text-muted-foreground text-center py-4">No deployments found</p>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                📁 Most Active Projects
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {mostActiveProjects.slice(0, 5).map((project: any) => (
                  <div key={project.projectId} className="flex items-center justify-between p-2 rounded-lg bg-muted/50">
                    <div className="flex items-center gap-3">
                      <Database className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">{project.name}</span>
                    </div>
                    <ArrowRight className="h-4 w-4 text-muted-foreground" />
                  </div>
                ))}
                {mostActiveProjects.length === 0 && (
                  <p className="text-muted-foreground text-center py-4">No projects found</p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Recent Activity */}
      {visibleCards.recentActivity && (
        <Card>
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
                  <RefreshCw className="h-6 w-6 animate-spin" />
                  <span className="ml-2">Loading notifications...</span>
                </div>
              ) : filteredNotifications.length > 0 ? (
                filteredNotifications.slice(0, 10).map((notification: any) => (
                  <div 
                    key={notification.notificationId} 
                    className="flex items-center justify-between p-3 rounded-lg border cursor-pointer hover:bg-muted/50 transition-colors"
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

      {/* User Actions */}
      {visibleCards.userActions && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              👤 Recent User Actions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {[
                { type: 'project', message: 'Created project "Alpha"', date: '2024-06-01 10:00', icon: Database },
                { type: 'deployment', message: 'Deployed stack "web-app"', date: '2024-06-01 11:00', icon: Rocket },
                { type: 'settings', message: 'Changed organization logo', date: '2024-06-01 12:00', icon: Settings },
              ].map((action, index) => (
                <div key={index} className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                  <action.icon className="h-4 w-4 text-muted-foreground" />
                  <div className="flex-1">
                    <p className="font-medium">{action.message}</p>
                    <p className="text-sm text-muted-foreground">{action.date}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}; 