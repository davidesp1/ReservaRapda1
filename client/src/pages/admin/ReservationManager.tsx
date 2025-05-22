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
import { format } from 'date-fns';
import {
  Calendar,
  Check,
  CheckCircle2,
  Clock,
  Edit,
  Eye,
  Filter,
  Search,
  Trash2,
  User,
  Users,
  X,
  XCircle
} from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';

type Reservation = {
  id: number;
  user_id: number;
  table_id: number;
  user_name: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  confirmation_code: string;
  date: string;
  party_size: number;
  status: 'confirmed' | 'pending' | 'cancelled' | 'completed';
  payment_method: string;
  payment_status: string;
  total: number;
  table_number: number;
  table_capacity: number;
};

const ReservationManager: React.FC = () => {
  const { t } = useTranslation();
  const { isAuthenticated, isAdmin, isLoading } = useAuth();
  const [_, setLocation] = useLocation();
  const { toast } = useToast();
  const [searchText, setSearchText] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [dateFilter, setDateFilter] = useState<string>(new Date().toISOString().split('T')[0]);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [selectedReservation, setSelectedReservation] = useState<Reservation | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [reservationToDelete, setReservationToDelete] = useState<number | null>(null);

  // Redirect if not authenticated or not admin
  useEffect(() => {
    if (!isLoading && (!isAuthenticated || !isAdmin)) {
      setLocation('/');
    }
  }, [isAuthenticated, isAdmin, isLoading, setLocation]);

  // Fetch reservations - Com atualização automática a cada 10 segundos
  const { data: reservations = [], isLoading: reservationsLoading } = useQuery<Reservation[]>({
    queryKey: ['/api/admin/reservations', { date: dateFilter, status: statusFilter !== 'all' ? statusFilter : undefined }],
    enabled: isAuthenticated && isAdmin,
    refetchInterval: 10000, // Refetch a cada 10 segundos para ter dados em tempo real
    refetchIntervalInBackground: true, // Continua atualizando mesmo quando a aba não está em foco
  });

  // Fetch tables for reference - Com atualização a cada 30 segundos
  const { data: tables = [] } = useQuery<any[]>({
    queryKey: ['/api/tables'],
    enabled: isAuthenticated && isAdmin,
    refetchInterval: 30000, // Refetch a cada 30 segundos
  });

  // Fetch users for reference - Com atualização a cada minuto
  const { data: users = [] } = useQuery<any[]>({
    queryKey: ['/api/users'],
    enabled: isAuthenticated && isAdmin,
    refetchInterval: 60000, // Refetch a cada 60 segundos
  });

  // Update reservation status mutation
  const updateReservationStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: number, status: string }) => {
      const response = await apiRequest('PUT', `/api/reservations/${id}`, { status });
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: t('ReservationUpdated'),
        description: t('ReservationStatusUpdatedMessage'),
      });
      queryClient.invalidateQueries({ queryKey: ['/api/reservations'] });
      setIsDetailsModalOpen(false);
    },
    onError: (error: any) => {
      toast({
        title: t('ReservationUpdateError'),
        description: error.message || t('ReservationUpdateErrorMessage'),
        variant: 'destructive',
      });
    }
  });

  // Delete reservation mutation
  const deleteReservationMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await apiRequest('DELETE', `/api/reservations/${id}`, {});
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: t('ReservationDeleted'),
        description: t('ReservationDeletedMessage'),
      });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/reservations'] });
      setIsDeleteModalOpen(false);
      setReservationToDelete(null);
    },
    onError: (error: any) => {
      toast({
        title: t('ReservationDeleteError'),
        description: error.message || t('ReservationDeleteErrorMessage'),
        variant: 'destructive',
      });
    }
  });

  // Handle reservation status update
  const handleStatusUpdate = (id: number, status: string) => {
    updateReservationStatusMutation.mutate({ id, status });
  };

  // Handle reservation deletion
  const handleDeleteConfirm = () => {
    if (!reservationToDelete) return;
    deleteReservationMutation.mutate(reservationToDelete);
  };

  // Filter reservations based on search text
  const filteredReservations = React.useMemo(() => {
    if (!reservations) return [];
    
    return reservations.filter((reservation: any) => {
      const searchLower = searchText.toLowerCase();
      
      // Include reservations that match the search text
      const matchesSearch = 
        (reservation.confirmation_code && reservation.confirmation_code.toLowerCase().includes(searchLower)) ||
        (reservation.user_name && reservation.user_name.toLowerCase().includes(searchLower));
      
      return matchesSearch;
    });
  }, [reservations, searchText]);

  // Get table details
  const getTableDetails = (tableId: number) => {
    const table = tables.find((t: any) => t.id === tableId);
    return table ? `${t('Table')} ${table.number} (${table.capacity} ${t('Seats')})` : `${t('Table')} ${tableId}`;
  };

  // Get user details
  const getUserDetails = (userId: number) => {
    const user = users.find((u: any) => u.id === userId);
    return user ? `${user.firstName} ${user.lastName}` : `${t('User')} ${userId}`;
  };

  // Format date and time
  const formatDateTime = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return format(date, 'dd/MM/yyyy HH:mm');
    } catch (error) {
      return dateString;
    }
  };

  // Status badge component
  const StatusBadge = ({ status }: { status: string }) => {
    switch (status) {
      case 'confirmed':
        return (
          <Badge className="bg-green-100 text-green-800 hover:bg-green-200">
            <CheckCircle2 className="w-3 h-3 mr-1" /> {t('Confirmed')}
          </Badge>
        );
      case 'pending':
        return (
          <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-200">
            <Clock className="w-3 h-3 mr-1" /> {t('Pending')}
          </Badge>
        );
      case 'cancelled':
        return (
          <Badge className="bg-red-100 text-red-800 hover:bg-red-200">
            <XCircle className="w-3 h-3 mr-1" /> {t('Cancelled')}
          </Badge>
        );
      case 'completed':
        return (
          <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-200">
            <Check className="w-3 h-3 mr-1" /> {t('Completed')}
          </Badge>
        );
      default:
        return (
          <Badge className="bg-gray-100 text-gray-800 hover:bg-gray-200">
            {status}
          </Badge>
        );
    }
  };

  if (reservationsLoading) {
    return (
      <AdminLayout title={t('ReservationManagement')}>
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          <div className="h-12 bg-gray-200 rounded"></div>
          <div className="h-96 bg-gray-200 rounded"></div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title={t('ReservationManagement')}>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-montserrat font-bold">{t('ReservationManagement')}</h1>
      </div>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>{t('Reservations')}</CardTitle>
          <CardDescription>{t('ManageAllReservations')}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <Input
                placeholder={t('SearchReservations')}
                className="pl-10"
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
              />
            </div>

            <div className="flex space-x-2">
              <Input
                type="date"
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
                className="w-40"
              />

              <Select
                value={statusFilter}
                onValueChange={setStatusFilter}
              >
                <SelectTrigger className="w-40">
                  <SelectValue placeholder={t('Status')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t('AllStatuses')}</SelectItem>
                  <SelectItem value="confirmed">{t('Confirmed')}</SelectItem>
                  <SelectItem value="pending">{t('Pending')}</SelectItem>
                  <SelectItem value="cancelled">{t('Cancelled')}</SelectItem>
                  <SelectItem value="completed">{t('Completed')}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="border rounded-md">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t('Code')}</TableHead>
                  <TableHead>{t('Guest')}</TableHead>
                  <TableHead>{t('Table')}</TableHead>
                  <TableHead>{t('Date')}</TableHead>
                  <TableHead>{t('PartySize')}</TableHead>
                  <TableHead>{t('Status')}</TableHead>
                  <TableHead className="text-right">{t('Actions')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredReservations.length > 0 ? (
                  filteredReservations.map((reservation: Reservation) => (
                    <TableRow key={reservation.id}>
                      <TableCell className="font-medium">
                        {reservation.confirmation_code}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center">
                          <User className="mr-2 h-4 w-4 text-gray-400" />
                          {reservation.user_name || getUserDetails(reservation.user_id)}
                        </div>
                      </TableCell>
                      <TableCell>{getTableDetails(reservation.table_id)}</TableCell>
                      <TableCell>{formatDateTime(reservation.date)}</TableCell>
                      <TableCell>
                        <div className="flex items-center">
                          <Users className="mr-2 h-4 w-4 text-gray-400" />
                          {reservation.party_size}
                        </div>
                      </TableCell>
                      <TableCell>
                        <StatusBadge status={reservation.status} />
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end space-x-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => {
                              setSelectedReservation(reservation);
                              setIsDetailsModalOpen(true);
                            }}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => {
                              setReservationToDelete(reservation.id);
                              setIsDeleteModalOpen(true);
                            }}
                          >
                            <Trash2 className="h-4 w-4 text-red-500" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8">
                      <div className="flex flex-col items-center justify-center text-gray-500">
                        <Calendar className="h-12 w-12 mb-2 opacity-20" />
                        <p className="text-lg font-medium">{t('NoReservationsFound')}</p>
                        <p className="text-sm">{t('TryChangingFilters')}</p>
                      </div>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Reservation Details Modal */}
      <Dialog open={isDetailsModalOpen} onOpenChange={setIsDetailsModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{t('ReservationDetails')}</DialogTitle>
            <DialogDescription>
              {t('ReservationDetailsDescription')}
            </DialogDescription>
          </DialogHeader>
          
          {selectedReservation && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-gray-500">{t('Code')}</p>
                  <p className="font-medium">{selectedReservation.confirmation_code}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">{t('Status')}</p>
                  <StatusBadge status={selectedReservation.status} />
                </div>
              </div>
              
              <div>
                <p className="text-sm font-medium text-gray-500">{t('Guest')}</p>
                <p className="font-medium">{selectedReservation.user_name || getUserDetails(selectedReservation.user_id)}</p>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-gray-500">{t('Date')}</p>
                  <p className="font-medium">{formatDateTime(selectedReservation.date)}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">{t('PartySize')}</p>
                  <p className="font-medium">{selectedReservation.party_size} {t('People')}</p>
                </div>
              </div>
              
              <div>
                <p className="text-sm font-medium text-gray-500">{t('Table')}</p>
                <p className="font-medium">{getTableDetails(selectedReservation.table_id)}</p>
              </div>
              
              <div className="border-t pt-4">
                <p className="text-sm font-medium mb-2">{t('UpdateStatus')}</p>
                <div className="flex flex-wrap gap-2">
                  <Button
                    size="sm"
                    variant={selectedReservation.status === 'confirmed' ? 'default' : 'outline'}
                    className={selectedReservation.status === 'confirmed' ? 'bg-green-600' : ''}
                    onClick={() => handleStatusUpdate(selectedReservation.id, 'confirmed')}
                  >
                    <Check className="mr-1 h-4 w-4" /> {t('Confirm')}
                  </Button>
                  <Button
                    size="sm"
                    variant={selectedReservation.status === 'completed' ? 'default' : 'outline'}
                    className={selectedReservation.status === 'completed' ? 'bg-blue-600' : ''}
                    onClick={() => handleStatusUpdate(selectedReservation.id, 'completed')}
                  >
                    <CheckCircle2 className="mr-1 h-4 w-4" /> {t('Complete')}
                  </Button>
                  <Button
                    size="sm"
                    variant={selectedReservation.status === 'cancelled' ? 'default' : 'outline'}
                    className={selectedReservation.status === 'cancelled' ? 'bg-red-600' : ''}
                    onClick={() => handleStatusUpdate(selectedReservation.id, 'cancelled')}
                  >
                    <X className="mr-1 h-4 w-4" /> {t('Cancel')}
                  </Button>
                </div>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDetailsModalOpen(false)}>
              {t('Close')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Modal */}
      <Dialog open={isDeleteModalOpen} onOpenChange={setIsDeleteModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{t('ConfirmDeletion')}</DialogTitle>
            <DialogDescription>
              {t('DeleteReservationConfirmation')}
            </DialogDescription>
          </DialogHeader>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteModalOpen(false)}>
              {t('Cancel')}
            </Button>
            <Button 
              variant="destructive" 
              onClick={handleDeleteConfirm}
            >
              {t('Delete')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
};

export default ReservationManager;