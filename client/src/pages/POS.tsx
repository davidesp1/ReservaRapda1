import { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent } from '@/components/ui/card';
import { formatCurrency } from '@/lib/utils';
import PaymentModal from '@/components/pos/PaymentModal';

type MenuItem = {
  id: number;
  name: string;
  description: string;
  price: number;
  image: string;
  categoryId: number;
  featured: boolean;
};

type MenuCategory = {
  id: number;
  name: string;
  description: string;
};

type CartItem = {
  id: number;
  menuItem: MenuItem;
  quantity: number;
  notes: string;
};

export default function POS() {
  const { t } = useTranslation();
  const { toast } = useToast();
  const [, navigate] = useLocation();
  const [isAdmin, setIsAdmin] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<number | 'all'>('all');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedTable, setSelectedTable] = useState<number | null>(null);

  // Verificar se o usuário é admin
  useEffect(() => {
    const checkAdminStatus = async () => {
      try {
        const response = await apiRequest('GET', '/api/auth/me');
        const userData = await response.json();
        setIsAdmin(userData.role === 'admin');
      } catch (error) {
        console.error('Erro ao verificar status de administrador:', error);
        navigate('/login');
      }
    };

    checkAdminStatus();
  }, [navigate]);

  // Carregar categorias do menu
  const { data: categories = [] } = useQuery<MenuCategory[]>({
    queryKey: ['/api/menu-categories'],
  });

  // Carregar itens do menu
  const { data: menuItems = [] } = useQuery<MenuItem[]>({
    queryKey: ['/api/menu-items'],
  });

  // Carregar mesas disponíveis
  const { data: tables = [] } = useQuery<any[]>({
    queryKey: ['/api/tables'],
  });

  // Filtrar itens do menu por categoria e pesquisa
  const filteredItems = menuItems.filter((item) => {
    const matchesCategory = activeCategory === 'all' || item.categoryId === activeCategory;
    const matchesSearch = searchQuery === '' || 
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  // Agrupar itens por categoria para exibição
  const itemsByCategory = categories.map(category => {
    const items = filteredItems.filter(item => item.categoryId === category.id);
    return {
      ...category,
      items
    };
  }).filter(category => category.items.length > 0);

  // Adicionar item ao carrinho
  const addToCart = (menuItem: MenuItem) => {
    setCart(prevCart => {
      const existingItem = prevCart.find(item => item.menuItem.id === menuItem.id);
      
      if (existingItem) {
        return prevCart.map(item => 
          item.menuItem.id === menuItem.id 
            ? { ...item, quantity: item.quantity + 1 } 
            : item
        );
      } else {
        return [...prevCart, { 
          id: Date.now(), 
          menuItem, 
          quantity: 1, 
          notes: '' 
        }];
      }
    });

    toast({
      title: t('pos.itemAdded'),
      description: menuItem.name,
    });
  };

  // Remover item do carrinho
  const removeFromCart = (cartItemId: number) => {
    setCart(prevCart => prevCart.filter(item => item.id !== cartItemId));
  };

  // Atualizar quantidade de item no carrinho
  const updateCartItemQuantity = (cartItemId: number, newQuantity: number) => {
    if (newQuantity < 1) return;
    
    setCart(prevCart => 
      prevCart.map(item => 
        item.id === cartItemId 
          ? { ...item, quantity: newQuantity } 
          : item
      )
    );
  };

  // Atualizar observações de item no carrinho
  const updateCartItemNotes = (cartItemId: number, notes: string) => {
    setCart(prevCart => 
      prevCart.map(item => 
        item.id === cartItemId 
          ? { ...item, notes } 
          : item
      )
    );
  };

  // Calcular total do carrinho
  const cartTotal = cart.reduce(
    (total, item) => total + (item.menuItem.price * item.quantity), 
    0
  );

  // Ir para o pagamento
  const handleProceedToPayment = () => {
    if (cart.length === 0) {
      toast({
        title: t('pos.emptyCart'),
        description: t('pos.addItemsFirst'),
        variant: 'destructive',
      });
      return;
    }

    if (!selectedTable) {
      toast({
        title: t('pos.noTableSelected'),
        description: t('pos.selectTableFirst'),
        variant: 'destructive',
      });
      return;
    }

    setShowPaymentModal(true);
  };

  // Lidar com o pagamento concluído
  const handlePaymentComplete = async (paymentMethod: string) => {
    try {
      // Criar o pedido
      const orderData = {
        tableId: selectedTable,
        items: cart.map(item => ({
          menuItemId: item.menuItem.id,
          quantity: item.quantity,
          notes: item.notes,
          price: item.menuItem.price,
        })),
        total: cartTotal,
        paymentMethod,
      };

      const response = await apiRequest('POST', '/api/orders', orderData);
      const order = await response.json();

      toast({
        title: t('pos.orderCreated'),
        description: t('pos.orderNumber', { number: order.id }),
      });

      // Limpar carrinho e fechar modal
      setCart([]);
      setShowPaymentModal(false);
      setSelectedTable(null);
    } catch (error) {
      console.error('Erro ao criar pedido:', error);
      toast({
        title: t('pos.orderError'),
        description: t('pos.tryAgain'),
        variant: 'destructive',
      });
    }
  };

  // Voltar à página anterior
  const handleExitPOS = () => {
    navigate('/admin/dashboard');
  };

  return (
    <div className="h-screen flex flex-col">
      {/* Cabeçalho */}
      <header className="bg-dark text-white p-4 flex justify-between items-center">
        <h1 className="text-2xl font-bold">{t('pos.title')}</h1>
        <Button 
          variant="destructive" 
          onClick={handleExitPOS}
          className="flex items-center gap-2"
        >
          <span className="hidden md:inline">{t('pos.exit')}</span>
        </Button>
      </header>

      {/* Área principal */}
      <div className="flex-1 flex overflow-hidden">
        {/* Área de seleção de produtos */}
        <div className="w-2/3 bg-white p-4 overflow-y-auto">
          {/* Barra de pesquisa */}
          <div className="mb-4">
            <Input
              type="text"
              placeholder={t('pos.searchProducts')}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full"
            />
          </div>

          {/* Tabs de categorias */}
          <Tabs defaultValue="all" className="mb-6">
            <TabsList className="mb-2 flex flex-wrap">
              <TabsTrigger 
                value="all" 
                onClick={() => setActiveCategory('all')}
              >
                {t('pos.allCategories')}
              </TabsTrigger>
              
              {categories.map((category) => (
                <TabsTrigger 
                  key={category.id}
                  value={category.id.toString()}
                  onClick={() => setActiveCategory(category.id)}
                >
                  {category.name}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>

          {/* Grid de produtos */}
          {activeCategory === 'all' ? (
            <>
              {itemsByCategory.map((category) => (
                <div key={category.id} className="mb-8">
                  <h2 className="text-lg font-semibold text-gray-700 mb-3">
                    {category.name}
                  </h2>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {category.items.map((item) => (
                      <Card 
                        key={item.id} 
                        className="cursor-pointer hover:shadow-md transition"
                        onClick={() => addToCart(item)}
                      >
                        <div className="h-32 w-full overflow-hidden">
                          <img 
                            src={item.image} 
                            alt={item.name}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <CardContent className="p-3">
                          <h3 className="font-medium text-gray-800">{item.name}</h3>
                          <div className="flex justify-between items-center mt-2">
                            <span className="font-bold text-primary">
                              {formatCurrency(item.price)}
                            </span>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              ))}
            </>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {filteredItems.map((item) => (
                <Card 
                  key={item.id} 
                  className="cursor-pointer hover:shadow-md transition"
                  onClick={() => addToCart(item)}
                >
                  <div className="h-32 w-full overflow-hidden">
                    <img 
                      src={item.image} 
                      alt={item.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <CardContent className="p-3">
                    <h3 className="font-medium text-gray-800">{item.name}</h3>
                    <div className="flex justify-between items-center mt-2">
                      <span className="font-bold text-primary">
                        {formatCurrency(item.price)}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* Área do carrinho e pagamento */}
        <div className="w-1/3 bg-gray-100 p-4 flex flex-col">
          {/* Seleção de mesa */}
          <div className="mb-4">
            <label className="block text-sm font-medium mb-2">
              {t('pos.selectTable')}
            </label>
            <div className="grid grid-cols-4 gap-2">
              {tables.map((table) => (
                <Button
                  key={table.id}
                  variant={selectedTable === table.id ? "default" : "outline"}
                  onClick={() => setSelectedTable(table.id)}
                  className="h-10 p-0"
                >
                  {table.number}
                </Button>
              ))}
            </div>
          </div>

          {/* Itens do carrinho */}
          <div className="flex-1 overflow-y-auto mb-4">
            <h2 className="text-lg font-semibold mb-3">{t('pos.currentOrder')}</h2>
            
            {cart.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                {t('pos.emptyCartMessage')}
              </div>
            ) : (
              <div className="space-y-3">
                {cart.map((item) => (
                  <div key={item.id} className="bg-white rounded-lg p-3 shadow-sm">
                    <div className="flex justify-between">
                      <h3 className="font-medium">{item.menuItem.name}</h3>
                      <button 
                        onClick={() => removeFromCart(item.id)}
                        className="text-red-500 hover:text-red-700"
                      >
                        &times;
                      </button>
                    </div>
                    
                    <div className="flex items-center mt-2">
                      <button 
                        onClick={() => updateCartItemQuantity(item.id, item.quantity - 1)}
                        className="w-8 h-8 flex items-center justify-center bg-gray-200 rounded-l-md"
                      >
                        -
                      </button>
                      <input
                        type="number"
                        min="1"
                        value={item.quantity}
                        onChange={(e) => updateCartItemQuantity(item.id, parseInt(e.target.value) || 1)}
                        className="w-12 h-8 text-center border-y border-gray-200"
                      />
                      <button 
                        onClick={() => updateCartItemQuantity(item.id, item.quantity + 1)}
                        className="w-8 h-8 flex items-center justify-center bg-gray-200 rounded-r-md"
                      >
                        +
                      </button>
                      
                      <span className="ml-auto font-bold">
                        {formatCurrency(item.menuItem.price * item.quantity)}
                      </span>
                    </div>
                    
                    <Input
                      type="text"
                      placeholder={t('pos.addNotes')}
                      value={item.notes}
                      onChange={(e) => updateCartItemNotes(item.id, e.target.value)}
                      className="mt-2 text-sm"
                    />
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Resumo e total */}
          <div className="border-t border-gray-200 pt-4">
            <div className="flex justify-between mb-2">
              <span>{t('pos.subtotal')}</span>
              <span>{formatCurrency(cartTotal)}</span>
            </div>
            
            <div className="flex justify-between font-bold text-lg mb-4">
              <span>{t('pos.total')}</span>
              <span>{formatCurrency(cartTotal)}</span>
            </div>
            
            <Button
              onClick={handleProceedToPayment}
              className="w-full py-3"
              disabled={cart.length === 0 || !selectedTable}
            >
              {t('pos.proceedToPayment')}
            </Button>
          </div>
        </div>
      </div>

      {/* Modal de pagamento */}
      {showPaymentModal && (
        <PaymentModal
          isOpen={showPaymentModal}
          onClose={() => setShowPaymentModal(false)}
          onPaymentComplete={handlePaymentComplete}
          total={cartTotal}
          isAdminMode={isAdmin}
        />
      )}
    </div>
  );
}