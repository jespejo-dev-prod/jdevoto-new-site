"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Link from "next/link";
import { Loader2, Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/context/auth-context";
import {
  FullRegisterSchema,
  FullRegisterDto,
} from "@/validations/auth.schemas";
import { useState, useEffect } from "react";

export default function RegisterPage() {
  const { registerUser } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // Captcha State
  const [mathNums, setMathNums] = useState({ n1: 0, n2: 0 });
  const [mounted, setMounted] = useState(false);
  const [userMathAnswer, setUserMathAnswer] = useState("");
  const [captchaError, setCaptchaError] = useState(false);

  const generateCaptcha = () => {
    const n1 = Math.floor(Math.random() * 9) + 1;
    const n2 = Math.floor(Math.random() * 9) + 1;
    setMathNums({ n1, n2 });
  };

  useEffect(() => {
    generateCaptcha();
    setMounted(true);
  }, []);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FullRegisterDto>({
    resolver: zodResolver(FullRegisterSchema),
    defaultValues: {
      razonSocial: "",
      rut: "",
      telefono: "",
      giro: "",
      email: "",
      password: "",
    },
  });

  const onSubmit = async (formData: FullRegisterDto) => {
    if (parseInt(userMathAnswer) !== mathNums.n1 + mathNums.n2) {
      setCaptchaError(true);
      toast.error("Error de verificación", {
        description: "El resultado del captcha es incorrecto.",
      });
      return;
    }
    setCaptchaError(false);

    setIsSubmitting(true);
    try {
      await registerUser(formData);

      toast.success("¡Registro exitoso!", {
        description: "Tu cuenta ha sido creada correctamente.",
      });
    } catch (err: any) {
      toast.error("Error al registrar empresa", {
        description: err.message,
      });
      // Regenerar captcha al fallar
      generateCaptcha();
      setUserMathAnswer("");
    } finally {
      setIsSubmitting(false);
    }
  };

  const onInvalid = () => {
    const firstError = Object.values(errors)[0];
    if (firstError) {
      toast.error("Error en el formulario", {
        description: firstError.message as string,
      });
    }
  };

  return (
    <div className="container relative min-h-screen flex-col items-center justify-center grid lg:max-w-none lg:grid-cols-2 lg:px-0">
      <div className="relative hidden h-full flex-col bg-muted text-white lg:flex dark:border-r">
        {/* Imagen de fondo con filtro gris */}
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: "url('/login-background.jpg')", filter: 'grayscale(0.7) brightness(0.8)' }}
        />

        {/* Botón volver arriba izquierda */}
        <div className="absolute top-8 left-8 z-30">
          <Link
            href="/login"
            className="flex items-center gap-2 text-sm font-medium text-zinc-300/80 hover:text-white transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
            Volver al login
          </Link>
        </div>

        {/* Logo centrado con efecto glow */}
        <div className="relative z-20 flex flex-1 flex-col items-center justify-center px-12">
          <Link
            href="/"
            className="hover:scale-105 transition-transform shrink-0"
          >
            <img
              src="/home/devoto.png"
              alt="JDevoto Logo"
              className="h-20 w-auto"
              style={{
                filter: 'drop-shadow(0 0 27px rgba(255, 255, 255, 0.51)) drop-shadow(0 0 10px rgba(255, 255, 255, 0.25))',
              }}
            />
          </Link>

          {/* Texto de bienvenida debajo del logo */}
          <div className="mt-10 text-center">
            <h2 className="text-4xl font-bold text-primary tracking-tight">
              Crea tu cuenta
            </h2>
            <p className="mt-3 text-lg text-zinc-300/70 font-medium">
              Completa tus datos para registrarte y comenzar.
            </p>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-center bg-zinc-950 min-h-screen lg:min-h-0 p-4 lg:p-8 overflow-y-auto">
        <div className="mx-auto flex w-full flex-col justify-center space-y-4 sm:w-[520px] animate-in fade-in slide-in-from-bottom-4 duration-1000">
          
          {/* Logo solo visible en mobile */}
          <div className="flex flex-col items-center lg:hidden mb-2">
            <Link href="/">
              <img
                src="/home/devoto.png"
                alt="JDevoto Logo"
                className="h-16 w-auto"
                style={{
                  filter: 'drop-shadow(0 0 20px rgba(255, 255, 255, 0.3))',
                }}
              />
            </Link>
            <h2 className="mt-4 text-2xl font-bold text-primary">Crea tu cuenta</h2>
            <p className="mt-1 text-sm text-zinc-400">
              Completa tus datos para registrarte y comenzar.
            </p>
          </div>

          <div className="grid gap-4">
            <form
              onSubmit={handleSubmit(onSubmit, onInvalid)}
              noValidate
              className="space-y-4"
            >
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="razonSocial" className="text-sm font-semibold text-zinc-300 mb-1 block">
                    Razón Social
                  </Label>
                  <Input
                    id="razonSocial"
                    placeholder="Empresa S.A."
                    disabled={isSubmitting}
                    {...register("razonSocial")}
                    className={`bg-zinc-900/60 border-zinc-700/60 text-white placeholder:text-zinc-500 focus:ring-primary h-14 text-base rounded-full px-4 ${errors.razonSocial ? "border-red-500 focus-visible:ring-red-500" : ""}`}
                  />
                </div>
                <div>
                  <Label htmlFor="rut" className="text-sm font-semibold text-zinc-300 mb-1 block">
                    RUT
                  </Label>
                  <Input
                    id="rut"
                    placeholder="12.345.678-9"
                    disabled={isSubmitting}
                    {...register("rut")}
                    className={`bg-zinc-900/60 border-zinc-700/60 text-white placeholder:text-zinc-500 focus:ring-primary h-14 text-base rounded-full px-4 ${errors.rut ? "border-red-500 focus-visible:ring-red-500" : ""}`}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="telefono" className="text-sm font-semibold text-zinc-300 mb-1 block">
                    Teléfono
                  </Label>
                  <Input
                    id="telefono"
                    placeholder="+56912345678"
                    disabled={isSubmitting}
                    {...register("telefono")}
                    className={`bg-zinc-900/60 border-zinc-700/60 text-white placeholder:text-zinc-500 focus:ring-primary h-14 text-base rounded-full px-4 ${errors.telefono ? "border-red-500 focus-visible:ring-red-500" : ""}`}
                  />
                </div>
                <div>
                  <Label htmlFor="giro" className="text-sm font-semibold text-zinc-300 mb-1 block">
                    Giro
                  </Label>
                  <Input
                    id="giro"
                    placeholder="Venta de..."
                    disabled={isSubmitting}
                    {...register("giro")}
                    className={`bg-zinc-900/60 border-zinc-700/60 text-white placeholder:text-zinc-500 focus:ring-primary h-14 text-base rounded-full px-4 ${errors.giro ? "border-red-500 focus-visible:ring-red-500" : ""}`}
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-zinc-800 space-y-4">
                <p className="text-sm font-bold text-zinc-400 uppercase tracking-widest text-left">
                  Dirección
                </p>
                <div>
                  <Input
                    id="calleNumero"
                    placeholder="Calle y número (Ej: Av. Apoquindo 4501)"
                    disabled={isSubmitting}
                    {...register("calleNumero")}
                    className={`bg-zinc-900/60 border-zinc-700/60 text-white placeholder:text-zinc-500 focus:ring-primary h-14 text-base rounded-full px-4 ${errors.calleNumero ? "border-red-500 focus-visible:ring-red-500" : ""}`}
                  />
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <Input
                    id="region"
                    placeholder="Región"
                    disabled={isSubmitting}
                    {...register("region")}
                    className={`bg-zinc-900/60 border-zinc-700/60 text-white placeholder:text-zinc-500 focus:ring-primary h-14 text-base rounded-full px-4 ${errors.region ? "border-red-500 focus-visible:ring-red-500" : ""}`}
                  />
                  <Input
                    id="comuna"
                    placeholder="Comuna"
                    disabled={isSubmitting}
                    {...register("comuna")}
                    className={`bg-zinc-900/60 border-zinc-700/60 text-white placeholder:text-zinc-500 focus:ring-primary h-14 text-base rounded-full px-4 ${errors.comuna ? "border-red-500 focus-visible:ring-red-500" : ""}`}
                  />
                  <Input
                    id="ciudad"
                    placeholder="Ciudad"
                    disabled={isSubmitting}
                    {...register("ciudad")}
                    className={`bg-zinc-900/60 border-zinc-700/60 text-white placeholder:text-zinc-500 focus:ring-primary h-14 text-base rounded-full px-4 ${errors.ciudad ? "border-red-500 focus-visible:ring-red-500" : ""}`}
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-zinc-800 space-y-4">
                <p className="text-sm font-bold text-zinc-400 uppercase tracking-widest text-left">
                  Datos de Acceso
                </p>
                <div className="grid grid-cols-2 gap-4">
                  <Input
                    id="email"
                    type="email"
                    placeholder="Correo del administrador"
                    disabled={isSubmitting}
                    {...register("email")}
                    className={`bg-zinc-900/60 border-zinc-700/60 text-white placeholder:text-zinc-500 focus:ring-primary h-14 text-base rounded-full px-4 ${errors.email ? "border-red-500 focus-visible:ring-red-500" : ""}`}
                  />
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="Contraseña"
                      disabled={isSubmitting}
                      {...register("password")}
                      className={`bg-zinc-900/60 border-zinc-700/60 text-white placeholder:text-zinc-500 focus:ring-primary pr-12 h-14 text-base rounded-full px-4 ${errors.password ? "border-red-500 focus-visible:ring-red-500" : ""}`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-300"
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                </div>

                {/* Requisitos de Contraseña - inline */}
                <p className="text-[11px] text-zinc-500">
                  Mínimo 7 caracteres, una mayúscula y un número o símbolo.
                </p>

                {/* Verificación de Seguridad (Captcha Matemático) */}
                <div className="flex items-center gap-4">
                  <span className="text-xs font-semibold text-zinc-400">Verificación:</span>
                  <div className="bg-zinc-900 border border-zinc-800 rounded-full px-4 py-1.5 font-bold text-white select-none tracking-wide text-sm shrink-0">
                    {mounted
                      ? `${mathNums.n1} + ${mathNums.n2} =`
                      : "... + ... ="}
                  </div>
                  <Input
                    type="text"
                    required
                    value={userMathAnswer}
                    onChange={(e) => {
                      setUserMathAnswer(e.target.value);
                      if (captchaError) setCaptchaError(false);
                    }}
                    className={`w-20 bg-zinc-900/60 border text-center font-bold text-sm text-white placeholder:text-zinc-500 focus:ring-primary h-14 rounded-full ${
                      captchaError
                        ? "border-red-500 focus-visible:ring-red-500"
                        : "border-zinc-700/60"
                    }`}
                    placeholder="?"
                  />
                </div>
                {captchaError && (
                  <p className="text-xs font-semibold text-red-500 text-left">
                    El resultado es incorrecto. Por favor vuelve a intentarlo.
                  </p>
                )}
              </div>

              <Button
                disabled={isSubmitting}
                className="w-full h-16 bg-white text-lg text-black hover:bg-zinc-200 transition-all font-bold text-base rounded-full mt-1"
              >
                {isSubmitting ? (
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                ) : null}
                {isSubmitting ? "Creando cuenta..." : "Crear Cuenta"}
              </Button>
            </form>
          </div>

          <div className="flex items-center justify-center gap-1 text-sm text-zinc-400">
            ¿Ya tienes una cuenta?{" "}
            <Link
              href="/login"
              className="font-semibold text-white hover:underline"
            >
              Inicia sesión aquí
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
