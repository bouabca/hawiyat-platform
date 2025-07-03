"use client"

import { useRouter } from "next/router"
import { useMemo, useState, useEffect, useCallback } from "react"
import { api } from "@/utils/api"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  RefreshCw,
  Settings,
  Eye,
  EyeOff,
  Database,
  Rocket,
  Activity,
  Bell,
  Plus,
  ArrowRight,
  TrendingUp,
  Cpu,
  HardDrive,
  Loader2,
  Users,
  UserPlus,
  BookOpen,
  Server,
  BarChart3,
  Zap,
  AlertCircle,
  CheckCircle,
  Clock,
  Calendar,
} from "lucide-react"
import { ContainerFreeMonitoring } from "@/components/dashboard/monitoring/free/container/show-free-container-monitoring"
import { ShowPaidMonitoring } from "@/components/dashboard/monitoring/paid/servers/show-paid-monitoring"
import { WebServer } from "@/components/dashboard/settings/web-server"
import { useLocalStorage } from "@/hooks/useLocalStorage"

const BASE_URL = "http://localhost:3001/metrics"
const DEFAULT_TOKEN = "metrics"

// Types
type CardKey =
  | "stats"
  | "quickActions"
  | "resourceUsage"
  | "trends"
  | "topDeployments"
  | "projects"
  | "recentActivity"
  | "userActions"
  | "hawiyatConfig"

const CARD_KEYS: CardKey[] = [
  "stats",
  "quickActions",
  "resourceUsage",
  "trends",
  "topDeployments",
  "projects",
  "recentActivity",
  "userActions",
  "hawiyatConfig",
]

const CARD_CONFIG = {
  stats: { name: "System Overview", icon: BarChart3, color: "from-blue-500/20 to-cyan-500/20" },
  quickActions: { name: "Quick Actions", icon: Zap, color: "from-purple-500/20 to-pink-500/20" },
  resourceUsage: { name: "Resource Usage", icon: Activity, color: "from-green-500/20 to-emerald-500/20" },
  trends: { name: "Analytics", icon: TrendingUp, color: "from-orange-500/20 to-red-500/20" },
  topDeployments: { name: "Top Deployments", icon: Rocket, color: "from-indigo-500/20 to-purple-500/20" },
  projects: { name: "Projects", icon: Database, color: "from-teal-500/20 to-cyan-500/20" },
  recentActivity: { name: "Activity Feed", icon: Bell, color: "from-yellow-500/20 to-orange-500/20" },
  userActions: { name: "User Actions", icon: Users, color: "from-rose-500/20 to-pink-500/20" },
  hawiyatConfig: { name: "Server Config", icon: Server, color: "from-slate-500/20 to-gray-500/20" },
} as const

export const Summary = () => {
  const router = useRouter()

  // API queries
  const { data: projects, isLoading: loadingProjects, refetch: refetchProjects } = api.project.all.useQuery()
  const {
    data: notifications,
    isLoading: loadingNotifications,
    refetch: refetchNotifications,
  } = api.notification.all.useQuery()
  const { data: user } = api.user.get.useQuery()
  const { data: org } = api.organization.one.useQuery(
    { organizationId: user?.organizationId || "" },
    { enabled: !!user?.organizationId },
  )
  const { data: monitoring, isLoading: loadingMonitoring } = api.user.getMetricsToken.useQuery()

  // Local state
  const [activityFilter, setActivityFilter] = useState<string>("all")
  const [visibleCards, setVisibleCards] = useState<Record<CardKey, boolean>>({
    stats: true,
    quickActions: true,
    resourceUsage: true,
    trends: true,
    topDeployments: true,
    projects: true,
    recentActivity: true,
    userActions: true,
    hawiyatConfig: true,
  })
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [toggleMonitoring, setToggleMonitoring] = useLocalStorage("toggleMonitoring", false)
  const [localNotifications, setLocalNotifications] = useState<any[]>([])

  // Computed values
  const deployments = useMemo(() => {
    if (!projects) return []
    return projects.flatMap((p: any) => p.compose || []).flatMap((c: any) => c.deployments || [])
  }, [projects])

  const totalProjects = projects?.length || 0
  const totalDeployments = deployments?.length || 0
  const runningDeployments = deployments?.filter((d: any) => d.status === "running").length || 0
  const failedDeployments = deployments?.filter((d: any) => d.status === "failed").length || 0
  const topDeployments = deployments?.slice(0, 5) || []
  const mostActiveProjects = projects?.slice(0, 5) || []
  const unreadCount = notifications?.filter((n: any) => !n.read)?.length || 0

  // Metrics configuration
  const BASE_URL_COMPUTED = useMemo(() => {
    if (process.env.NODE_ENV === "production" && monitoring?.serverIp && monitoring?.metricsConfig?.server?.port) {
      return `http://${monitoring.serverIp}:${monitoring.metricsConfig.server.port}/metrics`
    }
    return "http://localhost:3001/metrics"
  }, [monitoring])

  const TOKEN = useMemo(() => {
    if (process.env.NODE_ENV === "production" && monitoring?.metricsConfig?.server?.token) {
      return monitoring.metricsConfig.server.token
    }
    return "metrics"
  }, [monitoring])

  const {
    data: metricsData,
    isLoading: loadingMetrics,
    error: metricsError,
    refetch: refetchMetrics,
  } = api.server.getServerMetrics.useQuery(
    { url: BASE_URL_COMPUTED, token: TOKEN, dataPoints: "50" },
    { enabled: !!BASE_URL_COMPUTED && !!TOKEN, refetchInterval: 10000 },
  )

  const metrics = useMemo(() => {
    if (!metricsData?.length) return {}
    const latest = metricsData[metricsData.length - 1]
    if (!latest) return {}

    return {
      cpu: Number.parseFloat(latest.cpu || "0"),
      memUsed: Number.parseFloat(latest.memUsed || "0"),
      memTotal: Number.parseFloat(latest.memTotal || "0"),
      diskUsed: Number.parseFloat(latest.diskUsed || "0"),
      totalDisk: Number.parseFloat(latest.totalDisk || "0"),
    }
  }, [metricsData])

  // Effects
  useEffect(() => {
    const saved = sessionStorage.getItem("dashboardVisibleCards")
    if (saved) {
      try {
        const parsed = JSON.parse(saved)
        const filtered: Record<CardKey, boolean> = CARD_KEYS.reduce(
          (acc, key) => {
            acc[key] = parsed[key] ?? true
            return acc
          },
          {} as Record<CardKey, boolean>,
        )
        setVisibleCards(filtered)
      } catch {}
    }
  }, [])

  useEffect(() => {
    sessionStorage.setItem("dashboardVisibleCards", JSON.stringify(visibleCards))
  }, [visibleCards])

  useEffect(() => {
    if (notifications) setLocalNotifications(notifications)
  }, [notifications])

  // Event handlers
  const markAllAsRead = useCallback(() => {
    console.log("Mark all notifications as read")
  }, [])

  const handleToggleCard = useCallback((key: CardKey) => {
    setVisibleCards((prev) => ({ ...prev, [key]: !prev[key] }))
  }, [])

  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true)
    try {
      await Promise.all([refetchProjects(), refetchNotifications(), refetchMetrics()])
    } finally {
      setTimeout(() => setIsRefreshing(false), 1000)
    }
  }, [refetchProjects, refetchNotifications, refetchMetrics])

  const handleNotificationClick = useCallback(
    (notification: any) => {
      if (notification.projectId) {
        router.push(`/dashboard/projects/${notification.projectId}`)
      } else if (notification.deploymentId) {
        router.push(`/dashboard/compose/${notification.deploymentId}`)
      }
    },
    [router],
  )

  const visibleCount = Object.values(visibleCards).filter(Boolean).length

  // Helper functions for safe calculations
  const getMemoryPercentage = () => {
    if (!metrics.memUsed || !metrics.memTotal || metrics.memTotal === 0) return 0
    return (metrics.memUsed / metrics.memTotal) * 100
  }

  const getDiskPercentage = () => {
    if (!metrics.diskUsed || !metrics.totalDisk || metrics.totalDisk === 0) return 0
    return (metrics.diskUsed / metrics.totalDisk) * 100
  }

  const getMemoryGB = (value: number) => {
    return (value / 1024).toFixed(1)
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "running":
        return "text-green-600 bg-green-50 border-green-200"
      case "failed":
        return "text-red-600 bg-red-50 border-red-200"
      case "pending":
        return "text-yellow-600 bg-yellow-50 border-yellow-200"
      default:
        return "text-gray-600 bg-gray-50 border-gray-200"
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "running":
        return CheckCircle
      case "failed":
        return AlertCircle
      case "pending":
        return Clock
      default:
        return Activity
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-800">
      <div className="flex flex-col gap-8 p-6 w-full max-w-7xl mx-auto">
        {/* Enhanced Welcome Header */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 p-8 text-white shadow-2xl">
          <div className="absolute inset-0 bg-black/10 backdrop-blur-sm" />
          <div className="relative z-10 flex items-center justify-between">
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
                  <span className="text-2xl font-bold">{user?.user?.name?.charAt(0) || "U"}</span>
                </div>
                <div>
                  <h1 className="text-3xl font-bold">Welcome back, {user?.user?.name || "User"}!</h1>
                  <p className="text-blue-100 text-lg">{org?.name ? `${org.name} • ` : ""}Dashboard Overview</p>
                </div>
              </div>
              <div className="flex items-center gap-6 mt-4">
                <div className="flex items-center gap-2">
                  <Database className="h-5 w-5 text-blue-200" />
                  <span className="text-blue-100">{totalProjects} Projects</span>
                </div>
                <div className="flex items-center gap-2">
                  <Rocket className="h-5 w-5 text-green-200" />
                  <span className="text-green-100">{runningDeployments} Running</span>
                </div>
                {failedDeployments > 0 && (
                  <div className="flex items-center gap-2">
                    <AlertCircle className="h-5 w-5 text-red-200" />
                    <span className="text-red-100">{failedDeployments} Failed</span>
                  </div>
                )}
              </div>
            </div>

            {unreadCount > 0 && (
              <Button
                variant="secondary"
                size="lg"
                onClick={markAllAsRead}
                className="bg-white/20 backdrop-blur-sm border-white/30 text-white hover:bg-white/30 transition-all duration-200"
              >
                <Bell className="w-5 h-5 mr-2" />
                {unreadCount} New Notifications
              </Button>
            )}
          </div>

          {/* Decorative elements */}
          <div className="absolute -top-4 -right-4 h-24 w-24 rounded-full bg-white/10 blur-xl" />
          <div className="absolute -bottom-8 -left-8 h-32 w-32 rounded-full bg-purple-400/20 blur-2xl" />
        </div>

        {/* Enhanced Dashboard Controls */}
        <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
          <CardContent className="p-6">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <Eye className="w-5 h-5 text-muted-foreground" />
                  <span className="font-medium text-muted-foreground">Dashboard Sections</span>
                </div>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm" className="h-9 px-4 bg-white/50 backdrop-blur-sm">
                      <Settings className="w-4 h-4 mr-2" />
                      Customize View
                      <Badge variant="secondary" className="ml-2 h-5 px-2 text-xs">
                        {visibleCount}/{CARD_KEYS.length}
                      </Badge>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start" className="w-72 p-2">
                    <DropdownMenuLabel className="flex items-center gap-2 text-base font-semibold">
                      <Eye className="w-4 h-4" />
                      Dashboard Sections
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <div className="grid grid-cols-1 gap-1">
                      {CARD_KEYS.map((key) => {
                        const config = CARD_CONFIG[key]
                        const IconComponent = config.icon
                        return (
                          <DropdownMenuCheckboxItem
                            key={key}
                            checked={visibleCards[key]}
                            onCheckedChange={() => handleToggleCard(key)}
                            className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted/50"
                          >
                            <IconComponent className="w-4 h-4 text-muted-foreground" />
                            <span className="flex-1 font-medium">{config.name}</span>
                            {visibleCards[key] ? (
                              <Eye className="w-4 h-4 text-green-600" />
                            ) : (
                              <EyeOff className="w-4 h-4 text-muted-foreground" />
                            )}
                          </DropdownMenuCheckboxItem>
                        )
                      })}
                    </div>
                    <DropdownMenuSeparator />
                    <div className="p-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="w-full justify-center"
                        onClick={() => {
                          const allVisible = Object.values(visibleCards).every(Boolean)
                          CARD_KEYS.forEach((key) => {
                            if (allVisible) {
                              handleToggleCard(key)
                            } else if (!visibleCards[key]) {
                              handleToggleCard(key)
                            }
                          })
                        }}
                      >
                        {Object.values(visibleCards).every(Boolean) ? "Hide All" : "Show All"}
                      </Button>
                    </div>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Activity className="w-4 h-4" />
                  <span>Last updated: {new Date().toLocaleTimeString()}</span>
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleRefresh}
                  disabled={isRefreshing}
                  className="h-9 px-4 bg-white/50 backdrop-blur-sm"
                >
                  <RefreshCw className={`w-4 h-4 mr-2 ${isRefreshing ? "animate-spin" : ""}`} />
                  {isRefreshing ? "Refreshing..." : "Refresh All"}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Enhanced Quick Actions */}
        {visibleCards.quickActions && (
          <Card className="border-0 shadow-lg overflow-hidden">
            <div className={`bg-gradient-to-r ${CARD_CONFIG.quickActions.color} p-1`}>
              <div className="bg-white rounded-lg">
                <CardHeader className="pb-4">
                  <CardTitle className="flex items-center gap-3 text-xl">
                    <div className="p-2 rounded-lg bg-purple-100 text-purple-600">
                      <Zap className="h-6 w-6" />
                    </div>
                    Quick Actions
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-4">
                    {[
                      {
                        icon: Database,
                        label: "Projects",
                        path: "/dashboard/projects",
                        color: "bg-blue-50 text-blue-600 hover:bg-blue-100",
                      },
                      {
                        icon: Plus,
                        label: "New Project",
                        path: "/dashboard/projects/new",
                        color: "bg-green-50 text-green-600 hover:bg-green-100",
                      },
                      {
                        icon: Rocket,
                        label: "Deploy",
                        path: "/dashboard/compose",
                        color: "bg-purple-50 text-purple-600 hover:bg-purple-100",
                      },
                      {
                        icon: Activity,
                        label: "Monitoring",
                        path: "/dashboard/monitoring",
                        color: "bg-orange-50 text-orange-600 hover:bg-orange-100",
                      },
                      {
                        icon: Users,
                        label: "Swarm",
                        path: "/dashboard/swarm",
                        color: "bg-teal-50 text-teal-600 hover:bg-teal-100",
                      },
                      {
                        icon: Settings,
                        label: "Settings",
                        path: "/dashboard/settings",
                        color: "bg-gray-50 text-gray-600 hover:bg-gray-100",
                      },
                      {
                        icon: UserPlus,
                        label: "Add Users",
                        path: "/dashboard/settings/users",
                        color: "bg-indigo-50 text-indigo-600 hover:bg-indigo-100",
                      },
                      {
                        icon: BookOpen,
                        label: "Docs",
                        path: "https://hawiyat.org/docs",
                        color: "bg-pink-50 text-pink-600 hover:bg-pink-100",
                        external: true,
                      },
                    ].map((action, index) => (
                      <Button
                        key={index}
                        variant="ghost"
                        className={`h-24 flex-col gap-3 p-4 rounded-xl transition-all duration-200 hover:scale-105 hover:shadow-md ${action.color}`}
                        onClick={() =>
                          action.external ? window.open(action.path, "_blank") : router.push(action.path)
                        }
                      >
                        <action.icon className="h-6 w-6" />
                        <span className="text-sm font-medium">{action.label}</span>
                      </Button>
                    ))}
                  </div>
                </CardContent>
              </div>
            </div>
          </Card>
        )}

        {/* Enhanced System Overview */}
        {visibleCards.stats && (
          <div className="space-y-6">
            {loadingMonitoring ? (
              <Card className="border-0 shadow-lg">
                <CardContent className="flex items-center justify-center h-64">
                  <div className="text-center space-y-4">
                    <Loader2 className="h-8 w-8 animate-spin mx-auto text-muted-foreground" />
                    <p className="text-muted-foreground">Loading system metrics...</p>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <>
                {monitoring?.enabledFeatures && (
                  <Card className="border-0 shadow-lg bg-gradient-to-r from-amber-50 to-orange-50">
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="p-2 rounded-lg bg-amber-100 text-amber-600">
                            <Activity className="h-5 w-5" />
                          </div>
                          <div>
                            <h3 className="font-semibold">Monitoring Mode</h3>
                            <p className="text-sm text-muted-foreground">Switch between free and paid monitoring</p>
                          </div>
                        </div>
                        <Button
                          variant={toggleMonitoring ? "default" : "outline"}
                          size="lg"
                          onClick={() => setToggleMonitoring(!toggleMonitoring)}
                          className="min-w-[100px]"
                        >
                          {toggleMonitoring ? "Paid" : "Free"}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                )}

                <Card className="border-0 shadow-lg overflow-hidden">
                  <div className={`bg-gradient-to-r ${CARD_CONFIG.stats.color} p-1`}>
                    <div className="bg-white rounded-lg">
                      {toggleMonitoring ? (
                        <ShowPaidMonitoring
                          BASE_URL={
                            process.env.NODE_ENV === "production"
                              ? `http://${monitoring?.serverIp}:${monitoring?.metricsConfig?.server?.port}/metrics`
                              : BASE_URL_COMPUTED
                          }
                          token={
                            process.env.NODE_ENV === "production" ? monitoring?.metricsConfig?.server?.token : TOKEN
                          }
                        />
                      ) : (
                        <div className="p-6">
                          <ContainerFreeMonitoring appName="dokploy" />
                        </div>
                      )}
                    </div>
                  </div>
                </Card>
              </>
            )}
          </div>
        )}

        {/* Enhanced Resource Usage */}
        {visibleCards.resourceUsage && (
          <Card className="border-0 shadow-lg overflow-hidden">
            <div className={`bg-gradient-to-r ${CARD_CONFIG.resourceUsage.color} p-1`}>
              <div className="bg-white rounded-lg">
                <CardHeader className="pb-4">
                  <CardTitle className="flex items-center gap-3 text-xl">
                    <div className="p-2 rounded-lg bg-green-100 text-green-600">
                      <Activity className="h-6 w-6" />
                    </div>
                    Resource Usage
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  {loadingMetrics ? (
                    <div className="flex items-center justify-center h-32">
                      <div className="text-center space-y-2">
                        <RefreshCw className="h-6 w-6 animate-spin mx-auto text-muted-foreground" />
                        <span className="text-sm text-muted-foreground">Loading metrics...</span>
                      </div>
                    </div>
                  ) : metricsError ? (
                    <div className="flex items-center justify-center h-32 text-muted-foreground">
                      <div className="text-center space-y-2">
                        <AlertCircle className="h-6 w-6 mx-auto" />
                        <span className="text-sm">Failed to load metrics</span>
                      </div>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      {[
                        {
                          label: "CPU Usage",
                          value: metrics.cpu?.toFixed(1) || 0,
                          percentage: metrics.cpu || 0,
                          color: "bg-blue-500",
                          icon: Cpu,
                          bgColor: "bg-blue-50",
                          textColor: "text-blue-600",
                        },
                        {
                          label: "Memory",
                          value: `${getMemoryPercentage().toFixed(1)}%`,
                          percentage: getMemoryPercentage(),
                          color: "bg-green-500",
                          icon: Activity,
                          bgColor: "bg-green-50",
                          textColor: "text-green-600",
                          subtitle: `${getMemoryGB(metrics.memUsed || 0)}GB / ${getMemoryGB(metrics.memTotal || 0)}GB`,
                        },
                        {
                          label: "Disk Usage",
                          value: `${getDiskPercentage().toFixed(1)}%`,
                          percentage: getDiskPercentage(),
                          color: "bg-orange-500",
                          icon: HardDrive,
                          bgColor: "bg-orange-50",
                          textColor: "text-orange-600",
                        },
                      ].map((metric, index) => (
                        <div key={index} className={`p-4 rounded-xl ${metric.bgColor} border border-opacity-20`}>
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-2">
                              <metric.icon className={`h-5 w-5 ${metric.textColor}`} />
                              <span className="font-medium text-gray-700">{metric.label}</span>
                            </div>
                            <span className={`text-lg font-bold ${metric.textColor}`}>
                              {typeof metric.value === "string" ? metric.value : `${metric.value}%`}
                            </span>
                          </div>
                          {metric.subtitle && <p className="text-xs text-gray-500 mb-2">{metric.subtitle}</p>}
                          <div className="w-full bg-white/60 rounded-full h-2">
                            <div
                              className={`${metric.color} h-2 rounded-full transition-all duration-500 ease-out`}
                              style={{ width: `${Math.min(metric.percentage, 100)}%` }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </div>
            </div>
          </Card>
        )}

        {/* Enhanced Deployments & Projects */}
        {visibleCards.topDeployments && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="border-0 shadow-lg overflow-hidden">
              <div className={`bg-gradient-to-r ${CARD_CONFIG.topDeployments.color} p-1`}>
                <div className="bg-white rounded-lg">
                  <CardHeader className="pb-4">
                    <CardTitle className="flex items-center gap-3 text-xl">
                      <div className="p-2 rounded-lg bg-indigo-100 text-indigo-600">
                        <Rocket className="h-6 w-6" />
                      </div>
                      Recent Deployments
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="space-y-3">
                      {topDeployments.slice(0, 5).map((deployment: any, index: number) => {
                        const StatusIcon = getStatusIcon(deployment.status)
                        return (
                          <div
                            key={deployment.composeId}
                            className="flex items-center justify-between p-4 rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors cursor-pointer group"
                          >
                            <div className="flex items-center gap-4">
                              <div className={`p-2 rounded-lg ${getStatusColor(deployment.status)}`}>
                                <StatusIcon className="h-4 w-4" />
                              </div>
                              <div>
                                <p className="font-medium text-gray-900">
                                  {deployment.name || `Deployment ${index + 1}`}
                                </p>
                                <p className="text-sm text-gray-500 capitalize">{deployment.status}</p>
                              </div>
                            </div>
                            <ArrowRight className="h-4 w-4 text-gray-400 group-hover:text-gray-600 transition-colors" />
                          </div>
                        )
                      })}
                      {topDeployments.length === 0 && (
                        <div className="text-center py-8 text-gray-500">
                          <Rocket className="h-8 w-8 mx-auto mb-2 opacity-50" />
                          <p>No deployments found</p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </div>
              </div>
            </Card>

            <Card className="border-0 shadow-lg overflow-hidden">
              <div className={`bg-gradient-to-r ${CARD_CONFIG.projects.color} p-1`}>
                <div className="bg-white rounded-lg">
                  <CardHeader className="pb-4">
                    <CardTitle className="flex items-center gap-3 text-xl">
                      <div className="p-2 rounded-lg bg-teal-100 text-teal-600">
                        <Database className="h-6 w-6" />
                      </div>
                      Active Projects
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="space-y-3">
                      {mostActiveProjects.slice(0, 5).map((project: any) => (
                        <div
                          key={project.projectId}
                          className="flex items-center justify-between p-4 rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors cursor-pointer group"
                        >
                          <div className="flex items-center gap-4">
                            <div className="p-2 rounded-lg bg-teal-100 text-teal-600">
                              <Database className="h-4 w-4" />
                            </div>
                            <div>
                              <p className="font-medium text-gray-900">{project.name}</p>
                              <p className="text-sm text-gray-500">
                                {new Date(project.createdAt).toLocaleDateString()}
                              </p>
                            </div>
                          </div>
                          <ArrowRight className="h-4 w-4 text-gray-400 group-hover:text-gray-600 transition-colors" />
                        </div>
                      ))}
                      {mostActiveProjects.length === 0 && (
                        <div className="text-center py-8 text-gray-500">
                          <Database className="h-8 w-8 mx-auto mb-2 opacity-50" />
                          <p>No projects found</p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </div>
              </div>
            </Card>
          </div>
        )}

        {/* Enhanced Recent Activity */}
        {visibleCards.recentActivity && (
          <Card className="border-0 shadow-lg overflow-hidden">
            <div className={`bg-gradient-to-r ${CARD_CONFIG.recentActivity.color} p-1`}>
              <div className="bg-white rounded-lg">
                <CardHeader className="pb-4">
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-3 text-xl">
                      <div className="p-2 rounded-lg bg-yellow-100 text-yellow-600">
                        <Bell className="h-6 w-6" />
                      </div>
                      Activity Feed
                    </CardTitle>
                    <Select value={activityFilter} onValueChange={setActivityFilter}>
                      <SelectTrigger className="w-40">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Activities</SelectItem>
                        <SelectItem value="slack">Slack</SelectItem>
                        <SelectItem value="email">Email</SelectItem>
                        <SelectItem value="telegram">Telegram</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="space-y-3">
                    {loadingNotifications ? (
                      <div className="flex items-center justify-center py-8">
                        <div className="text-center space-y-2">
                          <RefreshCw className="h-6 w-6 animate-spin mx-auto text-muted-foreground" />
                          <span className="text-sm text-muted-foreground">Loading notifications...</span>
                        </div>
                      </div>
                    ) : localNotifications.length > 0 ? (
                      localNotifications.slice(0, 10).map((notification: any, idx: number) => (
                        <div
                          key={notification.notificationId}
                          className="flex items-center justify-between p-4 rounded-xl border border-gray-200 cursor-pointer hover:bg-gray-50 transition-all duration-200 hover:shadow-sm group"
                          onClick={() => handleNotificationClick(notification)}
                        >
                          <div className="flex items-center gap-4">
                            <div
                              className={`p-2 rounded-lg ${notification.read ? "bg-gray-100 text-gray-400" : "bg-blue-100 text-blue-600"}`}
                            >
                              <Bell className="h-4 w-4" />
                            </div>
                            <div className="flex-1">
                              <p className={`font-medium ${notification.read ? "text-gray-600" : "text-gray-900"}`}>
                                {notification.name || "Notification"}
                              </p>
                              <div className="flex items-center gap-2 mt-1">
                                <Calendar className="h-3 w-3 text-gray-400" />
                                <p className="text-sm text-gray-500">
                                  {new Date(notification.createdAt).toLocaleDateString()}
                                </p>
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className="text-xs">
                              {notification.notificationType}
                            </Badge>
                            <ArrowRight className="h-4 w-4 text-gray-400 group-hover:text-gray-600 transition-colors" />
                            <button
                              className="ml-2 text-gray-400 hover:text-red-500 transition-colors"
                              onClick={e => {
                                e.stopPropagation();
                                setLocalNotifications((prev: any[]) => prev.filter((_, i) => i !== idx));
                              }}
                              aria-label="Remove notification"
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                              </svg>
                            </button>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-12 text-gray-500">
                        <Bell className="h-12 w-12 mx-auto mb-4 opacity-50" />
                        <p className="text-lg font-medium">No notifications found</p>
                        <p className="text-sm">You're all caught up!</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </div>
            </div>
          </Card>
        )}

        {/* Enhanced Hawiyat Config */}
        {visibleCards.hawiyatConfig && (
          <Card className="border-0 shadow-lg overflow-hidden">
            <div className={`bg-gradient-to-r ${CARD_CONFIG.hawiyatConfig.color} p-1`}>
              <div className="bg-white rounded-lg">
                <CardHeader className="pb-4">
                  <CardTitle className="flex items-center gap-3 text-xl">
                    <div className="p-2 rounded-lg bg-slate-100 text-slate-600">
                      <Server className="h-6 w-6" />
                    </div>
                    Server Configuration
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  <WebServer />
                </CardContent>
              </div>
            </div>
          </Card>
        )}

        {/* Enhanced User Actions */}
        {/* {visibleCards.userActions && (
          <Card className="border-0 shadow-lg overflow-hidden">
            <div className={`bg-gradient-to-r ${CARD_CONFIG.userActions.color} p-1`}>
              <div className="bg-white rounded-lg">
                <CardHeader className="pb-4">
                  <CardTitle className="flex items-center gap-3 text-xl">
                    <div className="p-2 rounded-lg bg-rose-100 text-rose-600">
                      <Users className="h-6 w-6" />
                    </div>
                    Recent User Actions
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="space-y-3">
                    {[
                      {
                        type: "project",
                        message: 'Created project "Alpha"',
                        date: "2024-06-01 10:00",
                        icon: Database,
                        color: "bg-blue-100 text-blue-600",
                      },
                      {
                        type: "deployment",
                        message: 'Deployed stack "web-app"',
                        date: "2024-06-01 11:00",
                        icon: Rocket,
                        color: "bg-green-100 text-green-600",
                      },
                      {
                        type: "settings",
                        message: "Updated organization settings",
                        date: "2024-06-01 12:00",
                        icon: Settings,
                        color: "bg-purple-100 text-purple-600",
                      },
                    ].map((action, index) => (
                      <div key={index} className="flex items-center gap-4 p-4 rounded-xl bg-gray-50">
                        <div className={`p-2 rounded-lg ${action.color}`}>
                          <action.icon className="h-4 w-4" />
                        </div>
                        <div className="flex-1">
                          <p className="font-medium text-gray-900">{action.message}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <Clock className="h-3 w-3 text-gray-400" />
                            <p className="text-sm text-gray-500">{action.date}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </div>
            </div>
          </Card>
        )} */}
      </div>
    </div>
  )
}
