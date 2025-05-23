import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { AdminLayout } from '@/components/layouts/AdminLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { apiRequest } from '@/lib/queryClient';
import { 
  Search, 
  Plus, 
  Pencil, 
  Trash2, 
  Package, 
  Utensils, 
  Coffee, 
  Wine, 
  IceCream,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Upload,
  X
} from 'lucide-react';

// Schema para o formulário de item do menu
const menuItemSchema = z.object({
  name: z.string().min(1, 'Nome é obrigatório'),
  description: z.string().optional(),
  price: z.number().min(0, 'Preço deve ser positivo'),
  categoryId: z.number().min(1, 'Categoria é obrigatória'),
  imageUrl: z.string().optional(),
  track_stock: z.boolean().default(false),
  stock_quantity: z.number().min(0).optional(),
  min_stock_level: z.number().min(0).optional(),
  max_stock_level: z.number().min(1).optional(),
  is_available: z.boolean().default(true),
  featured: z.boolean().default(false),
});

type MenuItemFormData = z.infer<typeof menuItemSchema>;

// Schema para categoria
const categorySchema = z.object({
  name: z.string().min(1, 'Nome é obrigatório'),
  description: z.string().optional(),
});

type CategoryFormData = z.infer<typeof categorySchema>;

export default function MenuManager() {
  const { t } = useTranslation();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Estados para filtros e pesquisa
  const [searchText, setSearchText] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [itemsPerPage, setItemsPerPage] = useState('10');
  const [currentPage, setCurrentPage] = useState(1);

  // Estados para modais
  const [isItemModalOpen, setIsItemModalOpen] = useState(false);
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [editItem, setEditItem] = useState<any>(null);
  const [editCategory, setEditCategory] = useState<any>(null);
  const [itemToDelete, setItemToDelete] = useState<{ id: number; type: 'item' | 'category' } | null>(null);
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [viewImageModal, setViewImageModal] = useState<{ isOpen: boolean; imageUrl: string; itemName: string }>({
    isOpen: false,
    imageUrl: '',
    itemName: ''
  });

  // Queries
  const { data: categories, isLoading: categoriesLoading } = useQuery({
    queryKey: ['/api/menu-categories'],
  });

  const { data: menuItems, isLoading: menuItemsLoading } = useQuery({
    queryKey: ['/api/menu-items'],
  });

  // Formulários
  const itemForm = useForm<MenuItemFormData>({
    resolver: zodResolver(menuItemSchema),
    defaultValues: {
      name: '',
      description: '',
      price: 0,
      categoryId: 0,
      imageUrl: '',
      track_stock: false,
      stock_quantity: 0,
      min_stock_level: 5,
      max_stock_level: 100,
      is_available: true,
      featured: false,
    },
  });

  const categoryForm = useForm<CategoryFormData>({
    resolver: zodResolver(categorySchema),
    defaultValues: {
      name: '',
      description: '',
    },
  });

  // Filtrar itens
  const filteredItems = useMemo(() => {
    if (!menuItems || !Array.isArray(menuItems)) return [];

    return menuItems.filter((item: any) => {
      const matchesSearch = !searchText || 
        item.name.toLowerCase().includes(searchText.toLowerCase()) ||
        item.description?.toLowerCase().includes(searchText.toLowerCase()) ||
        item.category?.name.toLowerCase().includes(searchText.toLowerCase());

      const matchesCategory = !categoryFilter || 
        categoryFilter === 'all' || 
        item.categoryId.toString() === categoryFilter;

      const matchesStatus = !statusFilter || 
        statusFilter === 'all' || 
        (statusFilter === 'disponivel' && item.is_available) ||
        (statusFilter === 'indisponivel' && !item.is_available);

      return matchesSearch && matchesCategory && matchesStatus;
    });
  }, [menuItems, searchText, categoryFilter, statusFilter]);

  // Paginação
  const paginatedItems = useMemo(() => {
    if (itemsPerPage === 'all') return filteredItems;
    
    const itemCount = parseInt(itemsPerPage);
    const startIndex = (currentPage - 1) * itemCount;
    return filteredItems.slice(startIndex, startIndex + itemCount);
  }, [filteredItems, itemsPerPage, currentPage]);

  const totalPages = useMemo(() => {
    if (itemsPerPage === 'all') return 1;
    return Math.ceil(filteredItems.length / parseInt(itemsPerPage));
  }, [filteredItems.length, itemsPerPage]);

  // Upload de imagem
  const uploadImageMutation = useMutation({
    mutationFn: async (file: File) => {
      const supabase = (await import('@/lib/supabase')).supabase;
      
      if (!supabase) {
        const placeholderUrl = `https://via.placeholder.com/300x200/4ecdc4/ffffff?text=${encodeURIComponent(file.name.split('.')[0])}`;
        return {
          success: true,
          url: placeholderUrl,
          path: `placeholder/${file.name}`,
          note: 'Modo placeholder ativo'
        };
      }
      
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
      const filePath = `menu-items/${fileName}`;
      
      const { data, error } = await supabase.storage
        .from('restaurant-images')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        });
      
      if (error) {
        const placeholderUrl = `https://via.placeholder.com/300x200/4ecdc4/ffffff?text=${encodeURIComponent(file.name.split('.')[0])}`;
        return {
          success: true,
          url: placeholderUrl,
          path: `placeholder/${file.name}`,
          note: 'Modo placeholder ativo - bucket não encontrado'
        };
      }
      
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
          title: t('Success'),
          description: data.note || t('ImageUploadedSuccessfully'),
        });
      }
      setSelectedImage(null);
    },
    onError: (error: any) => {
      toast({
        title: t('Error'),
        description: error.message || t('ErrorUploadingImage'),
        variant: 'destructive',
      });
      setSelectedImage(null);
    }
  });

  // Mutations para CRUD
  const createItemMutation = useMutation({
    mutationFn: (data: MenuItemFormData) => 
      apiRequest('POST', '/api/menu-items', { ...data, price: Math.round(data.price * 100) }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/menu-items'] });
      setIsItemModalOpen(false);
      itemForm.reset();
      toast({ title: t('Success'), description: t('ItemCreatedSuccessfully') });
    },
  });

  const updateItemMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: MenuItemFormData }) =>
      apiRequest('PUT', `/api/menu-items/${id}`, { ...data, price: Math.round(data.price * 100) }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/menu-items'] });
      setIsItemModalOpen(false);
      setEditItem(null);
      itemForm.reset();
      toast({ title: t('Success'), description: t('ItemUpdatedSuccessfully') });
    },
  });

  const deleteItemMutation = useMutation({
    mutationFn: (id: number) => apiRequest('DELETE', `/api/menu-items/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/menu-items'] });
      setIsDeleteModalOpen(false);
      setItemToDelete(null);
      toast({ title: t('Success'), description: t('ItemDeletedSuccessfully') });
    },
  });

  const createCategoryMutation = useMutation({
    mutationFn: (data: CategoryFormData) => apiRequest('POST', '/api/menu-categories', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/menu-categories'] });
      setIsCategoryModalOpen(false);
      categoryForm.reset();
      toast({ title: t('Success'), description: t('CategoryCreatedSuccessfully') });
    },
  });

  // Handlers
  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedImage(file);
      uploadImageMutation.mutate(file);
    }
  };

  const handleSubmitItem = (data: MenuItemFormData) => {
    if (editItem) {
      updateItemMutation.mutate({ id: editItem.id, data });
    } else {
      createItemMutation.mutate(data);
    }
  };

  const handleSubmitCategory = (data: CategoryFormData) => {
    createCategoryMutation.mutate(data);
  };

  const handleEditItem = (item: any) => {
    setEditItem(item);
    itemForm.reset({
      name: item.name,
      description: item.description || '',
      price: item.price / 100,
      categoryId: item.categoryId,
      imageUrl: item.imageUrl || '',
      track_stock: item.track_stock || false,
      stock_quantity: item.stock_quantity || 0,
      min_stock_level: item.min_stock_level || 5,
      max_stock_level: item.max_stock_level || 100,
      is_available: item.is_available,
      featured: item.featured || false,
    });
    setIsItemModalOpen(true);
  };

  const clearFilters = () => {
    setSearchText('');
    setCategoryFilter('');
    setStatusFilter('');
    setCurrentPage(1);
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('pt-PT', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 2
    }).format(price / 100);
  };

  const getCategoryIcon = (categoryId: number) => {
    const category = Array.isArray(categories) ? categories.find((cat: any) => cat.id === categoryId) : null;
    if (!category) return <Utensils className="h-4 w-4 text-blue-600" />;

    const name = category.name.toLowerCase();
    if (name.includes('entrada')) return <Coffee className="h-4 w-4 text-blue-600" />;
    if (name.includes('prato') || name.includes('principal')) return <Utensils className="h-4 w-4 text-blue-600" />;
    if (name.includes('sobremesa')) return <IceCream className="h-4 w-4 text-blue-600" />;
    if (name.includes('bebida')) return <Wine className="h-4 w-4 text-blue-600" />;
    return <Utensils className="h-4 w-4 text-blue-600" />;
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
      <div className="flex flex-col gap-8 h-full">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">{t('MenuManagement')}</h1>
            <p className="text-gray-600">{t('ManageMenuItemsAndCategories')}</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 bg-blue-50 px-3 py-2 rounded-lg">
              <Package className="h-4 w-4 text-blue-600" />
              <span className="text-sm font-medium text-blue-800">
                {filteredItems?.length || 0} {t('Products')}
              </span>
            </div>
            <div className="flex gap-2">
              <Button
                onClick={() => {
                  setEditCategory(null);
                  categoryForm.reset();
                  setIsCategoryModalOpen(true);
                }}
                variant="outline"
                className="flex items-center gap-2"
              >
                <Plus className="h-4 w-4" />
                {t('AddCategory')}
              </Button>
              <Button
                onClick={() => {
                  setEditItem(null);
                  itemForm.reset();
                  setIsItemModalOpen(true);
                }}
                className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700"
              >
                <Plus className="h-4 w-4" />
                {t('AddItem')}
              </Button>
            </div>
          </div>
        </div>

        {/* Filtros */}
        <div className="flex flex-col md:flex-row md:items-end md:space-x-6 space-y-3 md:space-y-0 bg-white p-4 rounded-lg shadow-sm border">
          <div className="flex-1">
            <label className="block text-sm font-semibold mb-1 text-gray-700">
              {t('SearchProduct')}
            </label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder={t('SearchMenuItems')}
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                className="pl-10 border-gray-200 focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-semibold mb-1 text-gray-700">
              {t('Category')}
            </label>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-40 border-gray-200 focus:ring-2 focus:ring-blue-500">
                <SelectValue placeholder={t('AllCategories')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">{t('AllCategories')}</SelectItem>
                {Array.isArray(categories) && categories.map((category: any) => (
                  <SelectItem key={category.id} value={category.id.toString()}>
                    {category.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="block text-sm font-semibold mb-1 text-gray-700">
              Status
            </label>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-32 border-gray-200 focus:ring-2 focus:ring-blue-500">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">{t('All')}</SelectItem>
                <SelectItem value="disponivel">{t('Available')}</SelectItem>
                <SelectItem value="indisponivel">{t('Unavailable')}</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="block text-sm font-semibold mb-1 text-gray-700">
              {t('ItemsPerPage')}
            </label>
            <Select value={itemsPerPage} onValueChange={setItemsPerPage}>
              <SelectTrigger className="w-32 border-gray-200 focus:ring-2 focus:ring-blue-500">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="10">10</SelectItem>
                <SelectItem value="20">20</SelectItem>
                <SelectItem value="50">50</SelectItem>
                <SelectItem value="all">{t('All')}</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Button
            variant="outline"
            onClick={clearFilters}
            className="bg-yellow-400 text-blue-800 border-yellow-400 hover:bg-yellow-300"
          >
            {t('Clear')}
          </Button>
        </div>

        {/* Tabela */}
        <div className="bg-white rounded-xl shadow-lg overflow-hidden flex-1 flex flex-col">
          <div className="overflow-x-auto flex-1">
            <table className="min-w-full divide-y divide-gray-100">
              <thead className="bg-blue-600">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-bold text-white tracking-wider">
                    {t('Product')}
                  </th>
                  <th className="px-4 py-4 text-left text-xs font-bold text-white tracking-wider">
                    {t('Price')}
                  </th>
                  <th className="px-4 py-4 text-left text-xs font-bold text-white tracking-wider">
                    {t('Category')}
                  </th>
                  <th className="px-4 py-4 text-center text-xs font-bold text-white tracking-wider">
                    Stock
                  </th>
                  <th className="px-4 py-4 text-center text-xs font-bold text-white tracking-wider">
                    Status
                  </th>
                  <th className="px-4 py-4 text-center text-xs font-bold text-white tracking-wider">
                    {t('Actions')}
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-100 text-gray-800">
                {paginatedItems?.map((item: any) => (
                  <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-14 w-14">
                          {item.imageUrl ? (
                            <img
                              className="h-14 w-14 rounded-xl object-cover cursor-pointer hover:opacity-80 transition-opacity shadow-sm"
                              src={item.imageUrl}
                              alt={item.name}
                              onClick={() => setViewImageModal({
                                isOpen: true,
                                imageUrl: item.imageUrl!,
                                itemName: item.name
                              })}
                            />
                          ) : (
                            <div className="h-14 w-14 rounded-xl bg-gray-100 flex items-center justify-center border-2 border-dashed border-gray-200">
                              <Utensils className="h-7 w-7 text-gray-400" />
                            </div>
                          )}
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-semibold text-gray-900">{item.name}</div>
                          <div className="text-xs text-gray-500 max-w-xs truncate">{item.description}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <span className="text-sm font-bold text-green-600">
                        {formatPrice(item.price)}
                      </span>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center">
                        <div className="p-1 rounded-lg bg-blue-50">
                          {getCategoryIcon(item.categoryId)}
                        </div>
                        <span className="ml-2 text-sm font-medium text-gray-700">{item.category?.name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-4 text-center">
                      {item.track_stock ? (
                        <Badge
                          variant={item.stock_quantity <= item.min_stock_level ? 'destructive' : 'default'}
                          className={item.stock_quantity <= item.min_stock_level ? 'bg-red-100 text-red-700 border-red-200' : 'bg-green-100 text-green-700 border-green-200'}
                        >
                          {item.stock_quantity <= item.min_stock_level && (
                            <AlertTriangle className="w-3 h-3 mr-1" />
                          )}
                          {item.stock_quantity}
                        </Badge>
                      ) : (
                        <span className="text-gray-400 text-sm font-medium">—</span>
                      )}
                    </td>
                    <td className="px-4 py-4 text-center">
                      <Badge
                        variant={item.is_available ? 'default' : 'destructive'}
                        className={item.is_available 
                          ? 'bg-green-100 text-green-700 border-green-200' 
                          : 'bg-red-100 text-red-700 border-red-200'
                        }
                      >
                        {item.is_available ? (
                          <>
                            <CheckCircle className="w-3 h-3 mr-1" />
                            {t('Available')}
                          </>
                        ) : (
                          <>
                            <XCircle className="w-3 h-3 mr-1" />
                            {t('Unavailable')}
                          </>
                        )}
                      </Badge>
                    </td>
                    <td className="px-4 py-4 text-center">
                      <div className="flex items-center justify-center space-x-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEditItem(item)}
                          className="text-blue-600 hover:text-blue-900 hover:bg-blue-50 rounded-lg p-2"
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
                          className="text-red-600 hover:text-red-900 hover:bg-red-50 rounded-lg p-2"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                )) || (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center">
                      <div className="flex flex-col items-center">
                        <Utensils className="h-12 w-12 text-gray-300 mb-4" />
                        <p className="text-gray-500 text-sm">{t('NoItemsFound')}</p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          
          {/* Footer com paginação */}
          <div className="px-6 py-3 flex justify-between items-center bg-gray-50 border-t">
            <span className="text-xs text-gray-600">
              {t('Showing')} {paginatedItems?.length || 0} {t('of')} {filteredItems?.length || 0} {t('products')}
            </span>
            <div className="flex space-x-1">
              <Button 
                variant="outline" 
                size="sm" 
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(currentPage - 1)}
                className="text-xs"
              >
                {t('Previous')}
              </Button>
              <Button variant="outline" size="sm" className="bg-blue-600 text-white text-xs">
                {currentPage}
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage(currentPage + 1)}
                className="text-xs"
              >
                {t('Next')}
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Modal de Item do Menu */}
      <Dialog open={isItemModalOpen} onOpenChange={setIsItemModalOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editItem ? t('EditMenuItem') : t('AddMenuItem')}
            </DialogTitle>
          </DialogHeader>
          <Form {...itemForm}>
            <form onSubmit={itemForm.handleSubmit(handleSubmitItem)} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={itemForm.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('Name')}</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={itemForm.control}
                  name="price"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('Price')} (€)</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          step="0.01" 
                          {...field}
                          onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={itemForm.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('Description')}</FormLabel>
                    <FormControl>
                      <Textarea {...field} />
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
                      value={field.value?.toString()} 
                      onValueChange={(value) => field.onChange(parseInt(value))}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder={t('SelectCategory')} />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {Array.isArray(categories) && categories.map((category: any) => (
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

              {/* Upload de Imagem */}
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">
                  {t('Image')}
                </label>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-4">
                  <div className="text-center">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="hidden"
                      id="image-upload"
                    />
                    <label htmlFor="image-upload" className="cursor-pointer">
                      <Upload className="mx-auto h-8 w-8 text-gray-400" />
                      <span className="mt-2 block text-sm font-medium text-gray-900">
                        {t('ClickToUploadImage')}
                      </span>
                    </label>
                  </div>
                </div>
                
                <FormField
                  control={itemForm.control}
                  name="imageUrl"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('ImageURL')}</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder={t('EnterImageURL')} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Gestão de Stock */}
              <div className="space-y-4 p-4 border rounded-lg bg-gray-50">
                <div className="flex items-center space-x-2">
                  <Package className="h-4 w-4 text-blue-600" />
                  <h4 className="font-medium">{t('StockManagement')}</h4>
                </div>
                
                <FormField
                  control={itemForm.control}
                  name="track_stock"
                  render={({ field }) => (
                    <FormItem className="flex items-center space-x-2">
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <FormLabel className="text-sm font-normal">
                        {t('TrackStock')}
                      </FormLabel>
                    </FormItem>
                  )}
                />

                {itemForm.watch('track_stock') && (
                  <div className="grid grid-cols-3 gap-4">
                    <FormField
                      control={itemForm.control}
                      name="stock_quantity"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t('CurrentStock')}</FormLabel>
                          <FormControl>
                            <Input 
                              type="number" 
                              {...field}
                              onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={itemForm.control}
                      name="min_stock_level"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t('MinStock')}</FormLabel>
                          <FormControl>
                            <Input 
                              type="number" 
                              {...field}
                              onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={itemForm.control}
                      name="max_stock_level"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t('MaxStock')}</FormLabel>
                          <FormControl>
                            <Input 
                              type="number" 
                              {...field}
                              onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                )}
              </div>

              {/* Switches */}
              <div className="flex space-x-8">
                <FormField
                  control={itemForm.control}
                  name="is_available"
                  render={({ field }) => (
                    <FormItem className="flex items-center space-x-2">
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <FormLabel className="text-sm font-normal">
                        {t('Available')}
                      </FormLabel>
                    </FormItem>
                  )}
                />

                <FormField
                  control={itemForm.control}
                  name="featured"
                  render={({ field }) => (
                    <FormItem className="flex items-center space-x-2">
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <FormLabel className="text-sm font-normal">
                        {t('Featured')}
                      </FormLabel>
                    </FormItem>
                  )}
                />
              </div>

              <div className="flex justify-end space-x-2">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setIsItemModalOpen(false)}
                >
                  {t('Cancel')}
                </Button>
                <Button 
                  type="submit" 
                  disabled={createItemMutation.isPending || updateItemMutation.isPending}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  {editItem ? t('Update') : t('Create')}
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Modal de Categoria */}
      <Dialog open={isCategoryModalOpen} onOpenChange={setIsCategoryModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('AddCategory')}</DialogTitle>
          </DialogHeader>
          <Form {...categoryForm}>
            <form onSubmit={categoryForm.handleSubmit(handleSubmitCategory)} className="space-y-4">
              <FormField
                control={categoryForm.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('Name')}</FormLabel>
                    <FormControl>
                      <Input {...field} />
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
                      <Textarea {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex justify-end space-x-2">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setIsCategoryModalOpen(false)}
                >
                  {t('Cancel')}
                </Button>
                <Button 
                  type="submit" 
                  disabled={createCategoryMutation.isPending}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  {t('Create')}
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Modal de Confirmação de Exclusão */}
      <Dialog open={isDeleteModalOpen} onOpenChange={setIsDeleteModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('ConfirmDeletion')}</DialogTitle>
          </DialogHeader>
          <p className="text-gray-600">
            {t('AreYouSureDeleteItem')}
          </p>
          <div className="flex justify-end space-x-2">
            <Button 
              variant="outline" 
              onClick={() => setIsDeleteModalOpen(false)}
            >
              {t('Cancel')}
            </Button>
            <Button 
              variant="destructive"
              onClick={() => {
                if (itemToDelete) {
                  deleteItemMutation.mutate(itemToDelete.id);
                }
              }}
              disabled={deleteItemMutation.isPending}
            >
              {t('Delete')}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal de Visualização de Imagem */}
      <Dialog open={viewImageModal.isOpen} onOpenChange={(open) => setViewImageModal({ ...viewImageModal, isOpen: open })}>
        <DialogContent className="max-w-2xl">
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
    </AdminLayout>
  );
}