import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import { CustomerLayout } from '@/components/layouts/CustomerLayout';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, Plus, Minus, ShoppingCart, Utensils } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Card, CardContent } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';

// Define o tipo para um item do menu
interface MenuItem {
  id: number;
  name: string;
  description: string;
  price: number;
  image: string;
  category_id: number;
  available: boolean;
  popular: boolean;
  vegetarian: boolean;
  gluten_free: boolean;
  spicy_level: number;
  category_name: string;
}

// Interface para o formato de resposta da API
interface MenuByCategory {
  category: MenuCategory;
  items: MenuItem[];
}

// Define o tipo para uma categoria do menu
interface MenuCategory {
  id: number;
  name: string;
  description: string;
  image: string;
}

// Define o tipo para um item no carrinho
interface CartItem {
  id: number;
  name: string;
  price: number;
  quantity: number;
  image?: string;
}

const MenuPage = () => {
  const { t, i18n } = useTranslation();
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [cart, setCart] = useState<CartItem[]>([]);
  
  // Buscar categorias do menu
  const { data: categories, isLoading: categoriesLoading, error: categoriesError } = useQuery<MenuCategory[]>({
    queryKey: ['/api/menu-categories'],
  });
  
  // Buscar itens do menu organizados por categoria
  const { data: menuByCategory, isLoading: itemsLoading, error: itemsError } = useQuery<MenuByCategory[]>({
    queryKey: ['/api/menu-items'],
  });
  
  // Função para obter todos os itens a partir da resposta organizada por categoria
  const getAllItems = () => {
    if (!menuByCategory) return [];
    
    // Flatmap para extrair todos os itens de todas as categorias
    return menuByCategory.flatMap(categoryData => categoryData.items);
  };
  
  // Função para filtrar itens por categoria
  const getFilteredItems = () => {
    const allItems = getAllItems();
    
    if (activeCategory === 'all') {
      return allItems;
    }
    
    const categoryId = parseInt(activeCategory);
    return allItems.filter(item => item.category_id === categoryId);
  };
  
  // Funções do carrinho
  const addToCart = (item: MenuItem) => {
    const existingItem = cart.find(cartItem => cartItem.id === item.id);
    
    if (existingItem) {
      setCart(cart.map(cartItem => 
        cartItem.id === item.id 
          ? { ...cartItem, quantity: cartItem.quantity + 1 }
          : cartItem
      ));
    } else {
      setCart([...cart, {
        id: item.id,
        name: item.name,
        price: item.price,
        quantity: 1,
        image: item.image
      }]);
    }
  };
  
  const removeFromCart = (itemId: number) => {
    setCart(cart.filter(cartItem => cartItem.id !== itemId));
  };
  
  const updateQuantity = (itemId: number, newQuantity: number) => {
    if (newQuantity <= 0) {
      removeFromCart(itemId);
    } else {
      setCart(cart.map(cartItem => 
        cartItem.id === itemId 
          ? { ...cartItem, quantity: newQuantity }
          : cartItem
      ));
    }
  };
  
  const getTotalPrice = () => {
    return cart.reduce((total, item) => total + (item.price * item.quantity), 0);
  };
  
  const getTotalItems = () => {
    return cart.reduce((total, item) => total + item.quantity, 0);
  };
  
  // Loading states
  if (categoriesLoading || itemsLoading) {
    return (
      <CustomerLayout>
        <div className="container mx-auto py-8">
          <h1 className="text-3xl font-bold mb-6">{t('Menu')}</h1>
          <div className="mb-6">
            <Skeleton className="h-12 w-full max-w-xl rounded-lg" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array(6).fill(0).map((_, index) => (
              <Skeleton key={index} className="h-64 w-full rounded-xl" />
            ))}
          </div>
        </div>
      </CustomerLayout>
    );
  }
  
  // Error states
  if (categoriesError || itemsError) {
    return (
      <CustomerLayout>
        <div className="container mx-auto py-8">
          <Alert variant="destructive" className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>{t('Error')}</AlertTitle>
            <AlertDescription>
              {t('ErrorLoadingMenu')}
            </AlertDescription>
          </Alert>
        </div>
      </CustomerLayout>
    );
  }
  
  const filteredItems = getFilteredItems();
  
  return (
    <CustomerLayout>
      <div className="flex h-screen bg-gray-50 overflow-hidden">
        {/* Seção principal do cardápio - 2/3 da tela */}
        <div className="w-2/3 p-8 overflow-y-auto">
          <div className="max-w-4xl">
            <h1 className="text-2xl font-bold text-gray-800 mb-8 font-montserrat">{t('SpecialMenu')}</h1>
            
            {/* Navegação de categorias - preservando o design original */}
            <nav className="flex flex-wrap gap-4 mb-8">
              <button 
                onClick={() => setActiveCategory('all')}
                className={`px-5 py-2 rounded-lg font-bold shadow transition ${
                  activeCategory === 'all' 
                    ? 'bg-green-600 text-white' 
                    : 'bg-gray-100 text-blue-800 hover:bg-yellow-400 hover:text-blue-800'
                }`}
              >
                {t('All')}
              </button>
              {categories?.map(category => (
                <button 
                  key={category.id}
                  onClick={() => setActiveCategory(category.id.toString())}
                  className={`px-5 py-2 rounded-lg font-bold shadow transition ${
                    activeCategory === category.id.toString() 
                      ? 'bg-green-600 text-white' 
                      : 'bg-gray-100 text-blue-800 hover:bg-yellow-400 hover:text-blue-800'
                  }`}
                >
                  {category.name}
                </button>
              ))}
            </nav>
            
            {/* Lista de itens do cardápio */}
            <div className="space-y-6">
              {filteredItems.map(item => (
                <div key={item.id} className="bg-white rounded-xl p-4 flex gap-4 items-center shadow border-2 border-transparent hover:border-green-600 transition group">
                  <img 
                    src={item.image || 'https://placehold.co/600x400/gray/white?text=Imagem+Indisponível'} 
                    alt={item.name} 
                    className="w-16 h-16 rounded-lg object-cover border-2 border-gray-100 group-hover:scale-105 transition"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.src = 'https://placehold.co/600x400/gray/white?text=Imagem+Indisponível';
                    }}
                  />
                  <div className="flex-1">
                    <div className="flex justify-between items-center mb-1">
                      <span className="font-bold text-gray-800 text-lg">{item.name}</span>
                      <span className="font-bold text-green-600 text-lg">€{(Number(item.price) / 100).toFixed(2)}</span>
                    </div>
                    <p className="text-sm text-gray-600">{item.description}</p>
                    <div className="flex gap-2 mt-2">
                      {item.popular && (
                        <Badge className="bg-red-500 text-white text-xs">
                          {t('POPULAR')}
                        </Badge>
                      )}
                      {item.vegetarian && (
                        <Badge variant="outline" className="text-green-600 border-green-600 text-xs">
                          {t('Vegetarian')}
                        </Badge>
                      )}
                      {item.gluten_free && (
                        <Badge variant="outline" className="text-amber-600 border-amber-600 text-xs">
                          {t('Glutenfree')}
                        </Badge>
                      )}
                    </div>
                  </div>
                  <Button 
                    onClick={() => addToCart(item)}
                    className="bg-yellow-400 hover:bg-yellow-500 text-blue-800 px-3 py-2 rounded-lg font-bold"
                  >
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>
              ))}
              
              {filteredItems.length === 0 && (
                <div className="text-center py-12">
                  <p className="text-gray-500 mb-2">{t('NoItemsInCategory')}</p>
                  <Button variant="outline" onClick={() => setActiveCategory('all')}>
                    {t('ViewAllItems')}
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
        
        {/* Resumo das seleções - 1/3 da tela */}
        <div className="w-1/3 bg-white border-l border-gray-200 p-6 overflow-y-auto">
          <div className="sticky top-0 bg-white pb-4">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                <ShoppingCart className="w-5 h-5" />
                {t('YourOrder')}
              </h2>
              {getTotalItems() > 0 && (
                <Badge className="bg-green-600">{getTotalItems()}</Badge>
              )}
            </div>
          </div>
          
          <ScrollArea className="h-[calc(100vh-250px)]">
            {cart.length === 0 ? (
              <div className="text-center py-12">
                <Utensils className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500 text-sm">{t('EmptyCart')}</p>
              </div>
            ) : (
              <div className="space-y-4">
                {cart.map(item => (
                  <Card key={item.id} className="p-4">
                    <div className="flex items-center gap-3">
                      {item.image && (
                        <img 
                          src={item.image}
                          alt={item.name}
                          className="w-12 h-12 rounded-lg object-cover"
                        />
                      )}
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-sm truncate">{item.name}</h4>
                        <p className="text-green-600 font-bold text-sm">€{(Number(item.price) / 100).toFixed(2)}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => updateQuantity(item.id, item.quantity - 1)}
                          className="w-8 h-8 p-0"
                        >
                          <Minus className="w-3 h-3" />
                        </Button>
                        <span className="w-8 text-center text-sm font-medium">{item.quantity}</span>
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => updateQuantity(item.id, item.quantity + 1)}
                          className="w-8 h-8 p-0"
                        >
                          <Plus className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </ScrollArea>
          
          {cart.length > 0 && (
            <div className="border-t pt-4 mt-4">
              <div className="flex justify-between items-center mb-4">
                <span className="text-lg font-bold">{t('Total')}</span>
                <span className="text-lg font-bold text-green-600">
                  €{(getTotalPrice() / 100).toFixed(2)}
                </span>
              </div>
              <Button className="w-full bg-green-600 hover:bg-green-700 text-white">
                {t('ProceedToCheckout')}
              </Button>
            </div>
          )}
        </div>
      </div>
    </CustomerLayout>
  );
};

export default MenuPage;