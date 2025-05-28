import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import { CustomerLayout } from '@/components/layouts/CustomerLayout';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, Plus, Star, ShoppingCart, Minus, Trash2 } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
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

// Define o tipo para um item do carrinho
interface CartItem {
  id: number;
  name: string;
  price: number;
  quantity: number;
  image: string;
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
    setCart(prevCart => {
      const existingItem = prevCart.find(cartItem => cartItem.id === item.id);
      if (existingItem) {
        return prevCart.map(cartItem =>
          cartItem.id === item.id
            ? { ...cartItem, quantity: cartItem.quantity + 1 }
            : cartItem
        );
      } else {
        return [...prevCart, {
          id: item.id,
          name: item.name,
          price: item.price,
          quantity: 1,
          image: item.image
        }];
      }
    });
  };

  const removeFromCart = (itemId: number) => {
    setCart(prevCart => prevCart.filter(item => item.id !== itemId));
  };

  const updateQuantity = (itemId: number, newQuantity: number) => {
    if (newQuantity <= 0) {
      removeFromCart(itemId);
      return;
    }
    setCart(prevCart =>
      prevCart.map(item =>
        item.id === itemId ? { ...item, quantity: newQuantity } : item
      )
    );
  };

  const getTotalItems = () => {
    return cart.reduce((total, item) => total + item.quantity, 0);
  };

  const getTotalPrice = () => {
    return cart.reduce((total, item) => total + (item.price * item.quantity), 0);
  };

  // Função para renderizar o nível de picância
  const renderSpicyLevel = (level: number) => {
    return Array(level).fill(0).map((_, index) => (
      <span key={index} className="text-brasil-red">🌶️</span>
    ));
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
      <div className="container mx-auto py-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-2 font-montserrat">{t('SpecialMenu')}</h1>
          <p className="text-gray-600">{t('ExclusiveSelection')}</p>
        </div>
        
        <div className="flex gap-8">
          {/* Menu Principal */}
          <div className="flex-1">
            <Tabs defaultValue="all" value={activeCategory} onValueChange={setActiveCategory} className="mb-8">
              <div className="flex justify-center mb-6">
                <TabsList className="bg-gray-100">
                  <TabsTrigger value="all">{t('All')}</TabsTrigger>
                  {categories?.map(category => (
                    <TabsTrigger key={category.id} value={category.id.toString()}>
                      {category.name}
                    </TabsTrigger>
                  ))}
                </TabsList>
              </div>
              
              <TabsContent value={activeCategory} className="mt-0">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {filteredItems.map(item => (
                    <Card key={item.id} className="overflow-hidden hover:shadow-lg transition">
                      <div className="relative h-48">
                        <img 
                          src={item.image || 'https://placehold.co/600x400/gray/white?text=Imagem+Indisponível'} 
                          alt={item.name} 
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.src = 'https://placehold.co/600x400/gray/white?text=Imagem+Indisponível';
                          }}
                        />
                        {item.popular && (
                          <Badge className="absolute top-2 right-2 bg-brasil-red">
                            {t('POPULAR')}
                          </Badge>
                        )}
                      </div>
                      
                      <CardHeader className="pb-2">
                        <div className="flex justify-between items-start">
                          <CardTitle className="text-lg font-montserrat">{item.name}</CardTitle>
                          <div className="text-lg font-bold text-brasil-blue">
                            €{(Number(item.price) / 100).toFixed(2)}
                          </div>
                        </div>
                        <p className="text-sm text-gray-500">{item.category_name}</p>
                        {(item.vegetarian || item.gluten_free) && (
                          <div className="flex gap-2 mt-1">
                            {item.vegetarian && (
                              <Badge variant="outline" className="text-green-600 border-green-600">
                                {t('Vegetarian')}
                              </Badge>
                            )}
                            {item.gluten_free && (
                              <Badge variant="outline" className="text-amber-600 border-amber-600">
                                {t('Glutenfree')}
                              </Badge>
                            )}
                          </div>
                        )}
                        {item.spicy_level > 0 && (
                          <div className="mt-1">
                            <span className="text-sm text-gray-600 mr-2">{t('SpiceLevel')}:</span>
                            {renderSpicyLevel(item.spicy_level)}
                          </div>
                        )}
                      </CardHeader>
                      
                      <CardContent className="pb-4">
                        <p className="text-gray-600 text-sm mb-3">{item.description}</p>
                      </CardContent>
                      
                      <CardFooter>
                        <Button 
                          onClick={() => addToCart(item)}
                          className="w-full bg-brasil-blue hover:bg-brasil-blue/90"
                        >
                          <Plus className="w-4 h-4 mr-2" />
                          Adicionar ao Pedido
                        </Button>
                      </CardFooter>
                    </Card>
                  ))}
                </div>
                
                {filteredItems.length === 0 && (
                  <div className="text-center py-12">
                    <p className="text-gray-500 mb-2">{t('NoItemsInCategory')}</p>
                    <Button variant="outline" onClick={() => setActiveCategory('all')}>
                      {t('ViewAllItems')}
                    </Button>
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </div>

          {/* Carrinho - Resumo Contábil */}
          <div className="w-80">
            <Card className="sticky top-8">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ShoppingCart className="w-5 h-5" />
                  Resumo do Pedido
                  {getTotalItems() > 0 && (
                    <Badge variant="secondary" className="ml-auto">
                      {getTotalItems()} {getTotalItems() === 1 ? 'item' : 'itens'}
                    </Badge>
                  )}
                </CardTitle>
              </CardHeader>
              
              <CardContent className="space-y-4">
                {cart.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <ShoppingCart className="w-12 h-12 mx-auto mb-2 opacity-50" />
                    <p>Seu carrinho está vazio</p>
                    <p className="text-sm">Adicione itens do menu</p>
                  </div>
                ) : (
                  <>
                    <div className="space-y-3 max-h-96 overflow-y-auto">
                      {cart.map(item => (
                        <div key={item.id} className="flex items-center gap-3 p-3 border rounded-lg">
                          <img 
                            src={item.image || 'https://placehold.co/50x50/gray/white'} 
                            alt={item.name}
                            className="w-12 h-12 object-cover rounded"
                          />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">{item.name}</p>
                            <p className="text-sm text-gray-500">
                              €{(item.price / 100).toFixed(2)} cada
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => updateQuantity(item.id, item.quantity - 1)}
                              className="h-8 w-8 p-0"
                            >
                              <Minus className="w-3 h-3" />
                            </Button>
                            <span className="text-sm font-medium w-8 text-center">
                              {item.quantity}
                            </span>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => updateQuantity(item.id, item.quantity + 1)}
                              className="h-8 w-8 p-0"
                            >
                              <Plus className="w-3 h-3" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => removeFromCart(item.id)}
                              className="h-8 w-8 p-0 text-red-500 hover:text-red-700"
                            >
                              <Trash2 className="w-3 h-3" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                    
                    <Separator />
                    
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Subtotal:</span>
                        <span>€{(getTotalPrice() / 100).toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>Taxa de serviço:</span>
                        <span>€{((getTotalPrice() * 0.1) / 100).toFixed(2)}</span>
                      </div>
                      <Separator />
                      <div className="flex justify-between font-bold text-lg">
                        <span>Total:</span>
                        <span className="text-brasil-blue">
                          €{((getTotalPrice() * 1.1) / 100).toFixed(2)}
                        </span>
                      </div>
                    </div>
                  </>
                )}
              </CardContent>
              
              {cart.length > 0 && (
                <CardFooter className="flex flex-col gap-2">
                  <Button className="w-full bg-brasil-green hover:bg-brasil-green/90">
                    Finalizar Pedido
                  </Button>
                  <Button 
                    variant="outline" 
                    className="w-full"
                    onClick={() => setCart([])}
                  >
                    Limpar Carrinho
                  </Button>
                </CardFooter>
              )}
            </Card>
          </div>
        </div>
      </div>
    </CustomerLayout>
  );
};

export default MenuPage;