import { useTranslation } from 'react-i18next';
import { Link, useLocation } from 'wouter';
import { cn } from '@/lib/utils';
import {
  Home,
  Users,
  BookOpen,
  Utensils,
  Calendar,
  CreditCard,
  Settings,
  DollarSign,
  Database
} from 'lucide-react';

export default function AdminSidebar() {
  const { t } = useTranslation();
  const [location] = useLocation();

  const menuItems = [
    {
      title: t('admin.dashboard'),
      href: '/admin',
      icon: Home
    },
    {
      title: t('admin.users'),
      href: '/admin/users',
      icon: Users
    },
    {
      title: t('admin.menuCategories'),
      href: '/admin/menu-categories',
      icon: BookOpen
    },
    {
      title: t('admin.menuItems'),
      href: '/admin/menu-items',
      icon: Utensils
    },
    {
      title: t('admin.tables'),
      href: '/admin/tables',
      icon: Utensils
    },
    {
      title: t('admin.reservations'),
      href: '/admin/reservations',
      icon: Calendar
    },
    {
      title: t('admin.payments'),
      href: '/admin/payments',
      icon: CreditCard
    },
    {
      title: t('admin.pos'),
      href: '/admin/pos',
      icon: DollarSign
    },
    {
      title: t('admin.paymentSettings'),
      href: '/admin/payment-settings',
      icon: Settings
    },
    {
      title: t('admin.databaseSettings'),
      href: '/admin/database-settings',
      icon: Database
    }
  ];

  return (
    <div className="w-64 bg-primary text-primary-foreground min-h-screen flex flex-col">
      <div className="p-4 border-b border-primary/20">
        <h1 className="text-xl font-bold">
          Opa que Delícia
        </h1>
        <p className="text-sm opacity-70">{t('admin.adminPanel')}</p>
      </div>
      
      <nav className="flex-1 p-4">
        <ul className="space-y-2">
          {menuItems.map((item) => (
            <li key={item.href}>
              <Link href={item.href}>
                <div className={cn(
                  "flex items-center gap-3 px-3 py-2 rounded-md transition-colors hover:bg-white/10 cursor-pointer",
                  location === item.href ? "bg-white/20 font-medium" : "opacity-80"
                )}>
                  <item.icon className="h-5 w-5" />
                  <span>{item.title}</span>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      </nav>
      
      <div className="p-4 border-t border-primary/20 mt-auto">
        <div className="text-sm opacity-70">
          {t('admin.version')} 1.0.0
        </div>
      </div>
    </div>
  );
}