import { Database, Rocket, Users } from "lucide-react";
import { StatCard } from "../components/stat-card";
import { SystemHealthCard } from "../components/system-health-card";
import { Metrics } from "../types";

interface QuickStatsSectionProps {
  totalProjects: number;
  totalDeployments: number;
  runningDeployments: number;
  failedDeployments: number;
  org?: any;
  metrics: Metrics;
  loadingProjects: boolean;
  loadingMetrics: boolean;
}

export const QuickStatsSection = ({
  totalProjects,
  totalDeployments,
  runningDeployments,
  failedDeployments,
  org,
  metrics,
  loadingProjects,
  loadingMetrics,
}: QuickStatsSectionProps) => (
  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
    <StatCard
      title="Projects"
      value={totalProjects}
      description="Total projects in organization"
      icon={Database}
      color="#4f46e5"
      loading={loadingProjects}
    />
    <StatCard
      title="Deployments"
      value={totalDeployments}
      description={`${runningDeployments} running, ${failedDeployments} failed`}
      icon={Rocket}
      color="#16a34a"
      loading={loadingProjects}
    />
    <StatCard
      title="Organization"
      value={org?.name || "Personal"}
      description="Current workspace"
      icon={Users}
      color="#f59e0b"
    />
    <SystemHealthCard metrics={metrics} loading={loadingMetrics} />
  </div>
); 