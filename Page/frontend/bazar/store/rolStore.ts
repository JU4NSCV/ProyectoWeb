"use client";
// ============================================================
// store/rolStore.ts — Simulador de Rol de Usuario
// Permite cambiar el rol para demostrar precios dinámicos
// ============================================================
import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type { RolUsuario } from "@/types";

interface RolState {
  rol: RolUsuario;
  setRol: (rol: RolUsuario) => void;
}

export const useRolStore = create<RolState>()(
  persist(
    (set) => ({
      rol: "visitante",
      setRol: (rol) => set({ rol }),
    }),
    {
      name: "bazar-rol",
      storage: createJSONStorage(() => localStorage),
    }
  )
);

/** Hook de conveniencia: retorna si el usuario actual ve precios de minorista */
export const useEsMinorista = () => useRolStore((s) => s.rol === "minorista");
