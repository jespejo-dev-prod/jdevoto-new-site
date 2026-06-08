'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, Eye, EyeOff } from 'lucide-react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { toast } from 'sonner';
import { useAuth } from '@/context/auth-context';
import { LoginSchema, LoginDto } from '@/validations/auth.schemas';
import { useState, useEffect } from 'react';

export default function LoginPage() {
  const { login, user, logout } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [callbackUrl, setCallbackUrl] = useState('/dashboard');

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const cb = params.get('callbackUrl');
      if (cb) {
        setCallbackUrl(cb);
      }
    }
  }, []);



  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginDto>({
    resolver: zodResolver(LoginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  const onSubmit = async (formData: LoginDto) => {
    setIsSubmitting(true);
    try {
      await login(formData.email, formData.password, callbackUrl);
      
      toast.success('¡Bienvenido de nuevo!');
    } catch (err: any) {
      toast.error('Error de autenticación', {
        description: err.message,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Mostrar error de validación como toast si el usuario intenta enviar
  const onInvalid = () => {
    const firstError = Object.values(errors)[0];
    if (firstError) {
      toast.error('Error en el formulario', {
        description: firstError.message as string,
      });
    }
  };

  if (user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-950 p-4">
        <div 
          className="absolute inset-0 opacity-10" 
          style={{ 
            backgroundImage: `radial-gradient(circle at 2px 2px, rgba(255,255,255,0.05) 1px, transparent 0)`,
            backgroundSize: '48px 48px' 
          }} 
        />
        <div className="w-full max-w-md space-y-8 rounded-2xl border border-zinc-800 bg-zinc-900/50 p-8 shadow-2xl backdrop-blur-xl animate-in zoom-in-95 duration-500">
          <div className="text-center space-y-2">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary mb-4">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="h-6 w-6"
              >
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                <circle cx="12" cy="7" r="4" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold tracking-tight text-white">Bienvenido de nuevo</h2>
            <p className="text-zinc-400">{user.firstName} {user.lastName}</p>
          </div>
          
          <div className="space-y-4 rounded-xl bg-zinc-950/50 p-6 border border-zinc-800/50">
            <div className="flex justify-between items-center text-sm">
              <span className="text-zinc-500">Email</span>
              <span className="text-zinc-200 font-medium">{user.email}</span>
            </div>
            <div className="h-px bg-zinc-800/50" />
            <div className="flex justify-between items-center text-sm">
              <span className="text-zinc-500">Rol</span>
              <span className="inline-flex items-center rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary capitalize">
                {user.role}
              </span>
            </div>
            <div className="h-px bg-zinc-800/50" />
            <div className="flex justify-between items-center text-sm">
              <span className="text-zinc-500">Empresa</span>
              <span className="text-zinc-200 font-medium">ID: {user.companyId}</span>
            </div>
          </div>

          <div className="space-y-3">
            <Link href={callbackUrl} className="block w-full">
              <Button className="w-full bg-white text-black hover:bg-zinc-200 h-11 font-semibold">
                Continuar
              </Button>
            </Link>
            <Button onClick={logout} variant="outline" className="w-full border-zinc-800 text-zinc-400 hover:text-white hover:bg-zinc-900 h-11">
              Cerrar sesión
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container relative min-h-screen flex-col items-center justify-center grid lg:max-w-none lg:grid-cols-2 lg:px-0">
      <div className="relative hidden h-full flex-col bg-muted p-10 text-white lg:flex dark:border-r">
        <div className="absolute inset-0 bg-zinc-950" />
        <div 
          className="absolute inset-0 opacity-20" 
          style={{ 
            backgroundImage: `radial-gradient(circle at 2px 2px, rgba(255,255,255,0.05) 1px, transparent 0)`,
            backgroundSize: '24px 24px' 
          }} 
        />
        <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-transparent to-zinc-950/50" />
        
        <div className="relative z-20 flex items-center">
          <img 
            src="https://www.jdevoto.cl/wp-content/uploads/2024/06/logo-svg.png" 
            alt="JDevoto Logo" 
            className="h-14 w-auto"
            style={{ filter: 'brightness(0) invert(1)' }}
          />
        </div>
        
        <div className="relative z-20 mt-auto">
          <div className="rounded-xl border border-white/10 bg-white/5 p-6 backdrop-blur-sm">
            <blockquote className="space-y-2">
              <p className="text-lg font-medium leading-relaxed">
                &ldquo;Esta plataforma ha simplificado drásticamente nuestra gestión de pedidos B2B y la relación con nuestros distribuidores.&rdquo;
              </p>
              <footer className="flex items-center gap-3">
                <div className="h-8 w-8 rounded-full bg-zinc-800 border border-white/10" />
                <div className="text-sm">
                  <div className="font-semibold text-white">Sofia Davis</div>
                  <div className="text-zinc-400">Gerente de Operaciones</div>
                </div>
              </footer>
            </blockquote>
          </div>
        </div>
      </div>
      
      <div className="lg:p-8 flex items-center justify-center bg-zinc-950/50 lg:bg-transparent">
        <div className="mx-auto flex w-full flex-col justify-center space-y-6 sm:w-[380px] animate-in fade-in slide-in-from-bottom-4 duration-1000">
          <div className="flex flex-col space-y-2 text-center">
            <h1 className="text-3xl font-bold tracking-tight text-white">
              Bienvenido
            </h1>
            <p className="text-sm text-zinc-400">
              Ingresa tus credenciales para acceder al portal
            </p>
          </div>
          
          <div className="grid gap-6">
            <form onSubmit={handleSubmit(onSubmit, onInvalid)} noValidate className="space-y-4">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-zinc-300">Correo electrónico</Label>
                  <Input
                    id="email"
                    placeholder="nombre@empresa.com"
                    type="email"
                    disabled={isSubmitting}
                    {...register('email')}
                    className={`bg-zinc-900/50 border-zinc-800 text-white placeholder:text-zinc-600 focus:ring-primary ${errors.email ? 'border-red-500 focus-visible:ring-red-500' : ''}`}
                  />
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="password" className="text-zinc-300">Contraseña</Label>
                    <Link href="/forgot-password" className="text-xs text-primary hover:underline">
                      ¿Olvidaste tu contraseña?
                    </Link>
                  </div>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      disabled={isSubmitting}
                      {...register('password')}
                      className={`bg-zinc-900/50 border-zinc-800 text-white focus:ring-primary pr-10 ${errors.password ? 'border-red-500 focus-visible:ring-red-500' : ''}`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-300"
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>
              </div>
              
              <Button disabled={isSubmitting} className="w-full h-11 bg-white text-black hover:bg-zinc-200 transition-all font-semibold">
                {isSubmitting ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : null}
                {isSubmitting ? "Iniciando sesión..." : "Iniciar Sesión"}
              </Button>
            </form>
          </div>
          
          <p className="px-8 text-center text-xs text-zinc-500 leading-relaxed">
            Al continuar, aceptas nuestros{" "}
            <Link href="/terms" className="underline underline-offset-4 hover:text-white">
              Términos de Servicio
            </Link>{" "}
            y{" "}
            <Link href="/privacy" className="underline underline-offset-4 hover:text-white">
              Privacidad
            </Link>
            .
          </p>
          
          <p className="text-center text-sm text-zinc-400">
            ¿No tienes cuenta?{" "}
            <Link href="/register" className="font-semibold text-white hover:underline">
              Regístrate gratis
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
