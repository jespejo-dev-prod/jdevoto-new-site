'use client';

import { useAuth } from '@/context/auth-context';
import { Download } from 'lucide-react';

export function ExportButton() {
  const { accessToken } = useAuth();

  return (
    <button 
      onClick={async () => {
        try {
          const res = await fetch(`/api/analytics/export?format=csv`, {
            headers: { Authorization: `Bearer ${accessToken}` }
          });
          if (!res.ok) throw new Error('Error al descargar');
          const blob = await res.blob();
          const url = window.URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `analytics-raw-${new Date().toISOString().split('T')[0]}.csv`;
          document.body.appendChild(a);
          a.click();
          window.URL.revokeObjectURL(url);
          document.body.removeChild(a);
        } catch (err) {
          console.error(err);
          alert('Hubo un error al descargar el archivo CSV.');
        }
      }}
      className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground text-sm font-bold rounded-lg hover:bg-primary/90 transition-colors"
    >
      <Download className="h-4 w-4" />
      Exportar Todo (CSV)
    </button>
  );
}
