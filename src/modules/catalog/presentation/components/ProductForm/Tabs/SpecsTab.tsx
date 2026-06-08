import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Trash2 } from "lucide-react";
import { useFormContext, useFieldArray } from "react-hook-form";
import { CreateProductInput } from "@/validations/product.schemas";

export function SpecsTab() {
  const { control, register } = useFormContext<CreateProductInput>();
  
  const { fields, append, remove } = useFieldArray({
    control,
    name: "specifications" as never,
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between border-b border-zinc-800 pb-4">
        <div className="space-y-1">
          <h3 className="text-sm font-bold text-white">Ficha Técnica</h3>
          <p className="text-[10px] text-zinc-500 uppercase tracking-widest">
            Especificaciones y atributos del producto
          </p>
        </div>
        <Button
          type="button"
          onClick={() => append({ name: "", value: "" })}
          className="h-8 text-[9px] uppercase font-black bg-primary text-primary-foreground px-4"
        >
          + Añadir Propiedad
        </Button>
      </div>

      <div className="rounded-xl border border-zinc-800 overflow-hidden bg-zinc-950/50">
        <table className="w-full text-left">
          <tbody className="divide-y divide-zinc-800">
            {fields.map((field, index) => (
              <tr key={field.id} className="group hover:bg-zinc-800/30 transition-colors">
                <td className="px-4 py-2 w-1/3">
                  <Input
                    className="bg-transparent border-none focus-visible:ring-0 text-[11px] font-bold text-zinc-300 h-10"
                    placeholder="Ej: Material, Voltaje, Color..."
                    {...register(`specifications.${index}.name` as any)}
                  />
                </td>
                <td className="px-4 py-2 border-l border-zinc-800/50">
                  <Input
                    className="bg-transparent border-none focus-visible:ring-0 text-[11px] text-white h-10"
                    placeholder="Ej: Acero, 220V, Negro..."
                    {...register(`specifications.${index}.value` as any)}
                  />
                </td>
                <td className="px-4 py-2 text-right w-24">
                  <div className="flex items-center justify-end gap-1">
                    <Button
                      type="button"
                      variant="ghost"
                      onClick={() => append({ name: "", value: "" })}
                      className="h-8 w-8 text-zinc-600 hover:text-primary transition-colors"
                    >
                      <Plus className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      onClick={() => remove(index)}
                      className="h-8 w-8 text-zinc-600 hover:text-red-500 transition-colors"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <Button
        type="button"
        onClick={() => append({ name: "", value: "" })}
        variant="ghost"
        className="w-full border border-dashed border-zinc-800 text-[10px] font-bold text-zinc-600 hover:text-zinc-400 py-6"
      >
        + Añadir otra fila a la ficha técnica
      </Button>
    </div>
  );
}
