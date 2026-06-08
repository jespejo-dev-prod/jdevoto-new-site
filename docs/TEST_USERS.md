# Usuarios de Prueba del Sistema

Este archivo contiene las credenciales de los usuarios de prueba generados automáticamente para facilitar el desarrollo y validación del sistema.

## Usuario Administrador (ADMIN)

- **Email:** `admin@test.cl`
- **Password:** `Password123!`
- **Rol:** ADMIN
- **Descripción:** Tiene acceso total al panel de administración (Dashboard) para gestionar productos, marcas, categorías, clientes, analíticas, etc.

## Administrador de Empresa Cliente (COMPANY_ADMIN)

- **Email:** `companyadmin@test.cl`
- **Password:** `Password123!1`
- **Rol:** COMPANY_ADMIN
- **Descripción:** Representa al administrador de una empresa que compra en la plataforma (ej. "Compradores B2B SpA"). Puede ver y editar los datos de su empresa, ver todas las órdenes de su empresa y administrar a sus empleados (crear nuevos usuarios BUYER para su empresa). No tiene acceso al catálogo global ni a ver clientes ajenos.

## Usuario Comprador (BUYER)

- **Email:** `buyer@test.cl`
- **Password:** `Password123!`
- **Rol:** BUYER
- **Descripción:** Simula a un empleado normal de una empresa cliente. Puede agregar productos al carrito, finalizar compras y revisar su propio historial de pedidos, pero no tiene acceso para gestionar a otros usuarios ni editar la empresa.

---

### Notas para desarrolladores:

- **Prisma Studio:** Recuerda que NO debes crear usuarios directamente desde Prisma Studio colocando la contraseña en texto plano, ya que el sistema de login utiliza encriptación `bcrypt`. Las contraseñas creadas directamente en la base de datos sin encriptar serán rechazadas.
- **Script de Creación:** Si en el futuro necesitas recrear a estos u otros usuarios por código (para asegurar la correcta encriptación de la contraseña), puedes ejecutar el script preparado utilizando el comando:
  ```bash
  npx tsx scripts/create-test-users.ts
  ```
