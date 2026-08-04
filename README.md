# JDevoto B2B E-Commerce

Plataforma integral de comercio electrónico B2B para JDevoto, desarrollada con **Next.js**, **Prisma**, **PostgreSQL** y **Tailwind CSS**. 

Este sistema está diseñado específicamente para operaciones mayoristas, proporcionando herramientas avanzadas para la gestión de empresas (clientes corporativos), condiciones comerciales personalizadas (créditos y descuentos), carritos de compra especializados, fuerza de ventas y un panel de administración jerárquico.

---

## 🚀 Tecnologías Principales

- **Frontend / Backend:** [Next.js](https://nextjs.org/) (App Router + Turbopack).
- **Base de Datos:** [PostgreSQL](https://www.postgresql.org/) alojada en Neon.
- **ORM:** [Prisma](https://www.prisma.io/) (con migraciones).
- **Estilos:** [Tailwind CSS](https://tailwindcss.com/) + Shadcn UI / Lucide Icons.
- **Validaciones:** [Zod](https://zod.dev/).
- **Testing:** [Vitest](https://vitest.dev/) para pruebas unitarias y de integración.
- **Pagos:** Integración nativa con Mercado Pago.
- **Emails:** Envío de correos transaccionales a través de Resend / Nodemailer.
- **Hosting:** Vercel (con scripts automatizados y cron jobs).

---

## 👥 Roles y Permisos (Sistema Jerárquico)

La plataforma cuenta con un sistema de roles estructurado para controlar los accesos y capacidades operativas:

- **SUPER_ADMIN**: Control absoluto e irrevocable. Puede gestionar a otros administradores y configurar toda la plataforma. (Protegido por sistema).
- **ADMIN**: Administrador de sistema. Puede gestionar productos, categorías, pedidos de toda la plataforma, correos masivos y usuarios de menor rango.
- **COMPANY_ADMIN**: Administrador del lado del cliente. Gestiona los usuarios compradores dentro de su propia empresa y visualiza la cuenta corriente corporativa.
- **SALES_REP**: Vendedor interno. Puede ver y gestionar los pedidos y cotizaciones de las empresas que tiene asignadas en su cartera.
- **BUYER**: Comprador estándar de una empresa. Realiza pedidos sujetos a las reglas de crédito y descuento de su compañía matriz.

---

## 🛠️ Requisitos Previos

Para ejecutar este proyecto en tu entorno local, necesitas tener instalado:
- **Node.js** (v18 o superior).
- **PostgreSQL** (si deseas correr la base de datos localmente, aunque puedes apuntar a Neon).
- **Git**.

---

## ⚙️ Instalación y Uso Local

Sigue estos pasos para arrancar el entorno de desarrollo:

1. **Instalar dependencias:**
   En la raíz del proyecto, ejecuta:
   ```bash
   npm install
   ```

2. **Configurar las variables de entorno:**
   - Existe un archivo `.env.example` en la raíz.
   - Crea un archivo `.env` o renombra el de ejemplo y ajusta los valores:
     - `DATABASE_URL` (Obligatorio).
     - `JWT_SECRET` (Obligatorio para la autenticación).
     - Credenciales de Mercado Pago, SMTP, etc.

3. **Preparar la base de datos (Prisma):**
   Aplica los cambios estructurales a tu base local y genera el cliente Prisma:
   ```bash
   npx prisma db push
   npx prisma generate
   ```

4. **Levantar el servidor de desarrollo:**
   ```bash
   npm run dev
   ```
   El sitio estará disponible en `http://localhost:3000`.

---

## 🧪 Testing

El proyecto utiliza **Vitest** para garantizar la fiabilidad del backend y las reglas de negocio.

- Para ejecutar los tests unitarios:
  ```bash
  npm run test
  ```
- Los tests cubren lógica de autenticación (JWT, Login), servicios de negocio (transiciones de estado de pedidos), y APIs restringidas por roles.

---

## 🚀 Despliegue en Producción (Vercel)

El proyecto está configurado para un despliegue sin fricciones en Vercel. 

**Proceso de Build:**
Durante el proceso de despliegue, el script de construcción (`package.json > scripts > build`) ejecutará de manera segura:
```bash
npx prisma migrate deploy && next build
```
Esto garantiza que cualquier cambio estructural (migraciones en `prisma/migrations`) se aplique a la base de datos de Neon antes de compilar la aplicación, asegurando la integridad entre el código y la base de datos.

---

## 📁 Estructura Arquitectónica (Domain-Driven Design simplificado)

La organización del proyecto separa responsabilidades de manera modular:

- `/src/app/` - Enrutamiento de Next.js (App Router), páginas del Dashboard, Storefront y API Endpoints.
- `/src/modules/` - Lógica de dominio encapsulada (ej. `auth`, `orders`, `users`, `analytics`, `customers`, `pricing`). Cada módulo puede contener subcarpetas como `application`, `domain` y `presentation`.
- `/src/components/` - Componentes React reutilizables puros (layouts de UI, inputs, modales).
- `/src/context/` - Gestión de estados globales de React (AuthContext, CartContext).
- `/src/lib/` - Configuración de bibliotecas de terceros y utilidades core (Prisma, validadores JWT, envío de emails).
- `/src/validations/` - Esquemas estrictos de Zod para validar la integridad de las APIs.
- `/test/` - Archivos de testing e integración para Vitest.
- `/prisma/` - Modelo relacional y migraciones de la base de datos.
- `/public/` - Activos estáticos, imágenes, fuentes.

---

## 👤 Administración Principal

El usuario principal del sistema configurado como `SUPER_ADMIN` es:
- `jespejo@jdevoto.cl`

> **Nota de Seguridad:** El rol SUPER_ADMIN no puede ser eliminado, desactivado, ni sus permisos pueden ser rebajados por ningún otro miembro del sistema.

---

## 📜 Comandos Útiles

- `npm run dev` : Inicia el servidor en modo desarrollo.
- `npm run build` : Construye la aplicación ejecutando migraciones y optimizaciones.
- `npm run test` : Ejecuta la suite de pruebas unitarias de Vitest.
- `npx prisma db push` : Aplica el esquema a la DB local para testeo rápido.
- `npx prisma migrate dev` : Crea una nueva migración oficial SQL a partir de cambios en `schema.prisma`.
- `npx prisma migrate deploy` : Aplica migraciones pendientes a la base de datos de producción (uso en CI/CD).
