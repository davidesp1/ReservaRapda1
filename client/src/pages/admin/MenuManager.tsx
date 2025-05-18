import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
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
  Wine
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
  const [searchText, setSearchText] = useState('');
  const [currentCategoryId, setCurrentCategoryId] = useState<string | null>(null);
  const [editItem, setEditItem] = useState<any | null>(null);
  const [editCategory, setEditCategory] = useState<any | null>(null);
  const [isItemModalOpen, setIsItemModalOpen] = useState(false);
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<{id: number, type: 'item' | 'category'} | null>(null);

  // Fetch menu categories
  const { data: categories, isLoading: categoriesLoading } = useQuery<any>({
    queryKey: ['/api/menu-categories'],
    enabled: isAuthenticated && isAdmin,
  });

  // Fetch menu items
  const { data: menuItems, isLoading: menuItemsLoading } = useQuery<any>({
    queryKey: ['/api/menu-items', currentCategoryId ? { categoryId: currentCategoryId } : undefined],
    enabled: isAuthenticated && isAdmin,
  });

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
      });
    } else if (isItemModalOpen && !editItem) {
      itemForm.reset({
        name: '',
        description: '',
        price: 0,
        categoryId: currentCategoryId ? parseInt(currentCategoryId) : undefined,
        featured: false,
        imageUrl: '',
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
        item.name.toLowerCase().includes(searchLower) ||
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
    mutationFn: async (data: any) => {
      const response = await apiRequest('POST', '/api/menu-categories', data);
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
    mutationFn: async ({ id, data }: { id: number, data: any }) => {
      const response = await apiRequest('PUT', `/api/menu-categories/${id}`, data);
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

  // Handle menu item form submission
  const onItemSubmit = (data: z.infer<typeof menuItemSchema>) => {
    if (editItem) {
      updateItemMutation.mutate({ id: editItem.id, data });
    } else {
      createItemMutation.mutate(data);
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
                      <TableHead>{t('Description')}</TableHead>
                      <TableHead>{t('Price')}</TableHead>
                      <TableHead>{t('Category')}</TableHead>
                      <TableHead>{t('Featured')}</TableHead>
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
                              <div className="flex items-center">
                                <span className="mr-2">
                                  {getCategoryIcon(item.categoryId)}
                                </span>
                                {item.name}
                              </div>
                            </TableCell>
                            <TableCell className="max-w-xs truncate">
                              {item.description || '-'}
                            </TableCell>
                            <TableCell>{formatPrice(item.price)}</TableCell>
                            <TableCell>{category?.name || '-'}</TableCell>
                            <TableCell>
                              {item.featured ? 
                                <span className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs">
                                  {t('Yes')}
                                </span> : 
                                <span className="bg-gray-100 text-gray-800 px-2 py-1 rounded-full text-xs">
                                  {t('No')}
                                </span>
                              }
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
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editItem ? t('EditMenuItem') : t('AddMenuItem')}
            </DialogTitle>
            <DialogDescription>
              {editItem ? t('EditMenuItemDescription') : t('AddMenuItemDescription')}
            </DialogDescription>
          </DialogHeader>
          
          <Form {...itemForm}>
            <form onSubmit={itemForm.handleSubmit(onItemSubmit)} className="space-y-4">
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
              
              <FormField
                control={itemForm.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('Description')}</FormLabel>
                    <FormControl>
                      <Input placeholder={t('ItemDescription')} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <div className="grid grid-cols-2 gap-4">
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
                    <FormControl>
                      <Input 
                        placeholder={t('EnterImageURL')} 
                        {...field} 
                        value={field.value || ''}
                      />
                    </FormControl>
                    <FormMessage />
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
              
              <DialogFooter>
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
                >
                  {(createItemMutation.isPending || updateItemMutation.isPending) ? (
                    <span className="flex items-center">
                      <i className="fas fa-spinner fa-spin mr-2"></i> {t('Saving')}
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
