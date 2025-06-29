import { useRouter } from "next/router";
import { useCallback } from "react";

// Import components
import { WelcomeHeader, DashboardControls } from "./components";

// Import sections
import {
  QuickStatsSection,
  QuickActionsSection,
  ResourceUsageSection,
  TrendsSection,
  DeploymentsProjectsSection,
  ProjectsSection,
  RecentActivitySection,
  UserActionsSection,
} from "./sections";

// Import hooks
import { useDashboardData } from "./hooks/use-dashboard-data";

export const Summary = () => {
  const router = useRouter();
  
  // Use the custom hook for all data management
  const {
    // Data
    user,
    org,
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
  } = useDashboardData();

  // Navigation handler
  const handleNotificationClick = useCallback((notification: any) => {
    if (notification.projectId) {
      router.push(`/dashboard/projects/${notification.projectId}`);
    } else if (notification.deploymentId) {
      router.push(`/dashboard/compose/${notification.deploymentId}`);
    }
  }, [router]);

  return (
    <div className="flex flex-col gap-6 p-6 w-full max-w-7xl mx-auto">
      {/* Welcome Header */}
      <WelcomeHeader 
        user={user} 
        org={org} 
        unreadCount={unreadCount} 
        onMarkAsRead={markAllAsRead} 
      />

      {/* Dashboard Controls */}
      <DashboardControls 
        visibleCards={visibleCards} 
        onToggleCard={handleToggleCard} 
        onRefresh={handleRefresh} 
      />

      {/* Quick Stats */}
      {visibleCards.stats && (
        <QuickStatsSection
          totalProjects={totalProjects}
          totalDeployments={totalDeployments}
          runningDeployments={runningDeployments}
          failedDeployments={failedDeployments}
          org={org}
          metrics={metrics}
          loadingProjects={loadingProjects}
          loadingMetrics={loadingMetrics}
        />
      )}

      {/* Quick Actions */}
      {visibleCards.quickActions && <QuickActionsSection />}

      {/* Resource Usage Charts */}
      {visibleCards.resourceUsage && (
        <ResourceUsageSection
          historicalData={historicalData}
          metrics={metrics}
          loadingMonitoring={loadingMonitoring}
          loadingMetrics={loadingMetrics}
          metricsError={metricsError}
        />
      )}

      {/* Trends & Analytics */}
      {visibleCards.trends && (
        <TrendsSection
          projectGrowth={projectGrowth}
          deploymentFrequency={deploymentFrequency}
          cpuTrend={cpuTrend}
        />
      )}

      {/* Top Deployments & Most Active Projects */}
      {visibleCards.topDeployments && (
        <DeploymentsProjectsSection
          topDeployments={topDeployments}
          mostActiveProjects={mostActiveProjects}
        />
      )}

      {/* Projects */}
      {visibleCards.projects && (
        <ProjectsSection loadingProjects={loadingProjects} />
      )}

      {/* Recent Activity */}
      

      {/* Recent User Actions */}
      {visibleCards.userActions && (
        <UserActionsSection userActions={userActions} />
      )}
    </div>
  );
}; 