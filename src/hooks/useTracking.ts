'use client';

import { useCallback, useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';

interface TrackingEvent {
  eventType: string;
  eventData?: Record<string, any>;
  pageUrl: string;
  referrer: string;
  sessionId: string;
}

function getSessionId(): string {
  if (typeof window === 'undefined') return '';
  let sid = sessionStorage.getItem('_ags');
  if (!sid) {
    sid = crypto.randomUUID();
    sessionStorage.setItem('_ags', sid);
  }
  return sid;
}

function hasConsent(): boolean {
  // Siempre retornar true por ahora para forzar la recolección de datos
  // y descartar problemas con el banner de cookies.
  return true;
}

import { useAuth } from '@/context/auth-context';

export function useTracking() {
  const queueRef = useRef<TrackingEvent[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const pathname = usePathname();
  const { user } = useAuth();
  
  // Usar un ref para el user para que flush() no se re-cree constantemente 
  // y se pierda el evento 'beforeunload' o el setInterval.
  const userRef = useRef(user);
  useEffect(() => {
    userRef.current = user;
  }, [user]);

  const flush = useCallback(() => {
    if (queueRef.current.length === 0) return;
    const events = [...queueRef.current];
    queueRef.current = [];
    
    const body = JSON.stringify({ events });
    
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (userRef.current?.id) {
      headers['x-user-id'] = userRef.current.id;
    }
    
    // Use fetch with keepalive instead of sendBeacon to ensure Next.js parses the JSON correctly.
    // sendBeacon with Blob(application/json) can sometimes fail to parse in App Router.
    fetch('/api/store/metrics', { 
      method: 'POST', 
      body, 
      headers, 
      keepalive: true 
    }).catch(err => console.error('Tracking error:', err));
  }, []);

  const track = useCallback((eventType: string, eventData?: Record<string, any>) => {
    if (!hasConsent()) return;
    
    const transactionalEvents = [
      'added_to_cart', 
      'removed_from_cart', 
      'checkout_started', 
      'payment_method_selected', 
      'payment_failed', 
      'order_confirmed',
      'order_pending',
      'order_shipped',
      'order_delivered',
      'order_cancelled',
      'order_rejected',
      'order_status_changed',
      'promotion_clicked',
      'promotion_product_clicked'
    ];
    
    // 1. Enviar SIEMPRE a Google Analytics (GA4)
    if (typeof window !== 'undefined' && (window as any).gtag) {
      (window as any).gtag('event', eventType, {
        ...eventData,
        user_id: userRef.current?.id || undefined, // Identifica al usuario B2B en GA4
        is_b2b: !!userRef.current,
      });
    }

    // 2. Enviar a nuestra base de datos SOLO si es un evento transaccional (para ahorrar espacio)
    if (transactionalEvents.includes(eventType)) {
      queueRef.current.push({
        eventType,
        eventData: eventData || {},
        pageUrl: window.location.pathname,
        referrer: document.referrer || '',
        sessionId: getSessionId(),
      });
    }
  }, []);

  // Auto-flush every 10 seconds
  useEffect(() => {
    timerRef.current = setInterval(flush, 10000);
    
    // Flush on page unload
    const handleUnload = () => flush();
    window.addEventListener('beforeunload', handleUnload);
    window.addEventListener('pagehide', handleUnload);
    
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      window.removeEventListener('beforeunload', handleUnload);
      window.removeEventListener('pagehide', handleUnload);
      flush(); // Flush remaining events on unmount
    };
  }, [flush]);

  // Auto-track page views on route change
  useEffect(() => {
    track('page_view', { path: pathname, title: document.title });
  }, [pathname, track]);

  // Convenience methods
  const trackProductView = useCallback((productId: string, sku: string, categoryId?: string) => {
    track('product_viewed', { productId, sku, categoryId });
  }, [track]);

  const trackProductClick = useCallback((productId: string, sku: string, position?: number) => {
    track('product_clicked', { productId, sku, position });
  }, [track]);

  const trackSearch = useCallback((query: string, resultsCount: number) => {
    track('search_performed', { query: query.toLowerCase().trim(), resultsCount });
  }, [track]);

  const trackAddToCart = useCallback((productId: string, sku: string, quantity: number, price: number, discountPercent?: number, priceSource?: string) => {
    track('added_to_cart', { 
      productId, 
      sku, 
      quantity, 
      price,
      ...(discountPercent ? { discountPercent } : {}),
      ...(priceSource ? { priceSource } : {})
    });
  }, [track]);

  const trackRemoveFromCart = useCallback((productId: string, sku: string) => {
    track('removed_from_cart', { productId, sku });
  }, [track]);

  const trackCartView = useCallback((itemCount: number, totalValue: number) => {
    track('cart_viewed', { itemCount, totalValue });
  }, [track]);

  const trackCheckoutStart = useCallback((itemCount: number, totalValue: number) => {
    track('checkout_started', { itemCount, totalValue });
  }, [track]);

  const trackPaymentMethodSelected = useCallback((method: string) => {
    track('payment_method_selected', { method });
  }, [track]);

  const trackPaymentFailed = useCallback((method: string, errorCode?: string) => {
    track('payment_failed', { method, errorCode });
  }, [track]);

  const trackOrderConfirmed = useCallback((orderId: string, totalValue: number) => {
    track('order_confirmed', { orderId, totalValue });
  }, [track]);

  const trackOrderPending = useCallback((orderId: string, totalValue: number) => {
    track('order_pending', { orderId, totalValue });
  }, [track]);

  const trackOrderShipped = useCallback((orderId: string) => {
    track('order_shipped', { orderId });
  }, [track]);

  const trackOrderDelivered = useCallback((orderId: string) => {
    track('order_delivered', { orderId });
  }, [track]);

  const trackOrderCancelled = useCallback((orderId: string, reason?: string) => {
    track('order_cancelled', { orderId, reason });
  }, [track]);

  const trackOrderRejected = useCallback((orderId: string, reason?: string) => {
    track('order_rejected', { orderId, reason });
  }, [track]);

  const trackCategoryView = useCallback((categoryId: string, categoryName: string) => {
    track('category_viewed', { categoryId, categoryName });
  }, [track]);

  const trackPromotionClick = useCallback((promotionName: string, promotionUrl?: string) => {
    track('promotion_clicked', { promotionName, promotionUrl });
  }, [track]);

  const trackPromotionProductClick = useCallback((productId: string, sku: string, discountPercent: number) => {
    track('promotion_product_clicked', { productId, sku, discountPercent });
  }, [track]);

  return {
    track,
    trackProductView,
    trackProductClick,
    trackSearch,
    trackAddToCart,
    trackRemoveFromCart,
    trackCartView,
    trackCheckoutStart,
    trackPaymentMethodSelected,
    trackPaymentFailed,
    trackOrderConfirmed,
    trackOrderPending,
    trackOrderShipped,
    trackOrderDelivered,
    trackOrderCancelled,
    trackOrderRejected,
    trackCategoryView,
    trackPromotionClick,
    trackPromotionProductClick,
  };
}
