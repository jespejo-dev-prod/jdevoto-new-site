"use client";

import { useState, useEffect } from "react";
import { X, Search, Trash2, Image as ImageIcon, Loader2, UploadCloud, Folder } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { CldUploadWidget } from "next-cloudinary";

interface MediaResource {
  publicId: string;
  secureUrl: string;
  width: number;
  height: number;
  format: string;
  createdAt: string;
  folder: string;
  filename: string;
  thumbnailUrl: string;
}

interface MediaGalleryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (url: string, publicId: string) => void;
}

export function MediaGalleryModal({ isOpen, onClose, onSelect }: MediaGalleryModalProps) {
  const [activeTab, setActiveTab] = useState<'library' | 'upload'>('library');
  const [resources, setResources] = useState<MediaResource[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  
  const [search, setSearch] = useState("");
  const [folder, setFolder] = useState("all");

  const fetchMedia = async (cursor?: string, reset = false) => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      if (cursor) params.append("cursor", cursor);
      if (search) params.append("search", search);
      if (folder !== 'all') params.append("folder", folder);

      const res = await fetch(`/api/media?${params.toString()}`);
      if (!res.ok) throw new Error("Error fetching media");
      
      const data = await res.json();
      if (reset) {
        setResources(data.resources);
      } else {
        setResources(prev => [...prev, ...data.resources]);
      }
      setNextCursor(data.nextCursor || null);
    } catch (error) {
      toast.error("Error al cargar la galería");
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && activeTab === 'library') {
      fetchMedia(undefined, true);
    }
  }, [isOpen, activeTab, search, folder]);

  const handleDelete = async (publicId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm("¿Eliminar definitivamente esta imagen de Cloudinary? Esta acción no se puede deshacer.")) return;
    
    try {
      const res = await fetch('/api/media', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ publicId })
      });
      
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Error al eliminar");
        return;
      }
      
      toast.success("Imagen eliminada de Cloudinary");
      setResources(prev => prev.filter(r => r.publicId !== publicId));
    } catch (error) {
      toast.error("Error de conexión");
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="bg-zinc-950 border border-zinc-800 rounded-2xl w-full max-w-5xl h-[85vh] flex flex-col shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-zinc-800">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <ImageIcon className="w-5 h-5 text-primary" />
            Biblioteca Multimedia
          </h2>
          <button onClick={onClose} className="p-2 text-zinc-400 hover:text-white rounded-full hover:bg-zinc-900 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex px-6 border-b border-zinc-800">
          <button 
            onClick={() => setActiveTab('library')}
            className={`px-4 py-3 text-sm font-bold border-b-2 transition-colors ${activeTab === 'library' ? 'border-primary text-primary' : 'border-transparent text-zinc-400 hover:text-zinc-200'}`}
          >
            Biblioteca
          </button>
          <button 
            onClick={() => setActiveTab('upload')}
            className={`px-4 py-3 text-sm font-bold border-b-2 transition-colors ${activeTab === 'upload' ? 'border-primary text-primary' : 'border-transparent text-zinc-400 hover:text-zinc-200'}`}
          >
            Subir Archivo
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-hidden flex flex-col">
          {activeTab === 'library' ? (
            <>
              {/* Filters */}
              <div className="p-4 border-b border-zinc-800 flex gap-4 bg-zinc-900/50">
                <div className="relative flex-1 max-w-md">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                  <Input 
                    placeholder="Buscar imagen..." 
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="pl-9 bg-zinc-950 border-zinc-800"
                  />
                </div>
                <select 
                  value={folder} 
                  onChange={(e) => setFolder(e.target.value)}
                  className="bg-zinc-950 border border-zinc-800 rounded-md px-3 text-sm text-white"
                >
                  <option value="all">Todas las carpetas</option>
                  <option value="jdevoto">/jdevoto</option>
                </select>
              </div>

              {/* Grid */}
              <div className="flex-1 overflow-y-auto p-6">
                {resources.length === 0 && !isLoading ? (
                  <div className="h-full flex flex-col items-center justify-center text-zinc-500">
                    <ImageIcon className="w-12 h-12 mb-4 opacity-20" />
                    <p>No se encontraron imágenes</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                    {resources.map((res) => (
                      <div 
                        key={res.publicId} 
                        onClick={() => onSelect(res.secureUrl, res.publicId)}
                        className="group relative aspect-square bg-zinc-900 rounded-lg overflow-hidden border border-zinc-800 hover:border-primary cursor-pointer transition-all hover:shadow-[0_0_15px_rgba(37,99,235,0.2)]"
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img 
                          src={res.thumbnailUrl} 
                          alt={res.filename}
                          className="w-full h-full object-cover"
                          loading="lazy"
                        />
                        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-start justify-end p-2">
                          <button 
                            onClick={(e) => handleDelete(res.publicId, e)}
                            className="p-1.5 bg-red-500/90 text-white rounded hover:bg-red-600 transition-colors"
                            title="Eliminar de Cloudinary"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                        <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/80 to-transparent p-2 pt-6">
                          <p className="text-[10px] text-zinc-300 truncate font-mono">{res.width}x{res.height}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                
                {isLoading && (
                  <div className="py-8 flex justify-center">
                    <Loader2 className="w-6 h-6 animate-spin text-primary" />
                  </div>
                )}
                
                {nextCursor && !isLoading && (
                  <div className="py-8 flex justify-center">
                    <Button variant="outline" onClick={() => fetchMedia(nextCursor)} className="border-zinc-800">
                      Cargar más
                    </Button>
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center p-6">
              <div className="text-center max-w-md">
                <UploadCloud className="w-16 h-16 text-primary mx-auto mb-6 opacity-80" />
                <h3 className="text-xl font-bold text-white mb-2">Subir nueva imagen</h3>
                <p className="text-zinc-400 mb-8 text-sm">
                  Se recomienda usar formato panorámico (ej. 1440x580) para escritorio y cuadrado (ej. 1080x1080) para móviles. Máximo 10MB.
                </p>
                <CldUploadWidget 
                  uploadPreset="jdevoto_preset"
                  options={{
                    folder: 'jdevoto',
                    maxFiles: 1,
                    clientAllowedFormats: ["jpg", "jpeg", "png", "webp", "avif"],
                    maxFileSize: 10485760, // 10MB
                  }}
                  onSuccess={(result: any) => {
                    if (result.info) {
                      toast.success("Imagen subida con éxito");
                      onSelect(result.info.secure_url, result.info.public_id);
                    }
                  }}
                >
                  {({ open }) => (
                    <Button onClick={() => open()} className="bg-primary hover:bg-primary/90 text-white font-bold h-12 px-8 rounded-xl w-full">
                      Seleccionar archivo...
                    </Button>
                  )}
                </CldUploadWidget>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
