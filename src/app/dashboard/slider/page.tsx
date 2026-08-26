"use client";

import React, { useState, useEffect } from"react";
import { RoleGuard } from"@/components/auth/role-guard";
// Avoid importing from @prisma/client in Client Components (Node.js-only bundle)
const ADMIN_ROLE ="ADMIN" as const;
import { 
 Sliders, 
 Plus, 
 Trash2, 
 ArrowUp, 
 ArrowDown, 
 Upload, 
 Loader2, 
 Save, 
 Image as ImageIcon,
 ExternalLink
} from"lucide-react";
import { Button } from"@/components/ui/button";
import { Input } from"@/components/ui/input";
import { Label } from"@/components/ui/label";
import { useAuth } from"@/context/auth-context";
import { toast } from"sonner";
import { useApi } from"@/shared/infrastructure/api/use-api";

interface HomeSlide {
 id: string;
 image: string;
 title: string;
 description: string;
 cta?: string;
 href?: string;
 imagePositionX?: number;
 imageScale?: number;
 hideOverlay?: boolean;
 textAnimation?: 'slide-up' | 'slide-left' | 'fade' | 'zoom' | 'none';
}

const DEFAULT_SLIDES: HomeSlide[] = [
 {
 id:"default-1",
 image:"/home/outlet.jpg",
 title:"Productos en Outlet",
 description:"Aprovecha precios rebajados en una gran variedad de productos destacados.",
 cta:"Ver Ofertas",
 href: "/categorias/outlet"
 },
 {
 id:"default-2",
 image:"/home/despacho-gratis.png",
 title:"Despacho Gratis",
 description:"Recibe tu compra sin costo en zonas seleccionadas según monto mínimo de compra.",
 cta:"Ver Cobertura",
 href:"/support"
 },
 {
 id:"default-3",
 image:"/home/linea-credito.jpg",
 title:"Línea de Crédito para Ventas al Comercio",
 description:"Contáctanos para evaluar tu crédito y acceder a compras con pago diferido.",
 cta:"Evaluar Crédito",
 href:"/support"
 }
];

export default function SliderPage() {
 const { accessToken } = useAuth();
 const { fetcher } = useApi();
 
 const [slides, setSlides] = useState<HomeSlide[]>([]);
 const [isLoading, setIsLoading] = useState(true);
 const [isSaving, setIsSaving] = useState(false);
 const [uploadingId, setUploadingId] = useState<string | null>(null);

 // Load slides on mount
 useEffect(() => {
 if (!accessToken) return;

 fetch("/api/settings?key=home_slides", {
 headers: {
"Authorization": `Bearer ${accessToken}`
 }
 })
 .then(res => res.json())
 .then(data => {
 if (data && data.value && Array.isArray(data.value)) {
 setSlides(data.value);
 } else {
 // Initialize with default fallback slides if database setting is empty
 setSlides(DEFAULT_SLIDES);
 }
 })
 .catch((err) => {
 console.error("Error loading slides settings:", err);
 setSlides(DEFAULT_SLIDES);
 })
 .finally(() => setIsLoading(false));
 }, [accessToken]);

 // Save changes to database
 const handleSaveChanges = async () => {
 if (slides.length === 0) {
 toast.error("Debes tener al menos 1 slider configurado.");
 return;
 }
 if (slides.length > 5) {
 toast.error("El número máximo de sliders permitidos es 5.");
 return;
 }

 setIsSaving(true);
 try {
 const response = await fetcher("/api/settings", {
 method:"POST",
 headers: {
"Content-Type":"application/json"
 },
 body: JSON.stringify({
 key:"home_slides",
 value: slides
 })
 });

 if (response && response.success) {
 toast.success("¡Configuración del slider guardada correctamente!");
 } else {
 throw new Error("No se pudo guardar la configuración.");
 }
 } catch (err: any) {
 console.error("Error saving slides settings:", err);
 toast.error(err.message ||"Error al intentar guardar los cambios.");
 } finally {
 setIsSaving(false);
 }
 };

 // Add new slide
 const handleAddSlide = () => {
 if (slides.length >= 5) {
 toast.warning("Has alcanzado el límite máximo de 5 sliders.");
 return;
 }

 const newSlide: HomeSlide = {
 id: `new-${Date.now()}`,
 image:"",
 title:"Nuevo Slider",
 description:"Escribe una descripción corta para este slider aquí.",
 cta:"Ver Más",
 href:"/products",
 imagePositionX: 0,
 imageScale: 100
 };

 setSlides([...slides, newSlide]);
 toast.success("Nuevo slider añadido localmente.");
 };

 // Delete slide
 const handleDeleteSlide = (id: string) => {
 if (slides.length <= 1) {
 toast.error("Debes mantener al menos 1 slider en la lista.");
 return;
 }
 setSlides(slides.filter(s => s.id !== id));
 toast.info("Slider eliminado de la lista local.");
 };

 // Reorder slide up
 const handleMoveUp = (index: number) => {
 if (index === 0) return;
 const newSlides = [...slides];
 const temp = newSlides[index];
 newSlides[index] = newSlides[index - 1];
 newSlides[index - 1] = temp;
 setSlides(newSlides);
 };

 // Reorder slide down
 const handleMoveDown = (index: number) => {
 if (index === slides.length - 1) return;
 const newSlides = [...slides];
 const temp = newSlides[index];
 newSlides[index] = newSlides[index + 1];
 newSlides[index + 1] = temp;
 setSlides(newSlides);
 };

 // Field change handler
 const handleFieldChange = (id: string, field: keyof HomeSlide, value: any) => {
 setSlides(slides.map(s => s.id === id ? { ...s, [field]: value } : s));
 };

 // Handle file upload
 const handleFileUpload = async (id: string, file: File) => {
 if (!accessToken) return;

 setUploadingId(id);
 const formData = new FormData();
 formData.append("file", file);

 try {
 const response = await fetch("/api/upload/slides", {
 method:"POST",
 headers: {
"Authorization": `Bearer ${accessToken}`
 },
 body: formData
 });

 const data = await response.json();
 if (response.ok && data.url) {
 handleFieldChange(id,"image", data.url);
 toast.success("Imagen de fondo subida con éxito.");
 } else {
 throw new Error(data.error ||"Fallo en la subida.");
 }
 } catch (err: any) {
 console.error("Error uploading slide image:", err);
 toast.error(err.message ||"Error al subir la imagen. Asegúrate de que sea JPG/PNG/WEBP.");
 } finally {
 setUploadingId(null);
 }
 };

 if (isLoading) {
 return (
 <div className="flex flex-col items-center justify-center py-24 gap-4">
 <Loader2 className="h-10 w-10 text-primary animate-spin" />
 <p className="text-zinc-500 font-bold uppercase tracking-widest text-[10px]">Cargando configuración de banners...</p>
 </div>
 );
 }

 return (
 <RoleGuard allowedRoles={[ADMIN_ROLE]}>
 <div className="py-8 px-4 sm:px-8 w-full max-w-none space-y-8">
 
 {/* Header */}
 <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-800 pb-6">
 <div>
 <h1 className="text-3xl font-bold text-white tracking-tight flex items-center gap-3">
 <Sliders className="h-8 w-8 text-primary" />
 Slider de Inicio (Hero)
 </h1>
 <p className="text-base text-zinc-500 mt-1 font-medium">
 Administra las diapositivas que se muestran en el banner principal del home. Máximo 5 banners.
 </p>
 </div>
 
 <div className="flex items-center gap-3">
 <Button
 onClick={handleSaveChanges}
 disabled={isSaving}
 className="flex items-center gap-2 px-6 py-2.5 bg-primary text-black rounded-xl font-bold text-sm uppercase tracking-widest hover:bg-primary/95 transition-all shadow-lg shadow-primary/20"
 >
 {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
 Guardar Cambios
 </Button>
 </div>
 </div>

 {/* Slides List */}
 <div className="space-y-6">
 {slides.map((slide, index) => (
 <div 
 key={slide.id} 
 className="bg-zinc-900/40 border border-zinc-800 rounded-[32px] p-6 sm:p-8 space-y-6 shadow-2xl relative group overflow-hidden"
 >
 {/* Top bar controls */}
 <div className="flex justify-between items-center border-b border-zinc-800 pb-4">
 <span className="text-sm font-bold text-zinc-500 uppercase tracking-widest">
 Banner #{index + 1}
 </span>
 
 <div className="flex items-center gap-1.5">
 <Button
 variant="ghost"
 size="icon"
 onClick={() => handleMoveUp(index)}
 disabled={index === 0}
 className="h-8 w-8 text-zinc-400 hover:text-white rounded-lg disabled:opacity-30"
 title="Mover arriba"
 >
 <ArrowUp className="h-4 w-4" />
 </Button>
 <Button
 variant="ghost"
 size="icon"
 onClick={() => handleMoveDown(index)}
 disabled={index === slides.length - 1}
 className="h-8 w-8 text-zinc-400 hover:text-white rounded-lg disabled:opacity-30"
 title="Mover abajo"
 >
 <ArrowDown className="h-4 w-4" />
 </Button>
 <Button
 variant="ghost"
 size="icon"
 onClick={() => handleDeleteSlide(slide.id)}
 className="h-8 w-8 text-zinc-500 hover:text-red-500 rounded-lg transition-colors"
 title="Eliminar banner"
 >
 <Trash2 className="h-4 w-4" />
 </Button>
 </div>
 </div>

 {/* Form Grid */}
 <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
 
 {/* Left col - fields */}
 <div className="md:col-span-8 space-y-4 text-left">
 <div className="space-y-2">
 <Label className="text-sm font-bold text-zinc-400 uppercase tracking-wider">Título del Banner</Label>
 <Input
 value={slide.title}
 onChange={(e) => handleFieldChange(slide.id,"title", e.target.value)}
 placeholder="Ej: Ofertas Destacadas"
 className="bg-zinc-950 border-zinc-800 text-white rounded-xl h-11 text-base focus:border-primary/50"
 />
 </div>

 <div className="space-y-2">
 <Label className="text-sm font-bold text-zinc-400 uppercase tracking-wider">Descripción Corta</Label>
 <textarea
 value={slide.description}
 onChange={(e) => handleFieldChange(slide.id,"description", e.target.value)}
 placeholder="Escribe una descripción corta del banner..."
 rows={3}
 className="w-full bg-zinc-950 border border-zinc-800 text-white rounded-xl p-3.5 text-base focus:border-primary/50 outline-none transition-all resize-none"
 />
 </div>

 <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
 <div className="space-y-2">
 <Label className="text-sm font-bold text-zinc-400 uppercase tracking-wider">Texto de Botón (CTA)</Label>
 <Input
 value={slide.cta ||""}
 onChange={(e) => handleFieldChange(slide.id,"cta", e.target.value)}
 placeholder="Ej: Ver Productos"
 className="bg-zinc-950 border-zinc-800 text-white rounded-xl h-11 text-sm sm:text-base focus:border-primary/50"
 />
 </div>
 <div className="space-y-2">
 <Label className="text-sm font-bold text-zinc-400 uppercase tracking-wider">Enlace del Botón (URL)</Label>
 <Input
 value={slide.href ||""}
 onChange={(e) => handleFieldChange(slide.id,"href", e.target.value)}
 placeholder="Ej: /categorias/iluminacion"
 className="bg-zinc-950 border-zinc-800 text-white rounded-xl h-11 text-sm sm:text-base focus:border-primary/50"
 />
 </div>
 </div>
  
  <div className="space-y-2 pt-2">
    <Label className="text-sm font-bold text-zinc-400 uppercase tracking-wider">Animación de Entrada del Texto</Label>
    <select
      value={slide.textAnimation || 'slide-up'}
      onChange={(e) => handleFieldChange(slide.id, "textAnimation", e.target.value)}
      className="w-full bg-zinc-950 border border-zinc-800 text-white rounded-xl h-11 px-4 text-sm focus:border-primary/50 outline-none"
    >
      <option value="slide-up">Deslizar desde abajo (Slide Up)</option>
      <option value="slide-left">Deslizar desde la izquierda (Slide Left)</option>
      <option value="fade">Aparecer suavemente (Fade In)</option>
      <option value="zoom">Acercar (Zoom In)</option>
      <option value="none">Sin Animación</option>
    </select>
  </div>
  
  <div className="flex items-center gap-3 pt-2">
    <input 
      type="checkbox" 
      id={`hideOverlay-${slide.id}`}
      checked={slide.hideOverlay || false}
      onChange={(e) => handleFieldChange(slide.id, "hideOverlay", e.target.checked)}
      className="w-5 h-5 rounded border-zinc-800 bg-zinc-950 text-primary focus:ring-primary focus:ring-offset-zinc-900"
    />
    <Label htmlFor={`hideOverlay-${slide.id}`} className="text-sm font-medium text-zinc-300 cursor-pointer">
      Ocultar texto y efecto blanco (Solo mostrar la imagen y dejarla en formato natural)
    </Label>
  </div>
 </div>

 {/* Right col - background image & upload */}
 <div className="md:col-span-4 flex flex-col justify-between gap-4 text-left">
 <div className="space-y-2 flex-grow flex flex-col">
 <Label className="text-sm font-bold text-zinc-400 uppercase tracking-wider">Imagen de Fondo</Label>
 
 {/* Image Preview Container */}
 <div className="relative flex-grow min-h-[140px] rounded-2xl bg-zinc-950 border border-zinc-800 overflow-hidden flex items-center justify-center group/preview">
 {slide.image ? (
 <>
 <img 
 src={slide.image} 
 alt="Vista previa" 
 className="absolute inset-0 w-full h-full object-cover transition-transform" 
 style={{
 transform: `scale(${(slide.imageScale || 100) / 100}) translateX(${slide.imagePositionX || 0}%)`
 }}
 />
 <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/preview:opacity-100 transition-opacity flex items-center justify-center">
 <span className="text-xs uppercase tracking-widest font-black text-white bg-zinc-900/80 px-2.5 py-1 rounded-md border border-zinc-700">Cambiar</span>
 </div>
 </>
 ) : (
 <div className="flex flex-col items-center justify-center text-zinc-500 gap-2 p-4">
 <ImageIcon className="h-8 w-8 text-zinc-600" />
 <span className="text-xs font-bold uppercase tracking-widest text-zinc-600">Sin Imagen</span>
 </div>
 )}
 </div>
 </div>

 <div className="space-y-3">
 <Input
 value={slide.image}
 onChange={(e) => handleFieldChange(slide.id,"image", e.target.value)}
 placeholder="URL de la imagen..."
 className="bg-zinc-950 border-zinc-800 text-white rounded-xl h-10 text-sm focus:border-primary/50"
 />
 
 <Label 
 className={`w-full h-10 rounded-xl border border-zinc-800 hover:border-zinc-700 bg-zinc-900 text-zinc-300 flex items-center justify-center gap-2 text-sm font-bold uppercase tracking-wider cursor-pointer transition-all ${
 uploadingId === slide.id ?"opacity-50 pointer-events-none" :""
 }`}
 >
 {uploadingId === slide.id ? (
 <Loader2 className="h-3.5 w-3.5 animate-spin" />
 ) : (
 <Upload className="h-3.5 w-3.5" />
 )}
 {uploadingId === slide.id ?"Subiendo..." :"Subir Archivo"}
 <input
 type="file"
 accept="image/*"
 onChange={(e) => {
 const file = e.target.files?.[0];
 if (file) handleFileUpload(slide.id, file);
 }}
 className="hidden"
 />
 </Label>

 {slide.image && (
 <div className="space-y-3 pt-2 border-t border-zinc-800/60">
 <div className="space-y-1">
 <div className="flex justify-between items-center text-[10px] font-bold text-zinc-400 uppercase tracking-wider">
 <span>Desplazamiento X</span>
 <span className="text-primary">{slide.imagePositionX || 0}%</span>
 </div>
 <input
 type="range"
 min="-50"
 max="50"
 step="1"
 value={slide.imagePositionX || 0}
 onChange={(e) => handleFieldChange(slide.id,"imagePositionX", parseInt(e.target.value))}
 className="w-full h-1 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-primary"
 />
 </div>

 <div className="space-y-1">
 <div className="flex justify-between items-center text-[10px] font-bold text-zinc-400 uppercase tracking-wider">
 <span>Escala Imagen</span>
 <span className="text-primary">{slide.imageScale || 100}%</span>
 </div>
 <input
 type="range"
 min="100"
 max="200"
 step="1"
 value={slide.imageScale || 100}
 onChange={(e) => handleFieldChange(slide.id,"imageScale", parseInt(e.target.value))}
 className="w-full h-1 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-primary"
 />
 </div>
 </div>
 )}
 </div>
 </div>

 </div>
 </div>
 ))}
 </div>

 {/* Add banner bottom area */}
 {slides.length < 5 ? (
 <Button
 onClick={handleAddSlide}
 className="w-full h-14 bg-zinc-900/30 hover:bg-zinc-900/60 border border-zinc-800 border-dashed rounded-[32px] text-zinc-400 hover:text-white flex items-center justify-center gap-2 font-bold uppercase text-sm sm:text-base tracking-widest transition-all shadow-sm"
 >
 <Plus className="h-4 w-4" />
 Añadir Banner ({slides.length}/5)
 </Button>
 ) : (
 <div className="p-4 bg-zinc-900/10 border border-zinc-800 rounded-[32px] text-center text-xs font-medium text-zinc-500 uppercase tracking-widest italic">
 Límite de 5 sliders alcanzado
 </div>
 )}

 </div>
 </RoleGuard>
 );
}
