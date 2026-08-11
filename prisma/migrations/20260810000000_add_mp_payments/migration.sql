-- CreateTable
CREATE TABLE "mercadopago_payments" (
    "id" TEXT NOT NULL,
    "paymentId" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "processedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "mercadopago_payments_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "mercadopago_payments_paymentId_key" ON "mercadopago_payments"("paymentId");

-- CreateIndex
CREATE INDEX "mercadopago_payments_orderId_idx" ON "mercadopago_payments"("orderId");
