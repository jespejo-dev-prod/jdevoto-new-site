'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { 
  CheckCircle2, AlertCircle, XCircle, UploadCloud, 
  Download, Trash2, Loader2, Check, 
  Plus, Minus, FolderOpen, ArrowRight, ShoppingCart
} from 'lucide-react';
import { useCart } from '@/context/CartContext';
import { useAuth } from '@/context/auth-context';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

interface Category {
  id: string;
  name: string;
  slug: string;
  parentId: string | null;
}

interface ValidationResult {
  sku: string;
  requestedQty: number;
  isValid: boolean;
  warnings?: string[];
  error?: string;
  product: {
    id: string;
    sku: string;
    name: string;
    slug: string;
    brand: string;
    unit: string;
    inner: number;
    minOrderQty: number;
    stockQuantity: number;
    image: string;
    price: {
      unitNetPrice: number;
      discountedNetPrice: number;
      unitGrossPrice: number;
      originalPrice: number;
      discountPercent: number;
      priceSource: string;
    };
  } | null;
}

interface QuickBuyViewProps {
  categories: Category[];
}

export function QuickBuyView({ categories }: QuickBuyViewProps) {
  const router = useRouter();
  const { addItem } = useCart();
  const { accessToken, loading } = useAuth();
  const [activeTab, setActiveTab] = useState<'manual' | 'file' | 'category'>('manual');

  // --- Tab 1: Manual Input ---
  const [manualText, setManualText] = useState('');
  const [isValidating, setIsValidating] = useState(false);
  const [validatedResults, setValidatedResults] = useState<ValidationResult[]>([]);

  // --- Tab 2: CSV Upload ---
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // --- API Validation Handler for Tab 1 and Tab 2 ---
  const validateItems = async (itemsList: { sku: string; quantity: number }[]) => {
    if (itemsList.length === 0) {
      toast.error('No se ingresaron SKUs válidos.');
      return;
    }

    setIsValidating(true);
    try {
      const res = await fetch('/api/compra-rapida/validate', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          ...(accessToken ? { 'Authorization': `Bearer ${accessToken}` } : {})
        },
        body: JSON.stringify({ items: itemsList }),
      });

      if (res.ok) {
        const data = await res.json();
        setValidatedResults(data.data?.results || []);
        toast.success('Validación finalizada. Revisa los resultados.');
      } else {
        toast.error('Ocurrió un error al validar los productos.');
      }
    } catch (e) {
      console.error(e);
      toast.error('Error de red al intentar validar.');
    } finally {
      setIsValidating(false);
    }
  };

  // Handle manual textarea submission
  const handleManualValidate = () => {
    const lines = manualText.split('\n');
    const items: { sku: string; quantity: number }[] = [];

    lines.forEach(line => {
      if (!line.trim()) return;
      // Split by comma or semicolon
      const parts = line.split(/[;,]/);
      const sku = parts[0]?.trim();
      const qty = parseInt(parts[1]?.trim()) || 1;
      if (sku) {
        items.push({ sku, quantity: qty });
      }
    });

    validateItems(items);
  };

  // Stepper update for validated results in Option 1 & 2
  const updateValidatedQty = (index: number, newQty: number) => {
    setValidatedResults(prev => prev.map((item, idx) => {
      if (idx !== index || !item.product) return item;
      
      const minQty = Number(item.product.inner || 1);
      let cleanQty = Math.max(minQty, newQty);
      
      // Enforce B2B multiples of inner
      if (cleanQty % minQty !== 0) {
        cleanQty = Math.round(cleanQty / minQty) * minQty;
      }

      const warnings: string[] = [];
      if (cleanQty < minQty) {
        warnings.push(`Cantidad mínima de pedido es ${minQty}`);
      }
      if (cleanQty > item.product.stockQuantity) {
        warnings.push(`Stock insuficiente (disponible: ${item.product.stockQuantity})`);
      }

      return {
        ...item,
        requestedQty: Math.max(minQty, cleanQty),
        isValid: warnings.length === 0,
        warnings,
      };
    }));
  };

  // Bulk add to cart from validation table (Option 1 & 2)
  const addValidatedToCart = () => {
    const validItems = validatedResults.filter(r => r.product && r.isValid);
    if (validItems.length === 0) {
      toast.error('No hay productos válidos listos para agregar.');
      return;
    }

    validItems.forEach(item => {
      // Re-map to the expected product structure in CartContext
      const p = {
        id: item.product!.id,
        sku: item.product!.sku,
        slug: item.product!.slug,
        name: item.product!.name,
        minOrderQty: item.product!.minOrderQty,
        stockQuantity: item.product!.stockQuantity,
        images: [{ url: item.product!.image }],
        price: {
          unitNetPrice: item.product!.price.unitNetPrice,
          discountedNetPrice: item.product!.price.discountedNetPrice,
          originalPrice: item.product!.price.originalPrice,
          discountPercent: item.product!.price.discountPercent,
          priceSource: item.product!.price.priceSource
        }
      };
      addItem(p, item.requestedQty);
    });

    toast.success(`¡Se agregaron ${validItems.length} productos al carro exitosamente!`);
    
    // Clear state
    setValidatedResults([]);
    setManualText('');
  };

  // --- File parsing for Tab 2 (CSV and Excel) ---
  const handleFileUpload = (file: File) => {
    if (!file) return;

    const fileExtension = file.name.split('.').pop()?.toLowerCase();

    if (fileExtension === 'csv') {
      const reader = new FileReader();
      reader.onload = (e) => {
        const text = e.target?.result as string;
        const lines = text.split('\n');
        const items: { sku: string; quantity: number }[] = [];

        lines.forEach((line, idx) => {
          // Omitir cabecera
          if (idx === 0 && (line.toLowerCase().includes('sku') || line.toLowerCase().includes('producto'))) return;
          if (!line.trim()) return;

          const parts = line.split(/[;,]/);
          const sku = parts[0]?.trim();
          const qty = parseInt(parts[1]?.trim()) || 1;
          if (sku) {
            items.push({ sku, quantity: qty });
          }
        });

        validateItems(items);
      };
      reader.readAsText(file);
    } else if (fileExtension === 'xlsx' || fileExtension === 'xls') {
      const reader = new FileReader();
      reader.onload = async (e) => {
        try {
          const data = new Uint8Array(e.target?.result as ArrayBuffer);
          // Importación dinámica para mantener el tamaño del bundle inicial bajo
          const XLSX = await import('xlsx');
          const workbook = XLSX.read(data, { type: 'array' });
          const sheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[sheetName];
          const json = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as any[][];

          const items: { sku: string; quantity: number }[] = [];

          json.forEach((row, idx) => {
            if (!row || row.length === 0) return;
            // Omitir cabecera si contiene palabras clave comunes
            if (idx === 0) {
              const col1 = String(row[0] || '').toLowerCase();
              if (col1.includes('sku') || col1.includes('producto') || col1.includes('id')) {
                return;
              }
            }

            const sku = String(row[0] || '').trim();
            const qty = parseInt(String(row[1] || '')) || 1;
            if (sku) {
              items.push({ sku, quantity: qty });
            }
          });

          validateItems(items);
        } catch (err) {
          console.error(err);
          toast.error('Error al procesar el archivo Excel.');
        }
      };
      reader.readAsArrayBuffer(file);
    } else {
      toast.error('Formato de archivo no soportado. Sube un archivo .xlsx, .xls o .csv');
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragOver(true);
    } else if (e.type === 'dragleave') {
      setDragOver(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileUpload(e.dataTransfer.files[0]);
    }
  };



  if (loading || !accessToken) {
    return (
      <div className="py-24 flex flex-col items-center justify-center gap-4 text-zinc-400">
        <Loader2 className="h-8 w-8 text-blue-600 animate-spin" />
        <p className="text-xs font-black uppercase tracking-widest">
          Cargando sesión segura B2B...
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* ── Tabs selector ── */}
      <div className="flex flex-wrap gap-2 p-1.5 bg-zinc-200/50 rounded-2xl border border-zinc-200 max-w-fit shadow-inner">
        {[
          { id: 'manual', label: '1. Copia y pega SKUs' },
          { id: 'file', label: '2. Carga planilla Excel/CSV' },
          { id: 'category', label: '3. Compra por Categorías' }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => {
              if (tab.id === 'category') {
                router.push('/products');
                return;
              }
              setActiveTab(tab.id as any);
              setValidatedResults([]); // clear validations when switching tabs
            }}
            className={`px-6 py-3 rounded-xl text-xs font-black uppercase tracking-wider transition-all duration-300 ${
              activeTab === tab.id
                ? 'bg-zinc-950 text-white shadow-lg shadow-zinc-950/20 scale-[1.02]'
                : 'text-zinc-500 hover:text-zinc-950 hover:bg-zinc-300/40'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* ── Content View ── */}
      <div className="bg-white rounded-[40px] border border-zinc-150 p-8 lg:p-10 shadow-[0_32px_64px_-16px_rgba(0,0,0,0.03)] min-h-[450px] relative overflow-hidden">
        
        {/* TAB 1: Copia y Pega */}
        {activeTab === 'manual' && (
          <div className="space-y-6 animate-in fade-in duration-300">
            <div className="p-6 rounded-2xl bg-zinc-50 border border-zinc-100 flex flex-col gap-2">
              <h2 className="text-base font-black text-zinc-950 uppercase tracking-tight">
                Copia y pega uno o varios SKU
              </h2>
              <p className="text-xs text-zinc-500 font-medium leading-relaxed">
                Pega o escribe el número de SKU, seguido de una coma y luego la cantidad deseada. Ejemplo: <span className="font-mono bg-zinc-200 px-1.5 py-0.5 rounded font-bold">PROD-TEST-66,5</span>. Para agregar más productos, presiona <span className="font-bold text-zinc-700">"Enter"</span> y repite el mismo formato. Luego presiona <span className="font-black text-blue-600">“Validar”</span> para comprobar que los datos estén correctamente ingresados.
              </p>
            </div>

            <textarea
              value={manualText}
              onChange={(e) => setManualText(e.target.value)}
              placeholder="Ejemplo:&#10;PROD-TEST-66,5&#10;PROD-TEST-67,12"
              className="w-full h-44 rounded-2xl bg-zinc-50 border border-zinc-250 p-5 text-sm font-mono focus:ring-2 focus:ring-zinc-950 outline-none transition-all placeholder:text-zinc-400"
            />

            <div className="flex gap-4">
              <Button
                onClick={handleManualValidate}
                disabled={isValidating || !manualText.trim()}
                className="h-12 px-8 bg-zinc-950 hover:bg-zinc-800 text-white rounded-xl text-xs font-black uppercase tracking-widest flex items-center gap-2 cursor-pointer transition-all"
              >
                {isValidating ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                Validar Productos
              </Button>
            </div>
          </div>
        )}

        {/* TAB 2: Carga archivo Excel/CSV */}
        {activeTab === 'file' && (
          <div className="space-y-6 animate-in fade-in duration-300">
            <div className="p-6 rounded-2xl bg-zinc-50 border border-zinc-100 flex flex-col gap-2">
              <h2 className="text-base font-black text-zinc-950 uppercase tracking-tight">
                Sube o arrastra tu lista en formato Excel o CSV
              </h2>
              <p className="text-xs text-zinc-500 font-medium leading-relaxed">
                Carga un archivo Excel (.xlsx, .xls) o CSV con dos columnas: una para los SKUs y otra para las cantidades correspondientes. Para facilitar el proceso, puedes descargar nuestro archivo modelo a continuación. Luego presiona <span className="font-black text-blue-600">“Validar”</span> para comprobar que el documento esté en el formato correcto.
              </p>
            </div>

            <div 
              onDragEnter={handleDrag}
              onDragOver={handleDrag}
              onDragLeave={handleDrag}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`w-full py-16 rounded-3xl border-2 border-dashed flex flex-col items-center justify-center gap-4 cursor-pointer transition-all duration-300 ${
                dragOver 
                  ? 'border-blue-600 bg-blue-50/50 scale-[0.99]' 
                  : 'border-zinc-200 hover:border-zinc-400 hover:bg-zinc-50/30'
              }`}
            >
              <input 
                type="file" 
                ref={fileInputRef} 
                onChange={(e) => e.target.files && handleFileUpload(e.target.files[0])}
                accept=".csv, .xlsx, .xls"
                className="hidden" 
              />
              <div className="p-4 bg-zinc-100 rounded-full text-zinc-500">
                <UploadCloud className="h-8 w-8" />
              </div>
              <div className="text-center space-y-1">
                <p className="text-sm font-black text-zinc-950 uppercase tracking-tight">
                  Arrastra tu archivo aquí o haz clic para buscar
                </p>
                <p className="text-xs text-zinc-400 font-bold uppercase tracking-widest">
                  Soporta formatos .xlsx, .xls y .csv delimitados por comas o punto y coma
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-4 pt-4 border-t border-zinc-100">
              <a 
                href="/templates/modelo_compra_rapida.xlsx" 
                download
                className="flex items-center gap-2 text-xs font-black text-blue-600 hover:text-blue-700 transition-colors uppercase tracking-wider border-b-2 border-blue-600/10 hover:border-blue-600"
              >
                <Download className="h-4 w-4" />
                Descargar modelo de hoja de cálculo (Excel)
              </a>

              {isValidating && (
                <div className="flex items-center gap-2 text-xs font-black text-zinc-500 uppercase tracking-wider">
                  <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
                  Procesando planilla...
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── Validation Grid Table (Shared by Tab 1 & Tab 2) ── */}
        {validatedResults.length > 0 && (activeTab === 'manual' || activeTab === 'file') && (
          <div className="mt-12 space-y-6 pt-10 border-t border-zinc-100 animate-in slide-in-from-bottom-6 duration-500">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-black text-zinc-950 tracking-tight uppercase">
                Productos Validados ({validatedResults.length})
              </h3>
              
              <div className="flex items-center gap-4 text-xs font-bold text-zinc-500">
                <span className="flex items-center gap-1.5"><CheckCircle2 className="h-4 w-4 text-emerald-500" /> Válidos</span>
                <span className="flex items-center gap-1.5"><AlertCircle className="h-4 w-4 text-amber-500" /> Advertencias</span>
                <span className="flex items-center gap-1.5"><XCircle className="h-4 w-4 text-red-500" /> Inválidos</span>
              </div>
            </div>

            <div className="overflow-x-auto rounded-2xl border border-zinc-150">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-zinc-50 text-[10px] font-black uppercase text-zinc-400 tracking-wider border-b border-zinc-150">
                    <th className="py-4 px-6 w-[80px]">Estado</th>
                    <th className="py-4 px-6 w-[120px]">SKU</th>
                    <th className="py-4 px-6">Producto</th>
                    <th className="py-4 px-6 w-[140px] text-right">Precio B2B (Neto)</th>
                    <th className="py-4 px-6 w-[150px] text-center">Cantidad</th>
                    <th className="py-4 px-6 w-[140px] text-right">Subtotal Neto</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100 text-sm font-medium text-zinc-900">
                  {validatedResults.map((result, idx) => {
                    const isOk = result.isValid && result.product;
                    const hasWarning = result.warnings && result.warnings.length > 0;
                    
                    return (
                      <tr key={idx} className={`${!result.product ? 'bg-red-50/20' : hasWarning ? 'bg-amber-50/10' : ''}`}>
                        {/* Status Icon */}
                        <td className="py-4 px-6">
                          {!result.product ? (
                            <span title={result.error}><XCircle className="h-5 w-5 text-red-500" /></span>
                          ) : hasWarning ? (
                            <span title={result.warnings?.join(', ')}><AlertCircle className="h-5 w-5 text-amber-500" /></span>
                          ) : (
                            <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                          )}
                        </td>

                        {/* SKU */}
                        <td className="py-4 px-6 font-mono text-xs font-bold text-zinc-500">
                          {result.sku}
                        </td>

                        {/* Product Detail */}
                        <td className="py-4 px-6">
                          {result.product ? (
                            <div className="flex items-center gap-3">
                              {result.product.image ? (
                                <div className="w-10 h-10 relative rounded-lg bg-zinc-50 border border-zinc-100 overflow-hidden shrink-0 flex items-center justify-center p-1">
                                  <img src={result.product.image} className="object-contain max-h-full max-w-full" alt="" />
                                </div>
                              ) : null}
                              <div className="space-y-0.5">
                                <span className="text-[10px] font-black uppercase text-zinc-400 tracking-wider">{result.product.brand}</span>
                                <p className="font-bold text-zinc-950 uppercase text-xs line-clamp-1">{result.product.name}</p>
                                {hasWarning && (
                                  <div className="text-[10px] font-bold text-amber-600 flex flex-col gap-0.5 mt-1">
                                    {result.warnings?.map((w, wIdx) => (
                                      <span key={wIdx} className="flex items-center gap-1">⚠️ {w}</span>
                                    ))}
                                  </div>
                                )}
                              </div>
                            </div>
                          ) : (
                            <span className="text-red-500 text-xs font-bold uppercase tracking-tight">
                              SKU incorrecto o inactivo en catálogo
                            </span>
                          )}
                        </td>

                        {/* Price B2B */}
                        <td className="py-4 px-6 text-right font-mono text-xs font-bold">
                          {result.product ? (
                            <div className="space-y-0.5">
                              <p className="text-zinc-950">${Math.round(result.product.price.discountedNetPrice || result.product.price.unitNetPrice).toLocaleString('es-CL')}</p>
                              {result.product.price.discountPercent > 0 && (
                                <span className="text-[9px] bg-red-100 text-red-600 px-1 py-0.5 rounded font-black">
                                  -{result.product.price.discountPercent}%
                                </span>
                              )}
                            </div>
                          ) : '—'}
                        </td>

                        {/* Quantity Stepper */}
                        <td className="py-4 px-6">
                          {result.product ? (
                            <div className="flex items-center justify-center">
                              <div className="flex items-center border border-zinc-200 rounded-xl bg-zinc-50 p-1">
                                <button 
                                  type="button"
                                  onClick={() => updateValidatedQty(idx, result.requestedQty - (result.product?.inner || 1))}
                                  disabled={result.requestedQty <= (result.product?.inner || 1)}
                                  className="p-1.5 hover:bg-white rounded-lg text-zinc-500 transition-colors disabled:opacity-20 disabled:cursor-not-allowed"
                                >
                                  <Minus className="h-3.5 w-3.5" />
                                </button>
                                <div className="w-12 text-center text-xs font-black select-none">
                                  {result.requestedQty}
                                </div>
                                <button 
                                  type="button"
                                  onClick={() => updateValidatedQty(idx, result.requestedQty + (result.product?.inner || 1))}
                                  disabled={result.requestedQty >= Number(result.product?.stockQuantity)}
                                  className="p-1.5 hover:bg-white rounded-lg text-zinc-500 transition-colors disabled:opacity-20 disabled:cursor-not-allowed"
                                >
                                  <Plus className="h-3.5 w-3.5" />
                                </button>
                              </div>
                            </div>
                          ) : '—'}
                        </td>

                        {/* Line Total (Neto) */}
                        <td className="py-4 px-6 text-right font-mono text-xs font-black text-zinc-950">
                          {result.product 
                            ? `$${Math.round((result.product.price.discountedNetPrice || result.product.price.unitNetPrice) * result.requestedQty).toLocaleString('es-CL')}`
                            : '—'
                          }
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className="flex justify-end gap-4">
              <button
                type="button"
                onClick={() => setValidatedResults([])}
                className="h-12 px-6 rounded-xl text-xs font-black uppercase tracking-widest border border-zinc-300 bg-white hover:bg-zinc-50 text-zinc-700 hover:text-zinc-950 transition-all duration-200 cursor-pointer flex items-center justify-center shadow-sm"
              >
                Limpiar todo
              </button>
              <Button
                onClick={addValidatedToCart}
                className="h-12 px-8 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-black uppercase tracking-widest flex items-center gap-2 cursor-pointer shadow-lg shadow-blue-600/10 hover:scale-[1.02] active:scale-[0.98] transition-all"
              >
                <ShoppingCart className="h-4 w-4" />
                Agregar al Carro
              </Button>
            </div>
          </div>
        )}




      </div>
    </div>
  );
}
