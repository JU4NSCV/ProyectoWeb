"use client";
// ============================================================
// store/toastStore.ts — Sistema de notificaciones tipo toast
// Toast propio sin dependencias adicionales, estilizado con
// la paleta de marca ISBEN (#FB4318 / #FFC22F)
// ============================================================
import { create } from "zustand";
import type { ToastMessage, ToastTipo } from "@/types";

interface ToastState {
  toasts: ToastMessage[];
  mostrar: (tipo: ToastTipo, titulo: string, descripcion?: string) => void;
  cerrar: (id: string) => void;
  error: (titulo: string, descripcion?: string) => void;
  exito: (titulo: string, descripcion?: string) => void;
  advertencia: (titulo: string, descripcion?: string) => void;
  info: (titulo: string, descripcion?: string) => void;
}

export const useToastStore = create<ToastState>()((set, get) => ({
  toasts: [],

  mostrar: (tipo, titulo, descripcion) => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    const nuevoToast: ToastMessage = { id, tipo, titulo, descripcion };

    set((state) => ({ toasts: [...state.toasts, nuevoToast] }));

    // Auto-cerrar después de 4 segundos
    setTimeout(() => {
      get().cerrar(id);
    }, 4000);
  },

  cerrar: (id) => {
    set((state) => ({ toasts: state.toasts.filter((t) => t.id !== id) }));
  },

  // Atajos semánticos
  error:       (titulo, desc) => get().mostrar("error",       titulo, desc),
  exito:       (titulo, desc) => get().mostrar("exito",       titulo, desc),
  advertencia: (titulo, desc) => get().mostrar("advertencia", titulo, desc),
  info:        (titulo, desc) => get().mostrar("info",        titulo, desc),
}));
