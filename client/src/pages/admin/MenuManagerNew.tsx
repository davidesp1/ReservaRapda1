import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/hooks/useAuth';
import { useLocation } from 'wouter';
import { useToast } from '@/hooks/use-toast';
import { AdminLayout } from '@/components/layouts/AdminLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
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
  X,
  Eye,
  LayersIcon
} from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { apiRequest } from '@/lib/queryClient';
import { useSupabaseRealtime } from '@/hooks/useSupabaseRealtime';

// Menu item form schema
const menuItemSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  description: z.string().optional(),
  price: z.number().min(0, 'Price must be positive'),
  categoryId: z.number().min(1, 'Category is required'),
  featured: z.boolean().default(false),
  imageUrl: z.string().optional(),
  stockQuantity: z.number().min(0, 'Stock quantity must be positive').default(0),
  minStockLevel: z.number().min(0, 'Min stock level must be positive').default(5),
  maxStockLevel: z.number().min(1, 'Max stock level must be positive').default(100),
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
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [viewImageModal, setViewImageModal] = useState<{isOpen: boolean, imageUrl: string, itemName: string} | null>(null);

  // Query client for cache invalidation
  const queryClient = useQueryClient();

  // Check authentication
  useEffect(() => {
    if (!isLoading && (!isAuthenticated || !isAdmin)) {
      setLocation('/login');
    }
  }, [isAuthenticated, isAdmin, isLoading, setLocation]);

  // Form initialization
  const itemForm = useForm<z.infer<typeof menuItemSchema>>({
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

  // Fetch menu categories - Supabase Realtime substitui refetchInterval
  const { data: categories, isLoading: categoriesLoading } = useQuery<any>({
    queryKey: ['/api/menu-categories'],
    enabled: isAuthenticated && isAdmin,
  });

  // Fetch menu items - Supabase Realtime substitui refetchInterval
  const { data: menuItems, isLoading: menuItemsLoading } = useQuery<any>({
    queryKey: ['/api/menu-items'],
    enabled: isAuthenticated && isAdmin,
  });

  // Simple image upload handler (placeholder mode)
  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedImage(file);
      // For now, just set a placeholder URL
      const placeholderUrl = `https://via.placeholder.com/200x200/009c3b/ffffff?text=${encodeURIComponent(file.name.substring(0, 10))}`;
      itemForm.setValue('imageUrl', placeholderUrl);
      toast({
        title: 'Imagem selecionada',
        description: 'Imagem será processada quando o item for salvo (modo placeholder ativo)',
      });
    }
  };

  // Handle menu item form submission
  const onItemSubmit = (data: z.infer<typeof menuItemSchema>) => {
    const formattedData = {
      ...data,
      price: Math.round(data.price * 100), // Convert to cents for backend
    };

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

  // Handle delete confirmation
  const handleDeleteConfirm = () => {
    if (itemToDelete) {
      if (itemToDelete.type === 'item') {
        deleteItemMutation.mutate(itemToDelete.id);
      } else {
        deleteCategoryMutation.mutate(itemToDelete.id);
      }
    }
  };

  // Show loading state
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
    <AdminLayout title="Gestão do Menu">
      <div className="space-y-6">
        {/* Header with action buttons */}
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-800">Gestão do Menu</h1>
          <div className="flex gap-3">
            <Button
              onClick={() => setIsCategoryModalOpen(true)}
              className="bg-yellow-500 hover:bg-yellow-600 text-blue-900 font-bold"
            >
              <LayersIcon className="h-4 w-4 mr-2" />
              Categorias
            </Button>
            <Button
              onClick={() => {
                setEditItem(null);
                setIsItemModalOpen(true);
              }}
              className="bg-green-600 hover:bg-green-700"
            >
              <PlusCircle className="h-4 w-4 mr-2" />
              Novo Produto
            </Button>
          </div>
        </div>

        {/* Search and filters */}
        <Card>
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <Label htmlFor="search">Buscar Produto</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    id="search"
                    placeholder="Nome do produto ou categoria"
                    value={searchText}
                    onChange={(e) => setSearchText(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <div className="w-full md:w-48">
                <Label htmlFor="category-filter">Categoria</Label>
                <Select value={currentCategoryId || ''} onValueChange={setCurrentCategoryId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Todas as categorias" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Todas</SelectItem>
                    {categories?.map((category: any) => (
                      <SelectItem key={category.id} value={category.id.toString()}>
                        {category.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Button 
                variant="outline"
                onClick={() => {
                  setSearchText('');
                  setCurrentCategoryId(null);
                }}
                className="md:mt-6"
              >
                Limpar
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Products table */}
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-blue-900">
                    <TableHead className="text-white font-bold w-32">Foto</TableHead>
                    <TableHead className="text-white font-bold">Nome</TableHead>
                    <TableHead className="text-white font-bold text-right">Preço</TableHead>
                    <TableHead className="text-white font-bold">Categoria</TableHead>
                    <TableHead className="text-white font-bold text-center">Stock</TableHead>
                    <TableHead className="text-white font-bold text-center">Status</TableHead>
                    <TableHead className="text-white font-bold text-center">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {menuItems
                    ?.filter((item: any) => {
                      const matchesSearch = !searchText || 
                        item.name.toLowerCase().includes(searchText.toLowerCase()) ||
                        item.category?.name.toLowerCase().includes(searchText.toLowerCase());
                      const matchesCategory = !currentCategoryId || 
                        item.categoryId.toString() === currentCategoryId;
                      return matchesSearch && matchesCategory;
                    })
                    ?.map((item: any) => (
                      <TableRow key={item.id}>
                        <TableCell>
                          <div className="w-16 h-16 bg-gray-100 rounded-lg overflow-hidden border">
                            {item.imageUrl ? (
                              <img 
                                src={item.imageUrl} 
                                alt={item.name}
                                className="w-full h-full object-cover cursor-pointer"
                                onClick={() => setViewImageModal({
                                  isOpen: true,
                                  imageUrl: item.imageUrl,
                                  itemName: item.name
                                })}
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-gray-400">
                                <Package className="h-6 w-6" />
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="font-medium">{item.name}</TableCell>
                        <TableCell className="text-right">
                          {new Intl.NumberFormat('pt-PT', {
                            style: 'currency',
                            currency: 'EUR',
                          }).format(item.price / 100)}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">
                            {item.category?.name || 'Sem categoria'}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-center">
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
                                <AlertTriangle className="h-4 w-4 text-red-500" />
                              )}
                            </div>
                          ) : (
                            <span className="text-gray-400">N/A</span>
                          )}
                        </TableCell>
                        <TableCell className="text-center">
                          <Badge variant={item.is_available ? "default" : "destructive"}>
                            {item.is_available ? "Disponível" : "Indisponível"}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-center">
                          <div className="flex justify-center space-x-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setEditItem(item);
                                setIsItemModalOpen(true);
                              }}
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
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
                    ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Item Modal */}
      <Dialog open={isItemModalOpen} onOpenChange={setIsItemModalOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editItem ? 'Editar Produto' : 'Novo Produto'}
            </DialogTitle>
          </DialogHeader>
          <Form {...itemForm}>
            <form onSubmit={itemForm.handleSubmit(onItemSubmit)} className="space-y-6">
              <FormField
                control={itemForm.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nome</FormLabel>
                    <FormControl>
                      <Input placeholder="Nome do produto" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              {/* Campo de Imagem - simplificado */}
              <FormField
                control={itemForm.control}
                name="imageUrl"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Imagem</FormLabel>
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
                          <label className="cursor-pointer block">
                            <input
                              type="file"
                              accept="image/*"
                              className="hidden"
                              onChange={handleImageUpload}
                            />
                            <div className="text-center">
                              <Upload className="h-6 w-6 mx-auto text-gray-400 mb-2" />
                              <p className="text-sm text-gray-600">Clique para fazer upload da imagem</p>
                            </div>
                          </label>
                        </div>
                        
                        {/* Campo para URL manual */}
                        <Input 
                          placeholder="Ou insira URL da imagem"
                          {...field}
                        />
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
                  control={itemForm.control}
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

              <div className="flex items-center space-x-4">
                <FormField
                  control={itemForm.control}
                  name="featured"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center space-x-3 space-y-0">
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <FormLabel>Produto em destaque</FormLabel>
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={itemForm.control}
                  name="isAvailable"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center space-x-3 space-y-0">
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <FormLabel>Disponível</FormLabel>
                    </FormItem>
                  )}
                />
              </div>

              <div className="flex justify-end space-x-4">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setIsItemModalOpen(false)}
                >
                  Cancelar
                </Button>
                <Button type="submit">
                  {editItem ? 'Atualizar' : 'Criar'} Produto
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Categories Modal */}
      <Dialog open={isCategoryModalOpen} onOpenChange={setIsCategoryModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Gestão de Categorias</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {/* Category List */}
            <div className="space-y-2">
              <h4 className="font-medium">Categorias Existentes:</h4>
              {categories?.map((category: any) => (
                <div key={category.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <p className="font-medium">{category.name}</p>
                    {category.description && (
                      <p className="text-sm text-gray-500">{category.description}</p>
                    )}
                  </div>
                  <div className="flex space-x-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setEditCategory(category);
                      }}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setItemToDelete({ id: category.id, type: 'category' });
                        setIsDeleteModalOpen(true);
                      }}
                    >
                      <Trash2 className="h-4 w-4 text-red-500" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>

            <Separator />

            {/* Category Form */}
            <Form {...categoryForm}>
              <form onSubmit={categoryForm.handleSubmit(onCategorySubmit)} className="space-y-4">
                <FormField
                  control={categoryForm.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nome da Categoria</FormLabel>
                      <FormControl>
                        <Input placeholder="Ex: Entradas, Pratos Principais..." {...field} />
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
                      <FormLabel>Descrição (opcional)</FormLabel>
                      <FormControl>
                        <Input placeholder="Descrição da categoria..." {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="flex justify-end space-x-4">
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => {
                      setEditCategory(null);
                      categoryForm.reset({ name: '', description: '' });
                    }}
                  >
                    {editCategory ? 'Cancelar' : 'Limpar'}
                  </Button>
                  <Button type="submit">
                    {editCategory ? 'Atualizar' : 'Criar'} Categoria
                  </Button>
                </div>
              </form>
            </Form>
          </div>
        </DialogContent>
      </Dialog>

      {/* Image View Modal */}
      {viewImageModal && (
        <Dialog open={viewImageModal.isOpen} onOpenChange={() => setViewImageModal(null)}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>{viewImageModal.itemName}</DialogTitle>
            </DialogHeader>
            <div className="flex justify-center">
              <img 
                src={viewImageModal.imageUrl} 
                alt={viewImageModal.itemName}
                className="max-w-full max-h-96 object-contain rounded-lg"
              />
            </div>
          </DialogContent>
        </Dialog>
      )}
    </AdminLayout>
  );
};

export default MenuManager;