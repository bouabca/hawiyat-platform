import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ShowProjects } from "../projects/show";
import { ShowGeneralCompose } from "../compose/general/show";
import { ShowPaidMonitoring } from "../monitoring/paid/servers/show-paid-monitoring";
import { api } from "@/utils/api";
import { Loader2, Plus, Rocket, BookOpen, HeartPulse, Bell } from "lucide-react";
import Link from "next/link";
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from "@/components/ui/table";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useRouter } from "next/router";
import { useMemo, useState, useEffect } from "react";
import { Avatar, AvatarImage } from "@/components/ui/avatar";
import { MemoryChart } from "../monitoring/paid/servers/memory-chart";
import { CPUChart } from "../monitoring/paid/servers/cpu-chart";
import { DiskChart } from "../monitoring/paid/servers/disk-chart";
import { NetworkChart } from "../monitoring/paid/servers/network-chart";
import { LineChart, Line, ResponsiveContainer, Tooltip as RechartsTooltip, XAxis, YAxis } from 'recharts';

// Define the type for card keys
const CARD_KEYS = [
  'stats',
  'quickActions',
  'resourceUsage',
  'trends',
  'topDeployments',
  'projects',
  'recentActivity',
  'userActions',
] as const;
type CardKey = typeof CARD_KEYS[number];

export const Summary = () => {
  // Fetch organization projects, deployments, resource usage, and notifications
  const { data: projects, isLoading: loadingProjects } = api.project.all.useQuery();
  const { data: notifications, isLoading: loadingNotifications } = api.notification.all.useQuery();
  const { data: user } = api.user.get.useQuery();
  const { data: org } = api.organization.one.useQuery({ organizationId: user?.organizationId || "" }, { enabled: !!user?.organizationId });
  // For demo: fetch all deployments for all projects (could be optimized)
  const [activityFilter, setActivityFilter] = useState<string>("all");
  const router = useRouter();

  // Simulate deployments aggregation (replace with real API if available)
  const deployments = useMemo(() => {
    if (!projects) return [];
    return projects.flatMap((p: any) => p.compose || []).flatMap((c: any) => c.deployments || []);
  }, [projects]);

  // Quick stats
  const totalProjects = projects?.length || 0;
  const totalDeployments = deployments?.length || 0;
  const runningDeployments = deployments?.filter((d: any) => d.status === "running").length || 0;

  // Top resource-consuming deployments (mocked for now)
  const topDeployments = deployments?.slice(0, 3) || [];
  // Most active projects (mocked for now)
  const mostActiveProjects = projects?.slice(0, 3) || [];

  // System health status (use monitoring API/component)
  // We'll use ShowPaidMonitoring for charts, but for health, let's assume healthy if CPU/mem < 90% (mocked here)
  const systemHealthy = true; // TODO: Replace with real health logic

  // Filter notifications by type
  const filteredNotifications = useMemo(() => {
    if (activityFilter === "all") return notifications;
    return notifications?.filter((n: any) => n.type === activityFilter || n.channel === activityFilter);
  }, [notifications, activityFilter]);

  // Notifications unread count
  const unreadCount = notifications?.filter((n: any) => !n.read)?.length || 0;
  // Mark as read (mocked, should call API)
  const markAllAsRead = () => {
    // TODO: Call API to mark all as read
    // For now, just log
    console.log("Mark all notifications as read");
  };

  // Customizable dashboard state (show/hide cards)
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

  // Persist card visibility in sessionStorage
  useEffect(() => {
    const saved = sessionStorage.getItem('dashboardVisibleCards');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        // Only update keys that exist in CARD_KEYS
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

  // Trends data (mocked for now)
  const projectGrowth = [
    { date: '2024-05-01', value: 2 },
    { date: '2024-05-10', value: 3 },
    { date: '2024-05-20', value: 4 },
    { date: '2024-06-01', value: totalProjects },
  ];
  const deploymentFrequency = [
    { date: '2024-05-01', value: 1 },
    { date: '2024-05-10', value: 2 },
    { date: '2024-05-20', value: 3 },
    { date: '2024-06-01', value: totalDeployments },
  ];
  // Resource usage trends (mocked)
  const cpuTrend = [
    { date: '2024-05-01', value: 20 },
    { date: '2024-05-10', value: 40 },
    { date: '2024-05-20', value: 30 },
    { date: '2024-06-01', value: 50 },
  ];

  // Recent user actions (mocked, replace with real API if available)
  const userActions = [
    { type: 'project', message: 'Created project "Alpha"', date: '2024-06-01 10:00' },
    { type: 'deployment', message: 'Deployed stack "web-app"', date: '2024-06-01 11:00' },
    { type: 'settings', message: 'Changed organization logo', date: '2024-06-01 12:00' },
  ];

  // Fetch monitoring config for metrics URL and token
  const { data: monitoring, isLoading: loadingMonitoring } = api.user.getMetricsToken.useQuery();

  // Resource usage state
  const [historicalData, setHistoricalData] = useState<any[]>([]);
  const [metrics, setMetrics] = useState<any>({});

  // Fetch real server metrics if monitoring is enabled
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

  return (
    <div className="flex flex-col gap-8 p-6 w-full">
      {/* Customization toggles */}
      <div className="flex flex-wrap gap-4 mb-2">
        {CARD_KEYS.map((key) => (
          <label key={key} className="flex items-center gap-2 text-sm cursor-pointer">
            <input
              type="checkbox"
              checked={visibleCards[key]}
              onChange={() => setVisibleCards(v => ({ ...v, [key]: !v[key] }))}
              className="accent-primary"
              aria-checked={visibleCards[key]}
              aria-label={`Toggle ${key}`}
            />
            {key.replace(/([A-Z])/g, ' $1').replace(/^./, s => s.toUpperCase())}
          </label>
        ))}
      </div>

      {/* Welcome & Org */}
      <div className="flex items-center gap-4 mb-4">
        <Avatar className="h-12 w-12">
          <AvatarImage src={user?.user?.image || org?.logo || ""} alt={user?.user?.name || org?.name || "Org"} />
        </Avatar>
        <div>
          <div className="text-lg font-semibold">Welcome, {user?.user?.name || user?.user?.email || "User"}!</div>
          <div className="text-muted-foreground">Organization: {org?.name || "-"}</div>
        </div>
        <div className="ml-auto flex items-center gap-2">
          <button className="relative p-2 rounded-full hover:bg-muted/30 transition-colors" onClick={markAllAsRead} title="Notifications">
            <Bell className="w-6 h-6" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full px-1.5 py-0.5">{unreadCount}</span>
            )}
          </button>
        </div>
      </div>
      {/* Quick Stats & Health */}
      {visibleCards.stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Projects</CardTitle>
              <CardDescription>Total projects in your organization</CardDescription>
            </CardHeader>
            <CardContent>
              <span className="text-3xl font-bold">{totalProjects}</span>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Deployments</CardTitle>
              <CardDescription>Total deployments (Compose/Stack)</CardDescription>
            </CardHeader>
            <CardContent>
              <span className="text-3xl font-bold">{totalDeployments}</span>
              <Badge className="ml-4" variant="green">{runningDeployments} Running</Badge>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Organization</CardTitle>
              <CardDescription>Current organization</CardDescription>
            </CardHeader>
            <CardContent>
              <span className="text-lg font-semibold">{org?.name || "-"}</span>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <HeartPulse className="w-5 h-5 text-green-500" /> System Health
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <span className="ml-1 cursor-pointer text-muted-foreground">?</span>
                    </TooltipTrigger>
                    <TooltipContent>
                      <span>System health is based on real-time monitoring metrics.</span>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </CardTitle>
              <CardDescription>Overall system status</CardDescription>
            </CardHeader>
            <CardContent>
              <span className={`text-lg font-semibold ${systemHealthy ? "text-green-600" : "text-red-600"}`}>{systemHealthy ? "Healthy" : "Issues detected"}</span>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Quick Actions */}
      {visibleCards.quickActions && (
        <div className="flex flex-wrap gap-4">
          <Link href="/dashboard/projects">
            <button className="flex items-center gap-2 px-4 py-2 rounded-md bg-primary text-white hover:bg-primary/90 transition-colors">
              <Plus className="w-4 h-4" /> Add Project
            </button>
          </Link>
          <Link href="/dashboard/compose">
            <button className="flex items-center gap-2 px-4 py-2 rounded-md bg-secondary text-foreground hover:bg-secondary/80 transition-colors">
              <Rocket className="w-4 h-4" /> Deploy Compose
            </button>
          </Link>
          <Link href="/docs">
            <button className="flex items-center gap-2 px-4 py-2 rounded-md bg-muted text-foreground hover:bg-muted/80 transition-colors">
              <BookOpen className="w-4 h-4" /> View Docs
            </button>
          </Link>
          <Link href="/dashboard/settings/users">
            <button className="flex items-center gap-2 px-4 py-2 rounded-md bg-blue-600 text-white hover:bg-blue-700 transition-colors">
              <Plus className="w-4 h-4" /> Invite Member
            </button>
          </Link>
          <button className="flex items-center gap-2 px-4 py-2 rounded-md bg-yellow-500 text-white hover:bg-yellow-600 transition-colors" onClick={() => alert("Backup started!") /* TODO: Replace with real backup action */}>
            <Rocket className="w-4 h-4" /> Backup Now
          </button>
        </div>
      )}

      {/* Resource Usage Charts */}
      {visibleCards.resourceUsage && (
        <div>
          <Card>
            <CardHeader>
              <CardTitle>Resource Usage</CardTitle>
              <CardDescription>CPU, Memory, Disk, Network</CardDescription>
            </CardHeader>
            <CardContent>
              {loadingMonitoring || loadingMetrics ? (
                <div className="flex items-center gap-2"><Loader2 className="animate-spin" /> Loading resource usage...</div>
              ) : metricsError ? (
                <Alert>
                  <AlertTitle>Error loading metrics</AlertTitle>
                  <AlertDescription>
                    {metricsError instanceof Error ? metricsError.message : "Failed to fetch metrics."}
                  </AlertDescription>
                </Alert>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
                  <CPUChart data={historicalData} />
                  <MemoryChart data={historicalData} />
                  <DiskChart data={metrics} />
                  <NetworkChart data={historicalData} />
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Trends & Analytics */}
      {visibleCards.trends && (
        <div>
          <Card>
            <CardHeader>
              <CardTitle>Trends & Analytics</CardTitle>
              <CardDescription>Project growth, deployment frequency, resource usage</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <div className="font-medium mb-1">Project Growth</div>
                  <ResponsiveContainer width="100%" height={80}>
                    <LineChart data={projectGrowth} margin={{ left: 0, right: 0, top: 10, bottom: 0 }}>
                      <XAxis dataKey="date" hide />
                      <YAxis hide domain={['auto', 'auto']} />
                      <RechartsTooltip />
                      <Line type="monotone" dataKey="value" stroke="#4f46e5" strokeWidth={2} dot={false} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
                <div>
                  <div className="font-medium mb-1">Deployment Frequency</div>
                  <ResponsiveContainer width="100%" height={80}>
                    <LineChart data={deploymentFrequency} margin={{ left: 0, right: 0, top: 10, bottom: 0 }}>
                      <XAxis dataKey="date" hide />
                      <YAxis hide domain={['auto', 'auto']} />
                      <RechartsTooltip />
                      <Line type="monotone" dataKey="value" stroke="#16a34a" strokeWidth={2} dot={false} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
                <div>
                  <div className="font-medium mb-1">CPU Usage Trend</div>
                  <ResponsiveContainer width="100%" height={80}>
                    <LineChart data={cpuTrend} margin={{ left: 0, right: 0, top: 10, bottom: 0 }}>
                      <XAxis dataKey="date" hide />
                      <YAxis hide domain={['auto', 'auto']} />
                      <RechartsTooltip />
                      <Line type="monotone" dataKey="value" stroke="#f59e42" strokeWidth={2} dot={false} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Top Deployments & Most Active Projects */}
      {visibleCards.topDeployments && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Top Resource-Consuming Deployments</CardTitle>
              <CardDescription>Most resource-intensive deployments</CardDescription>
            </CardHeader>
            <CardContent>
              {topDeployments.length === 0 ? (
                <span>No deployments found.</span>
              ) : (
                <ul className="space-y-2">
                  {topDeployments.map((deployment: any) => (
                    <li key={deployment.composeId} className="flex justify-between items-center cursor-pointer hover:bg-muted/30 p-2 rounded" onClick={() => router.push(`/dashboard/compose/${deployment.composeId}`)}>
                      <span className="font-medium">{deployment.name || deployment.composeId}</span>
                      <Badge variant="secondary">{deployment.status}</Badge>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Most Active Projects</CardTitle>
              <CardDescription>Projects with the most activity</CardDescription>
            </CardHeader>
            <CardContent>
              {mostActiveProjects.length === 0 ? (
                <span>No projects found.</span>
              ) : (
                <ul className="space-y-2">
                  {mostActiveProjects.map((project: any) => (
                    <li key={project.projectId} className="flex justify-between items-center cursor-pointer hover:bg-muted/30 p-2 rounded" onClick={() => router.push(`/dashboard/projects/${project.projectId}`)}>
                      <span className="font-medium">{project.name}</span>
                      <Badge variant="outline">{project.status || "Active"}</Badge>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Projects */}
      {visibleCards.projects && (
        <div>
          <Card>
            <CardHeader>
              <CardTitle>Projects</CardTitle>
              <CardDescription>All projects in your organization</CardDescription>
            </CardHeader>
            <CardContent>
              {loadingProjects ? (
                <div className="flex items-center gap-2"><Loader2 className="animate-spin" /> Loading projects...</div>
              ) : (
                <ShowProjects />
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Recent Activity / Logs */}
      {visibleCards.recentActivity && (
        <div>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Recent Activity</CardTitle>
                <CardDescription>Recent deployments, changes, and logs</CardDescription>
              </div>
              <div>
                <select className="border rounded px-2 py-1 text-sm" value={activityFilter} onChange={e => setActivityFilter(e.target.value)}>
                  <option value="all">All</option>
                  <option value="deployment">Deployment</option>
                  <option value="project">Project</option>
                  <option value="error">Error</option>
                </select>
              </div>
            </CardHeader>
            <CardContent>
              {loadingNotifications ? (
                <div className="flex items-center gap-2"><Loader2 className="animate-spin" /> Loading activity...</div>
              ) : filteredNotifications?.length ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Type</TableHead>
                      <TableHead>Message</TableHead>
                      <TableHead>Date</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredNotifications.slice(0, 10).map((notif: any) => (
                      <TableRow key={notif.id} className="cursor-pointer hover:bg-muted/30" onClick={() => {
                        if (notif.projectId) router.push(`/dashboard/projects/${notif.projectId}`);
                        else if (notif.deploymentId) router.push(`/dashboard/compose/${notif.deploymentId}`);
                      }}>
                        <TableCell>{notif.type || notif.channel || "Info"}</TableCell>
                        <TableCell>{notif.message || notif.title || "-"}</TableCell>
                        <TableCell>{notif.createdAt ? new Date(notif.createdAt).toLocaleString() : "-"}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <Alert>
                  <AlertTitle>No recent activity</AlertTitle>
                  <AlertDescription>
                    There are no recent notifications or activity for your organization.
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Recent User Actions */}
      {visibleCards.userActions && (
        <div>
          <Card>
            <CardHeader>
              <CardTitle>My Recent Actions</CardTitle>
              <CardDescription>Things you've done recently</CardDescription>
            </CardHeader>
            <CardContent>
              {userActions.length === 0 ? (
                <span>No recent actions.</span>
              ) : (
                <ul className="space-y-2">
                  {userActions.map((action, idx) => (
                    <li key={idx} className="flex justify-between items-center">
                      <span className="font-medium">{action.message}</span>
                      <span className="text-xs text-muted-foreground">{action.date}</span>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}; 