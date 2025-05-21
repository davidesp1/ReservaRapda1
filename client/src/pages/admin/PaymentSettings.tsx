import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import AdminLayout from "@/layouts/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import { 
  CreditCard, 
  Smartphone, 
  RefreshCcw, 
  Building2, 
  Banknote,
  Key,
  AlertCircle
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

export default function PaymentSettings() {
  const { t } = useTranslation();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [eupagoApiKey, setEupagoApiKey] = useState("");
  const [enabledMethods, setEnabledMethods] = useState({
    card: true,
    mbway: true,
    multibanco: true,
    bankTransfer: true,
    cash: true
  });
  const [isTesting, setIsTesting] = useState(false);

  // Query to fetch payment settings
  const { data: paymentSettings, isLoading } = useQuery({
    queryKey: ["/api/settings/payment"],
    onSuccess: (data) => {
      if (data) {
        setEupagoApiKey(data.eupagoApiKey || "");
        
        // Update enabled methods if present in settings
        if (data.enabledPaymentMethods) {
          setEnabledMethods({
            card: data.enabledPaymentMethods.includes("card"),
            mbway: data.enabledPaymentMethods.includes("mbway"),
            multibanco: data.enabledPaymentMethods.includes("multibanco"),
            bankTransfer: data.enabledPaymentMethods.includes("bankTransfer"),
            cash: data.enabledPaymentMethods.includes("cash")
          });
        }
      }
    }
  });

  // Mutation to update payment settings
  const updateSettingsMutation = useMutation({
    mutationFn: async (settings: any) => {
      const response = await apiRequest("POST", "/api/settings/payment", settings);
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Falha ao atualizar configurações");
      }
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: t('paymentSettings.saveSuccess'),
        description: t('paymentSettings.settingsSaved'),
      });
      queryClient.invalidateQueries({ queryKey: ["/api/settings/payment"] });
    },
    onError: (error: Error) => {
      toast({
        title: t('paymentSettings.saveError'),
        description: error.message,
        variant: "destructive",
      });
    }
  });

  // Test EuPago API key
  const testApiKeyMutation = useMutation({
    mutationFn: async () => {
      setIsTesting(true);
      const response = await apiRequest("POST", "/api/settings/payment/test", { apiKey: eupagoApiKey });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Falha ao testar API key");
      }
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: t('paymentSettings.testSuccess'),
        description: t('paymentSettings.apiKeyValid'),
      });
    },
    onError: (error: Error) => {
      toast({
        title: t('paymentSettings.testError'),
        description: error.message,
        variant: "destructive",
      });
    },
    onSettled: () => {
      setIsTesting(false);
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Convert enabled methods to array
    const enabledPaymentMethods = Object.entries(enabledMethods)
      .filter(([_, enabled]) => enabled)
      .map(([method]) => method);
    
    updateSettingsMutation.mutate({
      eupagoApiKey,
      enabledPaymentMethods
    });
  };

  const handleTestApiKey = () => {
    if (!eupagoApiKey.trim()) {
      toast({
        title: t('paymentSettings.missingKey'),
        description: t('paymentSettings.enterApiKey'),
        variant: "destructive",
      });
      return;
    }
    
    testApiKeyMutation.mutate();
  };

  return (
    <AdminLayout title={t('paymentSettings.title')}>
      <div className="p-4 sm:p-6 lg:p-8 space-y-6">
        <form onSubmit={handleSubmit}>
          <div className="grid gap-6">
            {/* API Keys Section */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Key className="h-5 w-5" />
                  {t('paymentSettings.apiKeys')}
                </CardTitle>
                <CardDescription>
                  {t('paymentSettings.apiKeysDescription')}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="eupagoApiKey">
                    {t('paymentSettings.eupagoApiKey')}
                  </Label>
                  <div className="flex gap-2">
                    <Input
                      id="eupagoApiKey"
                      type="password"
                      value={eupagoApiKey}
                      onChange={(e) => setEupagoApiKey(e.target.value)}
                      className="flex-1"
                      placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
                    />
                    <Button 
                      type="button" 
                      variant="outline" 
                      onClick={handleTestApiKey}
                      disabled={isTesting || !eupagoApiKey.trim()}
                    >
                      {isTesting ? t('paymentSettings.testing') : t('paymentSettings.testConnection')}
                    </Button>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {t('paymentSettings.eupagoApiKeyDescription')}
                  </p>
                </div>

                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>{t('paymentSettings.important')}</AlertTitle>
                  <AlertDescription>
                    {t('paymentSettings.sandboxWarning')}
                  </AlertDescription>
                </Alert>
              </CardContent>
            </Card>

            {/* Payment Methods Section */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="h-5 w-5" />
                  {t('paymentSettings.paymentMethods')}
                </CardTitle>
                <CardDescription>
                  {t('paymentSettings.paymentMethodsDescription')}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4">
                  <div className="flex items-center justify-between py-2 border-b">
                    <div className="flex items-center space-x-3">
                      <CreditCard className="h-5 w-5 text-blue-500" />
                      <div>
                        <Label>{t('payment.card')}</Label>
                        <p className="text-sm text-muted-foreground">
                          {t('payment.cardDescription')}
                        </p>
                      </div>
                    </div>
                    <Switch
                      checked={enabledMethods.card}
                      onCheckedChange={(checked) => setEnabledMethods({...enabledMethods, card: checked})}
                    />
                  </div>

                  <div className="flex items-center justify-between py-2 border-b">
                    <div className="flex items-center space-x-3">
                      <Smartphone className="h-5 w-5 text-green-500" />
                      <div>
                        <Label>{t('payment.mbway')}</Label>
                        <p className="text-sm text-muted-foreground">
                          {t('payment.mbwayDescription')}
                        </p>
                      </div>
                    </div>
                    <Switch
                      checked={enabledMethods.mbway}
                      onCheckedChange={(checked) => setEnabledMethods({...enabledMethods, mbway: checked})}
                    />
                  </div>

                  <div className="flex items-center justify-between py-2 border-b">
                    <div className="flex items-center space-x-3">
                      <RefreshCcw className="h-5 w-5 text-indigo-500" />
                      <div>
                        <Label>{t('payment.multibanco')}</Label>
                        <p className="text-sm text-muted-foreground">
                          {t('payment.multibancoDescription')}
                        </p>
                      </div>
                    </div>
                    <Switch
                      checked={enabledMethods.multibanco}
                      onCheckedChange={(checked) => setEnabledMethods({...enabledMethods, multibanco: checked})}
                    />
                  </div>

                  <div className="flex items-center justify-between py-2 border-b">
                    <div className="flex items-center space-x-3">
                      <Building2 className="h-5 w-5 text-gray-500" />
                      <div>
                        <Label>{t('payment.bankTransfer')}</Label>
                        <p className="text-sm text-muted-foreground">
                          {t('payment.bankTransferDescription')}
                        </p>
                      </div>
                    </div>
                    <Switch
                      checked={enabledMethods.bankTransfer}
                      onCheckedChange={(checked) => setEnabledMethods({...enabledMethods, bankTransfer: checked})}
                    />
                  </div>

                  <div className="flex items-center justify-between py-2">
                    <div className="flex items-center space-x-3">
                      <Banknote className="h-5 w-5 text-emerald-500" />
                      <div>
                        <Label>{t('payment.cash')}</Label>
                        <p className="text-sm text-muted-foreground">
                          {t('payment.cashDescription')}
                        </p>
                      </div>
                    </div>
                    <Switch
                      checked={enabledMethods.cash}
                      onCheckedChange={(checked) => setEnabledMethods({...enabledMethods, cash: checked})}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="flex justify-end">
              <Button 
                type="submit" 
                disabled={updateSettingsMutation.isPending}
                className="min-w-[120px]"
              >
                {updateSettingsMutation.isPending 
                  ? t('paymentSettings.saving') 
                  : t('paymentSettings.saveSettings')}
              </Button>
            </div>
          </div>
        </form>
      </div>
    </AdminLayout>
  );
}