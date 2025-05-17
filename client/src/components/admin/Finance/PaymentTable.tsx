import React from 'react';
import { useTranslation } from 'react-i18next';
import { format } from 'date-fns';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useLocation } from 'wouter';
import { Eye } from 'lucide-react';

interface Payment {
  id: number;
  reservationId: number;
  amount: number;
  method: string;
  status: string;
  transactionId: string;
  paymentDate: string;
  createdAt: string;
  updatedAt: string;
}

interface PaymentTableProps {
  payments: Payment[];
  isLoading?: boolean;
}

export default function PaymentTable({ payments, isLoading = false }: PaymentTableProps) {
  const { t } = useTranslation();
  const [, navigate] = useLocation();

  // Format price to display as currency
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('pt-PT', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 2
    }).format(price / 100);
  };

  // Get status badge color based on status
  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800 hover:bg-green-200';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200';
      case 'failed':
        return 'bg-red-100 text-red-800 hover:bg-red-200';
      default:
        return 'bg-gray-100 text-gray-800 hover:bg-gray-200';
    }
  };

  // Get method display name
  const getMethodDisplayName = (method: string) => {
    switch (method) {
      case 'card':
        return t('CreditCard');
      case 'mbway':
        return 'MBWay';
      case 'multibanco':
        return 'Multibanco';
      case 'transfer':
        return t('BankTransfer');
      default:
        return method;
    }
  };

  if (isLoading) {
    return (
      <div className="animate-pulse space-y-4">
        <div className="h-8 bg-gray-200 rounded"></div>
        <div className="h-8 bg-gray-200 rounded"></div>
        <div className="h-8 bg-gray-200 rounded"></div>
        <div className="h-8 bg-gray-200 rounded"></div>
      </div>
    );
  }

  return (
    <div className="border rounded-md overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>{t('Date')}</TableHead>
            <TableHead>{t('TransactionId')}</TableHead>
            <TableHead>{t('ReservationId')}</TableHead>
            <TableHead>{t('Amount')}</TableHead>
            <TableHead>{t('Method')}</TableHead>
            <TableHead>{t('Status')}</TableHead>
            <TableHead>{t('Actions')}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {payments.length > 0 ? (
            payments.map((payment) => (
              <TableRow key={payment.id} className="hover:bg-gray-50">
                <TableCell>
                  {payment.paymentDate ? format(new Date(payment.paymentDate), 'dd/MM/yyyy HH:mm') : '-'}
                </TableCell>
                <TableCell className="font-medium">
                  {payment.transactionId || '-'}
                </TableCell>
                <TableCell>
                  #{payment.reservationId}
                </TableCell>
                <TableCell className="font-semibold">
                  {formatPrice(payment.amount)}
                </TableCell>
                <TableCell>
                  {getMethodDisplayName(payment.method)}
                </TableCell>
                <TableCell>
                  <Badge className={getStatusBadgeVariant(payment.status)}>
                    {payment.status === 'completed' 
                      ? t('Completed') 
                      : payment.status === 'pending' 
                        ? t('Pending') 
                        : t('Failed')}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => navigate(`/admin/finance/payment/${payment.id}`)}
                  >
                    <Eye className="h-4 w-4 mr-1" />
                    {t('View')}
                  </Button>
                </TableCell>
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={7} className="text-center py-8 text-gray-500">
                {t('NoPaymentsFound')}
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}