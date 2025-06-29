import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { AlertTriangle, CheckCircle, Loader2 } from "lucide-react";
import { getHealthStatus } from "../utils";
import { Metrics } from "../types";

interface SystemHealthCardProps {
  metrics: Metrics;
  loading: boolean;
}

export const SystemHealthCard = ({ metrics, loading }: SystemHealthCardProps) => {
  const health = getHealthStatus(metrics, loading);
  
  const getIcon = (iconName: string) => {
    switch (iconName) {
      case 'Loader2': return Loader2;
      case 'AlertTriangle': return AlertTriangle;
      case 'CheckCircle': return CheckCircle;
      default: return CheckCircle;
    }
  };

  const Icon = getIcon(health.icon);

  return (
    <Card className="border-l-4 border-l-green-500">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Icon className={`w-5 h-5 ${health.color}`} />
          System Health
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <span className="ml-1 cursor-pointer text-muted-foreground">?</span>
              </TooltipTrigger>
              <TooltipContent>
                <span>Real-time system health based on CPU and memory usage</span>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </CardTitle>
        <CardDescription>Overall system status and performance</CardDescription>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex items-center gap-2">
            <Loader2 className="animate-spin w-4 h-4" />
            <span>Checking system health...</span>
          </div>
        ) : (
          <div className="space-y-3">
            <div className={`text-lg font-semibold ${health.color}`}>
              {health.status === 'loading' ? 'Checking...' : 
               health.status === 'unknown' ? 'Unknown' :
               health.status === 'critical' ? 'Critical' :
               health.status === 'warning' ? 'Warning' : 'Healthy'}
            </div>
            {metrics.cpu && (
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span>CPU Usage</span>
                  <span>{parseFloat(metrics.cpu).toFixed(1)}%</span>
                </div>
                <Progress value={parseFloat(metrics.cpu)} className="h-2" />
              </div>
            )}
            {metrics.memUsed && (
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span>Memory Usage</span>
                  <span>{parseFloat(metrics.memUsed).toFixed(1)}%</span>
                </div>
                <Progress value={parseFloat(metrics.memUsed)} className="h-2" />
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}; 