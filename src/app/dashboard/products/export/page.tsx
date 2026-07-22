'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { RoleGuard } from '@/components/auth/role-guard';
import { UserRole } from '@prisma/client';
import { useApi } from '@/shared/infrastructure/api/use-api';
import { 
  ArrowLeft, 
  Download, 
  Database, 
  Loader2 
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { toast } from 'sonner';

export default function ExportStockPage() {
  const api = useApi();
  const router = useRouter();

  // ─── Configuraciones de Exportación ───────────────────────────────────────
  const AVAILABLE_COLUMNS = [
    { id: 'SKU', label: 'SKU / Código' },
    { id: 'Nombre', label: 'Nombre' },
    { id: 'Descripción', label: 'Descripción' },
    { id: 'Precio Base', label: 'Precio Base' },
    { id: 'Stock', label: 'Stock' },
    { id: 'Unidad', label: 'Unidad' },
    { id: 'Inner', label: 'Inner' },
    { id: 'Categoría', label: 'Categoría' },
    { id: 'Marca', label: 'Marca' },
    { id: 'Estado', label: 'Estado' }
  ];
  
  const [selectedColumns, setSelectedColumns] = useState<string[]>([]);
  const [exportFormat, setExportFormat] = useState<'xlsx' | 'xls' | 'csv'>('xlsx');

  // ─── Estados de Navegación e Interfaz ─────────────────────────────────────
  const [isExporting, setIsExporting] = useState(false);

  // ─── Lógica Común de Generación de Archivo ──────────────────────────────
  const downloadExcel = (productsToExport: any[], filenamePrefix: string) => {
    try {
      if (selectedColumns.length === 0) {
        toast.error('Debes seleccionar al menos una columna para exportar.');
        return;
      }

      // Filtrar campos según las columnas seleccionadas
      const dataForSheet = productsToExport.map(p => {
        const row: Record<string, any> = {};
        if (selectedColumns.includes('SKU')) row['SKU'] = p.sku;
        if (selectedColumns.includes('Nombre')) row['Nombre'] = p.name;
        if (selectedColumns.includes('Descripción')) row['Descripción'] = p.description;
        if (selectedColumns.includes('Precio Base')) row['Precio Base'] = p.basePrice;
        if (selectedColumns.includes('Stock')) row['Stock'] = p.stockQuantity;
        if (selectedColumns.includes('Unidad')) row['Unidad'] = p.unit;
        if (selectedColumns.includes('Inner')) row['Inner'] = p.inner;
        if (selectedColumns.includes('Categoría')) row['Categoría'] = p.categoryName;
        if (selectedColumns.includes('Marca')) row['Marca'] = p.brandName;
        if (selectedColumns.includes('Estado')) row['Estado'] = p.status;
        return row;
      });

      const worksheet = XLSX.utils.json_to_sheet(dataForSheet);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Catálogo');

      const dateStr = new Date().toISOString().slice(0, 10);
      const filename = `${filenamePrefix}_${dateStr}.${exportFormat}`;

      if (exportFormat === 'csv') {
        XLSX.writeFile(workbook, filename, { bookType: 'csv' });
      } else if (exportFormat === 'xls') {
        XLSX.writeFile(workbook, filename, { bookType: 'biff8' });
      } else {
        XLSX.writeFile(workbook, filename, { bookType: 'xlsx' });
      }

      toast.success(`¡Archivo exportado exitosamente como ${exportFormat.toUpperCase()}!`);
    } catch (error) {
      console.error('Error al generar el archivo:', error);
      toast.error('Error al estructurar o descargar el archivo.');
    }
  };

  // ─── Acciones de Exportación ─────────────────────────────────────────────
  const handleExportAll = async () => {
    if (selectedColumns.length === 0) {
      toast.error('Debes seleccionar al menos una columna para exportar.');
      return;
    }
    
    setIsExporting(true);
    try {
      const response = await api.post('/api/products/export', { exportAll: true });
      const products = response.data || response || [];
      if (products.length === 0) {
        toast.error('No se encontraron productos para exportar.');
        return;
      }
      downloadExcel(products, 'catalogo_completo');
    } catch (error: any) {
      console.error('Error al exportar todos los productos:', error);
      toast.error(error.message || 'Fallo de conexión al exportar productos.');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <RoleGuard allowedRoles={[UserRole.ADMIN]}>
      <div className="p-8 space-y-8 max-w-6xl mx-auto w-full">
        
        {/* Header */}
        <div className="flex items-center gap-4 border-b border-zinc-900 pb-6">
          <button 
            onClick={() => router.push('/dashboard/products/import-stock')}
            className="p-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white hover:border-zinc-700 transition-all cursor-pointer"
            title="Volver a Importación"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-3xl font-bold text-white tracking-tight flex items-center gap-2.5">
              Exportar Catálogo de Productos
            </h1>
            <p className="text-sm text-zinc-500 mt-1">
              Descarga la planilla de stock y precios de tus productos para editar y re-importar.
            </p>
          </div>
        </div>

        {/* CONFIGURACIÓN DE EXPORTACIÓN */}
        <div className="bg-zinc-900/40 border border-zinc-800/80 rounded-3xl p-6 shadow-xl backdrop-blur-sm space-y-6">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <Database className="w-5 h-5 text-primary" />
            Configuración de Exportación
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Formato */}
            <div className="space-y-3">
              <h3 className="text-sm font-bold text-zinc-400 uppercase tracking-wider">Formato del Archivo</h3>
              <div className="flex flex-col sm:flex-row gap-3">
                {[
                  { id: 'xlsx', label: 'Excel (.xlsx)' },
                  { id: 'xls', label: 'Excel Antiguo (.xls)' },
                  { id: 'csv', label: 'CSV (.csv)' }
                ].map(fmt => (
                  <label 
                    key={fmt.id} 
                    className={`flex-1 flex items-center gap-2 p-3 rounded-xl border cursor-pointer transition-colors ${
                      exportFormat === fmt.id 
                        ? 'bg-primary/10 border-primary/50 text-white' 
                        : 'bg-zinc-950 border-zinc-800 text-zinc-400 hover:bg-zinc-900'
                    }`}
                  >
                    <input
                      type="radio"
                      name="format"
                      value={fmt.id}
                      checked={exportFormat === fmt.id}
                      onChange={() => setExportFormat(fmt.id as any)}
                      className="hidden"
                    />
                    <div className={`w-3.5 h-3.5 rounded-full border-2 flex items-center justify-center ${
                      exportFormat === fmt.id ? 'border-primary' : 'border-zinc-600'
                    }`}>
                      {exportFormat === fmt.id && <div className="w-1.5 h-1.5 rounded-full bg-primary" />}
                    </div>
                    <span className="font-semibold text-sm">{fmt.label}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Columnas */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-zinc-400 uppercase tracking-wider">Columnas a Exportar</h3>
                <div className="flex gap-2 text-xs">
                  <button onClick={() => setSelectedColumns(AVAILABLE_COLUMNS.map(c => c.id))} className="text-primary hover:underline cursor-pointer">Todas</button>
                  <span className="text-zinc-700">|</span>
                  <button onClick={() => setSelectedColumns([])} className="text-zinc-500 hover:text-white hover:underline cursor-pointer">Ninguna</button>
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                {AVAILABLE_COLUMNS.map(col => {
                  const isSelected = selectedColumns.includes(col.id);
                  return (
                    <button
                      key={col.id}
                      onClick={() => {
                        setSelectedColumns(prev => 
                          prev.includes(col.id) 
                            ? prev.filter(id => id !== col.id)
                            : [...prev, col.id]
                        );
                      }}
                      className={`px-3 py-1.5 rounded-lg border text-xs font-semibold transition-all cursor-pointer ${
                        isSelected 
                          ? 'bg-primary text-primary-foreground border-primary'
                          : 'bg-zinc-950 text-zinc-500 border-zinc-800 hover:border-zinc-700 hover:text-zinc-300'
                      }`}
                    >
                      {col.label}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* CONTENIDO PRINCIPAL */}
        <div className="bg-zinc-900/40 border border-zinc-800/80 rounded-3xl overflow-hidden shadow-2xl backdrop-blur-sm p-8">
          <div className="space-y-6 max-w-xl">
            <div className="space-y-2">
              <h2 className="text-xl font-bold text-white">Exportación Completa</h2>
              <p className="text-xs text-zinc-400 leading-relaxed">
                Esta opción te permite exportar el catálogo completo de productos que no han sido marcados como eliminados.
                El archivo resultante contendrá solo las columnas que hayas seleccionado arriba.
              </p>
            </div>

            <div className="pt-4 flex items-center gap-4">
              <button
                onClick={handleExportAll}
                disabled={isExporting}
                className="flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50 font-bold text-xs transition-all shadow-lg shadow-primary/20 cursor-pointer w-full sm:w-auto"
              >
                {isExporting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Procesando exportación...
                  </>
                ) : (
                  <>
                    <Download className="w-4 h-4" />
                    Generar y Descargar Archivo
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

      </div>
    </RoleGuard>
  );
}
