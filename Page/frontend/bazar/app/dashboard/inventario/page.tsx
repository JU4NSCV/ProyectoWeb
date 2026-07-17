"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore, useUsuario, useAccessToken } from "@/store/authStore";
import { useRolStore } from "@/store/rolStore";
import { useToastStore } from "@/store/toastStore";
import { Producto } from "@/types";
import { Button } from "@/components/ui/Button";
import { Dialog } from "@/components/ui/Dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { FormularioProducto } from "./FormularioProducto";
import { Loader2, PackageSearch } from "lucide-react";

export default function InventarioMayoristaPage() {
  const router = useRouter();
  const { estaAutenticado } = useAuthStore();
  const usuario = useUsuario();
  const { agregarToast } = useToastStore();

  const [productos, setProductos] = useState<Producto[]>([]);
  const [cargando, setCargando] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Validaciones
  const esMayorista = usuario?.rol === "MAYORISTA" || usuario?.rol === "mayorista";
  const estaVerificado = usuario?.empresa_verificada === true;

  // Route Guard
  useEffect(() => {
    if (!estaAutenticado) {
      router.push("/");
    }
  }, [estaAutenticado, router]);

  const fetchProductos = async () => {
    try {
      setCargando(true);
      const res = await fetch("http://127.0.0.1:8000/api/productos/");
      if (!res.ok) throw new Error("Error al obtener productos");
      const data = await res.json();
      
      // Filtrar por el username del mayorista logueado
      const misProductos = data.filter(
        (p: Producto) => p.mayorista_nombre === usuario?.username
      );
      setProductos(misProductos);
    } catch (error) {
      agregarToast({
        id: "error-fetch-productos",
        tipo: "error",
        titulo: "Error",
        descripcion: "No se pudieron cargar los productos del inventario.",
      });
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    if (estaAutenticado && esMayorista && usuario?.username) {
      fetchProductos();
    }
  }, [estaAutenticado, esMayorista, usuario?.username]);

  // Si no está autenticado, no es mayorista o no está verificado, mostrar acceso denegado
  // (También redirigirá por el useEffect superior si no está autenticado)
  if (!estaAutenticado || !esMayorista || !estaVerificado) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
        <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center mb-6">
          <PackageSearch className="w-10 h-10 text-red-500" />
        </div>
        <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Acceso Denegado</h1>
        <p className="text-gray-500 mt-2 text-center max-w-md text-lg">
          {!esMayorista 
            ? "Este módulo está reservado exclusivamente para proveedores con rol de Mayorista."
            : "Tu cuenta de Mayorista está pendiente de verificación por un administrador."}
        </p>
        <Button onClick={() => router.push("/")} className="mt-8 bg-gray-900 hover:bg-black text-white px-8 py-2 rounded-full font-medium transition-all shadow-md hover:shadow-lg">
          Volver al Inicio
        </Button>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
        <div>
          <h1 className="text-4xl font-black tracking-tight text-gray-900">
            Inventario B2B
          </h1>
          <p className="text-gray-500 mt-2 text-lg">
            Gestiona tus productos y publicaciones para la red de minoristas.
          </p>
        </div>
        <Button 
          onClick={() => setIsModalOpen(true)} 
          className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-6 py-2.5 rounded-xl shadow-md hover:shadow-lg transition-all flex items-center gap-2"
        >
          <span className="text-lg leading-none">+</span>
          Publicar Nuevo Producto
        </Button>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
        {cargando ? (
          <div className="flex flex-col justify-center items-center py-32">
            <Loader2 className="w-10 h-10 animate-spin text-blue-600 mb-4" />
            <p className="text-gray-500 font-medium">Sincronizando inventario...</p>
          </div>
        ) : (
          <Table>
            <TableHeader className="bg-gray-50/80 border-b border-gray-200">
              <TableRow className="hover:bg-transparent">
                <TableHead className="w-[100px] text-gray-900 font-semibold py-4">Foto</TableHead>
                <TableHead className="text-gray-900 font-semibold py-4">SKU</TableHead>
                <TableHead className="text-gray-900 font-semibold py-4 min-w-[250px]">Nombre</TableHead>
                <TableHead className="text-right text-gray-900 font-semibold py-4">Stock Disponible</TableHead>
                <TableHead className="text-right text-gray-900 font-semibold py-4">Precio B2B</TableHead>
                <TableHead className="text-right text-gray-900 font-semibold py-4">MOQ</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {productos.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-48 text-center">
                    <div className="flex flex-col items-center justify-center">
                      <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-3">
                        <PackageSearch className="w-8 h-8 text-gray-400" />
                      </div>
                      <p className="text-gray-600 font-medium text-lg">Tu inventario está vacío</p>
                      <p className="text-gray-400 text-sm mt-1">Publica tu primer producto para empezar a vender.</p>
                      <Button onClick={() => setIsModalOpen(true)} className="mt-4 bg-gray-900 text-white hover:bg-black rounded-lg">
                        Publicar Producto
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                productos.map((producto) => (
                  <TableRow key={producto.id} className="hover:bg-gray-50/50 transition-colors">
                    <TableCell className="py-3">
                      <div className="w-14 h-14 rounded-xl bg-gray-100 border border-gray-200 flex items-center justify-center overflow-hidden shadow-sm">
                        {producto.imagen ? (
                          <img src={producto.imagen} alt={producto.nombre} className="w-full h-full object-cover" />
                        ) : (
                          <PackageSearch className="w-6 h-6 text-gray-400" />
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="font-medium text-gray-500 align-middle">{producto.sku}</TableCell>
                    <TableCell className="font-bold text-gray-900 text-base align-middle">{producto.nombre}</TableCell>
                    <TableCell className="text-right align-middle">
                      <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold tracking-wide ${producto.stock > 0 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                        {producto.stock} uds
                      </span>
                    </TableCell>
                    <TableCell className="text-right font-black text-blue-700 text-base align-middle">
                      ${Number(producto.precio_minorista).toFixed(2)}
                    </TableCell>
                    <TableCell className="text-right text-gray-600 font-medium align-middle">
                      <span className="bg-gray-100 px-2 py-1 rounded text-xs font-semibold">{producto.moq} uds</span>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        )}
      </div>

      <Dialog
        open={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Publicar Nuevo Producto"
        description="Añade un nuevo producto a tu catálogo mayorista y establece las reglas B2B."
        maxWidth="max-w-3xl"
      >
        <FormularioProducto 
          onSuccess={() => {
            setIsModalOpen(false);
            fetchProductos();
          }} 
          onCancel={() => setIsModalOpen(false)}
        />
      </Dialog>
    </div>
  );
}
