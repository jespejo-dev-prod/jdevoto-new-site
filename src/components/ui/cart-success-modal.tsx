'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, X, ShoppingCart, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

interface CartSuccessModalProps {
  isOpen: boolean;
  onClose: () => void;
  productName: string;
  quantity: number;
}

export function CartSuccessModal({ isOpen, onClose, productName, quantity }: CartSuccessModalProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-zinc-950/40 backdrop-blur-sm z-[100]"
          />
          
          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md bg-white rounded-[32px] p-8 shadow-2xl z-[101] border border-zinc-100"
          >
            <button 
              onClick={onClose}
              className="absolute top-6 right-6 p-2 rounded-full hover:bg-zinc-50 text-zinc-400 hover:text-zinc-950 transition-all"
            >
              <X className="h-5 w-5" />
            </button>

            <div className="flex flex-col items-center text-center space-y-6">
              <div className="w-20 h-20 bg-emerald-50 rounded-full flex items-center justify-center">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", damping: 12, stiffness: 200, delay: 0.1 }}
                >
                  <CheckCircle2 className="h-10 w-10 text-emerald-500" />
                </motion.div>
              </div>

              <div className="space-y-2">
                <h3 className="text-xl font-black text-zinc-900 tracking-tight">¡Producto agregado!</h3>
                <p className="text-sm text-zinc-500 font-medium px-4">
                  Has agregado <span className="text-zinc-950 font-bold">{quantity} unidades</span> de 
                  <span className="block mt-1 italic">"{productName}"</span> al carrito.
                </p>
              </div>

              <div className="flex flex-col w-full gap-3 pt-4">
                <Link href="/cart" className="w-full">
                  <Button className="w-full h-14 bg-zinc-950 text-white rounded-2xl font-black uppercase text-xs tracking-widest flex items-center justify-center gap-3 hover:bg-zinc-800 transition-all shadow-xl active:scale-[0.98]">
                    Ver Carrito <ShoppingCart className="h-4 w-4 text-primary" />
                  </Button>
                </Link>
                
                <Button 
                  variant="outline" 
                  onClick={onClose}
                  className="w-full h-14 rounded-2xl font-black uppercase text-xs tracking-widest border-2 hover:bg-zinc-50 transition-all flex items-center justify-center gap-3 active:scale-[0.98]"
                >
                  Continuar Comprando <ArrowRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
