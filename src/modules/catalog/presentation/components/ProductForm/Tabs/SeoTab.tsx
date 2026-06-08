import { FormInput } from "../FormInput";
import { useFormContext } from "react-hook-form";
import { CreateProductInput } from "@/validations/product.schemas";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { AlertCircle } from "lucide-react";

export function SeoTab() {
  const { register, formState: { errors } } = useFormContext<CreateProductInput>();

  return (
    <div className="space-y-6 max-w-2xl text-[11px]">
      <div className="flex items-center gap-2 p-4 bg-primary/5 rounded-xl border border-primary/20 mb-6 text-primary">
        <AlertCircle className="h-4 w-4" />
        <span>Si dejas estos campos vacíos, se generarán automáticamente usando el nombre y descripción del producto.</span>
      </div>
      
      <FormInput
        label="Título SEO (Google)"
        placeholder="Título optimizado..."
        name="seoTitle"
      />
      
      <div className="space-y-2">
        <Label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">
          Meta Descripción
        </Label>
        <Textarea
          className="bg-zinc-950 border-zinc-800 min-h-[100px] text-white"
          placeholder="Resumen para el buscador..."
          {...register('seoDescription')}
        />
        {errors.seoDescription && (
          <span className="text-[9px] text-red-500 font-bold uppercase">
            {String(errors.seoDescription?.message || '')}
          </span>
        )}
      </div>
    </div>
  );
}
