import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';

interface Customer {
  id: number;
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  role: string;
  status?: string;
  memberSince?: string;
  loyaltyPoints?: number;
  profilePicture?: string;
}

export default function Customers() {
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [filteredCustomers, setFilteredCustomers] = useState<Customer[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  const { data: customers, isLoading } = useQuery<Customer[]>({
    queryKey: ['/api/users'],
    staleTime: 30000,
  });

  // Filter customers based on search and filters
  useEffect(() => {
    if (!customers) return;

    let filtered = customers.filter(customer => {
      const matchesSearch = searchTerm === '' || 
        customer.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        customer.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        customer.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        customer.phone?.includes(searchTerm);

      const matchesRole = roleFilter === '' || 
        (roleFilter === 'Master' && customer.role === 'admin') ||
        (roleFilter === 'Financeiro' && customer.role === 'financeiro') ||
        (roleFilter === 'Colaborador' && customer.role === 'collaborator') ||
        (roleFilter === 'Cliente' && customer.role === 'customer') ||
        (roleFilter === 'Staff' && customer.role === 'admin');

      const matchesStatus = statusFilter === '' || 
        (statusFilter === 'ativo' && customer.status === 'active') ||
        (statusFilter === 'Suspenso' && customer.status === 'suspended') ||
        (statusFilter === 'inativo' && customer.status === 'inactive');

      return matchesSearch && matchesRole && matchesStatus;
    });

    setFilteredCustomers(filtered);
    setCurrentPage(1);
  }, [customers, searchTerm, roleFilter, statusFilter]);

  const clearFilters = () => {
    setSearchTerm('');
    setRoleFilter('');
    setStatusFilter('');
  };

  const getRoleDisplay = (role: string) => {
    switch (role) {
      case 'admin': return { label: 'Master', icon: 'fa-crown', color: 'brazil-green' };
      case 'financeiro': return { label: 'Financeiro', icon: 'fa-dollar-sign', color: 'brazil-yellow' };
      case 'collaborator': return { label: 'Colaborador', icon: 'fa-fire', color: 'brazil-red' };
      case 'customer': return { label: 'Cliente', icon: '', color: 'gray' };
      default: return { label: 'Staff', icon: 'fa-star', color: 'brazil-blue' };
    }
  };

  const getStatusDisplay = (status?: string) => {
    switch (status) {
      case 'active': return { label: 'Ativo', color: 'brazil-green' };
      case 'suspended': return { label: 'Suspenso', color: 'brazil-yellow' };
      case 'inactive': return { label: 'Inativo', color: 'brazil-red' };
      default: return { label: 'Ativo', color: 'brazil-green' };
    }
  };

  const getAvatarImage = (customer: Customer, index: number) => {
    if (customer.profilePicture) return customer.profilePicture;
    const avatars = [
      "https://storage.googleapis.com/uxpilot-auth.appspot.com/avatars/avatar-2.jpg",
      "https://storage.googleapis.com/uxpilot-auth.appspot.com/avatars/avatar-6.jpg", 
      "https://storage.googleapis.com/uxpilot-auth.appspot.com/avatars/avatar-7.jpg",
      "https://storage.googleapis.com/uxpilot-auth.appspot.com/avatars/avatar-4.jpg",
      "https://storage.googleapis.com/uxpilot-auth.appspot.com/avatars/avatar-8.jpg"
    ];
    return avatars[index % avatars.length];
  };

  const getBorderColor = (role: string) => {
    switch (role) {
      case 'admin': return 'border-brazil-green';
      case 'financeiro': return 'border-brazil-yellow';
      case 'collaborator': return 'border-brazil-red';
      case 'customer': return 'border-gray-200';
      default: return 'border-brazil-blue';
    }
  };

  const showCustomerProfile = (customer: Customer) => {
    setSelectedCustomer(customer);
  };

  const hideCustomerProfile = () => {
    setSelectedCustomer(null);
  };

  // Pagination
  const totalPages = Math.ceil(filteredCustomers.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentCustomers = filteredCustomers.slice(startIndex, endIndex);

  if (isLoading) {
    return (
      <div className="bg-gray-100 font-opensans min-h-screen">
        <div className="flex h-screen">
          <div className="relative flex-1 p-8 ml-64">
            <div className="animate-pulse">
              <div className="h-8 bg-gray-200 rounded w-1/4 mb-8"></div>
              <div className="space-y-4">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="h-16 bg-gray-200 rounded"></div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-100 font-opensans min-h-screen">
      <div className="flex h-screen">
        {/* Main Content */}
        <div className="relative flex-1 p-8 ml-64">
          <div className="flex items-center justify-between mb-8">
            <h1 className="text-2xl font-bold text-gray-800 font-montserrat">Gestão de Clientes</h1>
            <div className="flex items-center space-x-4">
              <div className="relative">
                <button className="relative">
                  <i className="text-xl text-gray-600 fa-regular fa-bell"></i>
                  <span className="absolute flex items-center justify-center w-4 h-4 text-xs text-white rounded-full -top-1 -right-1 bg-brazil-red">2</span>
                </button>
              </div>
              <div className="flex items-center">
                <img 
                  src="https://storage.googleapis.com/uxpilot-auth.appspot.com/avatars/avatar-3.jpg" 
                  alt="User Avatar" 
                  className="w-10 h-10 border-2 rounded-full border-brazil-yellow" 
                />
                <div className="ml-2">
                  <p className="text-sm font-medium text-gray-800">{user?.firstName} {user?.lastName}</p>
                  <p className="text-xs text-gray-500">Administrador</p>
                </div>
              </div>
            </div>
          </div>

          <div className="flex flex-col lg:flex-row gap-8 h-[720px]">
            <div className="flex flex-col flex-1">
              {/* Filters */}
              <div className="flex flex-col mb-4 space-y-3 md:flex-row md:items-end md:space-x-6 md:space-y-0">
                <div className="flex-1">
                  <label className="block mb-1 text-sm font-semibold text-gray-700 font-montserrat">Buscar Cliente</label>
                  <div className="relative">
                    <input 
                      type="text" 
                      placeholder="Nome, email ou telefone" 
                      className="w-full py-2 pl-10 pr-4 font-medium text-gray-800 transition bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-brazil-blue"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                    <span className="absolute text-gray-400 transform -translate-y-1/2 left-3 top-1/2">
                      <i className="fa-solid fa-magnifying-glass"></i>
                    </span>
                  </div>
                </div>
                <div>
                  <label className="block mb-1 text-sm font-semibold text-gray-700 font-montserrat">Classificação</label>
                  <select 
                    className="w-full px-3 py-2 font-medium text-gray-700 bg-white border border-gray-200 rounded-lg md:w-40 focus:ring-2 focus:ring-brazil-blue"
                    value={roleFilter}
                    onChange={(e) => setRoleFilter(e.target.value)}
                  >
                    <option value="">Todas</option>
                    <option value="Master">Master</option>
                    <option value="Financeiro">Financeiro</option>
                    <option value="Colaborador">Colaborador</option>
                    <option value="Cliente">Cliente</option>
                    <option value="Staff">Staff</option>
                  </select>
                </div>
                <div>
                  <label className="block mb-1 text-sm font-semibold text-gray-700 font-montserrat">Status</label>
                  <select 
                    className="w-full px-3 py-2 font-medium text-gray-700 bg-white border border-gray-200 rounded-lg md:w-32 focus:ring-2 focus:ring-brazil-blue"
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                  >
                    <option value="">Todos</option>
                    <option value="ativo">Ativo</option>
                    <option value="Suspenso">Suspenso</option>
                    <option value="inativo">Inativo</option>
                  </select>
                </div>
                <button 
                  className="px-4 py-2 ml-auto font-semibold transition rounded-lg shadow bg-brazil-yellow text-brazil-blue hover:bg-yellow-200 md:ml-0"
                  onClick={clearFilters}
                >
                  Limpar
                </button>
              </div>

              {/* Table */}
              <div className="flex flex-col flex-1 p-0 overflow-hidden bg-white shadow-lg rounded-xl">
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-100">
                    <thead className="bg-brazil-blue">
                      <tr>
                        <th className="px-6 py-4 text-xs font-bold tracking-wider text-left text-white font-montserrat">Nome</th>
                        <th className="px-4 py-4 text-xs font-bold tracking-wider text-left text-white font-montserrat">Telefone</th>
                        <th className="px-4 py-4 text-xs font-bold tracking-wider text-left text-white font-montserrat">Email</th>
                        <th className="px-4 py-4 text-xs font-bold tracking-wider text-left text-white font-montserrat">acessos</th>
                        <th className="px-4 py-4 text-xs font-bold tracking-wider text-center text-white font-montserrat">Status</th>
                        <th className="px-4 py-4 text-xs font-bold tracking-wider text-center text-white font-montserrat">ações</th>
                      </tr>
                    </thead>
                    <tbody className="font-medium text-gray-800 bg-white divide-y divide-gray-100">
                      {currentCustomers.map((customer, index) => {
                        const role = getRoleDisplay(customer.role);
                        const status = getStatusDisplay(customer.status);
                        return (
                          <tr key={customer.id} className="transition cursor-pointer hover:bg-gray-50" data-id={customer.id}>
                            <td className="flex items-center px-6 py-4">
                              <img 
                                src={getAvatarImage(customer, index)} 
                                alt="" 
                                className={`w-8 h-8 mr-3 border-2 rounded-full ${getBorderColor(customer.role)}`} 
                              />
                              {customer.firstName} {customer.lastName}
                            </td>
                            <td className="px-4 py-4">{customer.phone || 'Não informado'}</td>
                            <td className="px-4 py-4">{customer.email}</td>
                            <td className="px-4 py-4">
                              <span className={`inline-flex items-center px-2 py-1 mr-1 text-xs font-semibold rounded bg-${role.color} bg-opacity-10 text-${role.color}`}>
                                {role.icon && <i className={`mr-1 fa-solid ${role.icon}`}></i>}
                                {role.label}
                              </span>
                            </td>
                            <td className="px-4 py-4 text-center">
                              <span className={`inline-flex items-center px-2 py-1 text-xs font-semibold ${
                                status.color === 'brazil-green' ? 'bg-green-100 text-brazil-green' :
                                status.color === 'brazil-yellow' ? 'bg-yellow-100 text-brazil-yellow' :
                                'bg-red-100 text-brazil-red'
                              } rounded`}>
                                <i className="mr-1 text-xs fa-solid fa-circle"></i> {status.label}
                              </span>
                            </td>
                            <td className="px-6 py-4 text-center">
                              <button 
                                className="mr-2 text-brazil-blue hover:text-brazil-green"
                                onClick={() => showCustomerProfile(customer)}
                              >
                                <i className="fa-solid fa-eye"></i>
                              </button>
                              <button className="mr-2 text-brazil-blue hover:text-brazil-green">
                                <i className="fa-solid fa-file-pen"></i>
                              </button>
                              <button className="text-brazil-blue hover:text-brazil-green">
                                <i className="fa-solid fa-trash-can"></i>
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
                
                {/* Pagination */}
                <div className="flex items-center justify-between px-6 py-3 bg-gray-50">
                  <span className="text-xs text-gray-600">
                    Exibindo {startIndex + 1}-{Math.min(endIndex, filteredCustomers.length)} de {filteredCustomers.length} clientes
                  </span>
                  <div className="space-x-1">
                    <button 
                      className="px-2 py-1 transition rounded text-brazil-blue hover:bg-brazil-blue hover:text-white disabled:opacity-50"
                      disabled={currentPage === 1}
                      onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                    >
                      <i className="fa-solid fa-angle-left"></i>
                    </button>
                    {[...Array(totalPages)].map((_, i) => (
                      <button 
                        key={i + 1}
                        className={`px-2 py-1 rounded transition ${
                          currentPage === i + 1 
                            ? 'font-bold text-brazil-blue bg-brazil-yellow' 
                            : 'text-brazil-blue hover:bg-brazil-blue hover:text-white'
                        }`}
                        onClick={() => setCurrentPage(i + 1)}
                      >
                        {i + 1}
                      </button>
                    ))}
                    <button 
                      className="px-2 py-1 transition rounded text-brazil-blue hover:bg-brazil-blue hover:text-white disabled:opacity-50"
                      disabled={currentPage === totalPages}
                      onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                    >
                      <i className="fa-solid fa-angle-right"></i>
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Customer Profile Card */}
            {selectedCustomer && (
              <div className="w-full lg:w-[400px] bg-white rounded-2xl shadow-xl p-8 flex flex-col transition-all duration-300" style={{minWidth: '370px', maxWidth: '400px'}}>
                <button 
                  onClick={hideCustomerProfile}
                  className="self-end mb-4 text-gray-400 hover:text-gray-600"
                >
                  <i className="fa-solid fa-times"></i>
                </button>
                
                <div className="flex flex-col items-center">
                  <img 
                    src={getAvatarImage(selectedCustomer, 0)} 
                    alt="" 
                    className={`object-cover w-24 h-24 mb-3 border-4 rounded-full shadow-lg ${getBorderColor(selectedCustomer.role)}`} 
                  />
                  <div className="flex items-center mb-2 space-x-2">
                    <h2 className="text-xl font-bold text-gray-800 font-montserrat">
                      {selectedCustomer.firstName} {selectedCustomer.lastName}
                    </h2>
                    <span className={`inline-flex items-center px-2 py-1 text-xs font-semibold rounded bg-${getRoleDisplay(selectedCustomer.role).color} bg-opacity-10 text-${getRoleDisplay(selectedCustomer.role).color}`}>
                      {getRoleDisplay(selectedCustomer.role).icon && (
                        <i className={`mr-1 fa-solid ${getRoleDisplay(selectedCustomer.role).icon}`}></i>
                      )}
                      {getRoleDisplay(selectedCustomer.role).label}
                    </span>
                  </div>
                  <span className={`inline-flex items-center px-2 py-1 mb-2 text-xs font-semibold ${
                    getStatusDisplay(selectedCustomer.status).color === 'brazil-green' ? 'bg-green-100 text-brazil-green' :
                    getStatusDisplay(selectedCustomer.status).color === 'brazil-yellow' ? 'bg-yellow-100 text-brazil-yellow' :
                    'bg-red-100 text-brazil-red'
                  } rounded`}>
                    <i className="mr-1 text-xs fa-solid fa-circle"></i> {getStatusDisplay(selectedCustomer.status).label}
                  </span>
                  <p className="mb-1 text-sm text-gray-600">{selectedCustomer.email}</p>
                  <p className="mb-5 text-sm text-gray-600">{selectedCustomer.phone || 'Telefone não informado'}</p>
                </div>
                
                <div className="mb-6">
                  <h3 className="mb-2 font-semibold text-gray-800 text-md font-montserrat">Classificações</h3>
                  <div className="flex flex-wrap gap-2">
                    <span className={`inline-flex items-center px-2 py-1 text-xs font-semibold rounded bg-${getRoleDisplay(selectedCustomer.role).color} bg-opacity-10 text-${getRoleDisplay(selectedCustomer.role).color}`}>
                      {getRoleDisplay(selectedCustomer.role).icon && (
                        <i className={`mr-1 fa-solid ${getRoleDisplay(selectedCustomer.role).icon}`}></i>
                      )}
                      {getRoleDisplay(selectedCustomer.role).label}
                    </span>
                    {selectedCustomer.loyaltyPoints && selectedCustomer.loyaltyPoints > 100 && (
                      <span className="inline-flex items-center px-2 py-1 text-xs font-semibold rounded bg-brazil-yellow bg-opacity-20 text-brazil-blue">
                        Frequente
                      </span>
                    )}
                  </div>
                </div>

                <div className="mb-6">
                  <h3 className="mb-2 font-semibold text-gray-800 text-md font-montserrat">Informações</h3>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Username:</span>
                      <span className="text-sm font-medium">@{selectedCustomer.username}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Pontos de fidelidade:</span>
                      <span className="text-sm font-medium">{selectedCustomer.loyaltyPoints || 0}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Membro desde:</span>
                      <span className="text-sm font-medium">
                        {selectedCustomer.memberSince ? new Date(selectedCustomer.memberSince).toLocaleDateString('pt-PT') : 'N/A'}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="mt-auto">
                  <button className="w-full px-4 py-2 mb-2 font-semibold transition rounded-lg bg-brazil-blue text-white hover:bg-blue-700">
                    <i className="mr-2 fa-solid fa-file-pen"></i>
                    Editar Cliente
                  </button>
                  <button className="w-full px-4 py-2 font-semibold transition border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50">
                    <i className="mr-2 fa-solid fa-history"></i>
                    Ver Histórico
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}