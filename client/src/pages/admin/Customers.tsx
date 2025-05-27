import React, { useState, useMemo } from 'react';
import AdminLayout from '@/components/layouts/AdminLayout';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { useAuth } from '@/contexts/AuthContext';

interface User {
  id: number;
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  address?: string;
  city?: string;
  postalCode?: string;
  country?: string;
  role: string;
  status?: string;
  memberSince?: string;
  loyaltyPoints?: number;
  profilePicture?: string;
}

interface Reservation {
  id: number;
  user_id: number;
  table_id: number;
  date: string;
  time: string;
  guests: number;
  status: string;
  total: number;
  user_name?: string;
}

export default function Customers() {
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [showProfile, setShowProfile] = useState(false);
  const itemsPerPage = 8;
  
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user: currentUser } = useAuth();

  const { data: users, isLoading, error } = useQuery<User[]>({
    queryKey: ['/api/users'],
    staleTime: 30000,
  });

  const { data: reservations } = useQuery<Reservation[]>({
    queryKey: ['/api/admin/reservations'],
    staleTime: 30000,
    enabled: !!selectedUser,
  });

  const deleteUserMutation = useMutation({
    mutationFn: async (userId: number) => {
      const response = await apiRequest('DELETE', `/api/users/${userId}`);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Usuário excluído",
        description: "O usuário foi excluído com sucesso.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/users'] });
      setSelectedUser(null);
      setShowProfile(false);
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao excluir",
        description: error.message || "Não foi possível excluir o usuário.",
        variant: "destructive",
      });
    }
  });

  const filteredUsers = useMemo(() => {
    if (!users) return [];
    
    return users.filter(user => {
      const matchesSearch = !searchTerm || 
        user.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.phone?.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesRole = !roleFilter || user.role.toLowerCase() === roleFilter.toLowerCase();
      const matchesStatus = !statusFilter || (user.status || 'active').toLowerCase() === statusFilter.toLowerCase();
      
      return matchesSearch && matchesRole && matchesStatus;
    });
  }, [users, searchTerm, roleFilter, statusFilter]);

  const paginatedUsers = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredUsers.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredUsers, currentPage]);

  const totalPages = Math.ceil(filteredUsers.length / itemsPerPage);

  const getRoleInfo = (role: string) => {
    const roleMap = {
      admin: { label: 'Master', icon: 'fa-crown', bgColor: 'bg-brasil-green bg-opacity-10', textColor: 'text-brasil-green', borderColor: 'border-brasil-green' },
      financeiro: { label: 'Financeiro', icon: 'fa-dollar-sign', bgColor: 'bg-brasil-yellow bg-opacity-10', textColor: 'text-brasil-yellow', borderColor: 'border-brasil-yellow' },
      collaborator: { label: 'Colaborador', icon: 'fa-users', bgColor: 'bg-brasil-red bg-opacity-10', textColor: 'text-brasil-red', borderColor: 'border-brasil-red' },
      customer: { label: 'Cliente', icon: 'fa-user', bgColor: 'bg-gray-100', textColor: 'text-gray-600', borderColor: 'border-gray-200' },
    };
    
    return roleMap[role as keyof typeof roleMap] || roleMap.customer;
  };

  const getStatusInfo = (status: string) => {
    const statusMap = {
      active: { label: 'Ativo', bgColor: 'bg-green-100', textColor: 'text-brasil-green' },
      ativo: { label: 'Ativo', bgColor: 'bg-green-100', textColor: 'text-brasil-green' },
      suspended: { label: 'Suspenso', bgColor: 'bg-yellow-100', textColor: 'text-brasil-yellow' },
      suspenso: { label: 'Suspenso', bgColor: 'bg-yellow-100', textColor: 'text-brasil-yellow' },
      inactive: { label: 'Inativo', bgColor: 'bg-red-100', textColor: 'text-brasil-red' },
      inativo: { label: 'Inativo', bgColor: 'bg-red-100', textColor: 'text-brasil-red' },
    };
    
    return statusMap[status?.toLowerCase() as keyof typeof statusMap] || statusMap.active;
  };

  const getDefaultAvatar = (index: number) => {
    const avatars = [
      'https://storage.googleapis.com/uxpilot-auth.appspot.com/avatars/avatar-2.jpg',
      'https://storage.googleapis.com/uxpilot-auth.appspot.com/avatars/avatar-6.jpg',
      'https://storage.googleapis.com/uxpilot-auth.appspot.com/avatars/avatar-7.jpg',
      'https://storage.googleapis.com/uxpilot-auth.appspot.com/avatars/avatar-4.jpg',
      'https://storage.googleapis.com/uxpilot-auth.appspot.com/avatars/avatar-8.jpg',
      'https://storage.googleapis.com/uxpilot-auth.appspot.com/avatars/avatar-3.jpg',
    ];
    return avatars[index % avatars.length];
  };

  const getUserReservations = () => {
    if (!selectedUser || !reservations) return [];
    return reservations.filter(res => res.user_id === selectedUser.id).slice(0, 5);
  };

  const handleDeleteUser = (userId: number) => {
    if (window.confirm('Tem certeza que deseja excluir este usuário?')) {
      deleteUserMutation.mutate(userId);
    }
  };

  const showClienteProfile = (user: User) => {
    setSelectedUser(user);
    setShowProfile(true);
  };

  const clearFilters = () => {
    setSearchTerm('');
    setRoleFilter('');
    setStatusFilter('');
    setCurrentPage(1);
  };

  if (isLoading) {
    return (
      <AdminLayout title="Gestão de Clientes">
        <div className="bg-gray-100 font-opensans min-h-screen">
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-brasil-green"></div>
          </div>
        </div>
      </AdminLayout>
    );
  }

  if (error) {
    return (
      <AdminLayout title="Gestão de Clientes">
        <div className="bg-gray-100 font-opensans min-h-screen p-8">
          <div className="bg-white rounded-lg p-6 text-center">
            <p className="text-red-600">Erro ao carregar clientes</p>
          </div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title="Gestão de Clientes">
      <div className="bg-gray-100 font-opensans">
        <div className={`flex gap-8 h-[720px] ${showProfile ? 'lg:flex-row' : 'flex-col'}`}>
          {/* Tabela de Clientes */}
          <div className="flex flex-col flex-1">
            {/* Filtros */}
            <div className="flex flex-col mb-4 space-y-3 md:flex-row md:items-end md:space-x-6 md:space-y-0">
              <div className="flex-1">
                <label className="block mb-1 text-sm font-semibold text-gray-700 font-montserrat">Buscar Cliente</label>
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Nome, email ou telefone"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full py-2 pl-10 pr-4 font-medium text-gray-800 transition bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-brasil-blue"
                  />
                  <span className="absolute text-gray-400 transform -translate-y-1/2 left-3 top-1/2">
                    <i className="fa-solid fa-magnifying-glass"></i>
                  </span>
                </div>
              </div>
              <div>
                <label className="block mb-1 text-sm font-semibold text-gray-700 font-montserrat">Classificação</label>
                <select
                  value={roleFilter}
                  onChange={(e) => setRoleFilter(e.target.value)}
                  className="w-full px-3 py-2 font-medium text-gray-700 bg-white border border-gray-200 rounded-lg md:w-40 focus:ring-2 focus:ring-brasil-blue"
                >
                  <option value="">Todas</option>
                  <option value="admin">Master</option>
                  <option value="financeiro">Financeiro</option>
                  <option value="collaborator">Colaborador</option>
                  <option value="customer">Cliente</option>
                </select>
              </div>
              <div>
                <label className="block mb-1 text-sm font-semibold text-gray-700 font-montserrat">Status</label>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="w-full px-3 py-2 font-medium text-gray-700 bg-white border border-gray-200 rounded-lg md:w-32 focus:ring-2 focus:ring-brasil-blue"
                >
                  <option value="">Todos</option>
                  <option value="active">Ativo</option>
                  <option value="suspended">Suspenso</option>
                  <option value="inactive">Inativo</option>
                </select>
              </div>
              <button
                onClick={clearFilters}
                className="px-4 py-2 ml-auto font-semibold transition rounded-lg shadow bg-brasil-yellow text-brasil-blue hover:bg-yellow-200 md:ml-0"
              >
                Limpar
              </button>
            </div>

            {/* Tabela */}
            <div className="flex flex-col flex-1 p-0 overflow-hidden bg-white shadow-lg rounded-xl">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-100">
                  <thead className="bg-brasil-blue">
                    <tr>
                      <th className="px-6 py-4 text-xs font-bold tracking-wider text-left text-white font-montserrat">Nome</th>
                      <th className="px-4 py-4 text-xs font-bold tracking-wider text-left text-white font-montserrat">Telefone</th>
                      <th className="px-4 py-4 text-xs font-bold tracking-wider text-left text-white font-montserrat">Email</th>
                      <th className="px-4 py-4 text-xs font-bold tracking-wider text-left text-white font-montserrat">Acessos</th>
                      <th className="px-4 py-4 text-xs font-bold tracking-wider text-center text-white font-montserrat">Status</th>
                      <th className="px-4 py-4 text-xs font-bold tracking-wider text-center text-white font-montserrat">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="font-medium text-gray-800 bg-white divide-y divide-gray-100">
                    {paginatedUsers.map((user, index) => {
                      const roleInfo = getRoleInfo(user.role);
                      const statusInfo = getStatusInfo(user.status || 'active');
                      
                      return (
                        <tr key={user.id} className="transition cursor-pointer hover:bg-gray-50" onClick={() => showClienteProfile(user)}>
                          <td className="flex items-center px-6 py-4">
                            <img
                              src={user.profilePicture || getDefaultAvatar(index)}
                              alt=""
                              className={`w-8 h-8 mr-3 border-2 rounded-full ${roleInfo.borderColor}`}
                            />
                            {user.firstName} {user.lastName}
                          </td>
                          <td className="px-4 py-4">{user.phone || 'N/A'}</td>
                          <td className="px-4 py-4">{user.email}</td>
                          <td className="px-4 py-4">
                            <span className={`inline-flex items-center px-2 py-1 mr-1 text-xs font-semibold rounded ${roleInfo.bgColor} ${roleInfo.textColor}`}>
                              <i className={`mr-1 fa-solid ${roleInfo.icon}`}></i> {roleInfo.label}
                            </span>
                          </td>
                          <td className="px-4 py-4 text-center">
                            <span className={`inline-flex items-center px-2 py-1 text-xs font-semibold rounded ${statusInfo.bgColor} ${statusInfo.textColor}`}>
                              <i className="mr-1 text-xs fa-solid fa-circle"></i> {statusInfo.label}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-center">
                            <button className="mr-2 text-brasil-blue hover:text-brasil-green" onClick={(e) => { e.stopPropagation(); showClienteProfile(user); }}>
                              <i className="fa-solid fa-eye"></i>
                            </button>
                            <button className="mr-2 text-brasil-blue hover:text-brasil-green" onClick={(e) => { e.stopPropagation(); /* Editar função */ }}>
                              <i className="fa-solid fa-file-pen"></i>
                            </button>
                            <button 
                              className="text-brasil-blue hover:text-red-600" 
                              onClick={(e) => { e.stopPropagation(); handleDeleteUser(user.id); }}
                            >
                              <i className="fa-solid fa-trash-can"></i>
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              
              {/* Paginação */}
              <div className="flex items-center justify-between px-6 py-3 bg-gray-50">
                <span className="text-xs text-gray-600">
                  Exibindo {((currentPage - 1) * itemsPerPage) + 1}-{Math.min(currentPage * itemsPerPage, filteredUsers.length)} de {filteredUsers.length} clientes
                </span>
                <div className="space-x-1">
                  <button
                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                    disabled={currentPage === 1}
                    className="px-2 py-1 transition rounded text-brasil-blue hover:bg-brasil-blue hover:text-white disabled:opacity-50"
                  >
                    <i className="fa-solid fa-angle-left"></i>
                  </button>
                  {[...Array(Math.min(totalPages, 5))].map((_, i) => {
                    const pageNum = i + 1;
                    return (
                      <button
                        key={pageNum}
                        onClick={() => setCurrentPage(pageNum)}
                        className={`px-2 py-1 rounded ${
                          currentPage === pageNum
                            ? 'font-bold text-brasil-blue bg-brasil-yellow'
                            : 'transition text-brasil-blue hover:bg-brasil-blue hover:text-white'
                        }`}
                      >
                        {pageNum}
                      </button>
                    );
                  })}
                  <button
                    onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                    disabled={currentPage === totalPages}
                    className="px-2 py-1 transition rounded text-brasil-blue hover:bg-brasil-blue hover:text-white disabled:opacity-50"
                  >
                    <i className="fa-solid fa-angle-right"></i>
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Perfil do Cliente */}
          {showProfile && selectedUser && (
            <div className="w-full lg:w-[400px] bg-white rounded-2xl shadow-xl p-8 flex flex-col transition-all duration-300" style={{ minWidth: '370px', maxWidth: '400px' }}>
              <div className="flex flex-col items-center">
                <img
                  src={selectedUser.profilePicture || getDefaultAvatar(selectedUser.id)}
                  alt=""
                  className={`object-cover w-24 h-24 mb-3 border-4 rounded-full shadow-lg ${getRoleInfo(selectedUser.role).borderColor}`}
                />
                <div className="flex items-center mb-2 space-x-2">
                  <h2 className="text-xl font-bold text-gray-800 font-montserrat">{selectedUser.firstName} {selectedUser.lastName}</h2>
                  <span className={`inline-flex items-center px-2 py-1 text-xs font-semibold rounded ${getRoleInfo(selectedUser.role).bgColor} ${getRoleInfo(selectedUser.role).textColor}`}>
                    <i className={`mr-1 fa-solid ${getRoleInfo(selectedUser.role).icon}`}></i> {getRoleInfo(selectedUser.role).label}
                  </span>
                </div>
                <span className={`inline-flex items-center px-2 py-1 mb-2 text-xs font-semibold rounded ${getStatusInfo(selectedUser.status || 'active').bgColor} ${getStatusInfo(selectedUser.status || 'active').textColor}`}>
                  <i className="mr-1 text-xs fa-solid fa-circle"></i> {getStatusInfo(selectedUser.status || 'active').label}
                </span>
                <p className="mb-1 text-sm text-gray-600">{selectedUser.email}</p>
                <p className="mb-5 text-sm text-gray-600">{selectedUser.phone || 'Telefone não informado'}</p>
              </div>
              
              <div className="mb-6">
                <h3 className="mb-2 font-semibold text-gray-800 text-md font-montserrat">Informações</h3>
                <div className="space-y-2 text-sm">
                  <p><strong>Username:</strong> @{selectedUser.username}</p>
                  <p><strong>Membro desde:</strong> {selectedUser.memberSince ? new Date(selectedUser.memberSince).toLocaleDateString('pt-PT') : 'N/A'}</p>
                  {selectedUser.loyaltyPoints !== undefined && (
                    <p><strong>Pontos:</strong> {selectedUser.loyaltyPoints}</p>
                  )}
                  {selectedUser.address && (
                    <p><strong>Endereço:</strong> {selectedUser.address}, {selectedUser.city} {selectedUser.postalCode}</p>
                  )}
                </div>
              </div>
              
              <div>
                <h3 className="mb-2 font-semibold text-gray-800 text-md font-montserrat">Histórico de Reservas</h3>
                <div className="pr-2 space-y-3 overflow-y-auto max-h-48">
                  {getUserReservations().map((reservation) => (
                    <div key={reservation.id} className="flex items-center justify-between px-3 py-2 rounded-lg bg-gray-50">
                      <div>
                        <p className="text-sm font-medium">Mesa {reservation.table_id} - {new Date(reservation.date).toLocaleDateString('pt-PT')}</p>
                        <p className="text-xs text-gray-500">{reservation.guests} pessoas - {reservation.time}</p>
                      </div>
                      <span className={`inline-flex items-center px-2 py-1 text-xs font-semibold rounded ${
                        reservation.status === 'confirmed' ? 'text-white bg-brasil-blue' :
                        reservation.status === 'completed' ? 'bg-brasil-yellow text-brasil-blue' :
                        'bg-gray-300 text-gray-700'
                      }`}>
                        {reservation.status === 'confirmed' ? 'Confirmada' :
                         reservation.status === 'completed' ? 'Realizada' :
                         reservation.status === 'cancelled' ? 'Cancelada' : 'Pendente'}
                      </span>
                    </div>
                  ))}
                  
                  {getUserReservations().length === 0 && (
                    <p className="text-sm text-gray-500 text-center py-4">Nenhuma reserva encontrada</p>
                  )}
                </div>
              </div>
              
              <div className="mt-auto pt-6">
                <button
                  onClick={() => setShowProfile(false)}
                  className="w-full px-4 py-2 text-sm font-semibold text-gray-600 transition border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Fechar
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}