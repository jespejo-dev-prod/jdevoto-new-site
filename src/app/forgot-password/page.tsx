'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Mail, Loader2, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    setStatus('loading');
    setErrorMessage('');

    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      if (!res.ok) {
        throw new Error('Ocurrió un error al procesar tu solicitud.');
      }

      setStatus('success');
    } catch (error: any) {
      setStatus('error');
      setErrorMessage(error.message || 'Error de conexión.');
    }
  };

  return (
    <div className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold text-white tracking-tight">Recuperar Contraseña</h1>
          <p className="text-zinc-400 text-sm">
            Ingresa tu correo electrónico y te enviaremos un enlace seguro para restablecer tu contraseña.
          </p>
        </div>

        {status === 'success' ? (
          <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-2xl p-8 text-center space-y-4">
            <div className="mx-auto w-12 h-12 bg-emerald-500/20 rounded-full flex items-center justify-center">
              <CheckCircle2 className="h-6 w-6 text-emerald-500" />
            </div>
            <h3 className="text-lg font-bold text-emerald-500">Correo Enviado</h3>
            <p className="text-sm text-zinc-400 leading-relaxed">
              Si el correo <strong>{email}</strong> existe en nuestro sistema, recibirás las instrucciones en breve. Por favor, revisa tu bandeja de entrada (y tu carpeta de spam).
            </p>
            <div className="pt-4">
              <Link href="/login">
                <Button variant="outline" className="w-full bg-transparent border-zinc-800 text-zinc-300 hover:text-white hover:bg-zinc-900">
                  Volver al inicio de sesión
                </Button>
              </Link>
            </div>
          </div>
        ) : (
          <div className="bg-zinc-900/50 border border-zinc-800 rounded-3xl p-8 shadow-2xl">
            <form onSubmit={handleSubmit} className="space-y-6">
              {status === 'error' && (
                <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-500 text-sm text-center">
                  {errorMessage}
                </div>
              )}

              <div className="space-y-2">
                <label htmlFor="email" className="text-xs font-bold text-zinc-400 uppercase tracking-widest">
                  Correo Electrónico
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Mail className="h-4 w-4 text-zinc-500" />
                  </div>
                  <input
                    id="email"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-11 pr-4 py-3 bg-zinc-950 border border-zinc-800 rounded-xl text-white placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                    placeholder="tucorreo@empresa.cl"
                  />
                </div>
              </div>

              <Button
                type="submit"
                disabled={status === 'loading' || !email}
                className="w-full py-6 bg-primary text-black font-bold uppercase tracking-widest hover:scale-[1.02] active:scale-95 transition-all shadow-xl shadow-primary/20"
              >
                {status === 'loading' ? (
                  <span className="flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Enviando...
                  </span>
                ) : (
                  'Enviar Enlace'
                )}
              </Button>
            </form>

            <div className="mt-8 text-center">
              <Link 
                href="/login"
                className="text-sm font-medium text-zinc-500 hover:text-white transition-colors flex items-center justify-center gap-2"
              >
                <ArrowLeft className="h-4 w-4" />
                Volver a Iniciar Sesión
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
