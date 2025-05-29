import { useState } from 'react';
import { useTranslation } from "react-i18next";
import { useQuery } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { CustomerLayout } from "@/components/layouts/CustomerLayout";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Calendar,
  CreditCard,
  Download,
  FileText,
  Filter,
  Search,
  Users,
  MapPin,
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const PaymentsPage = () => {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");

  // Fetch client reservations from database
  const { data: reservations = [], isLoading } = useQuery({
    queryKey: ['/api/reservations'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/reservations');
      return response.json();
    },
  });

  // Filter reservations based on active tab and search term
  const filteredReservations = reservations
    .filter((reservation: any) => {
      if (activeTab === "all") return true;
      return reservation.payment_status === activeTab;
    })
    .filter((reservation: any) => {
      if (!searchTerm) return true;
      const term = searchTerm.toLowerCase();
      return (
        reservation.reservation_code?.toLowerCase().includes(term) ||
        (reservation.total / 100).toString().includes(term) ||
        reservation.payment_method?.toLowerCase().includes(term)
      );
    });

  // Format payment method
  const formatMethod = (method: string) => {
    if (!method) return 'N/A';
    switch (method) {
      case "card":
        return t("Card");
      case "mbway":
        return "MBWay";
      case "multibanco":
        return "Multibanco";
      case "transfer":
        return t("Transfer");
      case "cash":
        return t("Cash");
      default:
        return method;
    }
  };

  // Format status
  const formatStatus = (status: string) => {
    switch (status) {
      case "completed":
        return t("Completed");
      case "pending":
        return t("Pending");
      case "failed":
        return t("Failed");
      default:
        return status;
    }
  };

  // Render status badge
  const renderStatus = (status: string) => {
    const variant = status === "completed" ? "default" : 
                   status === "pending" ? "secondary" : "destructive";
    return <Badge variant={variant}>{formatStatus(status)}</Badge>;
  };

  // Handle download receipt
  const handleDownload = (reservation: any) => {
    console.log("Download receipt for reservation:", reservation.id);
  };

  // Handle view details
  const handleViewDetails = (reservation: any) => {
    console.log("View details for reservation:", reservation.id);
  };

  // Get summary statistics
  const totalReservations = reservations.length;
  const completedPayments = reservations.filter((r: any) => r.payment_status === "completed").length;
  const pendingPayments = reservations.filter((r: any) => r.payment_status === "pending").length;
  const totalAmount = reservations
    .filter((r: any) => r.payment_status === "completed")
    .reduce((sum: number, r: any) => sum + (r.total || 0), 0);

  if (isLoading) {
    return (
      <CustomerLayout>
        <div className="container mx-auto p-6">
          <div className="text-center">Loading...</div>
        </div>
      </CustomerLayout>
    );
  }

  return (
    <CustomerLayout>
      <div className="container mx-auto p-6 space-y-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">{t("MyReservations")}</h1>
            <p className="text-muted-foreground">{t("ViewManageReservations")}</p>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{t("TotalReservations")}</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalReservations}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{t("CompletedPayments")}</CardTitle>
              <CreditCard className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{completedPayments}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{t("PendingPayments")}</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{pendingPayments}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{t("TotalSpent")}</CardTitle>
              <MapPin className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">€{(totalAmount / 100).toFixed(2)}</div>
            </CardContent>
          </Card>
        </div>

        {/* Filters and Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <TabsList>
              <TabsTrigger value="all">{t("All")}</TabsTrigger>
              <TabsTrigger value="completed">{t("Completed")}</TabsTrigger>
              <TabsTrigger value="pending">{t("Pending")}</TabsTrigger>
              <TabsTrigger value="failed">{t("Failed")}</TabsTrigger>
            </TabsList>

            <div className="flex items-center space-x-2">
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder={t("SearchReservations")}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8 w-[250px]"
                />
              </div>
            </div>
          </div>

          <TabsContent value={activeTab}>
            {filteredReservations.length > 0 ? (
              <Card>
                <CardContent className="pt-6">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>{t("ReservationCode")}</TableHead>
                        <TableHead>{t("Date")}</TableHead>
                        <TableHead>{t("Table")}</TableHead>
                        <TableHead>{t("Amount")}</TableHead>
                        <TableHead>{t("PaymentMethod")}</TableHead>
                        <TableHead>{t("Status")}</TableHead>
                        <TableHead className="text-right">{t("Actions")}</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredReservations.map((reservation: any) => (
                        <TableRow key={reservation.id}>
                          <TableCell className="font-medium">
                            {reservation.reservation_code || `RES-${reservation.id}`}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center">
                              <Calendar className="mr-2 h-4 w-4 text-gray-500" />
                              {new Date(reservation.date).toLocaleDateString()}
                            </div>
                          </TableCell>
                          <TableCell>
                            Mesa {reservation.table_number || reservation.table_id}
                          </TableCell>
                          <TableCell className="font-medium">
                            €{(reservation.total / 100).toFixed(2)}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center">
                              <CreditCard className="mr-2 h-4 w-4 text-gray-500" />
                              {formatMethod(reservation.payment_method)}
                            </div>
                          </TableCell>
                          <TableCell>
                            {renderStatus(reservation.payment_status || "pending")}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end space-x-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDownload(reservation)}
                              >
                                <Download className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleViewDetails(reservation)}
                              >
                                <FileText className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardContent className="pt-6">
                  <div className="text-center py-8">
                    <CreditCard className="mx-auto h-12 w-12 text-gray-400" />
                    <h3 className="mt-2 text-sm font-medium text-gray-900">
                      {t("NoReservationsFound")}
                    </h3>
                    <p className="mt-1 text-sm text-gray-500">
                      {t("NoReservationsFoundDescription")}
                    </p>
                  </div>
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