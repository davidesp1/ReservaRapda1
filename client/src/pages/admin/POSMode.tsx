import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { useTranslation } from "react-i18next";
import { Check, Search, ShoppingCart, X, Plus, Minus, ArrowRightFromLine } from "lucide-react";
import { Loader2 } from "lucide-react";

interface MenuItem {
  id: number;
  name: string;
  description: string;
  price: number;
  categoryId: number;
  image: string;
  category: {
    id: number;
    name: string;
    description: string;
  };
}

interface OrderItem {
  menuItem: MenuItem;
  quantity: number;
}

const POSMode = () => {
  const { t } = useTranslation();
  const [_, navigate] = useLocation();
  const [activeCategory, setActiveCategory] = useState<string>("all");
  const [orderItems, setOrderItems] = useState<OrderItem[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isFullscreen, setIsFullscreen] = useState(false);
  
  const { data: menuItems, isLoading } = useQuery({
    queryKey: ['/api/menu-items'],
  });
  
  const { data: categories, isLoading: categoriesLoading } = useQuery({
    queryKey: ['/api/menu-categories'],
  });
  
  // Efeito para lidar com a tela cheia
  useEffect(() => {
    const toggleFullscreen = () => {
      if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen().catch(err => {
          console.log(`Erro ao entrar em tela cheia: ${err.message}`);
        });
        setIsFullscreen(true);
      } else {
        if (document.exitFullscreen) {
          document.exitFullscreen();
          setIsFullscreen(false);
        }
      }
    };
    
    // Automaticamente entra em tela cheia quando o componente é montado
    if (!isFullscreen) {
      toggleFullscreen();
    }
    
    // Escuta o evento de saída de tela cheia
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      // Sai da tela cheia ao desmontar o componente
      if (document.fullscreenElement) {
        document.exitFullscreen().catch(err => {
          console.log(`Erro ao sair da tela cheia: ${err.message}`);
        });
      }
    };
  }, [isFullscreen]);
  
  const handleExitPOS = () => {
    // Sair do modo de tela cheia antes de navegar
    if (document.fullscreenElement) {
      document.exitFullscreen().catch(err => {
        console.log(`Erro ao sair da tela cheia: ${err.message}`);
      });
    }
    navigate("/admin/dashboard");
  };
  
  const handleAddItem = (item: MenuItem) => {
    setOrderItems(prev => {
      const existingItem = prev.find(i => i.menuItem.id === item.id);
      if (existingItem) {
        return prev.map(i => 
          i.menuItem.id === item.id 
            ? { ...i, quantity: i.quantity + 1 } 
            : i
        );
      } else {
        return [...prev, { menuItem: item, quantity: 1 }];
      }
    });
  };
  
  const handleRemoveItem = (item: MenuItem) => {
    setOrderItems(prev => {
      const existingItem = prev.find(i => i.menuItem.id === item.id);
      if (existingItem && existingItem.quantity > 1) {
        return prev.map(i => 
          i.menuItem.id === item.id 
            ? { ...i, quantity: i.quantity - 1 } 
            : i
        );
      } else {
        return prev.filter(i => i.menuItem.id !== item.id);
      }
    });
  };
  
  const handleClearOrder = () => {
    setOrderItems([]);
  };
  
  const handleFinalizeOrder = () => {
    // Implementar a lógica de finalização de pedido
    alert("Pedido finalizado com sucesso!");
    setOrderItems([]);
  };
  
  const filterItems = (items: MenuItem[]) => {
    if (!items) return [];
    
    let filtered = items;
    
    // Filtrar por categoria se não for "all"
    if (activeCategory !== "all") {
      filtered = filtered.filter(item => item.category.name === activeCategory);
    }
    
    // Filtrar por termo de busca
    if (searchQuery.trim() !== "") {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(item => 
        item.name.toLowerCase().includes(query) || 
        item.description.toLowerCase().includes(query)
      );
    }
    
    return filtered;
  };
  
  const categorizeItems = (items: MenuItem[]) => {
    if (!items) return {};
    
    return items.reduce((acc: Record<string, MenuItem[]>, item) => {
      const categoryName = item.category.name;
      if (!acc[categoryName]) {
        acc[categoryName] = [];
      }
      acc[categoryName].push(item);
      return acc;
    }, {});
  };
  
  const totalItems = orderItems.reduce((total, item) => total + item.quantity, 0);
  
  const totalPrice = orderItems.reduce((total, item) => {
    return total + (item.menuItem.price * item.quantity);
  }, 0);
  
  const formatPrice = (price: number) => {
    return (price / 100).toLocaleString('pt-PT', {
      style: 'currency',
      currency: 'EUR'
    });
  };
  
  if (isLoading || categoriesLoading) {
    return (
      <div className="h-screen flex items-center justify-center bg-gray-100">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }
  
  const filteredItems = filterItems(menuItems);
  const categorizedItems = categorizeItems(filteredItems);
  
  return (
    <div className="h-screen w-screen flex flex-col bg-gray-100 overflow-hidden">
      {/* Header com Botão de Saída */}
      <div className="flex justify-between items-center p-4 bg-white border-b shadow-sm">
        <h1 className="text-2xl font-bold text-gray-800 font-montserrat">{t('Ponto de Venda')}</h1>
        <button 
          onClick={handleExitPOS}
          className="px-4 py-2 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 transition flex items-center"
        >
          <ArrowRightFromLine className="mr-2 h-4 w-4" />
          {t('Sair do modo POS')}
        </button>
      </div>
      
      {/* Área Principal */}
      <div className="flex flex-1 overflow-hidden">
        {/* Área de Seleção de Produtos (2/3 da largura) */}
        <div className="w-2/3 bg-white p-4 overflow-y-auto">
          {/* Abas de Categorias */}
          <div className="flex space-x-2 overflow-x-auto pb-2 mb-6">
            <button 
              className={`px-4 py-2 rounded-lg font-medium ${
                activeCategory === "all" 
                  ? "bg-primary text-white" 
                  : "bg-gray-200 text-gray-700 hover:bg-gray-300"
              }`}
              onClick={() => setActiveCategory("all")}
            >
              {t('Todos')}
            </button>
            {categories?.map((category: any) => (
              <button 
                key={category.id}
                className={`px-4 py-2 rounded-lg font-medium ${
                  activeCategory === category.name 
                    ? "bg-primary text-white" 
                    : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                }`}
                onClick={() => setActiveCategory(category.name)}
              >
                {category.name}
              </button>
            ))}
          </div>
          
          {/* Barra de Busca */}
          <div className="mb-6">
            <div className="relative">
              <input 
                type="text" 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={t('Buscar produto...')}
                className="w-full px-4 py-2 pl-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              />
              <Search className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
              {searchQuery && (
                <button 
                  onClick={() => setSearchQuery("")}
                  className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600"
                >
                  <X className="h-5 w-5" />
                </button>
              )}
            </div>
          </div>
          
          {/* Produtos Organizados por Categoria */}
          {activeCategory === "all" ? (
            Object.entries(categorizedItems).length > 0 ? (
              Object.entries(categorizedItems).map(([categoryName, items]) => (
                <div key={categoryName} className="mb-8">
                  <h2 className="text-lg font-semibold text-gray-700 mb-3">{categoryName}</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {items.map((item) => (
                      <div 
                        key={item.id} 
                        className="bg-white border border-gray-200 rounded-lg overflow-hidden shadow-sm hover:shadow-md cursor-pointer transition"
                        onClick={() => handleAddItem(item)}
                      >
                        <div className="h-32 w-full overflow-hidden">
                          {item.image ? (
                            <img 
                              src={item.image} 
                              alt={item.name} 
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="flex items-center justify-center h-full bg-gray-200 text-gray-500">
                              {t('Sem imagem')}
                            </div>
                          )}
                        </div>
                        <div className="p-3">
                          <h3 className="font-medium text-gray-800">{item.name}</h3>
                          <div className="flex justify-between items-center mt-2">
                            <span className="font-bold text-primary">{formatPrice(item.price)}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-gray-500">
                {searchQuery 
                  ? t('Nenhum item encontrado para "{{query}}"', { query: searchQuery }) 
                  : t('Nenhum item disponível')}
              </div>
            )
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {filteredItems.length > 0 ? (
                filteredItems.map((item) => (
                  <div 
                    key={item.id} 
                    className="bg-white border border-gray-200 rounded-lg overflow-hidden shadow-sm hover:shadow-md cursor-pointer transition"
                    onClick={() => handleAddItem(item)}
                  >
                    <div className="h-32 w-full overflow-hidden">
                      {item.image ? (
                        <img 
                          src={item.image} 
                          alt={item.name} 
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="flex items-center justify-center h-full bg-gray-200 text-gray-500">
                          {t('Sem imagem')}
                        </div>
                      )}
                    </div>
                    <div className="p-3">
                      <h3 className="font-medium text-gray-800">{item.name}</h3>
                      <div className="flex justify-between items-center mt-2">
                        <span className="font-bold text-primary">{formatPrice(item.price)}</span>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="col-span-4 text-center py-8 text-gray-500">
                  {searchQuery 
                    ? t('Nenhum item encontrado para "{{query}}"', { query: searchQuery }) 
                    : t('Nenhum item disponível nesta categoria')}
                </div>
              )}
            </div>
          )}
        </div>
        
        {/* Área de Pedido (1/3 da largura) */}
        <div className="w-1/3 bg-white border-l border-gray-200 flex flex-col">
          {/* Cabeçalho do Pedido */}
          <div className="p-4 border-b border-gray-200">
            <div className="flex items-center">
              <ShoppingCart className="mr-2 h-5 w-5 text-primary" />
              <h2 className="text-xl font-bold text-gray-800">{t('Pedido Atual')}</h2>
            </div>
            <p className="text-sm text-gray-500 mt-1">
              {orderItems.length === 0 
                ? t('Nenhum item adicionado') 
                : t('{{count}} itens no pedido', { count: totalItems })}
            </p>
          </div>
          
          {/* Lista de Itens do Pedido */}
          <div className="flex-1 overflow-y-auto p-4">
            {orderItems.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-gray-500">
                <ShoppingCart className="h-12 w-12 mb-4 text-gray-300" />
                <p>{t('Adicione itens do menu ao pedido')}</p>
              </div>
            ) : (
              <div className="space-y-4">
                {orderItems.map((item) => (
                  <div key={item.menuItem.id} className="flex items-start border-b border-gray-200 pb-4">
                    <div className="flex-1">
                      <p className="font-medium text-gray-800">{item.menuItem.name}</p>
                      <p className="text-sm text-gray-500">
                        {formatPrice(item.menuItem.price)} x {item.quantity}
                      </p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <button 
                        className="w-8 h-8 flex items-center justify-center rounded-full border border-gray-300 hover:bg-gray-100"
                        onClick={() => handleRemoveItem(item.menuItem)}
                      >
                        <Minus className="h-4 w-4 text-gray-500" />
                      </button>
                      <span className="w-6 text-center font-medium">{item.quantity}</span>
                      <button 
                        className="w-8 h-8 flex items-center justify-center rounded-full border border-gray-300 hover:bg-gray-100"
                        onClick={() => handleAddItem(item.menuItem)}
                      >
                        <Plus className="h-4 w-4 text-gray-500" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
          
          {/* Rodapé com Total e Botões */}
          <div className="p-4 border-t border-gray-200">
            <div className="flex justify-between items-center mb-4">
              <span className="text-xl font-bold text-gray-800">{t('Total:')}</span>
              <span className="text-2xl font-bold text-primary">{formatPrice(totalPrice)}</span>
            </div>
            
            <div className="grid grid-cols-1 gap-2">
              <button 
                className="py-3 bg-primary text-white rounded-lg font-bold hover:bg-primary/90 transition flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={orderItems.length === 0}
                onClick={handleFinalizeOrder}
              >
                <Check className="mr-2 h-5 w-5" />
                {t('Finalizar Pedido')}
              </button>
              
              <button 
                className="py-3 bg-white text-gray-700 border border-gray-300 rounded-lg font-bold hover:bg-gray-50 transition disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={orderItems.length === 0}
                onClick={handleClearOrder}
              >
                {t('Limpar Pedido')}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default POSMode;