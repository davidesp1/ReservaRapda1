import React, { useState } from 'react';
import AdminLayout from '@/components/layouts/AdminLayout';
import { useQuery } from '@tanstack/react-query';
import { Search } from 'lucide-react';

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
  birthDate?: string;
  profilePicture?: string;
  role: string;
  memberSince?: string;
  status?: string;
  loyaltyPoints?: number;
}

interface Reservation {
  id: number;
  user_id: number;
  table_id: number;
  date: string;
  time: string;
  guests: number;
  status: string;
  user_name?: string;
  table_number?: number;
}

export default function Customers() {
  const [searchTerm, setSearchTerm] = useState('');
  const [tagFilter, setTagFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [showProfile, setShowProfile] = useState(false);

  const { data: users = [], isLoading } = useQuery<User[]>({
    queryKey: ['/api/users'],
    staleTime: 30000,
  });

  const { data: reservations = [] } = useQuery<Reservation[]>({
    queryKey: ['/api/admin/reservations'],
    staleTime: 30000,
  });

  const customers = users.filter(user => user.role === 'customer');

  const getCustomerTag = (user: User) => {
    const points = user.loyaltyPoints || 0;
    const reservationCount = reservations.filter(r => r.user_id === user.id).length;
    
    if (points >= 1000 || reservationCount >= 10) {
      return { label: 'VIP', icon: 'crown', color: 'brasil-green', bg: 'bg-brasil-green bg-opacity-10 text-brasil-green' };
    } else if (points >= 500 || reservationCount >= 5) {
      return { label: 'Frequente', icon: 'fire', color: 'brasil-red', bg: 'bg-brasil-red bg-opacity-10 text-brasil-red' };
    } else if (reservationCount <= 2) {
      return { label: 'Novato', icon: 'star', color: 'brasil-yellow', bg: 'bg-brasil-yellow bg-opacity-10 text-brasil-yellow' };
    }
    return { label: 'Regular', icon: '', color: 'gray-600', bg: 'bg-gray-100 text-gray-600' };
  };

  const getCustomerReservationCount = (userId: number) => {
    return reservations.filter(r => r.user_id === userId).length;
  };

  const getCustomerReservations = (userId: number) => {
    return reservations
      .filter(r => r.user_id === userId)
      .slice(0, 5)
      .map(r => ({
        mesa: `Mesa ${r.table_number || r.table_id}`,
        data: new Date(r.date).toLocaleDateString('pt-PT'),
        pessoas: r.guests,
        hora: r.time,
        status: r.status === 'confirmed' ? 'Confirmada' : 
               r.status === 'completed' ? 'Realizada' : 
               r.status === 'cancelled' ? 'Cancelada' : 'Pendente',
        color: r.status === 'confirmed' ? 'bg-brasil-blue text-white' :
               r.status === 'completed' ? 'bg-brasil-yellow text-brasil-blue' :
               r.status === 'cancelled' ? 'bg-brasil-red text-white' : 'bg-gray-500 text-white'
      }));
  };

  const filteredCustomers = customers.filter(user => {
    const matchesSearch = searchTerm === '' || 
      user.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (user.phone && user.phone.includes(searchTerm));
    
    const userTag = getCustomerTag(user);
    const matchesTag = tagFilter === '' || userTag.label === tagFilter;
    const matchesStatus = statusFilter === '' || user.status === statusFilter;
    
    return matchesSearch && matchesTag && matchesStatus;
  });

  const showClienteProfile = (user: User) => {
    setSelectedUser(user);
    setShowProfile(true);
  };

  const hideClienteProfile = () => {
    setShowProfile(false);
    setSelectedUser(null);
  };

  const clearFilters = () => {
    setSearchTerm('');
    setTagFilter('');
    setStatusFilter('');
  };

  if (isLoading) {
    return (
      <AdminLayout title="Gestão de Clientes">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brasil-blue"></div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title="Gestão de Clientes">
      <div className="flex flex-col lg:flex-row gap-8 h-[720px]">
        {/* Table Section */}
        <div className="flex-1 flex flex-col">
          {/* Filters */}
          <div className="mb-4 flex flex-col md:flex-row md:items-end md:space-x-6 space-y-3 md:space-y-0">
            <div className="flex-1">
              <label className="block text-sm font-semibold mb-1 text-gray-700 font-montserrat">Buscar Cliente</label>
              <div className="relative">
                <input
                  type="text"
                  placeholder="Nome, email ou telefone"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-brasil-blue bg-white text-gray-800 font-medium transition"
                />
                <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
                  <Search className="h-4 w-4" />
                </span>
              </div>
            </div>
            <div>
              <label className="block text-sm font-semibold mb-1 text-gray-700 font-montserrat">Classificação</label>
              <select
                value={tagFilter}
                onChange={(e) => setTagFilter(e.target.value)}
                className="w-full md:w-40 border border-gray-200 rounded-lg py-2 px-3 bg-white text-gray-700 font-medium focus:ring-2 focus:ring-brasil-blue"
              >
                <option value="">Todas</option>
                <option value="VIP">VIP</option>
                <option value="Frequente">Frequente</option>
                <option value="Novato">Novato</option>
                <option value="Regular">Regular</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold mb-1 text-gray-700 font-montserrat">Status</label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full md:w-32 border border-gray-200 rounded-lg py-2 px-3 bg-white text-gray-700 font-medium focus:ring-2 focus:ring-brasil-blue"
              >
                <option value="">Todos</option>
                <option value="active">Ativo</option>
                <option value="inactive">Inativo</option>
              </select>
            </div>
            <button
              onClick={clearFilters}
              className="bg-brasil-yellow text-brasil-blue font-semibold rounded-lg px-4 py-2 shadow hover:bg-yellow-200 transition ml-auto md:ml-0"
            >
              Limpar
            </button>
          </div>

          {/* Table */}
          <div className="bg-white rounded-xl shadow-lg p-0 overflow-hidden flex-1 flex flex-col">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-100">
                <thead className="bg-brasil-blue">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-bold text-white tracking-wider font-montserrat">Nome</th>
                    <th className="px-4 py-4 text-left text-xs font-bold text-white tracking-wider font-montserrat">Email</th>
                    <th className="px-4 py-4 text-left text-xs font-bold text-white tracking-wider font-montserrat">Telefone</th>
                    <th className="px-4 py-4 text-left text-xs font-bold text-white tracking-wider font-montserrat">Tags</th>
                    <th className="px-4 py-4 text-center text-xs font-bold text-white tracking-wider font-montserrat">Status</th>
                    <th className="px-4 py-4 text-center text-xs font-bold text-white tracking-wider font-montserrat">Reservas</th>
                    <th className="px-6 py-4"></th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-100 text-gray-800 font-medium">
                  {filteredCustomers.map((user) => {
                    const tag = getCustomerTag(user);
                    const reservationCount = getCustomerReservationCount(user.id);
                    
                    return (
                      <tr key={user.id} className="hover:bg-gray-50 transition cursor-pointer">
                        <td className="px-6 py-4 flex items-center">
                          <img
                            src={user.profilePicture || `https://ui-avatars.com/api/?name=${user.firstName}+${user.lastName}&background=002776&color=fff`}
                            alt=""
                            className="w-8 h-8 rounded-full border-2 border-brasil-green mr-3"
                          />
                          {user.firstName} {user.lastName}
                        </td>
                        <td className="px-4 py-4">{user.email}</td>
                        <td className="px-4 py-4">{user.phone || 'N/A'}</td>
                        <td className="px-4 py-4">
                          <span className={`inline-flex items-center px-2 py-1 text-xs font-semibold rounded ${tag.bg}`}>
                            {tag.icon === 'crown' && <i className="fa-solid fa-crown mr-1"></i>}
                            {tag.icon === 'star' && <i className="fa-solid fa-star mr-1"></i>}
                            {tag.icon === 'fire' && <i className="fa-solid fa-fire mr-1"></i>}
                            {tag.label}
                          </span>
                        </td>
                        <td className="px-4 py-4 text-center">
                          <span className={`inline-flex items-center px-2 py-1 text-xs font-semibold rounded ${
                            user.status === 'active' ? 'bg-green-100 text-brasil-green' : 'bg-red-100 text-brasil-red'
                          }`}>
                            <i className="fa-solid fa-circle mr-1 text-xs"></i>
                            {user.status === 'active' ? 'Ativo' : 'Inativo'}
                          </span>
                        </td>
                        <td className="px-4 py-4 text-center">{reservationCount}</td>
                        <td className="px-6 py-4 text-center">
                          <button
                            onClick={() => showClienteProfile(user)}
                            className="text-brasil-blue hover:text-brasil-green"
                          >
                            <i className="fa-solid fa-eye"></i>
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            
            {/* Pagination */}
            <div className="px-6 py-3 flex justify-between items-center bg-gray-50">
              <span className="text-xs text-gray-600">
                Exibindo {filteredCustomers.length} de {customers.length} clientes
              </span>
              <div className="space-x-1">
                <button className="px-2 py-1 rounded text-brasil-blue hover:bg-brasil-blue hover:text-white transition">
                  <i className="fa-solid fa-angle-left"></i>
                </button>
                <button className="px-2 py-1 rounded text-brasil-blue bg-brasil-yellow font-bold">1</button>
                <button className="px-2 py-1 rounded text-brasil-blue hover:bg-brasil-blue hover:text-white transition">
                  <i className="fa-solid fa-angle-right"></i>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Customer Profile Panel */}
        {showProfile && selectedUser && (
          <div className="w-full lg:w-[400px] bg-white rounded-2xl shadow-xl p-8 flex flex-col transition-all duration-300" style={{ minWidth: '370px', maxWidth: '400px' }}>
            <div className="flex flex-col items-center">
              <img
                src={selectedUser.profilePicture || `https://ui-avatars.com/api/?name=${selectedUser.firstName}+${selectedUser.lastName}&background=002776&color=fff`}
                alt=""
                className="w-24 h-24 rounded-full border-4 border-brasil-green object-cover shadow-lg mb-3"
              />
              <div className="flex items-center space-x-2 mb-2">
                <h2 className="text-xl font-bold font-montserrat text-gray-800">
                  {selectedUser.firstName} {selectedUser.lastName}
                </h2>
                <span className={`inline-flex items-center px-2 py-1 text-xs font-semibold rounded ${getCustomerTag(selectedUser).bg}`}>
                  {getCustomerTag(selectedUser).icon === 'crown' && <i className="fa-solid fa-crown mr-1"></i>}
                  {getCustomerTag(selectedUser).icon === 'star' && <i className="fa-solid fa-star mr-1"></i>}
                  {getCustomerTag(selectedUser).icon === 'fire' && <i className="fa-solid fa-fire mr-1"></i>}
                  {getCustomerTag(selectedUser).label}
                </span>
              </div>
              <span className={`inline-flex items-center px-2 py-1 text-xs font-semibold rounded mb-2 ${
                selectedUser.status === 'active' ? 'bg-green-100 text-brasil-green' : 'bg-red-100 text-brasil-red'
              }`}>
                <i className="fa-solid fa-circle mr-1 text-xs"></i>
                {selectedUser.status === 'active' ? 'Ativo' : 'Inativo'}
              </span>
              <p className="text-sm text-gray-600 mb-1">{selectedUser.email}</p>
              <p className="text-sm text-gray-600 mb-5">{selectedUser.phone || 'Telefone não informado'}</p>
            </div>

            <div className="mb-6">
              <h3 className="text-md font-semibold font-montserrat text-gray-800 mb-2">Informações</h3>
              <div className="space-y-2 text-sm">
                <p><strong>Pontos:</strong> {selectedUser.loyaltyPoints || 0}</p>
                <p><strong>Membro desde:</strong> {selectedUser.memberSince ? new Date(selectedUser.memberSince).toLocaleDateString('pt-PT') : 'N/A'}</p>
                {selectedUser.address && (
                  <p><strong>Endereço:</strong> {selectedUser.address}, {selectedUser.city}</p>
                )}
              </div>
            </div>

            <div className="">
              <h3 className="text-md font-semibold font-montserrat text-gray-800 mb-2">Histórico de Reservas</h3>
              <div className="space-y-3 max-h-48 overflow-y-auto pr-2">
                {getCustomerReservations(selectedUser.id).map((reserva, index) => (
                  <div key={index} className="flex items-center justify-between bg-gray-50 rounded-lg px-3 py-2">
                    <div>
                      <p className="text-sm font-medium">{reserva.mesa} - {reserva.data}</p>
                      <p className="text-xs text-gray-500">{reserva.pessoas} pessoas - {reserva.hora}</p>
                    </div>
                    <span className={`inline-flex items-center px-2 py-1 text-xs font-semibold rounded ${reserva.color}`}>
                      {reserva.status}
                    </span>
                  </div>
                ))}
                {getCustomerReservations(selectedUser.id).length === 0 && (
                  <p className="text-sm text-gray-500">Nenhuma reserva encontrada</p>
                )}
              </div>
            </div>

            <button
              onClick={hideClienteProfile}
              className="mt-7 bg-brasil-blue text-white font-semibold py-2 rounded-lg shadow hover:bg-brasil-green transition"
            >
              Fechar
            </button>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}