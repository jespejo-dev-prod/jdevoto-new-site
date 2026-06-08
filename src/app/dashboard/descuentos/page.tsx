'use client';

import { useState, useEffect, useCallback } from 'react';
import { 
  Ticket, Plus, Trash2, Tag, Shield, 
  Layers, AlertCircle, CheckCircle2, Loader2,
  Pencil, X
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { useAuth } from '@/context/auth-context';

interface Category {
  id: string;
  name: string;
  slug: string;
  isOutlet?: boolean;
}

interface Brand {
  id: string;
  name: string;
  slug: string;
}

interface Promotion {
  id: string;
  name: string;
  discount: number;
  categoryId: string | null;
  brandId: string | null;
  category: Category | null;
  brand: Brand | null;
  isActive: boolean;
  validFrom: string | null;
  validTo: string | null;
  createdAt: string;
}

type DiscountType = 'CATEGORY' | 'BRAND' | 'COMBINED';

export default function DescuentosPage() {
  const { accessToken } = useAuth();
  const headers = { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' };

  // Data
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Form
  const [discountType, setDiscountType] = useState<DiscountType>('CATEGORY');
  const [selectedCategoryId, setSelectedCategoryId] = useState('');
  const [selectedBrandId, setSelectedBrandId] = useState('');
  const [discountPercent, setDiscountPercent] = useState('');
  const [promoName, setPromoName] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);

  // ─── Fetch Data ──────────────────────────────────────────────────────────────

  const fetchPromotions = useCallback(async () => {
    try {
      const res = await fetch('/api/promotions', { headers });
      if (!res.ok) return;
      const json = await res.json();
      if (json.success) setPromotions(json.data);
    } catch (err) {
      console.error('Error fetching promotions', err);
    }
  }, [accessToken]);

  const fetchCategories = useCallback(async () => {
    try {
      const res = await fetch('/api/categories');
      if (!res.ok) return;
      const json = await res.json();
      if (json.success) {
        // Excluir categoría Outlet del selector
        setCategories((json.data || []).filter((c: Category) => !c.isOutlet));
      }
    } catch (err) {
      console.error('Error fetching categories', err);
    }
  }, []);

  const fetchBrands = useCallback(async () => {
    try {
      const res = await fetch('/api/brands');
      if (!res.ok) return;
      const json = await res.json();
      if (json.success) setBrands(json.data || []);
    } catch (err) {
      console.error('Error fetching brands', err);
    }
  }, []);

  useEffect(() => {
    Promise.all([fetchPromotions(), fetchCategories(), fetchBrands()]).finally(() => setLoading(false));
  }, [fetchPromotions, fetchCategories, fetchBrands]);

  // ─── Handlers ────────────────────────────────────────────────────────────────

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const discount = parseFloat(discountPercent);
    if (isNaN(discount) || discount <= 0 || discount > 100) {
      toast.error('El porcentaje debe ser entre 0.01 y 100');
      return;
    }

    // Auto-generate name if empty
    const autoName = promoName.trim() || generateName();

    setSubmitting(true);
    try {
      const url = editingId ? `/api/promotions?id=${editingId}` : '/api/promotions';
      const method = editingId ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers,
        body: JSON.stringify({
          name: autoName,
          discount,
          discountType,
          categoryId: discountType !== 'BRAND' ? selectedCategoryId || null : null,
          brandId: discountType !== 'CATEGORY' ? selectedBrandId || null : null,
        }),
      });

      const json = await res.json();
      if (!res.ok) {
        toast.error(json.error?.message || `Error al ${editingId ? 'actualizar' : 'crear'} la promoción`);
        return;
      }

      toast.success(`Promoción ${editingId ? 'actualizada' : 'creada'} exitosamente`);
      resetForm();
      fetchPromotions();
    } catch (err) {
      toast.error('Error de conexión');
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (promo: Promotion) => {
    setEditingId(promo.id);
    setPromoName(promo.name);
    setDiscountPercent(String(promo.discount));
    
    if (promo.categoryId && promo.brandId) {
      setDiscountType('COMBINED');
      setSelectedCategoryId(promo.categoryId);
      setSelectedBrandId(promo.brandId);
    } else if (promo.categoryId) {
      setDiscountType('CATEGORY');
      setSelectedCategoryId(promo.categoryId);
      setSelectedBrandId('');
    } else if (promo.brandId) {
      setDiscountType('BRAND');
      setSelectedBrandId(promo.brandId);
      setSelectedCategoryId('');
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`¿Eliminar la promoción "${name}"?`)) return;

    try {
      const res = await fetch(`/api/promotions?id=${id}`, {
        method: 'DELETE',
        headers,
      });

      if (!res.ok && res.status !== 204) {
        toast.error('Error al eliminar la promoción');
        return;
      }

      toast.success('Promoción eliminada');
      fetchPromotions();
    } catch (err) {
      toast.error('Error de conexión');
    }
  };

  const resetForm = () => {
    setDiscountType('CATEGORY');
    setSelectedCategoryId('');
    setSelectedBrandId('');
    setDiscountPercent('');
    setPromoName('');
    setEditingId(null);
  };

  const generateName = () => {
    const catName = categories.find(c => c.id === selectedCategoryId)?.name || '';
    const brandName = brands.find(b => b.id === selectedBrandId)?.name || '';
    if (discountType === 'COMBINED') return `Dcto. ${catName} + ${brandName}`;
    if (discountType === 'CATEGORY') return `Dcto. ${catName}`;
    return `Dcto. ${brandName}`;
  };

  const getDiscountTypeLabel = (promo: Promotion) => {
    if (promo.categoryId && promo.brandId) return 'Categoría + Marca';
    if (promo.categoryId) return 'Categoría';
    if (promo.brandId) return 'Marca';
    return 'General';
  };

  const getDiscountTypeBadgeColor = (promo: Promotion) => {
    if (promo.categoryId && promo.brandId) return 'bg-purple-500/10 text-purple-400 border-purple-500/20';
    if (promo.categoryId) return 'bg-blue-500/10 text-blue-400 border-blue-500/20';
    if (promo.brandId) return 'bg-amber-500/10 text-amber-400 border-amber-500/20';
    return 'bg-zinc-500/10 text-zinc-400 border-zinc-500/20';
  };

  // ─── UI ──────────────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <Loader2 className="h-8 w-8 text-primary animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 border border-primary/10 flex items-center justify-center">
            <Ticket className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-white tracking-tight">Descuentos</h1>
            <p className="text-sm text-zinc-500 font-medium">Gestiona promociones por categoría y/o marca</p>
          </div>
        </div>
        <div className="flex items-center gap-2 text-xs font-bold text-zinc-500 uppercase tracking-widest">
          <Layers className="h-4 w-4" />
          {promotions.length} activas
        </div>
      </div>

      {/* Create Form */}
      <form onSubmit={handleSubmit} className="bg-zinc-900/60 backdrop-blur-xl border border-zinc-800 rounded-3xl p-8 space-y-6">
        <div className="flex items-center gap-3 pb-4 border-b border-zinc-800">
          {editingId ? (
            <Pencil className="h-5 w-5 text-primary" />
          ) : (
            <Plus className="h-5 w-5 text-primary" />
          )}
          <h2 className="text-lg font-black text-white uppercase tracking-tight">
            {editingId ? 'Editar Descuento' : 'Agregar Descuento'}
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Tipo de Descuento */}
          <div className="space-y-2">
            <Label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Tipo de Descuento</Label>
            <select
              value={discountType}
              onChange={(e) => {
                setDiscountType(e.target.value as DiscountType);
                setSelectedCategoryId('');
                setSelectedBrandId('');
              }}
              className="w-full h-12 rounded-xl border border-zinc-700 bg-zinc-800 px-4 text-sm font-medium text-white outline-none focus:border-primary transition-all"
            >
              <option value="CATEGORY">Descuento por Categoría</option>
              <option value="BRAND">Descuento por Marca</option>
              <option value="COMBINED">Descuento por Categoría y Marca</option>
            </select>
          </div>

          {/* Categoría */}
          {(discountType === 'CATEGORY' || discountType === 'COMBINED') && (
            <div className="space-y-2">
              <Label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Selecciona una Categoría</Label>
              <select
                value={selectedCategoryId}
                onChange={(e) => setSelectedCategoryId(e.target.value)}
                required
                className="w-full h-12 rounded-xl border border-zinc-700 bg-zinc-800 px-4 text-sm font-medium text-white outline-none focus:border-primary transition-all"
              >
                <option value="">— Seleccionar —</option>
                {categories.map(cat => (
                  <option key={cat.id} value={cat.id}>{cat.name}</option>
                ))}
              </select>
            </div>
          )}

          {/* Marca */}
          {(discountType === 'BRAND' || discountType === 'COMBINED') && (
            <div className="space-y-2">
              <Label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Selecciona una Marca</Label>
              <select
                value={selectedBrandId}
                onChange={(e) => setSelectedBrandId(e.target.value)}
                required
                className="w-full h-12 rounded-xl border border-zinc-700 bg-zinc-800 px-4 text-sm font-medium text-white outline-none focus:border-primary transition-all"
              >
                <option value="">— Seleccionar —</option>
                {brands.map(brand => (
                  <option key={brand.id} value={brand.id}>{brand.name}</option>
                ))}
              </select>
            </div>
          )}

          {/* Porcentaje */}
          <div className="space-y-2">
            <Label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Porcentaje de Descuento (%)</Label>
            <Input
              type="number"
              min="0.01"
              max="100"
              step="0.01"
              placeholder="Ej: 15"
              value={discountPercent}
              onChange={(e) => setDiscountPercent(e.target.value)}
              required
              className="h-12 rounded-xl bg-zinc-800 border-zinc-700 text-white placeholder:text-zinc-600 font-medium"
            />
          </div>
        </div>

        {/* Nombre (opcional) */}
        <div className="space-y-2">
          <Label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Nombre de la Promoción (opcional)</Label>
          <Input
            placeholder="Ej: Especial Bosch Septiembre"
            value={promoName}
            onChange={(e) => setPromoName(e.target.value)}
            className="h-12 rounded-xl bg-zinc-800 border-zinc-700 text-white placeholder:text-zinc-600 font-medium max-w-lg"
          />
        </div>

        {/* Info Banner */}
        <div className="flex items-start gap-3 p-4 rounded-2xl bg-amber-500/5 border border-amber-500/10">
          <AlertCircle className="h-5 w-5 text-amber-400 shrink-0 mt-0.5" />
          <div className="text-xs text-amber-300/80 font-medium leading-relaxed">
            <strong className="text-amber-300">Importante:</strong> Los descuentos promocionales <strong>no se acumulan</strong> con los descuentos de empresa (Dcto. Empresa) ni con los descuentos por método de pago (Dcto. Pago). Los productos con promociones aplicadas reciben solo el descuento promocional. La categoría <strong>Outlet</strong> está excluida de las promociones.
          </div>
        </div>

        <div className="flex gap-4">
          <Button
            type="submit"
            disabled={submitting}
            className="h-12 px-8 bg-primary hover:bg-primary/90 text-zinc-950 font-black uppercase text-xs tracking-widest rounded-xl transition-all active:scale-[0.98] disabled:opacity-50 shadow-lg shadow-primary/20"
          >
            {submitting ? (
              <><Loader2 className="h-4 w-4 animate-spin mr-2" /> {editingId ? 'Actualizando...' : 'Creando...'}</>
            ) : (
              <>{editingId ? <Pencil className="h-4 w-4 mr-2" /> : <Plus className="h-4 w-4 mr-2" />} {editingId ? 'Actualizar Descuento' : 'Crear Descuento'}</>
            )}
          </Button>
          {editingId && (
            <Button
              type="button"
              onClick={resetForm}
              variant="ghost"
              className="h-12 px-8 border border-zinc-700 text-white font-black uppercase text-xs tracking-widest rounded-xl transition-all active:scale-[0.98]"
            >
              <X className="h-4 w-4 mr-2" /> Cancelar
            </Button>
          )}
        </div>
      </form>

      {/* Promotions Table */}
      <div className="bg-zinc-900/60 backdrop-blur-xl border border-zinc-800 rounded-3xl overflow-hidden">
        <div className="px-8 py-6 border-b border-zinc-800 flex items-center justify-between">
          <h2 className="text-lg font-black text-white uppercase tracking-tight">Descuentos Actuales</h2>
          <span className="text-xs font-bold text-zinc-500">{promotions.length} registros</span>
        </div>

        {promotions.length === 0 ? (
          <div className="px-8 py-16 text-center">
            <Ticket className="h-12 w-12 text-zinc-700 mx-auto mb-4" />
            <p className="text-sm text-zinc-500 font-medium">No hay descuentos registrados aún</p>
            <p className="text-xs text-zinc-600 mt-1">Crea tu primer descuento con el formulario de arriba</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-zinc-800">
                  <th className="text-left px-6 py-4 text-[10px] font-black text-zinc-500 uppercase tracking-widest">Nombre</th>
                  <th className="text-left px-6 py-4 text-[10px] font-black text-zinc-500 uppercase tracking-widest">Tipo</th>
                  <th className="text-left px-6 py-4 text-[10px] font-black text-zinc-500 uppercase tracking-widest">Categoría</th>
                  <th className="text-left px-6 py-4 text-[10px] font-black text-zinc-500 uppercase tracking-widest">Marca</th>
                  <th className="text-center px-6 py-4 text-[10px] font-black text-zinc-500 uppercase tracking-widest">Descuento</th>
                  <th className="text-right px-6 py-4 text-[10px] font-black text-zinc-500 uppercase tracking-widest">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {promotions.map((promo) => (
                  <tr key={promo.id} className="border-b border-zinc-800/50 hover:bg-zinc-800/30 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
                          <Ticket className="h-4 w-4 text-primary" />
                        </div>
                        <span className="font-bold text-white text-xs uppercase tracking-tight">{promo.name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider border ${getDiscountTypeBadgeColor(promo)}`}>
                        {getDiscountTypeLabel(promo)}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      {promo.category ? (
                        <span className="text-xs text-zinc-300 font-medium flex items-center gap-1.5">
                          <Tag className="h-3 w-3 text-blue-400" />
                          {promo.category.name}
                        </span>
                      ) : (
                        <span className="text-xs text-zinc-600">—</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      {promo.brand ? (
                        <span className="text-xs text-zinc-300 font-medium flex items-center gap-1.5">
                          <Shield className="h-3 w-3 text-amber-400" />
                          {promo.brand.name}
                        </span>
                      ) : (
                        <span className="text-xs text-zinc-600">—</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className="px-3 py-1.5 rounded-full bg-emerald-500/10 text-emerald-400 text-xs font-black border border-emerald-500/20">
                        {Number(promo.discount)}%
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => handleEdit(promo)}
                          className="p-2 rounded-xl hover:bg-zinc-800 text-zinc-400 hover:text-white transition-all"
                          title="Editar promoción"
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(promo.id, promo.name)}
                          className="p-2 rounded-xl hover:bg-red-500/10 text-zinc-500 hover:text-red-400 transition-all"
                          title="Eliminar promoción"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
