import { NextRequest } from "next/server";
import { prisma } from "@/lib/client";
import { priceService } from "@/modules/pricing/domain/price.service";
import * as XLSX from "xlsx";
import { extractUserFromRequest } from "@/lib/auth";
import { getServerUser } from "@/lib/server-auth";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    let companyId: string | null = null;
    let companyName = "General";

    // 1. Intentar obtener usuario desde Authorization Bearer
    try {
      const user = extractUserFromRequest(req);
      if (user?.companyId) {
        companyId = user.companyId;
      }
    } catch {
      // 2. Si no viene Bearer, intentar obtener desde cookie de sesión
      try {
        const serverUser = await getServerUser();
        if (serverUser?.companyId) {
          companyId = serverUser.companyId;
        }
      } catch {
        // Usuario invitado / sin sesión
      }
    }

    if (companyId) {
      const comp = await prisma.company.findUnique({
        where: { id: companyId },
        select: { razonSocial: true },
      });
      if (comp?.razonSocial) {
        companyName = comp.razonSocial;
      }
    }

    // 3. Cargar productos activos excluyendo pruebas y productos sin precio/stock
    const products = await prisma.product.findMany({
      where: {
        isActive: true,
        isDeleted: false,
        basePrice: { gt: 0 },
        NOT: [
          { sku: { contains: "TEST", mode: "insensitive" } },
          { name: { contains: "TEST", mode: "insensitive" } },
          {
            AND: [
              { stockQuantity: { lte: 0 } },
              { basePrice: { lte: 0 } },
            ],
          },
        ],
      },
      include: {
        category: {
          select: {
            id: true,
            name: true,
            parentId: true,
            isOutlet: true,
          },
        },
        brand: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: {
        sku: "asc",
      },
    });

    // Filtro adicional de seguridad en memoria (elimina cualquier test o stock 0 y precio 0)
    const validProducts = products.filter((p) => {
      const skuUpper = p.sku.toUpperCase();
      const nameUpper = p.name.toUpperCase();
      const isTest = skuUpper.includes("TEST") || nameUpper.includes("TEST") || skuUpper.startsWith("PRUEBA");
      const isZeroBoth = Number(p.stockQuantity) <= 0 && Number(p.basePrice) <= 0;
      const isZeroPrice = Number(p.basePrice) <= 0;

      return !isTest && !isZeroBoth && !isZeroPrice;
    });

    // 4. Calcular precios B2B (con descuentos específicos de empresa / promociones)
    const prices = await priceService.getPricesForProducts(validProducts as any, companyId);

    // 5. Construir filas de la planilla Excel
    const dataRows = validProducts.map((p, index) => {
      const price = prices[index];
      const baseNet = price ? price.unitNetPrice : Number(p.basePrice);
      const discountPct = price ? price.discountPercent : 0;
      const discountedNet = price ? price.discountedNetPrice : baseNet;
      const taxAmount = price ? price.taxAmount : Math.round(discountedNet * 0.19);
      const totalGross = price ? price.unitGrossPrice : discountedNet + taxAmount;
      const stock = Number(p.stockQuantity);

      return {
        "SKU / Código": p.sku,
        "Producto": p.name,
        "Marca": p.brand?.name || "Sin Marca",
        "Categoría": p.category?.name || "Sin Categoría",
        "Unidades por Empaque (Inner)": p.inner ?? 1,
        "Unidad": p.unit || "UN",
        "Precio Base Neto ($)": Math.round(baseNet),
        "Descuento B2B (%)": discountPct > 0 ? `${discountPct}%` : "0%",
        "Precio Neto B2B ($)": Math.round(discountedNet),
        "IVA 19% ($)": Math.round(taxAmount),
        "Precio Total c/IVA ($)": Math.round(totalGross),
        "Stock": stock > 0 ? stock : "Agotado",
      };
    });

    // 6. Generar Workbook y Worksheet
    const worksheet = XLSX.utils.json_to_sheet(dataRows);

    // Configurar anchos de columna óptimos
    worksheet["!cols"] = [
      { wch: 14 }, // SKU
      { wch: 45 }, // Producto
      { wch: 18 }, // Marca
      { wch: 25 }, // Categoría
      { wch: 26 }, // Unidades por Empaque (Inner)
      { wch: 10 }, // Unidad
      { wch: 18 }, // Precio Base Neto ($)
      { wch: 16 }, // Descuento B2B (%)
      { wch: 18 }, // Precio Neto B2B ($)
      { wch: 14 }, // IVA 19% ($)
      { wch: 18 }, // Precio Total c/IVA ($)
      { wch: 12 }, // Stock
    ];

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Lista de Precios");

    const excelBuffer = XLSX.write(workbook, { type: "buffer", bookType: "xlsx" });

    const dateStr = new Date().toISOString().slice(0, 10);
    const sanitizedCompanyName = companyName
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-zA-Z0-9]/g, "_")
      .replace(/_+/g, "_")
      .slice(0, 25);

    const filename = `Lista_Precios_JDevoto_${sanitizedCompanyName}_${dateStr}.xlsx`;

    return new Response(excelBuffer, {
      status: 200,
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Cache-Control": "private, no-cache, no-store, must-revalidate",
      },
    });
  } catch (error: any) {
    console.error("Error al exportar lista de precios:", error);
    return new Response("Error al exportar lista de precios", { status: 500 });
  }
}
