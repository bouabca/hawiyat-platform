import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { TrendingUp } from "lucide-react";
import { formatNumber } from "../utils";

interface StatCardProps {
  title: string;
  value: string | number;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  trend?: { value: number; isPositive: boolean };
  loading?: boolean;
}

export const StatCard = ({ title, value, description, icon: Icon, color, trend, loading }: StatCardProps) => (
  <Card className="group hover:shadow-lg transition-all duration-300 border-l-4" style={{ borderLeftColor: color }}>
    <CardHeader className="pb-3">
      <div className="flex items-center justify-between">
        <div className={`p-2 rounded-lg`} style={{ backgroundColor: `${color}20` }}>
          <Icon className="w-5 h-5" style={{ color }} />
        </div>
        {trend && (
          <div className={`flex items-center gap-1 text-xs ${trend.isPositive ? 'text-green-600' : 'text-red-600'}`}>
            <TrendingUp className={`w-3 h-3 ${trend.isPositive ? '' : 'rotate-180'}`} />
            {Math.abs(trend.value)}%
          </div>
        )}
      </div>
      <CardTitle className="text-lg">{title}</CardTitle>
      <CardDescription className="text-sm">{description}</CardDescription>
    </CardHeader>
    <CardContent>
      {loading ? (
        <Skeleton className="h-8 w-20" />
      ) : (
        <div className="text-3xl font-bold group-hover:scale-105 transition-transform">
          {typeof value === 'number' ? formatNumber(value) : value}
        </div>
      )}
    </CardContent>
  </Card>
); 