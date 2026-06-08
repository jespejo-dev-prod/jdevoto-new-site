/**
 * src/modules/catalog/presentation/components/ProductForm/IdentityFields.tsx
 */

import { useFormContext } from "react-hook-form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { EditorToolbar } from "./EditorToolbar";
import { CreateProductInput } from "@/validations/product.schemas";

export function ProductNameField({ slug }: { slug: string }) {
  const { register } = useFormContext<CreateProductInput>();
  
  return (
    <div className="space-y-3">
      <Input 
        placeholder="Nombre del producto" 
        className="bg-zinc-900/40 border-zinc-800 text-2xl font-bold text-white h-16 px-6 rounded-2xl focus:border-primary/50 transition-all" 
        {...register('name')} 
      />
      <div className="flex items-center gap-4 px-4 py-1.5 rounded-lg bg-zinc-900/10 border border-zinc-800/50 w-fit text-[10px] font-bold">
        <span className="text-zinc-600 uppercase tracking-widest">Enlace:</span>
        <span className="text-primary">{slug || '...'}</span>
      </div>
    </div>
  );
}

export function ProductDescriptionField() {
  const { register } = useFormContext<CreateProductInput>();

  return (
    <div className="rounded-2xl border border-zinc-800 bg-zinc-900/40 overflow-hidden">
      <div className="p-3 border-b border-zinc-800 bg-zinc-950/50 flex justify-between items-center px-5 text-[10px] font-bold text-zinc-600 uppercase tracking-widest">
        <EditorToolbar />
        Contenido del Producto
      </div>
      <Textarea 
        placeholder="Describe las ventajas competitivas y especificaciones técnicas..." 
        className="border-none min-h-[250px] p-8 text-sm text-zinc-300 focus-visible:ring-0 leading-relaxed" 
        {...register('description')} 
      />
    </div>
  );
}
