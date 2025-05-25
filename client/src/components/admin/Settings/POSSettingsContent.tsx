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
import { Slider } from "@/components/ui/slider";
import { Printer, Settings, FileText, DollarSign, ShoppingCart, User, Eye, Type } from "lucide-react";

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
  fontSettings: z.object({
    fontFamily: z.string().default("monospace"),
    fontSize: z.number().min(8).max(20).default(12),
    lineHeight: z.number().min(1).max(3).default(1.2),
    marginTop: z.number().min(0).max(50).default(10),
    marginBottom: z.number().min(0).max(50).default(10),
    marginLeft: z.number().min(0).max(50).default(10),
    marginRight: z.number().min(0).max(50).default(10),
  }),
  paperSettings: z.object({
    paperWidth: z.number().min(40).max(120).default(80), // largura em mm
    paperHeight: z.number().min(100).max(500).default(297), // altura em mm (apenas para modo fixo)
    heightMode: z.enum(['adaptive', 'fixed']).default('adaptive'), // modo de altura
    cutAfterPrint: z.boolean().default(true),
    reduceFooterSpace: z.boolean().default(true),
    exactHeight: z.boolean().default(true), // altura exata do conteúdo
    removePageMargins: z.boolean().default(true), // remover margens da página
    footerMargin: z.number().min(0).max(20).default(0), // margem inferior específica
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
      fontSettings: {
        fontFamily: "monospace",
        fontSize: 12,
        lineHeight: 1.2,
        marginTop: 10,
        marginBottom: 10,
        marginLeft: 10,
        marginRight: 10,
      },
      paperSettings: {
        paperWidth: 80,
        paperHeight: 297,
        heightMode: 'adaptive',
        cutAfterPrint: true,
        reduceFooterSpace: true,
        exactHeight: true,
        removePageMargins: true,
        footerMargin: 0,
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

  // Realtime para impressoras - comentado para evitar erro
  // useSupabaseRealtime("printers");

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
          font_settings: data.fontSettings,
          paper_settings: data.paperSettings,
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
      const testReceipt = generateTestReceiptContent(settings);
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
        fontSettings: currentSettings.font_settings || form.getValues("fontSettings"),
        paperSettings: currentSettings.paper_settings || form.getValues("paperSettings"),
        autoOpenCashDrawer: currentSettings.auto_open_cash_drawer || false,
        printCopies: currentSettings.print_copies || 1,
      });
    }
  }, [currentSettings, form]);

  // Função para gerar recibo de teste
  const generateTestReceiptContent = (settings: POSSettingsFormData): string => {
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

  // Função COMPLETAMENTE CORRIGIDA para impressão com debug detalhado
  const printReceipt = async (content: string, settings: POSSettingsFormData) => {
    try {
      console.log("🖨️ DEBUG - Iniciando impressão com configurações:", JSON.stringify(settings, null, 2));
      
      const { fontSettings, paperSettings } = settings;
      
      // DEBUG: Verificar se as configurações estão corretas
      console.log("🔍 DEBUG - Font Settings:", fontSettings);
      console.log("🔍 DEBUG - Paper Settings:", paperSettings);
      
      // Calcular linhas e altura do conteúdo de forma mais precisa
      const lines = content.split('\n');
      const nonEmptyLines = lines.filter(line => line.trim() !== '');
      const totalLines = lines.length; // Incluir linhas vazias para espaçamento correto
      
      // Calcular altura baseada na fonte e espaçamento
      const baseLineHeight = fontSettings.fontSize * fontSettings.lineHeight;
      const contentHeightPx = totalLines * baseLineHeight;
      
      console.log("📏 DEBUG - Cálculos:", {
        totalLines,
        fontSize: fontSettings.fontSize,
        lineHeight: fontSettings.lineHeight,
        baseLineHeight,
        contentHeightPx
      });
      
      // SEMPRE usar modo adaptativo para altura dinâmica
      const marginTopPx = fontSettings.marginTop;
      const marginBottomPx = fontSettings.marginBottom;
      const marginLeftPx = fontSettings.marginLeft;
      const marginRightPx = fontSettings.marginRight;
      
      // Calcular altura mais precisa sem margem excessiva
      const totalHeightPx = contentHeightPx + marginTopPx + marginBottomPx + 10; // Apenas 10px de segurança
      const totalHeightMm = Math.max(totalHeightPx / 3.779527, 25); // Mínimo reduzido para 25mm
      
      console.log("📐 DEBUG - Margens e altura:", {
        marginTopPx,
        marginBottomPx,
        marginLeftPx,
        marginRightPx,
        contentHeightPx,
        totalHeightPx,
        totalHeightMm: totalHeightMm.toFixed(1)
      });

      const printWindow = window.open('', '_blank', 'width=400,height=600');
      if (!printWindow) {
        throw new Error("Não foi possível abrir a janela de impressão");
      }

      // CSS OTIMIZADO para impressão completa e margens corretas
      const html = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <title>Recibo - Opa que Delícia</title>
          <style>
            @page {
              size: ${paperSettings.paperWidth}mm ${totalHeightMm.toFixed(1)}mm;
              margin: 0;
            }
            * {
              margin: 0;
              padding: 0;
              box-sizing: border-box;
            }
            html, body {
              width: ${paperSettings.paperWidth}mm;
              height: ${totalHeightMm.toFixed(1)}mm;
              font-family: ${fontSettings.fontFamily === 'monospace' ? "'Courier New', monospace" : 
                           fontSettings.fontFamily === 'sans-serif' ? "'Arial', sans-serif" : 
                           "'Times New Roman', serif"};
              font-size: ${fontSettings.fontSize}px;
              line-height: ${fontSettings.lineHeight};
              margin: 0;
              padding: 0;
              overflow: visible;
              background: white;
              white-space: pre-line;
            }
            .receipt-container {
              width: 100%;
              height: 100%;
              padding: ${marginTopPx}px ${marginRightPx}px ${marginBottomPx}px ${marginLeftPx}px;
              box-sizing: border-box;
              display: flex;
              flex-direction: column;
            }
            .receipt-content {
              flex: 1;
              width: 100%;
              word-wrap: break-word;
              overflow-wrap: break-word;
              white-space: pre-line;
            }
            @media print {
              @page {
                size: ${paperSettings.paperWidth}mm ${totalHeightMm.toFixed(1)}mm;
                margin: 0;
              }
              html, body {
                -webkit-print-color-adjust: exact;
                color-adjust: exact;
                print-color-adjust: exact;
                overflow: visible;
              }
              .receipt-container {
                page-break-inside: avoid;
                break-inside: avoid;
              }
            }
          </style>
        </head>
        <body>
          <div class="receipt-container">
            <div class="receipt-content">${content}</div>
          </div>
        </body>
        </html>
      `;

      console.log("🎨 DEBUG - HTML Gerado:", html.substring(0, 500) + "...");

      printWindow.document.write(html);
      printWindow.document.close();

      // Aguardar carregamento e imprimir com fechamento automático
      const handlePrintAndClose = () => {
        printWindow.focus();
        printWindow.print();
        
        // Fechar automaticamente após impressão
        setTimeout(() => {
          if (!printWindow.closed) {
            printWindow.close();
          }
        }, 2000);
      };

      // Aguardar carregamento completo
      if (printWindow.document.readyState === 'complete') {
        setTimeout(handlePrintAndClose, 500);
      } else {
        printWindow.addEventListener('load', () => {
          setTimeout(handlePrintAndClose, 500);
        });
        
        // Fallback
        setTimeout(() => {
          if (!printWindow.closed) {
            handlePrintAndClose();
          }
        }, 2000);
      }

      console.log("✅ DEBUG - Impressão enviada com sucesso:", {
        fontFamily: fontSettings.fontFamily,
        fontSize: `${fontSettings.fontSize}px`,
        lineHeight: fontSettings.lineHeight,
        marginTop: `${marginTopPx}px`,
        marginBottom: `${marginBottomPx}px`,
        marginLeft: `${marginLeftPx}px`,
        marginRight: `${marginRightPx}px`,
        paperWidth: `${paperSettings.paperWidth}mm`,
        totalHeight: `${totalHeightMm.toFixed(1)}mm`,
        totalLines,
        contentLines: nonEmptyLines.length
      });

    } catch (error) {
      console.error("❌ DEBUG - Erro na impressão:", error);
      Swal.fire({
        title: "Erro na Impressão",
        text: `Falha ao imprimir: ${error instanceof Error ? error.message : 'Erro desconhecido'}`,
        icon: "error",
        confirmButtonText: "Ok"
      });
    }
  };

  // Função exportada para uso no POS Mode
  useEffect(() => {
    (window as any).printReceiptWithSettings = async (content: string) => {
      if (!currentSettings) {
        Swal.fire({
          title: "Configurações não encontradas",
          text: "Configure as opções de impressão primeiro",
          icon: "warning",
          confirmButtonText: "Ok"
        });
        return;
      }

      const settings: POSSettingsFormData = {
        printerId: currentSettings.printer_id || "",
        printOptions: currentSettings.print_options || form.getValues("printOptions"),
        fontSettings: currentSettings.font_settings || form.getValues("fontSettings"),
        paperSettings: currentSettings.paper_settings || form.getValues("paperSettings"),
        autoOpenCashDrawer: currentSettings.auto_open_cash_drawer || false,
        printCopies: currentSettings.print_copies || 1,
      };

      await printReceipt(content, settings);
    };
  }, [currentSettings, form]);

  // Função CORRIGIDA para renderizar preview dinâmico com debug
  const renderPreview = () => {
    const currentSettings = form.getValues();
    const { fontSettings, paperSettings } = currentSettings;
    
    // Simular conteúdo de recibo usando a função correta
    const sampleContent = generateTestReceiptContent(currentSettings);
    
    // DEBUG: Log das configurações atuais
    console.log("🎨 Preview DEBUG - Settings:", {
      fontFamily: fontSettings.fontFamily,
      fontSize: fontSettings.fontSize,
      lineHeight: fontSettings.lineHeight,
      margins: {
        top: fontSettings.marginTop,
        bottom: fontSettings.marginBottom,
        left: fontSettings.marginLeft,
        right: fontSettings.marginRight
      },
      paperWidth: paperSettings.paperWidth,
      heightMode: paperSettings.heightMode
    });
    
    // Calcular dimensões precisas
    const paperWidthPx = paperSettings.paperWidth * 3.779527;
    const allLines = sampleContent.split('\n');
    const nonEmptyLines = allLines.filter(line => line.trim() !== '');
    const lineHeight = fontSettings.fontSize * fontSettings.lineHeight;
    const contentHeight = allLines.length * lineHeight; // Incluir linhas vazias
    
    // SEMPRE usar altura adaptativa no preview com cálculo mais preciso
    const totalHeight = Math.max(
      contentHeight + fontSettings.marginTop + fontSettings.marginBottom + 10,
      80
    );
    const totalHeightMm = totalHeight / 3.779527;

    console.log("📏 Preview DEBUG - Cálculos:", {
      allLines: allLines.length,
      nonEmptyLines: nonEmptyLines.length,
      lineHeight,
      contentHeight,
      totalHeight,
      totalHeightMm: totalHeightMm.toFixed(1)
    });

    return (
      <div className="space-y-2">
        <div className="text-xs text-gray-500 mb-2 px-2 py-1 bg-gray-100 rounded">
          📊 Preview: {paperSettings.paperWidth}mm x {totalHeightMm.toFixed(1)}mm 
          | {allLines.length} linhas total ({nonEmptyLines.length} com conteúdo)
          | Altura: SEMPRE Adaptativa
        </div>
        
        <div 
          className="border-2 border-blue-300 bg-white shadow-lg mx-auto relative"
          style={{
            width: `${paperWidthPx}px`,
            height: `${totalHeight}px`,
            fontFamily: fontSettings.fontFamily === 'monospace' ? 'Courier New, monospace' : 
                       fontSettings.fontFamily === 'sans-serif' ? 'Arial, sans-serif' : 
                       'Times New Roman, serif',
            fontSize: `${fontSettings.fontSize}px`,
            lineHeight: fontSettings.lineHeight,
            padding: `${fontSettings.marginTop}px ${fontSettings.marginRight}px ${fontSettings.marginBottom}px ${fontSettings.marginLeft}px`,
            whiteSpace: 'pre-line',
            maxWidth: `${paperWidthPx}px`,
            wordWrap: 'break-word',
            overflow: 'hidden',
            boxSizing: 'border-box',
          }}
        >
          {sampleContent}
          
          {/* Indicadores visuais das margens */}
          <div 
            className="absolute top-0 left-0 right-0 bg-red-200 opacity-50 pointer-events-none"
            style={{ height: `${fontSettings.marginTop}px` }}
            title={`Margem Superior: ${fontSettings.marginTop}px`}
          />
          <div 
            className="absolute bottom-0 left-0 right-0 bg-red-200 opacity-50 pointer-events-none"
            style={{ height: `${fontSettings.marginBottom}px` }}
            title={`Margem Inferior: ${fontSettings.marginBottom}px`}
          />
          <div 
            className="absolute top-0 bottom-0 left-0 bg-red-200 opacity-50 pointer-events-none"
            style={{ width: `${fontSettings.marginLeft}px` }}
            title={`Margem Esquerda: ${fontSettings.marginLeft}px`}
          />
          <div 
            className="absolute top-0 bottom-0 right-0 bg-red-200 opacity-50 pointer-events-none"
            style={{ width: `${fontSettings.marginRight}px` }}
            title={`Margem Direita: ${fontSettings.marginRight}px`}
          />
        </div>
        
        <div className="text-xs space-y-1">
          <div className="text-green-600 px-2 text-center font-medium">
            ✅ Altura SEMPRE Adaptativa | Margens Aplicadas em Pixels
          </div>
          <div className="text-blue-600 px-2 text-center text-xs">
            🔍 Margens: T{fontSettings.marginTop}px | B{fontSettings.marginBottom}px | L{fontSettings.marginLeft}px | R{fontSettings.marginRight}px
          </div>
          <div className="text-purple-600 px-2 text-center text-xs">
            📝 Fonte: {fontSettings.fontFamily} | {fontSettings.fontSize}px | Linha: {fontSettings.lineHeight}
          </div>
        </div>
      </div>
    );
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

          {/* Seção de Configurações de Fonte e Layout */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Type className="w-5 h-5" />
                <span>Configurações de Fonte e Layout</span>
              </CardTitle>
              <CardDescription>
                Personalize a aparência do recibo impresso
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <FormField
                    control={form.control}
                    name="fontSettings.fontFamily"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Família da Fonte</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="monospace">Monospace (Courier New)</SelectItem>
                            <SelectItem value="sans-serif">Sans-serif (Arial)</SelectItem>
                            <SelectItem value="serif">Serif (Times New Roman)</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormDescription>Tipo de fonte para o recibo</FormDescription>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="fontSettings.fontSize"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Tamanho da Fonte: {field.value}px</FormLabel>
                        <FormControl>
                          <Slider
                            min={8}
                            max={20}
                            step={1}
                            value={[field.value]}
                            onValueChange={(value) => field.onChange(value[0])}
                            className="w-full"
                          />
                        </FormControl>
                        <FormDescription>Tamanho da fonte do recibo</FormDescription>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="fontSettings.lineHeight"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Espaçamento entre Linhas: {field.value}</FormLabel>
                        <FormControl>
                          <Slider
                            min={1}
                            max={3}
                            step={0.1}
                            value={[field.value]}
                            onValueChange={(value) => field.onChange(value[0])}
                            className="w-full"
                          />
                        </FormControl>
                        <FormDescription>Espaçamento vertical entre as linhas</FormDescription>
                      </FormItem>
                    )}
                  />
                </div>

                <div className="space-y-4">
                  <h4 className="font-medium">Margens (em pixels)</h4>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="fontSettings.marginTop"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Superior: {field.value}px</FormLabel>
                          <FormControl>
                            <Slider
                              min={0}
                              max={50}
                              step={1}
                              value={[field.value]}
                              onValueChange={(value) => field.onChange(value[0])}
                              className="w-full"
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="fontSettings.marginBottom"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Inferior: {field.value}px</FormLabel>
                          <FormControl>
                            <Slider
                              min={0}
                              max={50}
                              step={1}
                              value={[field.value]}
                              onValueChange={(value) => field.onChange(value[0])}
                              className="w-full"
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="fontSettings.marginLeft"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Esquerda: {field.value}px</FormLabel>
                          <FormControl>
                            <Slider
                              min={0}
                              max={50}
                              step={1}
                              value={[field.value]}
                              onValueChange={(value) => field.onChange(value[0])}
                              className="w-full"
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="fontSettings.marginRight"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Direita: {field.value}px</FormLabel>
                          <FormControl>
                            <Slider
                              min={0}
                              max={50}
                              step={1}
                              value={[field.value]}
                              onValueChange={(value) => field.onChange(value[0])}
                              className="w-full"
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Seção de Preview em Tempo Real */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Eye className="w-5 h-5" />
                <span>Preview do Recibo</span>
              </CardTitle>
              <CardDescription>
                Visualização em tempo real de como o recibo será impresso
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="border rounded-lg bg-gray-50 p-4">
                <h4 className="text-sm font-medium mb-3 text-gray-700">
                  Simulação da Impressão:
                </h4>
                {renderPreview()}
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