"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useAccessToken } from "@/store/authStore";
import { useToastStore } from "@/store/toastStore";
import { Button } from "@/components/ui/Button";
import { Loader2 } from "lucide-react";

const formSchema = z.object({
  nombre: z.string().min(3, "El nombre debe tener al menos 3 caracteres"),
  sku: z.string().min(3, "El SKU debe tener al menos 3 caracteres"),
  descripcion: z.string().min(10, "La descripción debe tener al menos 10 caracteres"),
  categoria: z.string().min(1, "Debes seleccionar una categoría"),
  precio_publico: z.coerce.number().min(0.01, "El precio debe ser mayor a 0"),
  precio_minorista: z.coerce.number().min(0.01, "El precio B2B debe ser mayor a 0"),
  moq: z.coerce.number().int().min(1, "El MOQ debe ser al menos 1"),
  multiplo_lote: z.coerce.number().int().min(1, "El múltiplo debe ser al menos 1"),
  stock: z.coerce.number().int().min(0, "El stock no puede ser negativo"),
});

type FormValues = z.infer<typeof formSchema>;

export function FormularioProducto({ onSuccess, onCancel }: { onSuccess: () => void; onCancel: () => void }) {
  const token = useAccessToken();
  const { agregarToast } = useToastStore();
  const [categorias, setCategorias] = useState<{ id: string | number; nombre: string }[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      moq: 1,
      multiplo_lote: 1,
      stock: 0,
    },
  });

  useEffect(() => {
    const fetchCategorias = async () => {
      try {
        const res = await fetch("http://127.0.0.1:8000/api/categorias/");
        if (res.ok) {
          const data = await res.json();
          setCategorias(data);
        }
      } catch (error) {
        console.error("Error al cargar categorías", error);
      }
    };
    fetchCategorias();
  }, []);

  const onSubmit = async (data: FormValues) => {
    try {
      setIsSubmitting(true);
      
      const payload = {
        ...data,
        categoria: data.categoria, // ID de la categoría
        activo: true,
      };

      const res = await fetch("http://127.0.0.1:8000/api/productos/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload), // El backend asigna 'proveedor' automáticamente
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => null);
        throw new Error(errorData?.detail || "Error al publicar el producto");
      }

      agregarToast({
        id: `success-post-${Date.now()}`,
        tipo: "exito",
        titulo: "¡Producto Publicado!",
        descripcion: "El producto ya está disponible en tu inventario.",
      });

      onSuccess();
    } catch (error: any) {
      agregarToast({
        id: `error-post-${Date.now()}`,
        tipo: "error",
        titulo: "Error de Publicación",
        descripcion: error.message || "Ocurrió un error al procesar tu solicitud.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Información Básica */}
        <div className="space-y-4 col-span-1 md:col-span-2">
          <h3 className="text-sm font-semibold text-gray-900 border-b pb-2">Información Básica</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-sm font-medium text-gray-700">Nombre del Producto</label>
              <input
                {...register("nombre")}
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-black focus:outline-none focus:ring-1 focus:ring-black"
                placeholder="Ej. Taladro Percutor 20V"
              />
              {errors.nombre && <p className="text-xs text-red-500">{errors.nombre.message}</p>}
            </div>
            
            <div className="space-y-1">
              <label className="text-sm font-medium text-gray-700">SKU (Código)</label>
              <input
                {...register("sku")}
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-black focus:outline-none focus:ring-1 focus:ring-black"
                placeholder="Ej. TAL-20V-01"
              />
              {errors.sku && <p className="text-xs text-red-500">{errors.sku.message}</p>}
            </div>
          </div>
          
          <div className="space-y-1">
            <label className="text-sm font-medium text-gray-700">Descripción</label>
            <textarea
              {...register("descripcion")}
              rows={3}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-black focus:outline-none focus:ring-1 focus:ring-black"
              placeholder="Descripción detallada del producto..."
            />
            {errors.descripcion && <p className="text-xs text-red-500">{errors.descripcion.message}</p>}
          </div>

          <div className="space-y-1">
            <label className="text-sm font-medium text-gray-700">Categoría</label>
            <select
              {...register("categoria")}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-black focus:outline-none focus:ring-1 focus:ring-black"
            >
              <option value="">Selecciona una categoría</option>
              {categorias.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.nombre}
                </option>
              ))}
            </select>
            {errors.categoria && <p className="text-xs text-red-500">{errors.categoria.message}</p>}
          </div>
        </div>

        {/* Precios */}
        <div className="space-y-4">
          <h3 className="text-sm font-semibold text-gray-900 border-b pb-2">Precios (USD)</h3>
          <div className="space-y-1">
            <label className="text-sm font-medium text-gray-700">Precio Público (Referencial)</label>
            <input
              type="number"
              step="0.01"
              {...register("precio_publico")}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-black focus:outline-none focus:ring-1 focus:ring-black"
              placeholder="0.00"
            />
            {errors.precio_publico && <p className="text-xs text-red-500">{errors.precio_publico.message}</p>}
          </div>
          
          <div className="space-y-1">
            <label className="text-sm font-medium text-gray-700">Precio Minorista (B2B)</label>
            <input
              type="number"
              step="0.01"
              {...register("precio_minorista")}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-black focus:outline-none focus:ring-1 focus:ring-black bg-blue-50/30"
              placeholder="0.00"
            />
            {errors.precio_minorista && <p className="text-xs text-red-500">{errors.precio_minorista.message}</p>}
          </div>
        </div>

        {/* Reglas de Negocio */}
        <div className="space-y-4">
          <h3 className="text-sm font-semibold text-gray-900 border-b pb-2">Reglas B2B e Inventario</h3>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-sm font-medium text-gray-700">MOQ</label>
              <input
                type="number"
                {...register("moq")}
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-black focus:outline-none focus:ring-1 focus:ring-black"
                title="Cantidad mínima de pedido"
              />
              {errors.moq && <p className="text-xs text-red-500">{errors.moq.message}</p>}
            </div>
            
            <div className="space-y-1">
              <label className="text-sm font-medium text-gray-700">Lote múltiple</label>
              <input
                type="number"
                {...register("multiplo_lote")}
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-black focus:outline-none focus:ring-1 focus:ring-black"
                title="Incrementos de pedido permitidos"
              />
              {errors.multiplo_lote && <p className="text-xs text-red-500">{errors.multiplo_lote.message}</p>}
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-sm font-medium text-gray-700">Stock Disponible</label>
            <input
              type="number"
              {...register("stock")}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-black focus:outline-none focus:ring-1 focus:ring-black"
            />
            {errors.stock && <p className="text-xs text-red-500">{errors.stock.message}</p>}
          </div>
        </div>
      </div>

      <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
        <Button
          type="button"
          onClick={onCancel}
          className="bg-white border border-gray-300 text-gray-700 hover:bg-gray-50"
        >
          Cancelar
        </Button>
        <Button
          type="submit"
          disabled={isSubmitting}
          className="bg-blue-600 hover:bg-blue-700 text-white min-w-[140px]"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Publicando...
            </>
          ) : (
            "Publicar Producto"
          )}
        </Button>
      </div>
    </form>
  );
}
