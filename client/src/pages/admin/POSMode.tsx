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
  const [activeCategory, setActiveCategory] = useState<string>("");
  const [orderItems, setOrderItems] = useState<OrderItem[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<string>("cash");
  const [isClientModalOpen, setIsClientModalOpen] = useState(false);
  const [selectedClient, setSelectedClient] = useState<any>(null);
  const [isNewClientModalOpen, setIsNewClientModalOpen] = useState(false);
  const [clientSearchQuery, setClientSearchQuery] = useState('');
  const [newClientData, setNewClientData] = useState({
    username: '',
    email: '',
    first_name: '',
    last_name: '',
    phone: ''
  });
  const [isCashCalculatorOpen, setIsCashCalculatorOpen] = useState(false);
  const [amountReceived, setAmountReceived] = useState<string>('');
  const [calculatorDisplay, setCalculatorDisplay] = useState<string>('');
  
  // Carregar métodos de pagamento disponíveis com atualização automática
  const { data: paymentSettings = {} } = useQuery({
    queryKey: ['/api/settings/payments'],
    refetchInterval: 10000, // Atualiza a cada 10 segundos
    refetchIntervalInBackground: true,
  });
  
  // Carregar produtos do menu com atualização automática
  const { data: menuItemsData = [], isLoading } = useQuery({
    queryKey: ['/api/menu-items'],
    refetchInterval: 15000, // Atualiza a cada 15 segundos
    refetchIntervalInBackground: true,
  });

  // Carregar apenas funcionários (staff)
  const { data: staffClients = [] } = useQuery({
    queryKey: ['/api/users/staff'],
    enabled: isClientModalOpen, // Só carrega quando o modal está aberto
  });
  
  // Os dados já vêm agrupados por categoria, então não precisamos de uma consulta separada
  const categories = Array.isArray(menuItemsData) ? menuItemsData.map((cat: any) => cat.category) : [];
  const categoriesLoading = isLoading;
  
  // Definir automaticamente a primeira categoria como ativa quando as categorias forem carregadas
  useEffect(() => {
    if (categories && categories.length > 0 && !activeCategory) {
      setActiveCategory(categories[0].name);
    }
  }, [categories, activeCategory]);
  
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
    console.log('🔍 DEBUG - Abrindo modal, método atual:', selectedPaymentMethod);
    setIsPaymentModalOpen(true);
  };
  
  // Processar o pedido após selecionar o método de pagamento
  // Função para gerar recibo formatado otimizado
  const generateReceipt = () => {
    const now = new Date();
    const receiptNumber = Math.random().toString(36).substring(7).toUpperCase();
    
    // Formato mais compacto para economizar papel
    const receiptContent = `========================================
           OPA QUE DELÍCIA
        Restaurante Brasileiro
========================================
Data: ${now.toLocaleString("pt-PT")}
Recibo: #${receiptNumber}

ITENS DO PEDIDO:
----------------------------------------
${orderItems.map(item => {
  const itemTotal = (item.menuItem.price * item.quantity / 100).toFixed(2);
  const itemName = item.menuItem.name.length > 18 ? 
    item.menuItem.name.substring(0, 18) + '...' : 
    item.menuItem.name;
  return `${item.quantity}x ${itemName.padEnd(20)} €${itemTotal}`;
}).join('\n')}
----------------------------------------
Subtotal:               €${(totalPrice / 100).toFixed(2)}
IVA (23%):              €${(totalPrice * 0.23 / 100).toFixed(2)}
TOTAL:                  €${(totalPrice * 1.23 / 100).toFixed(2)}

Pagamento: ${selectedPaymentMethod?.toUpperCase() || 'N/A'}
Status: PAGO

========================================
       Obrigado pela visita!
       www.opaquedelicia.pt
========================================`;
    
    return receiptContent;
  };

  // Função para gravar e imprimir
  const handleSaveAndPrint = async () => {
    try {
      // Gerar o recibo
      const receiptContent = generateReceipt();
      
      // Primeiro, salvar o pedido no banco de dados
      const orderData = {
        items: orderItems,
        totalAmount: totalPrice,
        paymentMethod: 'cash',
        status: 'completed',
        type: 'pos'
      };

      const response = await fetch('/api/pos/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(orderData),
      });

      if (!response.ok) {
        throw new Error(t('Erro ao salvar pedido'));
      }

      const orderResult = await response.json();
      console.log('Pedido salvo com sucesso:', orderResult);

      // Agora tentar imprimir usando o sistema de impressoras
      try {
        const printResponse = await fetch('/api/printers/print-receipt', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            content: receiptContent,
            orderId: orderResult.id
          }),
        });

        if (printResponse.ok) {
          const printResult = await printResponse.json();
          console.log('Impressão enviada:', printResult);
          
          // Mostrar mensagem de sucesso
          import('sweetalert2').then((Swal) => {
            Swal.default.fire({
              title: t('Sucesso!'),
              text: t('Pedido salvo e enviado para impressão!'),
              icon: 'success',
              timer: 2000,
              showConfirmButton: false
            });
          });
        } else {
          throw new Error('Falha na impressão');
        }
      } catch (printError) {
        console.log("Impressão física falhou, usando impressão do navegador:", printError);
        
        // Fallback para impressão do navegador
        const printWindow = window.open('', '_blank');
        if (printWindow) {
          const html = `
            <!DOCTYPE html>
            <html>
              <head>
                <meta charset="UTF-8">
                <title>Recibo - Opa que Delícia</title>
                <style>
                  @page {
                    size: 58mm auto;
                    margin: 0;
                  }
                  * {
                    margin: 0;
                    padding: 0;
                    box-sizing: border-box;
                  }
                  body { 
                    font-family: 'Courier New', monospace; 
                    font-size: 10px; 
                    line-height: 12px;
                    width: 58mm;
                    padding: 2mm;
                    white-space: pre-line;
                    overflow: hidden;
                    background: white;
                  }
                  @media print {
                    body {
                      -webkit-print-color-adjust: exact;
                      print-color-adjust: exact;
                    }
                  }
                </style>
              </head>
              <body>${receiptContent}</body>
            </html>
          `;
          printWindow.document.write(html);
          printWindow.document.close();
          setTimeout(() => {
            printWindow.print();
            setTimeout(() => printWindow.close(), 1000);
          }, 500);
        }

        // Mostrar mensagem informando sobre fallback
        import('sweetalert2').then((Swal) => {
          Swal.default.fire({
            title: t('Pedido Salvo!'),
            text: t('Pedido salvo com sucesso. Impressão enviada para o navegador.'),
            icon: 'info',
            timer: 2000,
            showConfirmButton: false
          });
        });
      }
      
      // Limpar o pedido atual
      setOrderItems([]);
      
    } catch (error) {
      console.error("Erro ao gravar e imprimir:", error);
      import('sweetalert2').then((Swal) => {
        Swal.default.fire({
          title: t('Erro!'),
          text: t('Falha ao gravar o pedido'),
          icon: 'error',
          confirmButtonColor: '#009c3b'
        });
      });
    }
  };

  const processStaffOrder = async () => {
    try {
      // Preparar os dados do pedido para o funcionário
      const orderData = {
        items: orderItems.map(item => ({
          menuItemId: item.menuItem.id,
          quantity: item.quantity,
          price: item.menuItem.price,
          notes: '',
          modifications: []
        })),
        totalAmount: totalPrice,
        paymentMethod: 'staff',
        staffClientId: selectedClient.id, // ID do funcionário
        discount: 0,
        tax: 0,
        type: 'pos',
        status: 'pending' // Status pendente para pedidos staff
      };

      // Enviar os dados para a API
      const response = await fetch('/api/pos/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(orderData),
      });

      if (!response.ok) {
        throw new Error(t('Erro ao salvar pedido'));
      }

      const result = await response.json();

      // Imprimir automaticamente o recibo do pedido staff
      const receiptContent = generateStaffReceipt();
      
      if ((window as any).printReceiptWithSettings) {
        console.log("🖨️ Imprimindo recibo staff automaticamente");
        (window as any).printReceiptWithSettings(receiptContent);
      } else {
        // Fallback para impressão básica
        const printWindow = window.open('', '_blank');
        if (printWindow) {
          const html = `
            <!DOCTYPE html>
            <html>
              <head>
                <meta charset="UTF-8">
                <title>Recibo Staff - Opa que Delícia</title>
                <style>
                  @page { size: 58mm auto; margin: 0; }
                  * { margin: 0; padding: 0; box-sizing: border-box; }
                  body { 
                    font-family: 'Courier New', monospace; 
                    font-size: 10px; 
                    line-height: 12px;
                    width: 58mm;
                    padding: 2mm;
                    white-space: pre-line;
                    overflow: hidden;
                    background: white;
                  }
                </style>
              </head>
              <body>${receiptContent}</body>
            </html>
          `;
          printWindow.document.write(html);
          printWindow.document.close();
          setTimeout(() => {
            printWindow.print();
            setTimeout(() => printWindow.close(), 1000);
          }, 500);
        }
      }

      // Mostrar confirmação de sucesso
      import('sweetalert2').then((Swal) => {
        Swal.default.fire({
          title: t('Pedido Registrado!'),
          text: t('Pedido staff registrado e enviado para impressão para {{name}}', { 
            name: `${selectedClient.first_name} ${selectedClient.last_name}` 
          }),
          icon: 'success',
          confirmButtonColor: '#f97316',
          confirmButtonText: t('OK')
        }).then(() => {
          // Limpar o pedido após sucesso
          setOrderItems([]);
          setSelectedClient(null);
        });
      });

    } catch (error) {
      console.error('Erro ao processar pedido staff:', error);
      import('sweetalert2').then((Swal) => {
        Swal.default.fire({
          title: t('Erro'),
          text: t('Erro ao processar pedido staff'),
          icon: 'error',
          confirmButtonColor: '#f97316'
        });
      });
    }
  };

  const handleProcessOrder = () => {
    setIsPaymentModalOpen(false);
    
    // Se o método selecionado for "staff", abrir modal de seleção de cliente
    if (selectedPaymentMethod === 'staff') {
      setIsClientModalOpen(true);
      return;
    }
    
    // Se o método selecionado for "cash", abrir calculadora de troco
    if (selectedPaymentMethod === 'cash') {
      setIsCashCalculatorOpen(true);
      setAmountReceived('');
      setCalculatorDisplay('');
      return;
    }
    
    // Para outros métodos, continuar com o fluxo normal
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
            // Se foi selecionado "Gravar e Imprimir", imprimir usando as configurações POS
            if (printReceipt) {
              const receiptContent = generateReceipt();
              
              // Tentar imprimir usando as configurações POS salvas
              if ((window as any).printReceiptWithSettings) {
                console.log("🖨️ Usando configurações POS para impressão automática");
                (window as any).printReceiptWithSettings(receiptContent);
              } else {
                console.log("⚠️ Configurações POS não encontradas, usando impressão básica");
                // Fallback para impressão básica
                const printWindow = window.open('', '_blank');
                if (printWindow) {
                  const html = `
                    <!DOCTYPE html>
                    <html>
                      <head>
                        <meta charset="UTF-8">
                        <title>Recibo - Opa que Delícia</title>
                        <style>
                          @page {
                            size: A4;
                            margin: 15mm;
                          }
                          * {
                            margin: 0;
                            padding: 0;
                            box-sizing: border-box;
                          }
                          body { 
                            font-family: 'Courier New', monospace; 
                            font-size: 14px; 
                            line-height: 18px;
                            width: 100%;
                            max-width: 80mm;
                            padding: 5mm;
                            white-space: pre-line;
                            overflow: hidden;
                            background: white;
                            margin: 0 auto;
                          }
                          @media print {
                            body {
                              -webkit-print-color-adjust: exact;
                              print-color-adjust: exact;
                            }
                          }
                        </style>
                      </head>
                      <body>${receiptContent}</body>
                    </html>
                  `;
                  printWindow.document.write(html);
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
              text: printReceipt 
                ? t('Pedido finalizado e enviado para impressão!') 
                : t('Pedido finalizado com sucesso!'),
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

  // Funções da calculadora de troco
  const handleCalculatorInput = (value: string) => {
    if (value === 'C') {
      setCalculatorDisplay('');
      setAmountReceived('');
    } else if (value === '⌫') {
      setCalculatorDisplay(prev => prev.slice(0, -1));
    } else if (value === '.') {
      if (!calculatorDisplay.includes('.')) {
        setCalculatorDisplay(prev => prev + value);
      }
    } else {
      setCalculatorDisplay(prev => prev + value);
    }
  };

  const handleConfirmCashPayment = () => {
    const receivedAmount = parseFloat(calculatorDisplay) || 0;
    const totalAmount = totalPrice / 100;
    
    if (receivedAmount < totalAmount) {
      import('sweetalert2').then((Swal) => {
        Swal.default.fire({
          title: t('Valor Insuficiente'),
          text: t('O valor recebido é menor que o total do pedido.'),
          icon: 'warning',
          confirmButtonText: t('OK')
        });
      });
      return;
    }

    setAmountReceived(calculatorDisplay);
    setIsCashCalculatorOpen(false);
    
    // Continuar com o fluxo normal de finalização do pedido
    processCashOrder(receivedAmount);
  };

  const processCashOrder = (receivedAmount: number) => {
    import('sweetalert2').then((Swal) => {
      const change = receivedAmount - (totalPrice / 100);
      
      Swal.default.fire({
        title: t('Finalizar Pedido'),
        html: `
          <div class="text-left">
            <p><strong>${t('Total')}: </strong>${formatPrice(totalPrice)}</p>
            <p><strong>${t('Recebido')}: </strong>€${receivedAmount.toFixed(2)}</p>
            <p><strong>${t('Troco')}: </strong>€${change.toFixed(2)}</p>
          </div>
        `,
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
          completeCashOrder(printReceipt, receivedAmount, change);
        }
      });
    });
  };

  const completeCashOrder = (printReceipt: boolean, receivedAmount: number, change: number) => {
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
      paymentMethod: 'cash',
      discount: 0,
      tax: 0,
      printReceipt,
      type: 'pos',
      cashDetails: {
        received: receivedAmount,
        change: change
      }
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
      if (printReceipt) {
        const receiptContent = generateReceiptWithChange(receivedAmount, change);
        
        if ((window as any).printReceiptWithSettings) {
          (window as any).printReceiptWithSettings(receiptContent);
        } else {
          const printWindow = window.open('', '_blank');
          if (printWindow) {
            const html = `
              <!DOCTYPE html>
              <html>
                <head>
                  <meta charset="UTF-8">
                  <title>Recibo - Opa que Delícia</title>
                  <style>
                    @page { size: 58mm auto; margin: 0; }
                    * { margin: 0; padding: 0; box-sizing: border-box; }
                    body { 
                      font-family: 'Courier New', monospace; 
                      font-size: 10px; 
                      line-height: 12px;
                      width: 58mm;
                      padding: 2mm;
                      white-space: pre-line;
                      overflow: hidden;
                      background: white;
                    }
                    @media print {
                      body {
                        -webkit-print-color-adjust: exact;
                        print-color-adjust: exact;
                      }
                    }
                  </style>
                </head>
                <body>${receiptContent}</body>
              </html>
            `;
            printWindow.document.write(html);
            printWindow.document.close();
            setTimeout(() => {
              printWindow.print();
              setTimeout(() => printWindow.close(), 1000);
            }, 500);
          }
        }
      }
      
      import('sweetalert2').then((Swal) => {
        Swal.default.fire({
          title: t('Sucesso!'),
          text: printReceipt 
            ? t('Pedido finalizado e enviado para impressão!') 
            : t('Pedido finalizado com sucesso!'),
          icon: 'success',
          timer: 2000,
          showConfirmButton: false
        });
      });
      
      setOrderItems([]);
    })
    .catch(error => {
      import('sweetalert2').then((Swal) => {
        Swal.default.fire({
          title: t('Erro!'),
          text: error.message,
          icon: 'error',
          confirmButtonText: t('OK')
        });
      });
    });
  };

  // Função para gerar recibo de pedido staff
  const generateStaffReceipt = () => {
    const receiptNumber = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    const currentDate = new Date();
    const dateStr = currentDate.toLocaleDateString('pt-PT');
    const timeStr = currentDate.toLocaleTimeString('pt-PT');
    
    const receiptContent = `
========================================
           OPA QUE DELÍCIA
       Rua do Sabor, 123 - Lisboa
        Tel: 21 123 4567
        NIF: 123456789
========================================
Data: ${dateStr}        Hora: ${timeStr}
Funcionário: ${selectedClient?.first_name} ${selectedClient?.last_name}
Recibo: #${receiptNumber}

ITENS DO PEDIDO:
----------------------------------------
${orderItems.map(item => {
  const itemTotal = (item.menuItem.price * item.quantity / 100).toFixed(2);
  const itemName = item.menuItem.name.length > 18 ? 
    item.menuItem.name.substring(0, 18) + '...' : 
    item.menuItem.name;
  return `${item.quantity}x ${itemName.padEnd(20)} €${itemTotal}`;
}).join('\n')}
----------------------------------------
Subtotal:               €${(totalPrice / 100).toFixed(2)}
IVA (23%):              €${(totalPrice * 0.23 / 100).toFixed(2)}
TOTAL:                  €${(totalPrice * 1.23 / 100).toFixed(2)}

Pagamento: STAFF
Status: PENDENTE

========================================
       Pedido para Funcionário
       Pagamento a ser processado
========================================`;
    
    return receiptContent;
  };

  const generateReceiptWithChange = (receivedAmount: number, change: number) => {
    const currentDate = new Date();
    const dateStr = currentDate.toLocaleDateString('pt-PT');
    const timeStr = currentDate.toLocaleTimeString('pt-PT');
    
    let receipt = `
================================
         OPA QUE DELICIA        
================================
Data: ${dateStr}
Hora: ${timeStr}
--------------------------------
ITENS:
`;

    orderItems.forEach(item => {
      const itemTotal = (item.menuItem.price * item.quantity) / 100;
      receipt += `
${item.menuItem.name}
${item.quantity}x ${formatPrice(item.menuItem.price)} = €${itemTotal.toFixed(2)}`;
    });

    const total = totalPrice / 100;
    
    receipt += `
--------------------------------
TOTAL: €${total.toFixed(2)}
RECEBIDO: €${receivedAmount.toFixed(2)}
TROCO: €${change.toFixed(2)}
--------------------------------
PAGAMENTO: DINHEIRO
--------------------------------
    Obrigado pela preferencia!
      Volte sempre!
================================
`;

    return receipt;
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
                {/* Opção Staff - Sempre disponível */}
                <div 
                  className={`p-3 border rounded-lg cursor-pointer flex items-center ${
                    selectedPaymentMethod === 'staff' ? 'border-orange-500 bg-orange-50' : 'border-gray-300'
                  }`}
                  onClick={() => setSelectedPaymentMethod('staff')}
                >
                  <div className={`w-6 h-6 rounded-full border mr-3 flex items-center justify-center ${
                    selectedPaymentMethod === 'staff' ? 'border-orange-500' : 'border-gray-300'
                  }`}>
                    {selectedPaymentMethod === 'staff' && <Check className="h-4 w-4 text-orange-500" />}
                  </div>
                  <div>
                    <div className="font-medium text-orange-700">{t('Staff')}</div>
                    <div className="text-sm text-orange-600">{t('Pedido de funcionário')}</div>
                  </div>
                </div>

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
                    onClick={() => {
                      console.log('🔍 DEBUG - Selecionando Cartão');
                      setSelectedPaymentMethod('card');
                    }}
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
                    onClick={() => {
                      console.log('🔍 DEBUG - Selecionando Multibanco');
                      setSelectedPaymentMethod('multibanco');
                    }}
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
                    onClick={() => {
                      console.log('🔍 DEBUG - Selecionando MBWay');
                      setSelectedPaymentMethod('mbway');
                    }}
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
                      selectedPaymentMethod === 'multibanco_TPA' ? 'border-primary bg-primary/5' : 'border-gray-300'
                    }`}
                    onClick={() => {
                      setSelectedPaymentMethod('multibanco_TPA');
                    }}
                  >
                    <div className={`w-6 h-6 rounded-full border mr-3 flex items-center justify-center ${
                      selectedPaymentMethod === 'multibanco_TPA' ? 'border-primary' : 'border-gray-300'
                    }`}>
                      {selectedPaymentMethod === 'multibanco_TPA' && <Check className="h-4 w-4 text-primary" />}
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
                className="px-4 py-2 bg-primary text-white rounded-lg font-medium hover:bg-primary/90"
                onClick={handleProcessOrder}
              >
                {t('Continuar')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Seleção de Cliente */}
      {isClientModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl mx-4 max-h-[80vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-semibold">{t('Selecionar Cliente')}</h3>
              <button 
                onClick={() => setIsClientModalOpen(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="h-6 w-6" />
              </button>
            </div>
            
            <div className="mb-4">
              <div className="relative mb-3">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                <input
                  type="text"
                  placeholder={t('Pesquisar funcionário...')}
                  value={clientSearchQuery}
                  onChange={(e) => setClientSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                />
              </div>
              
              <button
                onClick={() => setIsNewClientModalOpen(true)}
                className="w-full p-3 border-2 border-dashed border-orange-300 rounded-lg text-orange-600 hover:bg-orange-50 transition-colors"
              >
                <Plus className="w-5 h-5 inline mr-2" />
                {t('Adicionar Novo Funcionário')}
              </button>
            </div>

            <div className="space-y-2 max-h-96 overflow-y-auto">
              {staffClients && staffClients.length > 0 ? (
                staffClients
                  .filter((client: any) => {
                    const searchLower = clientSearchQuery.toLowerCase();
                    return (
                      client.first_name?.toLowerCase().includes(searchLower) ||
                      client.last_name?.toLowerCase().includes(searchLower) ||
                      client.email?.toLowerCase().includes(searchLower) ||
                      client.username?.toLowerCase().includes(searchLower)
                    );
                  })
                  .map((client: any) => (
                    <div
                      key={client.id}
                      className={`p-3 border rounded-lg cursor-pointer hover:bg-gray-50 ${
                        selectedClient?.id === client.id ? 'border-orange-500 bg-orange-50' : 'border-gray-300'
                      }`}
                      onClick={() => setSelectedClient(client)}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-medium text-gray-900">
                            {client.first_name} {client.last_name}
                          </div>
                          <div className="text-sm text-gray-500">
                            {client.email} | {client.username}
                          </div>
                        </div>
                        {selectedClient?.id === client.id && (
                          <Check className="h-5 w-5 text-orange-500" />
                        )}
                      </div>
                    </div>
                  ))
              ) : (
                <div className="text-center py-8 text-gray-500">
                  {t('Nenhum funcionário encontrado')}
                </div>
              )}
            </div>

            <div className="flex justify-end space-x-3 mt-6">
              <button 
                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50"
                onClick={() => setIsClientModalOpen(false)}
              >
                {t('Cancelar')}
              </button>
              <button 
                className="px-4 py-2 bg-orange-500 text-white rounded-lg font-medium hover:bg-orange-600 disabled:opacity-50"
                disabled={!selectedClient}
                onClick={() => {
                  setIsClientModalOpen(false);
                  // Continuar com o processamento do pedido
                  import('sweetalert2').then((Swal) => {
                    Swal.default.fire({
                      title: t('Finalizar Pedido Staff'),
                      text: t('Pedido para: {{name}}', { name: `${selectedClient.first_name} ${selectedClient.last_name}` }),
                      icon: 'question',
                      showCancelButton: true,
                      confirmButtonColor: '#f97316',
                      cancelButtonColor: '#6b7280',
                      confirmButtonText: t('Confirmar'),
                      cancelButtonText: t('Cancelar')
                    }).then((result) => {
                      if (result.isConfirmed) {
                        // Processar pedido staff
                        processStaffOrder();
                      }
                    });
                  });
                }}
              >
                {t('Confirmar Cliente')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Novo Cliente */}
      {isNewClientModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-semibold">{t('Novo Cliente')}</h3>
              <button 
                onClick={() => setIsNewClientModalOpen(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="h-6 w-6" />
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t('Nome')}
                </label>
                <input
                  type="text"
                  value={newClientData.first_name}
                  onChange={(e) => setNewClientData({...newClientData, first_name: e.target.value})}
                  className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                  placeholder={t('Nome do cliente')}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t('Sobrenome')}
                </label>
                <input
                  type="text"
                  value={newClientData.last_name}
                  onChange={(e) => setNewClientData({...newClientData, last_name: e.target.value})}
                  className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                  placeholder={t('Sobrenome do cliente')}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t('Email')}
                </label>
                <input
                  type="email"
                  value={newClientData.email}
                  onChange={(e) => setNewClientData({...newClientData, email: e.target.value})}
                  className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                  placeholder={t('email@exemplo.com')}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t('Telefone')} ({t('opcional')})
                </label>
                <input
                  type="tel"
                  value={newClientData.phone}
                  onChange={(e) => setNewClientData({...newClientData, phone: e.target.value})}
                  className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                  placeholder={t('+351 999 999 999')}
                />
              </div>
            </div>

            <div className="flex justify-end space-x-3 mt-6">
              <button 
                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50"
                onClick={() => setIsNewClientModalOpen(false)}
              >
                {t('Cancelar')}
              </button>
              <button 
                className="px-4 py-2 bg-orange-500 text-white rounded-lg font-medium hover:bg-orange-600 disabled:opacity-50"
                disabled={!newClientData.first_name || !newClientData.email}
                onClick={() => {
                  // TODO: Implementar criação de novo cliente
                  console.log('Criar novo cliente:', newClientData);
                  setIsNewClientModalOpen(false);
                }}
              >
                {t('Criar Cliente')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal da Calculadora de Troco */}
      {isCashCalculatorOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-semibold">{t('Calculadora de Troco')}</h3>
              <button 
                onClick={() => setIsCashCalculatorOpen(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="h-6 w-6" />
              </button>
            </div>
            
            <div className="mb-4">
              <div className="text-sm text-gray-600 mb-2">
                {t('Total do Pedido')}: <span className="font-bold">{formatPrice(totalPrice)}</span>
              </div>
              <div className="text-lg font-bold text-center p-4 bg-gray-100 rounded-lg border-2 min-h-[60px] flex items-center justify-center">
                €{calculatorDisplay || '0.00'}
              </div>
            </div>

            {/* Calculadora */}
            <div className="grid grid-cols-3 gap-3 mb-4">
              {/* Primeira linha */}
              <button 
                onClick={() => handleCalculatorInput('7')}
                className="h-12 bg-gray-200 hover:bg-gray-300 rounded-lg font-semibold"
              >
                7
              </button>
              <button 
                onClick={() => handleCalculatorInput('8')}
                className="h-12 bg-gray-200 hover:bg-gray-300 rounded-lg font-semibold"
              >
                8
              </button>
              <button 
                onClick={() => handleCalculatorInput('9')}
                className="h-12 bg-gray-200 hover:bg-gray-300 rounded-lg font-semibold"
              >
                9
              </button>

              {/* Segunda linha */}
              <button 
                onClick={() => handleCalculatorInput('4')}
                className="h-12 bg-gray-200 hover:bg-gray-300 rounded-lg font-semibold"
              >
                4
              </button>
              <button 
                onClick={() => handleCalculatorInput('5')}
                className="h-12 bg-gray-200 hover:bg-gray-300 rounded-lg font-semibold"
              >
                5
              </button>
              <button 
                onClick={() => handleCalculatorInput('6')}
                className="h-12 bg-gray-200 hover:bg-gray-300 rounded-lg font-semibold"
              >
                6
              </button>

              {/* Terceira linha */}
              <button 
                onClick={() => handleCalculatorInput('1')}
                className="h-12 bg-gray-200 hover:bg-gray-300 rounded-lg font-semibold"
              >
                1
              </button>
              <button 
                onClick={() => handleCalculatorInput('2')}
                className="h-12 bg-gray-200 hover:bg-gray-300 rounded-lg font-semibold"
              >
                2
              </button>
              <button 
                onClick={() => handleCalculatorInput('3')}
                className="h-12 bg-gray-200 hover:bg-gray-300 rounded-lg font-semibold"
              >
                3
              </button>

              {/* Quarta linha */}
              <button 
                onClick={() => handleCalculatorInput('0')}
                className="h-12 bg-gray-200 hover:bg-gray-300 rounded-lg font-semibold col-span-2"
              >
                0
              </button>
              <button 
                onClick={() => handleCalculatorInput('.')}
                className="h-12 bg-gray-200 hover:bg-gray-300 rounded-lg font-semibold"
              >
                .
              </button>

              {/* Quinta linha - Botões de ação */}
              <button 
                onClick={() => handleCalculatorInput('⌫')}
                className="h-12 bg-red-500 hover:bg-red-600 text-white rounded-lg font-semibold"
              >
                ⌫
              </button>
              <button 
                onClick={() => handleCalculatorInput('C')}
                className="h-12 bg-red-500 hover:bg-red-600 text-white rounded-lg font-semibold"
              >
                C
              </button>
              <button 
                onClick={handleConfirmCashPayment}
                className="h-12 bg-green-600 hover:bg-green-700 text-white rounded-lg font-semibold"
              >
                ✓
              </button>
            </div>

            <div className="flex justify-end space-x-3">
              <button 
                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50"
                onClick={() => setIsCashCalculatorOpen(false)}
              >
                {t('Cancelar')}
              </button>
              <button 
                className="px-4 py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700"
                onClick={handleConfirmCashPayment}
              >
                {t('Confirmar Pagamento')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default POSMode;