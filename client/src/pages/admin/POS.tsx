import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import AdminLayout from '@/components/layouts/AdminLayout';
import PaymentModal from '@/components/pos/PaymentModal';
import { FaSearch } from 'react-icons/fa';
import { useLocation } from 'wouter';

interface MenuItem {
  id: number;
  name: string;
  description: string | null;
  price: number;
  imageUrl: string | null;
  categoryId: number;
}

interface MenuCategory {
  id: number;
  name: string;
  description: string | null;
}

interface CartItem {
  menuItemId: number;
  name: string;
  price: number;
  quantity: number;
}

export default function POSPage() {
  const { t } = useTranslation();
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);

  // Buscar categorias do menu
  const { data: categories = [] } = useQuery<MenuCategory[]>({
    queryKey: ['/api/menu-categories'],
  });

  // Buscar itens do menu
  const { data: menuItems = [], isLoading: menuLoading } = useQuery<MenuItem[]>({
    queryKey: ['/api/menu-items'],
  });

  // Filtrar itens por categoria e termo de busca
  const filteredItems = menuItems.filter(item => {
    const matchesCategory = selectedCategory ? item.categoryId === selectedCategory : true;
    const matchesSearch = searchTerm.trim() === '' || 
      item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (item.description && item.description.toLowerCase().includes(searchTerm.toLowerCase()));
    
    return matchesCategory && matchesSearch;
  });

  // Agrupar itens por categoria para exibição
  const itemsByCategory: Record<number, MenuItem[]> = {};
  
  if (selectedCategory) {
    // Se uma categoria estiver selecionada, só mostrar essa categoria
    const items = filteredItems.filter(item => item.categoryId === selectedCategory);
    if (items.length > 0) {
      itemsByCategory[selectedCategory] = items;
    }
  } else {
    // Caso contrário, agrupar todos os itens filtrados por categoria
    filteredItems.forEach(item => {
      if (!itemsByCategory[item.categoryId]) {
        itemsByCategory[item.categoryId] = [];
      }
      itemsByCategory[item.categoryId].push(item);
    });
  }

  // Adicionar item ao carrinho
  const addToCart = (item: MenuItem) => {
    setCart(prevCart => {
      const existingItem = prevCart.find(i => i.menuItemId === item.id);
      if (existingItem) {
        // Atualizar a quantidade se o item já existe
        return prevCart.map(i => 
          i.menuItemId === item.id 
            ? { ...i, quantity: i.quantity + 1 } 
            : i
        );
      } else {
        // Adicionar novo item
        return [...prevCart, {
          menuItemId: item.id,
          name: item.name,
          price: item.price,
          quantity: 1
        }];
      }
    });
    
    toast({
      title: t('ItemAdded'),
      description: item.name,
      variant: 'default',
    });
  };

  // Remover item do carrinho
  const removeFromCart = (menuItemId: number) => {
    setCart(prevCart => prevCart.filter(item => item.menuItemId !== menuItemId));
  };

  // Alterar quantidade de um item
  const updateQuantity = (menuItemId: number, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(menuItemId);
      return;
    }
    
    setCart(prevCart => 
      prevCart.map(item => 
        item.menuItemId === menuItemId 
          ? { ...item, quantity } 
          : item
      )
    );
  };

  // Calcular total do carrinho
  const cartTotal = cart.reduce((total, item) => total + (item.price * item.quantity), 0);

  // Abrir modal de pagamento
  const handleProceedToPayment = () => {
    if (cart.length === 0) {
      toast({
        title: t('Error'),
        description: t('CartEmpty'),
        variant: 'destructive',
      });
      return;
    }
    
    setIsPaymentModalOpen(true);
  };

  // Processar pagamento
  const handleProcessPayment = async (method: string) => {
    try {
      // Aqui você pode implementar a lógica de processamento do pagamento
      // Simulação de um pagamento bem-sucedido
      toast({
        title: t('PaymentSuccessful'),
        description: t('PaymentCompleted'),
        variant: 'default',
      });
      
      // Limpar carrinho após pagamento bem-sucedido
      setCart([]);
      setIsPaymentModalOpen(false);
    } catch (error) {
      toast({
        title: t('PaymentError'),
        description: t('PaymentProcessingError'),
        variant: 'destructive',
      });
    }
  };

  // Sair do modo POS
  const handleExitPOS = () => {
    setLocation('/admin/dashboard');
  };

  return (
    <AdminLayout>
      <div className="h-[calc(100vh-4rem)] flex flex-col">
        {/* Cabeçalho */}
        <div className="flex justify-between items-center mb-6 p-4">
          <h1 className="text-2xl font-bold text-gray-800">{t('POS')}</h1>
          <Button 
            variant="destructive" 
            onClick={handleExitPOS}
            className="flex items-center gap-2"
          >
            <span>{t('ExitPOS')}</span>
          </Button>
        </div>
        
        {/* Conteúdo Principal */}
        <div className="flex-1 flex">
          {/* Área de Seleção de Produtos */}
          <div className="w-2/3 bg-white p-4 overflow-y-auto rounded-lg shadow-sm">
            {/* Barra de Pesquisa */}
            <div className="mb-6">
              <div className="relative">
                <Input 
                  type="text" 
                  placeholder={t('SearchProduct')}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10"
                />
                <FaSearch className="absolute left-3 top-3 text-gray-400" />
              </div>
            </div>

            {/* Abas de Categorias */}
            <div className="flex space-x-2 overflow-x-auto pb-2 mb-6">
              <Button
                variant={selectedCategory === null ? "default" : "outline"}
                onClick={() => setSelectedCategory(null)}
              >
                {t('All')}
              </Button>
              
              {categories.map(category => (
                <Button
                  key={category.id}
                  variant={selectedCategory === category.id ? "default" : "outline"}
                  onClick={() => setSelectedCategory(category.id)}
                >
                  {category.name}
                </Button>
              ))}
            </div>

            {/* Grade de Produtos por Categoria */}
            {menuLoading ? (
              <div className="text-center py-10">
                <div className="animate-spin w-10 h-10 border-4 border-primary border-t-transparent rounded-full mx-auto"></div>
                <p className="mt-4 text-gray-600">{t('Loading')}...</p>
              </div>
            ) : (
              Object.entries(itemsByCategory).map(([categoryId, items]) => {
                const category = categories.find(c => c.id === parseInt(categoryId));
                return (
                  <div key={categoryId} className="mb-8">
                    <h2 className="text-lg font-semibold text-gray-700 mb-3">
                      {category?.name || t('Uncategorized')}
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                      {items.map(item => (
                        <Card 
                          key={item.id} 
                          className="cursor-pointer hover:shadow-md transition"
                          onClick={() => addToCart(item)}
                        >
                          <CardContent className="p-0">
                            <div className="h-32 w-full overflow-hidden">
                              {item.imageUrl ? (
                                <img 
                                  className="w-full h-full object-cover" 
                                  src={item.imageUrl} 
                                  alt={item.name} 
                                />
                              ) : (
                                <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                                  <span className="text-gray-500">{t('NoImage')}</span>
                                </div>
                              )}
                            </div>
                            <div className="p-3">
                              <h3 className="font-medium text-gray-800">{item.name}</h3>
                              <div className="flex justify-between items-center mt-2">
                                <span className="font-bold text-primary">
                                  {(item.price / 100).toLocaleString('pt-BR', { 
                                    style: 'currency', 
                                    currency: 'EUR' 
                                  })}
                                </span>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </div>
                );
              })
            )}
          </div>
          
          {/* Área do Carrinho */}
          <div className="w-1/3 bg-gray-50 p-4 border-l border-gray-200 flex flex-col">
            <h2 className="text-xl font-bold mb-4">{t('Order')}</h2>
            
            {/* Itens do Carrinho */}
            <div className="flex-1 overflow-y-auto">
              {cart.length === 0 ? (
                <div className="text-center py-10 text-gray-500">
                  <p>{t('CartEmpty')}</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {cart.map(item => (
                    <div key={item.menuItemId} className="flex justify-between items-center bg-white p-3 rounded-lg shadow-sm">
                      <div>
                        <h3 className="font-medium">{item.name}</h3>
                        <p className="text-sm text-gray-600">
                          {(item.price / 100).toLocaleString('pt-BR', { 
                            style: 'currency', 
                            currency: 'EUR' 
                          })}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button 
                          variant="outline" 
                          size="icon"
                          onClick={() => updateQuantity(item.menuItemId, item.quantity - 1)}
                        >
                          -
                        </Button>
                        <span className="w-8 text-center">{item.quantity}</span>
                        <Button 
                          variant="outline" 
                          size="icon"
                          onClick={() => updateQuantity(item.menuItemId, item.quantity + 1)}
                        >
                          +
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            
            {/* Resumo do Pedido */}
            <div className="mt-4 pt-4 border-t border-gray-200">
              <div className="flex justify-between text-lg font-bold mb-4">
                <span>{t('Total')}:</span>
                <span>
                  {(cartTotal / 100).toLocaleString('pt-BR', { 
                    style: 'currency', 
                    currency: 'EUR' 
                  })}
                </span>
              </div>
              
              <Button 
                className="w-full py-3"
                onClick={handleProceedToPayment}
                disabled={cart.length === 0}
              >
                {t('ProceedToPayment')}
              </Button>
            </div>
          </div>
        </div>
      </div>
      
      {/* Modal de Pagamento */}
      <PaymentModal
        isOpen={isPaymentModalOpen}
        onClose={() => setIsPaymentModalOpen(false)}
        total={cartTotal}
        onPaymentComplete={handleProcessPayment}
      />
    </AdminLayout>
  );
}