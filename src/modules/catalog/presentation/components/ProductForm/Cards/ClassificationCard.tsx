import { useState } from "react";
import { useFormContext } from "react-hook-form";
import { CreateProductInput } from "@/validations/product.schemas";
import { Category, Brand } from "@/modules/catalog/application/hooks/useCatalogData";
import { Loader2, ChevronDown, Search } from "lucide-react";
import { cn } from "@/lib/utils";

interface ClassificationCardProps {
  categories: Category[];
  brands: Brand[];
  isLoading?: boolean;
}

export function ClassificationCard({ categories, brands, isLoading }: ClassificationCardProps) {
  const { setValue, watch } = useFormContext<CreateProductInput>();
  const categoryId = watch("categoryId");
  const brandId = watch("brandId");

  const [categorySearch, setCategorySearch] = useState("");
  const [brandSearch, setBrandSearch] = useState("");
  const [isOpenBrand, setIsOpenBrand] = useState(false);

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

  // Filtrar categorías padres según la búsqueda
  const filteredParents = parentCategories.filter(parent => {
    const parentMatches = parent.name.toLowerCase().includes(categorySearch.toLowerCase());
    const children = getChildren(parent.id);
    const anyChildMatches = children.some(child => 
      child.name.toLowerCase().includes(categorySearch.toLowerCase())
    );
    return parentMatches || anyChildMatches;
  });

  // Filtrar marcas según la búsqueda
  const filteredBrands = brands.filter(b => 
    b.name.toLowerCase().includes(brandSearch.toLowerCase())
  );

  const selectedBrand = brands.find(b => b.id === brandId);

  return (
    <div className="space-y-6">
      {/* ─── CARD DE CATEGORÍAS (Estilo WordPress) ───────────────────────────── */}
      <div className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-6 space-y-4 shadow-xl">
        <h3 className="text-[10px] font-bold text-white uppercase tracking-widest border-b border-zinc-800 pb-4 flex justify-between items-center">
          Categorías del producto
          {isLoading && <Loader2 className="h-3 w-3 animate-spin text-primary" />}
        </h3>

        {/* Buscador de Categorías */}
        {!isLoading && categories.length > 0 && (
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-zinc-550" />
            <input
              type="text"
              placeholder="Buscar categoría..."
              value={categorySearch}
              onChange={(e) => setCategorySearch(e.target.value)}
              className="w-full h-9 pl-10 pr-4 rounded-xl bg-zinc-950 border border-zinc-800 text-[11px] text-white focus:outline-none focus:border-primary/50 placeholder-zinc-550 transition-colors"
            />
          </div>
        )}
        
        {/* Contenedor con barra de desplazamiento personalizada */}
        <div className="border border-zinc-800/80 rounded-xl bg-zinc-950/60 p-4 space-y-3.5 max-h-[280px] overflow-y-auto custom-scrollbar text-[11px] shadow-inner">
          {isLoading ? (
            <div className="text-zinc-500 text-center py-6 flex items-center justify-center gap-2">
              <Loader2 className="h-3.5 w-3.5 animate-spin text-primary" />
              Cargando categorías...
            </div>
          ) : filteredParents.length === 0 ? (
            <div className="text-zinc-500 text-center py-6">
              {categorySearch ? "No se encontraron categorías" : "No hay categorías registradas"}
            </div>
          ) : (
            filteredParents
              .sort((a, b) => a.name.localeCompare(b.name, "es"))
              .map((parent) => {
                const children = getChildren(parent.id);
                // Filtrar hijos también por búsqueda
                const filteredChildren = children.filter(child => 
                  child.name.toLowerCase().includes(categorySearch.toLowerCase()) ||
                  parent.name.toLowerCase().includes(categorySearch.toLowerCase())
                );
                
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
                    {filteredChildren.length > 0 && (
                      <div className="pl-6 space-y-2 border-l border-zinc-800/60 ml-1.5 py-0.5">
                        {filteredChildren
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
          <button
            type="button"
            onClick={() => setIsOpenBrand(!isOpenBrand)}
            disabled={isLoading}
            className="w-full h-10 px-4 rounded-xl bg-zinc-950 border border-zinc-800 text-[11px] text-white text-left focus:outline-none focus:border-primary/50 transition-colors disabled:opacity-50 flex items-center justify-between cursor-pointer"
          >
            <span className={selectedBrand ? "text-white" : "text-zinc-500"}>
              {selectedBrand ? selectedBrand.name : "Seleccionar Marca..."}
            </span>
            <ChevronDown className={cn("h-4 w-4 text-zinc-500 transition-transform", isOpenBrand && "rotate-180")} />
          </button>

          {isOpenBrand && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => { setIsOpenBrand(false); setBrandSearch(""); }} />
              <div className="absolute z-20 mt-2 w-full bg-zinc-950 border border-zinc-800 rounded-xl shadow-2xl p-2.5 space-y-2 max-h-[220px] flex flex-col animate-in fade-in slide-in-from-top-2 duration-200">
                <div className="relative">
                  <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-zinc-550" />
                  <input
                    type="text"
                    placeholder="Buscar marca..."
                    value={brandSearch}
                    onChange={(e) => setBrandSearch(e.target.value)}
                    className="w-full h-8 pl-8 pr-3 rounded-lg bg-zinc-900 border border-zinc-800 text-[11px] text-white focus:outline-none focus:border-primary/50 placeholder-zinc-550"
                  />
                </div>
                <div className="overflow-y-auto flex-1 custom-scrollbar space-y-0.5">
                  <button
                    type="button"
                    onClick={() => {
                      setValue("brandId", "", { shouldDirty: true, shouldValidate: true });
                      setIsOpenBrand(false);
                      setBrandSearch("");
                    }}
                    className="w-full text-left px-2.5 py-1.5 rounded-lg text-[11px] text-zinc-500 hover:bg-zinc-900 hover:text-white transition-colors"
                  >
                    Ninguna marca
                  </button>
                  {filteredBrands
                    .sort((a, b) => a.name.localeCompare(b.name, "es"))
                    .map((b) => (
                      <button
                        key={b.id}
                        type="button"
                        onClick={() => {
                          setValue("brandId", b.id, { shouldDirty: true, shouldValidate: true });
                          setIsOpenBrand(false);
                          setBrandSearch("");
                        }}
                        className={cn(
                          "w-full text-left px-2.5 py-1.5 rounded-lg text-[11px] transition-colors",
                          brandId === b.id 
                            ? "bg-primary text-black font-bold" 
                            : "text-zinc-300 hover:bg-zinc-900 hover:text-white"
                        )}
                      >
                        {b.name}
                      </button>
                    ))}
                  {filteredBrands.length === 0 && (
                    <div className="text-zinc-500 text-center py-2 text-[10px]">No se encontraron marcas</div>
                  )}
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
