"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../../components/ui/card";
import { Button } from "../../../components/ui/button";
import { Badge } from "../../../components/ui/badge";
import { Separator } from "../../../components/ui/separator";
import { 
  BookOpen, 
  ChevronRight, 
  Play, 
  Download,
  Printer,
  Settings,
  Users,
  ShoppingCart,
  Table,
  ChefHat,
  CreditCard,
  BarChart3,
  FileText
} from "lucide-react";

export default function ManualPage() {
  const [expandedSections, setExpandedSections] = useState<string[]>([]);

  const manualSections = [
    {
      id: "introduction",
      title: "Introducción al Sistema",
      icon: BookOpen,
      content: {
        overview: "El sistema POS para restaurantes es una solución completa que permite gestionar todas las operaciones de tu negocio desde un solo lugar.",
        features: [
          "Gestión de pedidos en tiempo real",
          "Control de mesas y reservas",
          "Panel de cocina integrado",
          "Gestión de clientes y fidelidad",
          "Múltiples métodos de pago",
          "Reportes y estadísticas",
          "Gestión de inventario",
          "Configuración personalizable"
        ],
        requirements: [
          "Navegador web moderno (Chrome, Firefox, Safari, Edge)",
          "Conexión a internet estable",
          "Dispositivo táctil recomendado para mejor experiencia",
          "Impresora térmica (opcional)"
        ]
      }
    },
    {
      id: "getting-started",
      title: "Primeros Pasos",
      icon: Play,
      content: {
        steps: [
          {
            step: 1,
            title: "Configuración inicial",
            description: "Configura los datos básicos de tu negocio",
            details: [
              "Ingresa el nombre de tu restaurante",
              "Configura la dirección y datos de contacto",
              "Establece el horario de operación",
              "Sube el logo de tu negocio"
            ]
          },
          {
            step: 2,
            title: "Configurar ubicaciones",
            description: "Define las áreas de tu restaurante",
            details: [
              "Crea áreas como 'Terraza', 'Interior', 'Bar'",
              "Asigna mesas a cada área",
              "Configura la capacidad de cada mesa",
              "Establece el estado inicial de las mesas"
            ]
          },
          {
            step: 3,
            title: "Agregar productos",
            description: "Crea tu catálogo de productos",
            details: [
              "Crea categorías de productos (Entradas, Platos principales, etc.)",
              "Agrega productos con nombre, descripción y precio",
              "Sube imágenes de los productos",
              "Configura ingredientes y recetas si es necesario"
            ]
          },
          {
            step: 4,
            title: "Configurar pagos",
            description: "Establece los métodos de pago aceptados",
            details: [
              "Habilita efectivo como método de pago",
              "Configura terminales de tarjeta si los tienes",
              "Establece pagos digitales (QR, apps)",
              "Configura impresoras para tickets"
            ]
          }
        ]
      }
    },
    {
      id: "pos-operations",
      title: "Operaciones del Punto de Venta",
      icon: ShoppingCart,
      content: {
        sections: [
          {
            title: "Iniciar una venta",
            steps: [
              "Selecciona una mesa libre o crea un pedido para llevar",
              "El sistema abrirá automáticamente el carrito",
              "Comienza a agregar productos al pedido"
            ]
          },
          {
            title: "Agregar productos",
            steps: [
              "Navega por las categorías de productos",
              "Haz clic en el producto para agregarlo al carrito",
              "Modifica la cantidad si es necesario",
              "Agrega notas especiales al producto si el cliente lo solicita"
            ]
          },
          {
            title: "Gestionar el carrito",
            steps: [
              "Revisa los productos agregados en el panel derecho",
              "Modifica cantidades con los botones + y -",
              "Elimina productos que no se necesiten",
              "Aplica descuentos si corresponde",
              "Agrega propina si es costumbre en tu negocio"
            ]
          },
          {
            title: "Finalizar la venta",
            steps: [
              "Revisa el total de la cuenta",
              "Selecciona el método de pago",
              "Procesa el pago según el método elegido",
              "Imprime o envía el ticket al cliente",
              "Cierra la mesa para nuevos clientes"
            ]
          }
        ]
      }
    },
    {
      id: "table-management",
      title: "Gestión de Mesas",
      icon: Table,
      content: {
        sections: [
          {
            title: "Vista general de mesas",
            description: "El sistema muestra todas las mesas organizadas por área con su estado actual.",
            states: [
              "Libre - Mesa disponible para nuevos clientes",
              "Ocupada - Mesa con clientes activos",
              "Reservada - Mesa reservada para una hora específica",
              "Mantenimiento - Mesa fuera de servicio"
            ]
          },
          {
            title: "Operaciones básicas",
            operations: [
              {
                name: "Abrir mesa",
                description: "Asignar mesa a nuevos clientes",
                steps: ["Selecciona la mesa libre", "Haz clic en 'Abrir Mesa'", "Ingresa el número de personas"]
              },
              {
                name: "Transferir mesa",
                description: "Mover clientes a otra ubicación",
                steps: ["Selecciona la mesa ocupada", "Haz clic en 'Transferir'", "Elige la nueva ubicación"]
              },
              {
                name: "Combinar mesas",
                description: "Unir mesas para grupos grandes",
                steps: ["Selecciona las mesas a combinar", "Haz clic en 'Combinar'", "Confirma la operación"]
              },
              {
                name: "Cerrar mesa",
                description: "Finalizar servicio y liberar mesa",
                steps: ["Procesa el pago completo", "Haz clic en 'Cerrar Mesa'", "Confirma la operación"]
              }
            ]
          }
        ]
      }
    },
    {
      id: "kitchen-panel",
      title: "Panel de Cocina",
      icon: ChefHat,
      content: {
        overview: "El panel de cocina permite al personal de cocina ver y gestionar todos los pedidos en tiempo real.",
        features: [
          {
            title: "Vista de pedidos",
            description: "Los pedidos se muestran organizados por prioridad y tiempo de espera",
            details: [
              "Pedidos nuevos aparecen destacados",
              "Tiempo transcurrido desde el pedido",
              "Detalles específicos de cada producto",
              "Notas especiales del cliente"
            ]
          },
          {
            title: "Gestión de estados",
            description: "Actualiza el estado de cada producto según el progreso",
            states: [
              "Pendiente - Producto recién pedido",
              "En preparación - Producto siendo cocinado",
              "Listo - Producto terminado y listo para servir",
              "Entregado - Producto ya servido al cliente"
            ]
          },
          {
            title: "Comunicación",
            description: "Sistema de comunicación entre cocina y sala",
            features: [
              "Notificaciones automáticas cuando un pedido está listo",
              "Mensajes especiales para el personal de sala",
              "Alertas de productos agotados",
              "Estimaciones de tiempo de preparación"
            ]
          }
        ]
      }
    },
    {
      id: "customer-management",
      title: "Gestión de Clientes",
      icon: Users,
      content: {
        sections: [
          {
            title: "Base de datos de clientes",
            description: "Mantén un registro completo de todos tus clientes",
            features: [
              "Información personal (nombre, teléfono, email)",
              "Historial completo de pedidos",
              "Preferencias y alergias",
              "Puntos de fidelidad acumulados",
              "Fecha de registro y última visita"
            ]
          },
          {
            title: "Búsqueda de clientes",
            description: "Encuentra rápidamente clientes existentes",
            methods: [
              "Búsqueda por nombre",
              "Búsqueda por número de teléfono",
              "Búsqueda por email",
              "Filtros por frecuencia de visita",
              "Búsqueda por puntos de fidelidad"
            ]
          },
          {
            title: "Programa de fidelidad",
            description: "Sistema de recompensas para clientes frecuentes",
            features: [
              "Acumulación automática de puntos por compras",
              "Diferentes niveles de fidelidad",
              "Descuentos automáticos por puntos",
              "Ofertas especiales para clientes VIP",
              "Cumpleaños y aniversarios especiales"
            ]
          }
        ]
      }
    },
    {
      id: "reports-analytics",
      title: "Reportes y Estadísticas",
      icon: BarChart3,
      content: {
        overview: "El sistema genera reportes detallados para ayudarte a tomar decisiones informadas sobre tu negocio.",
        reports: [
          {
            title: "Ventas diarias",
            description: "Resumen de ventas del día actual",
            metrics: ["Total de ventas", "Número de transacciones", "Promedio por ticket", "Productos más vendidos"]
          },
          {
            title: "Ventas por período",
            description: "Análisis de ventas por fechas específicas",
            metrics: ["Comparación día a día", "Tendencias semanales", "Análisis mensual", "Crecimiento anual"]
          },
          {
            title: "Productos",
            description: "Análisis detallado de productos",
            metrics: ["Productos más vendidos", "Productos menos vendidos", "Margen de ganancia", "Rotación de inventario"]
          },
          {
            title: "Clientes",
            description: "Información sobre el comportamiento de clientes",
            metrics: ["Clientes nuevos vs recurrentes", "Valor promedio por cliente", "Frecuencia de visita", "Segmentación de clientes"]
          },
          {
            title: "Métodos de pago",
            description: "Análisis de preferencias de pago",
            metrics: ["Distribución por método de pago", "Tendencias de pago", "Comisiones por método", "Eficiencia de cobro"]
          }
        ]
      }
    },
    {
      id: "configuration",
      title: "Configuración del Sistema",
      icon: Settings,
      content: {
        sections: [
          {
            title: "Configuración general",
            settings: [
              {
                name: "Datos del negocio",
                description: "Información básica del restaurante",
                options: ["Nombre del negocio", "Dirección y contacto", "Horarios de operación", "Logo y branding"]
              },
              {
                name: "Configuración regional",
                description: "Ajustes según tu ubicación",
                options: ["Moneda local", "Formato de fecha y hora", "Idioma del sistema", "Zona horaria"]
              },
              {
                name: "Configuración de impresión",
                description: "Ajustes para tickets y reportes",
                options: ["Impresora térmica", "Formato de ticket", "Información a mostrar", "Copias de tickets"]
              }
            ]
          },
          {
            title: "Configuración de usuarios",
            description: "Gestión de personal y permisos",
            features: [
              "Crear cuentas de usuario para el personal",
              "Asignar roles y permisos específicos",
              "Configurar horarios de acceso",
              "Monitorear actividad de usuarios"
            ]
          },
          {
            title: "Configuración de seguridad",
            description: "Protección de datos y acceso",
            features: [
              "Contraseñas seguras obligatorias",
              "Autenticación de dos factores",
              "Registro de actividades del sistema",
              "Respaldo automático de datos"
            ]
          }
        ]
      }
    }
  ];

  const toggleSection = (sectionId: string) => {
    setExpandedSections(prev => 
      prev.includes(sectionId) 
        ? prev.filter(id => id !== sectionId)
        : [...prev, sectionId]
    );
  };

  return (
    <div className="container mx-auto p-6 max-w-6xl">
      <div className="mb-8">
        <div className="flex items-center space-x-3 mb-4">
          <BookOpen className="h-8 w-8 text-blue-600" />
          <h1 className="text-3xl font-bold text-gray-900">
            Manual de Usuario
          </h1>
        </div>
        <p className="text-gray-600 mb-4">
          Guía completa para utilizar todas las funcionalidades del sistema de restaurante
        </p>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" className="flex items-center space-x-2">
            <Download className="h-4 w-4" />
            <span>Descargar PDF</span>
          </Button>
          <Button variant="outline" size="sm" className="flex items-center space-x-2">
            <Printer className="h-4 w-4" />
            <span>Imprimir Manual</span>
          </Button>
        </div>
      </div>

      {/* Table of Contents */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <FileText className="h-5 w-5" />
            <span>Índice del Manual</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {manualSections.map((section, index) => (
              <button
                key={section.id}
                onClick={() => toggleSection(section.id)}
                className="flex items-center space-x-3 p-3 rounded-lg hover:bg-gray-50 transition-colors text-left"
              >
                <Badge variant="secondary">{index + 1}</Badge>
                <section.icon className="h-5 w-5 text-blue-600" />
                <span className="font-medium">{section.title}</span>
                <ChevronRight className="h-4 w-4 text-gray-400 ml-auto" />
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Manual Sections */}
      <div className="space-y-8">
        {manualSections.map((section) => {
          const isExpanded = expandedSections.includes(section.id);
          
          return (
            <Card key={section.id}>
              <CardHeader>
                <button
                  onClick={() => toggleSection(section.id)}
                  className="flex items-center justify-between w-full text-left"
                >
                  <CardTitle className="flex items-center space-x-3">
                    <section.icon className="h-6 w-6 text-blue-600" />
                    <span>{section.title}</span>
                  </CardTitle>
                  <ChevronRight className={`h-5 w-5 text-gray-400 transition-transform ${isExpanded ? 'rotate-90' : ''}`} />
                </button>
              </CardHeader>
              
              {isExpanded && (
                <CardContent className="pt-0">
                  <Separator className="mb-6" />
                  
                  {/* Render different content based on section type */}
                  {section.id === "introduction" && (
                    <div className="space-y-6">
                      <div>
                        <h3 className="text-lg font-semibold mb-3">Descripción General</h3>
                        <p className="text-gray-700 leading-relaxed">{section.content.overview}</p>
                      </div>
                      
                      <div>
                        <h3 className="text-lg font-semibold mb-3">Características Principales</h3>
                        <ul className="grid grid-cols-1 md:grid-cols-2 gap-2">
                          {section.content.features.map((feature, index) => (
                            <li key={index} className="flex items-center space-x-2">
                              <div className="h-2 w-2 bg-blue-600 rounded-full"></div>
                              <span className="text-gray-700">{feature}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                      
                      <div>
                        <h3 className="text-lg font-semibold mb-3">Requisitos del Sistema</h3>
                        <ul className="space-y-2">
                          {section.content.requirements.map((req, index) => (
                            <li key={index} className="flex items-center space-x-2">
                              <div className="h-2 w-2 bg-green-600 rounded-full"></div>
                              <span className="text-gray-700">{req}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  )}

                  {section.id === "getting-started" && (
                    <div className="space-y-6">
                      {section.content.steps.map((step) => (
                        <div key={step.step} className="border-l-4 border-blue-600 pl-6">
                          <div className="flex items-center space-x-3 mb-3">
                            <Badge className="bg-blue-600">{step.step}</Badge>
                            <h3 className="text-lg font-semibold">{step.title}</h3>
                          </div>
                          <p className="text-gray-700 mb-3">{step.description}</p>
                          <ul className="space-y-2">
                            {step.details.map((detail, index) => (
                              <li key={index} className="flex items-center space-x-2">
                                <div className="h-2 w-2 bg-blue-600 rounded-full"></div>
                                <span className="text-gray-700">{detail}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      ))}
                    </div>
                  )}

                  {section.id === "pos-operations" && (
                    <div className="space-y-6">
                      {section.content.sections.map((subSection, index) => (
                        <div key={index}>
                          <h3 className="text-lg font-semibold mb-3">{subSection.title}</h3>
                          <ol className="space-y-2">
                            {subSection.steps.map((step, stepIndex) => (
                              <li key={stepIndex} className="flex items-start space-x-3">
                                <Badge variant="outline" className="mt-0.5">{stepIndex + 1}</Badge>
                                <span className="text-gray-700">{step}</span>
                              </li>
                            ))}
                          </ol>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Add more section renderers as needed */}
                  <div className="text-gray-600 italic">
                    Contenido detallado de {section.title} - Sección en desarrollo
                  </div>
                </CardContent>
              )}
            </Card>
          );
        })}
      </div>

      {/* Navigation */}
      <div className="mt-12 flex justify-between">
        <Button variant="outline">
          ← Anterior
        </Button>
        <Button>
          Siguiente →
        </Button>
      </div>
    </div>
  );
} 