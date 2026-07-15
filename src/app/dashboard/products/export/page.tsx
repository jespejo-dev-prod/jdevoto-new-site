'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { RoleGuard } from '@/components/auth/role-guard';
import { UserRole } from '@prisma/client';
import { useApi } from '@/shared/infrastructure/api/use-api';
import { useProducts } from '@/modules/catalog/presentation/hooks/useProducts';
import { useCategories } from '@/modules/catalog/application/hooks/useCatalogData';
import { 
 ArrowLeft, 
 FileSpreadsheet, 
 Download, 
 Search, 
 Check, 
 Database, 
 Layers, 
 FileText, 
 Loader2, 
 AlertTriangle,
 ChevronLeft,
 ChevronRight,
 ClipboardList
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { toast } from 'sonner';

export default function ExportStockPage() {
 const api = useApi();
 const router = useRouter();

 // ─── Estados de Navegación e Interfaz ─────────────────────────────────────
 const [activeTab, setActiveTab] = useState<'all' | 'select' | 'skus'>('all');
 const [isExporting, setIsExporting] = useState(false);

 // ─── Estado de Selección Manual (Tab 2) ──────────────────────────────────
 const [searchQuery, setSearchQuery] = useState('');
 const [debouncedSearch, setDebouncedSearch] = useState('');
 const [selectedCategoryId, setSelectedCategoryId] = useState('');
 const [currentPage, setCurrentPage] = useState(1);
 const [selectedSkus, setSelectedSkus] = useState<Set<string>>(new Set());

 // ─── Estado de Ingreso de SKUs (Tab 3) ────────────────────────────────────
 const [skusText, setSkusText] = useState('');

 // ─── Fetching de Datos para Tab 2 ─────────────────────────────────────────
 // Debounce simple para la búsqueda
 useEffect(() => {
 const handler = setTimeout(() => {
 setDebouncedSearch(searchQuery);
 setCurrentPage(1); // Volver a la primera página ante nueva búsqueda
 }, 350);
 return () => clearTimeout(handler);
 }, [searchQuery]);

 const { data: productsData, isLoading: isLoadingProducts } = useProducts({
 search: debouncedSearch,
 categoryId: selectedCategoryId,
 page: currentPage,
 limit: 10,
 includeInactive: true,
 status: 'all',
 });

 const { data: categories = [] } = useCategories();

 const productsList = productsData?.products ?? [];
 const totalPages = productsData?.totalPages ?? 1;
 const totalProductsCount = productsData?.total ?? 0;

 // ─── Controladores de Selección Manual ────────────────────────────────────
 const handleToggleSelectAllOnPage = () => {
 if (productsList.length === 0) return;

 const allOnPageSelected = productsList.every(p => selectedSkus.has(p.sku));
 const newSelected = new Set(selectedSkus);

 productsList.forEach(p => {
 if (allOnPageSelected) {
 newSelected.delete(p.sku);
 } else {
 newSelected.add(p.sku);
 }
 });

 setSelectedSkus(newSelected);
 };

 const handleToggleSelectProduct = (sku: string) => {
 const newSelected = new Set(selectedSkus);
 if (newSelected.has(sku)) {
 newSelected.delete(sku);
 } else {
 newSelected.add(sku);
 }
 setSelectedSkus(newSelected);
 };

 const handleClearSelection = () => {
 setSelectedSkus(new Set());
 toast.success('Selección limpiada correctamente.');
 };

 // ─── Lógica Común de Generación de XLSX ───────────────────────────────────
 const downloadExcel = (productsToExport: any[], filenamePrefix: string) => {
 try {
 // Mapear campos para que el archivo XLSX contenga las columnas requeridas
 const dataForSheet = productsToExport.map(p => ({
 'SKU': p.sku,
 'Nombre': p.name,
 'Descripción': p.description,
 'Precio Base': p.basePrice,
 'Stock': p.stockQuantity,
 'Unidad': p.unit,
 'Inner': p.inner,
 'Categoría': p.categoryName,
 'Marca': p.brandName,
 'Estado': p.status
 }));

 const worksheet = XLSX.utils.json_to_sheet(dataForSheet);
 const workbook = XLSX.utils.book_new();
 XLSX.utils.book_append_sheet(workbook, worksheet, 'Catálogo');

 // Auto-ajustar el ancho de las columnas
 const columnWidths = Object.keys(dataForSheet[0] || {}).map(key => ({
 wch: Math.max(
 key.length + 3,
 ...dataForSheet.map(row => String((row as any)[key] || '').length + 2)
 )
 }));
 worksheet['!cols'] = columnWidths;

 const dateStr = new Date().toISOString().slice(0, 10);
 XLSX.writeFile(workbook, `${filenamePrefix}_${dateStr}.xlsx`);
 toast.success('¡Archivo Excel generado y descargado exitosamente!');
 } catch (error) {
 console.error('Error al generar XLSX:', error);
 toast.error('Error al estructurar o descargar el archivo Excel.');
 }
 };

 // ─── Acciones de Exportación por Tab ──────────────────────────────────────
 const handleExportAll = async () => {
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

 const handleExportSelected = async () => {
 if (selectedSkus.size === 0) {
 toast.error('Selecciona al menos un producto para exportar.');
 return;
 }
 setIsExporting(true);
 try {
 const response = await api.post('/api/products/export', {
 exportAll: false,
 skus: Array.from(selectedSkus)
 });
 const products = response.data || response || [];
 if (products.length === 0) {
 toast.error('Ninguno de los productos seleccionados pudo encontrarse.');
 return;
 }
 downloadExcel(products, 'catalogo_seleccionado');
 } catch (error: any) {
 console.error('Error al exportar productos seleccionados:', error);
 toast.error(error.message || 'Fallo de conexión al exportar productos.');
 } finally {
 setIsExporting(false);
 }
 };

 const handleExportPastedSkus = async () => {
 // Sanitizar entrada de texto
 const skus = skusText
 .split(/[\n,;]/)
 .map(s => s.trim().toUpperCase())
 .filter(s => s.length > 0);

 if (skus.length === 0) {
 toast.error('Ingresa al menos un SKU válido para realizar la exportación.');
 return;
 }

 setIsExporting(true);
 try {
 const response = await api.post('/api/products/export', {
 exportAll: false,
 skus: skus
 });
 const products = response.data || response || [];
 if (products.length === 0) {
 toast.error('No se encontró ningún producto con los SKUs especificados.');
 return;
 }

 // Ordenar productos en base al orden exacto de los SKUs ingresados por el usuario
 const skuOrderMap = new Map<string, number>();
 skus.forEach((sku, index) => {
 const cleanSku = sku.trim().toUpperCase();
 skuOrderMap.set(cleanSku, index);
 if (/^\d+$/.test(cleanSku) && cleanSku.length < 7) {
 skuOrderMap.set(cleanSku.padStart(7, '0'), index);
 }
 });

 const sortedProducts = [...products].sort((a, b) => {
 const indexA = skuOrderMap.has(a.sku) ? skuOrderMap.get(a.sku)! : 999999;
 const indexB = skuOrderMap.has(b.sku) ? skuOrderMap.get(b.sku)! : 999999;
 return indexA - indexB;
 });

 downloadExcel(sortedProducts, 'catalogo_por_sku');
 } catch (error: any) {
 console.error('Error al exportar SKUs ingresados:', error);
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
 Descarga la planilla de stock y precios de tus productos en formato Excel para editar y re-importar.
 </p>
 </div>
 </div>

 {/* Tab Navigation Menu */}
 <div className="flex border-b border-zinc-800 gap-6 text-[11px] uppercase tracking-widest font-black pb-0.5">
 <button
 onClick={() => setActiveTab('all')}
 className={`flex items-center gap-2 pb-3 border-b-2 transition-all cursor-pointer ${
 activeTab === 'all'
 ? 'border-primary text-primary font-black'
 : 'border-transparent text-zinc-500 hover:text-zinc-300'
 }`}
 >
 <Database className="w-3.5 h-3.5" />
 Todo el Catálogo
 </button>
 <button
 onClick={() => setActiveTab('select')}
 className={`flex items-center gap-2 pb-3 border-b-2 transition-all cursor-pointer ${
 activeTab === 'select'
 ? 'border-primary text-primary font-black'
 : 'border-transparent text-zinc-500 hover:text-zinc-300'
 }`}
 >
 <Layers className="w-3.5 h-3.5" />
 Selección Manual
 </button>
 <button
 onClick={() => setActiveTab('skus')}
 className={`flex items-center gap-2 pb-3 border-b-2 transition-all cursor-pointer ${
 activeTab === 'skus'
 ? 'border-primary text-primary font-black'
 : 'border-transparent text-zinc-500 hover:text-zinc-300'
 }`}
 >
 <ClipboardList className="w-3.5 h-3.5" />
 Lista de SKUs
 </button>
 </div>

 {/* CONTENIDO PRINCIPAL */}
 <div className="bg-zinc-900/40 border border-zinc-800/80 rounded-3xl overflow-hidden shadow-2xl backdrop-blur-sm p-8">
 
 {/* TAB 1: TODO EL CATALOGO */}
 {activeTab === 'all' && (
 <div className="space-y-6 max-w-xl">
 <div className="space-y-2">
 <h2 className="text-xl font-bold text-white">Exportación Completa</h2>
 <p className="text-xs text-zinc-400 leading-relaxed">
 Esta opción te permite exportar el catálogo completo de productos que no han sido marcados como eliminados.
 El archivo Excel resultante contendrá los campos esenciales de tus productos para que puedas modificarlos fácilmente y volverlos a cargar en el importador de stock.
 </p>
 </div>

 {/* Informative list of columns */}
 <div className="p-4 bg-zinc-950/60 border border-zinc-800/80 rounded-2xl space-y-2.5">
 <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Columnas Incluidas en la Planilla:</h3>
 <div className="grid grid-cols-2 gap-y-2 gap-x-4 text-[11px] text-zinc-500 font-semibold font-mono">
 <div className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-emerald-500" /> SKU</div>
 <div className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-emerald-500" /> Nombre</div>
 <div className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-emerald-500" /> Descripción</div>
 <div className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-emerald-500" /> Precio Base</div>
 <div className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-emerald-500" /> Stock</div>
 <div className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-emerald-500" /> Unidad</div>
 <div className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-emerald-500" /> Inner</div>
 <div className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-emerald-500" /> Categoría</div>
 <div className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-emerald-500" /> Marca</div>
 <div className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-emerald-500" /> Estado</div>
 </div>
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
 Generar y Descargar Excel
 </>
 )}
 </button>
 </div>
 </div>
 )}

 {/* TAB 2: SELECCIÓN MANUAL */}
 {activeTab === 'select' && (
 <div className="space-y-6">
 
 <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
 <div className="space-y-1">
 <h2 className="text-xl font-bold text-white">Seleccionar Productos del Catálogo</h2>
 <p className="text-xs text-zinc-400">
 Busca y marca los productos específicos que deseas descargar. Tu selección se preservará entre páginas.
 </p>
 </div>

 {/* Resumen de selección actual */}
 {selectedSkus.size > 0 && (
 <div className="flex items-center gap-3 bg-zinc-950/60 border border-zinc-800 px-4 py-2.5 rounded-2xl">
 <span className="text-[11px] font-black text-primary uppercase tracking-wider">
 {selectedSkus.size} {selectedSkus.size === 1 ? 'Producto seleccionado' : 'Productos seleccionados'}
 </span>
 <button
 onClick={handleClearSelection}
 className="text-[10px] font-bold text-rose-500 hover:text-rose-400 hover:underline cursor-pointer"
 >
 Limpiar
 </button>
 </div>
 )}
 </div>

 {/* Filtros de Búsqueda y Categorías */}
 <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 rounded-2xl bg-zinc-950/30 border border-zinc-850">
 <div className="relative md:col-span-2">
 <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500 pointer-events-none" />
 <input
 type="text"
 placeholder="Buscar por nombre, SKU..."
 className="w-full pl-10 pr-4 py-2 bg-zinc-950 border border-zinc-800 focus:border-primary/50 text-white rounded-xl text-xs font-semibold outline-none transition-colors"
 value={searchQuery}
 onChange={(e) => setSearchQuery(e.target.value)}
 />
 </div>
 
 <select
 value={selectedCategoryId}
 onChange={(e) => {
 setSelectedCategoryId(e.target.value);
 setCurrentPage(1);
 }}
 className="w-full bg-zinc-950 border border-zinc-800 focus:border-primary/50 text-zinc-300 rounded-xl px-3 py-2 text-xs font-semibold outline-none transition-colors cursor-pointer"
 >
 <option value="">Todas las categorías</option>
 {categories.map((cat: any) => {
 const displayName = cat.name.includes(" >")
 ? ` ${cat.name.split(" >")[1]}`
 : cat.name;
 return (
 <option key={cat.id} value={cat.id}>
 {displayName.toUpperCase()}
 </option>
 );
 })}
 </select>
 </div>

 {/* Tabla de Productos con Checkboxes */}
 <div className="border border-zinc-850 rounded-2xl overflow-hidden bg-zinc-950/10">
 {isLoadingProducts ? (
 <div className="flex flex-col items-center justify-center py-20 gap-3">
 <Loader2 className="w-8 h-8 text-primary animate-spin" />
 <p className="text-xs text-zinc-500 font-semibold">Cargando catálogo...</p>
 </div>
 ) : productsList.length === 0 ? (
 <div className="text-center py-20 text-zinc-500 text-xs italic">
 No se encontraron productos coincidentes con los filtros de búsqueda.
 </div>
 ) : (
 <div className="overflow-x-auto">
 <table className="w-full text-left border-collapse text-xs">
 <thead>
 <tr className="border-b border-zinc-800 bg-zinc-900/30">
 <th className="px-6 py-4 w-12 text-center">
 <input
 type="checkbox"
 checked={productsList.length > 0 && productsList.every(p => selectedSkus.has(p.sku))}
 onChange={handleToggleSelectAllOnPage}
 className="w-4 h-4 rounded border-zinc-800 bg-zinc-950 text-primary focus:ring-primary focus:ring-offset-zinc-900 focus:ring-2 accent-primary cursor-pointer"
 />
 </th>
 <th className="px-6 py-4 font-bold uppercase tracking-wider text-zinc-400">SKU</th>
 <th className="px-6 py-4 font-bold uppercase tracking-wider text-zinc-400">Nombre</th>
 <th className="px-6 py-4 font-bold uppercase tracking-wider text-zinc-400">Categoría</th>
 <th className="px-6 py-4 font-bold uppercase tracking-wider text-zinc-400 text-right">Precio Neto</th>
 <th className="px-6 py-4 font-bold uppercase tracking-wider text-zinc-400 text-right">Stock</th>
 </tr>
 </thead>
 <tbody className="divide-y divide-zinc-850/50">
 {productsList.map((product) => {
 const isChecked = selectedSkus.has(product.sku);
 return (
 <tr 
 key={product.id} 
 className={`hover:bg-zinc-900/20 cursor-pointer transition-colors ${
 isChecked ? 'bg-primary/5' : ''
 }`}
 onClick={() => handleToggleSelectProduct(product.sku)}
 >
 <td className="px-6 py-4 w-12 text-center" onClick={(e) => e.stopPropagation()}>
 <input
 type="checkbox"
 checked={isChecked}
 onChange={() => handleToggleSelectProduct(product.sku)}
 className="w-4 h-4 rounded border-zinc-800 bg-zinc-950 text-primary focus:ring-primary focus:ring-offset-zinc-900 focus:ring-2 accent-primary cursor-pointer"
 />
 </td>
 <td className="px-6 py-4 font-mono font-bold text-zinc-200">{product.sku}</td>
 <td className="px-6 py-4 font-semibold text-white max-w-xs truncate">{product.name}</td>
 <td className="px-6 py-4 text-zinc-400">
 {product.category?.name 
 ? (product.category.name.includes(" >") 
 ? product.category.name.split(" >")[1] 
 : product.category.name) 
 : '—'}
 </td>
 <td className="px-6 py-4 text-right font-bold text-white">
 ${Math.round(product.basePrice).toLocaleString('es-CL')}
 </td>
 <td className="px-6 py-4 text-right font-semibold text-zinc-400">
 {product.stockQuantity}
 </td>
 </tr>
 );
 })}
 </tbody>
 </table>
 </div>
 )}
 </div>

 {/* Paginación */}
 {!isLoadingProducts && totalPages > 1 && (
 <div className="flex items-center justify-between border-t border-zinc-800/60 pt-4 text-xs font-semibold">
 <span className="text-zinc-500">
 Página {currentPage} de {totalPages} ({totalProductsCount} productos en total)
 </span>
 <div className="flex items-center gap-2">
 <button
 onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
 disabled={currentPage === 1}
 className="p-2 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white disabled:opacity-30 disabled:hover:text-zinc-400 transition-colors cursor-pointer"
 >
 <ChevronLeft className="w-4 h-4" />
 </button>
 <button
 onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
 disabled={currentPage === totalPages}
 className="p-2 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white disabled:opacity-30 disabled:hover:text-zinc-400 transition-colors cursor-pointer"
 >
 <ChevronRight className="w-4 h-4" />
 </button>
 </div>
 </div>
 )}

 {/* Botón de exportación */}
 <div className="flex justify-end border-t border-zinc-800/60 pt-6">
 <button
 onClick={handleExportSelected}
 disabled={selectedSkus.size === 0 || isExporting}
 className="flex items-center gap-2 px-6 py-3 rounded-xl bg-primary text-primary-foreground hover:bg-primary/95 disabled:opacity-50 font-bold text-xs transition-all shadow-lg shadow-primary/20 cursor-pointer w-full sm:w-auto justify-center"
 >
 {isExporting ? (
 <>
 <Loader2 className="w-4 h-4 animate-spin" />
 Procesando exportación...
 </>
 ) : (
 <>
 <Download className="w-4 h-4" />
 Exportar Seleccionados ({selectedSkus.size})
 </>
 )}
 </button>
 </div>
 </div>
 )}

 {/* TAB 3: INGRESO POR LISTA DE SKUS */}
 {activeTab === 'skus' && (
 <div className="space-y-6 max-w-2xl">
 <div className="space-y-2">
 <h2 className="text-xl font-bold text-white">Ingreso manual de SKUs</h2>
 <p className="text-xs text-zinc-400">
 Ingresa o pega un listado de códigos SKU específicos que necesites descargar. 
 Separa los códigos utilizando saltos de línea (enter), comas ( , ) o puntos y comas ( ; ).
 </p>
 </div>

 {/* Textarea para los SKUs */}
 <div className="space-y-2">
 <textarea
 className="w-full h-48 p-4 bg-zinc-950 border border-zinc-800 focus:border-primary/50 text-white rounded-2xl text-xs font-mono outline-none transition-colors resize-none placeholder:text-zinc-700"
 placeholder="Ejemplo:&#10;PROD-001&#10;PROD-002, PROD-003;&#10;SKU-994"
 value={skusText}
 onChange={(e) => setSkusText(e.target.value)}
 />
 
 {/* Contador de SKUs parseados preliminar */}
 <div className="flex justify-between items-center text-[10px] font-bold text-zinc-500 uppercase tracking-wider px-1">
 <span>Formato aceptado: saltos de línea o comas</span>
 <span>
 Aproximadamente {skusText.split(/[\n,;]/).map(s => s.trim()).filter(s => s.length > 0).length} SKUs identificados
 </span>
 </div>
 </div>

 {/* Botón de exportación */}
 <div className="flex justify-end border-t border-zinc-800/60 pt-6">
 <button
 onClick={handleExportPastedSkus}
 disabled={isExporting || skusText.trim().length === 0}
 className="flex items-center gap-2 px-6 py-3 rounded-xl bg-primary text-primary-foreground hover:bg-primary/95 disabled:opacity-50 font-bold text-xs transition-all shadow-lg shadow-primary/20 cursor-pointer w-full sm:w-auto justify-center"
 >
 {isExporting ? (
 <>
 <Loader2 className="w-4 h-4 animate-spin" />
 Procesando exportación...
 </>
 ) : (
 <>
 <Download className="w-4 h-4" />
 Exportar Lista de Productos
 </>
 )}
 </button>
 </div>
 </div>
 )}

 </div>
 </div>
 </RoleGuard>
 );
}
