"use client";

import React, { useRef, useState } from "react";
import { useFormContext, useFieldArray } from "react-hook-form";
import { 
  DndContext, 
  closestCenter, 
  KeyboardSensor, 
  PointerSensor, 
  useSensor, 
  useSensors,
  DragEndEvent 
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
  rectSortingStrategy
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { 
  Upload, 
  Trash2, 
  Star, 
  GripVertical, 
  Loader2,
  Plus
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { useAuth } from "@/context/auth-context";

interface ImageItem {
  url: string;
  position: number;
  altText: string | null;
  isPrimary: boolean;
  id: string; // dnd-kit needs a unique id
}

export function ImageCard() {
  const { control, setValue, watch } = useFormContext();
  const { accessToken } = useAuth();
  const { fields, append, remove, move } = useFieldArray({
    control,
    name: "images"
  });

  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    if (fields.length + files.length > 4) {
      toast.error("Máximo 4 imágenes permitidas");
      return;
    }

    setIsUploading(true);
    
    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        
        // Validación básica frontend
        if (file.size > 10 * 1024 * 1024) {
          toast.error(`${file.name} supera los 10MB`);
          continue;
        }

        const formData = new FormData();
        formData.append("file", file);

        const response = await fetch("/api/upload/temp", {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${accessToken}`
          },
          body: formData,
        });

        if (!response.ok) {
          const err = await response.json();
          throw new Error(err.error || "Error al subir imagen");
        }

        const data = await response.json();
        
        append({
          url: data.url,
          position: fields.length + i,
          altText: "",
          isPrimary: fields.length === 0 && i === 0 // Primera imagen es primaria por defecto
        });
      }
      toast.success("Imágenes subidas correctamente");
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = fields.findIndex((f) => f.id === active.id);
      const newIndex = fields.findIndex((f) => f.id === over.id);
      
      move(oldIndex, newIndex);
      
      // Actualizar posiciones (opcional si el backend las infiere del orden del array)
      const updatedImages = watch("images");
      updatedImages.forEach((img: any, idx: number) => {
        setValue(`images.${idx}.position`, idx);
      });
    }
  };

  const togglePrimary = (index: number) => {
    fields.forEach((_, idx) => {
      setValue(`images.${idx}.isPrimary`, idx === index);
    });
  };

  return (
    <div className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-6 space-y-6 shadow-xl">
      <div className="flex items-center justify-between border-b border-zinc-800 pb-4">
        <h3 className="text-[10px] font-bold text-white uppercase tracking-widest">
          Imágenes ({fields.length}/4)
        </h3>
        {fields.length < 4 && (
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
            className="text-[10px] font-bold text-blue-400 uppercase tracking-widest hover:text-blue-300 transition-colors flex items-center gap-2 disabled:opacity-50"
          >
            {isUploading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Plus className="w-3 h-3" />}
            Añadir
          </button>
        )}
      </div>

      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        multiple
        accept="image/*"
        className="hidden"
      />

      {fields.length === 0 ? (
        <div 
          onClick={() => fileInputRef.current?.click()}
          className="aspect-square rounded-2xl bg-zinc-950/50 border-2 border-dashed border-zinc-800 flex flex-col items-center justify-center gap-4 cursor-pointer hover:bg-zinc-950 transition-colors group"
        >
          <div className="w-12 h-12 rounded-full bg-zinc-900 flex items-center justify-center group-hover:scale-110 transition-transform">
            <Upload className="w-6 h-6 text-zinc-500" />
          </div>
          <div className="text-center">
            <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Seleccionar Imágenes</p>
            <p className="text-[9px] text-zinc-600 mt-1">Máximo 4 fotos. Hasta 10MB c/u.</p>
          </div>
        </div>
      ) : (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={fields.map(f => f.id)}
            strategy={rectSortingStrategy}
          >
            <div className="grid grid-cols-2 gap-4">
              {fields.map((field, index) => (
                <SortableImage 
                  key={field.id}
                  id={field.id}
                  index={index}
                  url={(field as any).url}
                  isPrimary={(field as any).isPrimary}
                  onRemove={() => remove(index)}
                  onMakePrimary={() => togglePrimary(index)}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      )}

      {isUploading && (
        <div className="flex items-center gap-3 p-3 rounded-xl bg-blue-500/10 border border-blue-500/20 animate-pulse">
          <Loader2 className="w-4 h-4 text-blue-400 animate-spin" />
          <span className="text-[10px] font-bold text-blue-400 uppercase tracking-widest">
            Subiendo y optimizando...
          </span>
        </div>
      )}
    </div>
  );
}

function SortableImage({ id, url, isPrimary, onRemove, onMakePrimary }: any) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 10 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "group relative aspect-square rounded-xl bg-zinc-950 border border-zinc-800 overflow-hidden",
        isDragging && "opacity-50",
        isPrimary && "border-blue-500/50 ring-2 ring-blue-500/20"
      )}
    >
      <img src={url} alt="Product" className="w-full h-full object-cover" />
      
      {/* Overlay de controles */}
      <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-between p-2">
        <div className="flex justify-between items-start">
          <div 
            {...attributes} 
            {...listeners}
            className="p-1.5 rounded-lg bg-zinc-900/80 text-zinc-400 hover:text-white cursor-grab active:cursor-grabbing"
          >
            <GripVertical className="w-3 h-3" />
          </div>
          <button
            type="button"
            onClick={onRemove}
            className="p-1.5 rounded-lg bg-red-500/20 text-red-400 hover:bg-red-500 hover:text-white transition-colors"
          >
            <Trash2 className="w-3 h-3" />
          </button>
        </div>

        <button
          type="button"
          onClick={onMakePrimary}
          className={cn(
            "w-full py-1.5 rounded-lg text-[8px] font-bold uppercase tracking-widest flex items-center justify-center gap-2 transition-colors",
            isPrimary 
              ? "bg-blue-500 text-white" 
              : "bg-zinc-900/80 text-zinc-400 hover:bg-zinc-800 hover:text-white"
          )}
        >
          <Star className={cn("w-2.5 h-2.5", isPrimary && "fill-current")} />
          {isPrimary ? "Principal" : "Hacer Principal"}
        </button>
      </div>

      {isPrimary && !isDragging && (
        <div className="absolute top-2 left-2 px-2 py-0.5 rounded-full bg-blue-500 text-[8px] font-bold text-white uppercase tracking-tighter shadow-lg">
          Principal
        </div>
      )}
    </div>
  );
}
