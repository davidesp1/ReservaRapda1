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
  BarChart3,
  PieChart,
  Users,
  Euro,
  Calendar,
  Target,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Line, Bar, Doughnut } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
} from 'chart.js';

// Registrar componentes do Chart.js
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
);

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

interface Reservation {
  id: number;
  user_id: number;
  table_id: number;
  user_name: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  reservation_code: string;
  date: string;
  party_size: number;
  status: string;
  payment_method: string;
  payment_status: string;
  total: number;
  notes: string;
  duration: number;
  table_number: number;
  table_capacity: number;
  eupago_entity: string;
  eupago_reference: string;
}

interface AnalyticsData {
  revenueByDay: {
    date: string;
    revenue: number;
    count: number;
  }[];
  paymentMethods: {
    method: string;
    count: number;
    revenue: number;
  }[];
  totalRevenue: number;
  totalTransactions: number;
  topCustomers: {
    user_id: number;
    username: string;
    first_name: string;
    last_name: string;
    email: string;
    total_spent: number;
    transaction_count: number;
  }[];
  topProducts: {
    product_name: string;
    category: string;
    total_quantity: number;
    total_revenue: number;
    order_count: number;
  }[];
  categoryRevenue: {
    category: string;
    revenue: number;
    quantity: number;
  }[];
  hourlyAnalysis: {
    hour: number;
    transaction_count: number;
    revenue: number;
  }[];
  revenueGrowth: number;
  previousPeriodRevenue: number;
  period: number;
}

const Finance: React.FC = () => {
  const { t } = useTranslation();
  const { isAuthenticated, isAdmin, user } = useAuth();
  const [currentTab, setCurrentTab] = useState("pagamentos");
  const [searchText, setSearchText] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [methodFilter, setMethodFilter] = useState<string>("all");
  const [filteredPayments, setFilteredPayments] = useState<PaymentWithUser[]>(
    [],
  );
  const [filteredReservations, setFilteredReservations] = useState<Reservation[]>(
    [],
  );
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [analyticsPeriod, setAnalyticsPeriod] = useState("30");
  const { toast } = useToast();

  // Fetch payments com atualização em tempo real
  const {
    data: payments,
    isLoading: paymentsLoading,
    refetch,
  } = useQuery<PaymentWithUser[]>({
    queryKey: ["/api/admin/payments"],
    enabled: isAuthenticated && isAdmin,
    refetchInterval: 10000, // Atualiza a cada 10 segundos para realtime
    refetchIntervalInBackground: true,
  });

  // Fetch reservations
  const { data: reservations = [], isLoading: reservationsLoading } = useQuery<Reservation[]>({
    queryKey: ['/api/admin/reservations'],
    enabled: isAuthenticated && isAdmin,
    refetchInterval: 10000,
    refetchIntervalInBackground: true,
  });

  // Fetch analytics data
  const { data: analyticsData, isLoading: analyticsLoading } = useQuery<AnalyticsData>({
    queryKey: ['/api/admin/analytics', analyticsPeriod],
    enabled: isAuthenticated && isAdmin && currentTab === 'analise',
    refetchInterval: 30000,
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
    if (statusFilter && statusFilter !== "all") {
      filtered = filtered.filter((payment) => payment.status === statusFilter);
    }

    // Filtro de método
    if (methodFilter && methodFilter !== "all") {
      filtered = filtered.filter((payment) => payment.method === methodFilter);
    }

    setFilteredPayments(filtered);
  };

  // Aplicar filtros para reservas
  const applyReservationFilters = () => {
    if (!reservations) {
      setFilteredReservations([]);
      return;
    }

    let filtered = [...reservations];

    // Filtro de busca
    if (searchText) {
      filtered = filtered.filter(
        (reservation) =>
          reservation.user_name?.toLowerCase().includes(searchText.toLowerCase()) ||
          reservation.email?.toLowerCase().includes(searchText.toLowerCase()) ||
          reservation.phone?.toLowerCase().includes(searchText.toLowerCase()) ||
          reservation.reservation_code?.toLowerCase().includes(searchText.toLowerCase()),
      );
    }

    // Filtro de data
    if (startDate) {
      filtered = filtered.filter(
        (reservation) => new Date(reservation.date) >= new Date(startDate),
      );
    }
    if (endDate) {
      filtered = filtered.filter(
        (reservation) => new Date(reservation.date) <= new Date(endDate + "T23:59:59"),
      );
    }

    // Filtro de status de pagamento
    if (statusFilter && statusFilter !== "all") {
      filtered = filtered.filter((reservation) => reservation.payment_status === statusFilter);
    }

    // Filtro de método de pagamento
    if (methodFilter && methodFilter !== "all") {
      filtered = filtered.filter((reservation) => reservation.payment_method === methodFilter);
    }

    setFilteredReservations(filtered);
  };

  // Aplicar filtros automaticamente quando os dados mudarem
  useEffect(() => {
    if (payments) {
      applyFilters();
    }
  }, [payments?.length, searchText, startDate, endDate, statusFilter, methodFilter]);

  useEffect(() => {
    if (reservations) {
      applyReservationFilters();
    }
  }, [reservations?.length, searchText, startDate, endDate, statusFilter, methodFilter]);

  // Reset pagination when changing tabs or filters
  useEffect(() => {
    setCurrentPage(1);
  }, [currentTab, searchText, startDate, endDate, statusFilter, methodFilter]);

  // Paginação
  const getCurrentItems = () => {
    const items = currentTab === "pagamentos" ? filteredPayments : filteredReservations;
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return items.slice(startIndex, endIndex);
  };

  const getTotalPages = () => {
    const items = currentTab === "pagamentos" ? filteredPayments : filteredReservations;
    return Math.ceil(items.length / itemsPerPage);
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handleNextPage = () => {
    const totalPages = getTotalPages();
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };

  const handlePreviousPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  const generatePageNumbers = () => {
    const totalPages = getTotalPages();
    const pages = [];
    const maxVisiblePages = 5;
    
    if (totalPages <= maxVisiblePages) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      if (currentPage <= 3) {
        for (let i = 1; i <= maxVisiblePages; i++) {
          pages.push(i);
        }
      } else if (currentPage >= totalPages - 2) {
        for (let i = totalPages - maxVisiblePages + 1; i <= totalPages; i++) {
          pages.push(i);
        }
      } else {
        for (let i = currentPage - 2; i <= currentPage + 2; i++) {
          pages.push(i);
        }
      }
    }
    
    return pages;
  };

  // Calcular totais baseados nos pagamentos filtrados
  const totals = React.useMemo(() => {
    if (!payments)
      return {
        totalRevenue: 0,
        completedPayments: 0,
        pendingPayments: 0,
        failedPayments: 0,
      };

    // Se não há filtros ativos, usar todos os pagamentos
    const hasActiveFilters = searchText || startDate || endDate || 
                            (statusFilter && statusFilter !== "all") || 
                            (methodFilter && methodFilter !== "all");
    
    const paymentsToCalculate = hasActiveFilters ? filteredPayments : payments;

    const completed = paymentsToCalculate.filter((p) => p.status === "completed");
    const pending = paymentsToCalculate.filter((p) => p.status === "pending");
    const failed = paymentsToCalculate.filter((p) => p.status === "failed");

    // Para receita total, incluir todos os status quando não há filtros
    // Quando há filtros, incluir apenas os que passaram pelo filtro
    const totalRevenue = hasActiveFilters 
      ? paymentsToCalculate.reduce((sum, p) => sum + p.amount, 0)
      : payments.reduce((sum, p) => sum + p.amount, 0);

    return {
      totalRevenue,
      completedPayments: completed.length,
      pendingPayments: pending.length,
      failedPayments: failed.length,
    };
  }, [payments, filteredPayments, searchText, startDate, endDate, statusFilter, methodFilter]);

  // Formato de preço
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("pt-PT", {
      style: "currency",
      currency: "EUR",
      minimumFractionDigits: 2,
    }).format(price / 100);
  };

  // Ícone e badge do método de pagamento - versão compacta
  const getPaymentMethodBadge = (method: string) => {
    switch (method?.toLowerCase()) {
      case "cash":
      case "dinheiro":
        return (
          <div className="flex items-center gap-1 px-2 py-1 bg-green-100 text-green-800 rounded text-xs font-medium">
            <Banknote className="w-3 h-3" />
            Dinheiro
          </div>
        );
      case "card":
      case "cartao":
        return (
          <div className="flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs font-medium">
            <CreditCard className="w-3 h-3" />
            Cartão
          </div>
        );
      case "mbway":
        return (
          <div className="flex items-center gap-1 px-2 py-1 bg-yellow-100 text-yellow-800 rounded text-xs font-medium">
            <Smartphone className="w-3 h-3" />
            MBWay
          </div>
        );
      case "multibanco":
        return (
          <div className="flex items-center gap-1 px-2 py-1 bg-purple-100 text-purple-800 rounded text-xs font-medium">
            <Building className="w-3 h-3" />
            MB
          </div>
        );
      case "multibanco_tpa":
        return (
          <div className="flex items-center gap-1 px-2 py-1 bg-indigo-100 text-indigo-800 rounded text-xs font-medium">
            <CreditCard className="w-3 h-3" />
            TPA
          </div>
        );
      case "transfer":
        return (
          <div className="flex items-center gap-1 px-2 py-1 bg-teal-100 text-teal-800 rounded text-xs font-medium">
            <ArrowLeftRight className="w-3 h-3" />
            Transfer
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
        title: "Criando PDF profissional...",
        description: "Gerando relatório com design corporativo...",
      });

      const { headers, data, currentDate, totalAmount } = prepareExportData();
      
      const [{ jsPDF }, autoTable] = await Promise.all([
        import('jspdf'),
        import('jspdf-autotable')
      ]);
      
      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.width;
      const pageHeight = doc.internal.pageSize.height;
      
      // Cores baseadas no exemplo
      const headerBlue = [45, 55, 72]; // Azul escuro do cabeçalho
      const accentGreen = [34, 197, 94]; // Verde do exemplo
      const tableBlue = [59, 130, 246]; // Azul da tabela
      const textWhite = [255, 255, 255];
      const textDark = [31, 41, 55];
      const borderGray = [209, 213, 219];
      
      // =================== CABEÇALHO PRINCIPAL ===================
      // Fundo azul escuro
      doc.setFillColor(headerBlue[0], headerBlue[1], headerBlue[2]);
      doc.rect(0, 0, pageWidth, 50, 'F');
      
      // Logo/Nome da empresa (lado esquerdo)
      doc.setTextColor(textWhite[0], textWhite[1], textWhite[2]);
      doc.setFontSize(16);
      doc.setFont('helvetica', 'bold');
      doc.text('RESTAURANTE OPA QUE DELICIA', 20, 20);
      
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.text('SISTEMA DE GESTAO FINANCEIRA', 20, 32);
      
      // Título principal (lado direito)
      doc.setTextColor(accentGreen[0], accentGreen[1], accentGreen[2]);
      doc.setFontSize(24);
      doc.setFont('helvetica', 'bold');
      doc.text('CONTROLE', pageWidth - 20, 20, { align: 'right' });
      doc.text('FINANCEIRO', pageWidth - 20, 32, { align: 'right' });
      
      // =================== INFORMAÇÕES DO RELATÓRIO ===================
      let yPos = 65;
      
      // Título da seção
      doc.setTextColor(textDark[0], textDark[1], textDark[2]);
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text('RESUMO DO RELATÓRIO', 20, yPos);
      
      yPos += 15;
      
      // Box de informações com fundo
      doc.setFillColor(248, 250, 252);
      doc.roundedRect(15, yPos - 5, pageWidth - 30, 30, 3, 3, 'F');
      
      // Data e totais com melhor espaçamento
      doc.setTextColor(textDark[0], textDark[1], textDark[2]);
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      
      doc.text('Data de Emissao:', 25, yPos + 5);
      doc.setFont('helvetica', 'bold');
      doc.text(currentDate, 80, yPos + 5);
      
      doc.setFont('helvetica', 'normal');
      doc.text('Total de Registros:', 25, yPos + 13);
      doc.setFont('helvetica', 'bold');
      doc.text(filteredPayments.length.toString(), 90, yPos + 13);
      
      doc.setFont('helvetica', 'normal');
      doc.text('Valor Total:', 25, yPos + 21);
      doc.setTextColor(accentGreen[0], accentGreen[1], accentGreen[2]);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(12);
      doc.text(formatPrice(totalAmount), 75, yPos + 21);
      
      yPos += 45;
      
      // =================== TABELA PRINCIPAL ===================
      // Título da tabela
      doc.setTextColor(textDark[0], textDark[1], textDark[2]);
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text('DETALHAMENTO DOS PAGAMENTOS', 20, yPos);
      
      yPos += 12;
      
      const tableData = data.map(row => [
        row[0], // Data
        row[1], // Transação
        row[2], // Referência  
        row[3], // Valor
        row[4], // Método
        row[5], // Usuário
        row[6]  // Status
      ]);
      
      // Criar tabela com espaçamento melhorado
      try {
        (doc as any).autoTable({
          head: [headers],
          body: tableData,
          startY: yPos,
          margin: { left: 15, right: 15 },
          
          styles: {
            fontSize: 9,
            cellPadding: { top: 6, right: 4, bottom: 6, left: 4 },
            textColor: [31, 41, 55],
            lineColor: [209, 213, 219],
            lineWidth: 0.5,
            overflow: 'linebreak'
          },
          
          headStyles: {
            fillColor: [59, 130, 246],
            textColor: [255, 255, 255],
            fontStyle: 'bold',
            fontSize: 10,
            halign: 'center',
            valign: 'middle',
            cellPadding: { top: 10, right: 4, bottom: 10, left: 4 }
          },
          
          columnStyles: {
            0: { cellWidth: 24, halign: 'center' },    // Data
            1: { cellWidth: 36, halign: 'left' },      // Transação
            2: { cellWidth: 22, halign: 'center' },    // Referência
            3: { 
              cellWidth: 28, 
              halign: 'right', 
              fontStyle: 'bold', 
              textColor: [34, 197, 94] 
            },                                          // Valor
            4: { cellWidth: 28, halign: 'center' },    // Método
            5: { cellWidth: 32, halign: 'left' },      // Usuário
            6: { cellWidth: 22, halign: 'center' }     // Status
          },
          
          alternateRowStyles: {
            fillColor: [248, 250, 252]
          },
          
          // Personalização adicional de células
          didParseCell: function(data: any) {
            // Status com cores
            if (data.column.index === 6) {
              const status = data.cell.text[0].toLowerCase();
              if (status.includes('concluído') || status.includes('completed')) {
                data.cell.styles.textColor = [34, 197, 94];
                data.cell.styles.fontStyle = 'bold';
              } else if (status.includes('pendente') || status.includes('pending')) {
                data.cell.styles.textColor = [245, 158, 11];
                data.cell.styles.fontStyle = 'bold';
              } else if (status.includes('falhou') || status.includes('failed')) {
                data.cell.styles.textColor = [239, 68, 68];
                data.cell.styles.fontStyle = 'bold';
              }
            }
            
            // Métodos de pagamento destacados
            if (data.column.index === 4) {
              data.cell.styles.fontStyle = 'bold';
              data.cell.styles.textColor = [99, 102, 241];
            }
          }
        });
        
        // =================== RODAPÉ CORPORATIVO ===================
        const finalY = (doc as any).lastAutoTable.finalY + 50;
        
        // Linha de assinatura
        doc.setDrawColor(31, 41, 55);
        doc.setLineWidth(0.5);
        doc.line(20, finalY, 100, finalY);
        
        // Nome do responsável
        doc.setTextColor(31, 41, 55);
        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        doc.text('Gestor Financeiro', 20, finalY + 10);
        
        // =================== FUNDO DECORATIVO ===================
        // Fundo azul escuro no rodapé
        doc.setFillColor(45, 55, 72);
        doc.rect(0, pageHeight - 40, pageWidth, 40, 'F');
        
        // Texto do rodapé
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(8);
        doc.setFont('helvetica', 'italic');
        doc.text('* Documento gerado automaticamente pelo sistema', 20, pageHeight - 25);
        doc.text(`${new Date().toLocaleString('pt-PT')}`, 20, pageHeight - 15);
        
        // Prazo para disputas (como no exemplo)
        doc.setTextColor(34, 197, 94);
        doc.setFontSize(9);
        doc.setFont('helvetica', 'bold');
        doc.text('* Prazo para disputas ou ajustes:', pageWidth - 20, pageHeight - 25, { align: 'right' });
        doc.text('30 dias apos o envio deste relatorio', pageWidth - 20, pageHeight - 15, { align: 'right' });
        
        // Salvar arquivo
        const fileName = `controle-financeiro-${currentDate.replace(/\//g, '-')}.pdf`;
        doc.save(fileName);
        
        toast({
          title: "Relatório profissional criado!",
          description: `${fileName} baixado com sucesso.`,
        });
        
        setIsExportModalOpen(false);
        
      } catch (error) {
        console.error('Erro na tabela:', error);
        
        // Fallback simples mas ainda corporativo
        doc.setTextColor(31, 41, 55);
        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        doc.text('DADOS FINANCEIROS', 20, yPos + 20);
        
        filteredPayments.slice(0, 20).forEach((payment, index) => {
          const y = yPos + 40 + (index * 10);
          doc.setFontSize(9);
          doc.setFont('helvetica', 'normal');
          doc.setTextColor(31, 41, 55);
          doc.text(`${format(new Date(payment.payment_date), 'dd/MM/yyyy')}`, 20, y);
          doc.text(`${payment.transaction_id}`, 60, y);
          doc.setTextColor(34, 197, 94);
          doc.setFont('helvetica', 'bold');
          doc.text(`${formatPrice(payment.amount)}`, 120, y);
          doc.setTextColor(31, 41, 55);
          doc.setFont('helvetica', 'normal');
          doc.text(`${payment.method}`, 160, y);
        });
        
        // Adicionar rodapé mesmo no fallback
        doc.setFillColor(45, 55, 72);
        doc.rect(0, pageHeight - 25, pageWidth, 25, 'F');
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(8);
        doc.text('Documento gerado automaticamente', 20, pageHeight - 10);
        
        const fileName = `controle-financeiro-${currentDate.replace(/\//g, '-')}.pdf`;
        doc.save(fileName);
        
        toast({
          title: "PDF corporativo gerado",
          description: "Arquivo criado com design profissional.",
        });
        
        setIsExportModalOpen(false);
      }
      
    } catch (error) {
      console.error('Erro ao gerar PDF:', error);
      toast({
        title: "Erro na criação do PDF",
        description: "Tente usar Excel ou CSV.",
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
              onClick={() => setCurrentTab("reservas")}
              className={`px-6 py-3 font-semibold rounded-t-lg focus:outline-none ml-2 ${
                currentTab === "reservas"
                  ? "text-blue-600 border-b-2 border-blue-600 bg-white"
                  : "text-gray-500 hover:text-blue-600 bg-white"
              }`}
            >
              Reservas
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
                  <table className="w-full divide-y divide-gray-200">
                    <thead className="bg-blue-600">
                      <tr>
                        <th className="px-3 py-3 text-left text-xs font-bold text-white uppercase tracking-wider w-20">
                          Data
                        </th>
                        <th className="px-3 py-3 text-left text-xs font-bold text-white uppercase tracking-wider w-24">
                          ID
                        </th>
                        <th className="px-3 py-3 text-left text-xs font-bold text-white uppercase tracking-wider w-20">
                          Valor
                        </th>
                        <th className="px-3 py-3 text-left text-xs font-bold text-white uppercase tracking-wider w-28">
                          Método
                        </th>
                        <th className="px-3 py-3 text-left text-xs font-bold text-white uppercase tracking-wider w-32">
                          Usuário
                        </th>
                        <th className="px-3 py-3 text-left text-xs font-bold text-white uppercase tracking-wider w-20">
                          Status
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-100 text-sm">
                      {(getCurrentItems() as PaymentWithUser[]).map((payment) => (
                        <tr key={payment.id} className="hover:bg-gray-50">
                          <td className="px-3 py-4 whitespace-nowrap text-xs">
                            {format(
                              new Date(payment.payment_date),
                              "dd/MM/yyyy",
                            )}
                          </td>
                          <td className="px-3 py-4 whitespace-nowrap font-mono text-xs">
                            #{payment.id}
                          </td>
                          <td className="px-3 py-4 whitespace-nowrap font-bold text-gray-800 text-xs">
                            {formatPrice(payment.amount)}
                          </td>
                          <td className="px-3 py-4 whitespace-nowrap text-xs">
                            {getPaymentMethodBadge(payment.method)}
                          </td>
                          <td className="px-3 py-4 whitespace-nowrap text-xs">
                            <div className="flex items-center gap-1">
                              <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center">
                                <span className="text-blue-600 font-semibold text-xs">
                                  {payment.first_name?.[0] || payment.username?.[0] || 'U'}
                                </span>
                              </div>
                              <span className="truncate max-w-20">
                                {payment.first_name || payment.username || 'N/A'}
                              </span>
                            </div>
                          </td>
                          <td className="px-3 py-4 whitespace-nowrap text-xs">
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

                {/* Paginação para Pagamentos */}
                {currentTab === "pagamentos" && getTotalPages() > 1 && (
                  <div className="flex justify-between items-center px-6 py-4 bg-white border-t border-gray-100">
                    <div className="text-sm text-gray-600">
                      Exibindo {filteredPayments.length > 0 ? ((currentPage - 1) * itemsPerPage) + 1 : 0} a {Math.min(currentPage * itemsPerPage, filteredPayments.length)} de {filteredPayments.length} pagamentos
                    </div>
                    <div className="flex space-x-1">
                      <button 
                        onClick={handlePreviousPage}
                        disabled={currentPage === 1}
                        className={`px-3 py-1 rounded-lg font-bold transition ${
                          currentPage === 1 
                            ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
                            : 'bg-gray-100 text-gray-500 hover:bg-blue-800 hover:text-white'
                        }`}
                      >
                        <i className="fa-solid fa-angle-left"></i>
                      </button>
                      
                      {generatePageNumbers().map((page) => (
                        <button
                          key={page}
                          onClick={() => handlePageChange(page)}
                          className={`px-3 py-1 rounded-lg font-bold transition ${
                            currentPage === page
                              ? 'bg-blue-800 text-white'
                              : 'bg-gray-100 text-gray-800 hover:bg-blue-800 hover:text-white'
                          }`}
                        >
                          {page}
                        </button>
                      ))}
                      
                      <button 
                        onClick={handleNextPage}
                        disabled={currentPage === getTotalPages()}
                        className={`px-3 py-1 rounded-lg font-bold transition ${
                          currentPage === getTotalPages() 
                            ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
                            : 'bg-gray-100 text-gray-500 hover:bg-blue-800 hover:text-white'
                        }`}
                      >
                        <i className="fa-solid fa-angle-right"></i>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {currentTab === "reservas" && (
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
                      placeholder="Buscar por cliente, código ou contato..."
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

                <div className="min-w-[140px]">
                  <label className="block text-xs text-gray-600 mb-1 font-semibold">
                    Status Pagamento
                  </label>
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger>
                      <SelectValue placeholder="Todos" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos</SelectItem>
                      <SelectItem value="completed">Pago</SelectItem>
                      <SelectItem value="pending">Pendente</SelectItem>
                      <SelectItem value="cancelled">Cancelado</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="min-w-[140px]">
                  <label className="block text-xs text-gray-600 mb-1 font-semibold">
                    Método
                  </label>
                  <Select value={methodFilter} onValueChange={setMethodFilter}>
                    <SelectTrigger>
                      <SelectValue placeholder="Todos" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos</SelectItem>
                      <SelectItem value="card">Cartão</SelectItem>
                      <SelectItem value="mbway">MB Way</SelectItem>
                      <SelectItem value="multibanco">Multibanco</SelectItem>
                      <SelectItem value="cash">Dinheiro</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Button
                    onClick={() => {
                      setSearchText("");
                      setStartDate("");
                      setEndDate("");
                      setStatusFilter("all");
                      setMethodFilter("all");
                    }}
                    variant="outline"
                    className="flex items-center gap-2"
                  >
                    <Filter className="w-4 h-4" />
                    Limpar
                  </Button>
                </div>
              </div>

              {/* Tabela de Reservas */}
              <div className="bg-white rounded-xl shadow-md overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full divide-y divide-gray-200">
                    <thead className="bg-blue-600">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-bold text-white uppercase tracking-wider w-20">
                          Código
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-bold text-white uppercase tracking-wider">
                          Cliente
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-bold text-white uppercase tracking-wider w-32">
                          Data/Hora
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-bold text-white uppercase tracking-wider w-16">
                          Mesa
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-bold text-white uppercase tracking-wider w-20">
                          Pessoas
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-bold text-white uppercase tracking-wider w-24">
                          Valor
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-bold text-white uppercase tracking-wider w-24">
                          Método
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-bold text-white uppercase tracking-wider w-24">
                          Status
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {(getCurrentItems() as Reservation[]).map((reservation) => (
                        <tr key={reservation.id} className="hover:bg-gray-50">
                          <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-blue-600">
                            {reservation.reservation_code || `#R${reservation.id}`}
                          </td>
                          <td className="px-4 py-4">
                            <div className="flex items-center">
                              <img
                                src={`https://storage.googleapis.com/uxpilot-auth.appspot.com/avatars/avatar-${(reservation.id % 8) + 1}.jpg`}
                                alt=""
                                className="w-8 h-8 rounded-full border-2 border-green-600 mr-3 flex-shrink-0"
                              />
                              <div className="min-w-0 flex-1">
                                <div className="text-sm font-medium text-gray-900 truncate">
                                  {reservation.user_name}
                                </div>
                                <div className="text-sm text-gray-500 truncate">
                                  {reservation.email}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                            <div className="text-xs">
                              {reservation.date ? format(new Date(reservation.date), 'dd/MM/yyyy') : '-'}
                            </div>
                            <div className="text-xs text-gray-500">
                              {reservation.date ? format(new Date(reservation.date), 'HH:mm') : ''}
                            </div>
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900 text-center">
                            {reservation.table_number || 'N/A'}
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900 text-center">
                            {reservation.party_size || 0}
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            €{((reservation.total || 0) / 100).toFixed(2)}
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap">
                            {getPaymentMethodBadge(reservation.payment_method || 'cash')}
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap">
                            {getStatusBadge(reservation.payment_status || 'pending')}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>

                  {filteredReservations.length === 0 && (
                    <div className="text-center py-12">
                      <p className="text-gray-500">
                        Nenhuma reserva encontrada
                      </p>
                    </div>
                  )}
                </div>

                {/* Paginação para Reservas */}
                {getTotalPages() > 1 && (
                  <div className="flex justify-between items-center px-6 py-4 bg-white border-t border-gray-100">
                    <div className="text-sm text-gray-600">
                      Exibindo {filteredReservations.length > 0 ? ((currentPage - 1) * itemsPerPage) + 1 : 0} a {Math.min(currentPage * itemsPerPage, filteredReservations.length)} de {filteredReservations.length} reservas
                    </div>
                    <div className="flex space-x-1">
                      <button 
                        onClick={handlePreviousPage}
                        disabled={currentPage === 1}
                        className={`px-3 py-1 rounded-lg font-bold transition ${
                          currentPage === 1 
                            ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
                            : 'bg-gray-100 text-gray-500 hover:bg-blue-800 hover:text-white'
                        }`}
                      >
                        <i className="fa-solid fa-angle-left"></i>
                      </button>
                      
                      {generatePageNumbers().map((page) => (
                        <button
                          key={page}
                          onClick={() => handlePageChange(page)}
                          className={`px-3 py-1 rounded-lg font-bold transition ${
                            currentPage === page
                              ? 'bg-blue-800 text-white'
                              : 'bg-gray-100 text-gray-800 hover:bg-blue-800 hover:text-white'
                          }`}
                        >
                          {page}
                        </button>
                      ))}
                      
                      <button 
                        onClick={handleNextPage}
                        disabled={currentPage === getTotalPages()}
                        className={`px-3 py-1 rounded-lg font-bold transition ${
                          currentPage === getTotalPages() 
                            ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
                            : 'bg-gray-100 text-gray-500 hover:bg-blue-800 hover:text-white'
                        }`}
                      >
                        <i className="fa-solid fa-angle-right"></i>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {currentTab === "analise" && (
            <div className="space-y-6">
              {/* Filtros de Período */}
              <div className="bg-white rounded-xl shadow-md p-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-bold text-gray-800 flex items-center">
                    <BarChart3 className="w-6 h-6 mr-2 text-blue-600" />
                    Análise Financeira
                  </h3>
                  <div className="flex items-center gap-4">
                    <label className="text-sm font-medium text-gray-700">Período:</label>
                    <Select value={analyticsPeriod} onValueChange={setAnalyticsPeriod}>
                      <SelectTrigger className="w-32">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="7">7 dias</SelectItem>
                        <SelectItem value="30">30 dias</SelectItem>
                        <SelectItem value="90">90 dias</SelectItem>
                        <SelectItem value="365">1 ano</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {analyticsLoading ? (
                  <div className="flex items-center justify-center h-64">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                  </div>
                ) : analyticsData ? (
                  <>
                    {/* Métricas Principais */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                      <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg p-6 text-white">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-blue-100 text-sm font-medium">Receita Total</p>
                            <p className="text-2xl font-bold">
                              {(analyticsData.totalRevenue / 100).toLocaleString('pt-PT', {
                                style: 'currency',
                                currency: 'EUR'
                              })}
                            </p>
                          </div>
                          <Euro className="w-8 h-8 text-blue-200" />
                        </div>
                      </div>

                      <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-lg p-6 text-white">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-green-100 text-sm font-medium">Total de Transações</p>
                            <p className="text-2xl font-bold">{analyticsData.totalTransactions}</p>
                          </div>
                          <CreditCard className="w-8 h-8 text-green-200" />
                        </div>
                      </div>

                      <div className="bg-gradient-to-r from-purple-500 to-purple-600 rounded-lg p-6 text-white">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-purple-100 text-sm font-medium">Ticket Médio</p>
                            <p className="text-2xl font-bold">
                              {analyticsData.totalTransactions > 0 
                                ? ((analyticsData.totalRevenue / analyticsData.totalTransactions) / 100).toLocaleString('pt-PT', {
                                    style: 'currency',
                                    currency: 'EUR'
                                  })
                                : '€0,00'
                              }
                            </p>
                          </div>
                          <Target className="w-8 h-8 text-purple-200" />
                        </div>
                      </div>

                      <div className="bg-gradient-to-r from-orange-500 to-orange-600 rounded-lg p-6 text-white">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-orange-100 text-sm font-medium">Clientes Únicos</p>
                            <p className="text-2xl font-bold">{analyticsData.topCustomers.length}</p>
                          </div>
                          <Users className="w-8 h-8 text-orange-200" />
                        </div>
                      </div>
                    </div>

                    {/* Gráficos */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
                      {/* Gráfico de Receita por Dia */}
                      <div className="bg-gray-50 rounded-lg p-6">
                        <h4 className="text-lg font-semibold mb-4 flex items-center">
                          <TrendingUp className="w-5 h-5 mr-2 text-blue-600" />
                          Receita por Dia
                        </h4>
                        <div className="h-64">
                          <Line
                            data={{
                              labels: analyticsData.revenueByDay.map(item => 
                                new Date(item.date).toLocaleDateString('pt-PT', { day: '2-digit', month: '2-digit' })
                              ),
                              datasets: [{
                                label: 'Receita (€)',
                                data: analyticsData.revenueByDay.map(item => item.revenue / 100),
                                borderColor: 'rgb(59, 130, 246)',
                                backgroundColor: 'rgba(59, 130, 246, 0.1)',
                                tension: 0.4,
                                fill: true
                              }]
                            }}
                            options={{
                              responsive: true,
                              maintainAspectRatio: false,
                              scales: {
                                y: {
                                  beginAtZero: true,
                                  ticks: {
                                    callback: function(value) {
                                      return '€' + Number(value).toFixed(2);
                                    }
                                  }
                                }
                              },
                              plugins: {
                                tooltip: {
                                  callbacks: {
                                    label: function(context) {
                                      return 'Receita: €' + Number(context.parsed.y).toFixed(2);
                                    }
                                  }
                                }
                              }
                            }}
                          />
                        </div>
                      </div>

                      {/* Gráfico de Métodos de Pagamento */}
                      <div className="bg-gray-50 rounded-lg p-6">
                        <h4 className="text-lg font-semibold mb-4 flex items-center">
                          <PieChart className="w-5 h-5 mr-2 text-green-600" />
                          Métodos de Pagamento
                        </h4>
                        <div className="h-64">
                          <Doughnut
                            data={{
                              labels: analyticsData.paymentMethods.map(method => {
                                const methodNames = {
                                  cash: 'Dinheiro',
                                  card: 'Cartão',
                                  mbway: 'MB Way',
                                  multibanco: 'Multibanco',
                                  multibanco_TPA: 'Multibanco (TPA)',
                                  transfer: 'Transferência'
                                };
                                return methodNames[method.method as keyof typeof methodNames] || method.method;
                              }),
                              datasets: [{
                                data: analyticsData.paymentMethods.map(method => method.revenue / 100),
                                backgroundColor: [
                                  '#10b981',
                                  '#3b82f6',
                                  '#8b5cf6',
                                  '#f59e0b',
                                  '#ef4444',
                                  '#06b6d4'
                                ],
                                borderWidth: 2,
                                borderColor: '#ffffff'
                              }]
                            }}
                            options={{
                              responsive: true,
                              maintainAspectRatio: false,
                              plugins: {
                                tooltip: {
                                  callbacks: {
                                    label: function(context) {
                                      const value = Number(context.parsed);
                                      const total = context.dataset.data.reduce((a: number, b: number) => a + b, 0);
                                      const percentage = ((value / total) * 100).toFixed(1);
                                      return `${context.label}: €${value.toFixed(2)} (${percentage}%)`;
                                    }
                                  }
                                }
                              }
                            }}
                          />
                        </div>
                      </div>
                    </div>

                    {/* Top Clientes */}
                    <div className="bg-white rounded-lg border border-gray-200 p-6">
                      <h4 className="text-lg font-semibold mb-4 flex items-center">
                        <Users className="w-5 h-5 mr-2 text-purple-600" />
                        Top Clientes (Últimos {analyticsPeriod} dias)
                      </h4>
                      <div className="overflow-x-auto">
                        <table className="w-full">
                          <thead>
                            <tr className="border-b border-gray-200">
                              <th className="text-left py-3 px-2 font-semibold text-gray-700">Cliente</th>
                              <th className="text-left py-3 px-2 font-semibold text-gray-700">Email</th>
                              <th className="text-center py-3 px-2 font-semibold text-gray-700">Transações</th>
                              <th className="text-right py-3 px-2 font-semibold text-gray-700">Total Gasto</th>
                            </tr>
                          </thead>
                          <tbody>
                            {analyticsData.topCustomers.map((customer, index) => (
                              <tr key={customer.user_id} className="border-b border-gray-100 hover:bg-gray-50">
                                <td className="py-3 px-2">
                                  <div className="flex items-center">
                                    <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center mr-3">
                                      <span className="text-sm font-semibold text-blue-600">
                                        #{index + 1}
                                      </span>
                                    </div>
                                    <div>
                                      <p className="font-medium text-gray-900">
                                        {customer.first_name || customer.last_name 
                                          ? `${customer.first_name || ''} ${customer.last_name || ''}`.trim()
                                          : customer.username
                                        }
                                      </p>
                                      <p className="text-sm text-gray-500">@{customer.username}</p>
                                    </div>
                                  </div>
                                </td>
                                <td className="py-3 px-2 text-gray-600">{customer.email}</td>
                                <td className="py-3 px-2 text-center">
                                  <Badge variant="secondary">{customer.transaction_count}</Badge>
                                </td>
                                <td className="py-3 px-2 text-right font-semibold text-green-600">
                                  {(customer.total_spent / 100).toLocaleString('pt-PT', {
                                    style: 'currency',
                                    currency: 'EUR'
                                  })}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="text-center py-12">
                    <BarChart3 className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-500 text-lg">Nenhum dado disponível para análise</p>
                    <p className="text-gray-400 text-sm">Tente ajustar o período ou verificar se há transações registradas</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
};

export default Finance;
