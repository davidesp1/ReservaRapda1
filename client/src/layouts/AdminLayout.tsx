import { ReactNode } from "react";
import AdminSidebar from "@/components/admin/Sidebar";
import { useTranslation } from "react-i18next";
import { Helmet } from "react-helmet";

interface AdminLayoutProps {
  children: ReactNode;
  title?: string;
}

export default function AdminLayout({ children, title }: AdminLayoutProps) {
  const { t } = useTranslation();
  const pageTitle = title || t('admin.dashboard');
  
  return (
    <div className="flex min-h-screen bg-background">
      <Helmet>
        <title>{pageTitle} | Opa que Delícia - Admin</title>
      </Helmet>
      
      <AdminSidebar />
      
      <div className="flex-1 flex flex-col">
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}