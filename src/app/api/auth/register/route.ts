/**
 * app/api/auth/register/route.ts
 *
 * POST /api/auth/register — Registro público de empresa + usuario administrador.
 *
 * Crea en una sola transacción:
 *  1. La empresa (Company) con RUT chileno validado.
 *  2. El usuario administrador (User con role ADMIN) vinculado a esa empresa.
 *
 * Campos requeridos:
 *  - razonSocial   : Nombre legal de la empresa
 *  - rut           : RUT chileno (acepta con o sin puntos, se normaliza)
 *  - telefono      : Teléfono de contacto (+56XXXXXXXXX)
 *  - giro          : Actividad o Giro de la empresa
 *  - email         : Correo del usuario administrador
 *  - password      : Contraseña (mínimo 8 caracteres)
 */
export const runtime = 'nodejs';

import { NextRequest } from "next/server";
import { withApiHandler, created } from "@/lib/api-handler";
import { prisma } from "@/lib/client";
import { signAccessToken, signRefreshToken } from "@/lib/auth";
import { logAuditAction } from "@/lib/audit";
import { ConflictError } from "@/lib/errors";
import { z } from "zod";
import { RutSchema } from "@/validations/company.schemas";
import bcrypt from "bcryptjs";

// ============================================================
// Schema de validación para el registro
// ============================================================

const RegisterSchema = z.object({
  // --- Datos de la Empresa ---
  razonSocial: z
    .string()
    .min(3, "La razón social debe tener al menos 3 caracteres")
    .max(255),

  rut: RutSchema, // Valida y normaliza automáticamente el RUT chileno

  telefono: z
    .string()
    .regex(
      /^\+?56[29]\d{8}$|^\+?56[23]\d{7}$/,
      "Teléfono chileno inválido. Ejemplo válido: +56912345678"
    ),

  giro: z
    .string()
    .min(3, "El giro debe tener al menos 3 caracteres")
    .max(255),

  defaultDiscount: z
    .number()
    .min(0)
    .max(100, "El descuento no puede superar el 100%")
    .default(0),

  // --- Datos del Usuario Administrador ---
  email: z.string().email("Email inválido"),

  password: z
    .string()
    .min(7, "La contraseña debe tener al menos 7 caracteres")
    .regex(/[A-Z]/, "La contraseña debe contener al menos una letra mayúscula")
    .regex(
      /[0-9!@#$%^&*()_+{}\[\]:;<>,.?~\\/-]/,
      "La contraseña debe contener al menos un número o símbolo especial"
    )
    .max(100),
});

export type RegisterDto = z.infer<typeof RegisterSchema>;

// ============================================================
// Handler
// ============================================================

export const POST = withApiHandler(async (req: NextRequest) => {
  const body = await req.json();
  const data = RegisterSchema.parse(body);

  // 1. Verificar unicidad de RUT, Email y Teléfono en paralelo
  const cleanPhone = data.telefono.replace(/^\+/, "");
  const phoneVariants = [data.telefono, `+${cleanPhone}`, cleanPhone];

  const [existingCompany, existingUser, existingUserPhone, existingCompanyPhone] = await Promise.all([
    prisma.company.findUnique({
      where: { rut: data.rut },
    }),
    prisma.user.findUnique({
      where: { email: data.email.toLowerCase() },
    }),
    prisma.user.findFirst({
      where: {
        phone: {
          in: phoneVariants,
        },
      },
    }),
    prisma.company.findFirst({
      where: {
        telefono: {
          in: phoneVariants,
        },
      },
    })
  ]);

  if (existingCompany) {
    throw new ConflictError(
      `Ya existe una empresa registrada con el RUT ${data.rut}`
    );
  }

  if (existingUser) {
    throw new ConflictError(
      `Ya existe un usuario registrado con el email ${data.email}`
    );
  }

  if (existingUserPhone) {
    throw new ConflictError(
      `Ya existe un usuario registrado con el teléfono ${data.telefono}`
    );
  }

  if (existingCompanyPhone) {
    throw new ConflictError(
      `Ya existe una empresa registrada con el teléfono ${data.telefono}`
    );
  }

  // 4. Encriptar contraseña
  const passwordHash = await bcrypt.hash(data.password, 10);

  // 4. Crear Empresa + Usuario en una sola transacción atómica
  const { company, user } = await prisma.$transaction(async (tx) => {
    const company = await tx.company.create({
      data: {
        rut: data.rut,
        razonSocial: data.razonSocial,
        giro: data.giro,
        telefono: data.telefono,
        email: data.email.toLowerCase(),
        defaultDiscount: data.defaultDiscount,
        paymentTerms: 0,
        paymentTermDiscount: 0,
      },
    });

    const user = await tx.user.create({
      data: {
        email: data.email.toLowerCase(),
        passwordHash,
        firstName: data.razonSocial.split(" ")[0] || "Usuario",
        lastName: data.razonSocial.split(" ").slice(1).join(" ") || "B2B",
        phone: data.telefono,
        role: "COMPANY_ADMIN",
        companyId: company.id,
      },
    });

    return { company, user };
  });

  // 5. Generar tokens JWT para dejar al usuario autenticado de inmediato
  const accessToken = signAccessToken({
    sub: user.id,
    email: user.email,
    role: user.role,
    companyId: user.companyId,
  });

  const refreshToken = signRefreshToken(user.id);

  await prisma.refreshToken.create({
    data: {
      token: refreshToken,
      userId: user.id,
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 días
    },
  });

  // 5. Establecer cookie httpOnly
  const { cookies } = await import("next/headers");
  (await cookies()).set("refresh_token", refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/",
    maxAge: 60 * 60 * 24 * 30, // 30 días
  });

  logAuditAction({
    action: "USER_REGISTERED",
    userId: user.id,
    details: { email: user.email, companyId: company.id, name: `${user.firstName} ${user.lastName}` },
    req,
  });

  // 6. Respuesta
  return created({
    access_token: accessToken,
    token_type: "Bearer",
    user: {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
      company: {
        id: company.id,
        rut: company.rut,
        razonSocial: company.razonSocial,
      },
    },
  });
});
