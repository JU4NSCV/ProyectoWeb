# 🛒 Bazar B2B: Plataforma Transaccional Mayorista

> **Estado del Proyecto:** Desarrollo de MVP (Producto Mínimo Viable) para presentación de Agosto.

## 🔗 Recursos y Enlaces del Proyecto
* 🚀 **Prototipo Interactivo (Replit):** [Ver Aplicación en Vivo ](https://code-assistant--jscueva5.replit.app/) *(Simulación funcional con Mock Data)*
* 📋 **Espacio de Trabajo (Notion):** [Acceder al Tablero de Notion](https://www.notion.so/Bazar-B2B-D2C-368f1460c6af804994deebf3e2505409?source=copy_link) *(Gestión de tareas, requerimientos y backlog)*
* 📂 **Repositorio de Documentos (OneDrive):** [Abrir Carpeta de OneDrive](https://1drv.ms/f/c/f8eae564f6fb628e/IgCSiSOXw_r4QYW1xECX9052AQcpdDXc9iVqswX8ijBBHB4?e=3u7kIY) *(Anexos, actas de reuniones y documentación formal)*

---

## 📖 Acerca del Proyecto
**Bazar B2B** es una plataforma digital transaccional que centraliza y digitaliza el canal de ventas al por mayor. Operamos bajo un modelo híbrido **B2B + D2C por volumen**, actuando de manera similar a un club de precios digital. 
La plataforma conecta a proveedores y mayoristas con minoristas (tiendas) y consumidores finales por volumen, funcionando como un intermediario digital que elimina las fricciones del canal tradicional.

## 🎯 Declaración del Problema
* El canal de ventas al por mayor tradicional depende de vendedores de ruta (preventistas) y procesos analógicos que generan altos costos operativos.
* La falta de una plataforma centralizada limita la expansión de mercado de los proveedores.
* Existe un riesgo de pérdida de margen de ganancias si no se controlan estrictamente las reglas de volumen y lotes de venta.

## 👥 Roles y Segmentación de Usuarios
El sistema diferencia a los usuarios para aplicar precios dinámicos y facturación inteligente:
1. **Visitante / Consumidor Final:** Acceso al catálogo público y precios estándar, pudiendo comprar con la condición de cumplir las cantidades mínimas (D2C por volumen).
2. **Minorista B2B (Tienda):** Usuario verificado comercialmente que accede a precios reducidos, descuentos por rol y requiere facturación inteligente.
3. **Mayorista (Proveedor):** Encargado de publicar mercancía masivamente, establecer los lotes y gestionar pedidos.
4. **Super Administrador (Backoffice):** Personal interno de la plataforma que valida usuarios, aprueba tiendas minoristas y gestiona las suscripciones de los proveedores.

## ⚙️ Módulos Principales (El Motor del MVP)
1. **Agregación de Oferta:** Herramientas para que los mayoristas configuren su catálogo, definiendo precios escalonados y configurando las cantidades mínimas de pedido (MOQ).
2. **Descubrimiento y Exhibición:** Interfaz principal con cuadrícula de productos, motor de búsqueda y filtros. El sistema muestra precios dinámicamente: si el usuario no está logueado, ve el precio final; si es minorista aprobado, ve el precio de lista B2B.
3. **Transacción (Carrito Inteligente):** Carrito multicesta capaz de dividir órdenes de diferentes proveedores internamente. Incluye un estricto **Motor de Reglas de Compra** que bloquea la acción y sugiere el mínimo permitido si un usuario intenta saltarse el MOQ o la venta por lotes cerrados (ej. múltiplos de 12).
4. **Gestión Operativa y Fulfillment:** Panel de control (Dashboard) para que los mayoristas cambien el estado de las órdenes (Pendiente, Aprobado, Despachado) y bandeja de validación para el Súper Administrador.

## 💻 Stack Tecnológico
Para garantizar la agilidad, evitar el *Scope Creep* (expansión descontrolada) y cumplir con los tiempos de entrega, utilizamos tecnologías de alto rendimiento:
* **Frontend (Interfaz):** Next.js (React) aprovechando el Renderizado del Lado del Servidor (SSR), lo cual es obligatorio para que el catálogo se posicione en Google (SEO).
* **Estilos y Componentes:** Tailwind CSS junto con componentes prefabricados minimalistas de Shadcn UI y Lucide-react para acelerar la construcción de interfaces.
* **Manejo de Estado:** Context API o Zustand para gestionar reactivamente el carrito y las sesiones de usuario en tiempo real.
* **Backend y Base de Datos:** Supabase (PostgreSQL), un Backend como Servicio (BaaS) que resuelve la arquitectura relacional y la autenticación basada en roles (RBAC) con tokens JWT.
* **Despliegue:** Vercel / Replit, proporcionando despliegues automáticos ideales para entornos Next.js.

## 💰 Modelo de Mantenibilidad
La sostenibilidad financiera del aplicativo está asegurada mediante un **modelo de suscripción**. En lugar de comisiones por transacción, se cobra a los mayoristas planes mensuales/anuales por el derecho a usar la plataforma, dándoles acceso predecible a la red de minoristas.
