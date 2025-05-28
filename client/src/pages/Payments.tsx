import { useState, useEffect } from 'react';
import { useTranslation } from "react-i18next";
import { supabase } from '@/lib/supabaseClient';
import { CustomerLayout } from "@/components/layouts/CustomerLayout";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { useLocation } from "wouter";
import {
  CreditCard,
  Clock,
  CheckCircle2,
  XCircle,
  Calendar,
  Filter,
  Search,
  Download,
  FileText,
  Phone,
  Plus,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

// Interface para representar um pagamento
interface Payment {
  id: number;
  date: string;
  amount: number;
  status: "completed" | "pending" | "failed";
  method: "card" | "mbway" | "multibanco" | "transfer";
  reference: string;
  reservation_code: string;
}

const PaymentsPage = () => {
  const { t } = useTranslation();
  const [, setLocation] = useLocation();
  const [activeTab, setActiveTab] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [showSettings, setShowSettings] = useState(false);

  // Dados de exemplo
  const payments: Payment[] = [
    {
      id: 1,
      date: "2025-05-15T18:30:00",
      amount: 58.9,
      status: "completed",
      method: "card",
      reference: "REF2025051501",
      reservation_code: 101,
    },
    {
      id: 2,
      date: "2025-05-12T19:45:00",
      amount: 74.5,
      status: "completed",
      method: "mbway",
      reference: "REF2025051202",
      reservation_code: 98,
    },
    {
      id: 3,
      date: "2025-05-28T20:00:00",
      amount: 125.75,
      status: "pending",
      method: "multibanco",
      reference: "REF2025052803",
      reservation_code: 112,
    },
    {
      id: 4,
      date: "2025-05-30T12:15:00",
      amount: 45.2,
      status: "pending",
      method: "transfer",
      reference: "REF2025053004",
      reservation_code: 118,
    },
    {
      id: 5,
      date: "2025-05-10T13:30:00",
      amount: 92.4,
      status: "failed",
      method: "card",
      reference: "REF2025051005",
      reservation_code: 95,
    },
  ];

  // Filtrar pagamentos com base na aba ativa e termo de busca
  const getFilteredPayments = () => {
    return payments
      .filter((payment) => {
        if (activeTab === "all") return true;
        return payment.status === activeTab;
      })
      .filter((payment) => {
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
      case "card":
        return t("Card");
      case "mbway":
        return "MBWay";
      case "multibanco":
        return "Multibanco";
      case "transfer":
        return t("Transfer");
      default:
        return method;
    }
  };

  // Formatar status de pagamento com badge
  const renderStatus = (status: string) => {
    switch (status) {
      case "completed":
        return (
          <Badge className="bg-green-500 hover:bg-green-600">
            <CheckCircle2 className="mr-1 h-3 w-3" /> {t("Completed")}
          </Badge>
        );
      case "pending":
        return (
          <Badge variant="outline" className="text-amber-500 border-amber-500">
            <Clock className="mr-1 h-3 w-3" /> {t("Pending")}
          </Badge>
        );
      case "failed":
        return (
          <Badge variant="destructive">
            <XCircle className="mr-1 h-3 w-3" /> {t("Failed")}
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
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">{t("Payments")}</h1>
          <Button
            variant="outline"
            className="bg-brasil-green text-white border-brasil-green hover:bg-brasil-green/90"
            onClick={() => setShowSettings(!showSettings)}
          >
            {showSettings ? t("HideSettings") : t("PaymentSettings")}
          </Button>
        </div>

        {showSettings ? (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>{t("PaymentSettings")}</CardTitle>
              <CardDescription>
                {t("ManageYourPaymentPreferences")}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <h3 className="text-lg font-medium mb-4">
                  {t("DefaultPaymentMethods")}
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Cartão de Crédito */}
                  <Card className="border-2 border-brasil-blue">
                    <CardHeader className="pb-2">
                      <div className="flex justify-between items-center">
                        <CardTitle className="text-base">{t("Card")}</CardTitle>
                        <Badge variant="outline" className="text-brasil-blue">
                          {t("Default")}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <div className="flex items-center text-sm text-gray-500">
                        <CreditCard className="mr-2 h-4 w-4" />
                        **** **** **** 4789
                      </div>
                      <div className="text-xs text-gray-500 mt-1">
                        {t("ExpiresOn")}: 08/2026
                      </div>
                    </CardContent>
                    <CardFooter className="flex justify-between pt-0">
                      <Button variant="ghost" size="sm">
                        {t("Edit")}
                      </Button>
                      <Button variant="ghost" size="sm">
                        {t("Remove")}
                      </Button>
                    </CardFooter>
                  </Card>

                  {/* MBWay */}
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-base">MBWay</CardTitle>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <div className="flex items-center text-sm text-gray-500">
                        <Phone className="mr-2 h-4 w-4" />
                        +351 96 *** **23
                      </div>
                    </CardContent>
                    <CardFooter className="flex justify-between pt-0">
                      <Button variant="ghost" size="sm">
                        {t("Edit")}
                      </Button>
                      <Button variant="ghost" size="sm">
                        {t("MakeDefault")}
                      </Button>
                    </CardFooter>
                  </Card>

                  {/* Multibanco */}
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-base">Multibanco</CardTitle>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <div className="text-sm text-gray-500">
                        <div className="flex items-center mb-1">
                          <span className="font-medium mr-2">
                            {t("Entity")}:
                          </span>
                          12345
                        </div>
                        <div className="flex items-center">
                          <span className="font-medium mr-2">
                            {t("Reference")}:
                          </span>
                          123 456 789
                        </div>
                      </div>
                    </CardContent>
                    <CardFooter className="flex justify-between pt-0">
                      <Button variant="ghost" size="sm">
                        {t("Generate")}
                      </Button>
                      <Button variant="ghost" size="sm">
                        {t("MakeDefault")}
                      </Button>
                    </CardFooter>
                  </Card>

                  {/* Transferência Bancária */}
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-base">
                        {t("BankTransfer")}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <div className="text-sm text-gray-500">
                        <div className="flex items-center mb-1">
                          <span className="font-medium mr-2">IBAN:</span>
                          PT50 0023 0000 45678900123 72
                        </div>
                        <div className="flex items-center">
                          <span className="font-medium mr-2">
                            {t("BankName")}:
                          </span>
                          Banco Opa que delícia
                        </div>
                      </div>
                    </CardContent>
                    <CardFooter className="flex justify-between pt-0">
                      <Button variant="ghost" size="sm">
                        {t("CopyDetails")}
                      </Button>
                      <Button variant="ghost" size="sm">
                        {t("MakeDefault")}
                      </Button>
                    </CardFooter>
                  </Card>
                </div>

                <Button className="mt-4 bg-brasil-green text-white hover:bg-brasil-green/90">
                  <Plus className="mr-2 h-4 w-4" />
                  {t("AddPaymentMethod")}
                </Button>
              </div>

              <Separator />

              <div>
                <h3 className="text-lg font-medium mb-4">
                  {t("BillingInformation")}
                </h3>
                <div className="space-y-4">
                  <div>
                    <Label>{t("BillingName")}</Label>
                    <div className="flex items-center justify-between mt-1">
                      <p className="text-sm">Katia Ferreira</p>
                      <Button variant="ghost" size="sm">
                        {t("Edit")}
                      </Button>
                    </div>
                  </div>

                  <div>
                    <Label>{t("BillingAddress")}</Label>
                    <div className="flex items-center justify-between mt-1">
                      <p className="text-sm">
                        Rua do Carregado, 123
                        <br />
                        2580-465 Carregado
                        <br />
                        Portugal
                      </p>
                      <Button variant="ghost" size="sm">
                        {t("Edit")}
                      </Button>
                    </div>
                  </div>

                  <div>
                    <Label>{t("BillingEmail")}</Label>
                    <div className="flex items-center justify-between mt-1">
                      <p className="text-sm">katiaf@email.com</p>
                      <Button variant="ghost" size="sm">
                        {t("Edit")}
                      </Button>
                    </div>
                  </div>
                </div>
              </div>

              <Separator />

              <div>
                <h3 className="text-lg font-medium mb-4">{t("Preferences")}</h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>{t("AutomaticReceipts")}</Label>
                      <p className="text-sm text-gray-500">
                        {t("AutomaticReceiptsDescription")}
                      </p>
                    </div>
                    <Switch defaultChecked />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <Label>{t("PaymentNotifications")}</Label>
                      <p className="text-sm text-gray-500">
                        {t("PaymentNotificationsDescription")}
                      </p>
                    </div>
                    <Switch defaultChecked />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <Label>{t("SavePaymentMethods")}</Label>
                      <p className="text-sm text-gray-500">
                        {t("SavePaymentMethodsDescription")}
                      </p>
                    </div>
                    <Switch defaultChecked />
                  </div>
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex justify-end">
              <Button className="bg-brasil-green text-white hover:bg-brasil-green/90">
                {t("SaveSettings")}
              </Button>
            </CardFooter>
          </Card>
        ) : null}

        <Tabs defaultValue="all" value={activeTab} onValueChange={setActiveTab}>
          <div className="flex justify-between items-center mb-6">
            <TabsList>
              <TabsTrigger value="all">{t("All")}</TabsTrigger>
              <TabsTrigger value="completed">{t("Completed")}</TabsTrigger>
              <TabsTrigger value="pending">{t("Pending")}</TabsTrigger>
              <TabsTrigger value="failed">{t("Failed")}</TabsTrigger>
            </TabsList>

            <div className="flex items-center space-x-2">
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
                <Input
                  placeholder={t("Search")}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8 w-[200px]"
                />
              </div>
              <Select defaultValue="date-desc">
                <SelectTrigger className="w-[160px]">
                  <Filter className="mr-2 h-4 w-4" />
                  <SelectValue placeholder={t("Sort")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="date-desc">{t("DateNewest")}</SelectItem>
                  <SelectItem value="date-asc">{t("DateOldest")}</SelectItem>
                  <SelectItem value="amount-desc">
                    {t("AmountHighest")}
                  </SelectItem>
                  <SelectItem value="amount-asc">
                    {t("AmountLowest")}
                  </SelectItem>
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
                        <TableHead>{t("ReservationCode")}</TableHead>
                        <TableHead>{t("Date")}</TableHead>
                        <TableHead>{t("Reference")}</TableHead>
                        <TableHead>{t("Amount")}</TableHead>
                        <TableHead>{t("PaymentMethod")}</TableHead>
                        <TableHead>{t("Status")}</TableHead>
                        <TableHead className="text-right">
                          {t("Actions")}
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredPayments.map((payment) => (
                        <TableRow key={payment.id}>
                          <TableCell>{payment.reservation_code}</TableCell>
                          <TableCell>
                            <div className="flex items-center">
                              <Calendar className="mr-2 h-4 w-4 text-gray-500" />
                              {new Date(payment.date).toLocaleDateString()}
                            </div>
                          </TableCell>
                          <TableCell>{payment.reference}</TableCell>
                          <TableCell className="font-medium">
                            €{payment.amount.toFixed(2)}
                          </TableCell>
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
                                onClick={() =>
                                  setLocation(`/payment-details/${payment.id}`)
                                }
                              >
                                <FileText className="mr-1 h-4 w-4" />{" "}
                                {t("Details")}
                              </Button>
                              {payment.status === "completed" && (
                                <Button variant="outline" size="sm">
                                  <Download className="mr-1 h-4 w-4" />{" "}
                                  {t("Receipt")}
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
                  <CardTitle>{t("NoPaymentsFound")}</CardTitle>
                  <CardDescription>
                    {searchTerm
                      ? t("NoPaymentsMatchingSearch")
                      : t("NoPaymentsMessage")}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {searchTerm && (
                    <Button variant="outline" onClick={() => setSearchTerm("")}>
                      {t("ClearSearch")}
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
