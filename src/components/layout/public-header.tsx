'use client';

import Link from 'next/link';
import { Search, ShoppingCart, LogOut, User, LogIn, Menu, X } from 'lucide-react';
import { useCart } from '@/context/CartContext';
import { useAuth } from '@/context/auth-context';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { CategoriesMenu } from './categories-menu';

export function PublicHeader() {
  const { itemCount, subtotal = 0 } = useCart();
  const { user, logout } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [isCategoriesOpen, setIsCategoriesOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const router = useRouter();

  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 640);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchTerm.trim()) {
      router.push(`/products?search=${encodeURIComponent(searchTerm.trim())}`);
      setIsMobileMenuOpen(false);
    }
  };

  // Alturas fijas: nav es ~73px (mobile) o ~77px (desktop)
  // Progress bar es exactamente 46px
  const showProgressBar = !!user && itemCount > 0;
  const topOffset = showProgressBar 
    ? (isMobile ? '119px' : '123px')
    : (isMobile ? '73px' : '77px');

  const formattedSubtotal = subtotal.toLocaleString('es-CL');
  const missingAmount = Math.max(0, 100000 - subtotal);
  const formattedMissing = missingAmount.toLocaleString('es-CL');
  const percent = Math.min(100, (subtotal / 100000) * 100);
  const isMinimumMet = subtotal >= 100000;

  return (
    <header className="sticky top-0 z-50 w-full flex flex-col">
      <nav className="bg-zinc-950 text-white p-4 px-4 sm:px-8 flex items-center justify-between border-b border-zinc-800 shadow-md">
        <div className="flex items-center gap-4 sm:gap-8">
          <Link href="/" className="hover:scale-105 transition-transform shrink-0">
            <img 
              src="https://www.jdevoto.cl/wp-content/uploads/2024/06/logo-svg.png" 
              alt="JDevoto Logo" 
              className="h-11 w-auto"
              style={{ filter: 'invert(1) grayscale(1) brightness(2)' }}
            />
          </Link>
          
          <button
            onClick={() => {
              setIsCategoriesOpen(!isCategoriesOpen);
              setIsMobileMenuOpen(false);
            }}
            className="flex items-center gap-1.5 sm:gap-2 h-10 sm:h-11 px-3 sm:px-4 rounded-xl bg-zinc-900 border border-zinc-850 hover:bg-zinc-800 hover:border-zinc-700 hover:text-white transition-all font-bold text-[10px] sm:text-[11px] uppercase tracking-widest cursor-pointer text-zinc-400 select-none active:scale-[0.98]"
          >
            {isCategoriesOpen ? <X className="h-4 w-4 text-primary" /> : <Menu className="h-4 w-4" />}
            <span className="hidden xs:inline">Categorías</span>
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
          <button type="submit" className="absolute right-3 top-1/2 -translate-y-1/2 bg-primary p-2 rounded-lg cursor-pointer">
            <Search className="h-4 w-4 text-zinc-950" />
          </button>
        </form>

        {/* Controles del Header */}
        <div className="flex items-center gap-3 sm:gap-6">
          <Link href="/compra-rapida" className="hidden lg:inline-block">
            <button className="h-10 px-5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-[10px] font-black uppercase tracking-widest transition-all hover:scale-[1.03] active:scale-[0.97] shadow-lg shadow-blue-600/10 cursor-pointer border border-blue-500/20">
              Compra Rápida
            </button>
          </Link>

          <div className="hidden md:flex flex-col text-right">
            <span className="text-[9px] font-black text-zinc-500 uppercase tracking-widest">Empresa</span>
            <span className="text-xs font-bold text-white tracking-tighter uppercase">{user?.company?.razonSocial || 'Invitado'}</span>
          </div>

          {/* Íconos siempre visibles o desktop-only */}
          {user ? (
            <>
              <Link href="/dashboard" className="hidden md:block relative group cursor-pointer" title="Ir al Perfil/Dashboard">
                <User className="h-5 w-5 text-zinc-400 group-hover:text-primary transition-colors" />
              </Link>
              <button onClick={logout} className="hidden md:block relative group cursor-pointer" title="Cerrar Sesión">
                <LogOut className="h-5 w-5 text-zinc-400 group-hover:text-red-500 transition-colors" />
              </button>
            </>
          ) : (
            <Link href="/login" className="hidden md:block relative group cursor-pointer" title="Iniciar Sesión">
              <LogIn className="h-6 w-6 text-zinc-400 group-hover:text-primary transition-colors" />
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
          >
            {isMobileMenuOpen ? <X className="h-5 w-5 text-primary" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </nav>

      {/* Barra de progreso de compra mínima */}
      {showProgressBar && (
        <div className="h-[46px] bg-zinc-900 border-b border-zinc-800 flex items-center justify-between px-4 sm:px-8 text-xs sm:text-[13px] font-black uppercase tracking-wider text-zinc-400 select-none gap-4">
          <div className="flex items-center gap-2 truncate">
            {isMinimumMet ? (
              <span className="text-emerald-400 font-black flex items-center gap-1.5 animate-pulse">
                🎉 Mínimo alcanzado: <span className="text-white">${formattedSubtotal} neto</span>
              </span>
            ) : (
              <span className="truncate">
                Neto: <span className="text-white">${formattedSubtotal}</span> / $100.000 (Falta <span className="text-primary">${formattedMissing}</span>)
              </span>
            )}
          </div>
          <div className="flex items-center gap-3 shrink-0">
            <div className="w-28 sm:w-56 h-2.5 bg-zinc-800 rounded-full overflow-hidden relative border border-zinc-750">
              <div 
                className={`h-full transition-all duration-500 ease-out bg-gradient-to-r ${isMinimumMet ? 'from-emerald-500 to-green-400' : 'from-rose-500 via-amber-500 to-emerald-500'}`}
                style={{ width: `${percent}%` }}
              />
            </div>
            <span className={isMinimumMet ? "text-emerald-400 font-black" : "text-zinc-550 font-bold"}>
              {Math.round(percent)}%
            </span>
          </div>
        </div>
      )}

      {/* Menú de Categorías Desktop/Móvil */}
      {isCategoriesOpen && (
        <>
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
            style={{ top: topOffset }}
            onClick={() => setIsCategoriesOpen(false)}
          />
          <CategoriesMenu onClose={() => setIsCategoriesOpen(false)} topOffset={topOffset} />
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
            <Link 
              href="/compra-rapida" 
              onClick={() => setIsMobileMenuOpen(false)}
              className="w-full text-center py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-black uppercase tracking-widest transition-all"
            >
              Compra Rápida
            </Link>

            {user && (
              <div className="p-4 rounded-xl bg-zinc-900 border border-zinc-850 flex flex-col gap-1">
                <span className="text-[9px] font-black text-zinc-500 uppercase tracking-widest">Empresa</span>
                <span className="text-xs font-bold text-white tracking-tighter uppercase">{user?.company?.razonSocial || 'Invitado'}</span>
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
                  Ir a mi Dashboard
                </Link>
                <button 
                  onClick={() => {
                    logout();
                    setIsMobileMenuOpen(false);
                  }}
                  className="flex items-center gap-3 py-3 px-4 rounded-xl hover:bg-zinc-900 text-left text-zinc-450 hover:text-red-400 transition-all text-sm font-bold uppercase tracking-wider mt-auto"
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
