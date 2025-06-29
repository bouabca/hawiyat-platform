import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { AlertTriangle, BarChart3, Loader2 } from "lucide-react";
import { MemoryChart } from "../../monitoring/paid/servers/memory-chart";
import { CPUChart } from "../../monitoring/paid/servers/cpu-chart";
import { DiskChart } from "../../monitoring/paid/servers/disk-chart";
import { NetworkChart } from "../../monitoring/paid/servers/network-chart";

interface ResourceUsageSectionProps {
  historicalData: any[];
  metrics: any;
  loadingMonitoring: boolean;
  loadingMetrics: boolean;
  metricsError: any;
}

export const ResourceUsageSection = ({
  historicalData,
  metrics,
  loadingMonitoring,
  loadingMetrics,
  metricsError,
}: ResourceUsageSectionProps) => (
  <Card>
    <CardHeader>
      <CardTitle className="flex items-center gap-2">
        <BarChart3 className="w-5 h-5" />
        Resource Usage
      </CardTitle>
      <CardDescription>Real-time system metrics and performance</CardDescription>
    </CardHeader>
    <CardContent>
      {loadingMonitoring || loadingMetrics ? (
        <div className="flex items-center gap-2">
          <Loader2 className="animate-spin" /> 
          Loading resource usage...
        </div>
      ) : metricsError ? (
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Error loading metrics</AlertTitle>
          <AlertDescription>
            {metricsError instanceof Error ? metricsError.message : "Failed to fetch metrics."}
          </AlertDescription>
        </Alert>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
          <CPUChart data={historicalData} />
          <MemoryChart data={historicalData} />
          <DiskChart data={metrics} />
          <NetworkChart data={historicalData} />
        </div>
      )}
    </CardContent>
  </Card>
); 