import { useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import { useQueryClient } from '@tanstack/react-query';

const supabase = createClient(
  'https://wtykoitqlndqyglpogux.supabase.co',
  import.meta.env.VITE_SUPABASE_KEY || 'PLACEHOLDER_KEY',
  {
    realtime: {
      params: {
        eventsPerSecond: 10
      }
    }
  }
);

export function useSupabaseRealtime() {
  const queryClient = useQueryClient();

  useEffect(() => {
    // Subscrever a mudanças na tabela de itens do menu
    const menuItemsChannel = supabase
      .channel('menu_items_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'menu_items'
        },
        () => {
          // Invalidar cache dos itens do menu
          queryClient.invalidateQueries({ queryKey: ['/api/menu-items'] });
        }
      )
      .subscribe();

    // Subscrever a mudanças na tabela de categorias do menu
    const menuCategoriesChannel = supabase
      .channel('menu_categories_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'menu_categories'
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ['/api/menu-categories'] });
        }
      )
      .subscribe();

    // Subscrever a mudanças na tabela de reservas
    const reservationsChannel = supabase
      .channel('reservations_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'reservations'
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ['/api/reservations'] });
          queryClient.invalidateQueries({ queryKey: ['/api/tables/available'] });
        }
      )
      .subscribe();

    // Subscrever a mudanças na tabela de pagamentos
    const paymentsChannel = supabase
      .channel('payments_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'payments'
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ['/api/payments'] });
        }
      )
      .subscribe();

    // Subscrever a mudanças na tabela de mesas
    const tablesChannel = supabase
      .channel('tables_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'tables'
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ['/api/tables'] });
          queryClient.invalidateQueries({ queryKey: ['/api/tables/available'] });
        }
      )
      .subscribe();

    // Subscrever a mudanças na tabela de pedidos (orders)
    const ordersChannel = supabase
      .channel('orders_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'orders'
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ['/api/orders'] });
        }
      )
      .subscribe();

    // Cleanup na desmontagem
    return () => {
      supabase.removeChannel(menuItemsChannel);
      supabase.removeChannel(menuCategoriesChannel);
      supabase.removeChannel(reservationsChannel);
      supabase.removeChannel(paymentsChannel);
      supabase.removeChannel(tablesChannel);
      supabase.removeChannel(ordersChannel);
    };
  }, [queryClient]);
}