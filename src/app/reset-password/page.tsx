'use client';

import { useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Lock, Loader2, CheckCircle2, ArrowRight, AlertTriangle, Eye, EyeOff } from 'lucide-react';
import { Button } from '@/components/ui/button';

function ResetPasswordForm() {
  const searchParams = useSearchParams();
  const token = searchParams.get('token');
  const router = useRouter();

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');

  if (!token) {
    return (
      <div className="bg-zinc-900/50 border border-red-500/20 rounded-3xl p-8 text-center space-y-4">
        <div className="mx-auto w-12 h-12 bg-red-500/10 rounded-full flex items-center justify-center">
          <AlertTriangle className="h-6 w-6 text-red-500" />
        </div>
        <h3 className="text-lg font-bold text-red-500">Enlace Inválido</h3>
        <p className="text-sm text-zinc-400">
          No se ha proporcionado un token de seguridad válido en la URL.
        </p>
        <div className="pt-4">
          <Link href="/forgot-password">
            <Button variant="outline" className="w-full bg-transparent border-zinc-800 text-zinc-300 hover:text-white hover:bg-zinc-900">
              Solicitar nuevo enlace
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password || !confirmPassword) return;

    if (password !== confirmPassword) {
      setStatus('error');
      setErrorMessage('Las contraseñas no coinciden.');
      return;
    }

    if (password.length < 7) {
      setStatus('error');
      setErrorMessage('La contraseña debe tener al menos 7 caracteres.');
      return;
    }
    
    if (!/[A-Z]/.test(password)) {
      setStatus('error');
      setErrorMessage('La contraseña debe contener al menos una letra mayúscula.');
      return;
    }
    
    if (!/[0-9!@#$%^&*()_+{}\[\]:;<>,.?~\\/-]/.test(password)) {
      setStatus('error');
      setErrorMessage('La contraseña debe contener al menos un número o símbolo especial.');
      return;
    }

    setStatus('loading');
    setErrorMessage('');

    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || data.error?.message || 'Ocurrió un error al procesar tu solicitud.');
      }

      setStatus('success');
      
      // Redirect after 3 seconds
      setTimeout(() => {
        router.push('/login');
      }, 3000);
    } catch (error: any) {
      setStatus('error');
      setErrorMessage(error.message || 'Error de conexión.');
    }
  };

  if (status === 'success') {
    return (
      <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-3xl p-8 text-center space-y-4">
        <div className="mx-auto w-12 h-12 bg-emerald-500/20 rounded-full flex items-center justify-center">
          <CheckCircle2 className="h-6 w-6 text-emerald-500" />
        </div>
        <h3 className="text-lg font-bold text-emerald-500">¡Contraseña Actualizada!</h3>
        <p className="text-sm text-zinc-400">
          Tu contraseña ha sido cambiada exitosamente. Redirigiendo al inicio de sesión...
        </p>
        <div className="pt-4 flex justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-emerald-500" />
        </div>
      </div>
    );
  }

  return (
    <div className="bg-zinc-900/50 border border-zinc-800 rounded-3xl p-8 shadow-2xl">
      <form onSubmit={handleSubmit} className="space-y-6">
        {status === 'error' && (
          <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-500 text-sm text-center">
            {errorMessage}
          </div>
        )}

        <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-4 space-y-2">
          <p className="text-xs font-bold text-zinc-400 uppercase tracking-widest">Requisitos de la contraseña:</p>
          <ul className="text-xs text-zinc-500 space-y-1 list-disc list-inside">
            <li>Mínimo 7 caracteres de longitud.</li>
            <li>Al menos una letra mayúscula.</li>
            <li>Al menos un número o símbolo especial.</li>
            <li className="text-primary/80">No puede ser igual a tu contraseña actual.</li>
          </ul>
        </div>

        <div className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="password" className="text-xs font-bold text-zinc-400 uppercase tracking-widest">
              Nueva Contraseña
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <Lock className="h-4 w-4 text-zinc-500" />
              </div>
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-11 pr-12 py-3 bg-zinc-950 border border-zinc-800 rounded-xl text-white placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                placeholder="••••••••"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-4 flex items-center text-zinc-500 hover:text-white transition-colors"
              >
                {showPassword ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </button>
            </div>
          </div>

          <div className="space-y-2">
            <label htmlFor="confirmPassword" className="text-xs font-bold text-zinc-400 uppercase tracking-widest">
              Confirmar Contraseña
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <Lock className="h-4 w-4 text-zinc-500" />
              </div>
              <input
                id="confirmPassword"
                type={showConfirmPassword ? "text" : "password"}
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full pl-11 pr-12 py-3 bg-zinc-950 border border-zinc-800 rounded-xl text-white placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                placeholder="••••••••"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute inset-y-0 right-0 pr-4 flex items-center text-zinc-500 hover:text-white transition-colors"
              >
                {showConfirmPassword ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </button>
            </div>
          </div>
        </div>

        <Button
          type="submit"
          disabled={status === 'loading' || !password || !confirmPassword}
          className="w-full py-6 bg-primary text-black font-bold uppercase tracking-widest hover:scale-[1.02] active:scale-95 transition-all shadow-xl shadow-primary/20"
        >
          {status === 'loading' ? (
            <span className="flex items-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin" />
              Guardando...
            </span>
          ) : (
            <span className="flex items-center gap-2">
              Cambiar Contraseña
              <ArrowRight className="h-4 w-4" />
            </span>
          )}
        </Button>
      </form>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <div className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold text-white tracking-tight">Elige tu nueva clave</h1>
          <p className="text-zinc-400 text-sm">
            Estás a un paso de recuperar tu cuenta.
          </p>
        </div>

        <Suspense fallback={
          <div className="bg-zinc-900/50 border border-zinc-800 rounded-3xl p-12 flex justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        }>
          <ResetPasswordForm />
        </Suspense>
      </div>
    </div>
  );
}
