import { NextRequest } from "next/server";
import { withApiHandler, ok } from "@/lib/api-handler";
import { extractUserFromRequest, requireRole } from "@/lib/auth";
import { prisma } from "@/lib/client";
import { UserRole } from "@prisma/client";

export const GET = withApiHandler(async (req: NextRequest) => {
  const user = extractUserFromRequest(req);
  requireRole(user, [UserRole.ADMIN]);

  const { searchParams } = req.nextUrl;
  const search = searchParams.get("search") || "";
  const page = parseInt(searchParams.get("page") || "1", 10);
  const limit = parseInt(searchParams.get("limit") || "100", 10);
  const skip = (page - 1) * limit;

  const whereClause = {
    role: UserRole.SALES_REP,
    isActive: true,
    ...(search
      ? {
          OR: [
            { firstName: { contains: search, mode: "insensitive" as const } },
            { lastName: { contains: search, mode: "insensitive" as const } },
            { email: { contains: search, mode: "insensitive" as const } },
          ]
        }
      : {})
  };

  const withCompanies = searchParams.get("withCompanies") === "true";

  const [salesReps, total] = await Promise.all([
    prisma.user.findMany({
      where: whereClause,
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        isActive: true,
        createdAt: true,
        ...(withCompanies ? {
          assignedCompanies: {
            select: { id: true, razonSocial: true, rut: true }
          }
        } : {
          _count: { select: { assignedCompanies: true } }
        })
      },
      skip,
      take: limit,
      orderBy: { createdAt: "desc" },
    }),
    prisma.user.count({ where: whereClause }),
  ]);

  // Normalize: always expose assignedCompanies (empty array when not loaded, so UI stays consistent)
  const normalizedReps = salesReps.map((rep: any) => ({
    ...rep,
    assignedCount: withCompanies
      ? (rep.assignedCompanies?.length ?? 0)
      : (rep._count?.assignedCompanies ?? 0),
    assignedCompanies: withCompanies ? rep.assignedCompanies : [],
    _count: undefined,
  }));

  return ok({
    data: normalizedReps,
    meta: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    }
  });
});
