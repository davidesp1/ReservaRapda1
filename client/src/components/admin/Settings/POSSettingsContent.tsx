import React, { useEffect, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import Swal from "sweetalert2";
import { supabase } from "@/lib/supabase";
import { useSupabaseRealtime } from "@/hooks/useSupabaseRealtime";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Printer, Settings, FileText, DollarSign, ShoppingCart, User } from "lucide-react";

// Schema Zod para configurações POS
const posSettingsSchema = z.object({
  printerId: z.string().min(1, "Selecione uma impressora"),
  printOptions: z.object({
    orderItems: z.boolean().default(true),
    totals: z.boolean().default(true),
    paymentMethod: z.boolean().default(true),
    customerInfo: z.boolean().default(false),
    restaurantInfo: z.boolean().default(true),
    timestamp: z.boolean().default(true),
    qrCode: z.boolean().default(false),
    promotion: z.boolean().default(false),
  }),
  autoOpenCashDrawer: z.boolean().default(false),
  printCopies: z.number().min(1).max(5).default(1),
});

type POSSettingsFormData = z.infer<typeof posSettingsSchema>;

interface Printer {
  id: string;
  name: string;
  type: string;
  status: 'online' | 'offline' | 'error';
  is_default: boolean;
  created_at: string;
}

const POSSettingsContent: React.FC = () => {
  const queryClient = useQueryClient();
  const [isLoading, setIsLoading] = useState(false);

  // Form setup
  const form = useForm<POSSettingsFormData>({
    resolver: zodResolver(posSettingsSchema),
    defaultValues: {
      printerId: "",
      printOptions: {
        orderItems: true,
        totals: true,
        paymentMethod: true,
        customerInfo: false,
        restaurantInfo: true,
        timestamp: true,
        qrCode: false,
        promotion: false,
      },
      autoOpenCashDrawer: false,
      printCopies: 1,
    },
  });

  // Query para buscar impressoras disponíveis
  const { data: printers = [], isLoading: printersLoading } = useQuery<Printer[]>({
    queryKey: ["pos-printers"],
    queryFn: async () => {
      if (!supabase) throw new Error("Supabase não configurado");
      
      console.log("🖨️ Buscando impressoras disponíveis...");
      const { data, error } = await supabase
        .from("printers")
        .select("*")
        .order("name");
      
      if (error) {
        console.error("❌ Erro ao buscar impressoras:", error);
        throw error;
      }
      
      console.log("📊 Impressoras encontradas:", data);
      return data || [];
    },
    refetchOnWindowFocus: false,
  });

  // Query para buscar configurações POS atuais
  const { data: currentSettings, isLoading: settingsLoading } = useQuery({
    queryKey: ["pos-settings"],
    queryFn: async () => {
      if (!supabase) throw new Error("Supabase não configurado");
      
      const { data, error } = await supabase
        .from("pos_settings")
        .select("*")
        .single();
      
      if (error && error.code !== 'PGRST116') { // PGRST116 = no rows found
        throw error;
      }
      
      return data;
    },
    refetchOnWindowFocus: false,
  });

  // Realtime para impressoras
  useSupabaseRealtime("printers", () => {
    queryClient.invalidateQueries({ queryKey: ["pos-printers"] });
  });

  // Mutation para salvar configurações
  const saveSettingsMutation = useMutation({
    mutationFn: async (data: POSSettingsFormData) => {
      if (!supabase) throw new Error("Supabase não configurado");
      
      const { error } = await supabase
        .from("pos_settings")
        .upsert({
          id: 1, // ID único para configurações
          printer_id: data.printerId,
          print_options: data.printOptions,
          auto_open_cash_drawer: data.autoOpenCashDrawer,
          print_copies: data.printCopies,
          updated_at: new Date().toISOString(),
        });
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pos-settings"] });
      Swal.fire({
        title: "Sucesso!",
        text: "Configurações POS salvas com sucesso!",
        icon: "success",
        timer: 2000,
        showConfirmButton: false,
      });
    },
    onError: (error) => {
      console.error("Erro ao salvar configurações:", error);
      Swal.fire({
        title: "Erro!",
        text: `Erro ao salvar configurações: ${error instanceof Error ? error.message : "Erro desconhecido"}`,
        icon: "error",
        confirmButtonText: "Ok",
      });
    },
  });

  // Função para testar impressão
  const testPrintMutation = useMutation({
    mutationFn: async (settings: POSSettingsFormData) => {
      const testReceipt = generateTestReceipt(settings);
      await printReceipt(testReceipt, settings);
    },
    onSuccess: () => {
      Swal.fire({
        title: "Teste de Impressão",
        text: "Comando de impressão enviado! Verifique se o recibo foi impresso.",
        icon: "info",
        confirmButtonText: "Ok",
      });
    },
    onError: (error) => {
      Swal.fire({
        title: "Erro na Impressão",
        text: `Erro ao testar impressão: ${error instanceof Error ? error.message : "Erro desconhecido"}`,
        icon: "error",
        confirmButtonText: "Ok",
      });
    },
  });

  // Carregar configurações atuais no form
  useEffect(() => {
    if (currentSettings) {
      form.reset({
        printerId: currentSettings.printer_id || "",
        printOptions: currentSettings.print_options || form.getValues("printOptions"),
        autoOpenCashDrawer: currentSettings.auto_open_cash_drawer || false,
        printCopies: currentSettings.print_copies || 1,
      });
    }
  }, [currentSettings, form]);

  // Função para gerar recibo de teste
  const generateTestReceipt = (settings: POSSettingsFormData): string => {
    let receipt = "";
    
    if (settings.printOptions.restaurantInfo) {
      receipt += `
========================================
           OPA QUE DELÍCIA
        Restaurante Brasileiro
========================================
`;
    }
    
    if (settings.printOptions.timestamp) {
      receipt += `Data: ${new Date().toLocaleString("pt-PT")}\n`;
      receipt += `Recibo de Teste #${Math.random().toString(36).substring(7).toUpperCase()}\n\n`;
    }
    
    if (settings.printOptions.orderItems) {
      receipt += `ITENS DO PEDIDO:\n`;
      receipt += `----------------------------------------\n`;
      receipt += `1x Feijoada Completa         €15.90\n`;
      receipt += `1x Caipirinha                 €5.50\n`;
      receipt += `1x Brigadeiro                 €2.00\n`;
      receipt += `----------------------------------------\n`;
    }
    
    if (settings.printOptions.totals) {
      receipt += `Subtotal:                   €23.40\n`;
      receipt += `IVA (23%):                   €5.38\n`;
      receipt += `TOTAL:                      €28.78\n\n`;
    }
    
    if (settings.printOptions.paymentMethod) {
      receipt += `Forma de Pagamento: Cartão\n`;
      receipt += `Status: Pago\n\n`;
    }
    
    if (settings.printOptions.customerInfo) {
      receipt += `Cliente: João Silva\n`;
      receipt += `Mesa: 12\n\n`;
    }
    
    receipt += `========================================\n`;
    receipt += `         Obrigado pela visita!\n`;
    receipt += `========================================\n`;
    
    return receipt;
  };

  // Função para imprimir recibo
  const printReceipt = async (content: string, settings: POSSettingsFormData) => {
    // Criar elemento temporário para impressão
    const printContent = `
      <html>
        <head>
          <title>Recibo</title>
          <style>
            body { 
              font-family: 'Courier New', monospace; 
              font-size: 12px; 
              margin: 0; 
              padding: 20px;
              white-space: pre-line;
            }
            @media print {
              body { margin: 0; padding: 10px; }
            }
          </style>
        </head>
        <body>${content}</body>
      </html>
    `;
    
    // Abrir nova janela para impressão
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(printContent);
      printWindow.document.close();
      
      // Aguardar carregamento e imprimir
      setTimeout(() => {
        printWindow.print();
        setTimeout(() => printWindow.close(), 1000);
      }, 500);
    }
  };

  // Handlers
  const onSubmit = (data: POSSettingsFormData) => {
    saveSettingsMutation.mutate(data);
  };

  const handleTestPrint = () => {
    const currentValues = form.getValues();
    if (!currentValues.printerId) {
      Swal.fire({
        title: "Atenção!",
        text: "Selecione uma impressora antes de testar.",
        icon: "warning",
        confirmButtonText: "Ok",
      });
      return;
    }
    testPrintMutation.mutate(currentValues);
  };

  const handleSaveAndTest = async () => {
    const isValid = await form.trigger();
    if (!isValid) return;
    
    const formData = form.getValues();
    
    // Salvar configurações primeiro
    await saveSettingsMutation.mutateAsync(formData);
    
    // Depois testar impressão
    testPrintMutation.mutate(formData);
  };

  if (printersLoading || settingsLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-2">
        <Printer className="w-6 h-6" />
        <div>
          <h2 className="text-2xl font-bold">Configurações POS</h2>
          <p className="text-gray-600">Configure impressoras e opções de impressão para o sistema POS</p>
        </div>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          {/* Seção de Impressoras */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Printer className="w-5 h-5" />
                <span>Impressora Principal</span>
              </CardTitle>
              <CardDescription>
                Selecione a impressora que será usada para imprimir recibos do POS
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
                name="printerId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Impressora Selecionada</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione uma impressora" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {printers.map((printer) => (
                          <SelectItem key={printer.id} value={printer.id}>
                            <div className="flex items-center space-x-2">
                              <span>{printer.name}</span>
                              <Badge variant={printer.status === 'online' ? 'default' : 'destructive'}>
                                {printer.status}
                              </Badge>
                              {printer.is_default && <Badge variant="secondary">Padrão</Badge>}
                            </div>
                          </SelectItem>
                        ))}
                        {printers.length === 0 && (
                          <SelectItem value="none" disabled>
                            Nenhuma impressora encontrada
                          </SelectItem>
                        )}
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      {printers.length === 0 
                        ? "Configure impressoras no sistema para continuar"
                        : `${printers.length} impressora(s) disponível(eis)`
                      }
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex space-x-4">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={handleTestPrint}
                  disabled={testPrintMutation.isPending || !form.watch("printerId")}
                >
                  <FileText className="w-4 h-4 mr-2" />
                  Testar Impressão
                </Button>
                
                <Button 
                  type="button" 
                  variant="secondary" 
                  onClick={handleSaveAndTest}
                  disabled={saveSettingsMutation.isPending || testPrintMutation.isPending}
                >
                  <Settings className="w-4 h-4 mr-2" />
                  Salvar e Testar
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Seção de Opções de Impressão */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <FileText className="w-5 h-5" />
                <span>Conteúdo do Recibo</span>
              </CardTitle>
              <CardDescription>
                Escolha quais informações devem aparecer no recibo impresso
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h4 className="font-medium flex items-center space-x-2">
                    <ShoppingCart className="w-4 h-4" />
                    <span>Informações do Pedido</span>
                  </h4>
                  
                  <FormField
                    control={form.control}
                    name="printOptions.orderItems"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                        <div className="space-y-0.5">
                          <FormLabel>Itens do Pedido</FormLabel>
                          <FormDescription>Lista detalhada dos produtos</FormDescription>
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
                    control={form.control}
                    name="printOptions.totals"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                        <div className="space-y-0.5">
                          <FormLabel>Totais</FormLabel>
                          <FormDescription>Subtotal, impostos e total final</FormDescription>
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
                    control={form.control}
                    name="printOptions.paymentMethod"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                        <div className="space-y-0.5">
                          <FormLabel>Forma de Pagamento</FormLabel>
                          <FormDescription>Método usado para o pagamento</FormDescription>
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
                </div>

                <div className="space-y-4">
                  <h4 className="font-medium flex items-center space-x-2">
                    <User className="w-4 h-4" />
                    <span>Informações Adicionais</span>
                  </h4>

                  <FormField
                    control={form.control}
                    name="printOptions.customerInfo"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                        <div className="space-y-0.5">
                          <FormLabel>Dados do Cliente</FormLabel>
                          <FormDescription>Nome e mesa do cliente</FormDescription>
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
                    control={form.control}
                    name="printOptions.restaurantInfo"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                        <div className="space-y-0.5">
                          <FormLabel>Dados do Restaurante</FormLabel>
                          <FormDescription>Nome e cabeçalho do estabelecimento</FormDescription>
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
                    control={form.control}
                    name="printOptions.timestamp"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                        <div className="space-y-0.5">
                          <FormLabel>Data e Hora</FormLabel>
                          <FormDescription>Timestamp da transação</FormDescription>
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
                    control={form.control}
                    name="printOptions.qrCode"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                        <div className="space-y-0.5">
                          <FormLabel>QR Code</FormLabel>
                          <FormDescription>Código QR para feedback ou promoções</FormDescription>
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
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Seção de Configurações Avançadas */}
          <Card>
            <CardHeader>
              <CardTitle>Configurações Avançadas</CardTitle>
              <CardDescription>
                Opções adicionais para o funcionamento do POS
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
                name="autoOpenCashDrawer"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                    <div className="space-y-0.5">
                      <FormLabel>Abrir Gaveta Automaticamente</FormLabel>
                      <FormDescription>
                        Abrir a gaveta do dinheiro automaticamente após cada venda
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
                control={form.control}
                name="printCopies"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Número de Cópias</FormLabel>
                    <Select onValueChange={(value) => field.onChange(parseInt(value))} value={field.value?.toString()}>
                      <FormControl>
                        <SelectTrigger className="w-32">
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {[1, 2, 3, 4, 5].map((num) => (
                          <SelectItem key={num} value={num.toString()}>
                            {num} {num === 1 ? 'cópia' : 'cópias'}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      Quantas cópias do recibo serão impressas
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          {/* Botões de Ação */}
          <div className="flex justify-end space-x-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => form.reset()}
              disabled={saveSettingsMutation.isPending}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={saveSettingsMutation.isPending}
            >
              {saveSettingsMutation.isPending ? "Salvando..." : "Salvar Configurações"}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
};

export default POSSettingsContent;