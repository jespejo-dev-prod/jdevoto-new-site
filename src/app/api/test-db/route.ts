import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/client";

export async function GET(req: NextRequest) {
  try {
    console.log("Testing Prisma connection in Vercel...");
    
    // Test a basic prisma query
    const userCount = await prisma.user.count();
    
    // Test raw query 1
    console.log("Testing raw query 1...");
    const rawRes1 = await prisma.$queryRaw`
      SELECT COUNT(*)::int as count FROM products 
      WHERE "isActive" = true AND "isDeleted" = false AND "stockQuantity" <= "stockAlert"
    `;

    // Test raw query 2
    console.log("Testing raw query 2...");
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const rawRes2 = await prisma.$queryRaw`
      SELECT 
        DATE_TRUNC('day', "createdAt") as date,
        SUM("totalGross")::float as total
      FROM "orders"
      WHERE "createdAt" >= ${thirtyDaysAgo}
        AND status NOT IN ('CANCELLED', 'REJECTED')
      GROUP BY 1
      ORDER BY 1 ASC
    `;

    return NextResponse.json({
      success: true,
      userCount,
      rawRes1,
      rawRes2
    });
  } catch (error: any) {
    console.error("Test DB error:", error);
    return NextResponse.json({
      success: false,
      errorName: error.name || "UnknownError",
      errorMessage: error.message || String(error),
      errorStack: error.stack || null,
      databaseUrlExists: !!process.env.DATABASE_URL,
      databaseUrlPrefix: process.env.DATABASE_URL ? process.env.DATABASE_URL.substring(0, 30) : null
    }, { status: 500 });
  }
}
