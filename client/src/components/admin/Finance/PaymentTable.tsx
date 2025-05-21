import React from 'react';
import { useTranslation } from 'react-i18next';
import { format } from 'date-fns';
import { PAYMENT_METHODS, PAYMENT_STATUS } from '@/constants';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

interface Payment {
  id: number;
  reservation_id: number | null;
  amount: number;
  method: string;
  status: string;
  transaction_id: string;
  payment_date: string;
  created_at: string | null;
  updated_at?: string | null;
  details?: any;
  reference?: string;
  user_id?: number;
  username?: string;
  email?: string;
  payment_source?: string;
}

interface PaymentTableProps {
  payments: Payment[];
  isLoading?: boolean;
}

export default function PaymentTable({ payments, isLoading = false }: PaymentTableProps) {
  const { t } = useTranslation();

  // Format price to display as currency
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('pt-PT', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 2
    }).format(price / 100);
  };

  if (isLoading) {
    return (
      <div className="animate-pulse space-y-4">
        <div className="h-12 bg-gray-200 rounded"></div>
        <div className="h-96 bg-gray-200 rounded"></div>
      </div>
    );
  }

  return (
    <div className="border rounded-md">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>{t('Date')}</TableHead>
            <TableHead>{t('TransactionId')}</TableHead>
            <TableHead>{t('ReservationId')}</TableHead>
            <TableHead>{t('Amount')}</TableHead>
            <TableHead>{t('Method')}</TableHead>
            <TableHead>{t('Status')}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {payments.length > 0 ? (
            payments.map((payment) => (
              <TableRow key={payment.id}>
                <TableCell>
                  {payment.payment_date ? format(new Date(payment.payment_date), 'dd/MM/yyyy HH:mm') : '-'}
                </TableCell>
                <TableCell className="font-medium">
                  {payment.transaction_id || payment.reference || '-'}
                </TableCell>
                <TableCell>
                  {payment.reservation_id ? `#${payment.reservation_id}` : 
                   payment.details?.orderId ? `POS #${payment.details.orderId}` : 
                   payment.payment_source === 'pos' ? 'POS' : '-'}
                </TableCell>
                <TableCell className="font-medium">
                  {formatPrice(payment.amount)}
                </TableCell>
                <TableCell>
                  {PAYMENT_METHODS.find(m => m.id === payment.method)?.name || payment.method}
                </TableCell>
                <TableCell>
                  <Badge 
                    className={
                      payment.status === 'completed' ? 'bg-green-100 text-green-800' : 
                      payment.status === 'pending' ? 'bg-yellow-100 text-yellow-800' : 
                      'bg-red-100 text-red-800'
                    }
                  >
                    {PAYMENT_STATUS.find(s => s.id === payment.status)?.name || payment.status}
                  </Badge>
                </TableCell>
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={6} className="text-center py-6 text-gray-500">
                {t('NoPaymentsYet')}
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}