import { Button } from "@/components/ui/button";
import { Globe, Eye, Calendar, Save } from "lucide-react";
import { useFormContext } from "react-hook-form";
import { useParams, useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

import { useApi } from "@/shared/infrastructure/api/use-api";

interface PublishCardProps {
  isSubmitting: boolean;
  isEditing?: boolean;
}

export function PublishCard({ isSubmitting, isEditing = false }: PublishCardProps) {
  const { watch, setValue } = useFormContext();
  const isActive = watch("isActive");
  const params = useParams();
  const router = useRouter();
  const [isDeleting, setIsDeleting] = useState(false);
  const api = useApi();

  const handleSendToTrash = async () => {
    if (!isEditing || !params.id) return;
    if (!window.confirm("¿Seguro que deseas enviar este producto a la papelera?")) return;

    setIsDeleting(true);
    try {
      await api.delete(`/api/products/${params.id}`);
      toast.success("Producto enviado a la papelera correctamente");
      router.push("/dashboard/products");
      router.refresh();
    } catch (error: any) {
      toast.error(error.message || "Error al enviar a la papelera");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-6 space-y-6 shadow-xl">
      <h3 className="text-[10px] font-bold text-white uppercase tracking-widest border-b border-zinc-800 pb-4">
        {isEditing ? 'Guardar Cambios' : 'Publicar'}
      </h3>
      <div className="space-y-3 text-[10px] font-medium">
        <div className="flex justify-between items-center">
          <span className="text-zinc-500 flex items-center gap-2">
            <Globe className="h-3.5 w-3.5" /> Estado:
          </span>{" "}
          <select
            value={isActive ? "true" : "false"}
            onChange={(e) => setValue("isActive", e.target.value === "true", { shouldValidate: true, shouldDirty: true })}
            className="bg-zinc-950 border border-zinc-800 text-primary font-bold rounded-lg px-2.5 py-0.5 text-[9px] outline-none cursor-pointer focus:border-primary transition-all shadow-inner"
          >
            <option value="true" className="bg-zinc-950 text-zinc-300">Publicado</option>
            <option value="false" className="bg-zinc-950 text-zinc-300">Borrador</option>
          </select>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-zinc-500 flex items-center gap-2">
            <Eye className="h-3.5 w-3.5" /> Visibilidad:
          </span>{" "}
          <span className="text-zinc-300 font-bold">Público</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-zinc-500 flex items-center gap-2">
            <Calendar className="h-3.5 w-3.5" /> {isEditing ? 'Última edición:' : 'Publicar:'}
          </span>{" "}
          <span className="text-zinc-300 font-bold">{isEditing ? 'Ahora' : 'Inmediato'}</span>
        </div>
      </div>
      <div className="flex gap-2 pt-2">
        {isEditing ? (
          <Button
            type="button"
            variant="ghost"
            onClick={handleSendToTrash}
            disabled={isDeleting || isSubmitting}
            className="text-[10px] font-bold h-10 flex-1 text-red-500 hover:bg-red-500/10 hover:text-red-400"
          >
            {isDeleting ? "Enviando..." : "Papelera"}
          </Button>
        ) : (
          <Button
            type="button"
            variant="ghost"
            onClick={() => router.push("/dashboard/products")}
            className="text-[10px] font-bold h-10 flex-1 text-zinc-400 hover:bg-zinc-800"
          >
            Cancelar
          </Button>
        )}
        <Button
          type="submit"
          disabled={isSubmitting}
          className="bg-primary text-primary-foreground font-black text-[10px] uppercase h-10 flex-1 shadow-lg shadow-primary/20 gap-1.5"
        >
          {isSubmitting ? (
            '...'
          ) : isEditing ? (
            <>
              <Save className="h-3 w-3" />
              Guardar
            </>
          ) : (
            'Publicar'
          )}
        </Button>
      </div>
    </div>
  );
}

