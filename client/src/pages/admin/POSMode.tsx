import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ShoppingCart, Check, Plus, Minus } from "lucide-react";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Loader2 } from "lucide-react";
import AdminLayout from "@/components/layouts/AdminLayout";
import { useTranslation } from "react-i18next";

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
  const [activeCategory, setActiveCategory] = useState<string>("all");
  const [orderItems, setOrderItems] = useState<OrderItem[]>([]);
  
  const { data: menuItems, isLoading } = useQuery({
    queryKey: ['/api/menu-items'],
  });
  
  const { data: categories, isLoading: categoriesLoading } = useQuery({
    queryKey: ['/api/menu-categories'],
  });
  
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
  
  const filteredItems = activeCategory === "all" 
    ? menuItems 
    : menuItems?.filter((item: MenuItem) => item.category.name === activeCategory);
  
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
      <AdminLayout>
        <div className="flex items-center justify-center h-[70vh]">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      </AdminLayout>
    );
  }
  
  return (
    <AdminLayout>
      <div className="p-4">
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-2xl font-bold">{t('Modo POS')}</h1>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="lg:col-span-2">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle>{t('Menu')}</CardTitle>
                <CardDescription>
                  {t('Selecione itens para adicionar ao pedido')}
                </CardDescription>
              </CardHeader>
              
              <Tabs value={activeCategory} onValueChange={setActiveCategory}>
                <div className="px-4 overflow-x-auto">
                  <TabsList className="mb-2">
                    <TabsTrigger value="all">{t('Todos')}</TabsTrigger>
                    {categories?.map((category: any) => (
                      <TabsTrigger key={category.id} value={category.name}>
                        {category.name}
                      </TabsTrigger>
                    ))}
                  </TabsList>
                </div>
                
                <TabsContent value={activeCategory} className="m-0">
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {filteredItems?.map((item: MenuItem) => (
                        <Card key={item.id} className="overflow-hidden">
                          <div className="h-32 bg-muted relative">
                            {item.image ? (
                              <img 
                                src={item.image} 
                                alt={item.name} 
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="flex items-center justify-center h-full bg-muted">
                                {t('Sem imagem')}
                              </div>
                            )}
                          </div>
                          <CardHeader className="p-3 pb-1">
                            <CardTitle className="text-lg">{item.name}</CardTitle>
                            <CardDescription className="line-clamp-2 h-10">
                              {item.description}
                            </CardDescription>
                          </CardHeader>
                          <CardFooter className="flex justify-between p-3 pt-0">
                            <span className="font-bold">
                              {formatPrice(item.price)}
                            </span>
                            <Button 
                              size="sm" 
                              onClick={() => handleAddItem(item)}
                            >
                              <Plus className="h-4 w-4 mr-1" />
                              {t('Adicionar')}
                            </Button>
                          </CardFooter>
                        </Card>
                      ))}
                    </div>
                  </CardContent>
                </TabsContent>
              </Tabs>
            </Card>
          </div>
          
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <ShoppingCart className="mr-2 h-5 w-5" />
                  {t('Pedido Atual')}
                </CardTitle>
                <CardDescription>
                  {orderItems.length === 0 
                    ? t('Nenhum item adicionado') 
                    : t('{{count}} itens no pedido', { count: orderItems.reduce((acc, item) => acc + item.quantity, 0) })}
                </CardDescription>
              </CardHeader>
              
              <CardContent>
                {orderItems.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    {t('Adicione itens do menu ao pedido')}
                  </div>
                ) : (
                  <div className="space-y-3">
                    {orderItems.map((item) => (
                      <div key={item.menuItem.id} className="flex justify-between items-center border-b pb-2">
                        <div>
                          <p className="font-medium">{item.menuItem.name}</p>
                          <p className="text-sm text-muted-foreground">
                            {formatPrice(item.menuItem.price)} x {item.quantity}
                          </p>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Button 
                            variant="outline" 
                            size="icon" 
                            className="h-7 w-7"
                            onClick={() => handleRemoveItem(item.menuItem)}
                          >
                            <Minus className="h-3 w-3" />
                          </Button>
                          <span className="w-5 text-center">{item.quantity}</span>
                          <Button 
                            variant="outline" 
                            size="icon" 
                            className="h-7 w-7"
                            onClick={() => handleAddItem(item.menuItem)}
                          >
                            <Plus className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
              
              <CardFooter className="flex-col items-stretch gap-4">
                <div className="flex justify-between font-bold text-lg">
                  <span>{t('Total:')}</span>
                  <span>{formatPrice(totalPrice)}</span>
                </div>
                
                <div className="space-y-2">
                  <Button className="w-full" disabled={orderItems.length === 0}>
                    <Check className="mr-2 h-4 w-4" />
                    {t('Finalizar Pedido')}
                  </Button>
                  
                  <Button 
                    variant="outline" 
                    className="w-full" 
                    onClick={() => setOrderItems([])}
                    disabled={orderItems.length === 0}
                  >
                    {t('Limpar Pedido')}
                  </Button>
                </div>
              </CardFooter>
            </Card>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};

export default POSMode;