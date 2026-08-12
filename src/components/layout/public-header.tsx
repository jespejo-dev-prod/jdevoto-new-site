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
  // Progress bar es exactamente 46px
  const showProgressBar = !!user && itemCount > 0;
  const topOffset = showProgressBar 
    ? (isMobile ? '190px' : '123px')
    : (isMobile ? '144px' : '77px');
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

  return (
    <header className="sticky top-0 z-50 w-full flex flex-col">
      <nav className="bg-zinc-950 text-white p-4 px-4 sm:px-8 flex items-center justify-between border-b border-zinc-800 shadow-md">
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
            className="hidden md:flex items-center gap-1.5 sm:gap-2 h-10 sm:h-11 px-3 sm:px-4 rounded-xl bg-zinc-900 border border-zinc-850 hover:bg-zinc-800 hover:border-zinc-700 hover:text-white transition-all font-bold text-[10px] sm:text-[11px] uppercase tracking-widest cursor-pointer text-zinc-400 select-none active:scale-[0.98]"
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
            className="w-full h-11 rounded-xl bg-zinc-900 border border-zinc-800 px-5 text-sm focus:ring-2 focus:ring-primary/50 outline-none transition-all placeholder:text-zinc-650" 
          />
          <button type="submit" className="absolute right-3 top-1/2 -translate-y-1/2 bg-primary p-2 rounded-lg cursor-pointer" aria-label="Buscar">
            <Search className="h-4 w-4 text-zinc-950" />
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
                      Portal de Compras
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
                className="flex items-center gap-2 px-4 py-2 bg-zinc-900 hover:bg-zinc-800 text-white rounded-xl text-[11px] font-black uppercase tracking-widest transition-all"
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
                <span className="absolute -top-2 -right-2 bg-red-500 text-white text-[10px] font-black h-5 w-5 rounded-full flex items-center justify-center animate-in zoom-in">
                  {wishlistCount}
                </span>
              )}
            </Link>
          )}

          {/* Carrito siempre visible */}
          <Link href="/cart" className="relative group cursor-pointer" title="Carrito">
            <ShoppingCart className="h-6 w-6 text-zinc-400 hover:text-white transition-colors" />
            {!!user && itemCount > 0 && (
              <span className="absolute -top-2 -right-2 bg-primary text-zinc-950 text-[10px] font-black h-5 w-5 rounded-full flex items-center justify-center animate-in zoom-in">
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
            className="md:hidden p-2 rounded-lg bg-zinc-900 border border-zinc-800 hover:bg-zinc-800 transition-all cursor-pointer text-zinc-400 hover:text-white active:scale-95"
            aria-label="Menú principal"
          >
            {isMobileMenuOpen ? <X className="h-5 w-5 text-primary" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </nav>

      {/* Sub-nav móvil con Categorías y Buscador (Separado para evitar doble hamburguesa) */}
      <div className="flex md:hidden items-center gap-3 bg-zinc-900 p-3 px-4 border-b border-zinc-800 text-white">
        <button
          onClick={() => {
            setIsCategoriesOpen(!isCategoriesOpen);
            setIsMobileMenuOpen(false);
          }}
          className="flex items-center justify-center gap-1.5 h-10 px-3.5 rounded-xl bg-zinc-950 border border-zinc-800 hover:bg-zinc-800 text-zinc-400 font-bold text-xs uppercase tracking-wider select-none active:scale-[0.98] shrink-0"
        >
          {isCategoriesOpen ? <X className="h-4.5 w-4.5 text-primary" /> : <Menu className="h-4.5 w-4.5" />}
          <span>Categorías</span>
        </button>

        <form onSubmit={handleSearch} className="flex-grow relative flex items-center">
          <input 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar en catálogo..." 
            className="w-full h-10 rounded-xl bg-zinc-950 border border-zinc-800 pl-4 pr-10 text-xs focus:ring-2 focus:ring-primary/50 outline-none text-white placeholder:text-zinc-650" 
          />
          <button type="submit" className="absolute right-1.5 bg-primary p-1.5 rounded-lg cursor-pointer" aria-label="Buscar">
            <Search className="h-3.5 w-3.5 text-zinc-950" />
          </button>
        </form>
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
                🎉 ¡Mínimo Alcanzado! | Neto: ${formattedSubtotal}
              </span>
            ) : (
              <span>
                Compra Mínima: <span className="text-yellow-300 font-black">$100.000</span> | Neto: ${formattedSubtotal} (Te faltan: <span className="text-yellow-300 font-black">${formattedMissing}</span>)
              </span>
            )}
          </div>
          <div className="flex items-center gap-2 sm:gap-3 shrink-0 relative z-10">
            <div className={`w-20 sm:w-44 h-2.5 rounded-full overflow-hidden relative border ${
              isMinimumMet ? 'bg-emerald-800 border-emerald-700' : 'bg-zinc-950 border-zinc-900/50'
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
          className="fixed inset-0 bg-zinc-950/95 backdrop-blur-md z-45 flex flex-col p-6 animate-in slide-in-from-top duration-300 md:hidden"
          style={{ top: topOffset }}
        >
          {/* Buscador Móvil */}
          <form onSubmit={handleSearch} className="relative w-full mb-8">
            <input 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar en catálogo..." 
              className="w-full h-12 rounded-xl bg-zinc-900 border border-zinc-800 px-5 text-sm focus:ring-2 focus:ring-primary/50 outline-none text-white placeholder:text-zinc-650" 
            />
            <button type="submit" className="absolute right-3 top-1/2 -translate-y-1/2 bg-primary p-2 rounded-lg">
              <Search className="h-4 w-4 text-zinc-950" />
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
                  Ir a mi Portal de Compras
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
