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
  UserPlus,
  Server
} from "lucide-react";

import type { ReactElement } from "react";

// Types
const CARD_CONFIG = {
  stats: { name: "System Stats", icon: "📊" },
  quickActions: { name: "Quick Actions", icon: "⚡" },
  topServices: { name: "Top Services", icon: "🛠️" },
  projects: { name: "Projects", icon: "📁" },
  recentActivity: { name: "Recent Activity", icon: "🔔" },
  userActions: { name: "User Actions", icon: "👤" },
} as const;

type CardKey = keyof typeof CARD_CONFIG;
const CARD_KEYS = Object.keys(CARD_CONFIG) as CardKey[];

// Modern Elegant Stats Display
function StatCard({ icon: Icon, value, label, trend, color = "primary" }: { 
  icon: any; 
  value: string | number; 
  label: string; 
  trend?: string;
  color?: "primary" | "success" | "warning" | "danger";
}) {
  const colorClasses = {
    primary: "text-primary bg-primary/10 border-primary/20",
    success: "text-green-600 bg-green-50 border-green-200 dark:bg-green-950 dark:border-green-800",
    warning: "text-yellow-600 bg-yellow-50 border-yellow-200 dark:bg-yellow-950 dark:border-yellow-800",
    danger: "text-red-600 bg-red-50 border-red-200 dark:bg-red-950 dark:border-red-800"
  };

  return (
    <div className="group relative overflow-hidden rounded-2xl border bg-card/50 backdrop-blur-sm transition-all duration-300 hover:shadow-lg hover:scale-[1.02] hover:border-primary/30">
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-primary/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      <div className="relative p-6">
        <div className="flex items-center justify-between mb-4">
          <div className={`p-3 rounded-xl ${colorClasses[color]} transition-colors duration-300`}>
            <Icon className="h-6 w-6" />
          </div>
          {trend && (
            <span className="text-xs font-medium text-muted-foreground bg-muted/50 px-2 py-1 rounded-full">
              {trend}
            </span>
          )}
        </div>
        <div className="space-y-1">
          <div className="text-3xl font-bold text-foreground">{value}</div>
          <div className="text-sm text-muted-foreground font-medium">{label}</div>
        </div>
      </div>
    </div>
  );
}

// Modern Circular Progress Bar
function StatCircle({ value, label }: { value: number; label: string }) {
  const radius = 45;
  const stroke = 8;
  const normalizedRadius = radius - stroke / 2;
  const circumference = normalizedRadius * 2 * Math.PI;
  const percent = Math.min(Math.max(value, 0), 100);
  const strokeDashoffset = circumference - (percent / 100) * circumference;
  
  const getColor = (label: string) => {
    switch (label.toLowerCase()) {
      case 'cpu':
        return 'hsl(var(--primary))';
      case 'memory':
        return 'hsl(var(--chart-1))';
      case 'disk':
        return 'hsl(var(--chart-2))';
      default:
        return 'hsl(var(--primary))';
    }
  };
  
  return (
    <div className="group relative flex flex-col items-center p-6 rounded-2xl border bg-card/50 backdrop-blur-sm transition-all duration-300 hover:shadow-lg hover:scale-105">
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-primary/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-2xl" />
      <div className="relative">
        <svg height={radius * 2} width={radius * 2} className="drop-shadow-sm">
          <circle
            stroke="hsl(var(--muted))"
            fill="transparent"
            strokeWidth={stroke}
            r={normalizedRadius}
            cx={radius}
            cy={radius}
            className="opacity-30"
          />
          <circle
            stroke={getColor(label)}
            fill="transparent"
            strokeWidth={stroke}
            strokeLinecap="round"
            strokeDasharray={circumference + ' ' + circumference}
            style={{ strokeDashoffset, transition: 'stroke-dashoffset 0.8s ease-out' }}
            r={normalizedRadius}
            cx={radius}
            cy={radius}
            className="drop-shadow-sm"
          />
          <text
            x="50%"
            y="50%"
            textAnchor="middle"
            dy="0.3em"
            fontSize="1.2em"
            fontWeight="bold"
            fill="hsl(var(--foreground))"
            className="font-bold"
          >
            {percent}%
          </text>
        </svg>
        <div className="mt-4 text-center">
          <span className="text-sm font-semibold text-foreground">{label}</span>
          <div className="text-xs text-muted-foreground mt-1">Usage</div>
        </div>
      </div>
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
  // Local state
  const [activityFilter, setActivityFilter] = useState<string>("all");
  const [visibleCards, setVisibleCards] = useState<Record<CardKey, boolean>>({
    stats: true, quickActions: true, topServices: true, projects: true, recentActivity: true, userActions: true
  });
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Computed values - Replace deployments with services
  const services = useMemo(() => {
    if (!projects) return [];
    return projects.flatMap((p: any) => (p.compose || []).flatMap((c: any) => c.services || []));
  }, [projects]);

  const totalProjects = projects?.length || 0;
  const totalServices = services?.length || 0;
  const runningServices = services?.filter((s: any) => s.status === "running").length || 0;
  const failedServices = services?.filter((s: any) => s.status === "failed").length || 0;
  const topServices = services?.slice(0, 5) || [];
  const mostActiveProjects = projects?.slice(0, 5) || [];
  const unreadCount = notifications?.filter((n: any) => !n.read)?.length || 0;

  const filteredNotifications = useMemo(() => {
    if (activityFilter === "all") return notifications || [];
    return (notifications || []).filter((n: any) => n.type === activityFilter || n.channel === activityFilter);
  }, [notifications, activityFilter]);

  const stats = useSystemStats();

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



  return (
    <div className="flex flex-col gap-8 p-8 w-full max-w-7xl mx-auto">
      {/* Welcome Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h1 className="text-4xl font-bold tracking-tight text-foreground bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
            Welcome back, {user?.user?.name || 'User'}!
          </h1>
          <p className="text-muted-foreground text-lg">
            {org?.name ? `${org.name} • ` : ''}Dashboard Overview
          </p>
        </div>
        {unreadCount > 0 && (
          <Button variant="outline" size="sm" onClick={markAllAsRead} className="shadow-lg hover:shadow-xl transition-shadow">
            <Bell className="w-4 h-4 mr-2" />
            Mark all as read ({unreadCount})
          </Button>
        )}
      </div>

      {/* Dashboard Controls */}
      <div className="flex items-center justify-between gap-4 p-6 bg-gradient-to-r from-card/80 via-card/60 to-card/80 rounded-3xl border border-border/50 backdrop-blur-xl shadow-lg">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-primary/10">
              <Eye className="w-5 h-5 text-primary" />
            </div>
            <span className="text-sm font-semibold text-foreground">Dashboard Sections</span>
          </div>
          <div className="relative">
            <Button variant="outline" size="sm" className="h-10 px-4 rounded-xl shadow-md hover:shadow-lg transition-all">
              <Settings className="w-4 h-4 mr-2" />
              Configure
              <Badge variant="secondary" className="ml-2 h-6 px-2 text-xs">
                {visibleCount}/{CARD_KEYS.length}
              </Badge>
            </Button>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-muted-foreground">Active:</span>
            <div className="flex items-center gap-2">
              {CARD_KEYS.filter(key => visibleCards[key]).slice(0, 3).map(key => (
                <Badge key={key} variant="outline" className="h-6 px-3 text-xs rounded-full shadow-sm border-primary/20">
                  {CARD_CONFIG[key].icon} {CARD_CONFIG[key].name}
                </Badge>
              ))}
              {visibleCount > 3 && (
                <Badge variant="outline" className="h-6 px-3 text-xs rounded-full shadow-sm">
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
            className="h-10 px-4 rounded-xl shadow-md hover:shadow-lg transition-all"
          >
            <Loader2 className={`w-4 h-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
            {isRefreshing ? 'Refreshing...' : 'Refresh'}
          </Button>
        </div>
      </div>

      {/* System Stats & Quick Stats */}
      {visibleCards.stats && (
        <div className="space-y-8">
          {/* System Stats */}
          <div className="group relative overflow-hidden rounded-3xl border bg-gradient-to-br from-card/80 via-card/60 to-card/80 backdrop-blur-xl shadow-lg hover:shadow-xl transition-all duration-300 cursor-pointer" onClick={() => router.push('/dashboard/monitoring')}>
            <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-primary/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            <div className="relative p-8">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-3 rounded-2xl bg-primary/10">
                  <Activity className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-foreground">System Performance</h3>
                  <p className="text-muted-foreground">Real-time system metrics</p>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <StatCircle value={stats?.cpu ?? 0} label="CPU" />
                <StatCircle value={stats?.memory ?? 0} label="Memory" />
                <StatCircle value={stats?.disk ?? 0} label="Disk" />
              </div>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <StatCard 
              icon={Folder} 
              value={totalProjects} 
              label="Total Projects" 
              color="primary"
            />
            <StatCard 
              icon={Server} 
              value={totalServices} 
              label="Active Services" 
              color="success"
            />
            <StatCard 
              icon={Rocket} 
              value={runningServices} 
              label="Running Services" 
              color="success"
            />
            <StatCard 
              icon={Rocket} 
              value={failedServices} 
              label="Failed Services" 
              color="danger"
            />
          </div>
        </div>
      )}

      {/* Quick Actions */}
      {visibleCards.quickActions && (
        <div className="group relative overflow-hidden rounded-3xl border bg-gradient-to-br from-card/80 via-card/60 to-card/80 backdrop-blur-xl shadow-lg">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-primary/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          <div className="relative p-8">
            <div className="flex items-center gap-3 mb-8">
              <div className="p-3 rounded-2xl bg-primary/10">
                <Rocket className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-foreground">Quick Actions</h3>
                <p className="text-muted-foreground">Access your most used features</p>
              </div>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-4">
              <Button
                variant="outline"
                className="h-24 flex-col gap-3 rounded-2xl shadow-md hover:shadow-lg hover:scale-105 transition-all duration-300 border-border/50 hover:border-primary/30"
                onClick={() => router.push('/dashboard/projects')}
              >
                <div className="p-2 rounded-xl bg-primary/10">
                  <Folder className="h-5 w-5 text-primary" />
                </div>
                <span className="text-xs font-medium">Projects</span>
              </Button>
              <Button
                variant="outline"
                className="h-24 flex-col gap-3 rounded-2xl shadow-md hover:shadow-lg hover:scale-105 transition-all duration-300 border-border/50 hover:border-primary/30"
                onClick={() => router.push('/dashboard/projects')}
              >
                <div className="p-2 rounded-xl bg-green-500/10">
                  <Plus className="h-5 w-5 text-green-500" />
                </div>
                <span className="text-xs font-medium">New Project</span>
              </Button>
              <Button
                variant="outline"
                className="h-24 flex-col gap-3 rounded-2xl shadow-md hover:shadow-lg hover:scale-105 transition-all duration-300 border-border/50 hover:border-primary/30"
                onClick={() => router.push('/dashboard/compose')}
              >
                <div className="p-2 rounded-xl bg-blue-500/10">
                  <Rocket className="h-5 w-5 text-blue-500" />
                </div>
                <span className="text-xs font-medium">Deploy Stack</span>
              </Button>
              <Button
                variant="outline"
                className="h-24 flex-col gap-3 rounded-2xl shadow-md hover:shadow-lg hover:scale-105 transition-all duration-300 border-border/50 hover:border-primary/30"
                onClick={() => router.push('/dashboard/monitoring')}
              >
                <div className="p-2 rounded-xl bg-purple-500/10">
                  <Activity className="h-5 w-5 text-purple-500" />
                </div>
                <span className="text-xs font-medium">Monitoring</span>
              </Button>
              <Button
                variant="outline"
                className="h-24 flex-col gap-3 rounded-2xl shadow-md hover:shadow-lg hover:scale-105 transition-all duration-300 border-border/50 hover:border-primary/30"
                onClick={() => router.push('/dashboard/swarm')}
              >
                <div className="p-2 rounded-xl bg-orange-500/10">
                  <Users className="h-5 w-5 text-orange-500" />
                </div>
                <span className="text-xs font-medium">Swarm</span>
              </Button>
              <Button
                variant="outline"
                className="h-24 flex-col gap-3 rounded-2xl shadow-md hover:shadow-lg hover:scale-105 transition-all duration-300 border-border/50 hover:border-primary/30"
                onClick={() => router.push('/dashboard/settings')}
              >
                <div className="p-2 rounded-xl bg-gray-500/10">
                  <Settings className="h-5 w-5 text-gray-500" />
                </div>
                <span className="text-xs font-medium">Settings</span>
              </Button>
              <Button
                variant="outline"
                className="h-24 flex-col gap-3 rounded-2xl shadow-md hover:shadow-lg hover:scale-105 transition-all duration-300 border-border/50 hover:border-primary/30"
                onClick={() => router.push('/dashboard/settings/users')}
              >
                <div className="p-2 rounded-xl bg-indigo-500/10">
                  <UserPlus className="h-5 w-5 text-indigo-500" />
                </div>
                <span className="text-xs font-medium">Add Users</span>
              </Button>
              <Button
                variant="outline"
                className="h-24 flex-col gap-3 rounded-2xl shadow-md hover:shadow-lg hover:scale-105 transition-all duration-300 border-border/50 hover:border-primary/30"
                onClick={() => window.open('https://hawiyat.org/docs', '_blank')}
              >
                <div className="p-2 rounded-xl bg-teal-500/10">
                  <BookOpen className="h-5 w-5 text-teal-500" />
                </div>
                <span className="text-xs font-medium">Documentation</span>
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Top Services & Projects */}
      {visibleCards.topServices && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Services Card */}
          <div className="group relative overflow-hidden rounded-3xl border bg-gradient-to-br from-card/80 via-card/60 to-card/80 backdrop-blur-xl shadow-lg">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-primary/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            <div className="relative p-8">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-3 rounded-2xl bg-primary/10">
                  <Server className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-foreground">Top Services</h3>
                  <p className="text-muted-foreground">Most active services</p>
                </div>
              </div>
              <div className="space-y-3">
                {topServices.slice(0, 5).map((service: any, index: number) => (
                  <div
                    key={service.serviceId || index}
                    className="group/item flex items-center justify-between p-4 rounded-2xl bg-muted/20 hover:bg-muted/40 transition-all duration-300 cursor-pointer border border-transparent hover:border-primary/20"
                    onClick={() => service.serviceId && router.push(`/dashboard/services/${service.serviceId}`)}
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-xl bg-primary/10">
                        <Server className="h-4 w-4 text-primary" />
                      </div>
                      <div>
                        <span className="font-semibold text-foreground">{service.name || `Service ${index + 1}`}</span>
                        <div className="text-xs text-muted-foreground">Service ID: {service.serviceId || 'N/A'}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-xs">
                        {service.status || 'active'}
                      </Badge>
                      <ArrowRight className="h-4 w-4 text-muted-foreground group-hover/item:text-primary transition-colors" />
                    </div>
                  </div>
                ))}
                {topServices.length === 0 && (
                  <div className="text-center py-8">
                    <Server className="h-12 w-12 text-muted-foreground/50 mx-auto mb-3" />
                    <p className="text-muted-foreground">No services found</p>
                  </div>
                )}
              </div>
            </div>
          </div>
          
          {/* Projects Card */}
          <div className="group relative overflow-hidden rounded-3xl border bg-gradient-to-br from-card/80 via-card/60 to-card/80 backdrop-blur-xl shadow-lg">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-primary/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            <div className="relative p-8">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-3 rounded-2xl bg-primary/10">
                  <Folder className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-foreground">Most Active Projects</h3>
                  <p className="text-muted-foreground">Your top projects</p>
                </div>
              </div>
              <div className="space-y-3">
                {mostActiveProjects.slice(0, 5).map((project: any) => (
                  <div
                    key={project.projectId}
                    className="group/item flex items-center justify-between p-4 rounded-2xl bg-muted/20 hover:bg-muted/40 transition-all duration-300 cursor-pointer border border-transparent hover:border-primary/20"
                    onClick={() => router.push(`/dashboard/project/${project.projectId}`)}
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-xl bg-primary/10">
                        <Folder className="h-4 w-4 text-primary" />
                      </div>
                      <div>
                        <span className="font-semibold text-foreground">{project.name}</span>
                        <div className="text-xs text-muted-foreground">Project ID: {project.projectId}</div>
                      </div>
                    </div>
                    <ArrowRight className="h-4 w-4 text-muted-foreground group-hover/item:text-primary transition-colors" />
                  </div>
                ))}
                {mostActiveProjects.length === 0 && (
                  <div className="text-center py-8">
                    <Folder className="h-12 w-12 text-muted-foreground/50 mx-auto mb-3" />
                    <p className="text-muted-foreground">No projects found</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Recent Activity */}
      {visibleCards.recentActivity && (
        <div className="group relative overflow-hidden rounded-3xl border bg-gradient-to-br from-card/80 via-card/60 to-card/80 backdrop-blur-xl shadow-lg">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-primary/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          <div className="relative p-8">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-2xl bg-primary/10">
                  <Bell className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-foreground">Recent Activity</h3>
                  <p className="text-muted-foreground">Latest notifications and updates</p>
                </div>
              </div>
              <select 
                value={activityFilter} 
                onChange={(e) => setActivityFilter(e.target.value)}
                className="px-4 py-2 text-sm border rounded-xl bg-background/80 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
              >
                <option value="all">All Activities</option>
                <option value="slack">Slack</option>
                <option value="email">Email</option>
                <option value="telegram">Telegram</option>
              </select>
            </div>
            <div className="space-y-3">
              {loadingNotifications ? (
                <div className="flex items-center justify-center py-12">
                  <div className="flex items-center gap-3">
                    <Loader2 className="h-6 w-6 animate-spin text-primary" />
                    <span className="text-muted-foreground">Loading notifications...</span>
                  </div>
                </div>
              ) : filteredNotifications.length > 0 ? (
                filteredNotifications.slice(0, 10).map((notification: any) => (
                  <div
                    key={notification.notificationId}
                    className="group/item flex items-center justify-between p-4 rounded-2xl bg-muted/20 hover:bg-muted/40 transition-all duration-300 cursor-pointer border border-transparent hover:border-primary/20"
                    onClick={() => handleNotificationClick(notification)}
                  >
                    <div className="flex items-center gap-4">
                      <div className={`p-2 rounded-xl ${notification.read ? 'bg-muted/50' : 'bg-primary/10'}`}>
                        <Bell className={`h-4 w-4 ${notification.read ? 'text-muted-foreground' : 'text-primary'}`} />
                      </div>
                      <div>
                        <p className="font-semibold text-foreground">{notification.name || 'Notification'}</p>
                        <p className="text-sm text-muted-foreground">
                          {new Date(notification.createdAt).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-xs">
                        {notification.notificationType}
                      </Badge>
                      <ArrowRight className="h-4 w-4 text-muted-foreground group-hover/item:text-primary transition-colors" />
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-12">
                  <Bell className="h-12 w-12 text-muted-foreground/50 mx-auto mb-3" />
                  <p className="text-muted-foreground">No notifications found</p>
                  <p className="text-xs text-muted-foreground/70 mt-1">You're all caught up!</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}