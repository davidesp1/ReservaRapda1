import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { CustomerLayout } from '@/components/layouts/CustomerLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useLocation } from 'wouter';
import { 
  CreditCard, 
  Clock, 
  CheckCircle2, 
  XCircle, 
  Calendar, 
  Filter, 
  Search,
  Download,
  FileText
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

// Interface para representar um pagamento
interface Payment {
  id: number;
  date: string;
  amount: number;
  status: 'completed' | 'pending' | 'failed';
  method: 'card' | 'mbway' | 'multibanco' | 'transfer';
  reference: string;
  reservationId: number;
}

const PaymentsPage = () => {
  const { t } = useTranslation();
  const [, setLocation] = useLocation();
  const [activeTab, setActiveTab] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  
  // Dados de exemplo
  const payments: Payment[] = [
    {
      id: 1,
      date: '2025-05-15T18:30:00',
      amount: 58.90,
      status: 'completed',
      method: 'card',
      reference: 'REF2025051501',
      reservationId: 101
    },
    {
      id: 2,
      date: '2025-05-12T19:45:00',
      amount: 74.50,
      status: 'completed',
      method: 'mbway',
      reference: 'REF2025051202',
      reservationId: 98
    },
    {
      id: 3,
      date: '2025-05-28T20:00:00',
      amount: 125.75,
      status: 'pending',
      method: 'multibanco',
      reference: 'REF2025052803',
      reservationId: 112
    },
    {
      id: 4,
      date: '2025-05-30T12:15:00',
      amount: 45.20,
      status: 'pending',
      method: 'transfer',
      reference: 'REF2025053004',
      reservationId: 118
    },
    {
      id: 5,
      date: '2025-05-10T13:30:00',
      amount: 92.40,
      status: 'failed',
      method: 'card',
      reference: 'REF2025051005',
      reservationId: 95
    }
  ];
  
  // Filtrar pagamentos com base na aba ativa e termo de busca
  const getFilteredPayments = () => {
    return payments
      .filter(payment => {
        if (activeTab === 'all') return true;
        return payment.status === activeTab;
      })
      .filter(payment => {
        if (!searchTerm) return true;
        const term = searchTerm.toLowerCase();
        return (
          payment.reference.toLowerCase().includes(term) ||
          payment.amount.toString().includes(term) ||
          payment.method.toLowerCase().includes(term)
        );
      });
  };
  
  // Formatar método de pagamento
  const formatMethod = (method: string) => {
    switch (method) {
      case 'card': return t('Card');
      case 'mbway': return 'MBWay';
      case 'multibanco': return 'Multibanco';
      case 'transfer': return t('Transfer');
      default: return method;
    }
  };
  
  // Formatar status de pagamento com badge
  const renderStatus = (status: string) => {
    switch (status) {
      case 'completed':
        return (
          <Badge className="bg-green-500 hover:bg-green-600">
            <CheckCircle2 className="mr-1 h-3 w-3" /> {t('Completed')}
          </Badge>
        );
      case 'pending':
        return (
          <Badge variant="outline" className="text-amber-500 border-amber-500">
            <Clock className="mr-1 h-3 w-3" /> {t('Pending')}
          </Badge>
        );
      case 'failed':
        return (
          <Badge variant="destructive">
            <XCircle className="mr-1 h-3 w-3" /> {t('Failed')}
          </Badge>
        );
      default:
        return status;
    }
  };
  
  const filteredPayments = getFilteredPayments();
  
  return (
    <CustomerLayout>
      <div className="container mx-auto py-8">
        <h1 className="text-2xl font-bold mb-6">{t('Payments')}</h1>
        
        <Tabs defaultValue="all" value={activeTab} onValueChange={setActiveTab}>
          <div className="flex justify-between items-center mb-6">
            <TabsList>
              <TabsTrigger value="all">{t('All')}</TabsTrigger>
              <TabsTrigger value="completed">{t('Completed')}</TabsTrigger>
              <TabsTrigger value="pending">{t('Pending')}</TabsTrigger>
              <TabsTrigger value="failed">{t('Failed')}</TabsTrigger>
            </TabsList>
            
            <div className="flex items-center space-x-2">
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
                <Input
                  placeholder={t('Search')}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8 w-[200px]"
                />
              </div>
              <Select defaultValue="date-desc">
                <SelectTrigger className="w-[160px]">
                  <Filter className="mr-2 h-4 w-4" />
                  <SelectValue placeholder={t('Sort')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="date-desc">{t('DateNewest')}</SelectItem>
                  <SelectItem value="date-asc">{t('DateOldest')}</SelectItem>
                  <SelectItem value="amount-desc">{t('AmountHighest')}</SelectItem>
                  <SelectItem value="amount-asc">{t('AmountLowest')}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <TabsContent value={activeTab}>
            {filteredPayments.length > 0 ? (
              <Card>
                <CardContent className="pt-6">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>{t('Date')}</TableHead>
                        <TableHead>{t('Reference')}</TableHead>
                        <TableHead>{t('Amount')}</TableHead>
                        <TableHead>{t('PaymentMethod')}</TableHead>
                        <TableHead>{t('Status')}</TableHead>
                        <TableHead className="text-right">{t('Actions')}</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredPayments.map((payment) => (
                        <TableRow key={payment.id}>
                          <TableCell>
                            <div className="flex items-center">
                              <Calendar className="mr-2 h-4 w-4 text-gray-500" />
                              {new Date(payment.date).toLocaleDateString()}
                            </div>
                          </TableCell>
                          <TableCell>{payment.reference}</TableCell>
                          <TableCell className="font-medium">€{payment.amount.toFixed(2)}</TableCell>
                          <TableCell>
                            <div className="flex items-center">
                              <CreditCard className="mr-2 h-4 w-4 text-gray-500" />
                              {formatMethod(payment.method)}
                            </div>
                          </TableCell>
                          <TableCell>{renderStatus(payment.status)}</TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end space-x-2">
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => setLocation(`/payment-details/${payment.id}`)}
                              >
                                <FileText className="mr-1 h-4 w-4" /> {t('Details')}
                              </Button>
                              {payment.status === 'completed' && (
                                <Button variant="outline" size="sm">
                                  <Download className="mr-1 h-4 w-4" /> {t('Receipt')}
                                </Button>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            ) : (
              <Card className="text-center py-12">
                <CardHeader>
                  <CardTitle>{t('NoPaymentsFound')}</CardTitle>
                  <CardDescription>
                    {searchTerm ? t('NoPaymentsMatchingSearch') : t('NoPaymentsMessage')}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {searchTerm && (
                    <Button 
                      variant="outline" 
                      onClick={() => setSearchTerm('')}
                    >
                      {t('ClearSearch')}
                    </Button>
                  )}
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </CustomerLayout>
  );
};

export default PaymentsPage;