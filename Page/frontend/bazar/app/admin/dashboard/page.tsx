"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore, useUsuario, useAccessToken } from "@/store/authStore";
import { useToastStore } from "@/store/toastStore";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Loader2, ShieldAlert, CheckCircle2, FileText, Building2, Store, Users } from "lucide-react";

interface Empresa {
  id: number;
  username: string;
  email: string;
  rol: "MINORISTA" | "MAYORISTA" | string;
  ruc: string;
  razon_social: string;
  documento_verificacion: string | null;
  empresa_verificada: boolean;
  telefono_contacto: string;
}

export default function AdminDashboardPage() {
  const router = useRouter();
  const { estaAutenticado } = useAuthStore();
  const usuario = useUsuario();
  const token = useAccessToken();
  const { agregarToast } = useToastStore();

  const [empresas, setEmpresas] = useState<Empresa[]>([]);
  const [cargando, setCargando] = useState(true);
  const [verificandoId, setVerificandoId] = useState<number | null>(null);

  // 1. Guard de Seguridad (is_superuser / ADMIN)
  const esAdmin = usuario?.rol === "ADMIN";

  useEffect(() => {
    if (!estaAutenticado) {
      router.push("/");
    }
  }, [estaAutenticado, router]);

  const fetchEmpresas = async () => {
    try {
      setCargando(true);
      const res = await fetch("http://127.0.0.1:8000/api/admin/empresas/", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      
      if (!res.ok) throw new Error("Error al obtener la lista de empresas");
      const data = await res.json();
      setEmpresas(data);
    } catch (error) {
      agregarToast({
        id: "error-fetch-empresas",
        tipo: "error",
        titulo: "Error de conexión",
        descripcion: "No se pudo cargar la lista de empresas comerciales.",
      });
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    if (estaAutenticado && esAdmin && token) {
      fetchEmpresas();
    }
  }, [estaAutenticado, esAdmin, token]);

  const handleVerificarEmpresa = async (id: number) => {
    try {
      setVerificandoId(id);
      const res = await fetch(`http://127.0.0.1:8000/api/admin/empresas/${id}/verificar_empresa/`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ empresa_verificada: true }),
      });

      if (!res.ok) {
        throw new Error("No se pudo verificar la empresa");
      }

      // Actualizar el estado local
      setEmpresas((prev) =>
        prev.map((emp) =>
          emp.id === id ? { ...emp, empresa_verificada: true } : emp
        )
      );

      agregarToast({
        id: `verificacion-${id}`,
        tipo: "exito",
        titulo: "Empresa Verificada",
        descripcion: "La empresa ha sido aprobada correctamente en la red B2B.",
      });
    } catch (error: any) {
      agregarToast({
        id: `error-verif-${id}`,
        tipo: "error",
        titulo: "Error",
        descripcion: error.message || "Ocurrió un error al procesar la verificación.",
      });
    } finally {
      setVerificandoId(null);
    }
  };

  if (!estaAutenticado || !esAdmin) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh] bg-gray-50 rounded-2xl shadow-inner border border-gray-200 p-8 m-6">
        <ShieldAlert className="w-20 h-20 text-red-600 mb-4" />
        <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Acceso Denegado</h1>
        <p className="text-gray-600 mt-2 text-center max-w-md text-lg">
          Esta área está restringida exclusivamente a <strong className="text-gray-900">Súper Administradores</strong>.
        </p>
        <Button onClick={() => router.push("/")} className="mt-8">
          Volver al Inicio
        </Button>
      </div>
    );
  }

  // Estadísticas rápidas
  const totalEmpresas = empresas.length;
  const empresasPendientes = empresas.filter((e) => !e.empresa_verificada).length;
  const empresasVerificadas = totalEmpresas - empresasPendientes;

  return (
    <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 space-y-8 animate-in fade-in duration-500 bg-gray-50/50 min-h-screen">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-gray-900 flex items-center gap-2">
            <ShieldAlert className="w-8 h-8 text-indigo-600" />
            Backoffice Administrativo
          </h1>
          <p className="text-gray-500 mt-1">
            Gestión y auditoría de la red de empresas B2B (Mayoristas y Minoristas).
          </p>
        </div>
      </div>

      {/* Cards de Estadísticas */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="border-l-4 border-l-indigo-600 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-semibold text-gray-600 uppercase tracking-wider">
              Total Empresas
            </CardTitle>
            <Building2 className="w-5 h-5 text-indigo-600" />
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-black text-gray-900">{totalEmpresas}</div>
            <p className="text-xs text-gray-500 mt-1">Empresas registradas en la red</p>
          </CardContent>
        </Card>
        
        <Card className="border-l-4 border-l-amber-500 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-semibold text-gray-600 uppercase tracking-wider">
              Pendientes de Verificación
            </CardTitle>
            <Users className="w-5 h-5 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-black text-gray-900">{empresasPendientes}</div>
            <p className="text-xs text-gray-500 mt-1">Requieren acción inmediata</p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-emerald-500 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-semibold text-gray-600 uppercase tracking-wider">
              Empresas Activas
            </CardTitle>
            <Store className="w-5 h-5 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-black text-gray-900">{empresasVerificadas}</div>
            <p className="text-xs text-gray-500 mt-1">Operando con acceso B2B</p>
          </CardContent>
        </Card>
      </div>

      {/* Tabla de Empresas */}
      <Card className="shadow-sm border-gray-200">
        <CardHeader className="bg-white border-b border-gray-100 pb-4">
          <CardTitle className="text-xl font-bold text-gray-900">Directorio de Empresas Comerciales</CardTitle>
        </CardHeader>
        <CardContent className="p-0 bg-white overflow-hidden rounded-b-xl">
          {cargando ? (
            <div className="flex flex-col items-center justify-center py-24">
              <Loader2 className="w-8 h-8 animate-spin text-indigo-600 mb-4" />
              <p className="text-gray-500 font-medium">Cargando datos del sistema...</p>
            </div>
          ) : (
            <Table>
              <TableHeader className="bg-gray-50">
                <TableRow className="hover:bg-transparent border-gray-200">
                  <TableHead className="font-semibold text-gray-700 py-4">Usuario</TableHead>
                  <TableHead className="font-semibold text-gray-700 py-4">Razón Social</TableHead>
                  <TableHead className="font-semibold text-gray-700 py-4">RUC / ID</TableHead>
                  <TableHead className="font-semibold text-gray-700 py-4">Rol</TableHead>
                  <TableHead className="font-semibold text-gray-700 py-4 text-center">Documento</TableHead>
                  <TableHead className="font-semibold text-gray-700 py-4 text-right pr-6">Estado / Acción</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {empresas.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="h-32 text-center text-gray-500">
                      No hay empresas comerciales registradas todavía.
                    </TableCell>
                  </TableRow>
                ) : (
                  empresas.map((emp) => (
                    <TableRow key={emp.id} className="hover:bg-gray-50/50 transition-colors">
                      <TableCell className="font-medium text-gray-900">
                        {emp.username}
                        <div className="text-xs text-gray-400 font-normal">{emp.email}</div>
                      </TableCell>
                      <TableCell className="text-gray-700 font-medium">{emp.razon_social || "—"}</TableCell>
                      <TableCell className="text-gray-600 font-mono text-sm">{emp.ruc || "—"}</TableCell>
                      <TableCell>
                        <span className={`inline-flex px-2 py-1 rounded text-xs font-bold tracking-wide uppercase ${emp.rol === 'MAYORISTA' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'}`}>
                          {emp.rol}
                        </span>
                      </TableCell>
                      <TableCell className="text-center">
                        {emp.documento_verificacion ? (
                          <a
                            href={emp.documento_verificacion}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 text-sm font-medium text-indigo-600 hover:text-indigo-800 bg-indigo-50 hover:bg-indigo-100 px-3 py-1.5 rounded-lg transition-colors"
                          >
                            <FileText className="w-4 h-4" />
                            Ver Doc
                          </a>
                        ) : (
                          <span className="text-gray-400 text-sm italic">Sin adjunto</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right pr-6">
                        {emp.empresa_verificada ? (
                          <div className="flex items-center justify-end gap-2">
                            <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-green-100 text-green-800">
                              <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
                              Verificada
                            </span>
                          </div>
                        ) : (
                          <div className="flex items-center justify-end gap-3">
                            <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800">
                              Pendiente
                            </span>
                            <Button
                              onClick={() => handleVerificarEmpresa(emp.id)}
                              disabled={verificandoId === emp.id}
                              size="sm"
                              className="bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm"
                            >
                              {verificandoId === emp.id ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                              ) : (
                                "Aprobar Empresa"
                              )}
                            </Button>
                          </div>
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
