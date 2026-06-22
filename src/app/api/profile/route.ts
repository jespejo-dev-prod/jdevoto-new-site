import { NextRequest } from "next/server";
import { withApiHandler, ok } from "@/lib/api-handler";
import { extractUserFromRequest } from "@/lib/auth";
import { prisma } from "@/lib/client";
import { ForbiddenError } from "@/lib/errors";
import { z } from "zod";

const UpdateProfileSchema = z.object({
  firstName: z.string().min(1).optional(),
  lastName: z.string().min(1).optional(),
  phone: z.string().optional().nullable(),
  email: z.string().email().optional(),
  // Company details
  companyEmail: z.string().email().optional().nullable(),
  companyPhone: z.string().optional().nullable(),
  shippingStreet: z.string().optional().nullable(),
  shippingNumber: z.string().optional().nullable(),
  shippingApartment: z.string().optional().nullable(),
  shippingCommune: z.string().optional().nullable(),
  shippingCity: z.string().optional().nullable(),
  shippingRegion: z.string().optional().nullable(),
});

export const PATCH = withApiHandler(async (req: NextRequest) => {
  const user = extractUserFromRequest(req);

  const body = await req.json();
  const data = UpdateProfileSchema.parse(body);

  // Check if company fields are present and restrict updates
  const hasCompanyUpdates =
    data.companyEmail !== undefined ||
    data.companyPhone !== undefined ||
    data.shippingStreet !== undefined ||
    data.shippingNumber !== undefined ||
    data.shippingApartment !== undefined ||
    data.shippingCommune !== undefined ||
    data.shippingCity !== undefined ||
    data.shippingRegion !== undefined;

  if (hasCompanyUpdates && user.role !== "ADMIN" && user.role !== "COMPANY_ADMIN") {
    throw new ForbiddenError("No tiene permisos para modificar los datos de la empresa");
  }

  // Update user details
  const userUpdateData: any = {};
  if (data.firstName !== undefined) userUpdateData.firstName = data.firstName;
  if (data.lastName !== undefined) userUpdateData.lastName = data.lastName;
  if (data.phone !== undefined) userUpdateData.phone = data.phone;
  if (data.email !== undefined) userUpdateData.email = data.email.toLowerCase();

  const updatedUser = await prisma.user.update({
    where: { id: user.id },
    data: userUpdateData,
    include: {
      company: true
    }
  });

  // Update company details if requested and user has a company
  if (user.companyId) {
    const companyUpdateData: any = {};
    if (data.companyEmail !== undefined) companyUpdateData.email = data.companyEmail;
    if (data.companyPhone !== undefined) companyUpdateData.telefono = data.companyPhone;
    if (data.shippingStreet !== undefined) companyUpdateData.shippingStreet = data.shippingStreet;
    if (data.shippingNumber !== undefined) companyUpdateData.shippingNumber = data.shippingNumber;
    if (data.shippingApartment !== undefined) companyUpdateData.shippingApartment = data.shippingApartment;
    if (data.shippingCommune !== undefined) companyUpdateData.shippingCommune = data.shippingCommune;
    if (data.shippingCity !== undefined) companyUpdateData.shippingCity = data.shippingCity;
    if (data.shippingRegion !== undefined) companyUpdateData.shippingRegion = data.shippingRegion;

    if (Object.keys(companyUpdateData).length > 0) {
      const updatedCompany = await prisma.company.update({
        where: { id: user.companyId },
        data: companyUpdateData,
      });
      updatedUser.company = updatedCompany as any;
    }
  }

  // Return updated user (excluding passwordHash for security)
  const { passwordHash, ...safeUser } = updatedUser as any;
  return ok(safeUser);
});
