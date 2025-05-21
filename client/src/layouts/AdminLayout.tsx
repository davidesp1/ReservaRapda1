import { ReactNode } from "react";
import { Helmet } from "react-helmet";
import { useTranslation } from "react-i18next";
import AdminSidebar from "@/components/admin/Sidebar";

interface AdminLayoutProps {
  children: ReactNode;
  title?: string;
}

export default function AdminLayout({ children, title }: AdminLayoutProps) {
  const { t } = useTranslation();
  const pageTitle = title ? `${title} | ${t('common.adminPanel')}` : t('common.adminPanel');

  return (
    <div className="flex min-h-screen bg-muted/30">
      <Helmet>
        <title>{pageTitle}</title>
      </Helmet>
      
      {/* Sidebar */}
      <AdminSidebar />
      
      {/* Main content */}
      <div className="flex-1">
        {title && (
          <header className="border-b bg-background sticky top-0 z-10">
            <div className="px-4 py-4 sm:px-6 lg:px-8 flex items-center justify-between">
              <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
            </div>
          </header>
        )}
        
        <main>
          {children}
        </main>
      </div>
    </div>
  );
}