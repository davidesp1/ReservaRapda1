import React from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { MENU_SECTIONS } from '@/constants';
import { useQuery } from '@tanstack/react-query';

interface MenuItem {
  id: number;
  categoryId: number;
  name: string;
  description: string;
  price: number;
  imageUrl: string;
  featured: boolean;
}

interface MenuCategory {
  id: number;
  name: string;
  description: string;
}

const Menu: React.FC = () => {
  const { t } = useTranslation();
  
  // In a real implementation, we would fetch from the API
  // But for the landing page, we'll use static data to match the design
  
  const menuItems = [
    // Entradas
    {
      id: 1,
      categoryId: 1,
      name: "Coxinha de Frango",
      description: "Tradicional salgado brasileiro recheado com frango desfiado",
      price: 350,
      imageUrl: "https://images.unsplash.com/photo-1617059063772-34532796cdb5?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&h=400",
      featured: true
    },
    {
      id: 2,
      categoryId: 1,
      name: "Pastéis (3 unidades)",
      description: "Pastéis fritos crocantes com recheio à escolha",
      price: 500,
      imageUrl: "",
      featured: true
    },
    {
      id: 3,
      categoryId: 1,
      name: "Bolinho de Bacalhau",
      description: "",
      price: 400,
      imageUrl: "",
      featured: false
    },
    {
      id: 4,
      categoryId: 1,
      name: "Pão de Queijo (6 unidades)",
      description: "",
      price: 450,
      imageUrl: "",
      featured: false
    },
    
    // Pratos Principais
    {
      id: 5,
      categoryId: 2,
      name: "Feijoada Completa",
      description: "Tradicional prato brasileiro com feijão preto, carnes variadas e acompanhamentos",
      price: 1850,
      imageUrl: "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&h=400",
      featured: true
    },
    {
      id: 6,
      categoryId: 2,
      name: "Picanha Grelhada",
      description: "Corte nobre brasileiro grelhado no ponto, acompanhado de farofa e vinagrete",
      price: 2200,
      imageUrl: "",
      featured: true
    },
    {
      id: 7,
      categoryId: 2,
      name: "Moqueca de Peixe",
      description: "",
      price: 1950,
      imageUrl: "",
      featured: false
    },
    {
      id: 8,
      categoryId: 2,
      name: "Escondidinho de Carne Seca",
      description: "",
      price: 1600,
      imageUrl: "",
      featured: false
    },
    
    // Sobremesas
    {
      id: 9,
      categoryId: 3,
      name: "Pudim de Leite",
      description: "",
      price: 550,
      imageUrl: "https://images.unsplash.com/photo-1551024506-0bccd828d307?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&h=400",
      featured: true
    },
    {
      id: 10,
      categoryId: 3,
      name: "Brigadeiro (3 unidades)",
      description: "",
      price: 400,
      imageUrl: "",
      featured: false
    },
    {
      id: 11,
      categoryId: 3,
      name: "Açaí na Tigela",
      description: "",
      price: 750,
      imageUrl: "",
      featured: true
    },
    {
      id: 12,
      categoryId: 3,
      name: "Quindim",
      description: "",
      price: 450,
      imageUrl: "",
      featured: false
    },
    
    // Bebidas
    {
      id: 13,
      categoryId: 4,
      name: "Caipirinha",
      description: "",
      price: 700,
      imageUrl: "https://images.unsplash.com/photo-1595981267035-7b04ca84a82d?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&h=400",
      featured: true
    },
    {
      id: 14,
      categoryId: 4,
      name: "Suco de Guaraná",
      description: "",
      price: 350,
      imageUrl: "",
      featured: false
    },
    {
      id: 15,
      categoryId: 4,
      name: "Água de Coco",
      description: "",
      price: 400,
      imageUrl: "",
      featured: false
    },
    {
      id: 16,
      categoryId: 4,
      name: "Cerveja Brasileira",
      description: "",
      price: 500,
      imageUrl: "",
      featured: true
    },
  ];
  
  const categories = [
    { id: 1, name: "Entradas", description: "" },
    { id: 2, name: "Pratos Principais", description: "" },
    { id: 3, name: "Sobremesas", description: "" },
    { id: 4, name: "Bebidas", description: "" },
  ];
  
  // Group menu items by category
  const menuByCategory = categories.map(category => {
    return {
      ...category,
      items: menuItems.filter(item => item.categoryId === category.id)
    };
  });

  // Format price to display as currency
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('pt-PT', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 2
    }).format(price / 100);
  };

  return (
    <section id="menu" className="py-20 bg-gray-50">
      <div className="container mx-auto px-6">
        <div className="text-center mb-16 animate-slide-up">
          <h2 className="text-4xl font-montserrat font-bold text-gray-800 mb-4">{t('SpecialMenu')}</h2>
          <p className="text-xl text-gray-600">{t('ExclusiveSelection')}</p>
          <div className="w-20 h-1 bg-brasil-yellow mx-auto mt-4"></div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {menuByCategory.map((category, index) => (
            <div 
              key={category.id} 
              className="bg-white rounded-xl shadow-md overflow-hidden transition-transform duration-300 hover:shadow-xl hover:-translate-y-2 animate-fade-in"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <div className="h-48 overflow-hidden">
                <img 
                  src={category.items[0]?.imageUrl || `https://images.unsplash.com/photo-1546069901-ba9599a7e63c?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&h=400`} 
                  alt={category.name} 
                  className="w-full h-full object-cover" 
                />
              </div>
              <div className="p-6">
                <h3 className="font-montserrat font-bold text-xl text-brasil-green mb-3">
                  {t(category.name === "Entradas" ? "Appetizers" : 
                     category.name === "Pratos Principais" ? "MainDishes" : 
                     category.name === "Sobremesas" ? "Desserts" : "Drinks")}
                </h3>
                <ul className="space-y-2 text-gray-700">
                  {category.items.slice(0, 4).map(item => (
                    <li key={item.id} className="flex justify-between">
                      <span>{item.name}</span>
                      <span className="font-semibold">{formatPrice(item.price)}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ))}
        </div>
        
        <div className="mt-12 text-center">
          <Button className="bg-brasil-green hover:bg-green-700 text-white font-bold py-3 px-8 rounded-lg transition-colors duration-300">
            {t('ViewFullMenu')}
          </Button>
        </div>
      </div>
    </section>
  );
};

export default Menu;
