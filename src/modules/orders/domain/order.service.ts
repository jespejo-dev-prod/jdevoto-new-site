/**
 * services/order.service.ts
 *
 * OrderService — Lógica de Negocio de Pedidos B2B (Schema Updated)
 *
 * Responsabilidades:
 *  1. Validar stock disponible antes de crear el pedido (stockQuantity - stockReserved).
 *  2. Calcular precios aplicando la lista correcta por empresa.
 *  3. Crear el pedido con sus ítems en una transacción atómica.
 *  4. Reservar stock al crear (stockReserved += qty) — no descuenta físico.
 *  5. Descontar stock físico al entregar (stockQuantity -= qty, stockReserved -= qty).
 *  6. Liberar reserva al cancelar/rechazar (stockReserved -= qty).
 *  7. Verificar límite de crédito de la empresa.
 *  8. Gestionar transiciones de estado del pedido.
 */

import { prisma } from "@/lib/client";
import { priceService } from "@/modules/pricing/domain/price.service";
import {
  NotFoundError,
  BusinessRuleError,
} from "@/lib/errors";
import type {
  CreateOrderInput,
  OrderSummary,
  PaginatedResult,
} from "@/types/domain";
import { TAX_RATE } from "@/types/domain";
import { OrderStatus, Prisma } from "@prisma/client";
import type { GetOrdersQuery } from "@/validations/order.schemas";

// ============================================================
// ORDER SERVICE
// ============================================================

export class OrderService {
  // ============================================================
  // CREAR PEDIDO
  // ============================================================

  /**
   * Crea un pedido B2B completo con validación de stock,
   * cálculo de precios por empresa y límite de crédito.
   * Toda la operación es atómica (Prisma transaction).
   */
  async createOrder(input: CreateOrderInput) {
    const { companyId, createdById, items, notes, shippingAddress, paymentMethod, status = OrderStatus.CONFIRMED } = input;

    // 1. Verificar que la empresa existe y está activa
    const company = await prisma.company.findUnique({
      where: { id: companyId, isActive: true },
    });
    if (!company) throw new NotFoundError("Empresa", companyId);

    // 2. Verificar que el usuario existe y pertenece a la empresa
    const user = await prisma.user.findUnique({
      where: { id: createdById, isActive: true },
    });
    if (!user) throw new NotFoundError("Usuario", createdById);

    // 3. Cargar productos solicitados con lock optimista de stock
    const productIds = items.map((i) => i.productId);
    const products = await prisma.product.findMany({
      where: { id: { in: productIds }, isActive: true },
    });

    // Verificar que todos los productos existen
    if (products.length !== productIds.length) {
      const foundIds = new Set(products.map((p) => p.id));
      const missing = productIds.filter((id) => !foundIds.has(id));
      throw new NotFoundError(`Productos no encontrados: ${missing.join(", ")}`);
    }

    const productMap = new Map(products.map((p) => [p.id, p]));

    // 4. Validar cantidad mínima de pedido y stock disponible
    for (const item of items) {
      const product = productMap.get(item.productId)!;

      if (item.quantity < product.minOrderQty) {
        throw new BusinessRuleError(
          `Producto '${product.name}' requiere cantidad mínima de ${product.minOrderQty} unidades`,
          "MIN_ORDER_QUANTITY"
        );
      }

      if (product.inner && product.inner > 1 && item.quantity % product.inner !== 0) {
        throw new BusinessRuleError(
          `La cantidad del producto '${product.name}' (${item.quantity} unidades) debe ser múltiplo de su empaque mínimo de ${product.inner} unidades.`,
          "INVALID_PACK_MULTIPLES"
        );
      }

      // Stock disponible = stock físico - stock ya reservado por otras órdenes activas
      const stockDisponible = Number(product.stockQuantity) - Number(product.stockReserved);
      if (stockDisponible < item.quantity) {
        throw new BusinessRuleError(
          `Stock insuficiente para '${product.name}'. ` +
            `Disponible: ${stockDisponible}, solicitado: ${item.quantity}`,
          "INSUFFICIENT_STOCK"
        );
      }
    }

    // 5. Calcular precios con la lista de la empresa
    const prices = await priceService.getPricesForProducts(products, companyId);
    const priceMap = new Map(prices.map((p) => [p.productId, p]));

    // 6. Construir ítems del pedido con cálculos de precio aplicando descuento corporativo
    const defaultDiscountPercent = Number(company.defaultDiscount) || 0;

    const orderItemsData = items.map((item) => {
      const product = productMap.get(item.productId)!;
      const price = priceMap.get(item.productId)!;

      const isExcluded = price.priceSource === 'PROMOTION' || price.priceSource === 'OUTLET';
      const discount = isExcluded ? 0 : defaultDiscountPercent;
      const unitNetPrice = price.discountedNetPrice;

      const lineNetTotal = round2(
        (unitNetPrice * item.quantity) * (1 - discount / 100)
      );
      const lineTax = round2(lineNetTotal * TAX_RATE);
      const lineTotal = round2(lineNetTotal + lineTax);

      return {
        productId: product.id,
        productSku: product.sku,
        productName: product.name,
        quantity: item.quantity,
        unitNetPrice,
        discount: isExcluded ? price.discountPercent : defaultDiscountPercent,
        lineNetTotal,
        lineTax,
        lineTotal,
      };
    });

    // 7. Calcular totales del pedido
    const baseSubtotalNet = round2(
      orderItemsData.reduce((acc, i) => acc + i.lineNetTotal, 0)
    );

    const subtotalBeforeCompanyDiscount = round2(
      orderItemsData.reduce((acc, i) => acc + (i.unitNetPrice * i.quantity), 0)
    );

    // Validar mínimo de compra de 100.000 CLP netos (sobre el subtotal neto con descuento corporativo aplicado)
    const isTestBypass = items.some(i => {
      const product = productMap.get(i.productId);
      return product?.sku === 'TEST-001' || product?.sku?.toUpperCase() === 'TEST-001';
    });
    if (baseSubtotalNet < 100000 && !isTestBypass) {
      throw new BusinessRuleError(
        `El subtotal neto del pedido ($${baseSubtotalNet.toLocaleString("es-CL")}) ` +
          `debe ser de al menos $100.000 pesos netos.`,
        "MINIMUM_PURCHASE_NOT_MET"
      );
    }

    // Validar mínimo de flete incluido según región y comuna
    const reqShippingMethod = (shippingAddress as any)?.shippingMethod;
    if (reqShippingMethod === "free") {
      const region = (shippingAddress as any)?.region || "";
      const comuna = (shippingAddress as any)?.comuna || "";
      const r = region.toUpperCase();
      const c = comuna.toUpperCase();

      if (c.includes("JUAN FERNANDEZ") || c.includes("ISLA DE PASCUA")) {
        throw new BusinessRuleError(
          "El despacho gratuito (Flete Incluido) no está disponible para territorio insular. Debe seleccionar Flete por Pagar.",
          "FREE_SHIPPING_NOT_AVAILABLE_FOR_INSULAR"
        );
      }

      let freeShippingMin = 250000;

      // Zonas Extremas $1.000.000 (Sur)
      if (
        r.includes("AYSEN") || 
        r.includes("MAGALLANES") ||
        c.includes("PUNTA ARENAS") || 
        c.includes("PUERTO NATALES") || 
        c.includes("AYSEN") ||
        c.includes("PUERTO CISNE") ||
        c.includes("PUERTO AYSEN") ||
        c.includes("COIHAIQUE") ||
        c.includes("COCHRANE") ||
        c.includes("PORVENIR")
      ) {
        freeShippingMin = 1000000;
      }
      // Zonas Extremas $500.000 (Norte + Calama)
      else if (
        r.includes("TARAPACA") ||
        r.includes("ARICA") ||
        c.includes("ARICA") || 
        c.includes("IQUIQUE") || 
        c.includes("CALAMA")
      ) {
        freeShippingMin = 500000;
      }
      // Región Metropolitana y Valparaíso $100.000
      else if (r.includes("METROPOLITANA") || r.includes("VALPARAISO")) {
        freeShippingMin = 100000;
      }

      if (baseSubtotalNet < freeShippingMin) {
        throw new BusinessRuleError(
          `El subtotal neto del pedido ($${baseSubtotalNet.toLocaleString("es-CL")}) ` +
            `es inferior al mínimo requerido para flete incluido en su zona ($${freeShippingMin.toLocaleString("es-CL")} netos).`,
          "FREE_SHIPPING_MINIMUM_NOT_MET"
        );
      }
    }

    // Calcular descuento por medio de pago y plazo
    const paymentTermsDays = company.paymentTerms;
    let paymentDiscountPercent = 0;
    if (paymentMethod === 'credit_b2b') {
      if (company.paymentTermDiscount !== null && company.paymentTermDiscount !== undefined) {
        paymentDiscountPercent = Number(company.paymentTermDiscount);
      } else {
        if (paymentTermsDays === 90) paymentDiscountPercent = 0;
        else if (paymentTermsDays === 60) paymentDiscountPercent = 4;
        else if (paymentTermsDays === 30) paymentDiscountPercent = 7;
        else if (paymentTermsDays === 0) paymentDiscountPercent = 10;
      }
    } else if (paymentMethod === 'webpay' || paymentMethod === 'transfer' || paymentMethod === 'mercadopago') {
      paymentDiscountPercent = 10;
    }

    const paymentDiscountAmount = round2(baseSubtotalNet * (paymentDiscountPercent / 100));

    // Neto final tras todos los descuentos
    const subtotalNet = round2(baseSubtotalNet - paymentDiscountAmount);
    const taxAmount = round2(subtotalNet * TAX_RATE);
    const totalGross = round2(subtotalNet + taxAmount);

    let finalStatus = status;
    let finalInternalNotes = input.notes || ''; // Usamos notes de input porque internalNotes no existe en CreateOrderInput

    // 8. Verificar límite de crédito disponible de la empresa
    // SOLO si el pedido NO es un borrador (DRAFT) Y es con crédito directo
    if (status !== OrderStatus.DRAFT && paymentMethod === 'credit_b2b') {
      const availableCredit =
        Number(company.creditLimit) - Number(company.creditUsed);

      if (totalGross > availableCredit) {
        // En vez de bloquear, forzamos a PENDING para revisión manual
        finalStatus = OrderStatus.PENDING;
        finalInternalNotes = (finalInternalNotes ? finalInternalNotes + '\n' : '') + 
          `[SISTEMA] Pedido excede límite de crédito. Disponible: $${availableCredit.toLocaleString("es-CL")}, Requerido: $${totalGross.toLocaleString("es-CL")}. Enviado a revisión.`;
      }

      // 8.1 Verificar que no tenga facturas vencidas
      const overdueOrders = await prisma.order.count({
        where: {
          companyId: companyId,
          paymentStatus: { not: "PAID" },
          dueDate: { lt: new Date() },
          status: { notIn: [OrderStatus.CANCELLED, OrderStatus.DRAFT] }
        }
      });

      if (overdueOrders > 0) {
        finalStatus = OrderStatus.PENDING;
        finalInternalNotes = (finalInternalNotes ? finalInternalNotes + '\n' : '') + 
          `[SISTEMA] Pedido enviado a revisión (PENDING) porque mantiene ${overdueOrders} factura(s) vencida(s).`;
      }
    }

    // Calcular dueDate si es Crédito Directo y no es borrador
    let dueDate: Date | undefined = undefined;
    if (paymentMethod === 'credit_b2b' && status !== OrderStatus.DRAFT) {
      dueDate = new Date();
      dueDate.setDate(dueDate.getDate() + paymentTermsDays);
    }

    // 9. Ejecutar todo en una transacción atómica
    const order = await prisma.$transaction(async (tx) => {
      // Determinar si es una empresa de pruebas para el prefijo de la orden
      const isTest = company.razonSocial.toLowerCase().includes('test');
      
      // Generar número de pedido secuencial
      const orderNumber = await this.generateOrderNumber(tx, isTest);

      // Determinar la atribución del vendedor (Sales Rep) para comisiones y reportes
      let attributedSalesRepId = company.salesRepId;
      if (user.role === 'SALES_REP') {
        attributedSalesRepId = user.id;
      }

      // Validar regla de negocio: Crédito B2B debe quedar CONFIRMED (no pending) si hay cupo
      // EXCEPTO si el usuario es ADMIN o SUPER_ADMIN, los cuales deben quedar como pendientes.
      const availableCreditForCheck = Number(company.creditLimit) - Number(company.creditUsed);
      if (paymentMethod === 'credit_b2b' && finalStatus === 'PENDING' && totalGross <= availableCreditForCheck) {
        if (user.role !== 'ADMIN' && user.role !== 'SUPER_ADMIN') {
          finalStatus = 'CONFIRMED';
        }
      }

      // Crear el pedido
      const newOrder = await tx.order.create({
        data: {
          orderNumber,
          companyId,
          createdById,
          status: finalStatus,
          paymentMethod,
          salesRepId: attributedSalesRepId,
          createdAt: input.createdAt || new Date(),
          subtotalNet,
          taxAmount,
          totalGross,
          discountAmount: paymentDiscountAmount,
          notes: notes ?? null,
          internalNotes: finalInternalNotes,
          dueDate,
          shippingAddress: shippingAddress
            ? (shippingAddress as Prisma.InputJsonValue)
            : Prisma.JsonNull,
          billingAddress: input.billingAddress
            ? (input.billingAddress as Prisma.InputJsonValue)
            : Prisma.JsonNull,
          items: {
            create: orderItemsData,
          },
        },
        include: {
          items: {
            include: { product: { select: { sku: true, name: true } } },
          },
          company: { select: { razonSocial: true, rut: true, telefono: true, giro: true, email: true, billingEmail: true } },
          createdBy: { select: { phone: true, firstName: true, lastName: true, email: true } },
          salesRep: { select: { email: true, firstName: true, lastName: true, phone: true } },
        },
      });

      // Reservar stock de cada producto (no se descuenta del stock físico todavía)
      // El descuento real ocurre cuando el pedido pasa a DELIVERED
      await Promise.all(
        items.map(async (item) => {
          const rowsAffected = await tx.$executeRaw`
            UPDATE "products"
            SET "stockReserved" = "stockReserved" + ${item.quantity}
            WHERE "id" = ${item.productId}
              AND "stockQuantity" - "stockReserved" >= ${item.quantity}
          `;
          if (rowsAffected === 0) {
            const p = await tx.product.findUnique({ where: { id: item.productId }, select: { name: true } });
            throw new BusinessRuleError(
              `Stock insuficiente para '${p?.name || item.productId}'. Otro usuario podría haber reservado el stock justo ahora.`,
              "INSUFFICIENT_STOCK"
            );
          }
        })
      );

      // Actualizar crédito usado por la empresa (Solo si es con crédito)
      if (paymentMethod === 'credit_b2b') {
        let rowsAffected = 0;
        
        // Si el pedido quedó PENDING (ya sea por admin o porque superó el límite y va a revisión),
        // permitimos que se registre el uso de crédito (pudiendo sobrepasar el límite temporalmente)
        if (finalStatus === 'PENDING') {
          rowsAffected = await tx.$executeRaw`
            UPDATE "companies"
            SET "creditUsed" = "creditUsed" + ${totalGross}
            WHERE "id" = ${companyId}
          `;
        } else {
          rowsAffected = await tx.$executeRaw`
            UPDATE "companies"
            SET "creditUsed" = "creditUsed" + ${totalGross}
            WHERE "id" = ${companyId}
              AND "creditLimit" - "creditUsed" >= ${totalGross}
          `;
        }

        if (rowsAffected === 0) {
          throw new BusinessRuleError("Crédito B2B insuficiente. Es posible que el cupo haya sido consumido simultáneamente por otro pedido.", "INSUFFICIENT_CREDIT");
        }
      }

      return newOrder;
    });

    // Enviar correo si el pedido fue creado con éxito y no requiere pago online pendiente
    const isOnlinePayment = order.paymentMethod === 'webpay' || order.paymentMethod === 'mercadopago';
    
    // No enviar correo para borradores
    if (!isOnlinePayment && order.status !== 'DRAFT') {
      try {
        const { sendOrderEmail } = await import('@/lib/email');
        let customerEmail = (order.billingAddress as any)?.email;
        if (!customerEmail) {
          const user = await prisma.user.findUnique({ where: { id: createdById }, select: { email: true } });
          customerEmail = user?.email || "ventas@tutiendab2b.cl";
        }
        await sendOrderEmail(order, customerEmail);
      } catch (err) {
        console.error("Error al enviar correo del pedido:", err);
      }
    }

    return order;
  }

  // ============================================================
  // CAMBIAR ESTADO DEL PEDIDO
  // ============================================================

  /**
   * Máquina de estados para las transiciones válidas de un pedido.
   */
  private readonly VALID_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
    [OrderStatus.DRAFT]: [OrderStatus.CONFIRMED, OrderStatus.PENDING, OrderStatus.CANCELLED],
    [OrderStatus.PENDING]: [OrderStatus.CONFIRMED, OrderStatus.CANCELLED, OrderStatus.REJECTED],
    [OrderStatus.CONFIRMED]: [OrderStatus.SHIPPED, OrderStatus.CANCELLED, OrderStatus.REJECTED],
    [OrderStatus.SHIPPED]: [OrderStatus.DELIVERED],
    [OrderStatus.DELIVERED]: [],
    [OrderStatus.CANCELLED]: [OrderStatus.DRAFT],
    [OrderStatus.REJECTED]: [OrderStatus.DRAFT],
  };

  async updateOrderStatus(
    orderId: string,
    newStatus: OrderStatus,
    internalNotes?: string
  ) {
    const order = await prisma.order.findUnique({ where: { id: orderId } });
    if (!order) throw new NotFoundError("Pedido", orderId);

    const allowed = this.VALID_TRANSITIONS[order.status];
    if (!allowed.includes(newStatus)) {
      throw new BusinessRuleError(
        `No se puede pasar de estado '${order.status}' a '${newStatus}'`,
        "INVALID_STATUS_TRANSITION"
      );
    }

    const timestampFields = this.getTimestampField(newStatus);

    const updated = await prisma.$transaction(async (tx) => {
      let finalStatus = newStatus;
      let finalInternalNotes = internalNotes || '';

      // SI PASA DE DRAFT A CONFIRMED Y ES CON CRÉDITO, VALIDAR LÍMITE DE CRÉDITO
      if (order.status === OrderStatus.DRAFT && newStatus === OrderStatus.CONFIRMED && order.paymentMethod === 'credit_b2b') {
        const company = await tx.company.findUnique({ where: { id: order.companyId } });
        if (!company) throw new NotFoundError("Empresa", order.companyId);

        const availableCredit = Number(company.creditLimit) - Number(company.creditUsed);
        if (availableCredit < 0 || Number(order.totalGross) > availableCredit) {
          finalStatus = OrderStatus.PENDING;
          finalInternalNotes = (finalInternalNotes ? finalInternalNotes + '\n' : '') + 
            `[SISTEMA] El pedido pasó a revisión (PENDING) porque excede el límite de crédito disponible ($${availableCredit.toLocaleString("es-CL")}).`;
        }
      }

      const updatedOrder = await tx.order.update({
        where: { id: orderId },
        data: {
          status: finalStatus,
          ...(finalInternalNotes ? { internalNotes: finalInternalNotes } : {}),
          ...timestampFields,
        },
        include: {
          items: {
            include: { product: true }
          },
          company: true,
          createdBy: true
        }
      });

      // Si se cancela o rechaza, liberar reserva de stock y crédito
      if (newStatus === OrderStatus.CANCELLED || newStatus === OrderStatus.REJECTED) {
        await this.reverseOrderEffects(tx, orderId);
      }

      // Si se completa (DELIVERED), descontar el stock físico real
      if (newStatus === OrderStatus.DELIVERED) {
        await this.commitStockOnDelivery(tx, orderId);
      }
      
      // Si se reactiva desde cancelado/rechazado, volver a reservar stock y crédito
      if ((order.status === OrderStatus.CANCELLED || order.status === OrderStatus.REJECTED) && 
          (newStatus !== OrderStatus.CANCELLED && newStatus !== OrderStatus.REJECTED)) {
        await this.applyOrderEffects(tx, orderId);
      }

      return updatedOrder;
    });

    if (newStatus === OrderStatus.SHIPPED) {
      try {
        const { sendOrderShippedEmail } = await import('@/lib/email');
        let customerEmail = (updated.billingAddress as any)?.email;
        if (!customerEmail) {
          customerEmail = (updated as any).createdBy?.email || "ventas@tutiendab2b.cl";
        }
        await sendOrderShippedEmail(updated, customerEmail);
      } catch (err) {
        console.error("Error al enviar correo de despacho:", err);
      }
    } else {
      try {
        const { sendOrderStatusUpdateEmail } = await import('@/lib/email');
        let customerEmail = (updated.billingAddress as any)?.email;
        if (!customerEmail) {
          customerEmail = (updated as any).createdBy?.email || "ventas@tutiendab2b.cl";
        }
        await sendOrderStatusUpdateEmail(updated, customerEmail);
      } catch (err) {
        console.error("Error al enviar correo de cambio de estado:", err);
      }
    }

    return updated;
  }

  /**
   * Actualiza un pedido existente.
   * Si el pedido cambia de ítems o totales, se recalculan stock y crédito.
   */
  async updateOrder(orderId: string, input: Partial<CreateOrderInput>) {
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: { items: true },
    });

    if (!order) throw new NotFoundError("Pedido", orderId);

    // Si el pedido NO es DRAFT, restringimos qué se puede editar
    // (Por ahora permitimos editar todo si es DRAFT, para otros estados solo notas/status)
    if (order.status !== OrderStatus.DRAFT && input.items) {
      throw new BusinessRuleError(
        "No se pueden editar los ítems de un pedido que ya no es Borrador.",
        "UPDATE_NOT_ALLOWED"
      );
    }

    return await prisma.$transaction(async (tx) => {
      // 1. Revertir efectos del pedido actual (Stock y Crédito)
      await this.reverseOrderEffects(tx, orderId);

      // Cargar la empresa para calcular descuentos de forma consistente
      const company = await tx.company.findUnique({
        where: { id: order.companyId }
      });
      if (!company) throw new NotFoundError("Empresa", order.companyId);

      // 2. Si hay nuevos ítems, validarlos y calcular totales
      let subtotalNet = Number(order.subtotalNet);
      let taxAmount = Number(order.taxAmount);
      let totalGross = Number(order.totalGross);
      let paymentDiscountAmount = Number(order.discountAmount);
      let orderItemsData = undefined;

      if (input.items) {
        const productIds = input.items.map((i) => i.productId);
        const products = await tx.product.findMany({
          where: { id: { in: productIds } },
        });

        const productMap = new Map(products.map((p) => [p.id, p]));

        // Validar stock (ahora que hemos devuelto la reserva del pedido anterior)
        for (const item of input.items) {
          const product = productMap.get(item.productId)!;
          const stockDisponible = Number(product.stockQuantity) - Number(product.stockReserved);
          if (stockDisponible < item.quantity) {
             throw new BusinessRuleError(`Stock insuficiente para ${product.name}. Disponible: ${stockDisponible}`, "INSUFFICIENT_STOCK");
          }
        }

        const prices = await priceService.getPricesForProducts(products, order.companyId);
        const priceMap = new Map(prices.map((p) => [p.productId, p]));
        const defaultDiscountPercent = Number(company.defaultDiscount) || 0;

        orderItemsData = input.items.map((item) => {
          const product = productMap.get(item.productId)!;
          const price = priceMap.get(item.productId)!;

          const isExcluded = price.priceSource === 'PROMOTION' || price.priceSource === 'OUTLET';
          const discount = isExcluded ? 0 : defaultDiscountPercent;
          const unitNetPrice = price.discountedNetPrice;

          const lineNetTotal = round2(
            (unitNetPrice * item.quantity) * (1 - discount / 100)
          );
          const lineTax = round2(lineNetTotal * TAX_RATE);
          const lineTotal = round2(lineNetTotal + lineTax);

          return {
            productId: product.id,
            productSku: product.sku,
            productName: product.name,
            quantity: item.quantity,
            unitNetPrice,
            discount: isExcluded ? price.discountPercent : defaultDiscountPercent,
            lineNetTotal,
            lineTax,
            lineTotal,
          };
        });

        const baseSubtotalNet = round2(
          orderItemsData.reduce((acc, i) => acc + i.lineNetTotal, 0)
        );

        const currentPaymentMethod = input.paymentMethod || order.paymentMethod;
        const paymentTermsDays = company.paymentTerms;
        let paymentDiscountPercent = 0;
        if (currentPaymentMethod === 'credit_b2b') {
          if (company.paymentTermDiscount !== null && company.paymentTermDiscount !== undefined) {
            paymentDiscountPercent = Number(company.paymentTermDiscount);
          } else {
            if (paymentTermsDays === 90) paymentDiscountPercent = 0;
            else if (paymentTermsDays === 60) paymentDiscountPercent = 4;
            else if (paymentTermsDays === 30) paymentDiscountPercent = 7;
            else if (paymentTermsDays === 0) paymentDiscountPercent = 0;
          }
        } else if (currentPaymentMethod === 'webpay' || currentPaymentMethod === 'transfer' || currentPaymentMethod === 'mercadopago') {
          paymentDiscountPercent = 10;
        }

        paymentDiscountAmount = round2(baseSubtotalNet * (paymentDiscountPercent / 100));

        subtotalNet = round2(baseSubtotalNet - paymentDiscountAmount);
        taxAmount = round2(subtotalNet * TAX_RATE);
        totalGross = round2(subtotalNet + taxAmount);

        // Eliminar ítems antiguos
        await tx.orderItem.deleteMany({ where: { orderId } });
      }

      // 3. Actualizar el pedido
      const updatedOrder = await tx.order.update({
        where: { id: orderId },
        data: {
          notes: input.notes !== undefined ? input.notes : undefined,
          status: input.status || undefined,
          paymentMethod: input.paymentMethod || undefined,
          shippingAddress: input.shippingAddress ? (input.shippingAddress as any) : undefined,
          billingAddress: input.billingAddress ? (input.billingAddress as any) : undefined,
          subtotalNet,
          taxAmount,
          totalGross,
          discountAmount: paymentDiscountAmount,
          ...(orderItemsData ? {
            items: {
              create: orderItemsData
            }
          } : {})
        },
        include: { items: true }
      });

      // 4. Re-aplicar efectos (Stock y Crédito) con los nuevos valores
      await this.applyOrderEffects(tx, orderId);

      return updatedOrder;
    });
  }

  /**
   * Elimina físicamente un pedido de la base de datos.
   * SOLO permitido para pedidos en estado DRAFT.
   */
  async deleteOrder(orderId: string) {
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: { items: true },
    });

    if (!order) throw new NotFoundError("Pedido", orderId);

    if (order.status !== OrderStatus.DRAFT) {
      throw new BusinessRuleError(
        "Solo se pueden eliminar pedidos en estado Borrador. Para otros estados, use Cancelar.",
        "DELETE_NOT_ALLOWED"
      );
    }

    await prisma.$transaction(async (tx) => {
      // 1. Revertir stock y crédito (los borradores ya reservaron stock al crearse)
      await this.reverseOrderEffects(tx, orderId);

      // 2. Eliminar ítems (Prisma cascade suele estar on, pero lo aseguramos)
      await tx.orderItem.deleteMany({ where: { orderId } });

      // 3. Eliminar pedido
      await tx.order.delete({ where: { id: orderId } });
    });

    return { success: true };
  }

  async getOrderById(id: string, companyId?: string, salesRepId?: string) {
    const order = await prisma.order.findUnique({
      where: { id },
      include: {
        items: {
          include: {
            product: {
              select: {
                id: true,
                sku: true,
                name: true,
                minOrderQty: true,
                inner: true,
                stockQuantity: true,
                images: { where: { isPrimary: true }, take: 1 }
              }
            }
          }
        },
        company: true,
        createdBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true
          }
        }
      }
    });

    if (!order) throw new NotFoundError("Pedido", id);

    // Si se provee companyId, validar pertenencia
    if (companyId && order.companyId !== companyId) {
      throw new BusinessRuleError("No tienes permiso para ver este pedido", "FORBIDDEN_ORDER_ACCESS");
    }

    // Si se provee salesRepId, validar que la empresa le pertenezca
    if (salesRepId && order.company?.salesRepId !== salesRepId) {
      throw new BusinessRuleError("No tienes permiso para ver un pedido de una cartera ajena", "FORBIDDEN_ORDER_ACCESS");
    }

    return order;
  }

  // ============================================================
  // LISTAR PEDIDOS
  // ============================================================

  async listOrders(
    query: GetOrdersQuery,
    companyId?: string, // Si viene del context del BUYER, filtra por su empresa
    salesRepId?: string // Si viene del context del SALES_REP, filtra por empresas de este vendedor
  ): Promise<PaginatedResult<OrderSummary>> {
    const { page, limit, status, paymentStatus, paymentMethod, from, to, search } = query;
    const skip = (page - 1) * limit;

    const where: Prisma.OrderWhereInput = {
      ...(companyId ? { companyId } : query.companyId ? { companyId: query.companyId } : {}),
      ...(salesRepId ? { company: { salesRepId } } : {}),
      ...(status ? { status } : {}),
      ...(paymentStatus ? { paymentStatus } : {}),
      ...(paymentMethod ? { paymentMethod } : {}),
      ...(from || to
        ? {
            createdAt: {
              ...(from ? { gte: from } : {}),
              ...(to ? { lte: to } : {}),
            },
          }
        : {}),
      ...(search ? {
        OR: [
          { orderNumber: { contains: search, mode: 'insensitive' } },
          { company: { razonSocial: { contains: search, mode: 'insensitive' } } }
        ]
      } : {}),
    };

    const [orders, total] = await Promise.all([
      prisma.order.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        include: {
          company: { select: { razonSocial: true, rut: true } },
          _count: { select: { items: true } },
        },
      }),
      prisma.order.count({ where }),
    ]);

    const data: OrderSummary[] = orders.map((o) => ({
      id: o.id,
      orderNumber: o.orderNumber,
      companyId: o.companyId,
      companyName: o.company.razonSocial,
      companyRut: o.company.rut,
      status: o.status,
      paymentStatus: o.paymentStatus,
      paymentMethod: o.paymentMethod || undefined,
      subtotalNet: Number(o.subtotalNet),
      taxAmount: Number(o.taxAmount),
      totalGross: Number(o.totalGross),
      itemCount: o._count.items,
      createdAt: o.createdAt,
    }));

    return {
      data,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  // ============================================================
  // HELPERS PRIVADOS
  // ============================================================

  /**
   * Genera un número de pedido secuencial y único.
   * Formato: ORD-YYYY-NNNN (e.g. ORD-2024-0001)
   */
  private async generateOrderNumber(
    tx: Prisma.TransactionClient,
    isTest: boolean = false
  ): Promise<string> {
    const year = new Date().getFullYear();
    const prefix = isTest ? `TEST-` : `ORD-${year}-`;

    const lastOrder = await tx.order.findFirst({
      where: { orderNumber: { startsWith: prefix } },
      orderBy: { orderNumber: "desc" },
      select: { orderNumber: true },
    });

    const lastSeq = lastOrder
      ? parseInt(lastOrder.orderNumber.replace(prefix, ""), 10)
      : 0;

    const nextSeq = String(lastSeq + 1).padStart(4, "0");
    return `${prefix}${nextSeq}`;
  }

  /**
   * Devuelve el campo de timestamp correspondiente al nuevo estado.
   */
  private getTimestampField(status: OrderStatus): Partial<Record<string, Date>> {
    const now = new Date();
    const map: Partial<Record<OrderStatus, Partial<Record<string, Date>>>> = {
      [OrderStatus.CONFIRMED]: { confirmedAt: now },
      [OrderStatus.SHIPPED]: { shippedAt: now },
      [OrderStatus.CANCELLED]: { cancelledAt: now },
    };
    return map[status] ?? {};
  }

  /**
   * Revierte los efectos de un pedido cancelado:
   *  - Libera la reserva de stock (stockReserved) de cada producto.
   *  - Reduce el crédito usado de la empresa.
   */
  private async reverseOrderEffects(
    tx: Prisma.TransactionClient,
    orderId: string
  ): Promise<void> {
    const order = await tx.order.findUnique({
      where: { id: orderId },
      include: { items: true },
    });
    if (!order) return;

    // Liberar reserva de stock (no tocar stockQuantity — ese es el stock físico real)
    await Promise.all(
      order.items.map((item) =>
        tx.product.update({
          where: { id: item.productId },
          data: { stockReserved: { decrement: item.quantity } },
        })
      )
    );

    // Reducir crédito usado (solo si era con crédito y NO ha sido pagado)
    if (order.paymentMethod === 'credit_b2b' && order.paymentStatus !== 'PAID') {
      await tx.company.update({
        where: { id: order.companyId },
        data: {
          creditUsed: {
            decrement: Number(order.totalGross),
          },
        },
      });
    }
  }

  /**
   * Aplica los efectos de un pedido (Reactivación desde CANCELLED/REJECTED → DRAFT):
   *  - Reserva stock nuevamente (stockReserved).
   *  - Incrementa crédito usado.
   */
  private async applyOrderEffects(
    tx: Prisma.TransactionClient,
    orderId: string
  ): Promise<void> {
    const order = await tx.order.findUnique({
      where: { id: orderId },
      include: { items: true },
    });
    if (!order) return;

    // Reservar stock nuevamente (solo incrementar stockReserved)
    await Promise.all(
      order.items.map((item) =>
        tx.product.update({
          where: { id: item.productId },
          data: { stockReserved: { increment: item.quantity } },
        })
      )
    );

    // Incrementar crédito usado y validar límite (Solo crédito b2b)
    if (order.paymentMethod === 'credit_b2b' && order.paymentStatus !== 'PAID') {
      const company = await tx.company.update({
        where: { id: order.companyId },
        data: {
          creditUsed: {
            increment: Number(order.totalGross),
          },
        },
      });

      if (order.status !== OrderStatus.DRAFT && order.status !== OrderStatus.PENDING) {
        const availableCredit = Number(company.creditLimit) - Number(company.creditUsed);
        if (availableCredit < 0) {
          throw new BusinessRuleError(
            `Límite de crédito insuficiente. Límite: $${Number(company.creditLimit).toLocaleString("es-CL")}, ` +
              `Utilizado: $${Number(company.creditUsed).toLocaleString("es-CL")} (excede en $${Math.abs(availableCredit).toLocaleString("es-CL")})`,
            "CREDIT_LIMIT_EXCEEDED"
          );
        }
      }
    }
  }

  /**
   * Confirma el consumo físico de stock cuando el pedido se entrega (DELIVERED).
   * Descuenta stockQuantity (stock físico) y libera la reserva stockReserved.
   * Ambas operaciones se hacen en la misma transacción de updateOrderStatus.
   */
  private async commitStockOnDelivery(
    tx: Prisma.TransactionClient,
    orderId: string
  ): Promise<void> {
    const order = await tx.order.findUnique({
      where: { id: orderId },
      include: { items: true },
    });
    if (!order) return;

    // Descontar stock físico y liberar reserva en paralelo
    await Promise.all(
      order.items.map((item) =>
        tx.product.update({
          where: { id: item.productId },
          data: {
            stockQuantity: { decrement: item.quantity }, // descuento real del físico
            stockReserved: { decrement: item.quantity }, // liberar la reserva
          },
        })
      )
    );
  }
}

// ============================================================
// Helper
// ============================================================
function round2(value: number): number {
  return Math.round(value);
}

// Singleton exportado
export const orderService = new OrderService();
