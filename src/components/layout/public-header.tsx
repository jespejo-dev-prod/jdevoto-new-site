'use client';

import Link from 'next/link';
import { ShoppingCart, Heart, LogOut, User, Search, Menu, X, Package, LogIn } from 'lucide-react';
import Image from 'next/image';
import { useCart } from '@/context/CartContext';
import { useWishlist } from '@/context/WishlistContext';
import { useAuth } from '@/context/auth-context';
import { useState, useEffect, CSSProperties } from 'react';
import { useRouter } from 'next/navigation';
import { useTrackingContext } from '@/components/providers/TrackingProvider';

import { CategoriesMenu, type Category } from './categories-menu';
import { translateRole } from '@/lib/role-translations';
import { calculateRcCampaignProgress } from '@/lib/rc-campaign';

const FIREWORK_PARTICLES = [
  { dx: -32, dy: -32, color: 'bg-yellow-250' },
  { dx: 32, dy: -32, color: 'bg-yellow-300' },
  { dx: -45, dy: 8, color: 'bg-white' },
  { dx: 45, dy: 8, color: 'bg-yellow-100' },
  { dx: -22, dy: 38, color: 'bg-amber-300' },
  { dx: 22, dy: 38, color: 'bg-amber-200' },
  { dx: 0, dy: -46, color: 'bg-white' },
  { dx: 0, dy: 46, color: 'bg-yellow-400' },
];

const FIREWORK_BURSTS = [
  { left: '50%', top: '50%', delay: '0s', scale: 'scale-[1.8] z-20' }, // Center main burst
  { left: '42%', top: '35%', delay: '0.2s', scale: 'scale-[1.1] opacity-80' },
  { left: '58%', top: '65%', delay: '0.25s', scale: 'scale-[1.1] opacity-80' },
  { left: '35%', top: '60%', delay: '0.3s', scale: 'scale-[0.9] opacity-70' },
  { left: '65%', top: '30%', delay: '0.35s', scale: 'scale-[0.9] opacity-70' },
  { left: '22%', top: '40%', delay: '0.45s', scale: 'scale-[0.7] opacity-55' },
  { left: '78%', top: '60%', delay: '0.45s', scale: 'scale-[0.7] opacity-55' },
];

export function PublicHeader() {
  const { items = [], itemCount, subtotal = 0, selectedClientForOrder } = useCart();
  const { itemCount: wishlistCount } = useWishlist();
  const { user, logout } = useAuth();
  const { trackSearch } = useTrackingContext();
  const [searchTerm, setSearchTerm] = useState('');
  const [isCategoriesOpen, setIsCategoriesOpen] = useState(false);
  const [navCategories, setNavCategories] = useState<Category[]>([]);

  // Cargar categorías dinámicamente desde la API
  useEffect(() => {
    fetch('/api/categories')
      .then((r) => r.json())
      .then((json) => {
        if (json.success && Array.isArray(json.data)) {
          setNavCategories(json.data);
        }
      })
      .catch(() => {}); // Fail silently — menu stays empty if fetch fails
  }, []);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isUserDropdownOpen, setIsUserDropdownOpen] = useState(false);
  const router = useRouter();

  const [isMobile, setIsMobile] = useState(false);
  const [shouldAnimate, setShouldAnimate] = useState(false);
  const [shouldAnimateRc, setShouldAnimateRc] = useState(false);
  const [isAtTop, setIsAtTop] = useState(true);

  useEffect(() => {
    let ticking = false;

    const handleScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          const scrollY = window.scrollY;
          setIsAtTop((prev) => {
            // Zona muerta (histéresis) para evitar oscilaciones o rebotes al scrollear de abajo hacia arriba:
            // Al bajar: se oculta al pasar de 60px (más que la altura de la barra)
            // Al subir: se vuelve a mostrar solo al llegar prácticamente arriba del todo (<= 10px)
            if (scrollY > 60) return false;
            if (scrollY <= 10) return true;
            return prev;
          });
          ticking = false;
        });
        ticking = true;
      }
    };

    handleScroll();
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    // Usar breakpoint 768 (md) para consistencia con los menús colapsables
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest('.user-dropdown-container')) {
        setIsUserDropdownOpen(false);
      }
    };
    document.addEventListener('click', handleOutsideClick);
    return () => document.removeEventListener('click', handleOutsideClick);
  }, []);

  useEffect(() => {
    setIsUserDropdownOpen(false);
  }, [router]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchTerm.trim()) {
      trackSearch(searchTerm.trim(), 0);
      router.push(`/products?search=${encodeURIComponent(searchTerm.trim())}`);
      setIsMobileMenuOpen(false);
    }
  };

  // Alturas fijas: nav es ~73px (mobile) o ~77px (desktop)
  // Con 2 barras de progreso (mínimo 46px + campaña RC 46px = 92px)
  // Barra transferencia bancaria: 36px cuando está arriba en el scroll
  const showProgressBar = !!user && itemCount > 0;
  const bannerHeight = isAtTop ? 36 : 0;
  const baseOffset = showProgressBar 
    ? (isMobile ? 236 : 169)
    : (isMobile ? 144 : 77);
  const topOffset = `${baseOffset + bannerHeight}px`;
  const effectiveCompany = user?.role === 'SALES_REP' ? selectedClientForOrder : user?.company;
  const companyDiscountPercent = effectiveCompany?.defaultDiscount ? Number(effectiveCompany.defaultDiscount) : 0;
  const excludedSubtotal = items
    .filter(item => item.priceSource === 'PROMOTION' || item.priceSource === 'OUTLET')
    .reduce((acc, item) => acc + ((item.price || 0) * (item.quantity || 0)), 0);

  const nonExcludedSubtotal = items
    .filter(item => item.priceSource !== 'PROMOTION' && item.priceSource !== 'OUTLET')
    .reduce((acc, item) => acc + ((item.price || 0) * (item.quantity || 0)), 0);

  const excludedBaseNet = Math.round(excludedSubtotal);
  const nonExcludedBaseNet = Math.round(nonExcludedSubtotal);
  const companyDiscountAmount = Math.round(nonExcludedBaseNet * (companyDiscountPercent / 100));
  const subtotalAfterCompany = excludedBaseNet + (nonExcludedBaseNet - companyDiscountAmount);

  const roundedSubtotal = Math.round(subtotalAfterCompany);
  const formattedSubtotal = roundedSubtotal.toLocaleString('es-CL');
  const missingAmount = Math.max(0, 100000 - roundedSubtotal);
  const formattedMissing = missingAmount.toLocaleString('es-CL');
  const percent = Math.min(100, (roundedSubtotal / 100000) * 100);
  const isMinimumMet = roundedSubtotal >= 100000;

  // Métricas Campaña 20% Autos RC (Meta $200.000)
  const rcProgress = calculateRcCampaignProgress(items, companyDiscountPercent);
  const {
    rcBaseNet,
    rcPercent,
    isRcCampaignMet,
    formattedRcBaseNet,
  } = rcProgress;

  useEffect(() => {
    if (typeof window === 'undefined') return;

    if (!isMinimumMet) {
      sessionStorage.removeItem('hasCelebratedMinimum');
      setShouldAnimate(false);
    } else {
      const hasCelebrated = sessionStorage.getItem('hasCelebratedMinimum');
      if (!hasCelebrated) {
        setShouldAnimate(true);
        sessionStorage.setItem('hasCelebratedMinimum', 'true');
      } else {
        setShouldAnimate(false);
      }
    }
  }, [isMinimumMet]);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    if (!isRcCampaignMet) {
      sessionStorage.removeItem('hasCelebratedRcCampaign');
      setShouldAnimateRc(false);
    } else {
      const hasCelebrated = sessionStorage.getItem('hasCelebratedRcCampaign');
      if (!hasCelebrated) {
        setShouldAnimateRc(true);
        sessionStorage.setItem('hasCelebratedRcCampaign', 'true');
        const timer = setTimeout(() => {
          setShouldAnimateRc(false);
        }, 2700);
        return () => clearTimeout(timer);
      } else {
        setShouldAnimateRc(false);
      }
    }
  }, [isRcCampaignMet]);

  return (
    <header className="sticky top-0 z-50 w-full flex flex-col">
      <nav className="bg-[#1d2e5d] text-white p-4 px-4 sm:px-8 flex items-center justify-between border-b border-zinc-800 shadow-md">
        <div className="flex items-center gap-4 sm:gap-8">
          <Link href="/" className="hover:scale-105 transition-transform shrink-0">
            <Image 
              src="/home/devoto.png" 
              alt="JDevoto Logo" 
              className="h-11 w-auto"
              width={180}
              height={44}
              priority
            />
          </Link>
          
          <button
            onClick={() => {
              setIsCategoriesOpen(!isCategoriesOpen);
              setIsMobileMenuOpen(false);
            }}
            className="hidden md:flex items-center gap-1.5 sm:gap-2 h-10 sm:h-11 px-3 sm:px-4 rounded-xl bg-[#16244a] border border-zinc-850 hover:bg-[#1d2e5d] hover:border-zinc-700 hover:text-white transition-all font-bold text-[10px] sm:text-[11px] uppercase tracking-widest cursor-pointer text-zinc-400 select-none active:scale-[0.98]"
          >
            {isCategoriesOpen ? <X className="h-4 w-4 text-primary" /> : <Menu className="h-4 w-4" />}
            <span>Categorías</span>
          </button>
        </div>

        {/* Buscador Desktop */}
        <form onSubmit={handleSearch} className="hidden md:flex flex-1 max-w-2xl mx-8 relative group">
          <input 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar en el catálogo mayorista..." 
            className="w-full h-11 rounded-xl bg-[#16244a] border border-zinc-800 px-5 text-sm focus:ring-2 focus:ring-primary/50 outline-none transition-all placeholder:text-zinc-650 text-white" 
          />
          <button type="submit" className="absolute right-3 top-1/2 -translate-y-1/2 bg-primary p-2 rounded-lg cursor-pointer" aria-label="Buscar">
            <Search className="h-4 w-4 text-[#1d2e5d]" />
          </button>
        </form>

        {/* Controles del Header */}
        <div className="flex items-center gap-3 sm:gap-6">
          {!!user && (
            <Link href="/compra-rapida" className="hidden lg:inline-block">
              <button className="h-10 px-5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-[10px] font-black uppercase tracking-widest transition-all hover:scale-[1.03] active:scale-[0.97] shadow-lg shadow-blue-600/10 cursor-pointer border border-blue-500/20">
                Compra Rápida
              </button>
            </Link>
          )}

          {user ? (
            <>
              <div className="hidden md:flex flex-col text-right">
                <span className="text-sm font-black text-white uppercase tracking-wide">
                  {user.firstName} {user.lastName}
                </span>
                <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-widest flex items-center justify-end">
                  {user.role === 'SUPER_ADMIN' || user.role === 'ADMIN' ? (
                    translateRole(user.role).toUpperCase()
                  ) : user.role === 'SALES_REP' ? (
                    effectiveCompany ? (
                      <>
                        <span className="text-primary mr-1">CLIENTE:</span>
                        {effectiveCompany.razonSocial}
                        {effectiveCompany.rut && (
                          <span className="text-primary ml-1">| RUT: {effectiveCompany.rut}</span>
                        )}
                      </>
                    ) : (
                      "VENDEDOR"
                    )
                  ) : (
                    <>
                      {effectiveCompany?.razonSocial || "Empresa"} 
                      {effectiveCompany?.rut && (
                        <span className="text-primary ml-1">| RUT: {effectiveCompany.rut}</span>
                      )}
                    </>
                  )}
                </span>
              </div>

              {/* Menú de usuario con Dropdown */}
              <div className="relative user-dropdown-container hidden md:block">
                <button
                  onClick={() => setIsUserDropdownOpen(!isUserDropdownOpen)}
                  className="relative group cursor-pointer flex items-center justify-center focus:outline-none p-1.5 rounded-lg hover:bg-zinc-900 transition-colors"
                  title="Menú de usuario"
                  aria-label="Menú de usuario"
                >
                  <User className="h-6 w-6 text-zinc-400 group-hover:text-white transition-colors" />
                </button>

                {isUserDropdownOpen && (
                  <div className="absolute right-0 mt-3 w-56 rounded-2xl bg-white border border-zinc-200 shadow-2xl p-4 flex flex-col gap-1.5 z-50 text-left animate-in fade-in slide-in-from-top-2 duration-200">
                    <Link
                      href="/dashboard"
                      className="px-4 py-2.5 rounded-xl text-zinc-700 hover:bg-zinc-50 hover:text-zinc-950 font-semibold text-sm transition-all"
                      onClick={() => setIsUserDropdownOpen(false)}
                    >
                      {user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN' ? 'Administración' : 'Portal de Compras'}
                    </Link>
                    <Link
                      href="/profile"
                      className="px-4 py-2.5 rounded-xl text-zinc-700 hover:bg-zinc-50 hover:text-zinc-950 font-semibold text-sm transition-all"
                      onClick={() => setIsUserDropdownOpen(false)}
                    >
                      Mi Perfil / Cuenta
                    </Link>
                    <div className="h-px bg-zinc-100 my-1" />
                    <button
                      onClick={() => {
                        logout();
                        setIsUserDropdownOpen(false);
                      }}
                      className="w-full text-left px-4 py-2.5 rounded-xl text-blue-600 hover:bg-blue-50 font-black text-sm transition-all cursor-pointer"
                    >
                      Cerrar sesión
                    </button>
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="hidden md:flex items-center">
              <Link
                href="/login"
                className="flex items-center gap-2 px-4 py-2 bg-[#16244a] hover:bg-[#1d2e5d] text-white rounded-xl text-[11px] font-black uppercase tracking-widest transition-all"
              >
                <User className="h-4 w-4" />
                Iniciar Sesión
              </Link>
            </div>
          )}

          {/* Wishlist visible solo para usuarios autenticados */}
          {!!user && (
            <Link href="/wishlist" className="relative group cursor-pointer mr-1" title="Lista de deseos">
              <Heart className="h-6 w-6 text-zinc-400 hover:text-white transition-colors" />
              {wishlistCount > 0 && (
                <span className="absolute -top-2 -right-2 bg-red-500 text-white text-[10px] font-black h-5 min-w-[20px] px-1 rounded-full flex items-center justify-center animate-in zoom-in">
                  {wishlistCount}
                </span>
              )}
            </Link>
          )}

          {/* Carrito siempre visible */}
          <Link href="/cart" className="relative group cursor-pointer" title="Carrito">
            <ShoppingCart className="h-6 w-6 text-zinc-400 hover:text-white transition-colors" />
            {!!user && itemCount > 0 && (
              <span className="absolute -top-2 -right-2 bg-primary text-zinc-950 text-[10px] font-black h-5 min-w-[20px] px-1 rounded-full flex items-center justify-center animate-in zoom-in">
                {itemCount}
              </span>
            )}
          </Link>

          {/* Botón Hamburger Móvil */}
          <button
            onClick={() => {
              setIsMobileMenuOpen(!isMobileMenuOpen);
              setIsCategoriesOpen(false);
            }}
            className="md:hidden p-2 rounded-lg bg-[#16244a] border border-zinc-800 hover:bg-[#1d2e5d] transition-all cursor-pointer text-zinc-400 hover:text-white active:scale-95"
            aria-label="Menú principal"
          >
            {isMobileMenuOpen ? <X className="h-5 w-5 text-primary" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </nav>

      {/* Sub-nav móvil con Categorías y Buscador (Separado para evitar doble hamburguesa) */}
      <div className="flex md:hidden items-center gap-3 bg-[#16244a] p-3 px-4 border-b border-zinc-800 text-white">
        <button
          onClick={() => {
            setIsCategoriesOpen(!isCategoriesOpen);
            setIsMobileMenuOpen(false);
          }}
          className="flex items-center justify-center gap-1.5 h-10 px-3.5 rounded-xl bg-[#1d2e5d] border border-zinc-800 hover:bg-[#16244a] text-zinc-400 font-bold text-xs uppercase tracking-wider select-none active:scale-[0.98] shrink-0"
        >
          {isCategoriesOpen ? <X className="h-4.5 w-4.5 text-primary" /> : <Menu className="h-4.5 w-4.5" />}
          <span>Categorías</span>
        </button>

        <form onSubmit={handleSearch} className="flex-grow relative flex items-center">
          <input 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar en catálogo..." 
            className="w-full h-10 rounded-xl bg-[#1d2e5d] border border-zinc-800 pl-4 pr-10 text-xs focus:ring-2 focus:ring-primary/50 outline-none text-white placeholder:text-zinc-650" 
          />
          <button type="submit" className="absolute right-1.5 bg-primary p-1.5 rounded-lg cursor-pointer" aria-label="Buscar">
            <Search className="h-3.5 w-3.5 text-[#1d2e5d]" />
          </button>
        </form>
      </div>

      {/* Barra Transferencia Bancaria - Visible solo cuando está arriba el scroll */}
      <div 
        className={`bg-black text-white transition-all duration-300 ease-in-out overflow-hidden z-20 flex items-center justify-center px-4 ${
          isAtTop ? 'h-9 opacity-100 border-b border-zinc-900' : 'h-0 opacity-0 pointer-events-none border-b-0'
        }`}
      >
        <span className="text-xs sm:text-[13px] font-black uppercase tracking-wider text-center select-none whitespace-nowrap">
          10% de descuento pagando con Transferencia
        </span>
      </div>

      {/* Barra de progreso de compra mínima */}
      {showProgressBar && (
        <div className={`relative h-[46px] flex items-center justify-center gap-4 sm:gap-6 px-4 sm:px-8 text-xs sm:text-[13px] font-bold uppercase tracking-wider select-none transition-all duration-300 ${
          isMinimumMet 
            ? 'bg-emerald-600 text-white border-b border-emerald-700' 
            : 'bg-zinc-600 text-white border-b border-zinc-700'
        }`}>
          {shouldAnimate && (
            <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
              <style>{`
                @keyframes firework-particle {
                  0% {
                    transform: translate(0, 0) scale(1);
                    opacity: 1;
                  }
                  80% {
                    opacity: 0.8;
                  }
                  100% {
                    transform: translate(var(--dx), var(--dy)) scale(0);
                    opacity: 0;
                  }
                }
              `}</style>
              {FIREWORK_BURSTS.map((burst, bIdx) => (
                <div
                  key={bIdx}
                  className={`absolute ${burst.scale}`}
                  style={{ left: burst.left, top: burst.top }}
                >
                  {FIREWORK_PARTICLES.map((p, pIdx) => (
                    <div
                      key={pIdx}
                      className={`absolute w-2 h-2 rounded-full ${p.color} shadow-sm`}
                      style={{
                        '--dx': `${p.dx}px`,
                        '--dy': `${p.dy}px`,
                        animation: 'firework-particle 1.5s cubic-bezier(0.16, 1, 0.3, 1) forwards',
                        animationDelay: burst.delay,
                      } as CSSProperties}
                    />
                  ))}
                </div>
              ))}
            </div>
          )}

          <div className="flex items-center gap-2 truncate font-black relative z-10">
            {isMinimumMet ? (
              <span>
                🎉 <span className="hidden sm:inline">¡Mínimo Alcanzado! | </span>Neto: ${formattedSubtotal}
              </span>
            ) : (
              <span>
                <span className="hidden sm:inline">Compra Mínima: </span><span className="text-yellow-300 font-black">$100.000</span> | Neto: ${formattedSubtotal} <span className="hidden xs:inline">(Faltan: <span className="text-yellow-300 font-black">${formattedMissing}</span>)</span>
              </span>
            )}
          </div>
          <div className="flex items-center gap-2 sm:gap-3 shrink-0 relative z-10">
            <div className={`w-20 sm:w-44 h-2.5 rounded-full overflow-hidden relative border ${
              isMinimumMet ? 'bg-emerald-800 border-emerald-700' : 'bg-[#1d2e5d] border-zinc-900/50'
            }`}>
              <div 
                className="h-full transition-all duration-500 ease-out bg-white"
                style={{ width: `${percent}%` }}
              />
            </div>
            <span className="text-xs font-black">
              {Math.round(percent)}%
            </span>
          </div>
        </div>
      )}

      {/* Barra de progreso Campaña 20% Autos RC (Amarilla/Ámbar) */}
      {showProgressBar && (
        <Link
          href="/categorias/regalos?subcategories=regalos-radiocontrolados"
          onClick={() => {
            if (isRcCampaignMet) {
              setShouldAnimateRc(false);
              setTimeout(() => setShouldAnimateRc(true), 40);
              setTimeout(() => setShouldAnimateRc(false), 2700);
            }
          }}
          className="relative h-[46px] flex items-center justify-between sm:justify-center gap-3 sm:gap-6 px-4 sm:px-8 text-xs sm:text-[13px] font-bold uppercase tracking-wider select-none transition-all duration-300 bg-[#f59e0b] hover:bg-[#d97706] text-white border-b border-[#b45309] shadow-sm cursor-pointer group overflow-hidden"
          title="Ver campaña 20% descuento en autos a control remoto"
        >
          {/* Animación especial de auto de carreras cruzando a toda velocidad cuando se alcanzan los $200.000 */}
          {shouldAnimateRc && (
            <div className="absolute inset-0 overflow-hidden pointer-events-none z-20">
              <style>{`
                @keyframes rc-car-rush {
                  0% {
                    transform: translateX(-180px) translateY(-50%) skewX(-3deg);
                    opacity: 0;
                  }
                  8% {
                    opacity: 1;
                  }
                  50% {
                    transform: translateX(50vw) translateY(-52%) scale(1.15) skewX(-1deg);
                  }
                  90% {
                    opacity: 1;
                  }
                  100% {
                    transform: translateX(120vw) translateY(-50%) skewX(-3deg);
                    opacity: 0;
                  }
                }
                @keyframes rc-flag-wave {
                  0%, 100% { transform: rotate(-10deg); }
                  50% { transform: rotate(15deg); }
                }
                @keyframes rc-shine-sweep {
                  0% { transform: translateX(-100%); }
                  100% { transform: translateX(250%); }
                }
              `}</style>

              {/* Destello de velocidad sobre la pista amarilla */}
              <div 
                className="absolute inset-y-0 w-1/3 bg-gradient-to-r from-transparent via-white/30 to-transparent"
                style={{ animation: 'rc-shine-sweep 1.8s ease-in-out' }}
              />

              <div 
                className="absolute top-1/2 flex items-center select-none"
                style={{
                  animation: 'rc-car-rush 2.4s cubic-bezier(0.2, 0.95, 0.35, 1) forwards'
                }}
              >
                <span className="text-2xl -mr-1 animate-pulse">💨</span>
                <span className="text-base -mr-0.5">🔥</span>
                <div className="relative w-20 h-10 shrink-0 drop-shadow-[0_4px_10px_rgba(0,0,0,0.5)]">
                  <Image
                    src="/images/rc-car-cutout-right.webp"
                    alt="Auto RC Recortado"
                    fill
                    className="object-contain"
                    priority
                  />
                </div>
                <span className="text-xl -ml-0.5 inline-block" style={{ animation: 'rc-flag-wave 0.3s infinite' }}>🏁</span>
              </div>
            </div>
          )}

          <div className="flex items-center gap-2 truncate font-black relative z-10">
            {isRcCampaignMet ? (
              <span className="flex items-center gap-1.5">
                <span className="text-base animate-bounce">🏎️💨</span>
                <span>🎉</span>
                <span className="hidden sm:inline">¡META RC ALCANZADA! </span>
                <span>20% DESC EN AUTOS RC APLICADO</span>
                <span className="hidden md:inline font-mono"> | AUTOS RC: ${formattedRcBaseNet}</span>
              </span>
            ) : (
              <span className="flex items-center gap-1.5 truncate">
                <span className="text-sm">🏎️</span>
                <span>CAMPAÑA 20% DESC EN AUTOS RC</span>
                <span className="hidden xs:inline"> META <span className="text-amber-100 font-black">$200.000.-</span></span>
                {rcBaseNet > 0 && (
                  <span className="hidden md:inline text-amber-100 font-normal normal-case">
                    (Llevas ${formattedRcBaseNet})
                  </span>
                )}
              </span>
            )}
          </div>

          <div className="flex items-center gap-2 sm:gap-3 shrink-0 relative z-10">
            {/* Barra de progreso con autito que avanza */}
            <div className="relative flex items-center">
              <div className="w-20 sm:w-44 h-3 rounded-full overflow-hidden relative border bg-amber-900/40 border-amber-800/60 shadow-inner">
                <div 
                  className="h-full transition-all duration-500 ease-out bg-[#0284c7]"
                  style={{ width: `${rcPercent}%` }}
                />
              </div>
              {/* Autito posicionado al final del avance */}
              <div 
                className={`absolute -top-2 transition-all duration-500 ease-out pointer-events-none select-none ${
                  isRcCampaignMet ? 'text-base animate-bounce' : 'text-xs'
                }`}
                style={{
                  left: `calc(${Math.min(92, Math.max(0, rcPercent))}% - 8px)`
                }}
              >
                {isRcCampaignMet ? '🏁' : '🏎️'}
              </div>
            </div>
            <span className="text-xs font-black min-w-[34px] text-right font-mono">
              {Math.round(rcPercent)}%
            </span>
          </div>
        </Link>
      )}

      {/* Menú de Categorías Desktop/Móvil */}
      {isCategoriesOpen && (
        <>
          <div
            className="fixed inset-0 bg-black/40 z-40"
            style={{ top: topOffset }}
            onClick={() => setIsCategoriesOpen(false)}
          />
          <CategoriesMenu categories={navCategories} onClose={() => setIsCategoriesOpen(false)} topOffset={topOffset} />
        </>
      )}

      {/* Drawer de Navegación Móvil */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-[#1d2e5d]/95 backdrop-blur-md z-45 flex flex-col p-6 animate-in slide-in-from-top duration-300 md:hidden"
          style={{ top: topOffset }}
        >
          {/* Buscador Móvil */}
          <form onSubmit={handleSearch} className="relative w-full mb-8">
            <input 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar en catálogo..." 
              className="w-full h-12 rounded-xl bg-[#16244a] border border-zinc-800 px-5 text-sm focus:ring-2 focus:ring-primary/50 outline-none text-white placeholder:text-zinc-650" 
            />
            <button type="submit" className="absolute right-3 top-1/2 -translate-y-1/2 bg-primary p-2 rounded-lg">
              <Search className="h-4 w-4 text-[#1d2e5d]" />
            </button>
          </form>

          {/* Enlaces Móviles */}
          <div className="flex flex-col gap-4 flex-grow">
            {!!user && (
              <Link 
                href="/compra-rapida" 
                onClick={() => setIsMobileMenuOpen(false)}
                className="w-full text-center py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-black uppercase tracking-widest transition-all"
              >
                Compra Rápida
              </Link>
            )}

            {user && (
              <div className="p-4 rounded-xl bg-zinc-900 border border-zinc-850 flex flex-col gap-1">
                <span className="text-sm font-black text-white uppercase tracking-wide">
                  {user.firstName} {user.lastName}
                </span>
                <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">
                  {user.role === 'SUPER_ADMIN' || user.role === 'ADMIN' ? (
                    translateRole(user.role).toUpperCase()
                  ) : user.role === 'SALES_REP' ? (
                    effectiveCompany ? (
                      <>
                        <span className="text-primary mr-1">CLIENTE:</span>
                        {effectiveCompany.razonSocial}
                        {effectiveCompany.rut && (
                          <span className="text-primary ml-1">| RUT: {effectiveCompany.rut}</span>
                        )}
                      </>
                    ) : (
                      "VENDEDOR"
                    )
                  ) : (
                    <>
                      {effectiveCompany?.razonSocial || "Empresa"} 
                      {effectiveCompany?.rut && (
                        <span className="text-primary ml-1">| RUT: {effectiveCompany.rut}</span>
                      )}
                    </>
                  )}
                </span>
              </div>
            )}

            {user ? (
              <>
                <Link 
                  href="/dashboard" 
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="flex items-center gap-3 py-3 px-4 rounded-xl hover:bg-zinc-900 text-zinc-400 hover:text-white transition-all text-sm font-bold uppercase tracking-wider"
                >
                  <User className="h-5 w-5 text-primary" />
                  {user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN' ? 'Ir a Administración' : 'Ir a mi Portal de Compras'}
                </Link>
                <Link 
                  href="/profile" 
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="flex items-center gap-3 py-3 px-4 rounded-xl hover:bg-zinc-900 text-zinc-400 hover:text-white transition-all text-sm font-bold uppercase tracking-wider"
                >
                  <User className="h-5 w-5 text-primary" />
                  Mi Perfil / Cuenta
                </Link>
                <Link 
                  href="/wishlist" 
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="flex items-center gap-3 py-3 px-4 rounded-xl hover:bg-zinc-900 text-zinc-400 hover:text-white transition-all text-sm font-bold uppercase tracking-wider"
                >
                  <Heart className="h-5 w-5 text-red-500" />
                  Lista de Deseos ({wishlistCount})
                </Link>
                <button 
                  onClick={() => {
                    logout();
                    setIsMobileMenuOpen(false);
                  }}
                  className="flex items-center gap-3 py-3 px-4 rounded-xl hover:bg-zinc-900 text-left text-zinc-400 hover:text-red-400 transition-all text-sm font-bold uppercase tracking-wider mt-auto"
                >
                  <LogOut className="h-5 w-5 text-red-500" />
                  Cerrar Sesión
                </button>
              </>
            ) : (
              <Link 
                href="/login" 
                onClick={() => setIsMobileMenuOpen(false)}
                className="flex items-center gap-3 py-4 px-4 rounded-xl bg-zinc-900 hover:bg-zinc-850 text-zinc-300 hover:text-white transition-all text-sm font-bold uppercase tracking-wider text-center justify-center"
              >
                <LogIn className="h-5 w-5 text-primary" />
                Iniciar Sesión
              </Link>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
