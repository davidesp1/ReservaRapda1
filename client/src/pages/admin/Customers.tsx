import React, { useState, useMemo } from 'react';
import { useLocation } from 'wouter';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Search, Eye, Edit, Trash2, Crown, User, Shield, Users, UserPlus } from 'lucide-react';
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
import { apiRequest } from '@/lib/queryClient';
import { useForm } from 'react-hook-form';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';

interface Customer {
  id: number;
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  profilePicture?: string;
  role: 'customer' | 'admin' | 'collaborator' | 'financeiro';
  status: 'active' | 'inactive' | 'suspended';
}

const Customers: React.FC = () => {
  const { isAuthenticated, isAdmin, isLoading } = useAuth();
  const [_, setLocation] = useLocation();
  const [searchText, setSearchText] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [viewCustomerInfo, setViewCustomerInfo] = useState<Customer | null>(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Form para edição de cliente
  const form = useForm({
    defaultValues: {
      username: '',
      email: '',
      firstName: '',
      lastName: '',
      phone: '',
      role: 'customer',
      status: 'active',
    }
  });

  // Fetch customers data
  const { data: customers = [], isLoading: customersLoading, error } = useQuery<Customer[]>({
    queryKey: ['/api/users'],
    enabled: isAuthenticated && isAdmin,
    refetchInterval: 30000,
    staleTime: 10000,
  });

  console.log('🐛 Debug Customers:', { 
    isAuthenticated, 
    isAdmin, 
    customersLoading, 
    error,
    customersCount: customers?.length || 0,
    customers: customers?.slice(0, 3) // Show first 3 for debugging
  });

  // Filter customers based on search and filters
  const filteredCustomers = useMemo(() => {
    if (!customers) return [];
    
    return customers.filter((customer: Customer) => {
      const searchLower = searchText.toLowerCase();
      const matchesSearch = !searchText || 
        (customer.firstName && customer.firstName.toLowerCase().includes(searchLower)) ||
        (customer.lastName && customer.lastName.toLowerCase().includes(searchLower)) ||
        (customer.email && customer.email.toLowerCase().includes(searchLower)) ||
        (customer.username && customer.username.toLowerCase().includes(searchLower)) ||
        (customer.phone && customer.phone.toLowerCase().includes(searchLower));

      const matchesRole = !roleFilter || customer.role === roleFilter;
      const matchesStatus = !statusFilter || customer.status === statusFilter;

      return matchesSearch && matchesRole && matchesStatus;
    });
  }, [customers, searchText, roleFilter, statusFilter]);

  // Get role badge info
  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'admin':
        return { icon: Crown, label: 'Master', color: 'bg-red-100 text-red-800 border-red-200' };
      case 'financeiro':
        return { icon: Shield, label: 'Financeiro', color: 'bg-blue-100 text-blue-800 border-blue-200' };
      case 'collaborator':
        return { icon: Users, label: 'Colaborador', color: 'bg-yellow-100 text-yellow-800 border-yellow-200' };
      case 'customer':
        return { icon: User, label: 'Cliente', color: 'bg-green-100 text-green-800 border-green-200' };
      default:
        return { icon: User, label: 'Cliente', color: 'bg-gray-100 text-gray-800 border-gray-200' };
    }
  };

  // Get status badge info
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return { label: 'Ativo', color: 'bg-green-100 text-green-800' };
      case 'suspended':
        return { label: 'Suspenso', color: 'bg-orange-100 text-orange-800' };
      case 'inactive':
        return { label: 'Inativo', color: 'bg-red-100 text-red-800' };
      default:
        return { label: 'Ativo', color: 'bg-green-100 text-green-800' };
    }
  };

  // Handle view customer
  const handleViewCustomer = (customer: Customer) => {
    setViewCustomerInfo(customer);
    setIsViewModalOpen(true);
  };

  // Handle edit customer
  const handleEditCustomer = (customer: Customer) => {
    setSelectedCustomer(customer);
    form.reset({
      username: customer.username,
      email: customer.email,
      firstName: customer.firstName,
      lastName: customer.lastName,
      phone: customer.phone || '',
      role: customer.role,
      status: customer.status,
    });
    setIsEditModalOpen(true);
  };

  // Handle delete confirmation
  const handleDeleteConfirm = (customer: Customer) => {
    setSelectedCustomer(customer);
    setIsDeleteModalOpen(true);
  };

  // Update customer mutation
  const updateCustomerMutation = useMutation({
    mutationFn: async (customerData: any) => {
      const response = await apiRequest('PUT', `/api/users/${customerData.id}`, customerData);
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Erro ao atualizar cliente');
      }
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Cliente atualizado",
        description: "Cliente atualizado com sucesso.",
      });
      setIsEditModalOpen(false);
      queryClient.invalidateQueries({ queryKey: ['/api/users'] });
    },
    onError: (error: any) => {
      toast({
        title: "Erro",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  // Delete customer mutation
  const deleteCustomerMutation = useMutation({
    mutationFn: async (customerId: number) => {
      const response = await apiRequest('DELETE', `/api/users/${customerId}`);
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Erro ao deletar cliente');
      }
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Cliente deletado",
        description: "Cliente deletado com sucesso.",
      });
      setIsDeleteModalOpen(false);
      queryClient.invalidateQueries({ queryKey: ['/api/users'] });
    },
    onError: (error: any) => {
      toast({
        title: "Erro",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  // Submit form
  const onSubmit = (data: any) => {
    if (!selectedCustomer) return;
    
    const customerData = {
      ...data,
      id: selectedCustomer.id,
    };
    
    updateCustomerMutation.mutate(customerData);
  };

  // Clear filters
  const clearFilters = () => {
    setSearchText('');
    setRoleFilter('');
    setStatusFilter('');
  };

  if (customersLoading) {
    return (
      <AdminLayout title="Gestão de Clientes">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          <div className="h-12 bg-gray-200 rounded"></div>
          <div className="h-96 bg-gray-200 rounded"></div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title="Gestão de Clientes">
      <div className="flex flex-col lg:flex-row gap-8 h-[720px]">
        <div className="flex flex-col flex-1">
          {/* Filtros */}
          <div className="flex flex-col mb-4 space-y-3 md:flex-row md:items-end md:space-x-6 md:space-y-0">
            <div className="flex-1">
              <label className="block mb-1 text-sm font-semibold text-gray-700 font-montserrat">
                Buscar Cliente
              </label>
              <div className="relative">
                <Input
                  type="text"
                  placeholder="Nome, email ou telefone"
                  className="w-full py-2 pl-10 pr-4 font-medium text-gray-800 transition bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-brasil-blue"
                  value={searchText}
                  onChange={(e) => setSearchText(e.target.value)}
                />
                <Search className="absolute text-gray-400 transform -translate-y-1/2 left-3 top-1/2 h-4 w-4" />
              </div>
            </div>
            
            <div>
              <label className="block mb-1 text-sm font-semibold text-gray-700 font-montserrat">
                Classificação
              </label>
              <Select value={roleFilter} onValueChange={setRoleFilter}>
                <SelectTrigger className="w-full md:w-40">
                  <SelectValue placeholder="Todas" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Todas</SelectItem>
                  <SelectItem value="admin">Master</SelectItem>
                  <SelectItem value="financeiro">Financeiro</SelectItem>
                  <SelectItem value="collaborator">Colaborador</SelectItem>
                  <SelectItem value="customer">Cliente</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <label className="block mb-1 text-sm font-semibold text-gray-700 font-montserrat">
                Status
              </label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full md:w-32">
                  <SelectValue placeholder="Todos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Todos</SelectItem>
                  <SelectItem value="active">Ativo</SelectItem>
                  <SelectItem value="suspended">Suspenso</SelectItem>
                  <SelectItem value="inactive">Inativo</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <Button
              variant="outline"
              onClick={clearFilters}
              className="px-4 py-2 font-semibold transition rounded-lg shadow bg-brasil-yellow text-brasil-blue hover:bg-yellow-200"
            >
              Limpar
            </Button>
            
            <Button
              onClick={() => setLocation('/admin/customers/add')}
              className="px-4 py-2 font-semibold transition rounded-lg shadow bg-brasil-blue text-brasil-yellow hover:bg-blue-800"
            >
              <UserPlus className="mr-2 h-4 w-4" />
              + Novo Cliente
            </Button>
          </div>

          {/* Tabela */}
          <div className="flex flex-col flex-1 p-0 overflow-hidden bg-white shadow-lg rounded-xl">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-100">
                <thead className="bg-brasil-blue">
                  <tr>
                    <th className="px-6 py-4 text-xs font-bold tracking-wider text-left text-white font-montserrat">
                      Nome
                    </th>
                    <th className="px-4 py-4 text-xs font-bold tracking-wider text-left text-white font-montserrat">
                      Telefone
                    </th>
                    <th className="px-4 py-4 text-xs font-bold tracking-wider text-left text-white font-montserrat">
                      Email
                    </th>
                    <th className="px-4 py-4 text-xs font-bold tracking-wider text-left text-white font-montserrat">
                      Acessos
                    </th>
                    <th className="px-4 py-4 text-xs font-bold tracking-wider text-center text-white font-montserrat">
                      Status
                    </th>
                    <th className="px-4 py-4 text-xs font-bold tracking-wider text-center text-white font-montserrat">
                      Ações
                    </th>
                  </tr>
                </thead>
                <tbody className="font-medium text-gray-800 bg-white divide-y divide-gray-100">
                  {filteredCustomers.length > 0 ? (
                    filteredCustomers.map((customer) => {
                      const roleBadge = getRoleBadge(customer.role);
                      const statusBadge = getStatusBadge(customer.status);
                      const IconComponent = roleBadge.icon;

                      return (
                        <tr 
                          key={customer.id} 
                          className="transition cursor-pointer hover:bg-gray-50"
                          data-id={customer.id}
                        >
                          <td className="flex items-center px-6 py-4">
                            <Avatar className="w-8 h-8 mr-3 border-2 border-brasil-green">
                              <AvatarImage src={customer.profilePicture} />
                              <AvatarFallback className="bg-brasil-yellow text-brasil-blue text-xs">
                                {customer.firstName?.[0]}{customer.lastName?.[0]}
                              </AvatarFallback>
                            </Avatar>
                            {customer.firstName} {customer.lastName}
                          </td>
                          <td className="px-4 py-4">{customer.phone || '-'}</td>
                          <td className="px-4 py-4">{customer.email}</td>
                          <td className="px-4 py-4">
                            <Badge className={`inline-flex items-center px-2 py-1 text-xs font-semibold rounded border ${roleBadge.color}`}>
                              <IconComponent className="mr-1 h-3 w-3" />
                              {roleBadge.label}
                            </Badge>
                          </td>
                          <td className="px-4 py-4 text-center">
                            <Badge className={`inline-flex items-center px-2 py-1 text-xs font-semibold rounded ${statusBadge.color}`}>
                              {statusBadge.label}
                            </Badge>
                          </td>
                          <td className="px-4 py-4 text-center">
                            <div className="flex justify-center space-x-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleViewCustomer(customer);
                                }}
                                className="text-brasil-blue hover:bg-brasil-blue hover:text-white"
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleEditCustomer(customer);
                                }}
                                className="text-yellow-600 hover:bg-yellow-600 hover:text-white"
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDeleteConfirm(customer);
                                }}
                                className="text-red-600 hover:bg-red-600 hover:text-white"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan={6} className="text-center py-6 text-gray-500">
                        {searchText || roleFilter || statusFilter ? 'Nenhum cliente encontrado com os filtros aplicados' : 'Nenhum cliente cadastrado'}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {/* View Customer Dialog */}
      <Dialog open={isViewModalOpen} onOpenChange={setIsViewModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Detalhes do Cliente</DialogTitle>
            <DialogDescription>
              {viewCustomerInfo ? `${viewCustomerInfo.firstName} ${viewCustomerInfo.lastName}` : ''}
            </DialogDescription>
          </DialogHeader>
          
          {viewCustomerInfo && (
            <div className="space-y-4">
              <div className="flex items-center space-x-4">
                <Avatar className="w-16 h-16">
                  <AvatarImage src={viewCustomerInfo.profilePicture} />
                  <AvatarFallback className="bg-brasil-yellow text-brasil-blue">
                    {viewCustomerInfo.firstName?.[0]}{viewCustomerInfo.lastName?.[0]}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="text-lg font-semibold">{viewCustomerInfo.firstName} {viewCustomerInfo.lastName}</h3>
                  <p className="text-gray-600">{viewCustomerInfo.username}</p>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-500">Email</label>
                  <p className="font-semibold">{viewCustomerInfo.email}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Telefone</label>
                  <p className="font-semibold">{viewCustomerInfo.phone || 'Não informado'}</p>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-500">Nível de Acesso</label>
                  <div className="mt-1">
                    {(() => {
                      const badge = getRoleBadge(viewCustomerInfo.role);
                      const IconComponent = badge.icon;
                      return (
                        <Badge className={`inline-flex items-center px-2 py-1 text-xs font-semibold rounded border ${badge.color}`}>
                          <IconComponent className="mr-1 h-3 w-3" />
                          {badge.label}
                        </Badge>
                      );
                    })()}
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Status</label>
                  <div className="mt-1">
                    {(() => {
                      const badge = getStatusBadge(viewCustomerInfo.status);
                      return (
                        <Badge className={`inline-flex items-center px-2 py-1 text-xs font-semibold rounded ${badge.color}`}>
                          {badge.label}
                        </Badge>
                      );
                    })()}
                  </div>
                </div>
              </div>
            </div>
          )}
          
          <DialogFooter className="flex sm:justify-between mt-4">
            <Button variant="outline" onClick={() => setIsViewModalOpen(false)}>
              Fechar
            </Button>
            <Button onClick={() => {
              setIsViewModalOpen(false);
              if (viewCustomerInfo) handleEditCustomer(viewCustomerInfo);
            }}>
              <Edit className="mr-2 h-4 w-4" /> Editar Cliente
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Customer Dialog */}
      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Editar Cliente</DialogTitle>
            <DialogDescription>
              {selectedCustomer ? `Editando ${selectedCustomer.firstName} ${selectedCustomer.lastName}` : ''}
            </DialogDescription>
          </DialogHeader>
          
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="firstName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nome</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="lastName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Sobrenome</FormLabel>
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
                    <FormLabel>Email</FormLabel>
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
                    <FormLabel>Nome de usuário</FormLabel>
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
                    <FormLabel>Telefone</FormLabel>
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
                      <FormLabel>Nível de Acesso</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecionar nível" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="customer">Cliente</SelectItem>
                          <SelectItem value="collaborator">Colaborador</SelectItem>
                          <SelectItem value="financeiro">Financeiro</SelectItem>
                          <SelectItem value="admin">Administrador</SelectItem>
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
                      <FormLabel>Status</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecionar status" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="active">Ativo</SelectItem>
                          <SelectItem value="suspended">Suspenso</SelectItem>
                          <SelectItem value="inactive">Inativo</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <DialogFooter className="flex justify-end space-x-2 mt-6">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsEditModalOpen(false)}
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  disabled={updateCustomerMutation.isPending}
                  className="bg-brasil-blue text-white hover:bg-brasil-blue/90"
                >
                  {updateCustomerMutation.isPending ? 'Salvando...' : 'Salvar Alterações'}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Delete Customer Dialog */}
      <Dialog open={isDeleteModalOpen} onOpenChange={setIsDeleteModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Confirmar Exclusão</DialogTitle>
            <DialogDescription>
              Tem certeza que deseja deletar o cliente{' '}
              <strong>
                {selectedCustomer ? `${selectedCustomer.firstName} ${selectedCustomer.lastName}` : ''}
              </strong>
              ? Esta ação não pode ser desfeita.
            </DialogDescription>
          </DialogHeader>
          
          <DialogFooter className="flex justify-end space-x-2">
            <Button
              variant="outline"
              onClick={() => setIsDeleteModalOpen(false)}
            >
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                if (selectedCustomer) {
                  deleteCustomerMutation.mutate(selectedCustomer.id);
                }
              }}
              disabled={deleteCustomerMutation.isPending}
            >
              {deleteCustomerMutation.isPending ? 'Deletando...' : 'Deletar Cliente'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
};

export default Customers;