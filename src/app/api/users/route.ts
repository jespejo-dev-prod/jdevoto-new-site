import { NextRequest, NextResponse } from "next/server";
import { withApiHandler, ok, created } from "@/lib/api-handler";
import { extractUserFromRequest, requireRole } from "@/lib/auth";
import { prisma } from "@/lib/client";
import { UserRole } from "@prisma/client";
import { sendNotificationEmail } from "@/lib/email";
import bcrypt from "bcryptjs";
import { z } from "zod";

const CreateUserSchema = z.object({
  email: z.string().email(),
  password: z.string().min(7).regex(/[A-Z]/, "Debe contener al menos una mayúscula").regex(/[0-9!@#$%^&*()_+{}\[\]:;<>,.?~\\/-]/, "Debe contener al menos un número o símbolo").optional().or(z.literal('')),
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  role: z.nativeEnum(UserRole).default(UserRole.BUYER),
  companyId: z.string().optional(), // Si no se pasa, usa la del admin o company_admin
});

export const GET = withApiHandler(async (req: NextRequest) => {
  const user = extractUserFromRequest(req);
  requireRole(user, [UserRole.ADMIN, UserRole.COMPANY_ADMIN]);

  const searchParams = req.nextUrl.searchParams;
  const search = searchParams.get("search") || "";
  const roleFilter = searchParams.get("role") || "";
  const page = parseInt(searchParams.get("page") || "1", 10);
  const limit = parseInt(searchParams.get("limit") || "10", 10);
  const skip = (page - 1) * limit;

  const baseWhere: any = user.role === UserRole.COMPANY_ADMIN 
    ? { companyId: user.companyId, isActive: true } 
    : { isActive: true };

  if (roleFilter) {
    baseWhere.role = roleFilter;
  }

  const whereClause = {
    ...baseWhere,
    ...(search
      ? {
          OR: [
            { firstName: { contains: search, mode: "insensitive" as const } },
            { lastName: { contains: search, mode: "insensitive" as const } },
            { email: { contains: search, mode: "insensitive" as const } },
            {
              company: {
                razonSocial: { contains: search, mode: "insensitive" as const }
              }
            }
          ]
        }
      : {})
  };

  const [users, total] = await Promise.all([
    prisma.user.findMany({
      where: whereClause,
      include: {
        company: {
          select: { razonSocial: true, rut: true }
        }
      },
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' }
    }),
    prisma.user.count({ where: whereClause })
  ]);

  return ok(users, 200, {
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit)
    }
  });
});

export const POST = withApiHandler(async (req: NextRequest) => {
  const currentUser = extractUserFromRequest(req);
  requireRole(currentUser, [UserRole.ADMIN, UserRole.COMPANY_ADMIN]);

  const body = await req.json();
  const data = CreateUserSchema.parse(body);

  // Validación de COMPANY_ADMIN
  if (currentUser.role === UserRole.COMPANY_ADMIN) {
    if (data.role === UserRole.ADMIN || data.role === UserRole.COMPANY_ADMIN || data.role === 'SUPER_ADMIN') {
      return NextResponse.json({ error: "No tienes permisos para crear este tipo de rol" }, { status: 403 });
    }
    // Forzar siempre el companyId del COMPANY_ADMIN
    data.companyId = currentUser.companyId || undefined;
  }

  // Validación de ADMIN
  if (currentUser.role === UserRole.ADMIN) {
    if (data.role === UserRole.ADMIN || data.role === 'SUPER_ADMIN') {
      return NextResponse.json({ error: "Solo un Super Administrador puede crear usuarios con este rol" }, { status: 403 });
    }
  }

  const existing = await prisma.user.findUnique({
    where: { email: data.email.toLowerCase() }
  });

  if (existing) {
    if (!existing.isActive) {
      // Si existe pero está inactivo, lo "reactivamos" y sobreescribimos sus datos
      
      const hasPassword = data.password && data.password.trim() !== "";
      const rawPassword = hasPassword ? data.password! : require("crypto").randomBytes(16).toString("hex") + "A1!";
      const passwordHash = await bcrypt.hash(rawPassword, 10);
      
      const reactivatedUser = await prisma.user.update({
        where: { id: existing.id },
        data: {
          isActive: true,
          firstName: data.firstName,
          lastName: data.lastName,
          role: data.role,
          // COMPANY_ADMIN hereda su propia empresa; ADMIN usa su companyId por defecto si no se provee
          companyId: data.companyId === "" ? null : (data.companyId || currentUser.companyId || undefined),
          passwordHash,
        }
      });

      const roleName = 
        data.role === 'ADMIN' ? 'Administrador' :
        data.role === 'COMPANY_ADMIN' ? 'Administrador de Empresa' :
        data.role === 'SALES_REP' ? 'Vendedor' : 'Comprador';
        
      if (hasPassword) {
        const emailTitle = "¡Cuenta reactivada en Jdevoto.cl B2B!";
        const emailMessage = `Hola ${reactivatedUser.firstName},<br><br>Se ha reactivado tu cuenta en nuestra plataforma B2B con el rol de <strong>${roleName}</strong>.<br>Ahora puedes iniciar sesión con tu nueva contraseña.`;
        
        sendNotificationEmail(reactivatedUser.email, emailTitle, emailMessage, "/login").catch(err => {
          console.error("Error enviando email de bienvenida al usuario reactivado", err);
        });
        
        const { sendUserUpdatedAdminNotification } = await import("@/lib/email");
        sendUserUpdatedAdminNotification(reactivatedUser.email, roleName, true).catch(err => {
          console.error("Error enviando notificación de reactivación al admin", err);
        });
      } else {
        const crypto = require("crypto");
        const token = crypto.randomBytes(32).toString('hex');
        const expires = new Date(Date.now() + 3600000); // 1 hour
        
        await prisma.passwordResetToken.deleteMany({ where: { email: reactivatedUser.email } });
        await prisma.passwordResetToken.create({
          data: { email: reactivatedUser.email, token, expires }
        });
        
        const { sendSetupPasswordEmail } = await import("@/lib/email");
        sendSetupPasswordEmail(reactivatedUser.email, token, roleName).catch(err => {
          console.error("Error enviando email de setup al usuario reactivado", err);
        });
      }

      const { passwordHash: _, ...userWithoutPassword } = reactivatedUser;
      
      // Auto-assign company if SALES_REP and company has no sales rep
      if (reactivatedUser.companyId) {
        const company = await prisma.company.findUnique({ where: { id: reactivatedUser.companyId } });
        if (company && !company.salesRepId && reactivatedUser.role === 'SALES_REP') {
          await prisma.company.update({
            where: { id: company.id },
            data: { salesRepId: reactivatedUser.id }
          });
        }
      }

      return created(userWithoutPassword);
    } else {
      // El usuario existe y está activo.
      // Si el usuario actual es COMPANY_ADMIN, no puede modificar a un ADMIN ni a otro COMPANY_ADMIN
      if (currentUser.role === UserRole.COMPANY_ADMIN && (existing.role === UserRole.ADMIN || existing.role === UserRole.COMPANY_ADMIN)) {
        return NextResponse.json({ error: "No tienes permisos para modificar a este usuario existente" }, { status: 403 });
      }

      // Verificamos si no hay cambios reales
      const targetCompanyId = data.companyId ?? currentUser.companyId;
      if (existing.role === data.role && existing.companyId === targetCompanyId) {
        return NextResponse.json({ error: "El correo electrónico ya está registrado con este mismo rol y empresa" }, { status: 400 });
      }

      const hasPassword = data.password && data.password.trim() !== "";
      const updateData: any = {
        firstName: data.firstName,
        lastName: data.lastName,
        role: data.role,
        companyId: targetCompanyId,
      };

      if (hasPassword) {
        updateData.passwordHash = await bcrypt.hash(data.password!, 10);
      }

      const updatedUser = await prisma.user.update({
        where: { id: existing.id },
        data: updateData
      });

      const roleName = 
        data.role === 'ADMIN' ? 'Administrador' :
        data.role === 'COMPANY_ADMIN' ? 'Administrador de Empresa' :
        data.role === 'SALES_REP' ? 'Vendedor' : 'Comprador';
        
      const emailTitle = "¡Tu cuenta ha sido actualizada en Jdevoto.cl B2B!";
      let emailMessage = `Hola ${updatedUser.firstName},<br><br>Tu cuenta en nuestra plataforma B2B ha sido actualizada al rol de <strong>${roleName}</strong>.`;
      
      if (hasPassword) {
         emailMessage += `<br>También se ha actualizado tu contraseña.`;
      }

      sendNotificationEmail(updatedUser.email, emailTitle, emailMessage, "/login").catch(err => {
        console.error("Error enviando email de actualización", err);
      });

      const { sendUserUpdatedAdminNotification } = await import("@/lib/email");
      sendUserUpdatedAdminNotification(updatedUser.email, roleName, false).catch(err => {
        console.error("Error enviando notificación de actualización al admin", err);
      });

      const { passwordHash: _, ...userWithoutPassword } = updatedUser;
      
      // Auto-assign company if SALES_REP and company has no sales rep
      if (updatedUser.companyId && updatedUser.role === 'SALES_REP') {
        const company = await prisma.company.findUnique({ where: { id: updatedUser.companyId } });
        if (company && !company.salesRepId) {
          await prisma.company.update({
            where: { id: company.id },
            data: { salesRepId: updatedUser.id }
          });
        }
      }

      return ok(userWithoutPassword);
    }
  }

  const hasPassword = data.password && data.password.trim() !== "";
  const rawPassword = hasPassword ? data.password! : require("crypto").randomBytes(16).toString("hex") + "A1!";
  const passwordHash = await bcrypt.hash(rawPassword, 10);

  const newUser = await prisma.user.create({
    data: {
      email: data.email.toLowerCase(),
      passwordHash,
      firstName: data.firstName,
      lastName: data.lastName,
      role: data.role,
      // COMPANY_ADMIN hereda su propia empresa; ADMIN usa su companyId por defecto si no se provee
      companyId: data.companyId === "" ? null : (data.companyId || currentUser.companyId || undefined),
    }
  });

  const roleName = 
    data.role === 'ADMIN' ? 'Administrador' :
    data.role === 'COMPANY_ADMIN' ? 'Administrador de Empresa' :
    data.role === 'SALES_REP' ? 'Vendedor' : 'Comprador';
    
  if (hasPassword) {
    const emailTitle = "¡Bienvenido a Jdevoto.cl B2B!";
    const emailMessage = `Hola ${newUser.firstName},<br><br>Se ha creado una cuenta para ti en nuestra plataforma B2B con el rol de <strong>${roleName}</strong>.<br>Ahora puedes iniciar sesión utilizando tu correo y la contraseña que te asignaron.`;
    
    sendNotificationEmail(newUser.email, emailTitle, emailMessage, "/login").catch(err => {
      console.error("Error enviando email de bienvenida al nuevo usuario", err);
    });
  } else {
    const crypto = require("crypto");
    const token = crypto.randomBytes(32).toString('hex');
    const expires = new Date(Date.now() + 3600000); // 1 hour
    
    await prisma.passwordResetToken.deleteMany({ where: { email: newUser.email } });
    await prisma.passwordResetToken.create({
      data: { email: newUser.email, token, expires }
    });
    
    const { sendSetupPasswordEmail } = await import("@/lib/email");
    sendSetupPasswordEmail(newUser.email, token, roleName).catch(err => {
      console.error("Error enviando email de setup al nuevo usuario", err);
    });
  }

  const { passwordHash: _, ...userWithoutPassword } = newUser;
  
  // Auto-assign company if SALES_REP and company has no sales rep
  if (newUser.companyId && newUser.role === 'SALES_REP') {
    const company = await prisma.company.findUnique({ where: { id: newUser.companyId } });
    if (company && !company.salesRepId) {
      await prisma.company.update({
        where: { id: company.id },
        data: { salesRepId: newUser.id }
      });
    }
  }

  return created(userWithoutPassword);
});
