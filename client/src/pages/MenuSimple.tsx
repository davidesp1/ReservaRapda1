import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { CustomerLayout } from '@/components/layouts/CustomerLayout';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Plus, Minus, ShoppingCart, Utensils } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';

interface MenuItem {
  id: number;
  name: string;
  description: string;
  price: number;
  category_id: number;
  category_name: string;
  image_url?: string;
  featured?: boolean;
  is_available?: boolean;
}

interface MenuCategory {
  id: number;
  name: string;
  description: string;
}

interface CartItem {
  id: number;
  name: string;
  price: number;
  quantity: number;
}

const MenuSimple = () => {
  const { t } = useTranslation();
  const [categories, setCategories] = useState<MenuCategory[]>([]);
  const [allItems, setAllItems] = useState<MenuItem[]>([]);
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        console.log('🔍 Buscando dados do menu...');
        
        // Buscar categorias
        const categoriesResponse = await fetch('/api/menu-categories');
        const categoriesData = await categoriesResponse.json();
        console.log('📂 Categorias carregadas:', categoriesData);
        setCategories(categoriesData);

        // Buscar itens organizados por categoria
        const itemsResponse = await fetch('/api/menu-items');
        const itemsData = await itemsResponse.json();
        console.log('🍽️ Dados de itens recebidos:', itemsData);

        // Extrair todos os itens de todas as categorias
        const flatItems = itemsData.flatMap((categoryGroup: any) => 
          categoryGroup.items.map((item: any) => ({
            ...item,
            category_name: categoryGroup.category.name
          }))
        );
        console.log('📋 Itens processados:', flatItems);
        setAllItems(flatItems);
        setLoading(false);
        
        console.log('✅ Carregamento concluído! Categorias:', categoriesData.length, 'Itens:', flatItems.length);
      } catch (error) {
        console.error('❌ Erro ao carregar dados:', error);
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const getFilteredItems = () => {
    if (activeCategory === 'all') {
      return allItems;
    }
    const categoryId = parseInt(activeCategory);
    return allItems.filter(item => item.category_id === categoryId);
  };

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
        quantity: 1
      }]);
    }
  };

  const updateQuantity = (itemId: number, newQuantity: number) => {
    if (newQuantity <= 0) {
      setCart(cart.filter(cartItem => cartItem.id !== itemId));
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

  const filteredItems = getFilteredItems();

  console.log('🐛 Estado atual:', {
    categoriesCount: categories.length,
    allItemsCount: allItems.length,
    filteredItemsCount: filteredItems.length,
    activeCategory,
    loading
  });

  if (loading) {
    return (
      <CustomerLayout>
        <div className="container mx-auto py-8">
          <h1 className="text-3xl font-bold mb-6">Carregando cardápio...</h1>
          <p className="text-gray-600">
            Categorias: {categories.length} | Itens: {allItems.length}
          </p>
        </div>
      </CustomerLayout>
    );
  }

  // Forçar exibição mesmo se não há dados para debug
  if (categories.length === 0 && allItems.length === 0) {
    return (
      <CustomerLayout>
        <div className="container mx-auto py-8">
          <h1 className="text-2xl font-bold text-red-600 mb-4">DEBUG: Sem dados carregados</h1>
          <div className="bg-gray-100 p-4 rounded">
            <p>Loading: {loading.toString()}</p>
            <p>Categorias: {categories.length}</p>
            <p>Itens: {allItems.length}</p>
            <button 
              onClick={() => window.location.reload()} 
              className="mt-4 px-4 py-2 bg-blue-500 text-white rounded"
            >
              Recarregar Página
            </button>
          </div>
        </div>
      </CustomerLayout>
    );
  }

  return (
    <CustomerLayout>
      <div className="flex h-screen bg-gray-50 overflow-hidden">
        {/* Seção principal do cardápio - 2/3 da tela */}
        <div className="w-2/3 p-8 overflow-y-auto">
          <div className="max-w-4xl">
            <h1 className="text-2xl font-bold text-gray-800 mb-8 font-montserrat">Cardápio Especial</h1>
            
            {/* Navegação de categorias */}
            <nav className="flex flex-wrap gap-4 mb-8">
              <button 
                onClick={() => setActiveCategory('all')}
                className={`px-5 py-2 rounded-lg font-bold shadow transition ${
                  activeCategory === 'all' 
                    ? 'bg-green-600 text-white' 
                    : 'bg-gray-100 text-blue-800 hover:bg-yellow-400 hover:text-blue-800'
                }`}
              >
                Todos ({allItems.length})
              </button>
              {categories.map(category => {
                const categoryItemsCount = allItems.filter(item => item.category_id === category.id).length;
                return (
                  <button 
                    key={category.id}
                    onClick={() => setActiveCategory(category.id.toString())}
                    className={`px-5 py-2 rounded-lg font-bold shadow transition ${
                      activeCategory === category.id.toString() 
                        ? 'bg-green-600 text-white' 
                        : 'bg-gray-100 text-blue-800 hover:bg-yellow-400 hover:text-blue-800'
                    }`}
                  >
                    {category.name} ({categoryItemsCount})
                  </button>
                );
              })}
            </nav>
            
            {/* Lista de itens do cardápio */}
            <div className="space-y-6">
              {filteredItems.length > 0 ? (
                filteredItems.map(item => (
                  <div key={item.id} className="bg-white rounded-xl p-4 flex gap-4 items-center shadow border-2 border-transparent hover:border-green-600 transition group">
                    <img 
                      src={`https://placehold.co/100x100/green/white?text=${encodeURIComponent(item.name.substring(0, 3))}`}
                      alt={item.name} 
                      className="w-16 h-16 rounded-lg object-cover border-2 border-gray-100 group-hover:scale-105 transition"
                    />
                    <div className="flex-1">
                      <div className="flex justify-between items-center mb-1">
                        <span className="font-bold text-gray-800 text-lg">{item.name}</span>
                        <span className="font-bold text-green-600 text-lg">€{(Number(item.price) / 100).toFixed(2)}</span>
                      </div>
                      <p className="text-sm text-gray-600">{item.description}</p>
                      <p className="text-xs text-gray-400 mt-1">Categoria: {item.category_name}</p>
                    </div>
                    <Button 
                      onClick={() => addToCart(item)}
                      className="bg-yellow-400 hover:bg-yellow-500 text-blue-800 px-3 py-2 rounded-lg font-bold"
                    >
                      <Plus className="w-4 h-4" />
                    </Button>
                  </div>
                ))
              ) : (
                <div className="text-center py-8">
                  <p className="text-gray-500">Nenhum item encontrado nesta categoria</p>
                  <p className="text-sm text-gray-400 mt-2">
                    Debug: Categoria ativa: {activeCategory} | Total de itens: {allItems.length}
                  </p>
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
                Seu Pedido
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
                <p className="text-gray-500 text-sm">Seu carrinho está vazio</p>
              </div>
            ) : (
              <div className="space-y-4">
                {cart.map(item => (
                  <Card key={item.id} className="p-4">
                    <div className="flex items-center gap-3">
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
                <span className="text-lg font-bold">Total</span>
                <span className="text-lg font-bold text-green-600">
                  €{(getTotalPrice() / 100).toFixed(2)}
                </span>
              </div>
              <Button className="w-full bg-green-600 hover:bg-green-700 text-white">
                Finalizar Pedido
              </Button>
            </div>
          )}
        </div>
      </div>
    </CustomerLayout>
  );
};

export default MenuSimple;