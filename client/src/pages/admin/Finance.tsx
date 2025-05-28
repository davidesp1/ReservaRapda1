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
      const { headers, data, currentDate, totalAmount } = prepareExportData();
      
      // Importar jsPDF dinamicamente
      const { jsPDF } = await import('jspdf');
      await import('jspdf-autotable');
      
      const doc = new jsPDF();
      
      // Configurar fonte
      doc.setFont('helvetica');
      
      // Título do documento
      doc.setFontSize(18);
      doc.setTextColor(37, 99, 235); // Azul
      doc.text('Relatório de Pagamentos', 20, 25);
      
      // Informações do relatório
      doc.setFontSize(11);
      doc.setTextColor(0, 0, 0); // Preto
      doc.text(`Data de emissão: ${currentDate}`, 20, 40);
      doc.text(`Total de registros: ${filteredPayments.length}`, 20, 48);
      doc.text(`Valor total: ${formatPrice(totalAmount)}`, 20, 56);
      
      // Informações dos filtros aplicados (se houver)
      let yPosition = 70;
      if (searchText) {
        doc.text(`Filtro de busca: ${searchText}`, 20, yPosition);
        yPosition += 8;
      }
      if (startDate || endDate) {
        const dateRange = `${startDate || 'Início'} até ${endDate || 'Fim'}`;
        doc.text(`Período: ${dateRange}`, 20, yPosition);
        yPosition += 8;
      }
      if (statusFilter) {
        doc.text(`Status: ${statusFilter}`, 20, yPosition);
        yPosition += 8;
      }
      if (methodFilter) {
        const methodNames: Record<string, string> = {
          'cash': 'Dinheiro',
          'card': 'Cartão',
          'mbway': 'MB Way',
          'multibanco': 'Multibanco',
          'multibanco_TPA': 'Multibanco (TPA)',
          'transfer': 'Transferência'
        };
        doc.text(`Método: ${methodNames[methodFilter] || methodFilter}`, 20, yPosition);
        yPosition += 8;
      }
      
      // Preparar dados da tabela para o PDF
      const tableData = data.map(row => [
        row[0], // Data
        row[1], // Transação
        row[2], // Referência
        row[3], // Valor
        row[4], // Método
        row[5], // Usuário
        row[6]  // Status
      ]);
      
      // Criar tabela usando autoTable
      (doc as any).autoTable({
        head: [headers],
        body: tableData,
        startY: yPosition + 10,
        styles: {
          fontSize: 9,
          cellPadding: 4,
          lineColor: [200, 200, 200],
          lineWidth: 0.5
        },
        headStyles: {
          fillColor: [37, 99, 235], // Azul
          textColor: 255,
          fontStyle: 'bold',
          fontSize: 10
        },
        columnStyles: {
          0: { cellWidth: 25 }, // Data
          1: { cellWidth: 30 }, // Transação
          2: { cellWidth: 25 }, // Referência
          3: { cellWidth: 25 }, // Valor
          4: { cellWidth: 30 }, // Método
          5: { cellWidth: 35 }, // Usuário
          6: { cellWidth: 20 }  // Status
        },
        alternateRowStyles: {
          fillColor: [248, 250, 252]
        },
        margin: { top: 10, right: 10, bottom: 10, left: 10 },
        theme: 'striped'
      });
      
      // Adicionar rodapé
      const pageCount = doc.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setTextColor(128, 128, 128);
        doc.text(`Página ${i} de ${pageCount}`, doc.internal.pageSize.width - 30, doc.internal.pageSize.height - 10);
        doc.text(`Gerado em ${new Date().toLocaleString('pt-PT')}`, 20, doc.internal.pageSize.height - 10);
      }
      
      // Salvar o arquivo
      const fileName = `pagamentos_${currentDate.replace(/\//g, '-')}.pdf`;
      doc.save(fileName);
      
      toast({
        title: "Exportação concluída",
        description: `Arquivo PDF ${fileName} foi baixado com sucesso.`,
      });

      setIsExportModalOpen(false);
    } catch (error) {
      console.error('Erro ao exportar PDF:', error);
      toast({
        title: "Erro na exportação",
        description: "Ocorreu um erro ao gerar o arquivo PDF.",
        variant: "destructive"
      });
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
