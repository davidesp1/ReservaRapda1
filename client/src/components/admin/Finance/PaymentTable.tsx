import React from 'react';
import { useTranslation } from 'react-i18next';
import { format } from 'date-fns';
import { PAYMENT_METHODS, PAYMENT_STATUS } from '@/constants';
import { Badge } from '@/components/ui/badge';
import { CreditCard, Smartphone, Banknote, ArrowLeftRight, Landmark } from 'lucide-react';
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
            <TableHead>{t('Customer')}</TableHead>
            <TableHead>{t('Amount')}</TableHead>
            <TableHead>{t('Method')}</TableHead>
            <TableHead>{t('Status')}</TableHead>
            <TableHead>{t('Source')}</TableHead>
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
                  {payment.reservation_id ? (
                    <div>
                      <div className="font-medium">#{payment.reservation_id}</div>
                      {payment.reservation_date && payment.reservation_time && (
                        <div className="text-xs text-gray-500">
                          {format(new Date(payment.reservation_date), 'dd/MM/yyyy')} às {payment.reservation_time}
                        </div>
                      )}
                    </div>
                  ) : payment.details?.orderId ? `POS #${payment.details.orderId}` : 
                   payment.payment_source === 'pos' ? 'POS' : '-'}
                </TableCell>
                <TableCell>
                  {payment.username ? (
                    <div>
                      <div className="font-medium">{payment.username}</div>
                      <div className="text-xs text-gray-500">{payment.email}</div>
                    </div>
                  ) : '-'}
                </TableCell>
                <TableCell className="font-medium">
                  {formatPrice(payment.amount)}
                </TableCell>
                <TableCell>
                  <div className="flex items-center space-x-2">
                    {payment.method === 'card' && <CreditCard className="h-4 w-4 text-blue-600" />}
                    {payment.method === 'mbway' && <Smartphone className="h-4 w-4 text-green-600" />}
                    {payment.method === 'multibanco' && <Banknote className="h-4 w-4 text-orange-600" />}
                    {payment.method === 'transfer' && <ArrowLeftRight className="h-4 w-4 text-purple-600" />}
                    {payment.method === 'cash' && <Banknote className="h-4 w-4 text-gray-600" />}
                    {payment.method === 'multibanco_tpa' && <Landmark className="h-4 w-4 text-orange-500" />}
                    <span>{payment.method_display || PAYMENT_METHODS.find(m => m.id === payment.method)?.name || payment.method}</span>
                  </div>
                </TableCell>
                <TableCell>
                  <Badge 
                    className={
                      payment.status === 'completed' ? 'bg-green-100 text-green-800' : 
                      payment.status === 'pending' ? 'bg-yellow-100 text-yellow-800' : 
                      payment.status === 'refunded' ? 'bg-blue-100 text-blue-800' :
                      'bg-red-100 text-red-800'
                    }
                  >
                    {PAYMENT_STATUS.find(s => s.id === payment.status)?.name || payment.status}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Badge variant="outline" className="text-xs">
                    {payment.payment_source === 'reservation' ? t('Reservation') : 
                     payment.payment_source === 'pos' ? 'POS' : 
                     t('Other')}
                  </Badge>
                </TableCell>
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={8} className="text-center py-6 text-gray-500">
                {t('NoPaymentsYet')}
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}