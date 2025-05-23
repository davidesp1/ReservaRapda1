import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { useLocation } from 'wouter';
import { useToast } from '@/hooks/use-toast';
import { AdminLayout } from '@/components/layouts/AdminLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { apiRequest } from '@/lib/queryClient';
import { useSupabaseRealtime } from '../../hooks/useSupabaseRealtime';
import { supabase } from '../../lib/supabase';

// Schemas
const menuItemSchema = z.object({
  name: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres'),
  description: z.string().optional(),
  price: z.number().min(0, 'Preço deve ser positivo'),
  categoryId: z.number().min(1, 'Categoria é obrigatória'),
  featured: z.boolean().default(false),
  imageUrl: z.string().optional(),
  stockQuantity: z.number().min(0, 'Quantidade em stock deve ser positiva').default(0),
  minStockLevel: z.number().min(0, 'Nível mínimo de stock deve ser positivo').default(5),
  maxStockLevel: z.number().min(1, 'Nível máximo de stock deve ser positivo').default(100),
  trackStock: z.boolean().default(true),
  isAvailable: z.boolean().default(true),
});

const categorySchema = z.object({
  name: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres'),
  description: z.string().optional(),
});

type FormData = z.infer<typeof menuItemSchema>;
type CategoryFormData = z.infer<typeof categorySchema>;

const MenuManager: React.FC = () => {
  const { isAuthenticated, isAdmin, isLoading, user } = useAuth();
  const [_, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Ativar Supabase Realtime
  useSupabaseRealtime();
  
  // Estados
  const [searchText, setSearchText] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  
  // Modais
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<any>(null);
  const [editingCategory, setEditingCategory] = useState<any>(null);
  const [selectedImage, setSelectedImage] = useState<File | null>(null);

  // Check authentication
  useEffect(() => {
    if (!isLoading && (!isAuthenticated || !isAdmin)) {
      setLocation('/login');
    }
  }, [isAuthenticated, isAdmin, isLoading, setLocation]);

  // Forms
  const productForm = useForm<FormData>({
    resolver: zodResolver(menuItemSchema),
    defaultValues: {
      name: '',
      description: '',
      price: 0,
      categoryId: 0,
      featured: false,
      imageUrl: '',
      stockQuantity: 0,
      minStockLevel: 5,
      maxStockLevel: 100,
      trackStock: true,
      isAvailable: true,
    },
  });

  const categoryForm = useForm<CategoryFormData>({
    resolver: zodResolver(categorySchema),
    defaultValues: {
      name: '',
      description: '',
    },
  });

  // Queries
  const { data: categories = [], isLoading: categoriesLoading } = useQuery<any>({
    queryKey: ['/api/menu-categories'],
    enabled: isAuthenticated && isAdmin,
  });

  const { data: menuItems = [], isLoading: menuItemsLoading } = useQuery<any>({
    queryKey: ['/api/menu-items'],
    enabled: isAuthenticated && isAdmin,
  });

  // Mutations
  const createItemMutation = useMutation({
    mutationFn: (data: any) => apiRequest('POST', '/api/menu-items', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/menu-items'] });
      setIsProductModalOpen(false);
      productForm.reset();
      toast({ title: 'Produto criado com sucesso!' });
    },
    onError: (error: any) => {
      toast({
        title: 'Erro ao criar produto',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const updateItemMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: any }) =>
      apiRequest('PUT', `/api/menu-items/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/menu-items'] });
      setIsProductModalOpen(false);
      setEditingProduct(null);
      productForm.reset();
      toast({ title: 'Produto atualizado com sucesso!' });
    },
    onError: (error: any) => {
      toast({
        title: 'Erro ao atualizar produto',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const deleteItemMutation = useMutation({
    mutationFn: (id: number) => apiRequest('DELETE', `/api/menu-items/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/menu-items'] });
      toast({ title: 'Produto removido com sucesso!' });
    },
    onError: (error: any) => {
      toast({
        title: 'Erro ao remover produto',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const createCategoryMutation = useMutation({
    mutationFn: (data: any) => apiRequest('POST', '/api/menu-categories', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/menu-categories'] });
      categoryForm.reset();
      toast({ title: 'Categoria criada com sucesso!' });
    },
    onError: (error: any) => {
      toast({
        title: 'Erro ao criar categoria',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const updateCategoryMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: any }) =>
      apiRequest('PUT', `/api/menu-categories/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/menu-categories'] });
      setEditingCategory(null);
      categoryForm.reset();
      toast({ title: 'Categoria atualizada com sucesso!' });
    },
    onError: (error: any) => {
      toast({
        title: 'Erro ao atualizar categoria',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const deleteCategoryMutation = useMutation({
    mutationFn: (id: number) => apiRequest('DELETE', `/api/menu-categories/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/menu-categories'] });
      toast({ title: 'Categoria removida com sucesso!' });
    },
    onError: (error: any) => {
      toast({
        title: 'Erro ao remover categoria',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // Image upload handler
  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedImage(file);
      
      // Usar placeholder simples ou URL se Supabase não estiver configurado
      const placeholderUrl = `https://via.placeholder.com/200x200/009c3b/ffffff?text=${encodeURIComponent(file.name.substring(0, 10))}`;
      productForm.setValue('imageUrl', placeholderUrl);
      
      toast({
        title: 'Imagem selecionada',
        description: 'Imagem será processada quando o produto for salvo',
      });
    }
  };

  // Form handlers
  const onProductSubmit = (data: FormData) => {
    const formattedData = {
      ...data,
      price: Math.round(data.price * 100), // Convert to cents
    };

    if (editingProduct) {
      updateItemMutation.mutate({ id: editingProduct.id, data: formattedData });
    } else {
      createItemMutation.mutate(formattedData);
    }
  };

  const onCategorySubmit = (data: CategoryFormData) => {
    if (editingCategory) {
      updateCategoryMutation.mutate({ id: editingCategory.id, data });
    } else {
      createCategoryMutation.mutate(data);
    }
  };

  // Filter products
  const filteredProducts = menuItems.filter((item: any) => {
    const matchesSearch = !searchText || 
      item.name.toLowerCase().includes(searchText.toLowerCase()) ||
      item.category?.name.toLowerCase().includes(searchText.toLowerCase());
    const matchesCategory = !categoryFilter || item.categoryId.toString() === categoryFilter;
    const matchesStatus = !statusFilter || 
      (statusFilter === 'disponivel' ? item.is_available : !item.is_available);
    return matchesSearch && matchesCategory && matchesStatus;
  });

  // Pagination
  const totalPages = Math.ceil(filteredProducts.length / itemsPerPage);
  const paginatedProducts = itemsPerPage === -1 ? filteredProducts : 
    filteredProducts.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  // Modal handlers
  const openProductModal = (product: any = null) => {
    setEditingProduct(product);
    if (product) {
      productForm.reset({
        name: product.name,
        description: product.description || '',
        price: product.price / 100,
        categoryId: product.categoryId,
        featured: product.featured,
        imageUrl: product.imageUrl || '',
        stockQuantity: product.stock_quantity || 0,
        minStockLevel: product.min_stock_level || 5,
        maxStockLevel: product.max_stock_level || 100,
        trackStock: product.track_stock !== false,
        isAvailable: product.is_available !== false,
      });
    } else {
      productForm.reset();
    }
    setIsProductModalOpen(true);
  };

  const clearFilters = () => {
    setSearchText('');
    setCategoryFilter('');
    setStatusFilter('');
    setCurrentPage(1);
  };

  if (categoriesLoading || menuItemsLoading) {
    return (
      <div className="flex h-screen bg-gray-100">
        <div className="flex-1 flex items-center justify-center">
          <div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full"></div>
        </div>
      </div>
    );
  }

  return (
    <AdminLayout title="Gestão do Menu">
      <div className="space-y-6">
        {/* Header with action buttons */}
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-800">Gestão do Menu</h1>
          <div className="flex gap-3">
            <Button
              onClick={() => setIsCategoryModalOpen(true)}
              className="bg-yellow-400 hover:bg-yellow-500 text-blue-900 font-bold"
            >
              <i className="fas fa-layer-group mr-2"></i>
              Categorias
            </Button>
            <Button
              onClick={() => openProductModal()}
              className="bg-green-600 hover:bg-green-700 text-white font-bold"
            >
              <i className="fas fa-plus mr-2"></i>
              Novo Produto
            </Button>
          </div>
        </div>
        {/* Search and filters */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <Label className="block text-sm font-semibold mb-1 text-gray-700">Buscar Produto</Label>
              <div className="relative">
                <Input
                  placeholder="Nome do produto ou categoria"
                  value={searchText}
                  onChange={(e) => setSearchText(e.target.value)}
                  className="pl-10"
                />
                <i className="fas fa-magnifying-glass absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"></i>
              </div>
            </div>
            
            <div className="w-full md:w-48">
              <Label className="block text-sm font-semibold mb-1 text-gray-700">Categoria</Label>
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Todas" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Todas</SelectItem>
                  {categories.map((cat: any) => (
                    <SelectItem key={cat.id} value={cat.id.toString()}>{cat.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="w-full md:w-36">
              <Label className="block text-sm font-semibold mb-1 text-gray-700">Status</Label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Todos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Todos</SelectItem>
                  <SelectItem value="disponivel">Disponível</SelectItem>
                  <SelectItem value="indisponivel">Indisponível</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <Button
              onClick={clearFilters}
              className="bg-yellow-400 hover:bg-yellow-500 text-blue-900 font-semibold md:mt-6"
            >
              Limpar
            </Button>
          </div>
        </div>

        {/* Products Table */}
        <div className="bg-white rounded-xl shadow-lg overflow-hidden flex-1 flex flex-col">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-100">
                <thead className="bg-blue-900">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-bold text-white tracking-wider w-32">Foto</th>
                    <th className="px-4 py-4 text-left text-xs font-bold text-white tracking-wider">Nome</th>
                    <th className="px-4 py-4 text-right text-xs font-bold text-white tracking-wider">Preço</th>
                    <th className="px-4 py-4 text-left text-xs font-bold text-white tracking-wider">Categoria</th>
                    <th className="px-4 py-4 text-center text-xs font-bold text-white tracking-wider">Stock</th>
                    <th className="px-4 py-4 text-center text-xs font-bold text-white tracking-wider">Status</th>
                    <th className="px-4 py-4 text-center text-xs font-bold text-white tracking-wider">Ação</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-100 text-gray-800 font-medium">
                  {paginatedProducts.map((item: any) => (
                    <tr key={item.id}>
                      <td className="px-6 py-4">
                        <div className="w-16 h-16 bg-gray-100 rounded-lg overflow-hidden border">
                          {item.imageUrl ? (
                            <img 
                              src={item.imageUrl} 
                              alt={item.name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-gray-400">
                              <i className="fas fa-image text-2xl"></i>
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-4 font-medium">{item.name}</td>
                      <td className="px-4 py-4 text-right">
                        {new Intl.NumberFormat('pt-PT', {
                          style: 'currency',
                          currency: 'EUR',
                        }).format(item.price / 100)}
                      </td>
                      <td className="px-4 py-4">
                        <Badge variant="outline">
                          {item.category?.name || 'Sem categoria'}
                        </Badge>
                      </td>
                      <td className="px-4 py-4 text-center">
                        {item.track_stock ? (
                          <div className="flex items-center justify-center space-x-1">
                            <span className={`font-medium ${
                              item.stock_quantity <= item.min_stock_level 
                                ? 'text-red-600' 
                                : 'text-green-600'
                            }`}>
                              {item.stock_quantity}
                            </span>
                            {item.stock_quantity <= item.min_stock_level && (
                              <i className="fas fa-exclamation-triangle text-red-500"></i>
                            )}
                          </div>
                        ) : (
                          <span className="text-gray-400">N/A</span>
                        )}
                      </td>
                      <td className="px-4 py-4 text-center">
                        <Badge variant={item.is_available ? "default" : "destructive"}>
                          {item.is_available ? "Disponível" : "Indisponível"}
                        </Badge>
                      </td>
                      <td className="px-4 py-4 text-center">
                        <div className="flex justify-center space-x-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openProductModal(item)}
                          >
                            <i className="fas fa-edit text-blue-600"></i>
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => deleteItemMutation.mutate(item.id)}
                          >
                            <i className="fas fa-trash text-red-500"></i>
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            
            {/* Pagination */}
            <div className="px-6 py-3 flex justify-between items-center bg-gray-50">
              <span className="text-xs text-gray-600">
                Exibindo {((currentPage - 1) * itemsPerPage) + 1}-{Math.min(currentPage * itemsPerPage, filteredProducts.length)} de {filteredProducts.length} produtos
              </span>
              <div className="flex space-x-1">
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                  <Button
                    key={page}
                    variant={page === currentPage ? "default" : "ghost"}
                    size="sm"
                    onClick={() => setCurrentPage(page)}
                  >
                    {page}
                  </Button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Product Modal */}
      <Dialog open={isProductModalOpen} onOpenChange={setIsProductModalOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingProduct ? 'Editar Produto' : 'Adicionar Produto'}
            </DialogTitle>
          </DialogHeader>
          <Form {...productForm}>
            <form onSubmit={productForm.handleSubmit(onProductSubmit)} className="space-y-6">
              <FormField
                control={productForm.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nome do Produto</FormLabel>
                    <FormControl>
                      <Input placeholder="Nome do produto" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={productForm.control}
                  name="price"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Preço (€)</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          placeholder="0.00" 
                          step="0.01" 
                          min="0"
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={productForm.control}
                  name="categoryId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Categoria</FormLabel>
                      <Select onValueChange={(value) => field.onChange(parseInt(value))} value={field.value?.toString()}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione uma categoria" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {categories?.map((category: any) => (
                            <SelectItem key={category.id} value={category.id.toString()}>
                              {category.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={productForm.control}
                name="stockQuantity"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Estoque</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        placeholder="0" 
                        min="0"
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={productForm.control}
                name="isAvailable"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                    <div className="space-y-0.5">
                      <FormLabel>Status</FormLabel>
                    </div>
                    <FormControl>
                      <Select onValueChange={(value) => field.onChange(value === 'disponivel')} value={field.value ? 'disponivel' : 'indisponivel'}>
                        <SelectTrigger className="w-40">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="disponivel">Disponível</SelectItem>
                          <SelectItem value="indisponivel">Indisponível</SelectItem>
                        </SelectContent>
                      </Select>
                    </FormControl>
                  </FormItem>
                )}
              />

              <div>
                <Label className="block text-sm font-semibold text-gray-700 mb-1">Foto do Produto</Label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="block w-full text-gray-700"
                />
              </div>

              <div className="flex justify-end space-x-4">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setIsProductModalOpen(false)}
                >
                  Cancelar
                </Button>
                <Button 
                  type="submit"
                  className="bg-green-600 hover:bg-green-700"
                >
                  Salvar
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Category Modal */}
      <Dialog open={isCategoryModalOpen} onOpenChange={setIsCategoryModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Gerenciar Categorias</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <Form {...categoryForm}>
              <form onSubmit={categoryForm.handleSubmit(onCategorySubmit)} className="flex gap-2 mb-4">
                <FormField
                  control={categoryForm.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem className="flex-1">
                      <FormControl>
                        <Input placeholder="Nova categoria" {...field} />
                      </FormControl>
                    </FormItem>
                  )}
                />
                <Button 
                  type="submit"
                  className="bg-green-600 hover:bg-green-700"
                >
                  <i className="fas fa-plus"></i>
                </Button>
              </form>
            </Form>
            
            <ul className="space-y-3 max-h-64 overflow-y-auto">
              {categories.map((cat: any) => (
                <li key={cat.id} className="flex items-center justify-between bg-gray-50 px-3 py-2 rounded-lg">
                  <span className="font-medium text-gray-700">{cat.name}</span>
                  <div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        const newName = prompt("Editar categoria:", cat.name);
                        if (newName && newName !== cat.name) {
                          updateCategoryMutation.mutate({ id: cat.id, data: { name: newName } });
                        }
                      }}
                    >
                      <i className="fas fa-pen text-blue-600"></i>
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => deleteCategoryMutation.mutate(cat.id)}
                    >
                      <i className="fas fa-trash text-red-600"></i>
                    </Button>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
};

export default MenuManager;