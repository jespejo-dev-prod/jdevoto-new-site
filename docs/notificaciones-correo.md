# Implementación de Notificaciones de Pedido por Correo

Este documento detalla el sistema automatizado integrado en el proyecto para enviar un comprobante tipo factura/recibo (estilo WooCommerce) de manera inmediata tras cada pedido B2B.

## ¿Qué se implementó?

- **Motor de envíos:** Instalación de `nodemailer`, la librería estándar y más robusta de Node.js para SMTP.
- **Entorno de Pruebas (Ethereal Email):** El proyecto está configurado para que en modo de desarrollo (`NODE_ENV !== 'production'`) genere cuentas falsas descartables en tiempo real. Esto evita tener que colocar contraseñas reales durante el desarrollo.
- **Plantilla HTML Automática:** Un generador de recibos dinámicos en `src/lib/email.ts` que captura los productos comprados, descuentos, impuestos y totales, creando una tabla profesional en HTML.
- **Desacoplamiento:** El envío del correo electrónico ocurre de forma *asíncrona*. Esto significa que cuando el usuario hace clic en "Finalizar Pedido", la aplicación no se queda esperando a que el servidor de correos termine de enviar el mensaje, mejorando la velocidad de la interfaz.

## ¿Cómo probarlo localmente?

La experiencia de pruebas locales utiliza Ethereal Email para simular envíos sin afectar correos reales.

1. Asegúrate de tener corriendo tu aplicación (`npm run dev`).
2. Entra a la tienda B2B como de costumbre.
3. Agrega productos al carrito y finaliza el pedido usando cualquier método de pago (transferencia o crédito).
4. Cuando veas la pantalla de "Pedido Confirmado" en la web, **ve a tu consola o terminal (donde se está ejecutando Next.js)**.
5. Verás algo como esto impreso en la terminal:
   ```bash
   ==========================================
   📧 Ethereal Email Testing Account Created
   ==========================================
   User: test_user@ethereal.email
   Pass: ********
   ==========================================
   📧 Correo enviado exitosamente a cliente@test.cl
   👀 Preview URL: https://ethereal.email/message/WmZ5...
   ==========================================
   ```
6. **Haz clic en el enlace de `Preview URL`**.
7. Se abrirá una web en Ethereal mostrando exactamente el correo como lo verá el cliente, incluyendo el diseño HTML y la versión de texto plano.

## Transición a Producción

Cuando el proyecto se suba al servidor final (VPS u otro hosting), la aplicación detectará que está en producción y cambiará su comportamiento automáticamente para usar tu servidor de correo corporativo.

Solo debes asegurarte de definir estas variables de entorno en tu archivo `.env` del servidor de producción:

```env
SMTP_HOST=mail.tu-dominio.cl
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=ventas@tu-dominio.cl
SMTP_PASS=tu_password_real
```

Al detectar `SMTP_HOST`, el sistema abandonará Ethereal y empezará a enviar los correos reales automáticamente.
