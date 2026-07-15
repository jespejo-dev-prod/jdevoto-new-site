# JDevoto B2B E-Commerce

Plataforma de comercio electrónico B2B para JDevoto, desarrollada con **Next.js 14**, **Prisma**, **PostgreSQL** y **Tailwind CSS**. 

Este sistema está diseñado para manejar clientes mayoristas, gestión de inventario, carritos de compra, vendedores asignados, y administración de cuentas.

---

## 🚀 Tecnologías Principales

- **Frontend / Backend:** [Next.js](https://nextjs.org/) (App Router).
- **Base de Datos:** [PostgreSQL](https://www.postgresql.org/) alojada (o local).
- **ORM:** [Prisma](https://www.prisma.io/).
- **Estilos:** [Tailwind CSS](https://tailwindcss.com/).
- **Pagos:** Integración con Mercado Pago.
- **Emails:** Envío de correos transaccionales a través de Resend / Nodemailer.

---

## 🛠️ Requisitos Previos

Para ejecutar este proyecto en tu entorno local, necesitas tener instalado:
- **Node.js** (v18 o superior).
- **PostgreSQL** (si deseas correr la base de datos localmente).
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
   - Crea un archivo `.env` o renombra el de ejemplo y ajusta los valores (ej: `DATABASE_URL`, `JWT_SECRET`, credenciales de Mercado Pago, SMTP, etc.).

3. **Preparar la base de datos (Prisma):**
   Genera el cliente de Prisma para conectar con tu base de datos configurada:
   ```bash
   npx prisma generate
   ```

4. **Levantar el servidor de desarrollo:**
   ```bash
   npm run dev
   ```
   El sitio estará disponible en `http://localhost:3000`.

---

## 📁 Estructura del Proyecto

La organización del proyecto se basa en el estándar de Next.js (App Router):

- `/src/app/` - Rutas, páginas y API endpoints del sitio (Frontend y Backend).
- `/src/components/` - Componentes de React reutilizables de la interfaz.
- `/src/lib/` - Funciones de utilidad y configuraciones base.
- `/src/scripts/` - Scripts de soporte y tareas administrativas.
- `/prisma/` - El esquema de la base de datos (`schema.prisma`) y migraciones.
- `/public/` - Archivos estáticos como imágenes o logos.

---

## 👤 Administración en Producción

Los únicos usuarios con nivel de **Administrador (ADMIN)** configurados para el entorno de producción son:

- `jespejo@jdevoto.cl`
- `jmdevoto@jdevoto.cl`

> **Nota:** Todos los demás perfiles de administradores antiguos o de prueba fueron degradados al rol de Comprador (BUYER) por temas de seguridad.

---

## 📜 Comandos Útiles

- `npm run dev` : Inicia el servidor en modo desarrollo.
- `npm run build` : Construye la aplicación optimizada para producción.
- `npm run start` : Inicia la aplicación usando el build de producción.
- `npx prisma db push` : Sincroniza el esquema de Prisma con la base de datos (desarrollo).
