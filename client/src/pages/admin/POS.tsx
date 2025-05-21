import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import AdminLayout from "@/layouts/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Plus,
  Minus,
  ShoppingCart,
  Users,
  Receipt,
  X,
  Search,
  CreditCard,
} from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import PaymentModal from "@/components/pos/PaymentModal";

export default function POS() {
  const { t } = useTranslation();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // State for the POS system
  const [cart, setCart] = useState<{ 
    [itemId: number]: { 
      name: string; 
      price: number; 
      quantity: number; 
      menuItemId: number; 
      notes?: string;
    } 
  }>({});
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedUser, setSelectedUser] = useState<number | null>(null);
  const [selectedReservation, setSelectedReservation] = useState<number | null>(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);

  // Queries
  const { data: users = [] } = useQuery({
    queryKey: ["/api/users"],
    select: (data) => data.filter((user: any) => user.status !== "inactive"),
  });

  const { data: reservations = [] } = useQuery({
    queryKey: ["/api/reservations"],
    enabled: !!selectedUser,
    select: (data) => {
      // Filter for active reservations for the selected user
      return data.filter((res: any) => 
        res.userId === selectedUser && 
        ["confirmed", "pending"].includes(res.status)
      );
    }
  });

  const { data: menuCategories = [] } = useQuery({
    queryKey: ["/api/menu-categories"],
  });

  const { data: menuItems = [], isLoading: isLoadingMenuItems } = useQuery({
    queryKey: ["/api/menu-items"],
    select: (data) => {
      // Filter by search query if present
      if (searchQuery) {
        return data.filter((item: any) => 
          item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          item.description?.toLowerCase().includes(searchQuery.toLowerCase())
        );
      }
      
      // Filter by category if selected
      if (selectedCategory) {
        return data.filter((item: any) => item.categoryId === selectedCategory);
      }
      
      return data;
    }
  });

  // Add item to cart
  const addToCart = (itemId: number) => {
    const item = menuItems.find((item: any) => item.id === itemId);
    if (!item) return;

    setCart(prevCart => {
      const newCart = { ...prevCart };
      if (newCart[itemId]) {
        newCart[itemId] = {
          ...newCart[itemId],
          quantity: newCart[itemId].quantity + 1
        };
      } else {
        newCart[itemId] = {
          name: item.name,
          price: item.price,
          quantity: 1,
          menuItemId: item.id
        };
      }
      return newCart;
    });
  };

  // Remove item from cart
  const removeFromCart = (itemId: number) => {
    setCart(prevCart => {
      const newCart = { ...prevCart };
      if (newCart[itemId] && newCart[itemId].quantity > 1) {
        newCart[itemId] = {
          ...newCart[itemId],
          quantity: newCart[itemId].quantity - 1
        };
      } else {
        delete newCart[itemId];
      }
      return newCart;
    });
  };

  // Clear the entire cart
  const clearCart = () => {
    setCart({});
  };

  // Calculate cart total
  const getCartTotal = () => {
    return Object.values(cart).reduce((total, item) => total + (item.price * item.quantity), 0);
  };

  // Process payment
  const handlePaymentSuccess = async (paymentId: number) => {
    // Create an order using the payment ID
    if (Object.keys(cart).length === 0) {
      toast({
        title: t('pos.emptyCartError'),
        description: t('pos.addItemsToCart'),
        variant: "destructive",
      });
      return;
    }

    try {
      const items = Object.values(cart).map(item => ({
        menuItemId: item.menuItemId,
        quantity: item.quantity,
        price: item.price,
        notes: item.notes || null,
      }));

      const orderData = {
        totalAmount: getCartTotal(),
        userId: selectedUser,
        reservationId: selectedReservation || null,
        items,
        paymentId,
        status: "completed",
      };

      await apiRequest("POST", "/api/orders", orderData);

      toast({
        title: t('pos.orderCompleted'),
        description: t('pos.paymentSuccessful'),
      });
      
      // Reset state
      clearCart();
      setShowPaymentModal(false);
      
      // Invalidate queries to refresh data
      queryClient.invalidateQueries({ queryKey: ["/api/orders"] });
      queryClient.invalidateQueries({ queryKey: ["/api/reservations"] });
      
    } catch (error: any) {
      toast({
        title: t('pos.orderError'),
        description: error.message || t('pos.tryAgain'),
        variant: "destructive",
      });
    }
  };

  // Select a customer for the order
  const selectCustomer = (userId: string) => {
    setSelectedUser(parseInt(userId));
    setSelectedReservation(null);
  };

  // Submit the order and open payment modal
  const handleCheckout = () => {
    if (!selectedUser) {
      toast({
        title: t('pos.userRequired'),
        description: t('pos.selectUserFirst'),
        variant: "destructive",
      });
      return;
    }

    if (Object.keys(cart).length === 0) {
      toast({
        title: t('pos.emptyCartError'),
        description: t('pos.addItemsToCart'),
        variant: "destructive",
      });
      return;
    }

    setShowPaymentModal(true);
  };

  // Get customer display name
  const getCustomerName = () => {
    if (!selectedUser) return t('pos.selectCustomer');
    
    const user = users.find((u: any) => u.id === selectedUser);
    return user ? `${user.firstName} ${user.lastName}` : t('pos.unknownCustomer');
  };

  return (
    <AdminLayout title={t('pos.pointOfSale')}>
      <div className="flex flex-col min-h-screen">
        <div className="p-4 sm:p-6 lg:p-8 flex-1 flex flex-col md:flex-row gap-6">
          {/* Customer Selection, Cart and Payment Section */}
          <div className="w-full md:w-1/3 lg:w-1/4 flex flex-col gap-6">
            {/* Customer Selection */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Users className="h-5 w-5" /> {t('pos.customer')}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <Select onValueChange={selectCustomer} value={selectedUser?.toString()}>
                    <SelectTrigger>
                      <SelectValue placeholder={t('pos.selectCustomer')} />
                    </SelectTrigger>
                    <SelectContent>
                      {users.map((user: any) => (
                        <SelectItem key={user.id} value={user.id.toString()}>
                          {user.firstName} {user.lastName}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  
                  {selectedUser && reservations.length > 0 && (
                    <div className="mt-3">
                      <label className="text-sm font-medium mb-1 block">
                        {t('pos.linkedReservation')}
                      </label>
                      <Select 
                        onValueChange={(val) => setSelectedReservation(parseInt(val))}
                        value={selectedReservation?.toString() || ""}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder={t('pos.selectReservation')} />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="">{t('pos.noReservation')}</SelectItem>
                          {reservations.map((res: any) => (
                            <SelectItem key={res.id} value={res.id.toString()}>
                              {new Date(res.date).toLocaleDateString()} - {res.partySize} {t('pos.people')}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Cart */}
            <Card className="flex-1 flex flex-col">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <ShoppingCart className="h-5 w-5" /> {t('pos.cart')}
                </CardTitle>
              </CardHeader>
              <CardContent className="flex-1 flex flex-col">
                <div className="flex-1">
                  {Object.keys(cart).length === 0 ? (
                    <div className="text-center py-6 text-muted-foreground">
                      {t('pos.emptyCart')}
                    </div>
                  ) : (
                    <ScrollArea className="h-[calc(100vh-450px)]">
                      <div className="space-y-3">
                        {Object.entries(cart).map(([id, item]) => (
                          <div key={id} className="flex justify-between items-center p-2 bg-muted/30 rounded-md">
                            <div className="flex-1">
                              <div className="font-medium">{item.name}</div>
                              <div className="text-sm text-muted-foreground">
                                {(item.price / 100).toFixed(2)}€ × {item.quantity}
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <Button 
                                variant="outline" 
                                size="icon" 
                                className="h-7 w-7"
                                onClick={() => removeFromCart(parseInt(id))}
                              >
                                <Minus className="h-3 w-3" />
                              </Button>
                              <span className="w-6 text-center">{item.quantity}</span>
                              <Button 
                                variant="outline" 
                                size="icon" 
                                className="h-7 w-7"
                                onClick={() => addToCart(parseInt(id))}
                              >
                                <Plus className="h-3 w-3" />
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </ScrollArea>
                  )}
                </div>

                <div className="border-t mt-4 pt-4">
                  <div className="flex justify-between font-medium mb-1">
                    <span>{t('pos.total')}</span>
                    <span>{(getCartTotal() / 100).toFixed(2)}€</span>
                  </div>
                  <div className="flex justify-between items-center mt-3">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={clearCart}
                      disabled={Object.keys(cart).length === 0}
                    >
                      <X className="h-4 w-4 mr-2" />
                      {t('pos.clear')}
                    </Button>
                    <Button 
                      onClick={handleCheckout}
                      disabled={Object.keys(cart).length === 0 || !selectedUser}
                    >
                      <CreditCard className="h-4 w-4 mr-2" />
                      {t('pos.payment')}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Menu Items Section */}
          <div className="w-full md:w-2/3 lg:w-3/4">
            <Card className="h-full flex flex-col">
              <CardHeader className="pb-3">
                <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Receipt className="h-5 w-5" /> {t('pos.menu')}
                  </CardTitle>
                  <div className="relative w-full sm:w-72">
                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder={t('pos.searchItems')}
                      className="pl-8"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                  </div>
                </div>
              </CardHeader>
              <CardContent className="flex-1 flex flex-col pb-6">
                <Tabs 
                  defaultValue="all" 
                  className="flex-1 flex flex-col"
                  onValueChange={(value) => {
                    setSelectedCategory(value === "all" ? null : parseInt(value));
                    setSearchQuery("");
                  }}
                >
                  <TabsList className="mb-6 flex flex-wrap justify-start h-auto pb-0">
                    <TabsTrigger 
                      value="all" 
                      className="mb-2 mr-2"
                    >
                      {t('pos.allItems')}
                    </TabsTrigger>
                    {menuCategories.map((category: any) => (
                      <TabsTrigger 
                        key={category.id} 
                        value={category.id.toString()}
                        className="mb-2 mr-2"
                      >
                        {category.name}
                      </TabsTrigger>
                    ))}
                  </TabsList>
                  
                  <ScrollArea className="flex-1 rounded-md border">
                    {isLoadingMenuItems ? (
                      <div className="p-8 text-center text-muted-foreground">
                        {t('pos.loadingItems')}
                      </div>
                    ) : menuItems.length === 0 ? (
                      <div className="p-8 text-center text-muted-foreground">
                        {searchQuery ? t('pos.noSearchResults') : t('pos.noItemsInCategory')}
                      </div>
                    ) : (
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>{t('pos.itemName')}</TableHead>
                            <TableHead className="w-[100px] text-right">{t('pos.price')}</TableHead>
                            <TableHead className="w-[100px]"></TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {menuItems.map((item: any) => (
                            <TableRow key={item.id}>
                              <TableCell>
                                <div>
                                  <div className="font-medium">{item.name}</div>
                                  {item.description && (
                                    <div className="text-sm text-muted-foreground">
                                      {item.description.substring(0, 60)}
                                      {item.description.length > 60 ? '...' : ''}
                                    </div>
                                  )}
                                  {item.categoryId && (
                                    <Badge variant="outline" className="mt-1">
                                      {menuCategories.find((c: any) => c.id === item.categoryId)?.name}
                                    </Badge>
                                  )}
                                </div>
                              </TableCell>
                              <TableCell className="text-right">
                                {(item.price / 100).toFixed(2)}€
                              </TableCell>
                              <TableCell>
                                <div className="flex items-center justify-end gap-2">
                                  {cart[item.id] && (
                                    <>
                                      <Button 
                                        variant="outline" 
                                        size="icon" 
                                        className="h-8 w-8"
                                        onClick={() => removeFromCart(item.id)}
                                      >
                                        <Minus className="h-4 w-4" />
                                      </Button>
                                      <span className="w-6 text-center">
                                        {cart[item.id]?.quantity || 0}
                                      </span>
                                    </>
                                  )}
                                  <Button 
                                    variant="outline" 
                                    size="icon" 
                                    className="h-8 w-8"
                                    onClick={() => addToCart(item.id)}
                                  >
                                    <Plus className="h-4 w-4" />
                                  </Button>
                                </div>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    )}
                  </ScrollArea>
                </Tabs>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Payment Modal */}
      {showPaymentModal && (
        <PaymentModal
          isOpen={showPaymentModal}
          onClose={() => setShowPaymentModal(false)}
          onPaymentSuccess={handlePaymentSuccess}
          totalAmount={getCartTotal()}
          userId={selectedUser!}
          reservationId={selectedReservation || undefined}
        />
      )}
    </AdminLayout>
  );
}