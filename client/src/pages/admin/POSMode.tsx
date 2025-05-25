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
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<string>("cash");
  
  // Carregar métodos de pagamento disponíveis com atualização automática
  const { data: paymentSettings } = useQuery({
    queryKey: ['/api/settings/payments'],
    refetchInterval: 10000, // Atualiza a cada 10 segundos
    refetchIntervalInBackground: true,
  });
  
  // Carregar produtos do menu com atualização automática
  const { data: menuItemsData, isLoading } = useQuery({
    queryKey: ['/api/menu-items'],
    refetchInterval: 15000, // Atualiza a cada 15 segundos
    refetchIntervalInBackground: true,
  });
  
  // Os dados já vêm agrupados por categoria, então não precisamos de uma consulta separada
  const categories = menuItemsData ? menuItemsData.map((cat: any) => cat.category) : [];
  const categoriesLoading = isLoading;
  
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
  
  // Abrir o modal de seleção de método de pagamento
  const handleFinalizeOrder = () => {
    setIsPaymentModalOpen(true);
  };
  
  // Processar o pedido após selecionar o método de pagamento
  // Função para gerar recibo formatado
  const generateReceipt = () => {
    const now = new Date();
    const paymentMethodNames: { [key: string]: string } = {
      'cash': 'Dinheiro',
      'card': 'Cartão',
      'mbway': 'MBWay', 
      'multibanco': 'Multibanco',
      'multibanco_tpa': 'Multibanco (TPA)',
      'transfer': 'Transferência'
    };
    
    const receiptContent = `
========================================
           OPA QUE DELÍCIA
        Restaurante Brasileiro
========================================
Data: ${now.toLocaleString("pt-PT")}
Recibo #${Math.random().toString(36).substring(7).toUpperCase()}

ITENS DO PEDIDO:
----------------------------------------
${orderItems.map(item => 
  `${item.quantity}x ${item.menuItem.name.padEnd(20)} €${(item.menuItem.price * item.quantity / 100).toFixed(2)}`
).join('\n')}
----------------------------------------
Subtotal:                   €${(totalPrice / 100).toFixed(2)}
IVA (23%):                   €${(totalPrice * 0.23 / 100).toFixed(2)}
TOTAL:                      €${(totalPrice * 1.23 / 100).toFixed(2)}

Forma de Pagamento: ${paymentMethodNames[selectedPaymentMethod] || selectedPaymentMethod}
Status: Pago

========================================
         Obrigado pela visita!
         Volte sempre!
========================================
    `;
    return receiptContent.trim();
  };

  // Função para gravar e imprimir
  const handleSaveAndPrint = () => {
    Swal.fire({
      title: t('Confirmar Pedido'),
      text: t('Deseja gravar e imprimir este pedido?'),
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#16a34a',
      cancelButtonColor: '#6b7280',
      confirmButtonText: t('Sim, gravar e imprimir'),
      cancelButtonText: t('Cancelar')
    }).then((result) => {
      if (result.isConfirmed) {
        // Gerar o recibo
        const receiptContent = generateReceipt();
        
        // Tentar imprimir usando as configurações salvas
        if ((window as any).printReceiptWithSettings) {
          (window as any).printReceiptWithSettings(receiptContent);
        } else {
          // Fallback para impressão básica
          const printWindow = window.open('', '_blank');
          if (printWindow) {
            printWindow.document.write(`
              <html>
                <head>
                  <title>Recibo</title>
                  <style>
                    body { 
                      font-family: 'Courier New', monospace; 
                      font-size: 12px; 
                      margin: 20px;
                      white-space: pre-line;
                    }
                  </style>
                </head>
                <body>${receiptContent}</body>
              </html>
            `);
            printWindow.document.close();
            setTimeout(() => {
              printWindow.print();
              setTimeout(() => printWindow.close(), 1000);
            }, 500);
          }
        }
        
        // Mostrar mensagem de sucesso
        Swal.fire({
          title: t('Sucesso!'),
          text: t('Pedido gravado e enviado para impressão!'),
          icon: 'success',
          timer: 2000,
          showConfirmButton: false
        });
        
        // Limpar o pedido atual
        setOrderItems([]);
      }
    });
  };

  const handleProcessOrder = (shouldPrint: boolean = false) => {
    setIsPaymentModalOpen(false);
    
    // Usar SweetAlert2 para confirmar a finalização
    import('sweetalert2').then((Swal) => {
      Swal.default.fire({
        title: t('Finalizar Pedido'),
        text: t('Escolha a opção desejada:'),
        icon: 'question',
        showCancelButton: true,
        showDenyButton: true,
        confirmButtonColor: '#009c3b',
        denyButtonColor: '#002776',
        cancelButtonColor: '#c8102e',
        confirmButtonText: t('Gravar'),
        denyButtonText: t('Gravar e Imprimir'),
        cancelButtonText: t('Cancelar')
      }).then((result) => {
        if (result.isConfirmed || result.isDenied) {
          const printReceipt = result.isDenied;
          
          // Preparar os dados do pedido para enviar para a API
          const orderData = {
            items: orderItems.map(item => ({
              menuItemId: item.menuItem.id,
              quantity: item.quantity,
              price: item.menuItem.price,
              notes: '',
              modifications: []
            })),
            totalAmount: totalPrice,
            paymentMethod: selectedPaymentMethod, // Usar o método de pagamento selecionado
            discount: 0,
            tax: 0,
            printReceipt,
            type: 'pos'
          };
          
          // Enviar os dados para a API
          fetch('/api/pos/orders', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(orderData),
          })
          .then(response => {
            if (!response.ok) {
              throw new Error(t('Erro ao salvar pedido'));
            }
            return response.json();
          })
          .then(data => {
            // Se deve imprimir, gerar e imprimir o recibo
            if (shouldPrint) {
              const receiptContent = generateReceipt();
              
              // Tentar imprimir usando as configurações salvas
              if ((window as any).printReceiptWithSettings) {
                (window as any).printReceiptWithSettings(receiptContent);
              } else {
                // Fallback para impressão básica
                const printWindow = window.open('', '_blank');
                if (printWindow) {
                  printWindow.document.write(`
                    <html>
                      <head>
                        <title>Recibo</title>
                        <style>
                          body { 
                            font-family: 'Courier New', monospace; 
                            font-size: 12px; 
                            margin: 20px;
                            white-space: pre-line;
                          }
                        </style>
                      </head>
                      <body>${receiptContent}</body>
                    </html>
                  `);
                  printWindow.document.close();
                  setTimeout(() => {
                    printWindow.print();
                    setTimeout(() => printWindow.close(), 1000);
                  }, 500);
                }
              }
            }
            
            // Mostrar mensagem de sucesso
            Swal.default.fire({
              title: t('Sucesso!'),
              text: shouldPrint 
                ? t('Pedido gravado e enviado para impressão!') 
                : t('Pedido gravado com sucesso!'),
              icon: 'success',
              timer: 2000,
              showConfirmButton: false
            });
            
            // Limpar o pedido atual
            setOrderItems([]);
          })
          .catch(error => {
            // Mostrar mensagem de erro
            Swal.default.fire({
              title: t('Erro!'),
              text: error.message,
              icon: 'error',
              confirmButtonColor: '#009c3b'
            });
          });
        }
      });
    });
  };
  
  const getAllItems = () => {
    if (!menuItemsData) return [];
    
    // Extrair todos os itens do menu de todas as categorias
    const allItems: MenuItem[] = [];
    menuItemsData.forEach((category: any) => {
      if (category.items && Array.isArray(category.items)) {
        category.items.forEach((item: any) => {
          allItems.push({
            ...item,
            category: category.category
          });
        });
      }
    });
    
    return allItems;
  };

  const filterItems = () => {
    if (!menuItemsData) return [];
    
    // Se for "all" e não houver busca, retorna tudo
    if (activeCategory === "all" && !searchQuery.trim()) {
      return menuItemsData;
    }
    
    // Se for uma categoria específica, filtra os itens dessa categoria
    let filteredData = [...menuItemsData];
    
    // Filtrar por categoria
    if (activeCategory !== "all") {
      filteredData = filteredData.filter((cat: any) => cat.category.name === activeCategory);
    }
    
    // Se tiver um termo de busca, aplicamos o filtro em todas as categorias
    if (searchQuery.trim() !== "") {
      const query = searchQuery.toLowerCase();
      
      // Filtrar itens dentro de cada categoria
      filteredData = filteredData.map((cat: any) => {
        const filteredItems = cat.items.filter((item: any) => 
          item.name.toLowerCase().includes(query) || 
          (item.description && item.description.toLowerCase().includes(query))
        );
        
        return {
          ...cat,
          items: filteredItems
        };
      }).filter((cat: any) => cat.items.length > 0); // Remover categorias sem itens
    }
    
    return filteredData;
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
  
  const filteredData = filterItems();
  
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
          {filteredData && filteredData.length > 0 ? (
            filteredData.map((categoryData: any) => (
              <div key={categoryData.category.id} className="mb-8">
                <h2 className="text-lg font-semibold text-gray-700 mb-3">{categoryData.category.name}</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {categoryData.items && categoryData.items.map((item: any) => (
                    <div 
                      key={item.id} 
                      className="bg-white border border-gray-200 rounded-lg overflow-hidden shadow-sm hover:shadow-md cursor-pointer transition"
                      onClick={() => handleAddItem({
                        ...item,
                        category: categoryData.category
                      })}
                    >
                      <div className="h-32 w-full overflow-hidden">
                        {item.image_url ? (
                          <img 
                            src={item.image_url} 
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
                : t('Nenhum item disponível' + (activeCategory !== 'all' ? ` na categoria ${activeCategory}` : ''))}
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
                className="py-3 bg-green-600 text-white rounded-lg font-bold hover:bg-green-700 transition flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={orderItems.length === 0}
                onClick={handleSaveAndPrint}
              >
                <Check className="mr-2 h-5 w-5" />
                {t('Gravar e Imprimir')}
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
      
      {/* Modal de Seleção de Método de Pagamento */}
      {isPaymentModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-semibold">{t('Método de Pagamento')}</h3>
              <button 
                onClick={() => setIsPaymentModalOpen(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="h-6 w-6" />
              </button>
            </div>
            
            <div className="mb-6">
              <p className="text-gray-600 mb-4">{t('Selecione o método de pagamento:')}</p>
              
              <div className="space-y-3">
                {/* Opção Dinheiro - Sempre disponível */}
                <div 
                  className={`p-3 border rounded-lg cursor-pointer flex items-center ${
                    selectedPaymentMethod === 'cash' ? 'border-primary bg-primary/5' : 'border-gray-300'
                  }`}
                  onClick={() => setSelectedPaymentMethod('cash')}
                >
                  <div className={`w-6 h-6 rounded-full border mr-3 flex items-center justify-center ${
                    selectedPaymentMethod === 'cash' ? 'border-primary' : 'border-gray-300'
                  }`}>
                    {selectedPaymentMethod === 'cash' && <Check className="h-4 w-4 text-primary" />}
                  </div>
                  <div>
                    <div className="font-medium">{t('Dinheiro')}</div>
                    <div className="text-sm text-gray-500">{t('Pago no restaurante')}</div>
                  </div>
                </div>
                
                {/* Opção Transferência Bancária */}
                {paymentSettings?.acceptBankTransfer && (
                  <div 
                    className={`p-3 border rounded-lg cursor-pointer flex items-center ${
                      selectedPaymentMethod === 'bank_transfer' ? 'border-primary bg-primary/5' : 'border-gray-300'
                    }`}
                    onClick={() => setSelectedPaymentMethod('bank_transfer')}
                  >
                    <div className={`w-6 h-6 rounded-full border mr-3 flex items-center justify-center ${
                      selectedPaymentMethod === 'bank_transfer' ? 'border-primary' : 'border-gray-300'
                    }`}>
                      {selectedPaymentMethod === 'bank_transfer' && <Check className="h-4 w-4 text-primary" />}
                    </div>
                    <div>
                      <div className="font-medium">{t('Transferência Bancária')}</div>
                      <div className="text-sm text-gray-500">{t('Requer verificação manual')}</div>
                    </div>
                  </div>
                )}
                
                {/* Opção Cartão */}
                {paymentSettings?.acceptCard && (
                  <div 
                    className={`p-3 border rounded-lg cursor-pointer flex items-center ${
                      selectedPaymentMethod === 'card' ? 'border-primary bg-primary/5' : 'border-gray-300'
                    }`}
                    onClick={() => setSelectedPaymentMethod('card')}
                  >
                    <div className={`w-6 h-6 rounded-full border mr-3 flex items-center justify-center ${
                      selectedPaymentMethod === 'card' ? 'border-primary' : 'border-gray-300'
                    }`}>
                      {selectedPaymentMethod === 'card' && <Check className="h-4 w-4 text-primary" />}
                    </div>
                    <div>
                      <div className="font-medium">{t('Cartão')}</div>
                      <div className="text-sm text-gray-500">{t('Crédito ou Débito')}</div>
                    </div>
                  </div>
                )}
                
                {/* Opção Multibanco */}
                {paymentSettings?.acceptMultibanco && (
                  <div 
                    className={`p-3 border rounded-lg cursor-pointer flex items-center ${
                      selectedPaymentMethod === 'multibanco' ? 'border-primary bg-primary/5' : 'border-gray-300'
                    }`}
                    onClick={() => setSelectedPaymentMethod('multibanco')}
                  >
                    <div className={`w-6 h-6 rounded-full border mr-3 flex items-center justify-center ${
                      selectedPaymentMethod === 'multibanco' ? 'border-primary' : 'border-gray-300'
                    }`}>
                      {selectedPaymentMethod === 'multibanco' && <Check className="h-4 w-4 text-primary" />}
                    </div>
                    <div>
                      <div className="font-medium">{t('Multibanco')}</div>
                      <div className="text-sm text-gray-500">{t('Referência para pagamento')}</div>
                    </div>
                  </div>
                )}
                
                {/* Opção MBWay */}
                {paymentSettings?.acceptMBWay && (
                  <div 
                    className={`p-3 border rounded-lg cursor-pointer flex items-center ${
                      selectedPaymentMethod === 'mbway' ? 'border-primary bg-primary/5' : 'border-gray-300'
                    }`}
                    onClick={() => setSelectedPaymentMethod('mbway')}
                  >
                    <div className={`w-6 h-6 rounded-full border mr-3 flex items-center justify-center ${
                      selectedPaymentMethod === 'mbway' ? 'border-primary' : 'border-gray-300'
                    }`}>
                      {selectedPaymentMethod === 'mbway' && <Check className="h-4 w-4 text-primary" />}
                    </div>
                    <div>
                      <div className="font-medium">{t('MBWay')}</div>
                      <div className="text-sm text-gray-500">{t('Pagamento via telemóvel')}</div>
                    </div>
                  </div>
                )}
                
                {/* Opção Multibanco (TPA) - Condicionado às configurações */}
                {paymentSettings?.acceptMultibancoTPA && (
                  <div 
                    className={`p-3 border rounded-lg cursor-pointer flex items-center ${
                      selectedPaymentMethod === 'multibanco_tpa' ? 'border-primary bg-primary/5' : 'border-gray-300'
                    }`}
                    onClick={() => setSelectedPaymentMethod('multibanco_tpa')}
                  >
                    <div className={`w-6 h-6 rounded-full border mr-3 flex items-center justify-center ${
                      selectedPaymentMethod === 'multibanco_tpa' ? 'border-primary' : 'border-gray-300'
                    }`}>
                      {selectedPaymentMethod === 'multibanco_tpa' && <Check className="h-4 w-4 text-primary" />}
                    </div>
                    <div>
                      <div className="font-medium">{t('Multibanco (TPA)')}</div>
                      <div className="text-sm text-gray-500">{t('Terminal de Pagamento Automático')}</div>
                    </div>
                  </div>
                )}
              </div>
            </div>
            
            <div className="flex justify-end space-x-3">
              <button 
                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50"
                onClick={() => setIsPaymentModalOpen(false)}
              >
                {t('Cancelar')}
              </button>
              <button 
                className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700"
                onClick={() => handleProcessOrder(false)}
              >
                {t('Gravar')}
              </button>
              <button 
                className="px-4 py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700"
                onClick={() => handleProcessOrder(true)}
              >
                {t('Gravar e Imprimir')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default POSMode;