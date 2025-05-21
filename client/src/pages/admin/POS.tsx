import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import AdminLayout from '@/layouts/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import PaymentModal from '@/components/pos/PaymentModal';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Plus, Minus, X, DollarSign } from 'lucide-react';

export default function POS() {
  const { t } = useTranslation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [cart, setCart] = useState<{
    items: {
      id: number;
      name: string;
      price: number; // in cents
      quantity: number;
    }[];
    total: number; // in cents
  }>({
    items: [],
    total: 0
  });

  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<number | null>(null);
  const [customerSearch, setCustomerSearch] = useState('');

  // Fetch menu items
  const { data: menuItems, isLoading: menuItemsLoading } = useQuery({
    queryKey: ['/api/menu/items'],
    retry: false,
  });

  // Fetch menu categories for filtering
  const { data: menuCategories, isLoading: categoriesLoading } = useQuery({
    queryKey: ['/api/menu/categories'],
    retry: false,
  });

  // Fetch users for customer selection
  const { data: users, isLoading: usersLoading } = useQuery({
    queryKey: ['/api/users'],
    retry: false,
  });

  // Filter users based on search term
  const filteredUsers = users?.filter(user => 
    user.username.toLowerCase().includes(customerSearch.toLowerCase()) ||
    user.email.toLowerCase().includes(customerSearch.toLowerCase()) ||
    (user.firstName && user.firstName.toLowerCase().includes(customerSearch.toLowerCase())) ||
    (user.lastName && user.lastName.toLowerCase().includes(customerSearch.toLowerCase()))
  ) || [];

  // Create a payment record after successful checkout
  const createPaymentMutation = useMutation({
    mutationFn: async (paymentId: number) => {
      // We just need to invalidate the payments query cache
      return { success: true, paymentId };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/payments'] });
      // Reset cart
      setCart({ items: [], total: 0 });
      toast({
        title: t('pos.paymentSuccess'),
        description: t('pos.paymentSuccessDescription'),
      });
    },
    onError: (error: Error) => {
      toast({
        title: t('pos.paymentError'),
        description: error.message,
        variant: "destructive",
      });
    }
  });

  // Handle adding an item to the cart
  const addToCart = (item) => {
    setCart(prev => {
      // Check if the item is already in the cart
      const existingItemIndex = prev.items.findIndex(i => i.id === item.id);
      
      if (existingItemIndex >= 0) {
        // Update quantity if item exists
        const updatedItems = [...prev.items];
        updatedItems[existingItemIndex].quantity += 1;
        
        return {
          items: updatedItems,
          total: prev.total + item.price
        };
      } else {
        // Add new item to cart
        return {
          items: [
            ...prev.items,
            {
              id: item.id,
              name: item.name,
              price: item.price,
              quantity: 1
            }
          ],
          total: prev.total + item.price
        };
      }
    });
  };

  // Handle removing an item from the cart
  const removeFromCart = (itemId) => {
    setCart(prev => {
      const existingItemIndex = prev.items.findIndex(i => i.id === itemId);
      
      if (existingItemIndex >= 0) {
        const item = prev.items[existingItemIndex];
        
        if (item.quantity > 1) {
          // Reduce quantity if more than 1
          const updatedItems = [...prev.items];
          updatedItems[existingItemIndex].quantity -= 1;
          
          return {
            items: updatedItems,
            total: prev.total - item.price
          };
        } else {
          // Remove item if quantity is 1
          return {
            items: prev.items.filter(i => i.id !== itemId),
            total: prev.total - item.price
          };
        }
      }
      
      return prev;
    });
  };

  // Handle removing an entire item (all quantities) from cart
  const removeItemCompletely = (itemId) => {
    setCart(prev => {
      const item = prev.items.find(i => i.id === itemId);
      
      if (item) {
        return {
          items: prev.items.filter(i => i.id !== itemId),
          total: prev.total - (item.price * item.quantity)
        };
      }
      
      return prev;
    });
  };

  // Handle proceeding to payment
  const handleCheckout = () => {
    if (!selectedUser) {
      toast({
        title: t('pos.noCustomerSelected'),
        description: t('pos.selectCustomerFirst'),
        variant: "destructive",
      });
      return;
    }

    if (cart.items.length === 0) {
      toast({
        title: t('pos.emptyCart'),
        description: t('pos.addItemsToCart'),
        variant: "destructive",
      });
      return;
    }

    setShowPaymentModal(true);
  };

  // Handle payment completion
  const handlePaymentSuccess = (paymentId: number) => {
    setShowPaymentModal(false);
    createPaymentMutation.mutate(paymentId);
  };

  // Handle selecting a customer
  const selectUser = (userId: number) => {
    setSelectedUser(userId);
    setCustomerSearch('');
  };

  // Get selected user details
  const selectedUserDetails = selectedUser ? users?.find(u => u.id === selectedUser) : null;

  // Group menu items by category
  const menuItemsByCategory = menuCategories?.map(category => ({
    ...category,
    items: menuItems?.filter(item => item.categoryId === category.id) || []
  })) || [];

  return (
    <AdminLayout>
      <div className="container mx-auto py-6">
        <h1 className="text-3xl font-bold mb-6">{t('pos.title')}</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Left column - Menu */}
          <div className="md:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>{t('pos.menu')}</CardTitle>
              </CardHeader>
              <CardContent>
                {categoriesLoading ? (
                  <div className="flex items-center justify-center p-6">
                    <div className="animate-spin w-6 h-6 border-2 border-primary rounded-full border-t-transparent" />
                  </div>
                ) : (
                  <div className="space-y-8">
                    {menuItemsByCategory.map(category => (
                      <div key={category.id} className="space-y-4">
                        <h3 className="text-lg font-semibold">{category.name}</h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                          {category.items.map(item => (
                            <div 
                              key={item.id} 
                              className="p-4 border rounded-lg hover:bg-muted/50 cursor-pointer transition-colors"
                              onClick={() => addToCart(item)}
                            >
                              <div className="font-medium">{item.name}</div>
                              <div className="text-sm text-muted-foreground mt-1">€{(item.price / 100).toFixed(2)}</div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
          
          {/* Right column - Cart and Customer Selection */}
          <div>
            <div className="space-y-6">
              {/* Customer Selection */}
              <Card>
                <CardHeader>
                  <CardTitle>{t('pos.customer')}</CardTitle>
                </CardHeader>
                <CardContent>
                  {selectedUserDetails ? (
                    <div className="space-y-4">
                      <div className="p-4 border rounded-lg">
                        <div className="font-medium">{selectedUserDetails.firstName} {selectedUserDetails.lastName}</div>
                        <div className="text-sm text-muted-foreground">{selectedUserDetails.email}</div>
                      </div>
                      <Button variant="outline" onClick={() => setSelectedUser(null)} className="w-full">
                        {t('pos.changeCustomer')}
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="relative">
                        <Input
                          placeholder={t('pos.searchCustomers')}
                          value={customerSearch}
                          onChange={(e) => setCustomerSearch(e.target.value)}
                        />
                        {customerSearch && filteredUsers.length > 0 && (
                          <div className="absolute z-10 w-full mt-1 bg-card border rounded-md shadow-lg max-h-48 overflow-y-auto">
                            {filteredUsers.map(user => (
                              <div
                                key={user.id}
                                className="p-2 hover:bg-muted cursor-pointer"
                                onClick={() => selectUser(user.id)}
                              >
                                <div className="font-medium">{user.firstName} {user.lastName}</div>
                                <div className="text-xs text-muted-foreground">{user.email}</div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
              
              {/* Cart */}
              <Card>
                <CardHeader>
                  <CardTitle>{t('pos.cart')}</CardTitle>
                </CardHeader>
                <CardContent>
                  {cart.items.length === 0 ? (
                    <div className="text-center py-6 text-muted-foreground">
                      {t('pos.emptyCartMessage')}
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>{t('pos.item')}</TableHead>
                            <TableHead className="text-right">{t('pos.price')}</TableHead>
                            <TableHead className="text-center">{t('pos.quantity')}</TableHead>
                            <TableHead className="text-right">{t('pos.subtotal')}</TableHead>
                            <TableHead></TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {cart.items.map(item => (
                            <TableRow key={item.id}>
                              <TableCell>{item.name}</TableCell>
                              <TableCell className="text-right">€{(item.price / 100).toFixed(2)}</TableCell>
                              <TableCell>
                                <div className="flex items-center justify-center space-x-2">
                                  <Button 
                                    variant="outline" 
                                    size="sm"
                                    onClick={() => removeFromCart(item.id)}
                                  >
                                    <Minus className="h-3 w-3" />
                                  </Button>
                                  <span>{item.quantity}</span>
                                  <Button 
                                    variant="outline" 
                                    size="sm"
                                    onClick={() => addToCart(item)}
                                  >
                                    <Plus className="h-3 w-3" />
                                  </Button>
                                </div>
                              </TableCell>
                              <TableCell className="text-right font-medium">
                                €{((item.price * item.quantity) / 100).toFixed(2)}
                              </TableCell>
                              <TableCell>
                                <Button 
                                  variant="ghost" 
                                  size="sm"
                                  onClick={() => removeItemCompletely(item.id)}
                                >
                                  <X className="h-4 w-4" />
                                </Button>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                      
                      <div className="flex justify-between items-center pt-4 border-t">
                        <div className="font-semibold text-lg">{t('pos.total')}</div>
                        <div className="font-bold text-xl">€{(cart.total / 100).toFixed(2)}</div>
                      </div>
                      
                      <Button 
                        className="w-full"
                        onClick={handleCheckout}
                        disabled={cart.items.length === 0 || !selectedUser}
                      >
                        <DollarSign className="mr-2 h-4 w-4" />
                        {t('pos.checkout')}
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
      
      {showPaymentModal && (
        <PaymentModal
          isOpen={showPaymentModal}
          onClose={() => setShowPaymentModal(false)}
          onPaymentSuccess={handlePaymentSuccess}
          totalAmount={cart.total}
          userId={selectedUser}
        />
      )}
    </AdminLayout>
  );
}