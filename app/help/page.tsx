"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../components/ui/card";
import { Badge } from "../../components/ui/badge";
import { Button } from "../../components/ui/button";
import { Separator } from "../../components/ui/separator";
import { 
  ShoppingCart, 
  Users, 
  Table, 
  ChefHat, 
  CreditCard, 
  Package,
  HelpCircle,
  ArrowRight,
  CheckCircle,
  Play
} from "lucide-react";

export default function HelpCenter() {
  const [expandedSection, setExpandedSection] = useState<string | null>(null);

  const helpModules = [
    {
      id: "pos",
      title: "Punto de Venta (POS)",
      icon: ShoppingCart,
      color: "bg-blue-50 border-blue-200",
      description: "Cómo realizar ventas directas desde el POS",
      steps: [
        {
          title: "Iniciar una venta",
          description: "Proceso completo para atender un cliente",
          instructions: [
            "Ve al dashboard y haz clic en 'POS'",
            "Selecciona productos del catálogo haciendo clic en ellos",
            "Usa los botones + y - para ajustar cantidades",
            "Ve el total actualizado en tiempo real en el carrito",
            "Haz clic en 'Finalizar Venta' cuando esté listo"
          ]
        },
        {
          title: "Gestionar el carrito",
          description: "Cómo manejar productos en el carrito",
          instructions: [
            "Ver productos agregados en la barra lateral derecha",
            "Modificar cantidades con los botones + y -",
            "Eliminar productos con el botón X",
            "Dividir la cuenta si hay múltiples clientes",
            "Revisar totales antes de proceder al pago"
          ]
        },
        {
          title: "Procesar el pago",
          description: "Finalizar la venta y cobrar",
          instructions: [
            "Revisar el total final de la venta",
            "Seleccionar método de pago (QR o Efectivo)",
            "Si es efectivo, ingresar el monto recibido",
            "Confirmar el pago y generar comprobante",
            "El pedido se envía automáticamente a cocina"
          ]
        }
      ]
    },
    {
      id: "mesas",
      title: "Sistema de Mesas",
      icon: Table,
      color: "bg-green-50 border-green-200",
      description: "Cómo gestionar pedidos por mesa",
      steps: [
        {
          title: "Abrir una mesa",
          description: "Iniciar servicio en una mesa",
          instructions: [
            "Ve al dashboard y haz clic en 'Mesas'",
            "Selecciona una mesa libre (color verde)",
            "Haz clic en 'Abrir Mesa'",
            "La mesa cambia a ocupada (color rojo)",
            "Comienza a agregar productos al carrito de la mesa"
          ]
        },
        {
          title: "Tomar pedidos por mesa",
          description: "Agregar productos a una mesa específica",
          instructions: [
            "Selecciona la mesa ocupada desde el dashboard",
            "Agrega productos al carrito de esa mesa",
            "Modifica cantidades según necesites",
            "Ve el total acumulado de la mesa",
            "Puedes dividir la cuenta entre clientes"
          ]
        },
        {
          title: "Cerrar mesa",
          description: "Finalizar servicio y liberar mesa",
          instructions: [
            "Selecciona la mesa que quieres cerrar",
            "Revisa el total final de la cuenta",
            "Procesa el pago (QR o Efectivo)",
            "Confirma el cierre de la mesa",
            "La mesa vuelve a estar libre para nuevos clientes"
          ]
        }
      ]
    },
    {
      id: "cocina",
      title: "Panel de Cocina",
      icon: ChefHat,
      color: "bg-orange-50 border-orange-200",
      description: "Cómo gestionar pedidos desde la cocina",
      steps: [
        {
          title: "Ver pedidos entrantes",
          description: "Revisar nuevos pedidos recibidos",
          instructions: [
            "Accede al panel de cocina desde el dashboard",
            "Ve los pedidos organizados por área (cocina, bar, postres)",
            "Los pedidos nuevos aparecen en estado 'Pendiente'",
            "Revisa los detalles específicos de cada pedido",
            "Ve la mesa o tipo de pedido (POS/mesa)"
          ]
        },
        {
          title: "Procesar pedidos",
          description: "Actualizar estado de preparación",
          instructions: [
            "Selecciona un pedido para comenzar a prepararlo",
            "Cambia el estado a 'Preparando'",
            "Organiza los pedidos por prioridad",
            "Marca productos individuales como 'Listos'",
            "Cuando todo esté listo, marca el pedido como 'Completado'"
          ]
        }
      ]
    },
    {
      id: "productos",
      title: "Gestión de Productos",
      icon: Package,
      color: "bg-purple-50 border-purple-200",
      description: "Cómo administrar el catálogo de productos",
      steps: [
        {
          title: "Agregar nuevo producto",
          description: "Crear un producto en el catálogo",
          instructions: [
            "Ve al dashboard y selecciona 'Productos'",
            "Haz clic en 'Agregar Producto'",
            "Completa: nombre, precio, descripción",
            "Selecciona la categoría del producto",
            "Sube una imagen del producto si tienes",
            "Guarda el producto"
          ]
        },
        {
          title: "Editar productos",
          description: "Modificar información de productos existentes",
          instructions: [
            "Ve a la lista de productos",
            "Haz clic en el producto que quieres editar",
            "Modifica los campos necesarios",
            "Actualiza precio, descripción o categoría",
            "Guarda los cambios"
          ]
        },
        {
          title: "Gestionar categorías",
          description: "Organizar productos por categorías",
          instructions: [
            "Ve a la sección de categorías",
            "Crea nuevas categorías (ej: Bebidas, Platos principales)",
            "Asigna productos a las categorías correspondientes",
            "Organiza el menú de manera lógica",
            "Facilita la búsqueda de productos"
          ]
        }
      ]
    },
    {
      id: "clientes",
      title: "Gestión de Clientes",
      icon: Users,
      color: "bg-indigo-50 border-indigo-200",
      description: "Cómo administrar información de clientes",
      steps: [
        {
          title: "Registrar nuevo cliente",
          description: "Crear ficha de cliente",
          instructions: [
            "Ve al dashboard y selecciona 'Clientes'",
            "Haz clic en 'Nuevo Cliente'",
            "Completa: nombre, teléfono, email",
            "Agrega dirección si es necesario",
            "Guarda la información del cliente"
          ]
        },
        {
          title: "Buscar clientes",
          description: "Encontrar clientes registrados",
          instructions: [
            "Usa la barra de búsqueda en la sección clientes",
            "Busca por nombre, teléfono o email",
            "Filtra por diferentes criterios",
            "Ve el historial de pedidos del cliente",
            "Accede rápidamente a la información"
          ]
        }
      ]
    },
    {
      id: "pagos",
      title: "Métodos de Pago",
      icon: CreditCard,
      color: "bg-emerald-50 border-emerald-200",
      description: "Cómo procesar diferentes tipos de pago",
      steps: [
        {
          title: "Pago con QR",
          description: "Procesar pagos digitales",
          instructions: [
            "Selecciona 'Pago QR' al finalizar la venta",
            "Se genera un código QR en pantalla",
            "El cliente escanea el código con su app bancaria",
            "Confirma el pago cuando recibas la notificación",
            "Genera el comprobante de pago"
          ]
        },
        {
          title: "Pago en efectivo",
          description: "Procesar pagos con dinero físico",
          instructions: [
            "Selecciona 'Pago en Efectivo'",
            "Ingresa el monto que te entrega el cliente",
            "El sistema calcula automáticamente el cambio",
            "Confirma el monto recibido",
            "Entrega el cambio y genera comprobante"
          ]
        }
      ]
    }
  ];

  const toggleSection = (sectionId: string) => {
    setExpandedSection(expandedSection === sectionId ? null : sectionId);
  };

  return (
    <div className="container mx-auto p-6 max-w-6xl">
      {/* Header */}
      <div className="text-center mb-12">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mb-4">
          <HelpCircle className="h-8 w-8 text-blue-600" />
        </div>
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          Centro de Ayuda
        </h1>
        <p className="text-xl text-gray-600 max-w-2xl mx-auto">
          Guías paso a paso para usar todas las funcionalidades del sistema de restaurante
        </p>
      </div>

      {/* Help Modules */}
      <div className="space-y-6">
        {helpModules.map((module) => (
          <Card key={module.id} className={`${module.color} hover:shadow-lg transition-shadow`}>
            <CardHeader 
              className="cursor-pointer"
              onClick={() => toggleSection(module.id)}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="p-3 bg-white rounded-lg shadow-sm">
                    <module.icon className="h-6 w-6 text-gray-700" />
                  </div>
                  <div>
                    <CardTitle className="text-xl font-semibold text-gray-900">
                      {module.title}
                    </CardTitle>
                    <CardDescription className="text-gray-600">
                      {module.description}
                    </CardDescription>
                  </div>
                </div>
                <Button 
                  variant="ghost" 
                  size="sm"
                  className="text-gray-600 hover:text-gray-900"
                >
                  {expandedSection === module.id ? 'Ocultar' : 'Ver guía'}
                </Button>
              </div>
            </CardHeader>

            {expandedSection === module.id && (
              <CardContent className="pt-0">
                <Separator className="mb-6" />
                <div className="space-y-8">
                  {module.steps.map((step, stepIndex) => (
                    <div key={stepIndex} className="bg-white rounded-lg p-6 shadow-sm">
                      <div className="flex items-start space-x-4 mb-4">
                        <Badge variant="secondary" className="mt-1">
                          {stepIndex + 1}
                        </Badge>
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900 mb-2">
                            {step.title}
                          </h3>
                          <p className="text-gray-600 mb-4">
                            {step.description}
                          </p>
                        </div>
                      </div>
                      
                      <div className="ml-12 space-y-3">
                        {step.instructions.map((instruction, instructionIndex) => (
                          <div key={instructionIndex} className="flex items-start space-x-3">
                            <div className="flex-shrink-0 w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center mt-0.5">
                              <Play className="h-3 w-3 text-blue-600" />
                            </div>
                            <p className="text-gray-700 leading-relaxed">
                              {instruction}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            )}
          </Card>
        ))}
      </div>

      {/* Contact Support */}
      <Separator className="my-12" />
      <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
        <CardContent className="p-8">
          <div className="text-center">
            <HelpCircle className="h-16 w-16 text-blue-600 mx-auto mb-6" />
            <h3 className="text-2xl font-semibold text-gray-900 mb-4">
              ¿Necesitas ayuda adicional?
            </h3>
            <p className="text-gray-600 mb-6 max-w-md mx-auto">
              Si no encuentras la respuesta que buscas o tienes alguna duda específica, estamos aquí para ayudarte.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button variant="outline" size="lg" className="flex items-center space-x-2">
                <span>Contactar Soporte</span>
              </Button>
              <Button size="lg" className="flex items-center space-x-2">
                <ArrowRight className="h-4 w-4" />
                <span>Reportar Problema</span>
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 