'use client';

/**
 * src/modules/catalog/presentation/components/Taxonomy/BrandList.tsx
 */

import { useState, useRef } from 'react';
import { useBrands } from '../../hooks/useTaxonomy';
import { 
  Plus, 
  Trash2, 
  Shield, 
  Loader2, 
  Link as LinkIcon, 
  Image as ImageIcon, 
  Pencil, 
  X,
  Upload,
  Check
} from 'lucide-react';
import { slugify } from '@/lib/slugify';
import Image from 'next/image';
import { Brand } from '@prisma/client';
import { toast } from 'sonner';
import { useAuth } from '@/context/auth-context';

export function BrandList() {
  const { data: brands = [], isLoading, createBrand, deleteBrand, updateBrand } = useBrands();
  const { accessToken } = useAuth();
  
  // Estado para el formulario
  const [editingId, setEditingId] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [description, setDescription] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  
  // Estado para subida de imagen
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const resetForm = () => {
    setEditingId(null);
    setName('');
    setSlug('');
    setDescription('');
    setImageUrl('');
  };

  const handleNameChange = (newName: string) => {
    setName(newName);
    if (!editingId) {
      setSlug(slugify(newName));
    }
  };

  const handleEdit = (brand: Brand) => {
    setEditingId(brand.id);
    setName(brand.name);
    setSlug(brand.slug);
    setDescription(brand.description || '');
    setImageUrl(brand.imageUrl || '');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !slug) return;

    try {
      if (editingId) {
        await updateBrand.mutateAsync({
          id: editingId,
          data: {
            name,
            slug: slug.toLowerCase().replace(/ /g, '-'),
            description: description || null,
            imageUrl: imageUrl || null,
          },
        });
      } else {
        await createBrand.mutateAsync({
          name,
          slug: slug.toLowerCase().replace(/ /g, '-'),
          description: description || null,
          imageUrl: imageUrl || null,
        });
      }
      resetForm();
    } catch (e) {}
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await fetch('/api/upload/temp', {
        method: 'POST',
        body: formData,
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      });

      if (!res.ok) throw new Error('Error al subir imagen');

      const data = await res.json();
      setImageUrl(data.url);
      toast.success('Imagen subida correctamente');
    } catch (error) {
      toast.error('No se pudo subir la imagen');
    } finally {
      setIsUploading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <Loader2 className="h-8 w-8 text-primary animate-spin" />
        <p className="text-zinc-500 font-medium">Cargando marcas...</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
      {/* Formulario Lateral */}
      <div className="lg:col-span-4">
        <div className="bg-zinc-900/40 border border-zinc-800 rounded-2xl p-6 sticky top-24">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              {editingId ? <Pencil className="h-5 w-5 text-primary" /> : <Plus className="h-5 w-5 text-primary" />}
              {editingId ? 'Editar Marca' : 'Nueva Marca'}
            </h2>
            {editingId && (
              <button 
                onClick={resetForm}
                className="text-zinc-500 hover:text-white transition-colors"
                title="Cancelar edición"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Nombre */}
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Nombre</label>
              <input
                type="text"
                value={name}
                onChange={(e) => handleNameChange(e.target.value)}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl h-12 px-4 text-white focus:border-primary/50 outline-none transition-all"
                placeholder="Ej: Samsung"
                required
              />
            </div>

            {/* Slug */}
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Slug (URL)</label>
              <input
                type="text"
                value={slug}
                onChange={(e) => setSlug(e.target.value.toLowerCase())}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl h-10 px-4 text-xs text-zinc-400 focus:border-primary/50 outline-none transition-all font-mono"
                placeholder="samsung-electronics"
                required
              />
            </div>

            {/* Imagen / Logo */}
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Imagen / Logo</label>
              
              <div className="relative group">
                <div className="h-32 w-full rounded-xl bg-zinc-950 border border-dashed border-zinc-800 flex flex-col items-center justify-center overflow-hidden transition-all group-hover:border-primary/30">
                  {imageUrl ? (
                    <>
                      <Image
                        src={imageUrl}
                        alt="Preview"
                        fill
                        className="object-contain p-2"
                      />
                      <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                        <button 
                          type="button"
                          onClick={() => fileInputRef.current?.click()}
                          className="p-2 rounded-lg bg-zinc-900 text-white hover:bg-zinc-800 transition-all"
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button 
                          type="button"
                          onClick={() => setImageUrl('')}
                          className="p-2 rounded-lg bg-red-900 text-white hover:bg-red-800 transition-all"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </>
                  ) : (
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={isUploading}
                      className="flex flex-col items-center gap-2 text-zinc-500 hover:text-zinc-300 transition-colors"
                    >
                      {isUploading ? (
                        <Loader2 className="h-6 w-6 animate-spin text-primary" />
                      ) : (
                        <>
                          <Upload className="h-6 w-6" />
                          <span className="text-[11px] font-medium uppercase tracking-wider">Subir Logo</span>
                        </>
                      )}
                    </button>
                  )}
                </div>
                <input 
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileUpload}
                  accept="image/*"
                  className="hidden"
                />
              </div>
              
              <div className="flex gap-2 items-center">
                <div className="h-px flex-1 bg-zinc-800" />
                <span className="text-[9px] text-zinc-600 font-bold uppercase">O usa una URL</span>
                <div className="h-px flex-1 bg-zinc-800" />
              </div>

              <input
                type="text"
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl h-10 px-4 text-[11px] text-zinc-400 focus:border-primary/50 outline-none transition-all"
                placeholder="/api/files/..."
              />
            </div>

            {/* Descripción */}
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Descripción</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-4 text-white focus:border-primary/50 outline-none transition-all min-h-[100px] resize-none"
                placeholder="Breve descripción..."
              />
            </div>

            <button
              type="submit"
              disabled={createBrand.isPending || updateBrand.isPending || isUploading}
              className="w-full bg-primary hover:bg-primary/90 disabled:opacity-50 text-black font-bold h-12 rounded-xl transition-all flex items-center justify-center gap-2"
            >
              {createBrand.isPending || updateBrand.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <>
                  {editingId ? <Check className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
                  {editingId ? 'Guardar Cambios' : 'Crear Marca'}
                </>
              )}
            </button>
          </form>
        </div>
      </div>

      {/* Listado Principal */}
      <div className="lg:col-span-8">
        <div className="bg-zinc-900/40 border border-zinc-800 rounded-2xl overflow-hidden shadow-2xl">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-zinc-950/60 border-b border-zinc-800 text-[10px] font-bold text-zinc-500 uppercase tracking-widest">
                <th className="px-6 py-4">Marca</th>
                <th className="px-6 py-4">Slug</th>
                <th className="px-6 py-4 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/50">
              {brands.map((brand) => (
                <tr key={brand.id} className="group hover:bg-zinc-800/20 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-lg bg-zinc-950 border border-zinc-800 flex items-center justify-center text-zinc-500 relative overflow-hidden flex-shrink-0">
                        {brand.imageUrl ? (
                          <Image
                            src={brand.imageUrl}
                            alt={brand.name}
                            fill
                            className="object-contain p-1 opacity-90 group-hover:opacity-100 transition-opacity"
                          />
                        ) : (
                          <Shield className="h-5 w-5" />
                        )}
                      </div>
                      <div>
                        <p className="text-sm font-bold text-white leading-tight">{brand.name}</p>
                        <p className="text-[10px] text-zinc-500 line-clamp-1">{brand.description || 'Sin descripción'}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2 text-zinc-500 font-mono text-[10px]">
                      <LinkIcon className="h-3 w-3" />
                      {brand.slug}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() => handleEdit(brand)}
                        className="p-2 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-500 hover:text-primary hover:border-primary/40 transition-all"
                        title="Editar"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={() => {
                          if (confirm('¿Estás seguro de eliminar esta marca?')) {
                            deleteBrand.mutate(brand.id);
                          }
                        }}
                        className="p-2 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-500 hover:text-red-400 hover:border-red-500/40 transition-all"
                        title="Eliminar"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {brands.length === 0 && (
                <tr>
                  <td colSpan={3} className="px-6 py-12 text-center text-zinc-500 italic">
                    No hay marcas registradas.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
