import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DatePicker } from '@/components/ui/date-picker';
import { useToast } from '@/hooks/use-toast';
import { useMutation } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { FileDown, FileText, FileSpreadsheet, Loader2 } from 'lucide-react';
import { format } from 'date-fns';

interface ReportExportProps {
  className?: string;
}

interface ReportParams {
  type: string;
  format: string;
  startDate: Date;
  endDate: Date;
}

const ReportExport: React.FC<ReportExportProps> = ({ className }) => {
  const { t } = useTranslation();
  const { toast } = useToast();
  const [reportType, setReportType] = useState<string>('reservations');
  const [exportFormat, setExportFormat] = useState<string>('pdf');
  const [startDate, setStartDate] = useState<Date>(new Date());
  const [endDate, setEndDate] = useState<Date>(new Date());

  // Export report mutation
  const exportReportMutation = useMutation({
    mutationFn: async (params: ReportParams) => {
      const response = await apiRequest(
        'GET', 
        `/api/reports/export?type=${params.type}&format=${params.format}&startDate=${format(params.startDate, 'yyyy-MM-dd')}&endDate=${format(params.endDate, 'yyyy-MM-dd')}`,
        null
      );
      return response.blob(); // Return as blob for download
    },
    onSuccess: (data, variables) => {
      // Create a download link
      const blob = new Blob([data], { 
        type: variables.format === 'pdf' 
          ? 'application/pdf' 
          : 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
      });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${t(getReportTypeName(variables.type))}_${format(new Date(), 'yyyy-MM-dd')}.${variables.format}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      toast({
        title: t('ReportExported'),
        description: t('ReportExportedSuccessfully'),
      });
    },
    onError: (error) => {
      toast({
        title: t('ReportExportError'),
        description: t('ErrorExportingReport'),
        variant: 'destructive',
      });
    },
  });

  const getReportTypeName = (type: string): string => {
    switch (type) {
      case 'reservations': return 'ReservationsReport';
      case 'sales': return 'SalesReport';
      case 'customers': return 'CustomersReport';
      case 'menu-performance': return 'MenuPerformanceReport';
      default: return 'Report';
    }
  };

  const getReportTypeIcon = (type: string) => {
    return <FileText className="h-4 w-4 mr-2" />;
  };

  const handleExport = () => {
    if (!startDate || !endDate) {
      toast({
        title: t('InvalidDates'),
        description: t('PleaseSelectValidDates'),
        variant: 'destructive',
      });
      return;
    }
    
    exportReportMutation.mutate({
      type: reportType,
      format: exportFormat,
      startDate,
      endDate
    });
  };

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle>{t('ExportReports')}</CardTitle>
        <CardDescription>{t('GenerateAndDownloadReports')}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">{t('ReportType')}</label>
              <Select
                value={reportType}
                onValueChange={setReportType}
              >
                <SelectTrigger>
                  <SelectValue placeholder={t('SelectReportType')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="reservations">{t('ReservationsReport')}</SelectItem>
                  <SelectItem value="sales">{t('SalesReport')}</SelectItem>
                  <SelectItem value="customers">{t('CustomersReport')}</SelectItem>
                  <SelectItem value="menu-performance">{t('MenuPerformanceReport')}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium">{t('ExportFormat')}</label>
              <Select
                value={exportFormat}
                onValueChange={setExportFormat}
              >
                <SelectTrigger>
                  <SelectValue placeholder={t('SelectExportFormat')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pdf">
                    <div className="flex items-center">
                      <FileText className="h-4 w-4 mr-2" />
                      PDF
                    </div>
                  </SelectItem>
                  <SelectItem value="xlsx">
                    <div className="flex items-center">
                      <FileSpreadsheet className="h-4 w-4 mr-2" />
                      Excel (XLSX)
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">{t('StartDate')}</label>
              <DatePicker 
                date={startDate} 
                setDate={setStartDate} 
                className="w-full"
              />
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium">{t('EndDate')}</label>
              <DatePicker 
                date={endDate} 
                setDate={setEndDate} 
                className="w-full"
              />
            </div>
          </div>
          
          <Button 
            onClick={handleExport}
            className="w-full"
            disabled={exportReportMutation.isPending}
          >
            {exportReportMutation.isPending ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                {t('Exporting')}...
              </>
            ) : (
              <>
                <FileDown className="h-4 w-4 mr-2" />
                {t('ExportReport')}
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default ReportExport;