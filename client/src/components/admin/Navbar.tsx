import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Bell } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface NavbarProps {
  title: string;
}

const AdminNavbar: React.FC<NavbarProps> = ({ title }) => {
  const { user } = useAuth();

  return (
    <div className="flex justify-between items-center mb-8">
      <h1 className="text-2xl font-bold text-gray-800 font-montserrat">{title}</h1>
      <div className="flex items-center space-x-4">
        <div className="relative">
          <Button variant="ghost" size="icon" className="relative">
            <Bell className="h-5 w-5 text-gray-600" />
            <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center">
              3
            </span>
          </Button>
        </div>
        <div className="flex items-center">
          <img 
            src="https://storage.googleapis.com/uxpilot-auth.appspot.com/avatars/avatar-3.jpg" 
            alt="User Avatar" 
            className="w-10 h-10 rounded-full border-2 border-yellow-400" 
          />
          <div className="ml-2">
            <p className="text-sm font-medium text-gray-800">
              {user?.firstName} {user?.lastName}
            </p>
            <p className="text-xs text-gray-500">
              {user?.role === 'admin' ? 'Administrador' : 
               user?.role === 'collaborator' ? 'Colaborador' : 
               'Cliente'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminNavbar;