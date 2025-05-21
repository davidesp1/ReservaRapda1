import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import {
  Home,
  MenuSquare,
  Calendar,
  Users,
  CreditCard,
  Settings,
  ChevronRight,
  LogOut,
  BarChart,
  ChefHat,
  Table2,
  CircleDollarSign,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { ScrollArea } from "@/components/ui/scroll-area";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/hooks/useAuth";

export default function AdminSidebar() {
  const { t } = useTranslation();
  const [location] = useLocation();
  const { user } = useAuth();
  const [expanded, setExpanded] = useState(true);

  const handleLogout = async () => {
    try {
      await apiRequest("GET", "/api/logout");
      window.location.href = "/";
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  const primaryNavItems = [
    {
      title: t('admin.dashboard'),
      href: "/admin",
      icon: Home,
    },
    {
      title: t('admin.reservations'),
      href: "/admin/reservations",
      icon: Calendar,
    },
    {
      title: t('admin.menu'),
      href: "/admin/menu",
      icon: MenuSquare,
    },
    {
      title: t('admin.tables'),
      href: "/admin/tables",
      icon: Table2,
    },
    {
      title: t('admin.customers'),
      href: "/admin/customers",
      icon: Users,
    },
    {
      title: t('admin.staff'),
      href: "/admin/staff",
      icon: ChefHat,
    },
    {
      title: t('admin.pos'),
      href: "/admin/pos",
      icon: CreditCard,
    },
    {
      title: t('admin.finances'),
      href: "/admin/finances",
      icon: CircleDollarSign,
    },
    {
      title: t('admin.reports'),
      href: "/admin/reports",
      icon: BarChart,
    },
  ];
  
  const secondaryNavItems = [
    {
      title: t('admin.settings'),
      href: "/admin/settings",
      icon: Settings,
    },
    {
      title: t('admin.paymentSettings'),
      href: "/admin/payment-settings",
      icon: CreditCard,
    },
  ];

  return (
    <aside
      className={cn(
        "bg-primary-foreground border-r flex flex-col transition-all duration-300 h-screen sticky top-0",
        expanded ? "w-64" : "w-16"
      )}
    >
      {/* Logo & Toggle Button */}
      <div className="flex items-center justify-between p-4 border-b h-16">
        {expanded ? (
          <Link href="/admin">
            <a className="text-xl font-bold">Opa que Delícia</a>
          </Link>
        ) : (
          <div className="w-full flex justify-center">
            <Link href="/admin">
              <a className="text-xl font-bold">OQD</a>
            </Link>
          </div>
        )}
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setExpanded(!expanded)}
          className="text-muted-foreground"
        >
          <ChevronRight
            className={cn(
              "h-5 w-5 transition-transform",
              expanded ? "rotate-180" : ""
            )}
          />
        </Button>
      </div>

      {/* Navigation */}
      <ScrollArea className="flex-1">
        <div className="px-3 py-4">
          <div className="mb-6">
            <div
              className={cn(
                "text-xs uppercase font-medium text-muted-foreground mb-2",
                !expanded && "sr-only"
              )}
            >
              {t('admin.primaryNav')}
            </div>
            <nav className="space-y-1">
              {primaryNavItems.map((item) => (
                <Link key={item.href} href={item.href}>
                  <a
                    className={cn(
                      "flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors",
                      location === item.href
                        ? "bg-primary text-primary-foreground"
                        : "text-foreground hover:bg-muted",
                      !expanded && "justify-center"
                    )}
                  >
                    <item.icon
                      className={cn("h-5 w-5", expanded && "mr-3")}
                    />
                    {expanded && <span>{item.title}</span>}
                  </a>
                </Link>
              ))}
            </nav>
          </div>

          <div className="mb-6">
            <div
              className={cn(
                "text-xs uppercase font-medium text-muted-foreground mb-2",
                !expanded && "sr-only"
              )}
            >
              {t('admin.secondaryNav')}
            </div>
            <nav className="space-y-1">
              {secondaryNavItems.map((item) => (
                <Link key={item.href} href={item.href}>
                  <a
                    className={cn(
                      "flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors",
                      location === item.href
                        ? "bg-primary text-primary-foreground"
                        : "text-foreground hover:bg-muted",
                      !expanded && "justify-center"
                    )}
                  >
                    <item.icon
                      className={cn("h-5 w-5", expanded && "mr-3")}
                    />
                    {expanded && <span>{item.title}</span>}
                  </a>
                </Link>
              ))}
            </nav>
          </div>
        </div>
      </ScrollArea>

      {/* User Info & Logout */}
      <div className="border-t p-4">
        <div className="flex items-center justify-between">
          {expanded && (
            <div className="flex items-center">
              <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-primary-foreground">
                {user?.firstName?.charAt(0) || "A"}
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium">{user?.firstName || "Admin"}</p>
                <p className="text-xs text-muted-foreground">{user?.email || ""}</p>
              </div>
            </div>
          )}
          <Button
            variant="ghost"
            size={expanded ? "default" : "icon"}
            onClick={handleLogout}
            className="text-muted-foreground hover:text-foreground"
          >
            <LogOut className={cn("h-5 w-5", expanded && "mr-2")} />
            {expanded && t('common.logout')}
          </Button>
        </div>
      </div>
    </aside>
  );
}