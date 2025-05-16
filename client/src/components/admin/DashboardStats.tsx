import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { ArrowUp, ArrowDown } from 'lucide-react';

interface DashboardStatsProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  trend?: 'up' | 'down' | 'neutral';
  trendValue?: string;
  colorClass?: string;
  bgColorClass?: string;
}

const DashboardStats: React.FC<DashboardStatsProps> = ({
  title,
  value,
  icon,
  trend = 'neutral',
  trendValue,
  colorClass = 'text-brasil-green',
  bgColorClass = 'bg-brasil-green/10'
}) => {
  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-500">{title}</p>
            <h3 className="text-2xl font-bold mt-1">{value}</h3>
            
            {trend && trendValue && (
              <div className="flex items-center mt-2">
                {trend === 'up' ? (
                  <ArrowUp className="h-4 w-4 text-green-500 mr-1" />
                ) : trend === 'down' ? (
                  <ArrowDown className="h-4 w-4 text-red-500 mr-1" />
                ) : null}
                <span 
                  className={`text-xs font-medium ${
                    trend === 'up' 
                      ? 'text-green-500' 
                      : trend === 'down' 
                        ? 'text-red-500' 
                        : 'text-gray-500'
                  }`}
                >
                  {trendValue} {trend === 'up' ? 'increase' : trend === 'down' ? 'decrease' : ''}
                </span>
              </div>
            )}
          </div>
          
          <div className={`p-3 rounded-full ${bgColorClass}`}>
            <span className={colorClass}>
              {icon}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default DashboardStats;
