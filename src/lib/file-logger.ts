import fs from 'fs';
import path from 'path';

const LOG_DIR = path.join(process.cwd(), 'logs');

// Asegurar que el directorio de logs exista al arrancar
if (!fs.existsSync(LOG_DIR)) {
  fs.mkdirSync(LOG_DIR, { recursive: true });
}

export const fileLogger = {
  /**
   * Escribe un registro en logs/security.log
   */
  audit: (action: string, userId?: string, ip?: string, details?: any) => {
    try {
      const timestamp = new Date().toISOString();
      
      // Extraer email si viene en los detalles, sino usar el ID
      let userDisplay = userId || 'Anónimo';
      if (details?.email) {
        userDisplay = `${details.email} (${details.name || 'Sin Nombre'})`;
      } else if (action === "LOGIN_FAILED" && details?.email) {
        userDisplay = details.email;
      }

      // Determinar el archivo de destino según la acción
      let filename = 'system.log';
      if (action.startsWith('ORDER_')) {
        filename = 'orders.log';
      } else if (action.startsWith('LOGIN_') || action.startsWith('USER_') || action.startsWith('PASSWORD_')) {
        filename = 'users.log';
      } else if (action.startsWith('PRODUCT_')) {
        filename = 'catalog.log';
      }

      const logLine = `[${timestamp}] [AUDIT] IP:${ip || 'N/A'} USER:${userDisplay} ACTION:${action} DETAILS:${details ? JSON.stringify(details) : 'None'}\n`;
      fs.appendFileSync(path.join(LOG_DIR, filename), logLine);
    } catch (e) {
      console.error(`Failed to write to audit log`, e);
    }
  },

  /**
   * Escribe un error en logs/error.log
   */
  error: (errorName: string, message: string, ip?: string, pathReq?: string, stack?: string) => {
    try {
      const timestamp = new Date().toISOString();
      const logLine = `[${timestamp}] [ERROR] IP:${ip || 'N/A'} PATH:${pathReq || 'N/A'} ${errorName}: ${message}\nSTACK: ${stack || 'N/A'}\n\n`;
      fs.appendFileSync(path.join(LOG_DIR, 'error.log'), logLine);
    } catch (e) {
      console.error("Failed to write to error.log", e);
    }
  }
};
