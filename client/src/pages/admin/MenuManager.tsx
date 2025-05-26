import React, { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { AdminLayout } from "@/components/layouts/AdminLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import Swal from "sweetalert2";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { apiRequest } from "@/lib/queryClient";
import { useSupabaseRealtime } from "../../hooks/useSupabaseRealtime";
import { supabase } from "../../lib/supabase";

// Schemas
const menuItemSchema = z.object({
  name: z.string().min(2, "Nome deve ter pelo menos 2 caracteres"),
  description: z.string().optional(),
  price: z.number().min(0, "Preço deve ser positivo"),
  categoryId: z.number().min(1, "Categoria é obrigatória"),
  featured: z.boolean().default(false),
  imageUrl: z.string().optional(),
  stockQuantity: z
    .number()
    .min(0, "Quantidade em stock deve ser positiva")
    .default(0),
  minStockLevel: z
    .number()
    .min(0, "Nível mínimo de stock deve ser positivo")
    .default(5),
  maxStockLevel: z
    .number()
    .min(1, "Nível máximo de stock deve ser positivo")
    .default(100),
  trackStock: z.boolean().default(true),
  isAvailable: z.boolean().default(true),
});

const categorySchema = z.object({
  name: z.string().min(2, "Nome deve ter pelo menos 2 caracteres"),
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
  const [searchText, setSearchText] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
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
      setLocation("/login");
    }
  }, [isAuthenticated, isAdmin, isLoading, setLocation]);

  // Forms
  const productForm = useForm<FormData>({
    resolver: zodResolver(menuItemSchema),
    defaultValues: {
      name: "",
      description: "",
      price: 0,
      categoryId: 0,
      featured: false,
      imageUrl: "",
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
      name: "",
      description: "",
    },
  });

  // Queries usando dados reais do Supabase
  const {
    data: categories = [],
    isLoading: categoriesLoading,
    error: categoriesError,
  } = useQuery<any>({
    queryKey: ["supabase-categories"],
    queryFn: async () => {
      console.log("🔍 Executando query de categorias no Supabase...");
      if (!supabase) {
        console.error("❌ Supabase não configurado");
        throw new Error("Supabase não configurado");
      }

      // Teste básico de conectividade
      console.log("🔍 Testando query de categorias...");
      const { data, error, status, statusText } = await supabase
        .from("menu_categories")
        .select("*")
        .order("name");
        
      console.log("🔍 Categorias - Status:", status, statusText);
      console.log("🔍 Categorias - Error:", error);
      console.log("🔍 Categorias - Data:", data);

      console.log("📊 Resultado categorias:", { data, error });
      if (error) {
        console.error("❌ Erro na query de categorias:", error);
        throw error;
      }
      return data || [];
    },
    enabled: isAuthenticated && isAdmin && !!supabase,
    refetchOnWindowFocus: false,
  });

  const {
    data: menuItems = [],
    isLoading: menuItemsLoading,
    error: menuItemsError,
  } = useQuery<any>({
    queryKey: ["supabase-menu-items"],
    queryFn: async () => {
      console.log("🔍 Executando query de menu items no Supabase...");
      if (!supabase) {
        console.error("❌ Supabase não configurado");
        throw new Error("Supabase não configurado");
      }

      // Teste de conectividade com Supabase primeiro
      console.log("🔍 Testando conectividade com Supabase...");
      
      // Query com JOIN usando alias correto
      const { data, error, status, statusText } = await supabase
        .from("menu_items")
        .select(`
          *,
          category:menu_categories!category_id (
            id,
            name,
            description
          )
        `)
        .order("name");
        
      console.log("🔍 Response status:", status, statusText);
      console.log("🔍 Response error:", error);
      console.log("🔍 Response data:", data);

      console.log("📊 Resultado menu items:", { data, error });
      if (error) {
        console.error("❌ Erro na query de menu items:", error);
        throw error;
      }
      return data || [];
    },
    enabled: isAuthenticated && isAdmin && !!supabase,
    refetchOnWindowFocus: false,
  });

  // Mutations usando Supabase direto
  const createItemMutation = useMutation({
    mutationFn: async (data: any) => {
      if (!supabase) throw new Error("Supabase não configurado");

      console.log("Dados recebidos na mutation:", data);
      console.log("URL da imagem para inserir:", data.imageUrl);

      const insertData = {
        name: data.name,
        description: data.description || '',
        price: data.price,
        category_id: data.categoryId,
        featured: data.featured || false,
        image_url: data.imageUrl || null,
        stock_quantity: data.stockQuantity || 0,
        min_stock_level: data.minStockLevel || 0,
        max_stock_level: data.maxStockLevel || 100,
        track_stock: data.trackStock || false,
        is_available: data.isAvailable !== false,
      };

      console.log("Dados formatados para inserção:", insertData);

      const { data: result, error } = await supabase
        .from("menu_items")
        .insert([insertData])
        .select();

      if (error) {
        console.error("Erro na inserção:", error);
        throw error;
      }
      
      console.log("Produto criado com sucesso:", result);
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["supabase-menu-items"] });
      setIsProductModalOpen(false);
      productForm.reset();
      toast({ title: "Produto criado com sucesso!" });
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao criar produto",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const updateItemMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: any }) => {
      if (!supabase) throw new Error("Supabase não configurado");

      console.log("Atualizando produto ID:", id);
      console.log("Dados recebidos na update mutation:", data);
      console.log("URL da imagem para atualizar:", data.imageUrl);

      const updateData = {
        name: data.name,
        description: data.description || '',
        price: data.price,
        category_id: data.categoryId,
        featured: data.featured || false,
        image_url: data.imageUrl || null,
        stock_quantity: data.stockQuantity || 0,
        min_stock_level: data.minStockLevel || 0,
        max_stock_level: data.maxStockLevel || 100,
        track_stock: data.trackStock || false,
        is_available: data.isAvailable !== false,
      };

      console.log("Dados formatados para atualização:", updateData);

      const { data: result, error } = await supabase
        .from("menu_items")
        .update(updateData)
        .eq("id", id)
        .select();

      if (error) {
        console.error("Erro na atualização:", error);
        throw error;
      }
      
      console.log("Produto atualizado com sucesso:", result);
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["supabase-menu-items"] });
      setIsProductModalOpen(false);
      setEditingProduct(null);
      productForm.reset();
      toast({ title: "Produto atualizado com sucesso!" });
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao atualizar produto",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const deleteItemMutation = useMutation({
    mutationFn: async (id: number) => {
      if (!supabase) throw new Error("Supabase não configurado");

      const { error } = await supabase.from("menu_items").delete().eq("id", id);

      if (error) throw error;
      return { success: true };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["supabase-menu-items"] });
      // Usar SweetAlert2 em vez de toast
      Swal.fire({
        title: 'Excluído!',
        text: 'Produto removido com sucesso!',
        icon: 'success',
        timer: 2000,
        showConfirmButton: false,
        background: '#ffffff',
        color: '#1f2937'
      });
    },
    onError: (error: any) => {
      // Usar SweetAlert2 em vez de toast
      Swal.fire({
        title: 'Erro!',
        text: `Erro ao remover produto: ${error.message}`,
        icon: 'error',
        confirmButtonText: 'Ok',
        background: '#ffffff',
        color: '#1f2937'
      });
    },
  });

  // Função para confirmação de exclusão com SweetAlert2
  const handleDeleteItem = async (item: any) => {
    const result = await Swal.fire({
      title: 'Tem certeza?',
      text: `Deseja realmente excluir o item "${item.name}"? Esta ação não pode ser desfeita.`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#6b7280',
      confirmButtonText: 'Sim, excluir!',
      cancelButtonText: 'Cancelar',
      background: '#ffffff',
      color: '#1f2937'
    });

    if (result.isConfirmed) {
      deleteItemMutation.mutate(item.id);
    }
  };

  const createCategoryMutation = useMutation({
    mutationFn: async (data: any) => {
      if (!supabase) throw new Error("Supabase não configurado");

      const { data: result, error } = await supabase
        .from("menu_categories")
        .insert([
          {
            name: data.name,
            description: data.description,
          },
        ])
        .select();

      if (error) throw error;
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["supabase-categories"] });
      categoryForm.reset();
      toast({ title: "Categoria criada com sucesso!" });
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao criar categoria",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const updateCategoryMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: any }) => {
      if (!supabase) throw new Error("Supabase não configurado");

      const { data: result, error } = await supabase
        .from("menu_categories")
        .update({
          name: data.name,
          description: data.description,
        })
        .eq("id", id)
        .select();

      if (error) throw error;
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["supabase-categories"] });
      setEditingCategory(null);
      categoryForm.reset();
      toast({ title: "Categoria atualizada com sucesso!" });
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao atualizar categoria",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const deleteCategoryMutation = useMutation({
    mutationFn: async (id: number) => {
      if (!supabase) throw new Error("Supabase não configurado");

      const { error } = await supabase
        .from("menu_categories")
        .delete()
        .eq("id", id);

      if (error) throw error;
      return { success: true };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["supabase-categories"] });
      toast({ title: "Categoria removida com sucesso!" });
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao remover categoria",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Função de diagnóstico completo
  const runImageDebug = async () => {
    console.log("🔍 === DIAGNÓSTICO COMPLETO DO SISTEMA DE IMAGENS ===");
    
    // 1. Verificar configuração Supabase
    console.log("\n1. VERIFICANDO SUPABASE:");
    console.log("- Cliente Supabase:", supabase ? "✓ Conectado" : "❌ Não conectado");
    
    if (supabase) {
      // 2. Listar buckets
      try {
        const { data: buckets, error } = await supabase.storage.listBuckets();
        console.log("- Buckets disponíveis:", buckets?.length || 0);
        buckets?.forEach(bucket => console.log(`  • ${bucket.name}`));
        
        if (error) {
          console.log("❌ Erro ao listar buckets:", error);
        }
      } catch (err) {
        console.log("❌ Erro na verificação de buckets:", err);
      }
      
      // 3. Testar upload
      try {
        console.log("\n3. TESTANDO UPLOAD:");
        const testFile = new Blob(['test'], { type: 'text/plain' });
        const testPath = `debug/test-${Date.now()}.txt`;
        
        const { data, error } = await supabase.storage
          .from("restaurant-images")
          .upload(testPath, testFile);
          
        if (error) {
          console.log("❌ Erro no teste de upload:", error);
          if (error.message.includes('row-level security')) {
            console.log("💡 SOLUÇÃO: Configurar políticas RLS no Supabase Storage");
          }
        } else {
          console.log("✓ Teste de upload bem-sucedido!");
        }
      } catch (err) {
        console.log("❌ Erro no teste de upload:", err);
      }
    }
    
    // 4. Testar banco de dados
    console.log("\n4. TESTANDO BANCO DE DADOS:");
    try {
      const testData = {
        name: 'Debug Test Product',
        description: 'Produto de teste automático',
        price: 100,
        category_id: 1,
        image_url: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg=='
      };
      
      console.log("- Dados de teste:", testData);
      
      createItemMutation.mutate(testData);
      
    } catch (err) {
      console.log("❌ Erro no teste do banco:", err);
    }
    
    toast({
      title: "Diagnóstico executado",
      description: "Verifique o console para resultados detalhados",
    });
  };

  // Upload de imagem com diagnóstico completo
  const handleImageUpload = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0];
    if (!file) {
      toast({
        title: "Erro no upload",
        description: "Nenhum arquivo selecionado",
        variant: "destructive",
      });
      return;
    }

    console.log("📷 INICIANDO UPLOAD DE IMAGEM:");
    console.log("- Arquivo:", file.name, file.size, "bytes");

    try {
      setSelectedImage(file);

      // Tentar upload para Supabase Storage primeiro
      if (supabase) {
        console.log("🔄 Tentando upload para Supabase Storage...");
        try {
          const fileExt = file.name.split(".").pop();
          const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
          const filePath = `menu-items/${fileName}`;

          console.log("- Caminho do arquivo:", filePath);

          const { data, error } = await supabase.storage
            .from("restaurant-images")
            .upload(filePath, file, {
              cacheControl: "3600",
              upsert: true,
            });

          if (error) {
            console.log("❌ Erro no Supabase Storage:", error);
            console.log("- Mensagem:", error.message);
            
            if (error.message.includes('row-level security')) {
              console.log("💡 SOLUÇÃO: Políticas RLS bloqueando upload - usando fallback Base64");
            }
          } else {
            console.log("✓ Upload para Supabase bem-sucedido!");
            const { data: urlData } = supabase.storage
              .from("restaurant-images")
              .getPublicUrl(filePath);
            
            productForm.setValue("imageUrl", urlData.publicUrl, { 
              shouldValidate: true,
              shouldDirty: true,
              shouldTouch: true 
            });
            
            console.log("- URL pública:", urlData.publicUrl);
            
            toast({
              title: "Upload realizado",
              description: "Imagem enviada para Supabase Storage!",
            });
            return;
          }
        } catch (supabaseError) {
          console.log("❌ Exceção no Supabase:", supabaseError);
        }
      }

      // Fallback: Converter para Base64
      console.log("🔄 Usando fallback Base64...");
      const reader = new FileReader();
      reader.onload = () => {
        const base64String = reader.result as string;
        
        // Forçar atualização do campo imageUrl
        productForm.setValue("imageUrl", base64String, { 
          shouldValidate: true,
          shouldDirty: true,
          shouldTouch: true 
        });
        
        console.log("✓ Imagem convertida para Base64");
        console.log("- Tamanho Base64:", base64String.length, "caracteres");
        console.log("- Valor no formulário:", productForm.getValues("imageUrl") ? "✓ Definido" : "❌ Não definido");
        
        toast({
          title: "Upload realizado",
          description: "Imagem carregada em Base64!",
        });
      };
      reader.readAsDataURL(file);

    } catch (error: any) {
      console.error("❌ ERRO GERAL no upload:", error);
      toast({
        title: "Erro no upload",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  // Form handlers
  const onProductSubmit = (data: FormData) => {
    console.log("🚀 === ENVIANDO PRODUTO ===");
    console.log("1. Dados originais do formulário:", data);
    console.log("2. URL da imagem atual:", data.imageUrl);
    console.log("3. Tamanho da imagem:", data.imageUrl?.length || 0, "caracteres");
    console.log("4. Tipo da imagem:", data.imageUrl?.startsWith('data:') ? 'Base64' : 'URL');
    
    const formattedData = {
      ...data,
      price: Math.round(data.price * 100), // Convert to cents
    };

    console.log("5. Dados formatados finais:", formattedData);
    console.log("6. Imagem será enviada:", formattedData.imageUrl ? "✓ SIM" : "❌ NÃO");

    if (editingProduct) {
      console.log("7. Atualizando produto existente ID:", editingProduct.id);
      updateItemMutation.mutate({ id: editingProduct.id, data: formattedData });
    } else {
      console.log("7. Criando novo produto");
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
    const matchesSearch =
      !searchText ||
      item.name.toLowerCase().includes(searchText.toLowerCase()) ||
      item.category?.name.toLowerCase().includes(searchText.toLowerCase());
    const matchesCategory =
      !categoryFilter ||
      categoryFilter === "all" ||
      item.category_id?.toString() === categoryFilter;
    const matchesStatus =
      !statusFilter ||
      statusFilter === "all" ||
      (statusFilter === "disponivel" ? item.is_available : !item.is_available);
    return matchesSearch && matchesCategory && matchesStatus;
  });

  // Pagination
  const totalPages = Math.ceil(filteredProducts.length / itemsPerPage);
  const paginatedProducts =
    itemsPerPage === -1
      ? filteredProducts
      : filteredProducts.slice(
          (currentPage - 1) * itemsPerPage,
          currentPage * itemsPerPage,
        );

  // Modal handlers
  const openProductModal = (product: any = null) => {
    setEditingProduct(product);
    if (product) {
      productForm.reset({
        name: product.name,
        description: product.description || "",
        price: product.price / 100,
        categoryId: product.category_id,
        featured: product.featured,
        imageUrl: product.image_url || "",
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
    setSearchText("");
    setCategoryFilter("all");
    setStatusFilter("all");
    setCurrentPage(1);
  };

  // Debug logs
  console.log("🐛 Debug MenuManager:", {
    isAuthenticated,
    isAdmin,
    supabaseConfigured: !!supabase,
    categoriesLoading,
    menuItemsLoading,
    categoriesError,
    menuItemsError,
    categoriesCount: categories.length,
    menuItemsCount: menuItems.length,
  });

  if (categoriesLoading || menuItemsLoading) {
    return (
      <AdminLayout title="Gestão do Menu">
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full mx-auto mb-4"></div>
            <p className="text-gray-600">Carregando dados do Supabase...</p>
          </div>
        </div>
      </AdminLayout>
    );
  }

  if (categoriesError || menuItemsError) {
    return (
      <AdminLayout title="Gestão do Menu">
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <p className="text-red-600 mb-4">Erro ao carregar dados:</p>
            <p className="text-sm text-gray-600">
              {categoriesError?.message || menuItemsError?.message}
            </p>
          </div>
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
              <Label className="block text-sm font-semibold mb-1 text-gray-700">
                Buscar Produto
              </Label>
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
              <Label className="block text-sm font-semibold mb-1 text-gray-700">
                Categoria
              </Label>
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Todas" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas</SelectItem>
                  {categories.map((cat: any) => (
                    <SelectItem key={cat.id} value={cat.id.toString()}>
                      {cat.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="w-full md:w-36">
              <Label className="block text-sm font-semibold mb-1 text-gray-700">
                Status
              </Label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Todos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
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
                  <th className="px-6 py-4 text-left text-xs font-bold text-white tracking-wider w-32">
                    Foto
                  </th>
                  <th className="px-4 py-4 text-left text-xs font-bold text-white tracking-wider">
                    Nome
                  </th>
                  <th className="px-4 py-4 text-right text-xs font-bold text-white tracking-wider">
                    Preço
                  </th>
                  <th className="px-4 py-4 text-left text-xs font-bold text-white tracking-wider">
                    Categoria
                  </th>
                  <th className="px-4 py-4 text-center text-xs font-bold text-white tracking-wider">
                    Stock
                  </th>
                  <th className="px-4 py-4 text-center text-xs font-bold text-white tracking-wider">
                    Status
                  </th>
                  <th className="px-4 py-4 text-center text-xs font-bold text-white tracking-wider">
                    Ação
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-100 text-gray-800 font-medium">
                {paginatedProducts.map((item: any) => (
                  <tr key={item.id}>
                    <td className="px-6 py-4">
                      <div className="w-16 h-16 bg-gray-100 rounded-lg overflow-hidden border">
                        {item.image_url ? (
                          <img
                            src={item.image_url}
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
                      {new Intl.NumberFormat("pt-PT", {
                        style: "currency",
                        currency: "EUR",
                      }).format(item.price / 100)}
                    </td>
                    <td className="px-4 py-4">
                      <Badge variant="outline">
                        {item.category?.name || "Sem categoria"}
                      </Badge>
                    </td>
                    <td className="px-4 py-4 text-center">
                      {item.track_stock ? (
                        <div className="flex items-center justify-center space-x-1">
                          <span
                            className={`font-medium ${
                              item.stock_quantity <= item.min_stock_level
                                ? "text-red-600"
                                : "text-green-600"
                            }`}
                          >
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
                      <Badge
                        variant={item.is_available ? "default" : "destructive"}
                      >
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
                          onClick={() => handleDeleteItem(item)}
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
              Exibindo {(currentPage - 1) * itemsPerPage + 1}-
              {Math.min(currentPage * itemsPerPage, filteredProducts.length)} de{" "}
              {filteredProducts.length} produtos
            </span>
            <div className="flex space-x-1">
              {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                (page) => (
                  <Button
                    key={page}
                    variant={page === currentPage ? "default" : "ghost"}
                    size="sm"
                    onClick={() => setCurrentPage(page)}
                  >
                    {page}
                  </Button>
                ),
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Product Modal */}
      <Dialog open={isProductModalOpen} onOpenChange={setIsProductModalOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingProduct ? "Editar Produto" : "Adicionar Produto"}
            </DialogTitle>
          </DialogHeader>
          <Form {...productForm}>
            <form
              onSubmit={productForm.handleSubmit(onProductSubmit)}
              className="space-y-6"
            >
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
                          value={field.value?.toString() || ""}
                          onChange={(e) => {
                            const value = e.target.value;
                            if (value === "") {
                              field.onChange(0);
                            } else {
                              const numericValue = parseFloat(value);
                              if (!isNaN(numericValue)) {
                                field.onChange(numericValue);
                              }
                            }
                          }}
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
                      <Select
                        onValueChange={(value) =>
                          field.onChange(parseInt(value))
                        }
                        value={field.value?.toString()}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione uma categoria" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
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
                        value={field.value?.toString() || ""}
                        onChange={(e) => {
                          const value = e.target.value;
                          if (value === "") {
                            field.onChange(0);
                          } else {
                            const numericValue = parseInt(value);
                            if (!isNaN(numericValue)) {
                              field.onChange(numericValue);
                            }
                          }
                        }}
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
                      <Select
                        onValueChange={(value) =>
                          field.onChange(value === "disponivel")
                        }
                        value={field.value ? "disponivel" : "indisponivel"}
                      >
                        <SelectTrigger className="w-40">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="disponivel">Disponível</SelectItem>
                          <SelectItem value="indisponivel">
                            Indisponível
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </FormControl>
                  </FormItem>
                )}
              />

              <div>
                <Label className="block text-sm font-semibold text-gray-700 mb-1">
                  Foto do Produto
                </Label>
                
                {/* Prévia da imagem atual */}
                {productForm.watch("imageUrl") && (
                  <div className="mb-3">
                    <p className="text-sm text-gray-600 mb-2">Imagem atual:</p>
                    <div className="w-20 h-20 bg-gray-100 rounded-lg overflow-hidden border-2 border-gray-200">
                      <img
                        src={productForm.watch("imageUrl")}
                        alt="Prévia do produto"
                        className="w-full h-full object-cover"
                      />
                    </div>
                  </div>
                )}
                
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="block w-full text-gray-700 border border-gray-300 rounded-md px-3 py-2 bg-white hover:border-gray-400 focus:border-blue-500 focus:outline-none"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Formatos aceitos: JPG, PNG, GIF (máx. 5MB)
                </p>
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
              <form
                onSubmit={categoryForm.handleSubmit(onCategorySubmit)}
                className="flex gap-2 mb-4"
              >
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
                <li
                  key={cat.id}
                  className="flex items-center justify-between bg-gray-50 px-3 py-2 rounded-lg"
                >
                  <span className="font-medium text-gray-700">{cat.name}</span>
                  <div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        const newName = prompt("Editar categoria:", cat.name);
                        if (newName && newName !== cat.name) {
                          updateCategoryMutation.mutate({
                            id: cat.id,
                            data: { name: newName },
                          });
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
