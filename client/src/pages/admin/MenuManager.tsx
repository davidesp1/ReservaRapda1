import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useSupabaseRealtime } from '@/hooks/useSupabaseRealtime';
import { useLocation } from 'wouter';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import AdminLayout from '@/components/layouts/AdminLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useQuery, useMutation } from '@tanstack/react-query';
import { queryClient, apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { 
  Search, 
  PlusCircle, 
  Pencil, 
  Trash2, 
  Coffee, 
  Utensils, 
  IceCream, 
  Wine,
  Upload,
  Package,
  AlertTriangle,
  CheckCircle,
  XCircle,
  X
} from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Switch } from '@/components/ui/switch';

// Menu item form schema
const menuItemSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  description: z.string().optional(),
  price: z.coerce.number().min(0, 'Price must be a positive number'),
  categoryId: z.coerce.number().min(1, 'Category is required'),
  featured: z.boolean().default(false),
  imageUrl: z.string().optional(),
  stockQuantity: z.coerce.number().min(0, 'Stock quantity must be positive').default(0),
  minStockLevel: z.coerce.number().min(0, 'Min stock level must be positive').default(5),
  maxStockLevel: z.coerce.number().min(1, 'Max stock level must be positive').default(100),
  trackStock: z.boolean().default(true),
  isAvailable: z.boolean().default(true),
});

// Category form schema
const categorySchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  description: z.string().optional(),
});

const MenuManager: React.FC = () => {
  const { t } = useTranslation();
  const { isAuthenticated, isAdmin, isLoading } = useAuth();
  const [_, setLocation] = useLocation();
  const { toast } = useToast();
  
  // ✅ Ativar Supabase Realtime para atualizações automáticas de estoque em tempo real
  useSupabaseRealtime();
  const [searchText, setSearchText] = useState('');
  const [currentCategoryId, setCurrentCategoryId] = useState<string | null>(null);
  const [editItem, setEditItem] = useState<any | null>(null);
  const [editCategory, setEditCategory] = useState<any | null>(null);
  const [isItemModalOpen, setIsItemModalOpen] = useState(false);
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<{id: number, type: 'item' | 'category'} | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [viewImageModal, setViewImageModal] = useState<{isOpen: boolean, imageUrl: string, itemName: string} | null>(null);

  // Fetch menu categories - Supabase Realtime substitui refetchInterval
  const { data: categories, isLoading: categoriesLoading } = useQuery<any>({
    queryKey: ['/api/menu-categories'],
    enabled: isAuthenticated && isAdmin,
  });

  // Fetch menu items - Supabase Realtime substitui refetchInterval  
  const { data: menuItemsData, isLoading: menuItemsLoading } = useQuery<any>({
    queryKey: ['/api/menu-items'],
    enabled: isAuthenticated && isAdmin,
  });
  
  // Transformar os dados agrupados por categoria em um array plano de itens
  const menuItems = React.useMemo(() => {
    if (!menuItemsData || !Array.isArray(menuItemsData)) return [];
    
    // Extrair todos os itens do formato agrupado por categoria
    const allItems: any[] = [];
    menuItemsData.forEach((categoryData: any) => {
      if (categoryData.items && Array.isArray(categoryData.items)) {
        categoryData.items.forEach((item: any) => {
          allItems.push({
            ...item,
            categoryId: item.category_id,
            category: categoryData.category
          });
        });
      }
    });
    
    return allItems;
  }, [menuItemsData]);

  // Setup forms
  const itemForm = useForm<z.infer<typeof menuItemSchema>>({
    resolver: zodResolver(menuItemSchema),
    defaultValues: {
      name: '',
      description: '',
      price: 0,
      categoryId: undefined, // inicialmente indefinido para evitar problemas com o Select
      featured: false,
      imageUrl: '',
    },
  });

  const categoryForm = useForm<z.infer<typeof categorySchema>>({
    resolver: zodResolver(categorySchema),
    defaultValues: {
      name: '',
      description: '',
    },
  });

  // Reset form when modal opens/closes
  useEffect(() => {
    if (isItemModalOpen && editItem) {
      itemForm.reset({
        name: editItem.name,
        description: editItem.description || '',
        price: editItem.price / 100,
        categoryId: editItem.categoryId,
        featured: editItem.featured,
        imageUrl: editItem.imageUrl || '',
        stockQuantity: editItem.stock_quantity || 0,
        minStockLevel: editItem.min_stock_level || 5,
        maxStockLevel: editItem.max_stock_level || 100,
        trackStock: editItem.track_stock !== false,
        isAvailable: editItem.is_available !== false,
      });
    } else if (isItemModalOpen && !editItem) {
      itemForm.reset({
        name: '',
        description: '',
        price: 0,
        categoryId: currentCategoryId ? parseInt(currentCategoryId) : undefined,
        featured: false,
        imageUrl: '',
        stockQuantity: 0,
        minStockLevel: 5,
        maxStockLevel: 100,
        trackStock: true,
        isAvailable: true,
      });
    }
  }, [isItemModalOpen, editItem, currentCategoryId, itemForm]);

  useEffect(() => {
    if (isCategoryModalOpen && editCategory) {
      categoryForm.reset({
        name: editCategory.name,
        description: editCategory.description || '',
      });
    } else if (isCategoryModalOpen && !editCategory) {
      categoryForm.reset({
        name: '',
        description: '',
      });
    }
  }, [isCategoryModalOpen, editCategory, categoryForm]);

  // Filter menu items based on search and category
  const filteredMenuItems = React.useMemo(() => {
    if (!menuItems || !Array.isArray(menuItems)) return [];
    
    return menuItems.filter((item: any) => {
      const searchLower = searchText.toLowerCase();
      const matchesSearch = 
        (item.name && item.name.toLowerCase().includes(searchLower)) ||
        (item.description && item.description.toLowerCase().includes(searchLower));
      
      const matchesCategory = currentCategoryId === null || currentCategoryId === "all" || 
        item.categoryId.toString() === currentCategoryId;
      
      return matchesSearch && matchesCategory;
    });
  }, [menuItems, searchText, currentCategoryId]);

  // Create menu item mutation
  const createItemMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest('POST', '/api/menu-items', data);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: t('ItemCreated'),
        description: t('ItemCreatedMessage'),
      });
      queryClient.invalidateQueries({ queryKey: ['/api/menu-items'] });
      setIsItemModalOpen(false);
    },
    onError: (error: any) => {
      toast({
        title: t('ItemCreateError'),
        description: error.message || t('ItemCreateErrorMessage'),
        variant: 'destructive',
      });
    }
  });

  // Update menu item mutation
  const updateItemMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number, data: any }) => {
      const response = await apiRequest('PUT', `/api/menu-items/${id}`, data);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: t('ItemUpdated'),
        description: t('ItemUpdatedMessage'),
      });
      queryClient.invalidateQueries({ queryKey: ['/api/menu-items'] });
      setIsItemModalOpen(false);
      setEditItem(null);
    },
    onError: (error: any) => {
      toast({
        title: t('ItemUpdateError'),
        description: error.message || t('ItemUpdateErrorMessage'),
        variant: 'destructive',
      });
    }
  });

  // Delete menu item mutation
  const deleteItemMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await apiRequest('DELETE', `/api/menu-items/${id}`, {});
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: t('ItemDeleted'),
        description: t('ItemDeletedMessage'),
      });
      queryClient.invalidateQueries({ queryKey: ['/api/menu-items'] });
      setIsDeleteModalOpen(false);
      setItemToDelete(null);
    },
    onError: (error: any) => {
      toast({
        title: t('ItemDeleteError'),
        description: error.message || t('ItemDeleteErrorMessage'),
        variant: 'destructive',
      });
    }
  });

  // Create category mutation
  const createCategoryMutation = useMutation({
    mutationFn: async (data: z.infer<typeof categorySchema>) => {
      // Garantir que os dados estão no formato correto
      const categoryData = {
        name: data.name,
        description: data.description || ""
      };
      const response = await apiRequest('POST', '/api/menu-categories', categoryData);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: t('CategoryCreated'),
        description: t('CategoryCreatedMessage'),
      });
      queryClient.invalidateQueries({ queryKey: ['/api/menu-categories'] });
      setIsCategoryModalOpen(false);
    },
    onError: (error: any) => {
      toast({
        title: t('CategoryCreateError'),
        description: error.message || t('CategoryCreateErrorMessage'),
        variant: 'destructive',
      });
    }
  });

  // Update category mutation
  const updateCategoryMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number, data: z.infer<typeof categorySchema> }) => {
      // Garantir que os dados estão no formato correto
      const categoryData = {
        name: data.name,
        description: data.description || ""
      };
      const response = await apiRequest('PUT', `/api/menu-categories/${id}`, categoryData);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: t('CategoryUpdated'),
        description: t('CategoryUpdatedMessage'),
      });
      queryClient.invalidateQueries({ queryKey: ['/api/menu-categories'] });
      setIsCategoryModalOpen(false);
      setEditCategory(null);
    },
    onError: (error: any) => {
      toast({
        title: t('CategoryUpdateError'),
        description: error.message || t('CategoryUpdateErrorMessage'),
        variant: 'destructive',
      });
    }
  });

  // Delete category mutation
  const deleteCategoryMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await apiRequest('DELETE', `/api/menu-categories/${id}`, {});
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: t('CategoryDeleted'),
        description: t('CategoryDeletedMessage'),
      });
      queryClient.invalidateQueries({ queryKey: ['/api/menu-categories'] });
      setIsDeleteModalOpen(false);
      setItemToDelete(null);
    },
    onError: (error: any) => {
      toast({
        title: t('CategoryDeleteError'),
        description: error.message || t('CategoryDeleteErrorMessage'),
        variant: 'destructive',
      });
    }
  });

  // Upload de imagem - modo simplificado sem criação automática de bucket
  const uploadImageMutation = useMutation({
    mutationFn: async (file: File) => {
      const supabase = (await import('@/lib/supabase')).supabase;
      
      if (!supabase) {
        // Modo placeholder - gerar URL fake para demonstração
        const fakeUrl = `https://via.placeholder.com/300x200/ff6b6b/ffffff?text=${encodeURIComponent(file.name)}`;
        return {
          success: true,
          url: fakeUrl,
          path: `placeholder/${file.name}`
        };
      }
      
      // Gerar nome único para o arquivo
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
      const filePath = `menu-items/${fileName}`;
      
      // Tentar upload direto (assumindo que o bucket 'restaurant-images' já existe)
      const { data, error } = await supabase.storage
        .from('restaurant-images')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        });
      
      if (error) {
        console.warn('Erro no Supabase Storage:', error.message);
        // Fallback para modo placeholder
        const placeholderUrl = `https://via.placeholder.com/300x200/4ecdc4/ffffff?text=${encodeURIComponent(file.name.split('.')[0])}`;
        return {
          success: true,
          url: placeholderUrl,
          path: `placeholder/${file.name}`,
          note: 'Modo placeholder ativo - bucket não encontrado'
        };
      }
      
      // Obter URL pública da imagem
      const { data: urlData } = supabase.storage
        .from('restaurant-images')
        .getPublicUrl(filePath);
      
      return {
        success: true,
        url: urlData.publicUrl,
        path: filePath
      };
    },
    onSuccess: (data) => {
      if (data.url) {
        itemForm.setValue('imageUrl', data.url);
        toast({
          title: 'Upload realizado',
          description: data.note || 'Imagem enviada com sucesso!',
        });
      }
      setSelectedImage(null);
    },
    onError: (error: any) => {
      console.error('Erro no upload:', error);
      toast({
        title: 'Erro no upload',
        description: error.message || 'Erro ao fazer upload da imagem',
        variant: 'destructive',
      });
      setSelectedImage(null);
    }
  });

  // Handle image upload
  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedImage(file);
      setUploadingImage(true);
      uploadImageMutation.mutate(file, {
        onSettled: () => setUploadingImage(false)
      });
    }
  };

  // Handle menu item form submission
  const onItemSubmit = (data: z.infer<typeof menuItemSchema>) => {
    // Garantir que o preço não seja multiplicado por 100 aqui
    // O backend já faz a conversão correta
    const formattedData = {
      ...data,
      price: Number(data.price) // Garantir que é um número, sem conversão adicional
    };
    
    console.log('Enviando dados do formulário:', formattedData);
    
    if (editItem) {
      updateItemMutation.mutate({ id: editItem.id, data: formattedData });
    } else {
      createItemMutation.mutate(formattedData);
    }
  };

  // Handle category form submission
  const onCategorySubmit = (data: z.infer<typeof categorySchema>) => {
    if (editCategory) {
      updateCategoryMutation.mutate({ id: editCategory.id, data });
    } else {
      createCategoryMutation.mutate(data);
    }
  };

  // Handle menu item deletion
  const handleDeleteConfirm = () => {
    if (!itemToDelete) return;
    
    if (itemToDelete.type === 'item') {
      deleteItemMutation.mutate(itemToDelete.id);
    } else {
      deleteCategoryMutation.mutate(itemToDelete.id);
    }
  };

  // Format price to display as currency
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('pt-PT', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 2
    }).format(price / 100);
  };

  // Get category icon
  const getCategoryIcon = (categoryId: number) => {
    const category = categories?.find((cat: any) => cat.id === categoryId);
    if (!category) return <Utensils />;

    const name = category.name.toLowerCase();
    if (name.includes('entrada')) return <Coffee />;
    if (name.includes('prato') || name.includes('principal')) return <Utensils />;
    if (name.includes('sobremesa')) return <IceCream />;
    if (name.includes('bebida')) return <Wine />;
    return <Utensils />;
  };

  if (categoriesLoading || menuItemsLoading) {
    return (
      <AdminLayout title={t('MenuManagement')}>
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          <div className="h-12 bg-gray-200 rounded"></div>
          <div className="h-96 bg-gray-200 rounded"></div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title={t('MenuManagement')}>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-montserrat font-bold">{t('MenuManagement')}</h1>
      </div>

      <Tabs defaultValue="items" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="items">{t('MenuItems')}</TabsTrigger>
          <TabsTrigger value="categories">{t('Categories')}</TabsTrigger>
        </TabsList>

        <TabsContent value="items">
          <Card>
            <CardHeader>
              <CardTitle>{t('ManageMenuItems')}</CardTitle>
              <CardDescription>{t('AddEditRemoveMenuItems')}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col md:flex-row gap-4 mb-6">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <Input
                    placeholder={t('SearchMenuItems')}
                    className="pl-10"
                    value={searchText}
                    onChange={(e) => setSearchText(e.target.value)}
                  />
                </div>
                <Select
                  value={currentCategoryId || ''}
                  onValueChange={(value) => setCurrentCategoryId(value)}
                >
                  <SelectTrigger className="md:w-[200px]">
                    <SelectValue placeholder={t('AllCategories')} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{t('AllCategories')}</SelectItem>
                    {categories?.map((category: any) => (
                      <SelectItem key={category.id} value={category.id.toString()}>
                        {category.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button 
                  className="bg-brasil-green text-white"
                  onClick={() => {
                    setEditItem(null);
                    setIsItemModalOpen(true);
                  }}
                >
                  <PlusCircle className="mr-2 h-4 w-4" /> {t('AddMenuItem')}
                </Button>
              </div>

              <div className="border rounded-md">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{t('Name')}</TableHead>
                      <TableHead className="hidden sm:table-cell">{t('Description')}</TableHead>
                      <TableHead>{t('Price')}</TableHead>
                      <TableHead className="hidden md:table-cell">{t('Category')}</TableHead>
                      <TableHead className="hidden lg:table-cell">Stock</TableHead>
                      <TableHead className="hidden sm:table-cell">{t('Featured')}</TableHead>
                      <TableHead className="text-right">{t('Actions')}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredMenuItems.length > 0 ? (
                      filteredMenuItems.map((item: any) => {
                        const category = categories?.find((cat: any) => cat.id === item.categoryId);
                        return (
                          <TableRow key={item.id}>
                            <TableCell className="font-medium">
                              <div className="flex flex-col">
                                <div className="flex items-center">
                                  <span className="mr-2">
                                    {getCategoryIcon(item.categoryId)}
                                  </span>
                                  {item.name}
                                </div>
                                <div className="text-xs text-gray-500 sm:hidden mt-1">
                                  {item.description && item.description.length > 30 
                                    ? `${item.description.substring(0, 30)}...` 
                                    : item.description || '-'}
                                </div>
                                <div className="text-xs text-gray-500 md:hidden mt-1">
                                  {category?.name || '-'}
                                </div>
                              </div>
                            </TableCell>
                            <TableCell className="hidden sm:table-cell max-w-xs truncate">
                              {item.description || '-'}
                            </TableCell>
                            <TableCell className="font-mono">{formatPrice(item.price)}</TableCell>
                            <TableCell className="hidden md:table-cell">{category?.name || '-'}</TableCell>
                            <TableCell className="hidden lg:table-cell">
                              {item.track_stock ? (
                                <div className="flex flex-col space-y-1">
                                  <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                                    (item.stock_quantity || 0) <= (item.min_stock_level || 5) 
                                      ? 'bg-red-100 text-red-800' 
                                      : (item.stock_quantity || 0) > (item.max_stock_level || 100) * 0.8 
                                      ? 'bg-green-100 text-green-800' 
                                      : 'bg-yellow-100 text-yellow-800'
                                  }`}>
                                    {item.stock_quantity || 0}
                                  </span>
                                  <div className="text-xs text-gray-500">
                                    {item.min_stock_level || 5}-{item.max_stock_level || 100}
                                  </div>
                                </div>
                              ) : (
                                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
                                  N/A
                                </span>
                              )}
                            </TableCell>
                            <TableCell className="hidden sm:table-cell">
                              <div className="flex flex-col space-y-1">
                                {item.featured && (
                                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                                    ⭐ {t('Featured')}
                                  </span>
                                )}
                                {!item.is_available && (
                                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                                    Indisponível
                                  </span>
                                )}
                                {!item.featured && item.is_available && (
                                  <span className="text-gray-400">-</span>
                                )}
                              </div>
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex justify-end space-x-2">
                                <Button 
                                  variant="ghost" 
                                  size="icon" 
                                  onClick={() => {
                                    setEditItem(item);
                                    setIsItemModalOpen(true);
                                  }}
                                >
                                  <Pencil className="h-4 w-4" />
                                </Button>
                                <Button 
                                  variant="ghost" 
                                  size="icon"
                                  onClick={() => {
                                    setItemToDelete({ id: item.id, type: 'item' });
                                    setIsDeleteModalOpen(true);
                                  }}
                                >
                                  <Trash2 className="h-4 w-4 text-red-500" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        )
                      })
                    ) : (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-6 text-gray-500">
                          {searchText ? t('NoMenuItemsFound') : t('NoMenuItems')}
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="categories">
          <Card>
            <CardHeader>
              <CardTitle>{t('ManageCategories')}</CardTitle>
              <CardDescription>{t('AddEditRemoveCategories')}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex justify-end mb-6">
                <Button 
                  className="bg-brasil-green text-white"
                  onClick={() => {
                    setEditCategory(null);
                    setIsCategoryModalOpen(true);
                  }}
                >
                  <PlusCircle className="mr-2 h-4 w-4" /> {t('AddCategory')}
                </Button>
              </div>

              <div className="border rounded-md">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{t('Name')}</TableHead>
                      <TableHead>{t('Description')}</TableHead>
                      <TableHead>{t('ItemCount')}</TableHead>
                      <TableHead className="text-right">{t('Actions')}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {categories && categories.length > 0 ? (
                      categories.map((category: any) => {
                        const itemCount = menuItems?.filter((item: any) => item.categoryId === category.id).length || 0;
                        return (
                          <TableRow key={category.id}>
                            <TableCell className="font-medium">{category.name}</TableCell>
                            <TableCell className="max-w-xs truncate">
                              {category.description || '-'}
                            </TableCell>
                            <TableCell>{itemCount}</TableCell>
                            <TableCell className="text-right">
                              <div className="flex justify-end space-x-2">
                                <Button 
                                  variant="ghost" 
                                  size="icon"
                                  onClick={() => {
                                    setEditCategory(category);
                                    setIsCategoryModalOpen(true);
                                  }}
                                >
                                  <Pencil className="h-4 w-4" />
                                </Button>
                                <Button 
                                  variant="ghost" 
                                  size="icon"
                                  onClick={() => {
                                    setItemToDelete({ id: category.id, type: 'category' });
                                    setIsDeleteModalOpen(true);
                                  }}
                                  disabled={itemCount > 0}
                                >
                                  <Trash2 className="h-4 w-4 text-red-500" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        )
                      })
                    ) : (
                      <TableRow>
                        <TableCell colSpan={4} className="text-center py-6 text-gray-500">
                          {t('NoCategories')}
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Menu Item Modal */}
      <Dialog open={isItemModalOpen} onOpenChange={setIsItemModalOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editItem ? t('EditMenuItem') : t('AddMenuItem')}
            </DialogTitle>
            <DialogDescription>
              {editItem ? t('EditMenuItemDescription') : t('AddMenuItemDescription')}
            </DialogDescription>
          </DialogHeader>
          
          <Form {...itemForm}>
            <form onSubmit={itemForm.handleSubmit(onItemSubmit)} className="space-y-6 py-4">
              <FormField
                control={itemForm.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('Name')}</FormLabel>
                    <FormControl>
                      <Input placeholder={t('ItemName')} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              {/* Campo de Imagem - substituindo descrição */}
              <FormField
                control={itemForm.control}
                name="imageUrl"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('Image')}</FormLabel>
                    <FormControl>
                      <div className="space-y-2">
                        {/* Preview da imagem atual */}
                        {field.value && (
                          <div className="w-32 h-32 bg-gray-100 rounded-lg overflow-hidden border-2 border-gray-200">
                            <img 
                              src={field.value} 
                              alt="Preview"
                              className="w-full h-full object-cover"
                            />
                          </div>
                        )}
                        
                        {/* Upload de nova imagem */}
                        <div className="border-2 border-dashed border-gray-300 rounded-lg p-4">
                          {selectedImage ? (
                            <div className="space-y-2">
                              <div className="flex items-center justify-between">
                                <span className="text-sm text-gray-600">{selectedImage.name}</span>
                                <Button 
                                  type="button" 
                                  variant="ghost" 
                                  size="sm"
                                  onClick={() => setSelectedImage(null)}
                                >
                                  <XCircle className="h-4 w-4" />
                                </Button>
                              </div>
                              <img 
                                src={URL.createObjectURL(selectedImage)} 
                                alt="Preview" 
                                className="w-full h-24 object-cover rounded"
                              />
                            </div>
                          ) : (
                            <label className="cursor-pointer block">
                              <input
                                type="file"
                                accept="image/*"
                                className="hidden"
                                onChange={handleImageUpload}
                              />
                              <div className="text-center">
                                <Upload className="h-6 w-6 mx-auto text-gray-400 mb-2" />
                                <p className="text-sm text-gray-600">{t('ClickToUploadImage')}</p>
                              </div>
                            </label>
                          )}
                        </div>
                        
                        {/* Campo oculto para URL da imagem */}
                        <Input type="hidden" {...field} />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={itemForm.control}
                  name="price"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('Price')} (€)</FormLabel>
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
                  control={itemForm.control}
                  name="categoryId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('Category')}</FormLabel>
                      <Select 
                        onValueChange={(value) => {
                          // Convert string to number if it's not empty and not "select"
                          if (value && value !== "select") {
                            field.onChange(parseInt(value));
                          } else {
                            // Set to undefined if "select" is chosen
                            field.onChange(undefined);
                          }
                        }} 
                        value={field.value ? field.value.toString() : "select"}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder={t('SelectCategory')} />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="select">{t('SelectCategory')}</SelectItem>
                          {categories?.map((category: any) => (
                            <SelectItem 
                              key={category.id} 
                              value={category.id.toString()}
                            >
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
                control={itemForm.control}
                name="imageUrl"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('ImageURL')}</FormLabel>
                    <div className="flex gap-2">
                      <FormControl>
                        <Input 
                          placeholder={t('EnterImageURL')} 
                          {...field} 
                          value={field.value || ''}
                        />
                      </FormControl>
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        onClick={() => document.getElementById('image-upload')?.click()}
                        disabled={uploadingImage}
                      >
                        <Upload className="h-4 w-4" />
                      </Button>
                    </div>
                    <input
                      id="image-upload"
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleImageUpload}
                    />
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Seção de Gestão de Stock */}
              <div className="border rounded-lg p-4 space-y-4">
                <div className="flex items-center gap-2">
                  <Package className="h-5 w-5 text-blue-600" />
                  <h3 className="font-semibold">Gestão de Stock</h3>
                </div>
                
                <FormField
                  control={itemForm.control}
                  name="trackStock"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                      <div className="space-y-0.5">
                        <FormLabel>Controlar Stock</FormLabel>
                        <FormDescription>
                          Ativar controlo de stock para este item
                        </FormDescription>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />

                {itemForm.watch('trackStock') && (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <FormField
                      control={itemForm.control}
                      name="stockQuantity"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Quantidade em Stock</FormLabel>
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
                      control={itemForm.control}
                      name="minStockLevel"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Stock Mínimo</FormLabel>
                          <FormControl>
                            <Input 
                              type="number" 
                              placeholder="5" 
                              min="0"
                              {...field} 
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={itemForm.control}
                      name="maxStockLevel"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Stock Máximo</FormLabel>
                          <FormControl>
                            <Input 
                              type="number" 
                              placeholder="100" 
                              min="1"
                              {...field} 
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                )}
              </div>
              
              <FormField
                control={itemForm.control}
                name="isAvailable"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                    <div className="space-y-0.5">
                      <FormLabel>Disponível</FormLabel>
                      <FormDescription>
                        Item disponível para venda
                      </FormDescription>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
              
              <FormField
                control={itemForm.control}
                name="featured"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                    <div className="space-y-0.5">
                      <FormLabel>{t('Featured')}</FormLabel>
                      <FormDescription>
                        {t('FeaturedItemsDescription')}
                      </FormDescription>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
              
              <DialogFooter className="flex flex-col sm:flex-row gap-2 pt-6">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setIsItemModalOpen(false)}
                  className="w-full sm:w-auto"
                >
                  {t('Cancel')}
                </Button>
                <Button 
                  type="submit"
                  disabled={createItemMutation.isPending || updateItemMutation.isPending}
                  className="w-full sm:w-auto bg-brasil-green hover:bg-brasil-green/90"
                >
                  {(createItemMutation.isPending || updateItemMutation.isPending) ? (
                    <span className="flex items-center justify-center">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      {t('Saving')}
                    </span>
                  ) : (
                    editItem ? t('SaveChanges') : t('AddItem')
                  )}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
      
      {/* Category Modal */}
      <Dialog open={isCategoryModalOpen} onOpenChange={setIsCategoryModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editCategory ? t('EditCategory') : t('AddCategory')}
            </DialogTitle>
            <DialogDescription>
              {editCategory ? t('EditCategoryDescription') : t('AddCategoryDescription')}
            </DialogDescription>
          </DialogHeader>
          
          <Form {...categoryForm}>
            <form onSubmit={categoryForm.handleSubmit(onCategorySubmit)} className="space-y-4">
              <FormField
                control={categoryForm.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('Name')}</FormLabel>
                    <FormControl>
                      <Input placeholder={t('CategoryName')} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={categoryForm.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('Description')}</FormLabel>
                    <FormControl>
                      <Input placeholder={t('CategoryDescription')} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <DialogFooter>
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setIsCategoryModalOpen(false)}
                >
                  {t('Cancel')}
                </Button>
                <Button 
                  type="submit"
                  disabled={createCategoryMutation.isPending || updateCategoryMutation.isPending}
                >
                  {(createCategoryMutation.isPending || updateCategoryMutation.isPending) ? (
                    <span className="flex items-center">
                      <i className="fas fa-spinner fa-spin mr-2"></i> {t('Saving')}
                    </span>
                  ) : (
                    editCategory ? t('SaveChanges') : t('AddCategory')
                  )}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
      
      {/* Delete Confirmation Modal */}
      <Dialog open={isDeleteModalOpen} onOpenChange={setIsDeleteModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {t('ConfirmDelete')}
            </DialogTitle>
            <DialogDescription>
              {itemToDelete?.type === 'item'
                ? t('DeleteItemConfirmation')
                : t('DeleteCategoryConfirmation')
              }
            </DialogDescription>
          </DialogHeader>
          
          <DialogFooter>
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => setIsDeleteModalOpen(false)}
            >
              {t('Cancel')}
            </Button>
            <Button 
              type="button"
              variant="destructive"
              onClick={handleDeleteConfirm}
              disabled={deleteItemMutation.isPending || deleteCategoryMutation.isPending}
            >
              {(deleteItemMutation.isPending || deleteCategoryMutation.isPending) ? (
                <span className="flex items-center">
                  <i className="fas fa-spinner fa-spin mr-2"></i> {t('Deleting')}
                </span>
              ) : (
                t('Delete')
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
};

export default MenuManager;
