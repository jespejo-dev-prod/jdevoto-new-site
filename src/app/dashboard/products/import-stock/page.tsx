'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { RoleGuard } from '@/components/auth/role-guard';
import { UserRole } from '@prisma/client';
import { useApi } from '@/shared/infrastructure/api/use-api';
import { 
 Upload, 
 CheckCircle2, 
 AlertTriangle, 
 ChevronDown, 
 ChevronUp, 
 RefreshCw, 
 FileSpreadsheet, 
 Play, 
 ArrowRight,
 Database,
 ArrowLeft,
 XCircle,
 FileText
} from 'lucide-react';
import * as XLSX from 'xlsx';

// ─── Helpers para CSV ────────────────────────────────────────────────────────
const detectDelimiter = (text: string): string => {
 const firstLine = text.split('\n')[0] || '';
 const commas = (firstLine.match(/,/g) || []).length;
 const semicolons = (firstLine.match(/;/g) || []).length;
 return semicolons > commas ? ';' : ',';
};

const parseLine = (line: string, delimiter: string): string[] => {
 const result: string[] = [];
 let current = '';
 let inQuotes = false;
 for (let i = 0; i < line.length; i++) {
 const char = line[i];
 if (char === '"') {
 inQuotes = !inQuotes;
 } else if (char === delimiter && !inQuotes) {
 result.push(current.trim());
 current = '';
 } else {
 current += char;
 }
 }
 result.push(current.trim());
 return result.map(val => val.replace(/^"|"$/g, ''));
};

const parseCSV = (text: string, delimiter: string): string[][] => {
 return text.split(/\r?\n/)
 .map(line => line.trim())
 .filter(line => line.length > 0)
 .map(line => parseLine(line, delimiter));
};

export default function ImportStockPage() {
 const api = useApi();
 const router = useRouter();

 // ─── Estados Principales ───────────────────────────────────────────────────
 const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
 const [file, setFile] = useState<File | null>(null);
 const [updateExistingOnly, setUpdateExistingOnly] = useState(true);
 const [showAdvanced, setShowAdvanced] = useState(false);
 const [delimiterSelection, setDelimiterSelection] = useState<'auto' | ',' | ';'>('auto');
 const [error, setError] = useState<string | null>(null);

 // Datos del archivo
 const [headers, setHeaders] = useState<string[]>([]);
 const [rows, setRows] = useState<string[][]>([]);

 // Mapeos: { [headerDelArchivo]:"sku" |"stock" |"price" |"ignore" }
 const [mappings, setMappings] = useState<Record<string, string>>({});

 // Progreso de importación
 const [progress, setProgress] = useState(0);
 const [currentChunk, setCurrentChunk] = useState(0);
 const [totalChunks, setTotalChunks] = useState(0);
 const [logMessages, setLogMessages] = useState<Array<{ type: 'info' | 'success' | 'error'; text: string }>>([]);

 // Resultados acumulados
 const [successUpdates, setSuccessUpdates] = useState<Array<{ sku: string; stock: number | null; price: number | null }>>([]);
 const [failedUpdates, setFailedUpdates] = useState<Array<{ sku: string; reason: string }>>([]);

 // Pestaña activa en pantalla de resultados (¡Hecho!)
 const [resultsTab, setResultsTab] = useState<'success' | 'failed'>('success');

 const fileInputRef = useRef<HTMLInputElement>(null);

 // ─── Controladores de Paso 1: Subir Archivo ───────────────────────────────
 const handleDragOver = (e: React.DragEvent) => {
 e.preventDefault();
 };

 const handleDrop = (e: React.DragEvent) => {
 e.preventDefault();
 if (e.dataTransfer.files && e.dataTransfer.files[0]) {
 processFile(e.dataTransfer.files[0]);
 }
 };

 const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
 if (e.target.files && e.target.files[0]) {
 processFile(e.target.files[0]);
 }
 };

 const processFile = (selectedFile: File) => {
 const fileNameLower = selectedFile.name.toLowerCase();
 const isExcel = fileNameLower.endsWith('.xlsx') || fileNameLower.endsWith('.xls');
 const isCsv = fileNameLower.endsWith('.csv') || fileNameLower.endsWith('.txt');

 if (!isExcel && !isCsv) {
 setError('Formato de archivo no válido. Suba un archivo CSV o Excel (.xlsx, .xls).');
 setFile(null);
 return;
 }

 setError(null);
 setFile(selectedFile);
 };

 const handleContinueStep1 = () => {
 if (!file) {
 setError('Seleccione un archivo primero.');
 return;
 }

 const isExcel = file.name.toLowerCase().endsWith('.xlsx') || file.name.toLowerCase().endsWith('.xls');
 const reader = new FileReader();

 if (isExcel) {
 reader.onload = (e) => {
 try {
 const data = new Uint8Array(e.target?.result as ArrayBuffer);
 const workbook = XLSX.read(data, { type: 'array', cellText: true, cellNF: true });
 const sheetName = workbook.SheetNames[0];
 const worksheet = workbook.Sheets[sheetName];
 const json = XLSX.utils.sheet_to_json<any[]>(worksheet, { header: 1, raw: false });

 if (json.length === 0) {
 setError('La planilla de Excel está vacía.');
 return;
 }

 const fileHeaders = (json[0] as any[]).map(h => String(h || '').trim());
 const fileRows = json.slice(1).map(row => 
 (row as any[]).map(val => val === undefined || val === null ? '' : String(val).trim())
 );

 setHeaders(fileHeaders);
 setRows(fileRows);
 autoDetectMappings(fileHeaders);
 setStep(2);
 } catch (err) {
 setError('Error al procesar el archivo Excel.');
 console.error(err);
 }
 };
 reader.readAsArrayBuffer(file);
 } else {
 reader.onload = (e) => {
 try {
 const text = e.target?.result as string;
 const delimiter = delimiterSelection === 'auto' ? detectDelimiter(text) : delimiterSelection;
 const parsed = parseCSV(text, delimiter);

 if (parsed.length === 0) {
 setError('El archivo CSV está vacío.');
 return;
 }

 const fileHeaders = parsed[0];
 const fileRows = parsed.slice(1);

 setHeaders(fileHeaders);
 setRows(fileRows);
 autoDetectMappings(fileHeaders);
 setStep(2);
 } catch (err) {
 setError('Error al leer el archivo CSV.');
 console.error(err);
 }
 };
 reader.readAsText(file);
 }
 };

 // Auto-detección inteligente para mapear campos (máximo una columna por tipo de campo)
 const autoDetectMappings = (fileHeaders: string[]) => {
 const newMappings: Record<string, string> = {};
 let hasSku = false;
 let hasStock = false;
 let hasPrice = false;

 fileHeaders.forEach((header) => {
 const h = header.toLowerCase().trim();
 if ((h === 'sku' || h.includes('sku') || h === 'codigo' || h === 'código' || h === 'referencia') && !hasSku) {
 newMappings[header] = 'sku';
 hasSku = true;
 } else if ((h === 'stock' || h === 'inventario' || h === 'cantidad' || h === 'qty') && !hasStock) {
 newMappings[header] = 'stock';
 hasStock = true;
 } else if ((h === 'precio' || h === 'price' || h === 'valor' || h === 'neto' || h === 'baseprice') && !hasPrice) {
 newMappings[header] = 'price';
 hasPrice = true;
 } else {
 newMappings[header] = 'ignore';
 }
 });
 setMappings(newMappings);
 };

 const handleMappingChange = (header: string, value: string) => {
 setMappings(prev => ({
 ...prev,
 [header]: value
 }));
 };

 // ─── Controlador de Paso 2: Ejecutar el Importador ────────────────────────
 const handleExecuteImporter = async () => {
 // Validar mappings requeridos
 const mappedValues = Object.values(mappings);
 const hasSku = mappedValues.includes('sku');
 const hasStock = mappedValues.includes('stock');
 const hasPrice = mappedValues.includes('price');

 if (!hasSku) {
 setError('Debes mapear obligatoriamente una columna como SKU para poder identificar los productos.');
 return;
 }

 if (!hasStock && !hasPrice) {
 setError('Debes mapear al menos una columna como Inventario/Stock o Precio Base para poder actualizar.');
 return;
 }

 setError(null);
 setStep(3);
 setProgress(0);
 setLogMessages([]);
 setSuccessUpdates([]);
 setFailedUpdates([]);

 // ─── Proceso de Importación en Lotes ─────────────────────────────────────
 const chunkSize = 200; // Procesamos 200 productos por lote
 const totalRecords = rows.length;
 const chunksCount = Math.ceil(totalRecords / chunkSize);
 setTotalChunks(chunksCount);

 addLog('info', `Iniciando importación. Total de filas a procesar: ${totalRecords}`);

 let localSuccesses: any[] = [];
 let localFailures: any[] = [];

 for (let i = 0; i < chunksCount; i++) {
 setCurrentChunk(i + 1);
 const start = i * chunkSize;
 const end = Math.min(start + chunkSize, totalRecords);
 const chunkRows = rows.slice(start, end);

 addLog('info', `Procesando lote ${i + 1} de ${chunksCount} (filas ${start + 1} a ${end})...`);

 // Construir payload mapeado para este lote
 const chunkUpdates = chunkRows.map((row) => {
 const item: any = {};
 headers.forEach((header, colIndex) => {
 const targetField = mappings[header];
 const val = row[colIndex];

 if (targetField === 'sku') {
 item.sku = String(val).toUpperCase().trim();
 } else if (targetField === 'stock') {
 let cleanVal = String(val).replace(/[\s]/g, '');
 if (cleanVal.includes('.') && cleanVal.includes(',')) {
 cleanVal = cleanVal.replace(/\./g, '').replace(/,/g, '.');
 } else if (cleanVal.includes(',')) {
 cleanVal = cleanVal.replace(/,/g, '.');
 }
 const num = Math.round(parseFloat(cleanVal));
 item.stock = isNaN(num) ? null : num;
 } else if (targetField === 'price') {
 let cleanVal = String(val).replace(/[$\s]/g, '');
 if (cleanVal.includes('.') && cleanVal.includes(',')) {
 cleanVal = cleanVal.replace(/\./g, '').replace(/,/g, '.');
 } else if (cleanVal.includes(',')) {
 cleanVal = cleanVal.replace(/,/g, '.');
 }
 const num = parseFloat(cleanVal);
 item.price = isNaN(num) ? null : num;
 }
 });
 return item;
 }).filter(item => !!item.sku); // Omitir filas sin SKU

 try {
 const response = await api.post('/api/products/import-stock', {
 updates: chunkUpdates
 });

 const successes = response.successes || [];
 const failures = response.failures || [];

 localSuccesses = [...localSuccesses, ...successes];
 localFailures = [...localFailures, ...failures];

 if (successes.length > 0) {
 addLog('success', `Lote ${i + 1}: ${successes.length} productos actualizados con éxito.`);
 }
 if (failures.length > 0) {
 addLog('error', `Lote ${i + 1}: ${failures.length} productos omitidos o no encontrados.`);
 }
 } catch (err: any) {
 addLog('error', `Fallo al procesar el lote ${i + 1}: ${err.message || 'Error de servidor'}`);
 // Consideramos todos los del lote como fallidos
 chunkUpdates.forEach(u => {
 localFailures.push({ sku: u.sku, reason: `Error de red: ${err.message || 'Desconocido'}` });
 });
 }

 // Actualizar porcentaje
 setProgress(Math.round(((i + 1) / chunksCount) * 100));
 }

 // Guardar resultados finales y pasar al paso 4
 setSuccessUpdates(localSuccesses);
 setFailedUpdates(localFailures);
 setResultsTab(localSuccesses.length > 0 ? 'success' : 'failed');
 setStep(4);
 };

 const addLog = (type: 'info' | 'success' | 'error', text: string) => {
 setLogMessages(prev => [...prev, { type, text }]);
 };

 const resetImporter = () => {
 setStep(1);
 setFile(null);
 setHeaders([]);
 setRows([]);
 setMappings({});
 setProgress(0);
 setCurrentChunk(0);
 setTotalChunks(0);
 setLogMessages([]);
 setSuccessUpdates([]);
 setFailedUpdates([]);
 setError(null);
 };

 return (
 <RoleGuard allowedRoles={[UserRole.ADMIN]}>
 <div className="p-8 space-y-8 max-w-6xl mx-auto w-full">
 
 {/* Header */}
 <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
 <div className="flex items-center gap-4">
 <button 
 onClick={() => step > 1 ? setStep((prev) => (prev - 1) as any) : router.push('/dashboard/products')}
 className="p-2 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white transition-colors"
 >
 <ArrowLeft className="w-5 h-5" />
 </button>
 <div>
 <h1 className="text-3xl font-bold text-white tracking-tight">Actualizar Inventario y Precios</h1>
 <p className="text-sm text-zinc-500 mt-1">Importa una planilla Excel o archivo CSV para actualizar masivamente tus productos.</p>
 </div>
 </div>
 <button
 onClick={() => router.push('/dashboard/products/export')}
 className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-zinc-900 border border-zinc-800 hover:border-zinc-700 hover:bg-zinc-800 text-white font-bold text-xs transition-all shadow-md self-start sm:self-auto cursor-pointer"
 >
 <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
 Exportar Inventario
 </button>
 </div>

 {/* Stepper WooCommerce */}
 <div className="relative">
 {/* Progress bar line */}
 <div className="absolute top-1/2 left-0 w-full h-[2px] bg-zinc-800 -translate-y-1/2" />
 <div 
 className="absolute top-1/2 left-0 h-[2px] bg-primary -translate-y-1/2 transition-all" 
 style={{ width: `${(step - 1) * 33.33}%` }}
 />

 <div className="relative flex justify-between items-center">
 {[
 { num: 1, label: 'Subir archivo CSV' },
 { num: 2, label: 'Asignación de columnas' },
 { num: 3, label: 'Importar' },
 { num: 4, label: '¡Hecho!' }
 ].map((s) => (
 <div key={s.num} className="flex flex-col items-center">
 <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold border-2 transition-all ${
 step >= s.num 
 ? 'bg-primary border-primary text-primary-foreground shadow-lg shadow-primary/20 scale-110' 
 : 'bg-zinc-950 border-zinc-800 text-zinc-500'
 }`}>
 {step > s.num ? '✓' : s.num}
 </div>
 <span className={`text-[10px] uppercase font-bold tracking-wider mt-2 hidden sm:block ${
 step >= s.num ? 'text-zinc-200' : 'text-zinc-500'
 }`}>
 {s.label}
 </span>
 </div>
 ))}
 </div>
 </div>

 {/* Notificación de Error */}
 {error && (
 <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs flex items-center gap-3">
 <AlertTriangle className="w-4 h-4 flex-shrink-0" />
 <p className="font-medium">{error}</p>
 </div>
 )}

 {/* CARD PRINCIPAL ASISTENTE */}
 <div className="bg-zinc-900/40 border border-zinc-800 rounded-3xl overflow-hidden shadow-2xl backdrop-blur-sm">
 
 {/* PASO 1: Subir Archivo */}
 {step === 1 && (
 <div className="p-8 space-y-8">
 <div className="space-y-2">
 <h2 className="text-xl font-bold text-white">Importar productos desde un archivo CSV o Excel</h2>
 <p className="text-xs text-zinc-500">
 Esta herramienta te permite actualizar rápidamente los niveles de inventario y los precios base de los productos existentes en tu catálogo a partir de archivos Excel (`.xlsx`, `.xls`) o archivos CSV de texto.
 </p>
 </div>

 {/* Area de Dropeo de archivo */}
 <div 
 onDragOver={handleDragOver}
 onDrop={handleDrop}
 onClick={() => fileInputRef.current?.click()}
 className={`border-2 border-dashed rounded-2xl p-12 text-center cursor-pointer transition-all flex flex-col items-center justify-center gap-4 ${
 file 
 ? 'border-primary/50 bg-primary/5' 
 : 'border-zinc-800 hover:border-zinc-700 bg-zinc-950/20 hover:bg-zinc-950/40'
 }`}
 >
 <input 
 type="file" 
 ref={fileInputRef}
 onChange={handleFileChange}
 accept=".csv,.txt,.xlsx,.xls"
 className="hidden"
 data-testid="file-input"
 />
 
 <div className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-colors ${
 file ? 'bg-primary/10 text-primary' : 'bg-zinc-900 text-zinc-500'
 }`}>
 {file?.name.toLowerCase().endsWith('.xlsx') || file?.name.toLowerCase().endsWith('.xls') ? (
 <FileSpreadsheet className="w-7 h-7" />
 ) : (
 <Upload className="w-7 h-7" />
 )}
 </div>

 <div className="space-y-1">
 <p className="text-sm font-semibold text-white">
 {file ? file.name : 'Selecciona o arrastra tu planilla de productos'}
 </p>
 <p className="text-xs text-zinc-500">
 {file ? `${(file.size / (1024 * 1024)).toFixed(2)} MB` : 'Soporta archivos CSV, Excel (.xlsx, .xls) y TXT'}
 </p>
 </div>
 </div>

 {/* Ajustes del importador */}
 <div className="space-y-4 border-t border-zinc-800/60 pt-6">
 <label className="flex items-start gap-3 cursor-pointer group">
 <input 
 type="checkbox" 
 checked={updateExistingOnly}
 onChange={(e) => setUpdateExistingOnly(e.target.checked)}
 className="w-4 h-4 mt-0.5 rounded border-zinc-800 bg-zinc-950 text-primary focus:ring-primary focus:ring-offset-zinc-900 focus:ring-2 accent-primary"
 />
 <div className="space-y-0.5">
 <p className="text-sm font-semibold text-zinc-200 group-hover:text-white transition-colors">
 Actualizar productos existentes
 </p>
 <p className="text-xs text-zinc-500">
 Los productos existentes que coincidan en SKU se actualizarán. Los productos en el archivo que no existan en el sistema se omitirán.
 </p>
 </div>
 </label>

 {/* Opciones Avanzadas */}
 <div className="pt-2">
 <button 
 onClick={() => setShowAdvanced(!showAdvanced)}
 className="text-xs font-bold text-zinc-500 hover:text-zinc-300 transition-colors flex items-center gap-1.5"
 >
 {showAdvanced ? 'Ocultar opciones avanzadas' : 'Mostrar opciones avanzadas'}
 <ChevronDown className={`w-3.5 h-3.5 transition-transform ${showAdvanced ? 'rotate-180' : ''}`} />
 </button>

 {showAdvanced && (
 <div className="mt-4 p-4 rounded-2xl bg-zinc-950/40 border border-zinc-800/80 max-w-sm space-y-3">
 <label className="block text-xs font-semibold text-zinc-400">Delimitador CSV (Solo para archivos CSV)</label>
 <select 
 value={delimiterSelection}
 onChange={(e) => setDelimiterSelection(e.target.value as any)}
 className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2 text-xs font-medium text-white focus:outline-none focus:border-primary"
 >
 <option value="auto">Auto-detectar delimitador</option>
 <option value=",">Coma ( , )</option>
 <option value=";">Punto y coma ( ; )</option>
 </select>
 </div>
 )}
 </div>
 </div>

 {/* Botón continuar */}
 <div className="flex justify-end border-t border-zinc-800/60 pt-6">
 <button
 onClick={handleContinueStep1}
 disabled={!file}
 className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-primary hover:bg-primary/95 text-primary-foreground disabled:opacity-50 disabled:hover:bg-primary font-bold text-xs transition-all shadow-lg shadow-primary/20"
 >
 Continuar
 <ArrowRight className="w-4 h-4" />
 </button>
 </div>
 </div>
 )}

 {/* PASO 2: Asignación de Columnas */}
 {step === 2 && (
 <div className="p-8 space-y-8">
 <div className="space-y-2">
 <h2 className="text-xl font-bold text-white">Asignar campos a los productos</h2>
 <p className="text-xs text-zinc-500">
 Selecciona los campos de tu archivo CSV/Excel para asignarlos a los campos correspondientes del catálogo (SKU, Inventario o Precio), o para ignorarlos durante la importación.
 </p>
 </div>

 {/* Tabla de Mapeo */}
 <div className="border border-zinc-800 rounded-2xl overflow-hidden bg-zinc-950/20">
 <table className="w-full text-left border-collapse">
 <thead>
 <tr className="border-b border-zinc-800 bg-zinc-900/40">
 <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-zinc-400">Nombre de la columna</th>
 <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-zinc-400">Ejemplo de valor</th>
 <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-zinc-400">Asignar al campo</th>
 </tr>
 </thead>
 <tbody>
 {headers.map((header) => {
 const sampleValue = rows[0]?.[headers.indexOf(header)] || 'Vacio';
 const mapping = mappings[header] || 'ignore';
 
 return (
 <tr key={header} className="border-b border-zinc-800/40 hover:bg-zinc-900/10">
 <td className="px-6 py-4 text-xs font-semibold text-zinc-200">
 {header}
 </td>
 <td className="px-6 py-4 text-xs font-medium text-zinc-500 italic">
 {sampleValue}
 </td>
 <td className="px-6 py-4">
 <select
 value={mapping}
 onChange={(e) => handleMappingChange(header, e.target.value)}
 className={`bg-zinc-900 border text-xs font-semibold rounded-xl px-3 py-2 focus:outline-none focus:ring-1 focus:ring-primary w-52 transition-colors ${
 mapping !== 'ignore' 
 ? 'border-primary/40 text-primary bg-primary/5' 
 : 'border-zinc-800 text-zinc-400'
 }`}
 >
 <option value="ignore">No importar</option>
 <option value="sku">SKU (Código único)</option>
 <option value="stock">Inventario / Stock</option>
 <option value="price">Precio Base (Neto)</option>
 </select>
 </td>
 </tr>
 );
 })}
 </tbody>
 </table>
 </div>

 {/* Botones de acción */}
 <div className="flex justify-between items-center border-t border-zinc-800/60 pt-6">
 <button
 onClick={() => setStep(1)}
 className="px-5 py-2.5 rounded-xl border border-zinc-800 text-zinc-400 hover:text-white hover:bg-zinc-900/30 font-semibold text-xs transition-colors"
 >
 Atrás
 </button>
 
 <button
 onClick={handleExecuteImporter}
 className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-primary hover:bg-primary/95 text-primary-foreground font-bold text-xs transition-all shadow-lg shadow-primary/20"
 >
 Ejecutar el importador
 <Play className="w-3.5 h-3.5" />
 </button>
 </div>
 </div>
 )}

 {/* PASO 3: Importar (Progreso) */}
 {step === 3 && (
 <div className="p-8 space-y-8">
 <div className="space-y-2 text-center max-w-md mx-auto">
 <RefreshCw className="w-8 h-8 text-primary animate-spin mx-auto mb-4" />
 <h2 className="text-xl font-bold text-white">Importando catálogo...</h2>
 <p className="text-xs text-zinc-500">
 Por favor, no cierres esta pestaña. Estamos actualizando el stock y precios de tus productos en lotes de 200 filas.
 </p>
 </div>

 {/* Barra de progreso visual */}
 <div className="max-w-xl mx-auto space-y-2">
 <div className="flex justify-between text-xs font-bold text-zinc-400">
 <span>Progreso de actualización</span>
 <span>{progress}%</span>
 </div>
 <div className="w-full h-3 rounded-full bg-zinc-950 border border-zinc-850 overflow-hidden relative">
 <div 
 className="h-full bg-primary transition-all rounded-full"
 style={{ width: `${progress}%` }}
 />
 </div>
 <p className="text-[10px] text-zinc-500 text-center font-semibold">
 Procesando lote {currentChunk} de {totalChunks}...
 </p>
 </div>

 {/* Log en vivo para feedback de procesamiento */}
 <div className="border border-zinc-850 rounded-2xl overflow-hidden bg-zinc-950/60 max-w-xl mx-auto">
 <div className="px-4 py-2 border-b border-zinc-850 bg-zinc-900/50 flex items-center justify-between">
 <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">Log de operaciones</span>
 <span className="text-[9px] font-semibold text-zinc-600 bg-zinc-900 px-2 py-0.5 rounded-full">
 {logMessages.length} eventos
 </span>
 </div>
 <div className="p-4 h-48 overflow-y-auto font-mono text-[10px] space-y-2 flex flex-col">
 {logMessages.map((msg, index) => (
 <div 
 key={index} 
 className={`flex gap-2 ${
 msg.type === 'success' 
 ? 'text-emerald-400' 
 : msg.type === 'error' 
 ? 'text-red-400' 
 : 'text-zinc-500'
 }`}
 >
 <span className="opacity-40">[{new Date().toLocaleTimeString()}]</span>
 <span>{msg.text}</span>
 </div>
 ))}
 {logMessages.length === 0 && (
 <p className="text-zinc-700 italic text-center py-16">Iniciando comunicación con el servidor...</p>
 )}
 </div>
 </div>
 </div>
 )}

 {/* PASO 4: ¡Hecho! (Resumen y detalles) */}
 {step === 4 && (
 <div className="p-8 space-y-8">
 
 {/* Encabezado éxito */}
 <div className="flex flex-col items-center justify-center text-center max-w-md mx-auto space-y-4">
 <div className="w-16 h-16 rounded-3xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
 <CheckCircle2 className="w-8 h-8" />
 </div>
 <div className="space-y-1">
 <h2 className="text-xl font-bold text-white">¡Importación completada!</h2>
 <p className="text-xs text-zinc-500">El catálogo se ha procesado. A continuación puedes ver el resumen de los cambios aplicados.</p>
 </div>
 </div>

 {/* Caja de estadísticas */}
 <div className="grid grid-cols-3 gap-4 max-w-2xl mx-auto bg-zinc-950/20 border border-zinc-800 p-6 rounded-2xl">
 <div className="text-center space-y-1">
 <p className="text-[10px] uppercase font-bold tracking-wider text-zinc-500">Total Filas</p>
 <p className="text-2xl font-black text-white">{rows.length}</p>
 </div>
 <div className="text-center space-y-1 border-x border-zinc-800/60">
 <p className="text-[10px] uppercase font-bold tracking-wider text-emerald-500">Actualizados</p>
 <p className="text-2xl font-black text-emerald-400">{successUpdates.length}</p>
 </div>
 <div className="text-center space-y-1">
 <p className="text-[10px] uppercase font-bold tracking-wider text-red-500">Fallidos / Omitidos</p>
 <p className="text-2xl font-black text-red-400">{failedUpdates.length}</p>
 </div>
 </div>

 {/* Detalle de productos actualizados o fallidos */}
 <div className="max-w-2xl mx-auto space-y-4">
 
 {/* Tabs */}
 <div className="flex border-b border-zinc-800 gap-4 text-xs font-bold pb-2">
 <button
 onClick={() => setResultsTab('success')}
 className={`pb-2 border-b-2 transition-all relative ${
 resultsTab === 'success'
 ? 'border-primary text-primary font-bold'
 : 'border-transparent text-zinc-500 hover:text-zinc-300'
 }`}
 >
 Exitosos ({successUpdates.length})
 </button>
 <button
 onClick={() => setResultsTab('failed')}
 className={`pb-2 border-b-2 transition-all relative ${
 resultsTab === 'failed'
 ? 'border-primary text-primary font-bold'
 : 'border-transparent text-zinc-500 hover:text-zinc-300'
 }`}
 >
 Fallidos / Omitidos ({failedUpdates.length})
 </button>
 </div>

 {/* Contenido Tabs */}
 {resultsTab === 'success' ? (
 <div className="border border-zinc-850 rounded-2xl overflow-hidden bg-zinc-950/10">
 {successUpdates.length === 0 ? (
 <div className="p-8 text-center text-zinc-500 text-xs italic">
 Ningún producto fue actualizado con éxito en esta sesión.
 </div>
 ) : (
 <div className="max-h-64 overflow-y-auto">
 <table className="w-full text-left border-collapse text-xs">
 <thead>
 <tr className="border-b border-zinc-800 bg-zinc-900/30">
 <th className="px-4 py-3 font-semibold text-zinc-400">SKU</th>
 <th className="px-4 py-3 font-semibold text-zinc-400 text-right">Stock Asignado</th>
 <th className="px-4 py-3 font-semibold text-zinc-400 text-right">Precio Asignado</th>
 </tr>
 </thead>
 <tbody>
 {successUpdates.map((item, idx) => (
 <tr key={idx} className="border-b border-zinc-800/40 hover:bg-zinc-900/5">
 <td className="px-4 py-3 font-bold text-zinc-300">{item.sku}</td>
 <td className="px-4 py-3 text-right font-medium text-zinc-400">
 {item.stock !== null ? item.stock : <span className="text-zinc-650 italic">Sin cambiar</span>}
 </td>
 <td className="px-4 py-3 text-right font-medium text-zinc-400">
 {item.price !== null ? `$${item.price.toLocaleString('es-CL')}` : <span className="text-zinc-650 italic">Sin cambiar</span>}
 </td>
 </tr>
 ))}
 </tbody>
 </table>
 </div>
 )}
 </div>
 ) : (
 <div className="border border-zinc-850 rounded-2xl overflow-hidden bg-zinc-950/10">
 {failedUpdates.length === 0 ? (
 <div className="p-8 text-center text-zinc-500 text-xs italic">
 No se registraron fallas en esta sesión.
 </div>
 ) : (
 <div className="max-h-64 overflow-y-auto">
 <table className="w-full text-left border-collapse text-xs">
 <thead>
 <tr className="border-b border-zinc-800 bg-zinc-900/30">
 <th className="px-4 py-3 font-semibold text-zinc-400">SKU</th>
 <th className="px-4 py-3 font-semibold text-zinc-400">Motivo / Error</th>
 </tr>
 </thead>
 <tbody>
 {failedUpdates.map((item, idx) => (
 <tr key={idx} className="border-b border-zinc-800/40 hover:bg-zinc-900/5">
 <td className="px-4 py-3 font-bold text-red-400">{item.sku}</td>
 <td className="px-4 py-3 text-zinc-400">{item.reason}</td>
 </tr>
 ))}
 </tbody>
 </table>
 </div>
 )}
 </div>
 )}
 </div>

 {/* Botón de cierre */}
 <div className="flex justify-center gap-4 border-t border-zinc-800/60 pt-6 max-w-2xl mx-auto">
 <button
 onClick={resetImporter}
 className="px-5 py-2.5 rounded-xl border border-zinc-800 text-zinc-400 hover:text-white hover:bg-zinc-900/30 font-semibold text-xs transition-colors"
 >
 Importar otro archivo
 </button>
 <button
 onClick={() => router.push('/dashboard/products')}
 className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-primary hover:bg-primary/95 text-primary-foreground font-bold text-xs transition-all shadow-lg shadow-primary/20"
 >
 Ver Catálogo de Productos
 <ArrowRight className="w-4 h-4" />
 </button>
 </div>
 </div>
 )}

 </div>
 </div>
 </RoleGuard>
 );
}
