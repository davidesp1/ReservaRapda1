import { useEffect, useState } from "react";
import { Helmet } from "react-helmet";
import { useTranslation } from "react-i18next";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AdminLayout } from "@/components/layouts/AdminLayout";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";

// Sample data - in a real application this would come from API
const reservationData = [
  { month: 'Jan', count: 45 },
  { month: 'Feb', count: 52 },
  { month: 'Mar', count: 61 },
  { month: 'Apr', count: 58 },
  { month: 'May', count: 63 },
  { month: 'Jun', count: 75 },
];

const menuItemPopularity = [
  { name: 'Feijoada', value: 35 },
  { name: 'Picanha', value: 40 },
  { name: 'Moqueca', value: 25 },
  { name: 'Acarajé', value: 20 },
  { name: 'Pão de Queijo', value: 30 },
];

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

function ReportsManager() {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState("reservations");

  return (
    <AdminLayout>
      <Helmet>
        <title>{t("Reports")} | Opa que delicia</title>
        <meta name="description" content={t("View restaurant performance reports and analytics")} />
      </Helmet>

      <div className="container mx-auto py-6">
        <h1 className="text-3xl font-bold mb-6">{t("Reports & Analytics")}</h1>

        <Tabs defaultValue="reservations" value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-6">
            <TabsTrigger value="reservations">{t("Reservations")}</TabsTrigger>
            <TabsTrigger value="menuItems">{t("Menu Items")}</TabsTrigger>
            <TabsTrigger value="revenue">{t("Revenue")}</TabsTrigger>
          </TabsList>
          
          <TabsContent value="reservations">
            <Card>
              <CardHeader>
                <CardTitle>{t("Reservation Trends")}</CardTitle>
                <CardDescription>{t("Monthly reservation counts for the past 6 months")}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={reservationData}
                      margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="count" fill="#8884d8" name={t("Reservations")} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="menuItems">
            <Card>
              <CardHeader>
                <CardTitle>{t("Popular Menu Items")}</CardTitle>
                <CardDescription>{t("Most ordered menu items")}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={menuItemPopularity}
                        cx="50%"
                        cy="50%"
                        labelLine={true}
                        label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {menuItemPopularity.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="revenue">
            <Card>
              <CardHeader>
                <CardTitle>{t("Revenue Analysis")}</CardTitle>
                <CardDescription>{t("Coming soon...")}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-center h-60 bg-muted/30 rounded-md">
                  <p className="text-muted-foreground">{t("Revenue analytics will be available in the next update")}</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AdminLayout>
  );
}

export default ReportsManager;