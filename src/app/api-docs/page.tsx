'use client';

import dynamic from 'next/dynamic';
import 'swagger-ui-react/swagger-ui.css';
import { useEffect, useState } from 'react';

// Swagger UI no soporta Server Side Rendering
const SwaggerUI = dynamic(() => import('swagger-ui-react'), { ssr: false });

export default function ApiDocsPage() {
  const [apiKey, setApiKey] = useState<string>('');

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const key = params.get('key');
      if (key) {
        setApiKey(key);
      }
    }
  }, []);

  const apiUrl = apiKey ? `/api/docs?key=${apiKey}` : '/api/docs';

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <div className="p-4 border-b bg-gray-50 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div>
          <h1 className="text-xl font-bold text-gray-800">API Documentation</h1>
          <p className="text-xs text-gray-500 mt-0.5">Motor de ventas B2B OpenAPI Spec</p>
        </div>
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <input
            type="password"
            placeholder="Clave de acceso..."
            className="px-3 py-1.5 border border-gray-300 rounded text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent w-full sm:w-48 bg-white shadow-sm"
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
          />
          <span className="text-xs text-gray-400 whitespace-nowrap">(Requerido en producción)</span>
        </div>
      </div>
      <div className="flex-1 bg-white">
        <SwaggerUI url={apiUrl} />
      </div>
    </div>
  );
}

