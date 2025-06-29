import { AreaChart, Area, ResponsiveContainer, Tooltip as RechartsTooltip, XAxis, YAxis } from 'recharts';
import { MetricData } from "../types";

interface TrendChartProps {
  data: MetricData[];
  title: string;
  color: string;
  height?: number;
}

export const TrendChart = ({ data, title, color, height = 80 }: TrendChartProps) => (
  <div>
    <div className="font-medium mb-2 text-sm">{title}</div>
    <ResponsiveContainer width="100%" height={height}>
      <AreaChart data={data} margin={{ left: 0, right: 0, top: 5, bottom: 0 }}>
        <defs>
          <linearGradient id={`gradient-${title}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor={color} stopOpacity={0.3}/>
            <stop offset="95%" stopColor={color} stopOpacity={0}/>
          </linearGradient>
        </defs>
        <XAxis dataKey="date" hide />
        <YAxis hide domain={['auto', 'auto']} />
        <RechartsTooltip 
          contentStyle={{ 
            backgroundColor: 'hsl(var(--background))', 
            border: '1px solid hsl(var(--border))',
            borderRadius: '6px'
          }}
        />
        <Area 
          type="monotone" 
          dataKey="value" 
          stroke={color} 
          strokeWidth={2}
          fill={`url(#gradient-${title})`}
          dot={false}
        />
      </AreaChart>
    </ResponsiveContainer>
  </div>
); 