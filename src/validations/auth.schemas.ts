/**
 * validations/auth.schemas.ts
 */

import { z } from "zod";
import { extendZodWithOpenApi } from "@asteasolutions/zod-to-openapi";

extendZodWithOpenApi(z);

import { UserRole } from "@prisma/client";
import { RutSchema } from "./company.schemas";

export const RegisterUserSchema = z.object({
  email: z.string().email("Email inválido"),
  password: z.string().min(8, "Mínimo 8 caracteres").max(100),
  firstName: z.string().min(1).max(100),
  lastName: z.string().min(1).max(100),
  phone: z.string().optional(),
  role: z.nativeEnum(UserRole).default(UserRole.BUYER),
  // companyId es OBLIGATORIO — todo usuario debe pertenecer a una empresa
  companyId: z.string().cuid("companyId debe ser un CUID válido"),
});

export type RegisterUserDto = z.infer<typeof RegisterUserSchema>;

export const RefreshTokenSchema = z.object({
  refresh_token: z.string().min(1),
});

export const LoginSchema = z.object({
  email: z.string().email("Email inválido"),
  password: z.string().min(6, "Contraseña mínima de 6 caracteres"),
});

export type LoginDto = z.infer<typeof LoginSchema>;

/**
 * Schema para la página de registro (Empresa + Administrador)
 */
export const FullRegisterSchema = z.object({
  // Empresa
  razonSocial: z.string().min(3, "La razón social debe tener al menos 3 caracteres"),
  rut: RutSchema,
  telefono: z.string().regex(/^\+?56\d{9}$/, "Teléfono chileno inválido (+569XXXXXXXX)"),
  giro: z.string().min(3, "El giro debe tener al menos 3 caracteres"),
  
  // Dirección
  calleNumero: z.string().min(3, "La calle y número es obligatoria"),
  region: z.string().min(3, "La región es obligatoria"),
  comuna: z.string().min(3, "La comuna es obligatoria"),
  ciudad: z.string().min(3, "La ciudad es obligatoria"),
  
  // Usuario Administrador
  email: z.string().email("Email inválido"),
  password: z
    .string()
    .min(7, "La contraseña debe tener al menos 7 caracteres")
    .regex(/[A-Z]/, "La contraseña debe contener al menos una letra mayúscula")
    .regex(/[0-9!@#$%^&*()_+{}\[\]:;<>,.?~\\/-]/, "La contraseña debe contener al menos un número o símbolo especial"),
});

export type FullRegisterDto = z.infer<typeof FullRegisterSchema>;
