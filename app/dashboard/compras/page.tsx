"use client";
import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "../../../components/ui/button";
import { Input } from "../../../components/ui/input";
import { LayoutDashboard, Search } from "lucide-react";

export default function ComprasPage() {
  const router = useRouter();
  const [facturas, setFacturas] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchFactura, setSearchFactura] = useState("");
  const [searchCliente, setSearchCliente] = useState("");
  
  // Estado de paginación
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalFacturas, setTotalFacturas] = useState(0);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 100,
    total: 0,
    totalPages: 1,
    hasNextPage: false,
    hasPrevPage: false
  });
  
  // Filtrar facturas basado en búsqueda
  const facturasFiltradas = facturas.filter(factura => {
    const numeroFactura = factura.invoice_no?.toLowerCase() || "";
    const nombreCliente = (factura.contact_name || factura.supplier_business_name || "").toLowerCase();
    
    const coincideFactura = searchFactura === "" || numeroFactura.includes(searchFactura.toLowerCase());
    const coincideCliente = searchCliente === "" || nombreCliente.includes(searchCliente.toLowerCase());
    
    return coincideFactura && coincideCliente;
  });

  // Función para recargar facturas (mantiene la página actual)
  const handleRecargar = () => {
    cargarFacturas(currentPage);
  };

  // Función para ir a la página anterior
  const handlePrevPage = () => {
    if (pagination.hasPrevPage) {
      cargarFacturas(currentPage - 1);
    }
  };

  // Función para ir a la página siguiente
  const handleNextPage = () => {
    if (pagination.hasNextPage) {
      cargarFacturas(currentPage + 1);
    }
  };

  // Función para ir a una página específica
  const handleGoToPage = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      cargarFacturas(page);
    }
  };

  // Función para cargar facturas
  const cargarFacturas = async (page = 1) => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      if (!token) {
        console.error('No se encontró token de autenticación');
        return;
      }

      const response = await fetch(`/api/transactions?page=${page}&limit=100`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setFacturas(data.transactions || []);
        setTotalFacturas(data.total || 0);
        setPagination(data.pagination || {
          page: 1,
          limit: 100,
          total: 0,
          totalPages: 1,
          hasNextPage: false,
          hasPrevPage: false
        });
        setCurrentPage(page);
        setTotalPages(data.pagination?.totalPages || 1);
      } else {
        console.error('Error al cargar facturas');
      }
    } catch (error) {
      console.error('Error al cargar facturas:', error);
    } finally {
      setLoading(false);
    }
  };

  // Cargar facturas al montar el componente
  useEffect(() => {
    cargarFacturas();
  }, []);

  // Función para ver factura
  const handleVerFactura = (factura: any) => {
    console.log("Viendo factura:", factura);
    alert(`Viendo factura: ${factura.invoice_no}\nCliente: ${factura.contact_name || factura.supplier_business_name}\nTotal: $${parseFloat(factura.final_total).toLocaleString('es-CO', { minimumFractionDigits: 2 })}`);
  };

  // Función para editar factura
  const handleEditarFactura = (factura: any) => {
    try {
      console.log("🔄 Editando factura:", factura);
      console.log("📋 ID de la factura:", factura.id);
      console.log("📋 Tipo de factura:", factura.type);
      console.log("📋 Cliente:", factura.contact_name || factura.supplier_business_name);
      console.log("💾 Guardando factura en localStorage...");
      
      // Verificar que la factura tenga los datos necesarios
      if (!factura.id) {
        console.error("❌ Error: La factura no tiene ID");
        return;
      }
      
      // Guardar los datos de la factura en localStorage para el POS
      localStorage.setItem('editingTransaction', JSON.stringify(factura));
      console.log("✅ Factura guardada en localStorage");
      
      // Verificar que se guardó correctamente
      const savedFactura = localStorage.getItem('editingTransaction');
      console.log("🔍 Factura guardada en localStorage:", savedFactura);
      
      // Redirigir al POS
      console.log("🔄 Redirigiendo al POS...");
      router.push('/pos');
    } catch (error) {
      console.error("❌ Error en handleEditarFactura:", error);
    }
  };

  // Función para imprimir factura
  const handleImprimirFactura = (factura: any) => {
    console.log("Imprimiendo factura:", factura);
    
    // Crear contenido para imprimir
    const contenidoImpresion = `
      FACTURA DE COMPRA
      =================
      
      Número: ${factura.invoice_no}
      Fecha: ${new Date(factura.transaction_date).toLocaleDateString('es-CO')}
      Cliente: ${factura.contact_name || factura.supplier_business_name || 'Cliente genérico'}
      Total: $${parseFloat(factura.final_total).toLocaleString('es-CO', { minimumFractionDigits: 2 })}
      Estado: ${factura.status}
      Tipo: ${factura.type === 'sell' ? 'Venta' : factura.type}
      
      =================
      Sistema POS Restaurante
    `;
    
    // Abrir ventana de impresión
    const ventanaImpresion = window.open('', '_blank');
    if (ventanaImpresion) {
      ventanaImpresion.document.write(`
        <html>
          <head>
            <title>Factura ${factura.invoice_no}</title>
            <style>
              body { font-family: Arial, sans-serif; margin: 20px; }
              .factura { border: 1px solid #ccc; padding: 20px; }
              .titulo { text-align: center; font-size: 18px; font-weight: bold; margin-bottom: 20px; }
              .campo { margin: 10px 0; }
              .label { font-weight: bold; }
            </style>
          </head>
          <body>
            <div class="factura">
              <div class="titulo">FACTURA DE COMPRA</div>
              <div class="campo">
                <span class="label">Número:</span> ${factura.invoice_no}
              </div>
              <div class="campo">
                <span class="label">Fecha:</span> ${new Date(factura.transaction_date).toLocaleDateString('es-CO')}
              </div>
              <div class="campo">
                <span class="label">Cliente:</span> ${factura.contact_name || factura.supplier_business_name || 'Cliente genérico'}
              </div>
              <div class="campo">
                <span class="label">Total:</span> $${parseFloat(factura.final_total).toLocaleString('es-CO', { minimumFractionDigits: 2 })}
              </div>
              <div class="campo">
                <span class="label">Estado:</span> ${factura.status}
              </div>
              <div class="campo">
                <span class="label">Tipo:</span> ${factura.type === 'sell' ? 'Venta' : factura.type}
              </div>
            </div>
            <script>
              window.onload = function() {
                window.print();
                window.close();
              };
            </script>
          </body>
        </html>
      `);
      ventanaImpresion.document.close();
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="p-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-bold text-gray-800 mb-2">Lista de Ventas</h1>
            <p className="text-gray-600 text-lg">Gestiona todas las transacciones y facturas</p>
          </div>
          <div className="flex gap-4">
            <Button
              onClick={() => router.push("/dashboard")}
              variant="outline"
              className="bg-white/80 backdrop-blur-sm text-purple-700 border-purple-300 hover:bg-purple-50 hover:border-purple-400 shadow-sm transition-all duration-200"
            >
              <LayoutDashboard className="mr-2 h-4 w-4" />
              Dashboard
            </Button>
            <Button
              onClick={handleRecargar}
              className="bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white shadow-lg hover:shadow-xl transition-all duration-200"
            >
              <Search className="mr-2 h-4 w-4" />
              Recargar
            </Button>
          </div>
        </div>

        {/* Buscadores */}
        <div className="bg-white/80 backdrop-blur-sm rounded-xl p-6 mb-8 shadow-lg border border-gray-200">
          <div className="flex gap-6">
            <div className="flex-1 relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <Input
                placeholder="Buscar por número de factura..."
                value={searchFactura}
                onChange={(e) => setSearchFactura(e.target.value)}
                className="pl-12 py-3 bg-white border-gray-300 focus:border-purple-400 focus:ring-purple-400 rounded-lg"
              />
            </div>
            <div className="flex-1 relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <Input
                placeholder="Buscar por cliente..."
                value={searchCliente}
                onChange={(e) => setSearchCliente(e.target.value)}
                className="pl-12 py-3 bg-white border-gray-300 focus:border-purple-400 focus:ring-purple-400 rounded-lg"
              />
            </div>
          </div>
          
          {/* Información de paginación */}
          <div className="mt-4 text-center">
            <p className="text-gray-600">
              {loading ? 'Cargando...' : `Página ${currentPage} de ${totalPages} - ${facturasFiltradas.length} de ${totalFacturas} factura${totalFacturas !== 1 ? 's' : ''} total${totalFacturas !== 1 ? 'es' : ''}`}
            </p>
          </div>
        </div>

        {/* Tabla de facturas */}
        <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-lg overflow-hidden border border-gray-200">
          {loading ? (
            <div className="p-16 text-center">
              <div className="w-12 h-12 border-4 border-purple-200 border-t-purple-600 rounded-full animate-spin mx-auto mb-6"></div>
              <div className="text-gray-600 text-lg">Cargando facturas...</div>
            </div>
          ) : facturasFiltradas.length === 0 ? (
            <div className="p-16 text-center">
              <div className="w-20 h-20 bg-gradient-to-r from-purple-400 to-purple-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
                <Search className="h-10 w-10 text-white" />
              </div>
              <div className="text-gray-600 text-lg">
                {facturas.length === 0 
                  ? "No hay facturas registradas. Crea tu primera factura para comenzar."
                  : "No se encontraron facturas con los criterios de búsqueda especificados."
                }
              </div>
            </div>
          ) : (
            <div className="overflow-x-auto min-w-full">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-purple-50">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-purple-700 uppercase tracking-wider">
                      Número de Factura
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-purple-700 uppercase tracking-wider">
                      Cliente/Proveedor
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-purple-700 uppercase tracking-wider">
                      Fecha
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-purple-700 uppercase tracking-wider">
                      Total
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-purple-700 uppercase tracking-wider">
                      Estado
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-purple-700 uppercase tracking-wider">
                      Tipo
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-purple-700 uppercase tracking-wider min-w-[180px]">
                      Acciones
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {facturasFiltradas.map((factura) => (
                    <tr key={factura.id} className="hover:bg-purple-50 transition-colors duration-200">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-800">
                        {factura.invoice_no}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        {factura.contact_name || factura.supplier_business_name || 'Cliente genérico'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        {new Date(factura.transaction_date).toLocaleDateString('es-CO')}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-purple-700">
                        ${parseFloat(factura.final_total).toLocaleString('es-CO', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-3 py-1 text-xs font-semibold rounded-full ${
                          factura.status === 'final' ? 'bg-green-100 text-green-800 border border-green-200' : 
                          factura.status === 'pending' ? 'bg-yellow-100 text-yellow-800 border border-yellow-200' : 
                          'bg-gray-100 text-gray-800 border border-gray-200'
                        }`}>
                          {factura.status === 'final' ? 'Completada' : 
                           factura.status === 'pending' ? 'Pendiente' : factura.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        {factura.type === 'sell' ? 'Venta' : factura.type}
                      </td>
                      <td className="px-6 py-4 text-sm font-medium">
                        <div className="flex gap-2">
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => handleVerFactura(factura)}
                            className="text-purple-600 border-purple-300 hover:bg-purple-50 hover:border-purple-400 px-3 py-1 text-xs"
                          >
                            👁️ Ver
                          </Button>
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => handleEditarFactura(factura)}
                            className="text-purple-600 border-purple-300 hover:bg-purple-50 hover:border-purple-400 px-3 py-1 text-xs"
                          >
                            ✏️ Editar
                          </Button>
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => handleImprimirFactura(factura)}
                            className="text-purple-600 border-purple-300 hover:bg-purple-50 hover:border-purple-400 px-3 py-1 text-xs"
                          >
                            🖨️ Imprimir
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Controles de Paginación */}
        {!loading && facturasFiltradas.length > 0 && (
          <div className="bg-white/80 backdrop-blur-sm rounded-xl p-6 mt-8 shadow-lg border border-gray-200">
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-600 font-medium">
                Mostrando página {currentPage} de {totalPages} ({totalFacturas} facturas totales)
              </div>
              <div className="flex items-center gap-3">
                <Button
                  variant="outline"
                  onClick={handlePrevPage}
                  disabled={!pagination.hasPrevPage}
                  className="bg-white/80 backdrop-blur-sm border-purple-300 hover:bg-purple-50 hover:text-purple-700 text-purple-600 disabled:opacity-50 shadow-sm transition-all duration-200"
                >
                  ← Anterior
                </Button>
                
                <div className="flex items-center gap-2">
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    let pageNum;
                    if (totalPages <= 5) {
                      pageNum = i + 1;
                    } else if (currentPage <= 3) {
                      pageNum = i + 1;
                    } else if (currentPage >= totalPages - 2) {
                      pageNum = totalPages - 4 + i;
                    } else {
                      pageNum = currentPage - 2 + i;
                    }
                    
                    return (
                      <Button
                        key={pageNum}
                        variant={currentPage === pageNum ? "default" : "outline"}
                        onClick={() => handleGoToPage(pageNum)}
                        className={
                          currentPage === pageNum 
                            ? "bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white shadow-lg" 
                            : "bg-white/80 backdrop-blur-sm border-purple-300 hover:bg-purple-50 hover:text-purple-700 text-purple-600 shadow-sm transition-all duration-200"
                        }
                        size="sm"
                      >
                        {pageNum}
                      </Button>
                    );
                  })}
                </div>
                
                <Button
                  variant="outline"
                  onClick={handleNextPage}
                  disabled={!pagination.hasNextPage}
                  className="bg-white/80 backdrop-blur-sm border-purple-300 hover:bg-purple-50 hover:text-purple-700 text-purple-600 disabled:opacity-50 shadow-sm transition-all duration-200"
                >
                  Siguiente →
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 