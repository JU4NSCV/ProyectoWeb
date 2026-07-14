"use client";
// ============================================================
// store/carritoStore.ts — Estado global del Carrito (Zustand)
//
// ★ MOTOR B2B v2:
//   - agregarProducto valida MOQ y múltiplo_lote ANTES de agregar
//   - Si la cantidad es inválida: dispara toast de error y RECHAZA
//   - actualizarCantidad también valida y emite toast si es necesario
//   - Estado de checkout: loading / error / exito
// ============================================================
import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type { ItemCarrito, Producto, ValidacionCarrito } from "@/types";
import { validarReglasB2B } from "@/lib/utils";

// ──────────────────────────────────────────────────────────
// Tipos del store
// ──────────────────────────────────────────────────────────

export type CheckoutEstado = "idle" | "loading" | "exito" | "error";

interface CarritoState {
  items: ItemCarrito[];
  isOpen: boolean;
  checkoutEstado: CheckoutEstado;
  checkoutError: string | null;
  ultimoPedidoId: number | null;

  // ── Acciones del carrito ──────────────────────────────
  /**
   * ★ B2B CRÍTICO: Valida MOQ y múltiplo_lote ANTES de agregar.
   * Retorna true si fue agregado, false si fue rechazado.
   * El componente padre debe disparar el toast si retorna false.
   */
  agregarProducto: (
    producto: Producto,
    cantidad: number,
    precioUnitario: number
  ) => { agregado: boolean; mensaje: string };

  /**
   * ★ B2B CRÍTICO: Valida las reglas al actualizar la cantidad.
   * Retorna false + mensaje si la nueva cantidad es inválida.
   */
  actualizarCantidad: (
    productoId: number,
    nuevaCantidad: number,
    moq: number,
    multiplo_lote: number
  ) => { actualizado: boolean; mensaje: string };

  eliminarItem: (productoId: number) => void;
  vaciarCarrito: () => void;
  abrirCarrito: () => void;
  cerrarCarrito: () => void;
  toggleCarrito: () => void;
  setCheckoutEstado: (estado: CheckoutEstado, error?: string) => void;
  setUltimoPedidoId: (id: number) => void;

  // ── Selectores derivados ──────────────────────────────
  totalItems: () => number;
  subtotal: () => number;
  validaciones: () => ValidacionCarrito[];
  carritoEsValido: () => boolean;
}

// ──────────────────────────────────────────────────────────
// Store Zustand con persistencia en localStorage
// ──────────────────────────────────────────────────────────

export const useCarritoStore = create<CarritoState>()(
  persist(
    (set, get) => ({
      items: [],
      isOpen: false,
      checkoutEstado: "idle",
      checkoutError: null,
      ultimoPedidoId: null,

      // ────────────────────────────────────────────────
      // agregarProducto — ★ Motor B2B central
      // ────────────────────────────────────────────────
      agregarProducto: (producto, cantidad, precioUnitario) => {
        // 1. Validar cantidad contra reglas B2B
        const validacion = validarReglasB2B(
          cantidad,
          producto.moq,
          producto.multiplo_lote
        );

        if (!validacion.valido) {
          // ★ RECHAZAR — no modificar el estado
          return { agregado: false, mensaje: validacion.mensaje };
        }

        // 2. Agregar o acumular
        set((state) => {
          const existe = state.items.find((i) => i.producto.id === producto.id);

          if (existe) {
            // Ya existe: sumar cantidad (también validar el total acumulado)
            const nuevaCantidad = existe.cantidad + cantidad;
            const revalidacion = validarReglasB2B(
              nuevaCantidad,
              producto.moq,
              producto.multiplo_lote
            );

            if (!revalidacion.valido) {
              // Mantener estado y retornar error desde fuera
              return state;
            }

            return {
              items: state.items.map((i) =>
                i.producto.id === producto.id
                  ? { ...i, cantidad: nuevaCantidad }
                  : i
              ),
            };
          }

          // No existe: crear nuevo item
          return {
            items: [
              ...state.items,
              { producto, cantidad, precio_unitario: precioUnitario },
            ],
          };
        });

        return { agregado: true, mensaje: "" };
      },

      // ────────────────────────────────────────────────
      // actualizarCantidad — ★ También valida B2B
      // ────────────────────────────────────────────────
      actualizarCantidad: (productoId, nuevaCantidad, moq, multiplo_lote) => {
        // Si la nueva cantidad es 0 o negativa, eliminar
        if (nuevaCantidad <= 0) {
          get().eliminarItem(productoId);
          return { actualizado: true, mensaje: "" };
        }

        // Validar las reglas B2B
        const validacion = validarReglasB2B(nuevaCantidad, moq, multiplo_lote);

        if (!validacion.valido) {
          // ★ No actualizar — mantener la cantidad anterior
          return { actualizado: false, mensaje: validacion.mensaje };
        }

        set((state) => ({
          items: state.items.map((i) =>
            i.producto.id === productoId ? { ...i, cantidad: nuevaCantidad } : i
          ),
        }));

        return { actualizado: true, mensaje: "" };
      },

      eliminarItem: (productoId) => {
        set((state) => ({
          items: state.items.filter((i) => i.producto.id !== productoId),
        }));
      },

      vaciarCarrito: () =>
        set({ items: [], checkoutEstado: "idle", checkoutError: null }),

      abrirCarrito:  () => set({ isOpen: true }),
      cerrarCarrito: () => set({ isOpen: false }),
      toggleCarrito: () => set((state) => ({ isOpen: !state.isOpen })),

      setCheckoutEstado: (estado, error) =>
        set({ checkoutEstado: estado, checkoutError: error ?? null }),

      setUltimoPedidoId: (id) => set({ ultimoPedidoId: id }),

      // ── Selectores ──────────────────────────────────
      totalItems: () =>
        get().items.reduce((acc, i) => acc + i.cantidad, 0),

      subtotal: () =>
        get().items.reduce(
          (acc, i) => acc + i.precio_unitario * i.cantidad,
          0
        ),

      /**
       * ★ Valida TODOS los items del carrito contra las reglas B2B.
       * Retorna un array de resultados para mostrar alertas por item.
       */
      validaciones: () =>
        get().items.map((item) => {
          const resultado = validarReglasB2B(
            item.cantidad,
            item.producto.moq,
            item.producto.multiplo_lote
          );
          return {
            itemId:  item.producto.id,
            valido:  resultado.valido,
            mensaje: resultado.mensaje,
          };
        }),

      /** El carrito es válido SOLO si hay items y todos cumplen las reglas */
      carritoEsValido: () =>
        get().items.length > 0 &&
        get().validaciones().every((v) => v.valido),
    }),
    {
      name: "bazar-carrito-v2",
      storage: createJSONStorage(() => localStorage),
      // Persistir solo los items y el último pedido, no estados de UI
      partialize: (state) => ({
        items: state.items,
        ultimoPedidoId: state.ultimoPedidoId,
      }),
    }
  )
);
