/**
 * src/modules/catalog/presentation/components/ProductForm/IdentityFields.tsx
 */

import { useState, useRef, useEffect } from "react";
import { useFormContext } from "react-hook-form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { EditorToolbar } from "./EditorToolbar";
import { CreateProductInput } from "@/validations/product.schemas";
import { Eye, Code, Sparkles, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/context/auth-context";
import { toast } from "sonner";

export function ProductNameField({ slug }: { slug: string }) {
  const { register } = useFormContext<CreateProductInput>();
  
  return (
    <div className="space-y-3">
      <Input 
        placeholder="Nombre del producto" 
        className="bg-zinc-900/40 border-zinc-800 text-2xl font-bold text-white h-16 px-6 rounded-2xl focus:border-primary/50 transition-all" 
        {...register('name')} 
      />
      <div className="flex items-center gap-4 px-4 py-1.5 rounded-lg bg-zinc-900/10 border border-zinc-800/50 w-fit text-xs font-bold">
        <span className="text-zinc-600 uppercase tracking-widest">Enlace:</span>
        <span className="text-primary">{slug || '...'}</span>
      </div>
    </div>
  );
}

export function ProductDescriptionField() {
  const { register, watch, setValue } = useFormContext<CreateProductInput>();
  const [activeTab, setActiveTab] = useState<'visual' | 'html'>('visual');
  const descriptionValue = watch('description') || '';
  const productName = watch('name') || '';
  const editorRef = useRef<HTMLDivElement>(null);
  
  const { accessToken } = useAuth();
  const [isGenerating, setIsGenerating] = useState(false);

  // Sync contentEditable content on mount, value change, or tab switch
  useEffect(() => {
    if (activeTab === 'visual' && editorRef.current) {
      // Reemplazamos los saltos literales \n por saltos reales o de HTML
      const formatted = descriptionValue
        .replace(/\\n/g, '<br />')
        .replace(/\n/g, '<br />');
      if (editorRef.current.innerHTML !== formatted) {
        editorRef.current.innerHTML = formatted;
      }
    }
  }, [activeTab, descriptionValue]);

  const handleVisualChange = () => {
    if (editorRef.current) {
      setValue('description', editorRef.current.innerHTML, { shouldDirty: true, shouldValidate: true });
    }
  };

  const executeCommand = (command: string, value: string = '') => {
    document.execCommand(command, false, value);
    handleVisualChange();
  };

  const handleGenerateDescription = async () => {
    if (!productName) {
      toast.error("Por favor, escribe el nombre del producto antes de generar su descripción.");
      return;
    }

    setIsGenerating(true);
    try {
      const res = await fetch("/api/ai/generate-description", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ name: productName }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error?.message || "Error al generar la descripción.");
      }

      // Guardar el texto devuelto en el formulario de forma complementaria (añadiendo al final)
      const cleanedText = data.data?.text || "";
      let newDescription = "";
      
      const hasHtml = /<[a-z][\s\S]*>/i.test(descriptionValue);
      const prefix = hasHtml ? "<strong>Especificaciones:</strong><br />" : "Especificaciones:\n";
      
      if (descriptionValue.trim()) {
        const separator = hasHtml ? "<br /><br />" : "\n\n";
        newDescription = `${descriptionValue.trim()}${separator}${prefix}${cleanedText}`;
      } else {
        newDescription = `${prefix}${cleanedText}`;
      }

      setValue("description", newDescription, { shouldDirty: true, shouldValidate: true });
      
      // Forzar recarga en el editor visual si está activo
      if (activeTab === "visual" && editorRef.current) {
        editorRef.current.innerHTML = newDescription
          .replace(/\\n/g, '<br />')
          .replace(/\n/g, '<br />');
      }

      toast.success("Descripción complementaria autogenerada con éxito.");
    } catch (error: any) {
      toast.error(error.message || "Error al autocompletar con IA.");
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="rounded-2xl border border-zinc-800 bg-zinc-900/40 overflow-hidden">
      <div className="p-3 border-b border-zinc-800 bg-zinc-950/50 flex justify-between items-center px-5 text-xs font-bold text-zinc-600 uppercase tracking-widest animate-in fade-in duration-300">
        <div className="flex items-center gap-4">
          <EditorToolbar activeTab={activeTab} onCommand={executeCommand} />
          
          <button
            type="button"
            disabled={isGenerating}
            onClick={handleGenerateDescription}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary/10 border border-primary/20 text-primary hover:bg-primary/20 transition-all font-bold uppercase text-xs disabled:opacity-50"
            title="Autocompletar descripción del producto con Inteligencia Artificial"
          >
            {isGenerating ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Sparkles className="h-3.5 w-3.5 text-primary animate-pulse" />
            )}
            {isGenerating ? "Generando..." : "Generar con IA"}
          </button>
        </div>
        
        <div className="flex items-center gap-1 bg-zinc-950 border border-zinc-800/80 p-0.5 rounded-lg">
          <button
            type="button"
            onClick={() => setActiveTab('visual')}
            className={cn(
              "flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-bold uppercase transition-all",
              activeTab === 'visual'
                ? "bg-zinc-800 text-white shadow border border-zinc-700/30"
                : "text-zinc-500 hover:text-zinc-355"
            )}
          >
            <Eye className="h-3 w-3" />
            Visual
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('html')}
            className={cn(
              "flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-bold uppercase transition-all",
              activeTab === 'html'
                ? "bg-zinc-800 text-white shadow border border-zinc-700/30"
                : "text-zinc-500 hover:text-zinc-355"
            )}
          >
            <Code className="h-3 w-3" />
            HTML / Texto
          </button>
        </div>
      </div>

      {activeTab === 'visual' ? (
        <div className="min-h-[250px] p-8 bg-transparent text-zinc-350 text-sm leading-relaxed select-text">
          <div 
            ref={editorRef}
            contentEditable={true}
            onInput={handleVisualChange}
            onBlur={handleVisualChange}
            className="focus:outline-none min-h-[186px] outline-none text-sm leading-relaxed space-y-4 [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:list-decimal [&_ol]:pl-5 [&_li]:mb-1 [&_a]:text-primary [&_a]:underline [&_img]:max-w-full [&_img]:h-auto [&_img]:rounded-xl [&_img]:my-4"
            style={{ minHeight: '186px', whiteSpace: 'pre-wrap' }}
          />
        </div>
      ) : (
        <Textarea 
          placeholder="Describe las ventajas competitivas y especificaciones técnicas..." 
          className="border-none min-h-[250px] p-8 text-sm text-zinc-350 focus-visible:ring-0 leading-relaxed font-mono bg-transparent" 
          {...register('description')} 
        />
      )}
    </div>
  );
}
