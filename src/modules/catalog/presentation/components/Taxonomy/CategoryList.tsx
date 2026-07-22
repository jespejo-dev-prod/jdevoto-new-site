'use client';

/**
 * src/modules/catalog/presentation/components/Taxonomy/CategoryList.tsx
 */

import { useState } from 'react';
import { useCategories } from '../../hooks/useTaxonomy';
import { 
  Plus, 
  Trash2, 
  Tag, 
  Loader2, 
  Link as LinkIcon, 
  Pencil, 
  X, 
  Check,
  CornerDownRight,
  ChevronRight,
  ChevronDown
} from 'lucide-react';
import { slugify } from '@/lib/slugify';
import { Category } from '@prisma/client';

type CategoryWithParent = Category & { parent?: { name: string } | null };

export function CategoryList() {
  const { data: categories = [], isLoading, createCategory, deleteCategory, updateCategory } = useCategories();
  
  // Estado para el formulario
  const [editingId, setEditingId] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [description, setDescription] = useState('');
  const [parentId, setParentId] = useState<string | null>(null);

  // Estado para colapsar/expandir categorías
  const [expandedIds, setExpandedIds] = useState<Record<string, boolean>>({});

  const resetForm = () => {
    setEditingId(null);
    setName('');
    setSlug('');
    setDescription('');
    setParentId(null);
  };

  const handleNameChange = (newName: string) => {
    setName(newName);
    // Auto-generar slug solo si no estamos editando uno existente
    if (!editingId) {
      setSlug(slugify(newName));
    }
  };

  const handleEdit = (category: CategoryWithParent) => {
    setEditingId(category.id);
    setName(category.name);
    setSlug(category.slug);
    setDescription(category.description || '');
    setParentId(category.parentId || null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !slug) return;

    try {
      if (editingId) {
        await updateCategory.mutateAsync({
          id: editingId,
          data: {
            name,
            slug: slug.toLowerCase().replace(/ /g, '-'),
            description: description || null,
            parentId: parentId || null,
          },
        });
      } else {
        await createCategory.mutateAsync({
          name,
          slug: slug.toLowerCase().replace(/ /g, '-'),
          description: description || null,
          parentId: parentId || null,
        });
      }
      resetForm();
    } catch (e) {}
  };

  const toggleExpand = (id: string) => {
    setExpandedIds(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  const hasChildren = (catId: string) => {
    return categories.some(child => child.parentId === catId);
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <Loader2 className="h-8 w-8 text-primary animate-spin" />
        <p className="text-zinc-500 font-medium">Cargando categorías...</p>
      </div>
    );
  }

  // Algoritmo de aplanamiento recursivo para ordenar categorías en cascada (árbol)
  const orderedCategories: { category: CategoryWithParent; depth: number }[] = [];
  const visited = new Set<string>();

  const addCategoryAndChildren = (cat: CategoryWithParent, depth: number) => {
    if (visited.has(cat.id)) return;
    visited.add(cat.id);
    
    orderedCategories.push({ category: cat, depth });
    
    // Buscar hijos de esta categoría y ordenarlos alfabéticamente
    const children = categories
      .filter((child) => child.parentId === cat.id)
      .sort((a, b) => a.name.localeCompare(b.name));

    children.forEach((child) => addCategoryAndChildren(child, depth + 1));
  };

  // Encontrar todas las categorías raíz (no tienen padre, o su padre no existe en la lista de categorías) y ordenarlas alfabéticamente
  const roots = categories
    .filter((cat) => !cat.parentId || !categories.some((p) => p.id === cat.parentId))
    .sort((a, b) => a.name.localeCompare(b.name));

  roots.forEach((root) => addCategoryAndChildren(root, 0));

  // Agregar categorías huérfanas o cíclicas que queden sin visitar por seguridad
  categories.forEach((cat) => {
    if (!visited.has(cat.id)) {
      addCategoryAndChildren(cat, 0);
    }
  });

  // Filtrar categorías visibles según su estado de expansión
  const isVisible = (cat: CategoryWithParent) => {
    let currentParentId = cat.parentId;
    while (currentParentId) {
      // Si el padre no existe en el listado o no está expandido, ocultamos el hijo
      if (!expandedIds[currentParentId]) {
        return false;
      }
      const parent = categories.find(c => c.id === currentParentId);
      currentParentId = parent ? parent.parentId : null;
    }
    return true;
  };

  const visibleCategories = orderedCategories.filter(({ category }) => isVisible(category));

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
      {/* Formulario Lateral */}
      <div className="lg:col-span-4">
        <div className="bg-zinc-900/40 border border-zinc-800 rounded-2xl p-6 sticky top-24">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              {editingId ? <Pencil className="h-5 w-5 text-primary" /> : <Plus className="h-5 w-5 text-primary" />}
              {editingId ? 'Editar Categoría' : 'Nueva Categoría'}
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
            <div className="space-y-2">
              <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Nombre</label>
              <input
                type="text"
                value={name}
                onChange={(e) => handleNameChange(e.target.value)}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl h-12 px-4 text-sm text-white focus:border-primary/50 outline-none transition-all"
                placeholder="Ej: Accesorios de Baño"
                required
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Slug (URL)</label>
              <div className="relative">
                <input
                  type="text"
                  value={slug}
                  onChange={(e) => setSlug(e.target.value.toLowerCase())}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl h-10 px-4 text-sm text-zinc-400 focus:border-primary/50 outline-none transition-all font-mono"
                  placeholder="ej-accesorios-de-banio"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Categoría Padre (Opcional)</label>
              <select
                value={parentId || ''}
                onChange={(e) => setParentId(e.target.value || null)}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl h-12 px-4 text-sm text-white focus:border-primary/50 outline-none transition-all font-sans"
              >
                <option value="">Ninguna (Categoría Raíz)</option>
                {orderedCategories
                  .filter(({ category: cat }) => cat.id !== editingId) // Evitar seleccionarse a sí misma como padre
                  .map(({ category: cat, depth }) => (
                    <option key={cat.id} value={cat.id}>
                      {'\u00A0'.repeat(depth * 3)}{depth > 0 ? '└─ ' : ''}{cat.name}
                    </option>
                  ))}
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Descripción</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-4 text-sm text-white focus:border-primary/50 outline-none transition-all min-h-[100px] resize-none"
                placeholder="Breve descripción..."
              />
            </div>

            <button
              type="submit"
              disabled={createCategory.isPending || updateCategory.isPending}
              className="w-full bg-primary hover:bg-primary/90 disabled:opacity-50 text-black font-bold text-sm h-12 rounded-xl transition-all flex items-center justify-center gap-2"
            >
              {createCategory.isPending || updateCategory.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <>
                  {editingId ? <Check className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
                  {editingId ? 'Guardar Cambios' : 'Crear Categoría'}
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
              <tr className="bg-zinc-950/60 border-b border-zinc-800 text-xs font-bold text-zinc-500 uppercase tracking-widest">
                <th className="px-6 py-4">Categoría</th>
                <th className="px-6 py-4">Slug</th>
                <th className="px-6 py-4 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/50">
              {visibleCategories.map(({ category: cat, depth }) => {
                const isChild = depth > 0;
                return (
                  <tr 
                    key={cat.id} 
                    className={`group transition-colors ${
                      isChild 
                        ? 'bg-zinc-900/10 hover:bg-zinc-800/10 border-l-2 border-primary/20' 
                        : 'hover:bg-zinc-800/20'
                    }`}
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2" style={{ paddingLeft: `${depth * 20}px` }}>
                        {/* Botón de expandir/colapsar si tiene hijos */}
                        {hasChildren(cat.id) ? (
                          <button
                            type="button"
                            onClick={() => toggleExpand(cat.id)}
                            className="p-1 rounded hover:bg-zinc-800 text-zinc-400 hover:text-white transition-colors"
                            title={expandedIds[cat.id] ? 'Contraer subcategorías' : 'Expandir subcategorías'}
                          >
                            {expandedIds[cat.id] ? (
                              <ChevronDown className="h-4 w-4 shrink-0" />
                            ) : (
                              <ChevronRight className="h-4 w-4 shrink-0" />
                            )}
                          </button>
                        ) : (
                          // Espaciador para alinear si no tiene hijos
                          <div className="w-6 h-6 shrink-0" />
                        )}

                        {isChild && (
                          <CornerDownRight className="h-4 w-4 text-primary shrink-0 -ml-2" />
                        )}
                        <div className="h-9 w-9 rounded-lg bg-zinc-950 border border-zinc-800 flex items-center justify-center text-zinc-500 shrink-0">
                          <Tag className="h-4.5 w-4.5" />
                        </div>
                        <div>
                          <p className={`text-base leading-tight ${isChild ? 'font-medium text-zinc-300' : 'font-bold text-white'}`}>
                            {cat.name}
                          </p>
                          <p className="text-sm text-zinc-500 line-clamp-1 mt-1">
                            {cat.description || 'Sin descripción'}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2 text-zinc-500 font-mono text-sm">
                        <LinkIcon className="h-3 w-3" />
                        {cat.slug}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => handleEdit(cat)}
                          className="p-2 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-500 hover:text-primary hover:border-primary/40 transition-all"
                          title="Editar"
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={() => {
                            if (confirm('¿Estás seguro de eliminar esta categoría?')) {
                              deleteCategory.mutate(cat.id);
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
                );
              })}
              {categories.length === 0 && (
                <tr>
                  <td colSpan={3} className="px-6 py-12 text-center text-zinc-500 italic">
                    No hay categorías registradas.
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
