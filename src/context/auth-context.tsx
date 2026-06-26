'use client';

/**
 * context/auth-context.tsx
 *
 * Estado global de autenticación de la aplicación.
 *
 * Estrategia de seguridad:
 * - El accessToken JWT vive SOLO en memoria React (nunca en localStorage).
 *   Esto impide que un ataque XSS pueda robarlo.
 * - El refreshToken vive en una cookie httpOnly (el navegador la envía
 *   automáticamente en cada petición a /api/auth/refresh, sin que
 *   JavaScript pueda leerla).
 *
 * Flujo al cargar la app:
 *   1. AuthProvider se monta → llama refresh() automáticamente
 *   2. refresh() → POST /api/auth/refresh (envía cookie httpOnly)
 *   3. Si la cookie es válida → guarda accessToken y user en memoria
 *   4. Si no → loading=false y user=null (usuario no autenticado)
 */

import React, { createContext, useContext, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { AuthenticatedUser } from '@/types/domain';

/** Contrato del contexto — lo que expone a los componentes hijos */
interface AuthContextType {
  user: AuthenticatedUser | null;   // Datos del usuario logueado
  accessToken: string | null;       // JWT de corta duración (solo en memoria)
  login: (email: string, password: string, callbackUrl?: string) => Promise<any>;
  verify2fa: (userId: string, code: string, callbackUrl?: string) => Promise<any>;
  registerUser: (formData: any) => Promise<void>;
  logout: () => Promise<void>;
  refresh: () => Promise<void>;
  isAuthenticated: boolean;         // Atajo: !!user
  loading: boolean;                 // true mientras se valida la sesión inicial
}

/** Contexto de React — undefined obliga a usar el hook useAuth() */
const AuthContext = createContext<AuthContextType | undefined>(undefined);

/**
 * AuthProvider
 *
 * Envuelve toda la app (en layout.tsx) y provee el estado de sesión.
 * Debe ser padre de cualquier componente que use useAuth().
 */
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthenticatedUser | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true); // Inicia en true hasta validar sesión
  const router = useRouter();

  /**
   * refresh
   *
   * Renueva el accessToken usando la cookie httpOnly del navegador.
   * Se llama automáticamente al montar el provider (ver useEffect abajo).
   * También puede llamarse manualmente para renovar la sesión.
   *
   * Llama a: POST /api/auth/refresh
   * En éxito: guarda accessToken y user en memoria
   * En fallo: limpia el estado (sesión expirada o cookie inválida)
   */
  const refresh = async () => {
    try {
      const res = await fetch('/api/auth/refresh', {
        method: 'POST',
        credentials: 'include', // ← Incluye la cookie httpOnly automáticamente
      });

      if (!res.ok) {
        throw new Error('Refresh failed');
      }

      const data = await res.json();
      setAccessToken(data.data.access_token); // Solo en RAM, nunca en localStorage
      setUser(data.data.user);
    } catch (err) {
      // Si el refresh falla, limpiamos todo (sin redirección automática aquí para evitar loops)
      setAccessToken(null);
      setUser(null);
    } finally {
      setLoading(false); // Siempre desactiva el loading, éxito o fallo
    }
  };

  /**
   * useEffect inicial
   *
   * Ejecuta refresh() UNA sola vez al montar el provider.
   * Esto restaura la sesión del usuario si tiene una cookie válida,
   * sin necesidad de volver a escribir usuario/contraseña.
   */
  useEffect(() => {
    refresh();
  }, []);

  /**
   * login
   *
   * Autentica al usuario contra el backend.
   * Llama a: POST /api/auth/login
   * El servidor setea la cookie httpOnly refresh_token en la respuesta.
   * En éxito: guarda accessToken y user en memoria, redirige a /dashboard.
   * En fallo: lanza Error con el mensaje del backend.
   */
  const login = async (email: string, password: string, callbackUrl?: string) => {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
      credentials: 'include', // ← Necesario para recibir la cookie httpOnly
    });

    const data = await res.json();

    if (!res.ok) {
      throw new Error(data.error?.message || data.message || 'Error al iniciar sesión');
    }

    if (data.data.requires_2fa) {
      return data.data; // { requires_2fa: true, userId: ..., email: ... }
    }

    setAccessToken(data.data.access_token); // JWT en memoria
    setUser(data.data.user);               // Datos del usuario autenticado

    if (typeof window !== 'undefined') {
      window.location.href = callbackUrl || '/dashboard';
    } else {
      router.push(callbackUrl || '/dashboard');
    }
    return data.data;
  };

  /**
   * verify2fa
   *
   * Verifica el código 2FA de inicio de sesión.
   * Llama a: POST /api/auth/verify-2fa
   * En éxito: guarda accessToken y user en memoria, redirige a /dashboard.
   * En fallo: lanza Error con el mensaje del backend.
   */
  const verify2fa = async (userId: string, code: string, callbackUrl?: string) => {
    const res = await fetch('/api/auth/verify-2fa', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, code }),
      credentials: 'include',
    });

    const data = await res.json();

    if (!res.ok) {
      throw new Error(data.error?.message || data.message || 'Código incorrecto o expirado');
    }

    setAccessToken(data.data.access_token); // JWT en memoria
    setUser(data.data.user);               // Datos del usuario autenticado

    if (typeof window !== 'undefined') {
      window.location.href = callbackUrl || '/dashboard';
    } else {
      router.push(callbackUrl || '/dashboard');
    }
    return data.data;
  };

  /**
   * registerUser
   *
   * Registra una nueva empresa y su usuario administrador en una sola transacción.
   * Llama a: POST /api/auth/register
   * Flujo idéntico al login: si el registro es exitoso, autentica al usuario
   * automáticamente y redirige al dashboard.
   */
  const registerUser = async (formData: any) => {
    const res = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formData),
      credentials: 'include', // ← Para recibir la cookie de sesión tras el registro
    });

    const data = await res.json();

    if (!res.ok) {
      throw new Error(data.error?.message || data.message || 'Error al registrarse');
    }

    setAccessToken(data.data.access_token);
    setUser(data.data.user);

    if (typeof window !== 'undefined') {
      window.location.href = '/dashboard';
    } else {
      router.push('/dashboard');
    }
  };

  /**
   * logout
   *
   * Cierra la sesión del usuario.
   * Llama a: POST /api/auth/logout
   * El backend revoca el refreshToken en DB y elimina la cookie del navegador.
   * Siempre limpia el estado local (incluso si el servidor falla),
   * para evitar que el usuario quede atrapado en un estado corrupto.
   */
  const logout = async () => {
    try {
      await fetch('/api/auth/logout', {
        method: 'POST',
        credentials: 'include', // ← Envía la cookie para que el servidor la revoque
      });
    } catch (err) {
      console.error('Logout failed', err);
    } finally {
      // Siempre limpia la memoria local, aunque el servidor falle
      setAccessToken(null);
      setUser(null);
      if (typeof window !== 'undefined') {
        window.location.href = '/login';
      } else {
        router.push('/login');
      }
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        accessToken,
        login,
        verify2fa,
        registerUser,
        logout,
        refresh,
        isAuthenticated: !!user,
        loading,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}
