import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { TrendingUp } from "lucide-react";
import { TrendChart } from "../components/trend-chart";
import { MetricData } from "../types";

interface TrendsSectionProps {
  projectGrowth: MetricData[];
  deploymentFrequency: MetricData[];
  cpuTrend: MetricData[];
}

export const TrendsSection = ({ projectGrowth, deploymentFrequency, cpuTrend }: TrendsSectionProps) => (
  <Card>
    <CardHeader>
      <CardTitle className="flex items-center gap-2">
        <TrendingUp className="w-5 h-5" />
        Trends & Analytics
      </CardTitle>
      <CardDescription>Growth patterns and performance insights</CardDescription>
    </CardHeader>
    <CardContent>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <TrendChart 
          data={projectGrowth} 
          title="Project Growth" 
          color="#4f46e5" 
        />
        <TrendChart 
          data={deploymentFrequency} 
          title="Deployment Frequency" 
          color="#16a34a" 
        />
        <TrendChart 
          data={cpuTrend} 
          title="CPU Usage Trend" 
          color="#f59e0b" 
        />
      </div>
    </CardContent>
  </Card>
); 