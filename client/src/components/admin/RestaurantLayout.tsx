import React from 'react';
import { useTranslation } from 'react-i18next';
import { 
  Check, 
  X, 
  Users, 
  Coffee,
  Circle,
  Triangle,
  Square 
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface TableShape {
  id: number;
  number: number;
  capacity: number;
  category: string;
  available: boolean;
}

interface RestaurantLayoutProps {
  tables: TableShape[];
  reservedTables: number[];
  onTableClick: (tableId: number) => void;
}

const RestaurantLayout: React.FC<RestaurantLayoutProps> = ({ 
  tables, 
  reservedTables, 
  onTableClick 
}) => {
  const { t } = useTranslation();
  
  // Calculate grid size dynamically based on table count
  const gridSize = Math.ceil(Math.sqrt(tables.length)) + 1;
  
  // Group tables by area (we'll simulate areas based on table numbers)
  const areas = {
    dining: tables.filter(table => table.number <= 10),
    bar: tables.filter(table => table.number > 10 && table.number <= 15),
    patio: tables.filter(table => table.number > 15),
  };

  // Function to determine table status color
  const getTableColor = (table: TableShape) => {
    if (!table.available) return 'bg-gray-400'; // Inactive table
    if (reservedTables.includes(table.id)) return 'bg-red-500'; // Reserved table
    return 'bg-green-500'; // Available table
  };

  // Function to get icon based on table capacity
  const getTableIcon = (capacity: number) => {
    if (capacity <= 2) return Circle;
    if (capacity <= 4) return Square;
    return Triangle;
  };

  return (
    <div className="p-4 bg-white rounded-md border">
      <div className="flex justify-between mb-6">
        <div className="flex space-x-4">
          <div className="flex items-center">
            <div className="w-4 h-4 bg-green-500 rounded-full mr-2"></div>
            <span className="text-sm">{t('Available')}</span>
          </div>
          <div className="flex items-center">
            <div className="w-4 h-4 bg-red-500 rounded-full mr-2"></div>
            <span className="text-sm">{t('Reserved')}</span>
          </div>
          <div className="flex items-center">
            <div className="w-4 h-4 bg-gray-400 rounded-full mr-2"></div>
            <span className="text-sm">{t('Inactive')}</span>
          </div>
        </div>
        <div className="flex space-x-4">
          <div className="flex items-center">
            <Circle className="text-gray-500 mr-2 h-4 w-4" />
            <span className="text-sm">{t('SmallTable')}</span>
          </div>
          <div className="flex items-center">
            <Square className="text-gray-500 mr-2 h-4 w-4" />
            <span className="text-sm">{t('MediumTable')}</span>
          </div>
          <div className="flex items-center">
            <Triangle className="text-gray-500 mr-2 h-4 w-4" />
            <span className="text-sm">{t('LargeTable')}</span>
          </div>
        </div>
      </div>
      
      <div className="grid grid-cols-1 gap-6">
        {/* Dining Area */}
        <div className="p-4 border rounded-md bg-gray-50">
          <h3 className="font-semibold mb-4 flex items-center">
            <Coffee className="mr-2 h-5 w-5 text-brasil-green" /> 
            {t('DiningArea')}
          </h3>
          <div className="grid grid-cols-5 gap-4">
            {areas.dining.map(table => {
              const TableIcon = getTableIcon(table.capacity);
              return (
                <TooltipProvider key={table.id}>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button
                        onClick={() => onTableClick(table.id)}
                        className={`relative flex justify-center items-center w-16 h-16 rounded-md ${getTableColor(table)} hover:opacity-80 transition-opacity`}
                      >
                        <TableIcon className="text-white h-8 w-8" />
                        <span className="absolute top-1 left-1 text-xs font-bold text-white">
                          {table.number}
                        </span>
                        <span className="absolute bottom-1 right-1 text-xs font-bold text-white flex items-center">
                          <Users className="mr-1 h-3 w-3" />
                          {table.capacity}
                        </span>
                      </button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <div className="p-2">
                        <div className="font-semibold">{t('Table')} {table.number}</div>
                        <div className="flex items-center text-sm">
                          <Users className="mr-1 h-3 w-3" /> {table.capacity} {t('People')}
                        </div>
                        <div className="mt-1">
                          <Badge variant={table.category === 'vip' ? 'secondary' : 'outline'}>
                            {table.category === 'vip' ? t('VIP') : t('Standard')}
                          </Badge>
                        </div>
                        <div className="mt-1 text-sm">
                          {!table.available ? (
                            <span className="flex items-center text-red-600">
                              <X className="mr-1 h-3 w-3" /> {t('Inactive')}
                            </span>
                          ) : reservedTables.includes(table.id) ? (
                            <span className="flex items-center text-red-600">
                              <X className="mr-1 h-3 w-3" /> {t('Reserved')}
                            </span>
                          ) : (
                            <span className="flex items-center text-green-600">
                              <Check className="mr-1 h-3 w-3" /> {t('Available')}
                            </span>
                          )}
                        </div>
                      </div>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              );
            })}
          </div>
        </div>
        
        {/* Bar Area */}
        {areas.bar.length > 0 && (
          <div className="p-4 border rounded-md bg-gray-50">
            <h3 className="font-semibold mb-4 flex items-center">
              <Coffee className="mr-2 h-5 w-5 text-brasil-green" /> 
              {t('BarArea')}
            </h3>
            <div className="grid grid-cols-5 gap-4">
              {areas.bar.map(table => {
                const TableIcon = getTableIcon(table.capacity);
                return (
                  <TooltipProvider key={table.id}>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <button
                          onClick={() => onTableClick(table.id)}
                          className={`relative flex justify-center items-center w-16 h-16 rounded-md ${getTableColor(table)} hover:opacity-80 transition-opacity`}
                        >
                          <TableIcon className="text-white h-8 w-8" />
                          <span className="absolute top-1 left-1 text-xs font-bold text-white">
                            {table.number}
                          </span>
                          <span className="absolute bottom-1 right-1 text-xs font-bold text-white flex items-center">
                            <Users className="mr-1 h-3 w-3" />
                            {table.capacity}
                          </span>
                        </button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <div className="p-2">
                          <div className="font-semibold">{t('Table')} {table.number}</div>
                          <div className="flex items-center text-sm">
                            <Users className="mr-1 h-3 w-3" /> {table.capacity} {t('People')}
                          </div>
                          <div className="mt-1">
                            <Badge variant={table.category === 'vip' ? 'secondary' : 'outline'}>
                              {table.category === 'vip' ? t('VIP') : t('Standard')}
                            </Badge>
                          </div>
                          <div className="mt-1 text-sm">
                            {!table.available ? (
                              <span className="flex items-center text-red-600">
                                <X className="mr-1 h-3 w-3" /> {t('Inactive')}
                              </span>
                            ) : reservedTables.includes(table.id) ? (
                              <span className="flex items-center text-red-600">
                                <X className="mr-1 h-3 w-3" /> {t('Reserved')}
                              </span>
                            ) : (
                              <span className="flex items-center text-green-600">
                                <Check className="mr-1 h-3 w-3" /> {t('Available')}
                              </span>
                            )}
                          </div>
                        </div>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                );
              })}
            </div>
          </div>
        )}
        
        {/* Patio Area */}
        {areas.patio.length > 0 && (
          <div className="p-4 border rounded-md bg-gray-50">
            <h3 className="font-semibold mb-4 flex items-center">
              <Coffee className="mr-2 h-5 w-5 text-brasil-green" /> 
              {t('PatioArea')}
            </h3>
            <div className="grid grid-cols-5 gap-4">
              {areas.patio.map(table => {
                const TableIcon = getTableIcon(table.capacity);
                return (
                  <TooltipProvider key={table.id}>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <button
                          onClick={() => onTableClick(table.id)}
                          className={`relative flex justify-center items-center w-16 h-16 rounded-md ${getTableColor(table)} hover:opacity-80 transition-opacity`}
                        >
                          <TableIcon className="text-white h-8 w-8" />
                          <span className="absolute top-1 left-1 text-xs font-bold text-white">
                            {table.number}
                          </span>
                          <span className="absolute bottom-1 right-1 text-xs font-bold text-white flex items-center">
                            <Users className="mr-1 h-3 w-3" />
                            {table.capacity}
                          </span>
                        </button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <div className="p-2">
                          <div className="font-semibold">{t('Table')} {table.number}</div>
                          <div className="flex items-center text-sm">
                            <Users className="mr-1 h-3 w-3" /> {table.capacity} {t('People')}
                          </div>
                          <div className="mt-1">
                            <Badge variant={table.category === 'vip' ? 'secondary' : 'outline'}>
                              {table.category === 'vip' ? t('VIP') : t('Standard')}
                            </Badge>
                          </div>
                          <div className="mt-1 text-sm">
                            {!table.available ? (
                              <span className="flex items-center text-red-600">
                                <X className="mr-1 h-3 w-3" /> {t('Inactive')}
                              </span>
                            ) : reservedTables.includes(table.id) ? (
                              <span className="flex items-center text-red-600">
                                <X className="mr-1 h-3 w-3" /> {t('Reserved')}
                              </span>
                            ) : (
                              <span className="flex items-center text-green-600">
                                <Check className="mr-1 h-3 w-3" /> {t('Available')}
                              </span>
                            )}
                          </div>
                        </div>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default RestaurantLayout;