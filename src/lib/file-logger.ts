import fs from 'fs';
import path from 'path';

const LOG_DIR = path.join(process.cwd(), 'logs');
const isServerless = process.env.VERCEL === '1' || !!process.env.VERCEL;

// Asegurar que el directorio de logs exista al arrancar (solo fuera de Vercel)
if (!isServerless && !fs.existsSync(LOG_DIR)) {
  try {
    fs.mkdirSync(LOG_DIR, { recursive: true });
  } catch (e) {
    console.error("Failed to create log directory", e);
  }
}

export const fileLogger = {
  /**
   * Escribe un registro en logs/security.log o en consola si es serverless
   */
  audit: (action: string, userId?: string, ip?: string, details?: any) => {
    const timestamp = new Date().toISOString();
    
    // Extraer email si viene en los detalles, sino usar el ID
    let userDisplay = userId || 'Anónimo';
    if (details?.email) {
      userDisplay = `${details.email} (${details.name || 'Sin Nombre'})`;
    } else if (action === "LOGIN_FAILED" && details?.email) {
      userDisplay = details.email;
    }

    const logLine = `[${timestamp}] [AUDIT] IP:${ip || 'N/A'} USER:${userDisplay} ACTION:${action} DETAILS:${details ? JSON.stringify(details) : 'None'}`;

    if (isServerless) {
      console.log(logLine);
      return;
    }

    try {
      // Determinar el archivo de destino según la acción
      let filename = 'system.log';
      if (action.startsWith('ORDER_')) {
        filename = 'orders.log';
      } else if (action.startsWith('LOGIN_') || action.startsWith('USER_') || action.startsWith('PASSWORD_')) {
        filename = 'users.log';
      } else if (action.startsWith('PRODUCT_')) {
        filename = 'catalog.log';
      }

      fs.appendFileSync(path.join(LOG_DIR, filename), logLine + '\n');
    } catch (e) {
      console.error(`Failed to write to audit log`, e);
    }
  },

  /**
   * Escribe un error en logs/error.log o en consola si es serverless
   */
  error: (errorName: string, message: string, ip?: string, pathReq?: string, stack?: string) => {
    const timestamp = new Date().toISOString();
    const logLine = `[${timestamp}] [ERROR] IP:${ip || 'N/A'} PATH:${pathReq || 'N/A'} ${errorName}: ${message}\nSTACK: ${stack || 'N/A'}`;

    if (isServerless) {
      console.error(logLine);
      return;
    }

    try {
      fs.appendFileSync(path.join(LOG_DIR, 'error.log'), logLine + '\n\n');
    } catch (e) {
      console.error("Failed to write to error.log", e);
    }
  }
};
