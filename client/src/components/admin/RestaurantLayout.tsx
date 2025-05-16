import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Users, Check, X } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface TableItem {
  id: number;
  number: number;
  capacity: number;
  category: string;
  available: boolean;
}

interface RestaurantLayoutProps {
  tables: TableItem[];
  reservedTables: number[];
  onTableClick?: (tableId: number) => void;
}

const RestaurantLayout: React.FC<RestaurantLayoutProps> = ({
  tables,
  reservedTables,
  onTableClick
}) => {
  const { t } = useTranslation();

  // Define table size based on capacity
  const getTableSize = (capacity: number) => {
    if (capacity <= 2) return 'sm';
    if (capacity <= 4) return 'md';
    if (capacity <= 6) return 'lg';
    return 'xl';
  };

  // Get table status class
  const getTableStatusClass = (table: TableItem) => {
    const isReserved = reservedTables.includes(table.id);
    
    if (isReserved) return 'bg-red-100 border-red-400 text-red-800';
    if (!table.available) return 'bg-gray-100 border-gray-400 text-gray-800';
    return 'bg-green-100 border-green-400 text-green-800';
  };

  // Get table icon
  const getTableIcon = (table: TableItem) => {
    const isReserved = reservedTables.includes(table.id);
    
    if (isReserved) return <X className="h-3 w-3 mr-1" />;
    if (!table.available) return <X className="h-3 w-3 mr-1" />;
    return <Check className="h-3 w-3 mr-1" />;
  };

  // Get table status text
  const getTableStatus = (table: TableItem) => {
    const isReserved = reservedTables.includes(table.id);
    
    if (isReserved) return t('Reserved');
    if (!table.available) return t('Unavailable');
    return t('Available');
  };

  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle>{t('RestaurantLayout')}</CardTitle>
        <CardDescription>{t('VisualRepresentationOfTables')}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="p-4 border rounded-md bg-gray-50 relative">
          {/* Legend */}
          <div className="absolute top-4 right-4 flex flex-col gap-2 bg-white p-3 rounded-md border shadow-sm">
            <div className="text-sm font-semibold mb-1">{t('Legend')}:</div>
            <div className="flex items-center text-xs">
              <div className="w-4 h-4 bg-green-100 border border-green-400 rounded-md mr-2"></div>
              <span>{t('Available')}</span>
            </div>
            <div className="flex items-center text-xs">
              <div className="w-4 h-4 bg-red-100 border border-red-400 rounded-md mr-2"></div>
              <span>{t('Reserved')}</span>
            </div>
            <div className="flex items-center text-xs">
              <div className="w-4 h-4 bg-gray-100 border border-gray-400 rounded-md mr-2"></div>
              <span>{t('Unavailable')}</span>
            </div>
            <div className="flex items-center text-xs mt-2">
              <div className="w-4 h-4 bg-purple-100 border border-purple-400 rounded-md mr-2"></div>
              <span>{t('VIP')}</span>
            </div>
          </div>
          
          {/* Restaurant Layout Grid */}
          <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-6 p-8">
            {tables.map((table) => {
              const tableSize = getTableSize(table.capacity);
              const statusClass = getTableStatusClass(table);
              const isVip = table.category === 'vip';
              const vipClass = isVip ? 'border-purple-400 bg-purple-50' : '';
              
              return (
                <TooltipProvider key={table.id}>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div 
                        className={`table-item relative cursor-pointer border-2 ${statusClass} ${vipClass} rounded-md 
                                   hover:shadow-md transition-all duration-200 transform hover:scale-105`}
                        onClick={() => onTableClick && onTableClick(table.id)}
                      >
                        <div className={`
                          ${tableSize === 'sm' ? 'w-16 h-16' : ''}
                          ${tableSize === 'md' ? 'w-20 h-20' : ''}
                          ${tableSize === 'lg' ? 'w-24 h-24' : ''}
                          ${tableSize === 'xl' ? 'w-28 h-28' : ''}
                          flex flex-col items-center justify-center p-2
                        `}>
                          <div className="font-bold text-lg">{table.number}</div>
                          <div className="flex items-center text-xs mt-1">
                            <Users className="h-3 w-3 mr-1" /> {table.capacity}
                          </div>
                          <div className="absolute bottom-1 right-1 flex items-center text-xs">
                            {getTableIcon(table)}
                          </div>
                          {isVip && (
                            <Badge variant="secondary" className="absolute top-1 right-1 text-[9px] py-0 px-1">
                              VIP
                            </Badge>
                          )}
                        </div>
                      </div>
                    </TooltipTrigger>
                    <TooltipContent>
                      <div className="text-sm">
                        <p className="font-semibold">{t('Table')} {table.number}</p>
                        <p>{t('Capacity')}: {table.capacity}</p>
                        <p>{t('Category')}: {table.category === 'vip' ? t('VIP') : t('Standard')}</p>
                        <p>{t('Status')}: {getTableStatus(table)}</p>
                      </div>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              );
            })}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default RestaurantLayout;