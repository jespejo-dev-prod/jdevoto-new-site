import { NextRequest } from "next/server";
import { prisma } from "@/lib/client";
import { withApiHandler, ok, noContent, RouteContext } from "@/lib/api-handler";
import { extractUserFromRequest, requireRole } from "@/lib/auth";
import { UserRole } from "@prisma/client";
import { UpdateCompanySchema } from "@/validations/company.schemas";
import { NotFoundError, ForbiddenError, BusinessRuleError } from "@/lib/errors";
import { logAuditAction } from "@/lib/audit";

export const GET = withApiHandler(async (req: NextRequest, { params }: RouteContext<{ id: string }>) => {
  const user = extractUserFromRequest(req);
  requireRole(user, [UserRole.ADMIN, UserRole.SALES_REP, UserRole.COMPANY_ADMIN, UserRole.BUYER]);

  const { id } = await params;

  if ((user.role === UserRole.COMPANY_ADMIN || user.role === UserRole.BUYER) && user.companyId !== id) {
    throw new ForbiddenError("No puedes ver los datos de otra empresa");
  }

  const customer = await prisma.company.findUnique({
    where: { id },
    include: {
      users: {
        where: { isActive: true },
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          role: true,
        }
      },
      salesRep: {
        select: {
          email: true
        }
      }
    }
  });

  if (!customer) throw new NotFoundError("Cliente", id);

  const responseData = {
    ...customer,
    salesRepEmail: customer.salesRep?.email || null,
  };

  return ok(responseData);
});

export const PATCH = withApiHandler(async (req: NextRequest, { params }: RouteContext<{ id: string }>) => {
  const user = extractUserFromRequest(req);
  requireRole(user, [UserRole.ADMIN, UserRole.COMPANY_ADMIN]);

  const { id } = await params;

  if (user.role === UserRole.COMPANY_ADMIN && user.companyId !== id) {
    throw new ForbiddenError("No puedes editar los datos de otra empresa");
  }

  const body = await req.json();
  const { salesRepEmail, ...companyData } = UpdateCompanySchema.parse(body);

  const existing = await prisma.company.findUnique({ 
    where: { id },
    include: { salesRep: { select: { email: true } } }
  });
  if (!existing) throw new NotFoundError("Cliente", id);

  if (user.role === UserRole.COMPANY_ADMIN) {
    const hasDifferentCredit = companyData.creditLimit !== undefined && Number(companyData.creditLimit) !== Number(existing.creditLimit);
    const hasDifferentDiscount = companyData.defaultDiscount !== undefined && Number(companyData.defaultDiscount) !== Number(existing.defaultDiscount);

    if (hasDifferentCredit || hasDifferentDiscount) {
      throw new ForbiddenError("No estás autorizado para modificar el límite de crédito o el descuento base de tu empresa.");
    }

    const existingSalesRepEmail = existing.salesRep?.email || "";
    const requestedSalesRepEmail = salesRepEmail || "";
    const hasDifferentSalesRep = salesRepEmail !== undefined && requestedSalesRepEmail !== existingSalesRepEmail;

    if (hasDifferentSalesRep) {
      throw new ForbiddenError("No estás autorizado para asignar o cambiar el vendedor de tu empresa.");
    }
  }

  // Resolver salesRepId basado en salesRepEmail
  let salesRepId: string | null | undefined = undefined;
  if (salesRepEmail !== undefined) {
    if (salesRepEmail) {
      const salesRep = await prisma.user.findFirst({
        where: { email: salesRepEmail, role: UserRole.SALES_REP, isActive: true },
        select: { id: true }
      });
      
      if (!salesRep) {
        throw new BusinessRuleError(
          "El correo ingresado no corresponde a un vendedor activo",
          "INVALID_SALES_REP_EMAIL"
        );
      }
      
      salesRepId = salesRep.id;
    } else {
      salesRepId = null; // Si se envía vacío, desvincular el vendedor
    }
  }

  const updated = await prisma.company.update({
    where: { id },
    data: {
      ...companyData,
      ...(salesRepId !== undefined ? { salesRepId } : {}),
    },
  });

  await logAuditAction({
    userId: user.id,
    action: "COMPANY_UPDATED",
    entity: "Company",
    entityId: id,
    details: {
      razonSocial: updated.razonSocial,
      rut: updated.rut,
      changes: Object.keys(companyData),
      salesRepUpdated: salesRepId !== undefined,
      creditLimit: companyData.creditLimit,
      defaultDiscount: companyData.defaultDiscount,
    },
    req,
  });

  return ok(updated);
});

export const DELETE = withApiHandler(async (req: NextRequest, { params }: RouteContext<{ id: string }>) => {
  const user = extractUserFromRequest(req);
  requireRole(user, [UserRole.ADMIN]);

  const { id } = await params;
  
  // 1. Verificar si existe el cliente
  const customer = await prisma.company.findUnique({ 
    where: { id },
    include: { _count: { select: { orders: true } } }
  });
  
  if (!customer) throw new NotFoundError("Cliente", id);

  // 2. Lógica: Si está activo, solo desactivar. Si YA está inactivo, intentar borrar definitivamente.
  if (customer.isActive) {
    // Si tiene pedidos, desactivar
    if (customer._count.orders > 0) {
      await prisma.company.update({
        where: { id },
        data: { isActive: false }
      });
      await logAuditAction({
        userId: user.id,
        action: "COMPANY_DELETED",
        entity: "Company",
        entityId: id,
        details: { softDelete: true, reason: "Tiene pedidos", razonSocial: customer.razonSocial, rut: customer.rut },
        req,
      });
      return ok({ message: "Cliente con pedidos: Desactivado correctamente para preservar historial." });
    }

    // Si tiene usuarios, desactivar
    const userCount = await prisma.user.count({ where: { companyId: id } });
    if (userCount > 0) {
      await prisma.company.update({
        where: { id },
        data: { isActive: false }
      });
      await logAuditAction({
        userId: user.id,
        action: "COMPANY_DELETED",
        entity: "Company",
        entityId: id,
        details: { softDelete: true, reason: "Tiene usuarios", razonSocial: customer.razonSocial, rut: customer.rut },
        req,
      });
      return ok({ message: "Cliente con usuarios vinculados: Desactivado correctamente." });
    }

    // Si es nuevo sin nada, podemos borrarlo de una
    await prisma.company.delete({ where: { id } });
    await logAuditAction({
      userId: user.id,
      action: "COMPANY_DELETED",
      entity: "Company",
      entityId: id,
      details: { softDelete: false, reason: "Sin actividad", razonSocial: customer.razonSocial, rut: customer.rut },
      req,
    });
    return ok({ message: "Cliente sin actividad: Eliminado definitivamente." });
  } else {
    // YA ESTÁ INACTIVO: Intentamos borrado físico
    try {
      // Doble check preventivo antes de intentar el borrado
      const activity = await prisma.company.findUnique({
        where: { id },
        include: { _count: { select: { orders: true, users: true } } }
      });

      if (activity && (activity._count.orders > 0 || activity._count.users > 0)) {
        return ok({ 
          message: "No es posible eliminar permanentemente: Este cliente tiene historial (pedidos o usuarios) que debe preservarse por integridad referencial." 
        });
      }

      await prisma.company.delete({ where: { id } });
      
      await logAuditAction({
        userId: user.id,
        action: "COMPANY_DELETED",
        entity: "Company",
        entityId: id,
        details: { softDelete: false },
        req,
      });

      return ok({ message: "Cliente eliminado definitivamente del sistema." });
    } catch (error: any) {
      // Manejo de errores de integridad referencial (P2003 de Prisma o 23001/23503 de Postgres)
      const isForeignKeyError = error.code === 'P2003' || error.cause?.code === '23001' || error.cause?.code === '23503';
      
      if (isForeignKeyError) {
        return ok({ 
          message: "Error de integridad: El cliente aún tiene registros vinculados en el sistema y no puede ser borrado permanentemente."
        });
      }
      throw error;
    }
  }
});
