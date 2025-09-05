"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../../components/ui/card";
import { Button } from "../../../components/ui/button";
import { Badge } from "../../../components/ui/badge";
import { Separator } from "../../../components/ui/separator";
import { 
  ChevronDown, 
  ChevronUp, 
  Search, 
  HelpCircle,
  ShoppingCart,
  Table,
  ChefHat,
  Users,
  CreditCard,
  Settings
} from "lucide-react";

export default function FAQPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [expandedItems, setExpandedItems] = useState<number[]>([]);

  const faqData = [
    {
      category: "General",
      icon: HelpCircle,
      questions: [
        {
          question: "¿Cómo puedo cambiar mi contraseña?",
          answer: "Ve a Configuración > Perfil de Usuario > Cambiar Contraseña. Ingresa tu contraseña actual y la nueva contraseña dos veces para confirmar."
        },
        {
          question: "¿Puedo usar el sistema en múltiples dispositivos?",
          answer: "Sí, el sistema es web-based y puedes acceder desde cualquier dispositivo con navegador. Solo necesitas iniciar sesión con tus credenciales."
        },
        {
          question: "¿Cómo hago una copia de seguridad de mis datos?",
          answer: "Los datos se respaldan automáticamente en la nube. Para respaldos manuales, ve a Configuración > Respaldo de Datos > Crear Respaldo."
        }
      ]
    },
    {
      category: "Punto de Venta",
      icon: ShoppingCart,
      questions: [
        {
          question: "¿Cómo cancelo una venta?",
          answer: "En el carrito, haz clic en 'Cancelar Venta' o presiona Ctrl+Z. Solo puedes cancelar ventas que no han sido pagadas."
        },
        {
          question: "¿Puedo aplicar descuentos a productos específicos?",
          answer: "Sí, selecciona el producto en el carrito, haz clic en 'Aplicar Descuento' y especifica el porcentaje o monto fijo."
        },
        {
          question: "¿Cómo divido la cuenta entre varios clientes?",
          answer: "En el carrito, haz clic en 'Dividir Cuenta' y selecciona qué productos va cada cliente. Luego procesa cada pago por separado."
        },
        {
          question: "¿Qué hago si el cliente no tiene cambio?",
          answer: "El sistema calcula automáticamente el cambio. Si no tienes suficiente cambio, puedes redondear hacia arriba o procesar un pago parcial."
        }
      ]
    },
    {
      category: "Mesas",
      icon: Table,
      questions: [
        {
          question: "¿Cómo transfiero una mesa a otra ubicación?",
          answer: "Selecciona la mesa, haz clic en 'Transferir Mesa' y elige la nueva ubicación. Los pedidos se moverán automáticamente."
        },
        {
          question: "¿Puedo combinar mesas para grupos grandes?",
          answer: "Sí, selecciona las mesas que quieres combinar y haz clic en 'Combinar Mesas'. Los pedidos se unirán en una sola cuenta."
        },
        {
          question: "¿Cómo reservo una mesa?",
          answer: "Ve a Gestión de Mesas > Reservas > Nueva Reserva. Completa los datos del cliente, fecha, hora y número de personas."
        }
      ]
    },
    {
      category: "Cocina",
      icon: ChefHat,
      questions: [
        {
          question: "¿Cómo notifico que un pedido está listo?",
          answer: "En el panel de cocina, marca los productos como 'Listo'. El sistema notificará automáticamente al personal de sala."
        },
        {
          question: "¿Puedo ver el tiempo estimado de preparación?",
          answer: "Sí, cada producto tiene un tiempo estimado configurado. Puedes modificarlo en tiempo real según la disponibilidad."
        },
        {
          question: "¿Cómo manejo productos que se agotaron?",
          answer: "Marca el producto como 'Agotado' en el panel de cocina. Se ocultará automáticamente del menú para nuevos pedidos."
        }
      ]
    },
    {
      category: "Clientes",
      icon: Users,
      questions: [
        {
          question: "¿Cómo busco un cliente existente?",
          answer: "En el punto de venta, haz clic en 'Buscar Cliente' e ingresa nombre, teléfono o email. Los resultados aparecerán en tiempo real."
        },
        {
          question: "¿Puedo ver el historial de pedidos de un cliente?",
          answer: "Sí, en la ficha del cliente verás su historial completo de pedidos, preferencias y puntos de fidelidad."
        },
        {
          question: "¿Cómo funciona el programa de fidelidad?",
          answer: "Los clientes ganan puntos por cada compra. Pueden canjear puntos por descuentos. Configura las reglas en Configuración > Fidelidad."
        }
      ]
    },
    {
      category: "Pagos",
      icon: CreditCard,
      questions: [
        {
          question: "¿Qué métodos de pago acepta el sistema?",
          answer: "Efectivo, tarjetas de crédito/débito, transferencias bancarias, pagos digitales (QR, apps móviles) y vales de regalo."
        },
        {
          question: "¿Cómo proceso un reembolso?",
          answer: "Ve a Transacciones > Buscar Transacción > Reembolso. Selecciona el método de reembolso y confirma la operación."
        },
        {
          question: "¿Puedo dividir el pago entre varios métodos?",
          answer: "Sí, en el proceso de pago selecciona 'Pago Múltiple' y especifica cuánto pagar con cada método."
        }
      ]
    },
    {
      category: "Configuración",
      icon: Settings,
      questions: [
        {
          question: "¿Cómo agrego nuevos productos al menú?",
          answer: "Ve a Productos > Nuevo Producto. Completa la información básica, precio, categoría e imagen del producto."
        },
        {
          question: "¿Cómo configuro las impresoras?",
          answer: "Ve a Configuración > Impresoras. Selecciona el modelo de impresora y configura el puerto de conexión."
        },
        {
          question: "¿Puedo personalizar el diseño de los tickets?",
          answer: "Sí, en Configuración > Tickets puedes personalizar el logo, información del negocio y formato del ticket."
        }
      ]
    }
  ];

  const toggleExpanded = (index: number) => {
    setExpandedItems(prev => 
      prev.includes(index) 
        ? prev.filter(i => i !== index)
        : [...prev, index]
    );
  };

  const filteredFAQ = faqData.map(category => ({
    ...category,
    questions: category.questions.filter(q =>
      q.question.toLowerCase().includes(searchTerm.toLowerCase()) ||
      q.answer.toLowerCase().includes(searchTerm.toLowerCase())
    )
  })).filter(category => category.questions.length > 0);

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Preguntas Frecuentes
        </h1>
        <p className="text-gray-600">
          Encuentra respuestas rápidas a las preguntas más comunes sobre el sistema
        </p>
      </div>

      {/* Search Bar */}
      <div className="relative mb-8">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
        <input
          type="text"
          placeholder="Buscar preguntas..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>

      {/* FAQ Categories */}
      <div className="space-y-8">
        {filteredFAQ.map((category, categoryIndex) => (
          <Card key={categoryIndex}>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <category.icon className="h-5 w-5 text-blue-600" />
                <span>{category.category}</span>
                <Badge variant="secondary">{category.questions.length}</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {category.questions.map((item, questionIndex) => {
                const globalIndex = categoryIndex * 100 + questionIndex;
                const isExpanded = expandedItems.includes(globalIndex);
                
                return (
                  <div key={questionIndex} className="border border-gray-200 rounded-lg">
                    <button
                      onClick={() => toggleExpanded(globalIndex)}
                      className="w-full px-4 py-3 text-left flex items-center justify-between hover:bg-gray-50 transition-colors"
                    >
                      <span className="font-medium text-gray-900">{item.question}</span>
                      {isExpanded ? (
                        <ChevronUp className="h-4 w-4 text-gray-500" />
                      ) : (
                        <ChevronDown className="h-4 w-4 text-gray-500" />
                      )}
                    </button>
                    {isExpanded && (
                      <div className="px-4 pb-3">
                        <Separator className="mb-3" />
                        <p className="text-gray-700 leading-relaxed">{item.answer}</p>
                      </div>
                    )}
                  </div>
                );
              })}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* No Results */}
      {filteredFAQ.length === 0 && searchTerm && (
        <Card className="text-center py-12">
          <CardContent>
            <HelpCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No se encontraron resultados
            </h3>
            <p className="text-gray-600 mb-4">
              Intenta con otros términos de búsqueda o contacta a soporte.
            </p>
            <Button onClick={() => setSearchTerm("")}>
              Limpiar búsqueda
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Contact Support */}
      <Separator className="my-8" />
      <Card className="bg-blue-50 border-blue-200">
        <CardContent className="p-6 text-center">
          <HelpCircle className="h-12 w-12 text-blue-600 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-900 mb-2">
            ¿No encuentras tu respuesta?
          </h3>
          <p className="text-gray-600 mb-4">
            Nuestro equipo de soporte está disponible para ayudarte con cualquier pregunta adicional.
          </p>
          <Button className="flex items-center space-x-2 mx-auto">
            <span>Contactar Soporte</span>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
} 