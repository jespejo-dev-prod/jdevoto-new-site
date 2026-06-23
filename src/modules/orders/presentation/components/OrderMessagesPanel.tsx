'use client';

import { useState, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useApi } from '@/shared/infrastructure/api/use-api';
import { MessageSquare, Paperclip, Send, Download, FileText, Loader2, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Button } from '@/components/ui/button';

export function OrderMessagesPanel({ orderId, isAdmin = false }: { orderId: string, isAdmin?: boolean }) {
  const { fetcher } = useApi();
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [message, setMessage] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [notifyCustomer, setNotifyCustomer] = useState(true);

  const { data: messages = [], isLoading } = useQuery({
    queryKey: ['order-messages', orderId],
    queryFn: () => fetcher(`/api/orders/${orderId}/messages`),
    enabled: !!orderId,
  });

  const sendMessageMutation = useMutation({
    mutationFn: async () => {
      const formData = new FormData();
      if (message) formData.append('message', message);
      if (file) formData.append('file', file);
      formData.append('notifyCustomer', notifyCustomer.toString());

      return fetcher(`/api/orders/${orderId}/messages`, {
        method: 'POST',
        body: formData,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['order-messages', orderId] });
      setMessage('');
      setFile(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
      toast.success('Mensaje y documento enviados correctamente');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Error al enviar el mensaje');
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim() && !file) return;
    sendMessageMutation.mutate();
  };

  return (
    <div className="bg-zinc-900/40 border border-zinc-800 rounded-3xl p-6 space-y-6 shadow-xl flex flex-col h-[600px]">
      <h4 className="text-xs font-bold text-zinc-500 uppercase tracking-widest flex items-center gap-2 border-b border-zinc-800 pb-4 shrink-0">
        <MessageSquare className="h-4 w-4 text-primary" />
        Comunicación y Facturas
      </h4>

      {/* Mensajes Historial */}
      <div className="flex-1 overflow-y-auto space-y-4 pr-2 custom-scrollbar">
        {isLoading ? (
          <div className="flex justify-center items-center h-full">
            <Loader2 className="h-6 w-6 text-primary animate-spin" />
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-zinc-500 space-y-2 opacity-50">
            <MessageSquare className="h-8 w-8" />
            <p className="text-xs font-medium uppercase tracking-widest">No hay mensajes aún</p>
          </div>
        ) : (
          messages.map((msg: any) => (
            <div key={msg.id} className="bg-zinc-950/60 border border-zinc-800 rounded-2xl p-4 space-y-3">
              <div className="flex flex-col gap-1 mb-2">
                <span className="text-[10px] font-bold text-zinc-500 uppercase flex items-center gap-1.5">
                  <UserIcon className="h-3 w-3" />
                  {msg.sender ? `${msg.sender.firstName} ${msg.sender.lastName} ${msg.sender.role === 'ADMIN' || msg.sender.role === 'SALES_REP' ? '(Soporte)' : '(Cliente)'}` : 'Mensaje del Sistema'}
                </span>
                <span className="text-[10px] text-zinc-600 pl-4">
                  {format(new Date(msg.createdAt), "dd MMM, HH:mm", { locale: es })}
                </span>
              </div>
              
              {msg.message && (
                <p className="text-sm text-zinc-300 whitespace-pre-wrap">{msg.message}</p>
              )}

              {msg.attachmentUrl && (
                <div className="pt-2 border-t border-zinc-800/50 mt-2">
                  <a 
                    href={msg.attachmentUrl} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="flex items-center justify-between p-3 bg-zinc-900 rounded-xl hover:bg-zinc-800 transition-colors group"
                  >
                    <div className="flex items-center gap-3 overflow-hidden">
                      <div className="h-8 w-8 bg-primary/10 rounded-lg flex items-center justify-center shrink-0">
                        <FileText className="h-4 w-4 text-primary" />
                      </div>
                      <span className="text-xs font-medium text-zinc-300 truncate">{msg.attachmentName}</span>
                    </div>
                    <Download className="h-4 w-4 text-zinc-500 group-hover:text-primary transition-colors shrink-0" />
                  </a>
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Formulario de Envío (Para todos los roles) */}
      <form onSubmit={handleSubmit} className="shrink-0 space-y-4 pt-4 border-t border-zinc-800">
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Escribe un mensaje..."
          className="w-full bg-zinc-950 border border-zinc-800 rounded-2xl p-4 text-xs text-zinc-300 focus:border-primary/50 outline-none resize-none h-20 custom-scrollbar"
        />
        
        <div className="flex flex-col gap-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex flex-col gap-2 w-full">
              <input
                type="file"
                ref={fileInputRef}
                onChange={(e) => setFile(e.target.files?.[0] || null)}
                className="hidden"
                accept=".pdf,.jpg,.jpeg,.png"
                data-testid="chat-file-input"
              />
              <div className="flex items-center gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => fileInputRef.current?.click()}
                  className="h-10 border-zinc-800 bg-zinc-950 text-zinc-400 hover:text-white hover:bg-zinc-900 rounded-xl text-[10px] font-bold uppercase tracking-widest gap-2 shrink-0"
                >
                  <Paperclip className="h-3.5 w-3.5" />
                  {file ? 'Cambiar Archivo' : 'Adjuntar Archivo'}
                </Button>
                {file && (
                  <span className="text-xs text-zinc-400 truncate">
                    {file.name}
                  </span>
                )}
              </div>
              
              {isAdmin && (
                <label className="flex items-center gap-2 cursor-pointer group w-fit mt-1">
                  <div className="relative flex items-center justify-center">
                    <input 
                      type="checkbox" 
                      checked={notifyCustomer} 
                      onChange={(e) => setNotifyCustomer(e.target.checked)} 
                      className="peer appearance-none h-4 w-4 border-2 border-zinc-700 rounded-sm checked:bg-primary checked:border-primary transition-all cursor-pointer" 
                    />
                    <CheckCircle2 className="h-3 w-3 text-zinc-950 absolute opacity-0 peer-checked:opacity-100 transition-opacity pointer-events-none" />
                  </div>
                  <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest group-hover:text-zinc-400 transition-colors">
                    Enviar notificación al correo
                  </span>
                </label>
              )}
            </div>
          </div>

          <Button
            type="submit"
            disabled={(!message.trim() && !file) || sendMessageMutation.isPending}
            className="w-full h-12 bg-primary hover:bg-primary/90 text-black rounded-xl text-[10px] font-bold uppercase tracking-widest flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {sendMessageMutation.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <>
                <Send className="h-4 w-4" />
                Enviar Mensaje
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}

function UserIcon(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  );
}
