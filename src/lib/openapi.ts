import { OpenAPIRegistry, OpenApiGeneratorV3 } from '@asteasolutions/zod-to-openapi';
import { extendZodWithOpenApi } from '@asteasolutions/zod-to-openapi';
import { z } from 'zod';
import { CreateProductSchema } from '@/validations/product.schemas';
import { RegisterCompanySchema } from '@/validations/company.schemas';
import { LoginSchema } from '@/validations/auth.schemas';

extendZodWithOpenApi(z);

export const registry = new OpenAPIRegistry();

// Security Scheme
const bearerAuth = registry.registerComponent('securitySchemes', 'bearerAuth', {
  type: 'http',
  scheme: 'bearer',
  bearerFormat: 'JWT',
});

// Registrar Componentes (Schemas)
registry.register('Login', LoginSchema);
registry.register('RegisterCompany', RegisterCompanySchema);
registry.register('CreateProduct', CreateProductSchema);

// Registrar Endpoints
registry.registerPath({
  method: 'post',
  path: '/api/auth/login',
  summary: 'Iniciar Sesión',
  description: 'Autentica un usuario y devuelve un access_token',
  request: {
    body: {
      content: {
        'application/json': {
          schema: LoginSchema,
        },
      },
    },
  },
  responses: {
    200: {
      description: 'Login Exitoso',
    },
    401: {
      description: 'Credenciales inválidas',
    },
  },
});

registry.registerPath({
  method: 'post',
  path: '/api/products',
  summary: 'Crear Producto',
  description: 'Crea un producto en el catálogo (Requiere rol ADMIN)',
  security: [{ [bearerAuth.name]: [] }],
  request: {
    body: {
      content: {
        'application/json': {
          schema: CreateProductSchema,
        },
      },
    },
  },
  responses: {
    201: {
      description: 'Producto creado exitosamente',
    },
    400: {
      description: 'Error de validación (Zod)',
    },
    403: {
      description: 'Permisos insuficientes (No es ADMIN)',
    },
  },
});

// Función para generar el documento
export function generateOpenApi() {
  const generator = new OpenApiGeneratorV3(registry.definitions);

  return generator.generateDocument({
    openapi: '3.0.0',
    info: {
      version: '2.0.0',
      title: 'B2B eCommerce API',
      description: 'API Principal para el motor de ventas B2B',
    },
    servers: [{ url: 'http://localhost:3000' }],
  });
}
