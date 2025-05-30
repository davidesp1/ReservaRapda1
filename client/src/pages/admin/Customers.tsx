import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useLocation } from 'wouter';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Search, UserPlus, Eye, Edit, Trash2, Key, Lock, Plus, Minus, Euro } from 'lucide-react';
import AdminLayout from '@/components/layouts/AdminLayout';
import { useToast } from '@/hooks/use-toast';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from '@/components/ui/label';
import { apiRequest } from '@/lib/queryClient';
import { useForm } from 'react-hook-form';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

const Customers: React.FC = () => {
  const { t } = useTranslation();
  const { isAuthenticated, isAdmin, isLoading } = useAuth();
  const [_, setLocation] = useLocation();
  const [searchText, setSearchText] = useState('');
  const [viewCustomerInfo, setViewCustomerInfo] = useState<any>(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<any>(null);
  const [isBalanceModalOpen, setIsBalanceModalOpen] = useState(false);
  const [balanceAmount, setBalanceAmount] = useState('');
  const [balanceOperation, setBalanceOperation] = useState<'add' | 'remove'>('add');
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Form para edição de cliente
  const form = useForm({
    defaultValues: {
      username: '',
      email: '',
      first_name: '',
      last_name: '',
      phone: '',
      role: 'customer',
      status: 'active',
      password: '********' // Senha oculta
    }
  });
  
  // Fetch customers com atualizações em tempo real
  const { data: customers, isLoading: customersLoading } = useQuery<any>({
    queryKey: ['/api/users'],
    enabled: isAuthenticated && isAdmin,
    refetchInterval: 30000, // Atualiza a cada 30 segundos
    refetchIntervalInBackground: true,
    staleTime: 10000, // Considera os dados obsoletos após 10 segundos
  });

  // Filter customers based on search
  const filteredCustomers = React.useMemo(() => {
    if (!customers) return [];
    
    return customers.filter((customer: any) => {
      const searchLower = searchText.toLowerCase();
      return (
        (customer.first_name && customer.first_name.toLowerCase().includes(searchLower)) ||
        (customer.last_name && customer.last_name.toLowerCase().includes(searchLower)) ||
        (customer.email && customer.email.toLowerCase().includes(searchLower)) ||
        (customer.username && customer.username.toLowerCase().includes(searchLower))
      );
    });
  }, [customers, searchText]);
  
  // Mutation para atualizar usuário
  const updateUserMutation = useMutation({
    mutationFn: async (userData: any) => {
      const response = await apiRequest('PUT', `/api/users/${userData.id}`, userData);
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Erro ao atualizar usuário');
      }
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: t('CustomerUpdated'),
        description: t('CustomerUpdatedSuccessfully'),
        variant: 'default',
      });
      setIsEditModalOpen(false);
      queryClient.invalidateQueries({ queryKey: ['/api/users'] });
    },
    onError: (error: any) => {
      toast({
        title: t('Error'),
        description: error.message,
        variant: 'destructive',
      });
    }
  });

  // Mutation para atualizar saldo do cliente
  const updateBalanceMutation = useMutation({
    mutationFn: async ({ userId, amount, operation }: { userId: number, amount: number, operation: 'add' | 'remove' }) => {
      const response = await apiRequest('POST', '/api/users/balance', { userId, amount, operation });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Erro ao atualizar saldo');
      }
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: t('Success'),
        description: balanceOperation === 'add' ? t('BalanceAdded') : t('BalanceRemoved'),
      });
      setIsBalanceModalOpen(false);
      setBalanceAmount('');
      queryClient.invalidateQueries({ queryKey: ['/api/users'] });
    },
    onError: (error: any) => {
      toast({
        title: t('Error'),
        description: error.message,
        variant: 'destructive',
      });
    }
  });
  
  // Abrir modal de visualização do cliente
  const handleViewCustomer = (customer: any) => {
    setViewCustomerInfo(customer);
    setIsViewModalOpen(true);
  };
  
  // Abrir modal de edição do cliente
  const handleEditCustomer = (customer: any) => {
    setSelectedCustomer(customer);
    form.reset({
      username: customer.username,
      email: customer.email,
      first_name: customer.first_name,
      last_name: customer.last_name,
      phone: customer.phone || '',
      role: customer.role || 'customer',
      status: customer.status || 'active',
      password: '********' // Senha oculta
    });
    setIsEditModalOpen(true);
  };
  
  // Abrir modal de confirmação de exclusão
  const handleDeleteConfirm = (customer: any) => {
    setSelectedCustomer(customer);
    setIsDeleteModalOpen(true);
  };

  // Função para abrir modal de saldo
  const handleBalanceOperation = (customer: any, operation: 'add' | 'remove') => {
    setSelectedCustomer(customer);
    setBalanceOperation(operation);
    setBalanceAmount('');
    setIsBalanceModalOpen(true);
  };
  
  // Enviar o formulário de edição
  const onSubmit = (data: any) => {
    // Remover a senha do objeto se não foi alterada (continua sendo asteriscos)
    if (data.password === '********') {
      delete data.password;
    }
    
    // Adicionar ID do cliente
    const userData = {
      ...data,
      id: selectedCustomer.id,
      firstName: data.first_name,
      lastName: data.last_name,
      postalCode: selectedCustomer.postal_code,
      loyaltyPoints: selectedCustomer.loyalty_points
    };
    
    updateUserMutation.mutate(userData);
  };

  // Função para processar alteração de saldo
  const handleBalanceSubmit = () => {
    const amount = parseFloat(balanceAmount);
    if (!amount || amount <= 0) {
      toast({
        title: t('Error'),
        description: 'Por favor, insira um valor válido',
        variant: 'destructive',
      });
      return;
    }

    // Converter para centavos
    const amountInCents = Math.round(amount * 100);

    updateBalanceMutation.mutate({
      userId: selectedCustomer.id,
      amount: amountInCents,
      operation: balanceOperation
    });
  };
  
  if (customersLoading) {
    return (
      <AdminLayout title={t('Customers')}>
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          <div className="h-12 bg-gray-200 rounded"></div>
          <div className="h-96 bg-gray-200 rounded"></div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title={t('Customers')}>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-montserrat font-bold">{t('Customers')}</h1>
      </div>
      
      <Card className="mb-6">
        <CardHeader className="pb-3">
          <CardTitle>{t('ManageCustomers')}</CardTitle>
          <CardDescription>{t('ViewAndManageAllCustomers')}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <Input
                placeholder={t('SearchCustomers')}
                className="pl-10"
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
              />
            </div>
            <Button 
              className="bg-brasil-green text-white hover:bg-brasil-green/90"
              onClick={() => setLocation('/admin/customers/add')}
            >
              <UserPlus className="mr-2 h-4 w-4" /> {t('AddCustomer')}
            </Button>
          </div>
          
          <div className="border rounded-md">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t('Name')}</TableHead>
                  <TableHead>{t('Email')}</TableHead>
                  <TableHead>{t('Username')}</TableHead>
                  <TableHead>{t('Phone')}</TableHead>
                  <TableHead className="text-center">{t('Balance')}</TableHead>
                  <TableHead className="text-right">{t('Actions')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredCustomers.length > 0 ? (
                  filteredCustomers.map((customer: any) => (
                    <TableRow key={customer.id}>
                      <TableCell className="font-medium">
                        {customer.first_name} {customer.last_name}
                      </TableCell>
                      <TableCell>{customer.email}</TableCell>
                      <TableCell>{customer.username}</TableCell>
                      <TableCell>{customer.phone || '-'}</TableCell>
                      <TableCell className="text-center">
                        <div className="flex items-center justify-center space-x-2">
                          <span className="font-medium">€{((customer.balance || 0) / 100).toFixed(2)}</span>
                          <div className="flex space-x-1">
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              onClick={() => handleBalanceOperation(customer, 'add')}
                              className="h-6 w-6 p-0 text-green-600 hover:text-green-700"
                            >
                              <Plus className="h-3 w-3" />
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              onClick={() => handleBalanceOperation(customer, 'remove')}
                              className="h-6 w-6 p-0 text-red-600 hover:text-red-700"
                            >
                              <Minus className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end space-x-2">
                          <Button variant="ghost" size="icon" onClick={() => handleViewCustomer(customer)}>
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => handleEditCustomer(customer)}>
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => handleDeleteConfirm(customer)}>
                            <Trash2 className="h-4 w-4 text-red-500" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-6 text-gray-500">
                      {searchText ? t('NoCustomersFound') : t('NoCustomers')}
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
      
      {/* View Customer Dialog */}
      <Dialog open={isViewModalOpen} onOpenChange={setIsViewModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{t('CustomerDetails')}</DialogTitle>
            <DialogDescription>
              {viewCustomerInfo ? `${viewCustomerInfo.first_name} ${viewCustomerInfo.last_name}` : ''}
            </DialogDescription>
          </DialogHeader>
          
          {viewCustomerInfo && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-500">{t('FirstName')}</label>
                  <p className="font-semibold">{viewCustomerInfo.first_name}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">{t('LastName')}</label>
                  <p className="font-semibold">{viewCustomerInfo.last_name}</p>
                </div>
              </div>
              
              <div>
                <label className="text-sm font-medium text-gray-500">{t('Email')}</label>
                <p className="font-semibold">{viewCustomerInfo.email}</p>
              </div>
              
              <div>
                <label className="text-sm font-medium text-gray-500">{t('Username')}</label>
                <p className="font-semibold">{viewCustomerInfo.username}</p>
              </div>
              
              <div>
                <label className="text-sm font-medium text-gray-500">{t('Phone')}</label>
                <p className="font-semibold">{viewCustomerInfo.phone || '-'}</p>
              </div>
              
              <div>
                <label className="text-sm font-medium text-gray-500">{t('Role')}</label>
                <p className="font-semibold capitalize">{viewCustomerInfo.role}</p>
              </div>
              
              <div>
                <label className="text-sm font-medium text-gray-500">{t('PreferredLanguage')}</label>
                <p className="font-semibold">
                  {viewCustomerInfo.preferences?.language || 'pt'}
                </p>
              </div>
            </div>
          )}
          
          <DialogFooter className="flex sm:justify-between mt-4">
            <Button variant="outline" onClick={() => setIsViewModalOpen(false)}>
              {t('Close')}
            </Button>
            <Button onClick={() => {
              setIsViewModalOpen(false);
              handleEditCustomer(viewCustomerInfo);
            }}>
              <Edit className="mr-2 h-4 w-4" /> {t('EditCustomer')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Edit Customer Dialog */}
      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{t('EditCustomer')}</DialogTitle>
            <DialogDescription>
              {selectedCustomer ? t('EditingCustomer', { name: `${selectedCustomer.first_name} ${selectedCustomer.last_name}` }) : ''}
            </DialogDescription>
          </DialogHeader>
          
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="first_name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('FirstName')}</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="last_name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('LastName')}</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('Email')}</FormLabel>
                    <FormControl>
                      <Input {...field} type="email" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="username"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('Username')}</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('Phone')}</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="role"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('Role')}</FormLabel>
                      <Select 
                        onValueChange={field.onChange} 
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder={t('SelectRole')} />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="customer">{t('Cliente')}</SelectItem>
                          <SelectItem value="collaborator">{t('colaborator')}</SelectItem>
                          <SelectItem value="admin">{t('Administrator')}</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="status"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('Status')}</FormLabel>
                      <Select 
                        onValueChange={field.onChange} 
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder={t('SelectStatus')} />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="active">{t('Active')}</SelectItem>
                          <SelectItem value="inactive">{t('Inactive')}</SelectItem>
                          <SelectItem value="banned">{t('Banned')}</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center">
                      {t('Password')}
                      <Lock className="ml-2 h-4 w-4 text-gray-400" />
                    </FormLabel>
                    <FormControl>
                      <Input 
                        {...field} 
                        type="password" 
                        className="font-mono"
                      />
                    </FormControl>
                    <p className="text-xs text-gray-500 mt-1">
                      {t('LeavePasswordUnchangedHint')}
                    </p>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <DialogFooter className="pt-4">
                <Button 
                  variant="outline" 
                  type="button" 
                  onClick={() => setIsEditModalOpen(false)}
                >
                  {t('Cancel')}
                </Button>
                <Button 
                  type="submit"
                  disabled={updateUserMutation.isPending}
                  className="bg-brasil-green text-white hover:bg-brasil-green/90"
                >
                  {updateUserMutation.isPending ? t('Saving') : t('SaveChanges')}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
      
      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteModalOpen} onOpenChange={setIsDeleteModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-red-500">{t('ConfirmDeletion')}</DialogTitle>
            <DialogDescription>
              {selectedCustomer && t('DeleteCustomerConfirmation', { 
                name: `${selectedCustomer.first_name} ${selectedCustomer.last_name}` 
              })}
            </DialogDescription>
          </DialogHeader>
          
          <div className="pt-4 space-y-2">
            <p className="text-sm text-gray-600">
              {t('DeleteCustomerWarning')}
            </p>
            
            <div className="bg-amber-50 border border-amber-200 rounded-md p-3">
              <div className="flex items-center text-amber-800">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5 mr-2">
                  <path fillRule="evenodd" d="M9.401 3.003c1.155-2 4.043-2 5.197 0l7.355 12.748c1.154 2-.29 4.5-2.599 4.5H4.645c-2.309 0-3.752-2.5-2.598-4.5L9.4 3.003zM12 8.25a.75.75 0 01.75.75v3.75a.75.75 0 01-1.5 0V9a.75.75 0 01.75-.75zm0 8.25a.75.75 0 100-1.5.75.75 0 000 1.5z" clipRule="evenodd" />
                </svg>
                <span className="text-sm font-medium">{t('ThisActionCannotBeUndone')}</span>
              </div>
            </div>
          </div>
          
          <DialogFooter className="pt-4">
            <Button variant="outline" onClick={() => setIsDeleteModalOpen(false)}>
              {t('Cancel')}
            </Button>
            <Button 
              variant="destructive"
              onClick={() => {
                // Implementação de exclusão
                toast({
                  title: t('NotImplemented'),
                  description: t('FeatureNotImplementedYet'),
                  variant: 'destructive',
                });
                setIsDeleteModalOpen(false);
              }}
            >
              {t('DeleteCustomer')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Balance Management Dialog */}
      <Dialog open={isBalanceModalOpen} onOpenChange={setIsBalanceModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2">
              <Euro className="h-5 w-5 text-green-600" />
              <span>
                {balanceOperation === 'add' ? 'Adicionar Saldo' : 'Remover Saldo'}
              </span>
            </DialogTitle>
            <DialogDescription>
              {selectedCustomer && `Cliente: ${selectedCustomer.first_name} ${selectedCustomer.last_name}`}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            {selectedCustomer && (
              <div className="bg-gray-50 p-3 rounded-md">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-gray-600">Saldo Atual:</span>
                  <span className="text-lg font-bold text-gray-900">
                    €{((selectedCustomer.balance || 0) / 100).toFixed(2)}
                  </span>
                </div>
              </div>
            )}
            
            <div>
              <Label htmlFor="balanceAmount">
                {balanceOperation === 'add' ? 'Valor a Adicionar' : 'Valor a Remover'} (€)
              </Label>
              <Input
                id="balanceAmount"
                type="number"
                step="0.01"
                min="0.01"
                placeholder="0.00"
                value={balanceAmount}
                onChange={(e) => setBalanceAmount(e.target.value)}
                className="mt-1"
              />
            </div>
            
            <div className={`p-3 rounded-md ${balanceOperation === 'add' ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
              <div className="flex items-center">
                {balanceOperation === 'add' ? (
                  <Plus className="h-4 w-4 text-green-600 mr-2" />
                ) : (
                  <Minus className="h-4 w-4 text-red-600 mr-2" />
                )}
                <span className={`text-sm font-medium ${balanceOperation === 'add' ? 'text-green-800' : 'text-red-800'}`}>
                  {balanceOperation === 'add' 
                    ? 'O valor será adicionado ao saldo do cliente' 
                    : 'O valor será removido do saldo do cliente'
                  }
                </span>
              </div>
            </div>
          </div>
          
          <DialogFooter className="pt-4">
            <Button variant="outline" onClick={() => setIsBalanceModalOpen(false)}>
              Cancelar
            </Button>
            <Button 
              onClick={handleBalanceSubmit}
              disabled={updateBalanceMutation.isPending}
              className={balanceOperation === 'add' ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'}
            >
              {updateBalanceMutation.isPending ? 'Processando...' : (
                balanceOperation === 'add' ? 'Adicionar Saldo' : 'Remover Saldo'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
};

export default Customers;
