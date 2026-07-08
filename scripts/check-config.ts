import { prisma } from "../src/lib/client";

async function main() {
  console.log("--- DEBUG DE CONFIGURACION MERCADOPAGO ---");
  const config = await prisma.storeSettings.findUnique({
    where: { key: "mercadopago_config" }
  });

  if (!config) {
    console.log("No se encontró 'mercadopago_config' en la base de datos.");
    return;
  }

  const value = config.value as any;
  console.log("Enabled:", value.enabled);
  console.log("PublicKey:", value.publicKey);
  console.log("AccessToken Length:", value.accessToken ? value.accessToken.length : 0);
  if (value.accessToken) {
    console.log("AccessToken Prefix:", value.accessToken.substring(0, 15));
    console.log("AccessToken Suffix:", value.accessToken.substring(value.accessToken.length - 8));
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
