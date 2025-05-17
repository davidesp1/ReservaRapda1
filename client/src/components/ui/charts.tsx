import React from 'react';
import { format } from 'date-fns';
import {
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Area,
  AreaChart as RechartsAreaChart,
  Bar,
  BarChart as RechartsBarChart,
  Legend,
  PieChart as RechartsPieChart,
  Pie,
  Cell,
} from 'recharts';

interface AreaChartProps {
  data: any[];
  xKey: string;
  yKey: string;
  areaColor?: string;
  xLabel?: string;
  yLabel?: string;
  height?: number;
  formatX?: (value: any) => string;
  formatY?: (value: any) => string;
}

export const AreaChart: React.FC<AreaChartProps> = ({
  data,
  xKey,
  yKey,
  areaColor = '#0ea5e9',
  xLabel,
  yLabel,
  height = 300,
  formatX,
  formatY,
}) => {
  const formatXDefault = (value: any) => {
    if (value?.includes('-')) {
      return format(new Date(value), 'dd/MM');
    }
    return value;
  };

  return (
    <ResponsiveContainer width="100%" height={height}>
      <RechartsAreaChart
        data={data}
        margin={{
          top: 10,
          right: 30,
          left: 0,
          bottom: 0,
        }}
      >
        <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
        <XAxis 
          dataKey={xKey} 
          tickFormatter={formatX || formatXDefault} 
          name={xLabel}
        />
        <YAxis 
          tickFormatter={formatY || ((value) => value)} 
          name={yLabel}
        />
        <Tooltip 
          formatter={formatY || ((value) => value)}
          labelFormatter={formatX || formatXDefault}
        />
        <Area 
          type="monotone" 
          dataKey={yKey} 
          stroke={areaColor} 
          fill={areaColor} 
          fillOpacity={0.3} 
        />
      </RechartsAreaChart>
    </ResponsiveContainer>
  );
};

interface BarChartProps {
  data: any[];
  xKey: string;
  yKey: string;
  barColor?: string;
  xLabel?: string;
  yLabel?: string;
  height?: number;
  formatX?: (value: any) => string;
  formatY?: (value: any) => string;
}

export const BarChart: React.FC<BarChartProps> = ({
  data,
  xKey,
  yKey,
  barColor = '#0ea5e9',
  xLabel,
  yLabel,
  height = 300,
  formatX,
  formatY,
}) => {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <RechartsBarChart
        data={data}
        margin={{
          top: 10,
          right: 30,
          left: 0,
          bottom: 0,
        }}
      >
        <CartesianGrid strokeDasharray="3 3" opacity={0.2} vertical={false} />
        <XAxis 
          dataKey={xKey} 
          tickFormatter={formatX || ((value) => value)} 
          name={xLabel}
        />
        <YAxis 
          tickFormatter={formatY || ((value) => value)} 
          name={yLabel}
        />
        <Tooltip 
          formatter={formatY || ((value) => value)}
        />
        <Bar 
          dataKey={yKey} 
          fill={barColor} 
          radius={[4, 4, 0, 0]}
        />
      </RechartsBarChart>
    </ResponsiveContainer>
  );
};

interface PieChartProps {
  data: any[];
  nameKey: string;
  valueKey: string;
  colors?: string[];
  height?: number;
  formatValue?: (value: any) => string;
}

export const PieChart: React.FC<PieChartProps> = ({
  data,
  nameKey,
  valueKey,
  colors = ['#0ea5e9', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'],
  height = 300,
  formatValue,
}) => {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <RechartsPieChart>
        <Pie
          data={data}
          dataKey={valueKey}
          nameKey={nameKey}
          cx="50%"
          cy="50%"
          outerRadius={80}
          fill="#8884d8"
          label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
        >
          {data.map((entry, index) => (
            <Cell 
              key={`cell-${index}`} 
              fill={colors[index % colors.length]} 
            />
          ))}
        </Pie>
        <Tooltip 
          formatter={formatValue || ((value) => value)} 
        />
        <Legend />
      </RechartsPieChart>
    </ResponsiveContainer>
  );
};