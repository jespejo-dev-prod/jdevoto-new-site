'use client';

import { useState, useRef, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useApi } from '@/shared/infrastructure/api/use-api';
import { Bell, Check, ExternalLink } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import Link from 'next/link';

export function NotificationBell() {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const { fetcher } = useApi();
  const queryClient = useQueryClient();

  // Cerrar el dropdown al hacer clic fuera
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const { data: result } = useQuery({
    queryKey: ['notifications'],
    queryFn: () => fetcher('/api/notifications'),
    refetchInterval: 30000, // Refrescar cada 30 segundos
  });

  const markAsReadMutation = useMutation({
    mutationFn: (notificationIds?: string[]) => {
      const body = notificationIds ? { notificationIds } : { all: true };
      return fetcher('/api/notifications', {
        method: 'PATCH',
        body: JSON.stringify(body)
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    }
  });

  const handleMarkAllAsRead = () => {
    markAsReadMutation.mutate(undefined);
    setIsOpen(false);
  };

  const notifications = result?.notifications || [];
  const unreadCount = result?.unreadCount || 0;

  return (
    <div className="relative" ref={dropdownRef}>
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-zinc-400 hover:text-white transition-colors rounded-xl hover:bg-zinc-900"
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 h-2.5 w-2.5 bg-red-500 rounded-full animate-pulse border-2 border-zinc-950"></span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-zinc-950 border border-zinc-800 rounded-2xl shadow-2xl overflow-hidden z-50">
          <div className="p-4 border-b border-zinc-800 flex items-center justify-between bg-zinc-900/50">
            <h3 className="text-xs font-bold text-white uppercase tracking-widest flex items-center gap-2">
              <Bell className="h-4 w-4 text-primary" />
              Notificaciones
              {unreadCount > 0 && (
                <span className="bg-red-500/20 text-red-500 px-2 py-0.5 rounded-full text-[10px]">
                  {unreadCount} nuevas
                </span>
              )}
            </h3>
            {unreadCount > 0 && (
              <button 
                onClick={handleMarkAllAsRead}
                className="text-[10px] text-zinc-400 hover:text-white transition-colors uppercase tracking-widest flex items-center gap-1 font-bold"
              >
                <Check className="h-3 w-3" />
                Marcar leídas
              </button>
            )}
          </div>

          <div className="max-h-[400px] overflow-y-auto custom-scrollbar">
            {notifications.length === 0 ? (
              <div className="p-8 text-center text-zinc-500 text-xs flex flex-col items-center gap-2">
                <Bell className="h-6 w-6 opacity-20" />
                No tienes notificaciones
              </div>
            ) : (
              notifications.map((notification: any) => (
                <div 
                  key={notification.id} 
                  className={`p-4 border-b border-zinc-800 hover:bg-zinc-900/50 transition-colors ${!notification.isRead ? 'bg-primary/5' : ''}`}
                >
                  <div className="flex justify-between items-start mb-1 gap-2">
                    <h4 className={`text-sm font-bold ${!notification.isRead ? 'text-white' : 'text-zinc-400'}`}>
                      {notification.title}
                    </h4>
                    {!notification.isRead && (
                      <span className="h-1.5 w-1.5 rounded-full bg-primary shrink-0 mt-2"></span>
                    )}
                  </div>
                  <p className="text-xs text-zinc-500 mb-2 leading-relaxed">
                    {notification.message}
                  </p>
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] text-zinc-600 font-medium">
                      {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true, locale: es })}
                    </span>
                    {notification.link && (
                      <Link 
                        href={notification.link}
                        onClick={() => {
                          if (!notification.isRead) markAsReadMutation.mutate([notification.id]);
                          setIsOpen(false);
                        }}
                        className="text-[10px] text-primary hover:text-primary/80 font-bold uppercase tracking-widest flex items-center gap-1"
                      >
                        Ver Detalle <ExternalLink className="h-3 w-3" />
                      </Link>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
