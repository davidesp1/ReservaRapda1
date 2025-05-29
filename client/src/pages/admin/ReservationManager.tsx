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
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
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
  Plus,
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
  reservation_code: string;
  date: string;
  party_size: number;
  status: string;
  payment_method: string;
  payment_status: string;
  total: number;
  notes: string;
  duration: number;
  table_number: number;
  table_capacity: number;
  eupago_entity: string;
  eupago_reference: string;
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
  const [isNewReservationModalOpen, setIsNewReservationModalOpen] = useState(false);
  const [newReservationData, setNewReservationData] = useState({
    user_id: '',
    table_id: '',
    date: '',
    time: '',
    party_size: '',
    notes: ''
  });

  // Redirect if not authenticated or not admin
  useEffect(() => {
    if (!isLoading && (!isAuthenticated || !isAdmin)) {
      setLocation('/');
    }
  }, [isAuthenticated, isAdmin, isLoading, setLocation]);

  // Fetch reservations
  const { data: reservations = [], isLoading: reservationsLoading } = useQuery<Reservation[]>({
    queryKey: ['/api/admin/reservations', { date: dateFilter, status: statusFilter !== 'all' ? statusFilter : undefined }],
    enabled: isAuthenticated && isAdmin,
    refetchInterval: 10000,
    refetchIntervalInBackground: true,
  });

  // Fetch users for new reservation form
  const { data: users = [] } = useQuery<any[]>({
    queryKey: ['/api/users'],
    enabled: isAuthenticated && isAdmin,
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/users');
      return response.json();
    },
  });

  // Fetch tables for new reservation form
  const { data: tables = [] } = useQuery<any[]>({
    queryKey: ['/api/tables'],
    enabled: isAuthenticated && isAdmin,
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/tables');
      return response.json();
    },
  });

  // Create new reservation mutation
  const createReservationMutation = useMutation({
    mutationFn: async (reservationData: any) => {
      const dateTime = `${reservationData.date}T${reservationData.time}:00`;
      const payload = {
        user_id: parseInt(reservationData.user_id),
        table_id: parseInt(reservationData.table_id),
        date: dateTime,
        party_size: parseInt(reservationData.party_size),
        notes: reservationData.notes,
        status: 'confirmed',
        payment_status: 'pending'
      };
      const response = await apiRequest('POST', '/api/reservations', payload);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: t('ReservationCreated'),
        description: t('ReservationCreatedMessage'),
      });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/reservations'] });
      setIsNewReservationModalOpen(false);
      setNewReservationData({
        user_id: '',
        table_id: '',
        date: '',
        time: '',
        party_size: '',
        notes: ''
      });
    },
    onError: (error: any) => {
      toast({
        title: t('ReservationCreateError'),
        description: error.message || t('ReservationCreateErrorMessage'),
        variant: 'destructive',
      });
    }
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
      queryClient.invalidateQueries({ queryKey: ['/api/admin/reservations'] });
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

  // Handle new reservation form
  const handleNewReservationSubmit = () => {
    if (!newReservationData.user_id || !newReservationData.table_id || !newReservationData.date || !newReservationData.time || !newReservationData.party_size) {
      toast({
        title: t('ValidationError'),
        description: t('PleaseCompleteAllFields'),
        variant: 'destructive',
      });
      return;
    }
    createReservationMutation.mutate(newReservationData);
  };

  // Handle reservation status update
  const handleStatusUpdate = (id: number, status: string) => {
    updateReservationStatusMutation.mutate({ id, status });
  };

  // Handle delete reservation
  const handleDeleteReservation = (id: number) => {
    setReservationToDelete(id);
    setIsDeleteModalOpen(true);
  };

  const confirmDelete = () => {
    if (reservationToDelete) {
      deleteReservationMutation.mutate(reservationToDelete);
    }
  };

  // Filter reservations based on search and filters
  const filteredReservations = reservations.filter((reservation) => {
    const matchesSearch = searchText === '' || 
      reservation.user_name?.toLowerCase().includes(searchText.toLowerCase()) ||
      reservation.email?.toLowerCase().includes(searchText.toLowerCase()) ||
      reservation.reservation_code?.toLowerCase().includes(searchText.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || reservation.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

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
        <Button 
          onClick={() => setIsNewReservationModalOpen(true)}
          className="bg-brasil-green hover:bg-green-700 text-white"
        >
          <Plus className="w-4 h-4 mr-2" />
          {t('NewReservation')}
        </Button>
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
                  <SelectValue placeholder={t('SelectStatus')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t('All')}</SelectItem>
                  <SelectItem value="confirmed">{t('Confirmed')}</SelectItem>
                  <SelectItem value="pending">{t('Pending')}</SelectItem>
                  <SelectItem value="cancelled">{t('Cancelled')}</SelectItem>
                  <SelectItem value="completed">{t('Completed')}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t('ReservationCode')}</TableHead>
                  <TableHead>{t('Client')}</TableHead>
                  <TableHead>{t('Table')}</TableHead>
                  <TableHead>{t('Date')}</TableHead>
                  <TableHead>{t('Guests')}</TableHead>
                  <TableHead>{t('Status')}</TableHead>
                  <TableHead>{t('Total')}</TableHead>
                  <TableHead className="text-right">{t('Actions')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredReservations.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="h-24 text-center">
                      {t('NoReservationsFound')}
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredReservations.map((reservation) => (
                    <TableRow key={reservation.id}>
                      <TableCell className="font-medium">
                        {reservation.reservation_code || `RES-${reservation.id}`}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <User className="w-4 h-4 text-gray-400" />
                          <span>{reservation.user_name || `${reservation.first_name} ${reservation.last_name}`}</span>
                        </div>
                      </TableCell>
                      <TableCell>Mesa {reservation.table_number}</TableCell>
                      <TableCell>
                        {format(new Date(reservation.date), 'dd/MM/yyyy HH:mm')}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-1">
                          <Users className="w-4 h-4 text-gray-400" />
                          <span>{reservation.party_size}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <StatusBadge status={reservation.status} />
                      </TableCell>
                      <TableCell>€{(reservation.total / 100).toFixed(2)}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end space-x-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setSelectedReservation(reservation);
                              setIsDetailsModalOpen(true);
                            }}
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteReservation(reservation.id)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* New Reservation Modal */}
      <Dialog open={isNewReservationModalOpen} onOpenChange={setIsNewReservationModalOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>{t('NewReservation')}</DialogTitle>
            <DialogDescription>
              {t('CreateNewReservationDescription')}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="client">{t('Client')}</Label>
                <Select
                  value={newReservationData.user_id}
                  onValueChange={(value) => setNewReservationData(prev => ({ ...prev, user_id: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={t('SelectClient')} />
                  </SelectTrigger>
                  <SelectContent>
                    {users.map((user: any) => (
                      <SelectItem key={user.id} value={user.id.toString()}>
                        {user.username || `${user.first_name} ${user.last_name}`}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="table">{t('Table')}</Label>
                <Select
                  value={newReservationData.table_id}
                  onValueChange={(value) => setNewReservationData(prev => ({ ...prev, table_id: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={t('SelectTable')} />
                  </SelectTrigger>
                  <SelectContent>
                    {tables.map((table: any) => (
                      <SelectItem key={table.id} value={table.id.toString()}>
                        Mesa {table.number} - {table.capacity} lugares
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="date">{t('Date')}</Label>
                <Input
                  id="date"
                  type="date"
                  value={newReservationData.date}
                  onChange={(e) => setNewReservationData(prev => ({ ...prev, date: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="time">{t('Time')}</Label>
                <Input
                  id="time"
                  type="time"
                  value={newReservationData.time}
                  onChange={(e) => setNewReservationData(prev => ({ ...prev, time: e.target.value }))}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="party_size">{t('PartySize')}</Label>
              <Input
                id="party_size"
                type="number"
                min="1"
                max="20"
                value={newReservationData.party_size}
                onChange={(e) => setNewReservationData(prev => ({ ...prev, party_size: e.target.value }))}
                placeholder={t('NumberOfGuests')}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="notes">{t('Notes')}</Label>
              <Textarea
                id="notes"
                value={newReservationData.notes}
                onChange={(e) => setNewReservationData(prev => ({ ...prev, notes: e.target.value }))}
                placeholder={t('AdditionalNotes')}
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsNewReservationModalOpen(false)}
            >
              {t('Cancel')}
            </Button>
            <Button
              type="button"
              onClick={handleNewReservationSubmit}
              disabled={createReservationMutation.isPending}
            >
              {createReservationMutation.isPending ? t('Creating') : t('CreateReservation')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reservation Details Modal */}
      <Dialog open={isDetailsModalOpen} onOpenChange={setIsDetailsModalOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>{t('ReservationDetails')}</DialogTitle>
          </DialogHeader>
          {selectedReservation && (
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <strong>{t('Client')}:</strong> {selectedReservation.user_name}
                </div>
                <div>
                  <strong>{t('Email')}:</strong> {selectedReservation.email}
                </div>
                <div>
                  <strong>{t('Phone')}:</strong> {selectedReservation.phone}
                </div>
                <div>
                  <strong>{t('Table')}:</strong> Mesa {selectedReservation.table_number}
                </div>
                <div>
                  <strong>{t('Date')}:</strong> {format(new Date(selectedReservation.date), 'dd/MM/yyyy HH:mm')}
                </div>
                <div>
                  <strong>{t('Guests')}:</strong> {selectedReservation.party_size}
                </div>
                <div>
                  <strong>{t('Status')}:</strong> <StatusBadge status={selectedReservation.status} />
                </div>
                <div>
                  <strong>{t('Total')}:</strong> €{(selectedReservation.total / 100).toFixed(2)}
                </div>
              </div>
              {selectedReservation.notes && (
                <div>
                  <strong>{t('Notes')}:</strong>
                  <p className="mt-1 text-sm text-gray-600">{selectedReservation.notes}</p>
                </div>
              )}
            </div>
          )}
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsDetailsModalOpen(false)}
            >
              {t('Close')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Modal */}
      <Dialog open={isDeleteModalOpen} onOpenChange={setIsDeleteModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('DeleteReservation')}</DialogTitle>
            <DialogDescription>
              {t('DeleteReservationConfirmation')}
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
              onClick={confirmDelete}
              disabled={deleteReservationMutation.isPending}
            >
              {deleteReservationMutation.isPending ? t('Deleting') : t('Delete')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
};

export default ReservationManager;