'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import Link from 'next/link';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/context/auth-context';
import { FullRegisterSchema, FullRegisterDto } from '@/validations/auth.schemas';
import { useState } from 'react';

export default function RegisterPage() {
  const { registerUser } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FullRegisterDto>({
    resolver: zodResolver(FullRegisterSchema),
    defaultValues: {
      razonSocial: '',
      rut: '',
      telefono: '',
      giro: '',
      email: '',
      password: '',
    },
  });

  const onSubmit = async (formData: FullRegisterDto) => {
    setIsSubmitting(true);
    try {
      await registerUser(formData);

      toast.success('¡Registro exitoso!', {
        description: 'Tu cuenta ha sido creada correctamente.',
      });
    } catch (err: any) {
      toast.error('Error al registrar empresa', {
        description: err.message,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const onInvalid = () => {
    const firstError = Object.values(errors)[0];
    if (firstError) {
      toast.error('Error en el formulario', {
        description: firstError.message as string,
      });
    }
  };

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
            src="/home/devoto.png" 
            alt="JDevoto Logo" 
            className="h-14 w-auto"
          />
        </div>
        
        <div className="relative z-20 mt-auto">
          <div className="rounded-xl border border-white/10 bg-white/5 p-6 backdrop-blur-sm">
            <blockquote className="space-y-2">
              <p className="text-lg font-medium leading-relaxed">
                &ldquo;Únete a la red B2B más grande de Chile y optimiza tu cadena de suministro hoy mismo.&rdquo;
              </p>
              <footer className="flex items-center gap-3">
                <div className="h-8 w-8 rounded-full bg-zinc-800 border border-white/10" />
                <div className="text-sm">
                  <div className="font-semibold text-white">Equipo de Ventas</div>
                  <div className="text-zinc-400">Antigravity Inc.</div>
                </div>
              </footer>
            </blockquote>
          </div>
        </div>
      </div>
      
      <div className="lg:p-8 flex items-center justify-center bg-zinc-950/50 lg:bg-transparent py-12">
        <div className="mx-auto flex w-full flex-col justify-center space-y-6 sm:w-[450px] animate-in fade-in slide-in-from-bottom-4 duration-1000">
          <div className="flex flex-col space-y-2 text-center">
            <h1 className="text-3xl font-bold tracking-tight text-white">
              Crear una cuenta
            </h1>
            <p className="text-sm text-zinc-400">
              Ingresa los datos de tu empresa para comenzar
            </p>
          </div>
          
          <div className="grid gap-6">
            <form onSubmit={handleSubmit(onSubmit, onInvalid)} noValidate className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="razonSocial" className="text-zinc-300">Razón Social</Label>
                  <Input
                    id="razonSocial"
                    placeholder="Empresa S.A."
                    disabled={isSubmitting}
                    {...register('razonSocial')}
                    className={`bg-zinc-900/50 border-zinc-800 text-white placeholder:text-zinc-600 focus:ring-primary ${errors.razonSocial ? 'border-red-500 focus-visible:ring-red-500' : ''}`}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="rut" className="text-zinc-300">RUT</Label>
                  <Input
                    id="rut"
                    placeholder="12.345.678-9"
                    disabled={isSubmitting}
                    {...register('rut')}
                    className={`bg-zinc-900/50 border-zinc-800 text-white placeholder:text-zinc-600 focus:ring-primary ${errors.rut ? 'border-red-500 focus-visible:ring-red-500' : ''}`}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="telefono" className="text-zinc-300">Teléfono</Label>
                  <Input
                    id="telefono"
                    placeholder="+56912345678"
                    disabled={isSubmitting}
                    {...register('telefono')}
                    className={`bg-zinc-900/50 border-zinc-800 text-white placeholder:text-zinc-600 focus:ring-primary ${errors.telefono ? 'border-red-500 focus-visible:ring-red-500' : ''}`}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="giro" className="text-zinc-300">Giro</Label>
                  <Input
                    id="giro"
                    placeholder="Venta de..."
                    disabled={isSubmitting}
                    {...register('giro')}
                    className={`bg-zinc-900/50 border-zinc-800 text-white placeholder:text-zinc-600 focus:ring-primary ${errors.giro ? 'border-red-500 focus-visible:ring-red-500' : ''}`}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="email" className="text-zinc-300">Correo del Administrador</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="admin@empresa.cl"
                  disabled={isSubmitting}
                  {...register('email')}
                  className={`bg-zinc-900/50 border-zinc-800 text-white placeholder:text-zinc-600 focus:ring-primary ${errors.email ? 'border-red-500 focus-visible:ring-red-500' : ''}`}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-zinc-300">Contraseña</Label>
                <Input
                  id="password"
                  type="password"
                  disabled={isSubmitting}
                  {...register('password')}
                  className={`bg-zinc-900/50 border-zinc-800 text-white focus:ring-primary ${errors.password ? 'border-red-500 focus-visible:ring-red-500' : ''}`}
                />
              </div>
              
              <Button disabled={isSubmitting} className="w-full h-11 bg-white text-black hover:bg-zinc-200 transition-all font-semibold">
                {isSubmitting ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : null}
                {isSubmitting ? "Creando cuenta..." : "Crear Cuenta"}
              </Button>
            </form>
          </div>
          
          <p className="px-8 text-center text-xs text-zinc-500 leading-relaxed">
            Al registrarte, aceptas nuestros{" "}
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
            ¿Ya tienes una cuenta?{" "}
            <Link href="/login" className="font-semibold text-white hover:underline">
              Inicia sesión aquí
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
