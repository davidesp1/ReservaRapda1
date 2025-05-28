import React, { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/contexts/AuthContext";
import AdminLayout from "@/components/layouts/AdminLayout";
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
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useQuery } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import {
  Search,
  TrendingUp,
  Clock,
  XCircle,
  CheckCircle,
  Filter,
  FileDown,
  CreditCard,
  Banknote,
  Smartphone,
  Building,
  ArrowLeftRight,
  FileText,
  FileSpreadsheet,
  FileType,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface Payment {
  id: number;
  transaction_id: string;
  reference: string;
  amount: number;
  method: string;
  status: string;
  payment_date: string;
  user_id: number;
  details?: any;
}

interface PaymentWithUser extends Payment {
  username?: string;
  first_name?: string;
  last_name?: string;
  email?: string;
}

const Finance: React.FC = () => {
  const { t } = useTranslation();
  const { isAuthenticated, isAdmin, user } = useAuth();
  const [currentTab, setCurrentTab] = useState("pagamentos");
  const [searchText, setSearchText] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [methodFilter, setMethodFilter] = useState<string>("");
  const [filteredPayments, setFilteredPayments] = useState<PaymentWithUser[]>(
    [],
  );
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const { toast } = useToast();

  // Fetch payments com atualização em tempo real
  const {
    data: payments,
    isLoading: paymentsLoading,
    refetch,
  } = useQuery<PaymentWithUser[]>({
    queryKey: ["/api/payments"],
    enabled: isAuthenticated && isAdmin,
    refetchInterval: 10000, // Atualiza a cada 10 segundos para realtime
    refetchIntervalInBackground: true,
  });

  // Aplicar filtros
  const applyFilters = () => {
    if (!payments) {
      setFilteredPayments([]);
      return;
    }

    let filtered = [...payments];

    // Filtro de busca
    if (searchText) {
      filtered = filtered.filter(
        (payment) =>
          payment.transaction_id
            ?.toLowerCase()
            .includes(searchText.toLowerCase()) ||
          payment.reference?.toLowerCase().includes(searchText.toLowerCase()) ||
          payment.username?.toLowerCase().includes(searchText.toLowerCase()) ||
          payment.first_name
            ?.toLowerCase()
            .includes(searchText.toLowerCase()) ||
          payment.last_name?.toLowerCase().includes(searchText.toLowerCase()),
      );
    }

    // Filtro de data
    if (startDate) {
      filtered = filtered.filter(
        (payment) => new Date(payment.payment_date) >= new Date(startDate),
      );
    }

    if (endDate) {
      filtered = filtered.filter(
        (payment) =>
          new Date(payment.payment_date) <= new Date(endDate + "T23:59:59"),
      );
    }

    // Filtro de status
    if (statusFilter) {
      filtered = filtered.filter((payment) => payment.status === statusFilter);
    }

    // Filtro de método
    if (methodFilter) {
      filtered = filtered.filter((payment) => payment.method === methodFilter);
    }

    setFilteredPayments(filtered);
  };

  // Aplicar filtros automaticamente quando os dados mudarem
  useEffect(() => {
    applyFilters();
  }, [payments, searchText, startDate, endDate, statusFilter, methodFilter]);

  // Calcular totais
  const totals = React.useMemo(() => {
    if (!payments)
      return {
        totalRevenue: 0,
        completedPayments: 0,
        pendingPayments: 0,
        failedPayments: 0,
      };

    const completed = payments.filter((p) => p.status === "completed");
    const pending = payments.filter((p) => p.status === "pending");
    const failed = payments.filter((p) => p.status === "failed");

    const totalRevenue = completed.reduce((sum, p) => sum + p.amount, 0);

    return {
      totalRevenue,
      completedPayments: completed.length,
      pendingPayments: pending.length,
      failedPayments: failed.length,
    };
  }, [payments]);

  // Formato de preço
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("pt-PT", {
      style: "currency",
      currency: "EUR",
      minimumFractionDigits: 2,
    }).format(price / 100);
  };

  // Ícone e badge do método de pagamento
  const getPaymentMethodBadge = (method: string) => {
    switch (method?.toLowerCase()) {
      case "cash":
      case "dinheiro":
        return (
          <div className="flex items-center gap-2 px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-medium">
            <Banknote className="w-4 h-4" />
            Dinheiro
          </div>
        );
      case "card":
      case "cartao":
        return (
          <div className="flex items-center gap-2 px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
            <CreditCard className="w-4 h-4" />
            Cartão
          </div>
        );
      case "mbway":
        return (
          <div className="flex items-center gap-2 px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-sm font-medium">
            <Smartphone className="w-4 h-4" />
            MB Way
          </div>
        );
      case "multibanco":
        return (
          <div className="flex items-center gap-2 px-3 py-1 bg-purple-100 text-purple-800 rounded-full text-sm font-medium">
            <Building className="w-4 h-4" />
            Multibanco
          </div>
        );
      case "multibanco_tpa":
        return (
          <div className="flex items-center gap-2 px-3 py-1 bg-indigo-100 text-indigo-800 rounded-full text-sm font-medium">
            <CreditCard className="w-4 h-4" />
            Multibanco (TPA)
          </div>
        );
      case "transfer":
        return (
          <div className="flex items-center gap-2 px-3 py-1 bg-teal-100 text-teal-800 rounded-full text-sm font-medium">
            <ArrowLeftRight className="w-4 h-4" />
            Transferência
          </div>
        );
      default:
        return (
          <div className="flex items-center gap-2 px-3 py-1 bg-gray-100 text-gray-800 rounded-full text-sm font-medium">
            <CreditCard className="w-4 h-4" />
            {method || 'N/A'}
          </div>
        );
    }
  };

  // Badge do status
  const getStatusBadge = (status: string) => {
    switch (status?.toLowerCase()) {
      case "completed":
        return (
          <Badge className="bg-green-100 text-green-800 hover:bg-green-100">
            <CheckCircle className="w-3 h-3 mr-1" />
            Concluído
          </Badge>
        );
      case "pending":
        return (
          <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100">
            <Clock className="w-3 h-3 mr-1" />
            Pendente
          </Badge>
        );
      case "failed":
        return (
          <Badge className="bg-red-100 text-red-800 hover:bg-red-100">
            <XCircle className="w-3 h-3 mr-1" />
            Falha
          </Badge>
        );
      default:
        return (
          <Badge className="bg-gray-100 text-gray-800 hover:bg-gray-100">
            {status}
          </Badge>
        );
    }
  };

  // Preparar dados para exportação
  const prepareExportData = () => {
    const currentDate = new Date().toLocaleDateString('pt-PT');
    const totalAmount = filteredPayments.reduce((sum, payment) => sum + payment.amount, 0);
    
    const headers = ['Data', 'Transação', 'Referência', 'Valor', 'Método', 'Usuário', 'Status'];
    
    const data = filteredPayments.map(payment => [
      format(new Date(payment.payment_date), 'dd/MM/yyyy'),
      payment.transaction_id,
      payment.reference,
      formatPrice(payment.amount),
      payment.method === 'cash' ? 'Dinheiro' :
      payment.method === 'card' ? 'Cartão' :
      payment.method === 'mbway' ? 'MB Way' :
      payment.method === 'multibanco' ? 'Multibanco' :
      payment.method === 'multibanco_TPA' ? 'Multibanco (TPA)' :
      payment.method === 'transfer' ? 'Transferência' : payment.method,
      `${payment.first_name || ''} ${payment.last_name || ''}`.trim() || payment.username || 'N/A',
      payment.status === 'completed' ? 'Concluído' :
      payment.status === 'pending' ? 'Pendente' :
      payment.status === 'failed' ? 'Falhado' : payment.status
    ]);

    return { headers, data, currentDate, totalAmount };
  };

  // Exportar para Excel
  const exportToExcel = async () => {
    try {
      const XLSX = await import('xlsx');
      const { headers, data, currentDate, totalAmount } = prepareExportData();

      // Criar workbook
      const workbook = XLSX.utils.book_new();
      
      // Criar dados da planilha com cabeçalho informativo
      const worksheetData = [
        ['Relatório de Pagamentos'],
        [`Data de emissão: ${currentDate}`],
        [`Total de registros: ${filteredPayments.length}`],
        [`Valor total: ${formatPrice(totalAmount)}`],
        [], // Linha vazia
        headers,
        ...data
      ];

      // Criar worksheet
      const worksheet = XLSX.utils.aoa_to_sheet(worksheetData);
      
      // Adicionar worksheet ao workbook
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Pagamentos');

      // Salvar arquivo
      const fileName = `pagamentos_${currentDate.replace(/\//g, '-')}.xlsx`;
      XLSX.writeFile(workbook, fileName);

      toast({
        title: "Exportação concluída",
        description: `Arquivo Excel ${fileName} foi baixado com sucesso.`,
      });

      setIsExportModalOpen(false);
    } catch (error) {
      console.error('Erro ao exportar Excel:', error);
      toast({
        title: "Erro na exportação",
        description: "Ocorreu um erro ao gerar o arquivo Excel.",
        variant: "destructive"
      });
    }
  };

  // Exportar para CSV
  const exportToCSV = () => {
    try {
      const { headers, data, currentDate, totalAmount } = prepareExportData();

      // Criar conteúdo CSV
      const csvContent = [
        `Relatório de Pagamentos - ${currentDate}`,
        `Total de registros: ${filteredPayments.length}`,
        `Valor total: ${formatPrice(totalAmount)}`,
        '',
        headers.join(','),
        ...data.map(row => row.join(','))
      ].join('\n');

      // Criar e baixar arquivo
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `pagamentos_${currentDate.replace(/\//g, '-')}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast({
        title: "Exportação concluída",
        description: "Arquivo CSV baixado com sucesso.",
      });

      setIsExportModalOpen(false);
    } catch (error) {
      console.error('Erro ao exportar CSV:', error);
      toast({
        title: "Erro na exportação",
        description: "Ocorreu um erro ao gerar o arquivo CSV.",
        variant: "destructive"
      });
    }
  };

  // Exportar para PDF
  const exportToPDF = async () => {
    try {
      toast({
        title: "Criando PDF elegante...",
        description: "Preparando documento com design moderno...",
      });

      const { headers, data, currentDate, totalAmount } = prepareExportData();
      
      // Importar bibliotecas dinamicamente
      const [{ jsPDF }, autoTable] = await Promise.all([
        import('jspdf'),
        import('jspdf-autotable')
      ]);
      
      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.width;
      const pageHeight = doc.internal.pageSize.height;
      
      // Cores do design moderno
      const primaryColor = [37, 99, 235]; // Azul elegante
      const secondaryColor = [99, 102, 241]; // Roxo moderno
      const accentColor = [16, 185, 129]; // Verde esmeralda
      const textDark = [31, 41, 55]; // Cinza escuro
      const textLight = [107, 114, 128]; // Cinza claro
      const backgroundLight = [248, 250, 252]; // Fundo claro
      
      // CABEÇALHO ELEGANTE
      // Fundo do cabeçalho com gradiente simulado
      doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
      doc.rect(0, 0, pageWidth, 45, 'F');
      
      // Linha de acento
      doc.setFillColor(accentColor[0], accentColor[1], accentColor[2]);
      doc.rect(0, 45, pageWidth, 3, 'F');
      
      // Título principal
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(24);
      doc.setFont('helvetica', 'bold');
      doc.text('RELATÓRIO DE PAGAMENTOS', 20, 25);
      
      // Subtítulo
      doc.setFontSize(12);
      doc.setFont('helvetica', 'normal');
      doc.text('Análise Financeira Detalhada', 20, 38);
      
      // SEÇÃO DE INFORMAÇÕES RESUMO
      let yPos = 65;
      
      // Box de informações com fundo
      doc.setFillColor(backgroundLight[0], backgroundLight[1], backgroundLight[2]);
      doc.roundedRect(15, yPos - 5, pageWidth - 30, 35, 5, 5, 'F');
      
      // Informações do relatório com ícones simulados
      doc.setTextColor(textDark[0], textDark[1], textDark[2]);
      doc.setFontSize(11);
      doc.setFont('helvetica', 'bold');
      
      // Data de emissão
      doc.setTextColor(textDark[0], textDark[1], textDark[2]);
      doc.setFontSize(11);
      doc.setFont('helvetica', 'bold');
      doc.text('Data de Emissao:', 25, yPos + 8);
      doc.setFont('helvetica', 'normal');
      doc.text(currentDate, 75, yPos + 8);
      
      // Total de registros
      doc.setFont('helvetica', 'bold');
      doc.text('Total de Registros:', 25, yPos + 18);
      doc.setFont('helvetica', 'normal');
      doc.text(filteredPayments.length.toString(), 85, yPos + 18);
      
      // Valor total destacado
      doc.setTextColor(accentColor[0], accentColor[1], accentColor[2]);
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text('Valor Total:', 120, yPos + 13);
      doc.text(formatPrice(totalAmount), 165, yPos + 13);
      
      yPos += 45;
      
      // FILTROS APLICADOS (se houver)
      const filtersApplied = [];
      if (searchText) filtersApplied.push(`Busca: ${searchText}`);
      if (startDate || endDate) filtersApplied.push(`Período: ${startDate || 'Início'} até ${endDate || 'Fim'}`);
      if (statusFilter) filtersApplied.push(`Status: ${statusFilter}`);
      if (methodFilter) {
        const methodNames: Record<string, string> = {
          'cash': 'Dinheiro', 'card': 'Cartão', 'mbway': 'MB Way',
          'multibanco': 'Multibanco', 'multibanco_TPA': 'Multibanco (TPA)', 'transfer': 'Transferência'
        };
        filtersApplied.push(`Método: ${methodNames[methodFilter] || methodFilter}`);
      }
      
      if (filtersApplied.length > 0) {
        doc.setTextColor(textDark[0], textDark[1], textDark[2]);
        doc.setFontSize(10);
        doc.setFont('helvetica', 'bold');
        doc.text('FILTROS APLICADOS:', 20, yPos);
        
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(textLight[0], textLight[1], textLight[2]);
        filtersApplied.forEach((filter, index) => {
          doc.text(`- ${filter}`, 25, yPos + 10 + (index * 7));
        });
        yPos += 15 + (filtersApplied.length * 7);
      }
      
      // Preparar dados da tabela
      const tableRows = data.map(row => [
        row[0], row[1], row[2], row[3], row[4], row[5], row[6]
      ]);
      
      // Usar setTimeout para garantir carregamento
      setTimeout(() => {
        try {
          // TABELA MODERNA E ELEGANTE
          (doc as any).autoTable({
            head: [headers],
            body: tableRows,
            startY: yPos + 10,
            
            // Estilos gerais
            styles: {
              fontSize: 9,
              cellPadding: { top: 8, right: 6, bottom: 8, left: 6 },
              lineColor: [229, 231, 235],
              lineWidth: 0.5,
              textColor: textDark,
              font: 'helvetica'
            },
            
            // Cabeçalho elegante
            headStyles: {
              fillColor: primaryColor,
              textColor: [255, 255, 255],
              fontStyle: 'bold',
              fontSize: 10,
              halign: 'center',
              cellPadding: { top: 12, right: 6, bottom: 12, left: 6 }
            },
            
            // Estilos das colunas
            columnStyles: {
              0: { cellWidth: 25, halign: 'center' }, // Data
              1: { cellWidth: 35, halign: 'left' },   // Transação
              2: { cellWidth: 22, halign: 'center' }, // Referência
              3: { cellWidth: 28, halign: 'right', fontStyle: 'bold', textColor: accentColor }, // Valor
              4: { cellWidth: 30, halign: 'center' }, // Método
              5: { cellWidth: 35, halign: 'left' },   // Usuário
              6: { cellWidth: 25, halign: 'center' }  // Status
            },
            
            // Linhas alternadas elegantes
            alternateRowStyles: {
              fillColor: [249, 250, 251]
            },
            
            // Margens e tema
            margin: { top: 15, right: 15, bottom: 15, left: 15 },
            theme: 'grid',
            
            // Callback para personalizar células
            didParseCell: function(data: any) {
              // Colorir status
              if (data.column.index === 6) {
                const status = data.cell.text[0].toLowerCase();
                if (status.includes('concluído') || status.includes('completed')) {
                  data.cell.styles.textColor = [16, 185, 129]; // Verde
                  data.cell.styles.fontStyle = 'bold';
                } else if (status.includes('pendente') || status.includes('pending')) {
                  data.cell.styles.textColor = [245, 158, 11]; // Amarelo
                  data.cell.styles.fontStyle = 'bold';
                } else if (status.includes('falhou') || status.includes('failed')) {
                  data.cell.styles.textColor = [239, 68, 68]; // Vermelho
                  data.cell.styles.fontStyle = 'bold';
                }
              }
              
              // Destacar métodos de pagamento
              if (data.column.index === 4) {
                data.cell.styles.fontStyle = 'bold';
                data.cell.styles.textColor = secondaryColor;
              }
            }
          });
          
          // RODAPÉ ELEGANTE
          const finalY = (doc as any).lastAutoTable.finalY || pageHeight - 50;
          
          // Linha decorativa
          doc.setDrawColor(primaryColor[0], primaryColor[1], primaryColor[2]);
          doc.setLineWidth(2);
          doc.line(20, finalY + 20, pageWidth - 20, finalY + 20);
          
          // Informações do rodapé
          doc.setTextColor(textLight[0], textLight[1], textLight[2]);
          doc.setFontSize(8);
          doc.setFont('helvetica', 'normal');
          
          const now = new Date();
          const timestamp = now.toLocaleString('pt-PT', {
            day: '2-digit', month: '2-digit', year: 'numeric',
            hour: '2-digit', minute: '2-digit'
          });
          
          doc.text(`Gerado em ${timestamp}`, 20, finalY + 35);
          doc.text(`Sistema de Gestão Financeira`, pageWidth - 20, finalY + 35, { align: 'right' });
          
          // Numeração de página elegante
          const pageCount = doc.getNumberOfPages();
          for (let i = 1; i <= pageCount; i++) {
            doc.setPage(i);
            doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
            doc.circle(pageWidth - 25, pageHeight - 25, 8, 'F');
            doc.setTextColor(255, 255, 255);
            doc.setFontSize(10);
            doc.setFont('helvetica', 'bold');
            doc.text(`${i}`, pageWidth - 25, pageHeight - 22, { align: 'center' });
          }
          
          // Salvar arquivo
          const fileName = `relatorio-pagamentos-${currentDate.replace(/\//g, '-')}.pdf`;
          doc.save(fileName);
          
          toast({
            title: "PDF elegante criado! ✨",
            description: `Documento ${fileName} baixado com design moderno.`,
          });
          
          setIsExportModalOpen(false);
          
        } catch (tableError) {
          console.error('Erro na tabela:', tableError);
          
          // Fallback elegante
          doc.setTextColor(textDark[0], textDark[1], textDark[2]);
          doc.setFontSize(12);
          doc.setFont('helvetica', 'bold');
          doc.text('DADOS DO RELATORIO', 20, yPos + 20);
          
          filteredPayments.slice(0, 15).forEach((payment, index) => {
            const y = yPos + 40 + (index * 12);
            doc.setFontSize(10);
            doc.setFont('helvetica', 'normal');
            
            doc.setTextColor(textDark[0], textDark[1], textDark[2]);
            doc.text(`${format(new Date(payment.payment_date), 'dd/MM/yyyy')}`, 20, y);
            doc.text(`${payment.transaction_id}`, 60, y);
            
            doc.setTextColor(accentColor[0], accentColor[1], accentColor[2]);
            doc.setFont('helvetica', 'bold');
            doc.text(`${formatPrice(payment.amount)}`, 120, y);
            
            doc.setTextColor(secondaryColor[0], secondaryColor[1], secondaryColor[2]);
            doc.setFont('helvetica', 'normal');
            doc.text(`${payment.method}`, 160, y);
          });
          
          const fileName = `relatorio-pagamentos-${currentDate.replace(/\//g, '-')}.pdf`;
          doc.save(fileName);
          
          toast({
            title: "PDF criado (formato alternativo)",
            description: "Documento gerado com design simplificado mas elegante.",
          });
          
          setIsExportModalOpen(false);
        }
      }, 300);
      
    } catch (error) {
      console.error('Erro ao criar PDF:', error);
      toast({
        title: "Erro na criação do PDF",
        description: "Tente usar Excel ou CSV como alternativa.",
        variant: "destructive"
      });
      setIsExportModalOpen(false);
    }
  };

  if (paymentsLoading) {
    return (
      <AdminLayout title={t("Finance")}>
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-32 bg-gray-200 rounded-xl"></div>
            ))}
          </div>
          <div className="h-96 bg-gray-200 rounded-xl"></div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title="Finanças">
      <div className="space-y-8">
        {/* Header */}
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold text-gray-900">Finanças</h1>
        </div>

        {/* Metrics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Receita Total */}
          <div className="bg-white rounded-xl shadow-md p-6 border-t-4 border-green-500">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm text-gray-500 font-medium">
                  Receita Total
                </p>
                <p className="text-2xl font-bold text-gray-800 mt-1">
                  {formatPrice(totals.totalRevenue)}
                </p>
                <div className="flex items-center mt-2 text-sm">
                  <TrendingUp className="w-4 h-4 text-green-500 mr-1" />
                  <span className="text-green-500 font-medium">+7%</span>
                  <span className="text-gray-500 ml-1">
                    em relação ao mês passado
                  </span>
                </div>
              </div>
              <div className="bg-green-100 p-3 rounded-lg">
                <TrendingUp className="w-6 h-6 text-green-500" />
              </div>
            </div>
          </div>

          {/* Pagamentos Concluídos */}
          <div className="bg-white rounded-xl shadow-md p-6 border-t-4 border-blue-600">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm text-gray-500 font-medium">
                  Pagamentos Concluídos
                </p>
                <p className="text-2xl font-bold text-gray-800 mt-1">
                  {totals.completedPayments}
                </p>
                <div className="flex items-center mt-2 text-sm">
                  <CheckCircle className="w-4 h-4 text-blue-600 mr-1" />
                  <span className="text-blue-600 font-medium">
                    {payments
                      ? Math.round(
                          (totals.completedPayments / payments.length) * 100,
                        )
                      : 0}
                    %
                  </span>
                  <span className="text-gray-500 ml-1">do total</span>
                </div>
              </div>
              <div className="bg-blue-100 p-3 rounded-lg">
                <CheckCircle className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </div>

          {/* Pagamentos Pendentes */}
          <div className="bg-white rounded-xl shadow-md p-6 border-t-4 border-yellow-500">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm text-gray-500 font-medium">
                  Pagamentos Pendentes
                </p>
                <p className="text-2xl font-bold text-gray-800 mt-1">
                  {totals.pendingPayments}
                </p>
                <div className="flex items-center mt-2 text-sm">
                  <Clock className="w-4 h-4 text-yellow-500 mr-1" />
                  <span className="text-yellow-500 font-medium">
                    {payments
                      ? Math.round(
                          (totals.pendingPayments / payments.length) * 100,
                        )
                      : 0}
                    %
                  </span>
                  <span className="text-gray-500 ml-1">do total</span>
                </div>
              </div>
              <div className="bg-yellow-100 p-3 rounded-lg">
                <Clock className="w-6 h-6 text-yellow-500" />
              </div>
            </div>
          </div>

          {/* Falhas de Pagamento */}
          <div className="bg-white rounded-xl shadow-md p-6 border-t-4 border-red-500">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm text-gray-500 font-medium">
                  Falhas de Pagamento
                </p>
                <p className="text-2xl font-bold text-gray-800 mt-1">
                  {totals.failedPayments}
                </p>
                <div className="flex items-center mt-2 text-sm">
                  <XCircle className="w-4 h-4 text-red-500 mr-1" />
                  <span className="text-red-500 font-medium">
                    {payments
                      ? Math.round(
                          (totals.failedPayments / payments.length) * 100,
                        )
                      : 0}
                    %
                  </span>
                  <span className="text-gray-500 ml-1">do total</span>
                </div>
              </div>
              <div className="bg-red-100 p-3 rounded-lg">
                <XCircle className="w-6 h-6 text-red-500" />
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="w-full">
          <div className="flex border-b border-gray-200 mb-4">
            <button
              onClick={() => setCurrentTab("pagamentos")}
              className={`px-6 py-3 font-semibold rounded-t-lg focus:outline-none ${
                currentTab === "pagamentos"
                  ? "text-blue-600 border-b-2 border-blue-600 bg-white"
                  : "text-gray-500 hover:text-blue-600 bg-white"
              }`}
            >
              Pagamentos
            </button>
            <button
              onClick={() => setCurrentTab("analise")}
              className={`px-6 py-3 font-semibold rounded-t-lg focus:outline-none ml-2 ${
                currentTab === "analise"
                  ? "text-blue-600 border-b-2 border-blue-600 bg-white"
                  : "text-gray-500 hover:text-blue-600 bg-white"
              }`}
            >
              Análise
            </button>
          </div>

          {currentTab === "pagamentos" && (
            <div className="space-y-6">
              {/* Filtros */}
              <div className="flex flex-wrap items-end gap-4">
                <div className="flex-1 min-w-[180px]">
                  <label className="block text-xs text-gray-600 mb-1 font-semibold">
                    Pesquisar
                  </label>
                  <div className="relative">
                    <Input
                      type="text"
                      value={searchText}
                      onChange={(e) => setSearchText(e.target.value)}
                      className="pl-10"
                      placeholder="Buscar por transação, reserva ou usuário..."
                    />
                    <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
                  </div>
                </div>

                <div className="min-w-[150px]">
                  <label className="block text-xs text-gray-600 mb-1 font-semibold">
                    Data Início
                  </label>
                  <Input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                  />
                </div>

                <div className="min-w-[150px]">
                  <label className="block text-xs text-gray-600 mb-1 font-semibold">
                    Data Fim
                  </label>
                  <Input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                  />
                </div>

                <div className="min-w-[150px]">
                  <label className="block text-xs text-gray-600 mb-1 font-semibold">
                    Status
                  </label>
                  <Select
                    value={statusFilter || "all"}
                    onValueChange={(value) =>
                      setStatusFilter(value === "all" ? "" : value)
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Todos" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos</SelectItem>
                      <SelectItem value="completed">Concluído</SelectItem>
                      <SelectItem value="pending">Pendente</SelectItem>
                      <SelectItem value="failed">Falha</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="min-w-[150px]">
                  <label className="block text-xs text-gray-600 mb-1 font-semibold">
                    Método
                  </label>
                  <Select
                    value={methodFilter || "all"}
                    onValueChange={(value) =>
                      setMethodFilter(value === "all" ? "" : value)
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Todos" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos</SelectItem>
                      <SelectItem value="cash">Dinheiro</SelectItem>
                      <SelectItem value="card">Cartão</SelectItem>
                      <SelectItem value="mbway">MB Way</SelectItem>
                      <SelectItem value="multibanco">Multibanco</SelectItem>
                      <SelectItem value="multibanco_TPA">
                        Multibanco (TPA)
                      </SelectItem>
                      <SelectItem value="transfer">Transferência</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex gap-2">
                  <Dialog open={isExportModalOpen} onOpenChange={setIsExportModalOpen}>
                    <DialogTrigger asChild>
                      <Button className="bg-yellow-500 hover:bg-yellow-600 text-blue-900">
                        <FileDown className="w-4 h-4 mr-2" />
                        Exportar
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-md">
                      <DialogHeader>
                        <DialogTitle>Exportar Pagamentos</DialogTitle>
                        <DialogDescription>
                          Escolha o formato para exportar os dados filtrados ({filteredPayments.length} registros)
                        </DialogDescription>
                      </DialogHeader>
                      <div className="flex flex-col gap-3 py-4">
                        <Button
                          onClick={exportToPDF}
                          className="w-full justify-start bg-red-600 hover:bg-red-700 text-white"
                          disabled={filteredPayments.length === 0}
                        >
                          <FileType className="w-5 h-5 mr-3" />
                          <div className="text-left">
                            <div className="font-semibold">PDF</div>
                            <div className="text-sm opacity-90">Documento PDF com tabela formatada</div>
                          </div>
                        </Button>
                        
                        <Button
                          onClick={exportToExcel}
                          className="w-full justify-start bg-green-600 hover:bg-green-700 text-white"
                          disabled={filteredPayments.length === 0}
                        >
                          <FileSpreadsheet className="w-5 h-5 mr-3" />
                          <div className="text-left">
                            <div className="font-semibold">Excel (XLSX)</div>
                            <div className="text-sm opacity-90">Planilha do Excel com formatação</div>
                          </div>
                        </Button>
                        
                        <Button
                          onClick={exportToCSV}
                          className="w-full justify-start bg-blue-600 hover:bg-blue-700 text-white"
                          disabled={filteredPayments.length === 0}
                        >
                          <FileText className="w-5 h-5 mr-3" />
                          <div className="text-left">
                            <div className="font-semibold">CSV</div>
                            <div className="text-sm opacity-90">Arquivo de texto separado por vírgulas</div>
                          </div>
                        </Button>
                      </div>
                      {filteredPayments.length === 0 && (
                        <div className="text-center text-sm text-gray-500 py-2">
                          Nenhum dado disponível para exportação com os filtros aplicados.
                        </div>
                      )}
                      <DialogFooter>
                        <Button variant="outline" onClick={() => setIsExportModalOpen(false)}>
                          Cancelar
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                  
                  <Button onClick={applyFilters} variant="outline">
                    <Filter className="w-4 h-4 mr-2" />
                    Aplicar
                  </Button>
                </div>
              </div>

              {/* Tabela de Pagamentos */}
              <div className="bg-white rounded-xl shadow-md overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-blue-600">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-bold text-white uppercase tracking-wider">
                          Data
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-bold text-white uppercase tracking-wider">
                          Transação
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-bold text-white uppercase tracking-wider">
                          Referência
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-bold text-white uppercase tracking-wider">
                          Valor
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-bold text-white uppercase tracking-wider">
                          Método
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-bold text-white uppercase tracking-wider">
                          Usuário
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-bold text-white uppercase tracking-wider">
                          Status
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-100 text-sm">
                      {filteredPayments.map((payment) => (
                        <tr key={payment.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            {format(
                              new Date(payment.payment_date),
                              "dd/MM/yyyy",
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap font-mono text-sm">
                            #{payment.transaction_id}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            {payment.reference}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap font-bold text-gray-800">
                            {formatPrice(payment.amount)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            {getPaymentMethodBadge(payment.method)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center gap-2">
                              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                                <span className="text-blue-600 font-semibold text-sm">
                                  {payment.first_name?.[0]}
                                  {payment.last_name?.[0]}
                                </span>
                              </div>
                              <span>
                                {payment.first_name} {payment.last_name}
                              </span>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            {getStatusBadge(payment.status)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>

                  {filteredPayments.length === 0 && (
                    <div className="text-center py-12">
                      <p className="text-gray-500">
                        Nenhum pagamento encontrado
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {currentTab === "analise" && (
            <div className="bg-white rounded-xl shadow-md p-6">
              <h3 className="text-lg font-semibold mb-4">Análise Financeira</h3>
              <p className="text-gray-600">
                Gráficos e análises detalhadas serão implementados aqui.
              </p>
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
};

export default Finance;
