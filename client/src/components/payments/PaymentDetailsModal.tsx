import React from "react";
import { useTranslation } from "react-i18next";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import CountdownTimer from "./CountdownTimer";
import QRCodeDisplay from "./QRCodeDisplay";
import { useCancelPayment, usePaymentStatus } from "@/hooks/usePayment";
import { CreditCard, Smartphone, Landmark } from "lucide-react";

interface PaymentDetailsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  method: "multibanco" | "mbway" | "card";
  reference: string;
  entity?: string;
  amount: number;
  phone?: string;
}

const PaymentDetailsModal: React.FC<PaymentDetailsModalProps> = ({
  open,
  onOpenChange,
  method,
  reference,
  entity,
  amount,
  phone,
}) => {
  const { t } = useTranslation();
  const { data: statusData } = usePaymentStatus(reference);
  const cancelMutation = useCancelPayment();

  const handleExpire = () => {
    cancelMutation.mutate(reference);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {method === "multibanco" && (
              <div className="flex items-center">
                <Landmark className="mr-2 h-5 w-5" />
                {t("MultibancoPayment")}
              </div>
            )}
            {method === "mbway" && (
              <div className="flex items-center">
                <Smartphone className="mr-2 h-5 w-5" />
                {t("MBWayPayment")}
              </div>
            )}
            {method === "card" && (
              <div className="flex items-center">
                <CreditCard className="mr-2 h-5 w-5" />
                {t("CardPayment")}
              </div>
            )}
          </DialogTitle>
          <DialogDescription>
            {method === "multibanco" && t("MultibancoPaymentDescription")}
            {method === "mbway" && t("MBWayPaymentDescription")}
            {method === "card" && t("CardPaymentDescription")}
          </DialogDescription>
        </DialogHeader>
        
        <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
          {method === "multibanco" && entity && (
            <div className="space-y-4">
              <CountdownTimer 
                expirationDate={new Date(Date.now() + 30 * 60 * 1000).toISOString()} 
                reference={reference}
                onExpire={handleExpire} 
              />
              
              <div className="text-center mb-4">
                <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                  {statusData?.status === "paid" ? t("Paid") : t("Pending")}
                </span>
              </div>
              
              <QRCodeDisplay entity={entity} reference={reference} amount={amount} />
              
              <div className="flex justify-between">
                <span className="font-medium">{t("Entity")}:</span>
                <span className="font-bold">{entity}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium">{t("Reference")}:</span>
                <span className="font-bold">{reference}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium">{t("Amount")}:</span>
                <span className="font-bold">€{amount.toLocaleString('pt-PT', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span>
              </div>
            </div>
          )}
          
          {method === "mbway" && phone && (
            <div className="space-y-4">
              <CountdownTimer 
                expirationDate={new Date(Date.now() + 30 * 60 * 1000).toISOString()} 
                reference={reference}
                onExpire={handleExpire} 
              />
              
              <div className="text-center mb-4">
                <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                  {statusData?.status === "paid" ? t("Paid") : t("Pending")}
                </span>
              </div>
              
              <div className="text-center p-4 bg-white rounded-lg border border-gray-200">
                <Smartphone className="h-16 w-16 mx-auto mb-2 text-gray-400" />
                <p className="text-sm text-gray-600 mb-2">{t("MBWayInstructions")}</p>
                <div className="font-medium">{phone}</div>
              </div>
            </div>
          )}
          
          {method === "card" && statusData?.paymentUrl && (
            <div className="space-y-4">
              <div className="text-center mb-4">
                <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                  {statusData?.status === "paid" ? t("Paid") : t("Pending")}
                </span>
              </div>
              
              <div className="text-center">
                <CreditCard className="h-16 w-16 mx-auto mb-4 text-gray-400" />
                <p className="text-sm text-gray-600 mb-4">{t("CardInstructions")}</p>
                <Button onClick={() => window.open(statusData.paymentUrl, "_blank")}>
                  {t("GoToPayment")}
                </Button>
              </div>
            </div>
          )}
        </div>
        
        <DialogFooter>
          <Button 
            variant="outline" 
            onClick={() => cancelMutation.mutate(reference)}
            disabled={cancelMutation.isLoading}
          >
            {t("CancelPayment")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default PaymentDetailsModal;
