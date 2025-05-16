import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useLocation } from 'wouter';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import AdminLayout from '@/components/layouts/AdminLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useQuery, useMutation } from '@tanstack/react-query';
import { queryClient, apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from '@/components/ui/form';
import { PlusCircle, Pencil, Trash2, Users, Check, X, CheckSquare, XSquare, Edit, LayoutGrid, List } from 'lucide-react';
import RestaurantLayout from '@/components/admin/RestaurantLayout';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Switch } from '@/components/ui/switch';
import { TABLE_CATEGORIES } from '@/constants';
import { Badge } from '@/components/ui/badge';

// Table form schema
const tableSchema = z.object({
  number: z.coerce.number().min(1, 'Table number is required'),
  capacity: z.coerce.number().min(1, 'Capacity must be at least 1'),
  category: z.string().min(1, 'Category is required'),
  available: z.boolean().default(true),
});

const TableManager: React.FC = () => {
  const { t } = useTranslation();
  const { isAuthenticated, isAdmin, isLoading } = useAuth();
  const [_, setLocation] = useLocation();
  const { toast } = useToast();
  const [editTable, setEditTable] = useState<any | null>(null);
  const [isTableModalOpen, setIsTableModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [tableToDelete, setTableToDelete] = useState<number | null>(null);
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [viewMode, setViewMode] = useState<'table' | 'layout'>('table');

  // Fetch tables
  const { data: tables, isLoading: tablesLoading } = useQuery({
    queryKey: ['/api/tables'],
    enabled: isAuthenticated && isAdmin,
  });

  // Fetch reservations for selected date
  const { data: reservations, isLoading: reservationsLoading } = useQuery({
    queryKey: ['/api/reservations', { date: selectedDate }],
    enabled: isAuthenticated && isAdmin && !!selectedDate,
  });

  // Redirect if not authenticated or not admin
  useEffect(() => {
    if (!isLoading && (!isAuthenticated || !isAdmin)) {
      setLocation('/');
    }
  }, [isAuthenticated, isAdmin, isLoading, setLocation]);

  // Setup form
  const form = useForm<z.infer<typeof tableSchema>>({
    resolver: zodResolver(tableSchema),
    defaultValues: {
      number: 0,
      capacity: 4,
      category: 'standard',
      available: true,
    },
  });

  // Reset form when modal opens/closes
  useEffect(() => {
    if (isTableModalOpen && editTable) {
      form.reset({
        number: editTable.number.toString(),
        capacity: editTable.capacity.toString(),
        category: editTable.category,
        available: editTable.available,
      });
    } else if (isTableModalOpen && !editTable) {
      // Find the highest table number and increment by 1 for new tables
      if (tables && tables.length > 0) {
        const maxTableNumber = Math.max(...tables.map((table: any) => table.number));
        form.reset({
          number: (maxTableNumber + 1).toString(),
          capacity: '4',
          category: 'standard',
          available: true,
        });
      } else {
        form.reset({
          number: '1',
          capacity: '4',
          category: 'standard',
          available: true,
        });
      }
    }
  }, [isTableModalOpen, editTable, tables, form]);

  // Create table mutation
  const createTableMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest('POST', '/api/tables', data);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: t('TableCreated'),
        description: t('TableCreatedMessage'),
      });
      queryClient.invalidateQueries({ queryKey: ['/api/tables'] });
      setIsTableModalOpen(false);
    },
    onError: (error: any) => {
      toast({
        title: t('TableCreateError'),
        description: error.message || t('TableCreateErrorMessage'),
        variant: 'destructive',
      });
    }
  });

  // Update table mutation
  const updateTableMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number, data: any }) => {
      const response = await apiRequest('PUT', `/api/tables/${id}`, data);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: t('TableUpdated'),
        description: t('TableUpdatedMessage'),
      });
      queryClient.invalidateQueries({ queryKey: ['/api/tables'] });
      setIsTableModalOpen(false);
      setEditTable(null);
    },
    onError: (error: any) => {
      toast({
        title: t('TableUpdateError'),
        description: error.message || t('TableUpdateErrorMessage'),
        variant: 'destructive',
      });
    }
  });

  // Delete table mutation
  const deleteTableMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await apiRequest('DELETE', `/api/tables/${id}`, {});
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: t('TableDeleted'),
        description: t('TableDeletedMessage'),
      });
      queryClient.invalidateQueries({ queryKey: ['/api/tables'] });
      setIsDeleteModalOpen(false);
      setTableToDelete(null);
    },
    onError: (error: any) => {
      toast({
        title: t('TableDeleteError'),
        description: error.message || t('TableDeleteErrorMessage'),
        variant: 'destructive',
      });
    }
  });

  // Handle table form submission
  const onTableSubmit = (data: z.infer<typeof tableSchema>) => {
    if (editTable) {
      updateTableMutation.mutate({ id: editTable.id, data });
    } else {
      createTableMutation.mutate(data);
    }
  };

  // Handle table deletion
  const handleDeleteConfirm = () => {
    if (!tableToDelete) return;
    deleteTableMutation.mutate(tableToDelete);
  };

  // Check if table is reserved for the selected date
  const isTableReserved = (tableId: number) => {
    if (!reservations) return false;
    return reservations.some((reservation: any) => 
      reservation.tableId === tableId && reservation.status !== 'cancelled'
    );
  };

  // Get reservation details for a table
  const getTableReservation = (tableId: number) => {
    if (!reservations) return null;
    return reservations.find((reservation: any) => 
      reservation.tableId === tableId && reservation.status !== 'cancelled'
    );
  };

  if (tablesLoading) {
    return (
      <div className="p-6 h-full">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          <div className="h-12 bg-gray-200 rounded"></div>
          <div className="h-96 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  // Sort tables by number
  const sortedTables = [...(tables || [])].sort((a: any, b: any) => a.number - b.number);
  
  // Get statistics
  const totalTables = sortedTables.length;
  const availableTables = sortedTables.filter((table: any) => table.available).length;
  const unavailableTables = totalTables - availableTables;
  const vipTables = sortedTables.filter((table: any) => table.category === 'vip').length;
  const standardTables = totalTables - vipTables;
  const totalCapacity = sortedTables.reduce((sum: number, table: any) => sum + table.capacity, 0);
  
  // Get reserved tables for selected date
  const reservedTables = sortedTables.filter((table: any) => isTableReserved(table.id)).length;

  return (
    <AdminLayout title={t('TableManagement')}>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-montserrat font-bold">{t('TableManagement')}</h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col items-center">
              <div className="text-4xl font-bold">{totalTables}</div>
              <p className="text-gray-500 mt-2">{t('TotalTables')}</p>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col items-center">
              <div className="text-4xl font-bold text-green-600">{availableTables}</div>
              <p className="text-gray-500 mt-2">{t('AvailableTables')}</p>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col items-center">
              <div className="text-4xl font-bold text-brasil-blue">{vipTables}</div>
              <p className="text-gray-500 mt-2">{t('VIPTables')}</p>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col items-center">
              <div className="text-4xl font-bold text-brasil-yellow">{totalCapacity}</div>
              <p className="text-gray-500 mt-2">{t('TotalCapacity')}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>{t('TableAvailability')}</CardTitle>
          <CardDescription>{t('CheckTableAvailabilityForDate')}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="flex-1">
              <Input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
              />
            </div>
            <div className="flex items-center space-x-2">
              <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm flex items-center">
                <CheckSquare className="mr-1 h-4 w-4" /> {t('Available')}: {availableTables - reservedTables}
              </span>
              <span className="bg-red-100 text-red-800 px-3 py-1 rounded-full text-sm flex items-center">
                <XSquare className="mr-1 h-4 w-4" /> {t('Reserved')}: {reservedTables}
              </span>
            </div>
            <div className="flex space-x-2">
              <div className="border rounded-md flex overflow-hidden">
                <Button 
                  variant={viewMode === 'table' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('table')}
                >
                  <List className="h-4 w-4 mr-1" /> {t('List')}
                </Button>
                <Button 
                  variant={viewMode === 'layout' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('layout')}
                >
                  <LayoutGrid className="h-4 w-4 mr-1" /> {t('Layout')}
                </Button>
              </div>
              <Button 
                className="bg-brasil-green text-white"
                onClick={() => {
                  setEditTable(null);
                  setIsTableModalOpen(true);
                }}
              >
                <PlusCircle className="mr-2 h-4 w-4" /> {t('AddTable')}
              </Button>
            </div>
          </div>

          {viewMode === 'table' ? (
            <div className="border rounded-md">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t('TableNumber')}</TableHead>
                    <TableHead>{t('Capacity')}</TableHead>
                    <TableHead>{t('Category')}</TableHead>
                    <TableHead>{t('Status')}</TableHead>
                    <TableHead>{t('Availability')}</TableHead>
                    <TableHead className="text-right">{t('Actions')}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sortedTables.length > 0 ? (
                    sortedTables.map((table: any) => {
                      const reserved = isTableReserved(table.id);
                      const reservation = getTableReservation(table.id);
                      return (
                        <TableRow key={table.id}>
                          <TableCell className="font-medium">
                            {table.number}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center">
                              <Users className="mr-2 h-4 w-4 text-gray-500" />
                              {table.capacity}
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant={table.category === 'vip' ? 'secondary' : 'outline'}>
                              {table.category === 'vip' ? t('VIP') : t('Standard')}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {table.available ? (
                              <span className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs flex items-center w-fit">
                                <Check className="mr-1 h-3 w-3" /> {t('Active')}
                              </span>
                            ) : (
                              <span className="bg-red-100 text-red-800 px-2 py-1 rounded-full text-xs flex items-center w-fit">
                                <X className="mr-1 h-3 w-3" /> {t('Inactive')}
                              </span>
                            )}
                          </TableCell>
                          <TableCell>
                            {reserved ? (
                              <span className="bg-red-100 text-red-800 px-2 py-1 rounded-full text-xs flex items-center w-fit">
                                <X className="mr-1 h-3 w-3" /> {t('Reserved')}
                              </span>
                            ) : !table.available ? (
                              <span className="bg-gray-100 text-gray-800 px-2 py-1 rounded-full text-xs flex items-center w-fit">
                                <X className="mr-1 h-3 w-3" /> {t('Unavailable')}
                              </span>
                            ) : (
                              <span className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs flex items-center w-fit">
                                <Check className="mr-1 h-3 w-3" /> {t('Available')}
                              </span>
                            )}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end space-x-2">
                              <Button 
                                variant="ghost" 
                                size="icon"
                                onClick={() => {
                                  setEditTable(table);
                                  setIsTableModalOpen(true);
                                }}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button 
                                variant="ghost" 
                                size="icon"
                                onClick={() => {
                                  setTableToDelete(table.id);
                                  setIsDeleteModalOpen(true);
                                }}
                                disabled={reserved}
                              >
                                <Trash2 className="h-4 w-4 text-red-500" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      )
                    })
                  ) : (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-6 text-gray-500">
                        {t('NoTables')}
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          ) : (
            <RestaurantLayout 
              tables={sortedTables} 
              reservedTables={sortedTables
                .filter((table: any) => isTableReserved(table.id))
                .map((table: any) => table.id)
              }
              onTableClick={(tableId) => {
                const table = sortedTables.find((t: any) => t.id === tableId);
                if (table) {
                  setEditTable(table);
                  setIsTableModalOpen(true);
                }
              }}
            />
          )}
        </CardContent>
      </Card>

      {/* Table Modal */}
      <Dialog open={isTableModalOpen} onOpenChange={setIsTableModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editTable ? t('EditTable') : t('AddTable')}
            </DialogTitle>
            <DialogDescription>
              {editTable ? t('EditTableDescription') : t('AddTableDescription')}
            </DialogDescription>
          </DialogHeader>
          
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onTableSubmit)} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="number"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('TableNumber')}</FormLabel>
                      <FormControl>
                        <Input 
                          type="number"
                          min="1"
                          {...field}
                          disabled={!!editTable}
                        />
                      </FormControl>
                      <FormDescription>
                        {t('UniqueTableNumber')}
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="capacity"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('Capacity')}</FormLabel>
                      <FormControl>
                        <Input 
                          type="number"
                          min="1"
                          max="20"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <FormField
                control={form.control}
                name="category"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('Category')}</FormLabel>
                    <Select 
                      onValueChange={field.onChange} 
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder={t('SelectCategory')} />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {TABLE_CATEGORIES.map((category) => (
                          <SelectItem 
                            key={category.id} 
                            value={category.id}
                          >
                            {category.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="available"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                    <div className="space-y-0.5">
                      <FormLabel>{t('Available')}</FormLabel>
                      <FormDescription>
                        {t('TableAvailableDescription')}
                      </FormDescription>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
              
              <DialogFooter>
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setIsTableModalOpen(false)}
                >
                  {t('Cancel')}
                </Button>
                <Button 
                  type="submit"
                  disabled={createTableMutation.isPending || updateTableMutation.isPending}
                >
                  {(createTableMutation.isPending || updateTableMutation.isPending) ? (
                    <span className="flex items-center">
                      <i className="fas fa-spinner fa-spin mr-2"></i> {t('Saving')}
                    </span>
                  ) : (
                    editTable ? t('SaveChanges') : t('AddTable')
                  )}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
      
      {/* Delete Confirmation Modal */}
      <Dialog open={isDeleteModalOpen} onOpenChange={setIsDeleteModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {t('ConfirmDelete')}
            </DialogTitle>
            <DialogDescription>
              {t('DeleteTableConfirmation')}
            </DialogDescription>
          </DialogHeader>
          
          <DialogFooter>
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => setIsDeleteModalOpen(false)}
            >
              {t('Cancel')}
            </Button>
            <Button 
              type="button"
              variant="destructive"
              onClick={handleDeleteConfirm}
              disabled={deleteTableMutation.isPending}
            >
              {deleteTableMutation.isPending ? (
                <span className="flex items-center">
                  <i className="fas fa-spinner fa-spin mr-2"></i> {t('Deleting')}
                </span>
              ) : (
                t('Delete')
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
};

export default TableManager;
