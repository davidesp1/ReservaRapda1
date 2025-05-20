import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import { CustomerLayout } from '@/components/layouts/CustomerLayout';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, Plus, Star } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

// Define o tipo para um item do menu
interface MenuItem {
  id: number;
  name: string;
  description: string;
  price: number;
  image: string;
  categoryId: number;
  available: boolean;
  popular: boolean;
  vegetarian: boolean;
  glutenFree: boolean;
  spicyLevel: number;
}

// Define o tipo para uma categoria do menu
interface MenuCategory {
  id: number;
  name: string;
  description: string;
  image: string;
}

const MenuPage = () => {
  const { t, i18n } = useTranslation();
  const [activeCategory, setActiveCategory] = useState<string>('all');
  
  // Buscar categorias do menu
  const { data: categories, isLoading: categoriesLoading, error: categoriesError } = useQuery<MenuCategory[]>({
    queryKey: ['/api/menu-categories'],
  });
  
  // Buscar itens do menu
  const { data: items, isLoading: itemsLoading, error: itemsError } = useQuery<MenuItem[]>({
    queryKey: ['/api/menu-items'],
  });
  
  // Função para filtrar itens por categoria
  const getFilteredItems = () => {
    if (!items) return [];
    
    if (activeCategory === 'all') {
      return items;
    }
    
    const categoryId = parseInt(activeCategory);
    return items.filter(item => item.categoryId === categoryId);
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
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredItems.map(item => (
                <Card key={item.id} className="overflow-hidden hover:shadow-lg transition">
                  <div className="relative h-48">
                    <img 
                      src={item.image} 
                      alt={item.name} 
                      className="w-full h-full object-cover"
                    />
                    {item.popular && (
                      <Badge className="absolute top-2 right-2 bg-brasil-red">
                        {t('POPULAR')}
                      </Badge>
                    )}
                  </div>
                  
                  <CardHeader className="pb-2">
                    <div className="flex justify-between items-start">
                      <CardTitle className="text-xl font-montserrat">{item.name}</CardTitle>
                      <div className="text-xl font-bold text-brasil-blue">
                        €{(Number(item.price) / 100).toFixed(2)}
                      </div>
                    </div>
                    {(item.vegetarian || item.glutenFree) && (
                      <div className="flex gap-2 mt-1">
                        {item.vegetarian && (
                          <Badge variant="outline" className="text-green-600 border-green-600">
                            {t('Vegetarian')}
                          </Badge>
                        )}
                        {item.glutenFree && (
                          <Badge variant="outline" className="text-amber-600 border-amber-600">
                            {t('Glutenfree')}
                          </Badge>
                        )}
                      </div>
                    )}
                    {item.spicyLevel > 0 && (
                      <div className="mt-1">
                        <span className="text-sm text-gray-600 mr-2">{t('SpiceLevel')}:</span>
                        {renderSpicyLevel(item.spicyLevel)}
                      </div>
                    )}
                  </CardHeader>
                  
                  <CardContent>
                    <p className="text-gray-600 text-sm">{item.description}</p>
                  </CardContent>
                  
                  {/* Removido o botão de adicionar ao pedido */}
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
    </CustomerLayout>
  );
};

export default MenuPage;