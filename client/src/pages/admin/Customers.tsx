import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useLocation } from 'wouter';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useQuery } from '@tanstack/react-query';
import { Search, UserPlus, Eye, Edit, Trash2 } from 'lucide-react';
import AdminLayout from '@/components/layouts/AdminLayout';
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
  
  // Fetch customers
  const { data: customers, isLoading: customersLoading } = useQuery<any>({
    queryKey: ['/api/users'],
    enabled: isAuthenticated && isAdmin,
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
  
  // Handle opening customer details modal
  const handleViewCustomer = (customer: any) => {
    setViewCustomerInfo(customer);
    setIsViewModalOpen(true);
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
                      <TableCell className="text-right">
                        <div className="flex justify-end space-x-2">
                          <Button variant="ghost" size="icon" onClick={() => handleViewCustomer(customer)}>
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon">
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon">
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
            <Button>
              <Edit className="mr-2 h-4 w-4" /> {t('EditCustomer')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
};

export default Customers;
