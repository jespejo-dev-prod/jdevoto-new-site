import { useFormContext } from "react-hook-form";
import { CreateProductInput } from "@/validations/product.schemas";
import { Category, Brand } from "@/modules/catalog/application/hooks/useCatalogData";
import { Loader2 } from "lucide-react";

interface ClassificationCardProps {
  categories: Category[];
  brands: Brand[];
  isLoading?: boolean;
}

export function ClassificationCard({ categories, brands, isLoading }: ClassificationCardProps) {
  const { register, setValue, watch } = useFormContext<CreateProductInput>();
  const categoryId = watch("categoryId");
  const brandId = watch("brandId");

  console.log("DEBUG ClassificationCard - categoryId:", categoryId);
  console.log("DEBUG ClassificationCard - brandId:", brandId);
  console.log("DEBUG ClassificationCard - categories count:", categories.length);
  console.log("DEBUG ClassificationCard - brands count:", brands.length);

  // Filtramos las categorías de primer nivel (Padres)
  const parentCategories = categories.filter(c => !c.parentId);

  // Obtener los hijos asociados a un ID padre
  const getChildren = (parentId: string) => {
    return categories.filter(c => c.parentId === parentId);
  };

  // Manejar el toggle del checkbox (enfoque de selección única alineado a la base de datos)
  const handleCategoryCheck = (id: string) => {
    if (categoryId === id) {
      // Si ya está seleccionada, la desmarcamos
      setValue("categoryId", "", { shouldDirty: true, shouldValidate: true });
    } else {
      // Si marcamos otra, desmarcamos el resto asignando la nueva ID
      setValue("categoryId", id, { shouldDirty: true, shouldValidate: true });
    }
  };

  return (
    <div className="space-y-6">
      {/* ─── CARD DE CATEGORÍAS (Estilo WordPress) ───────────────────────────── */}
      <div className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-6 space-y-4 shadow-xl">
        <h3 className="text-[10px] font-bold text-white uppercase tracking-widest border-b border-zinc-800 pb-4 flex justify-between items-center">
          Categorías del producto
          {isLoading && <Loader2 className="h-3 w-3 animate-spin text-primary" />}
        </h3>
        
        {/* Contenedor con barra de desplazamiento personalizada */}
        <div className="border border-zinc-800/80 rounded-xl bg-zinc-950/60 p-4 space-y-3.5 max-h-[280px] overflow-y-auto custom-scrollbar text-[11px] shadow-inner">
          {isLoading ? (
            <div className="text-zinc-500 text-center py-6 flex items-center justify-center gap-2">
              <Loader2 className="h-3.5 w-3.5 animate-spin text-primary" />
              Cargando categorías...
            </div>
          ) : parentCategories.length === 0 ? (
            <div className="text-zinc-500 text-center py-6">No hay categorías registradas</div>
          ) : (
            parentCategories
              .sort((a, b) => a.name.localeCompare(b.name, "es"))
              .map((parent) => {
                const children = getChildren(parent.id);
                const isParentChecked = categoryId === parent.id;
                
                return (
                  <div key={parent.id} className="space-y-2">
                    {/* Fila Categoría Padre */}
                    <label className="flex items-center gap-3 text-zinc-100 hover:text-white cursor-pointer select-none font-bold py-0.5 group transition-colors">
                      <input
                        type="checkbox"
                        checked={isParentChecked}
                        onChange={() => handleCategoryCheck(parent.id)}
                        className="rounded border-zinc-800 bg-zinc-900 text-primary focus:ring-0 focus:ring-offset-0 h-3.5 w-3.5 accent-primary cursor-pointer transition-colors group-hover:border-zinc-600"
                      />
                      <span className="tracking-tight uppercase">{parent.name}</span>
                    </label>

                    {/* Fila Categorías Hijas (Desplazadas) */}
                    {children.length > 0 && (
                      <div className="pl-6 space-y-2 border-l border-zinc-800/60 ml-1.5 py-0.5">
                        {children
                          .sort((a, b) => a.name.localeCompare(b.name, "es"))
                          .map((child) => {
                            const isChildChecked = categoryId === child.id;
                            // Si el nombre de la hija ya tiene el formato "PADRE > HIJA", mostramos solo el tramo de la hija
                            const displayName = child.name.includes(" > ") 
                              ? child.name.split(" > ")[1] 
                              : child.name;

                            return (
                              <label key={child.id} className="flex items-center gap-3 text-zinc-400 hover:text-zinc-200 cursor-pointer select-none py-0.5 group transition-colors">
                                <input
                                  type="checkbox"
                                  checked={isChildChecked}
                                  onChange={() => handleCategoryCheck(child.id)}
                                  className="rounded border-zinc-800 bg-zinc-900 text-primary focus:ring-0 focus:ring-offset-0 h-3.5 w-3.5 accent-primary cursor-pointer transition-colors group-hover:border-zinc-600"
                                />
                                <span className="tracking-tight">{displayName}</span>
                              </label>
                            );
                          })}
                      </div>
                    )}
                  </div>
                );
              })
          )}
        </div>
      </div>

      {/* ─── CARD DE MARCA ─────────────────────────────────────────────────── */}
      <div className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-6 space-y-4 shadow-xl">
        <h3 className="text-[10px] font-bold text-white uppercase tracking-widest border-b border-zinc-800 pb-4 flex justify-between items-center">
          Marca del producto
          {isLoading && <Loader2 className="h-3 w-3 animate-spin text-primary" />}
        </h3>
        
        <div className="relative">
          <select
            className="w-full h-10 px-3 rounded-xl bg-zinc-950 border border-zinc-800 text-[11px] text-white focus:outline-none focus:border-primary/50 transition-colors disabled:opacity-50 cursor-pointer"
            {...register("brandId")}
            value={brandId || ""}
            disabled={isLoading}
          >
            <option value="">{isLoading ? "Cargando marcas..." : "Seleccionar Marca..."}</option>
            {brands
              .sort((a, b) => a.name.localeCompare(b.name, "es"))
              .map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name}
                </option>
              ))}
          </select>
        </div>
      </div>
    </div>
  );
}
