"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Check, Printer, Clock, MapPin, Phone } from "lucide-react"

import { Button } from "../../components/ui/button"
import { Separator } from "../../components/ui/separator"
import { Badge } from "../../components/ui/badge"

interface OnlineOrder {
  customerInfo: {
    name: string
    phone: string
    address: string
    notes: string
  }
  items: Array<{ id: number; name: string; price: number; quantity: number; image: string }>
  total: number
  tax: number
  grandTotal: number
  paymentMethod: string
  orderType: string
  receiptNumber: number
  date: string
}

export default function WebSuccessPage() {
  const router = useRouter()
  const [order, setOrder] = useState<OnlineOrder | null>(null)

  useEffect(() => {
    const savedOrder = localStorage.getItem("online-order")
    if (savedOrder) {
      try {
        setOrder(JSON.parse(savedOrder))
      } catch (error) {
        console.error("Error parsing order:", error)
        router.push("/web")
      }
    } else {
      router.push("/web")
    }
  }, [router])

  const handleBackToStore = () => {
    localStorage.removeItem("online-order")
    router.push("/web")
  }

  const handlePrint = () => {
    window.print()
  }

  if (!order) {
    return null
  }

  const getPaymentMethodName = (method: string) => {
    switch (method) {
      case "card":
        return "Tarjeta"
      case "cash":
        return "Efectivo"
      case "nequi":
        return "Nequi"
      case "bancolombia":
        return "Bancolombia"
      case "daviplata":
        return "Daviplata"
      default:
        return method
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto max-w-2xl px-4">
        <div className="rounded-lg border p-6 print:border-none bg-white shadow-sm">
          <div className="mb-6 flex items-center justify-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
              <Check className="h-8 w-8 text-green-600" />
            </div>
          </div>

          <div className="text-center mb-6">
            <h1 className="mb-2 text-3xl font-bold text-green-600">¡Pedido Confirmado!</h1>
            <p className="text-gray-600">Gracias por tu pedido. Te contactaremos pronto.</p>
          </div>

          <div className="mb-6 text-center space-y-2">
            <Badge variant="outline" className="text-lg px-4 py-2">
              Pedido #{order.receiptNumber}
            </Badge>
            <p className="text-sm text-gray-500">{order.date}</p>
            <div className="flex items-center justify-center gap-2 text-sm text-orange-600">
              <Clock className="h-4 w-4" />
              <span>Tiempo estimado: 30-45 minutos</span>
            </div>
          </div>

          {/* Customer Info */}
          <div className="mb-6 p-4 bg-gray-50 rounded-lg">
            <h3 className="font-semibold mb-3 flex items-center">
              <MapPin className="h-4 w-4 mr-2" />
              Información de Entrega
            </h3>
            <div className="space-y-1 text-sm">
              <p>
                <strong>Cliente:</strong> {order.customerInfo.name}
              </p>
              <p>
                <strong>Teléfono:</strong> {order.customerInfo.phone}
              </p>
              <p>
                <strong>Dirección:</strong> {order.customerInfo.address}
              </p>
              {order.customerInfo.notes && (
                <p>
                  <strong>Notas:</strong> {order.customerInfo.notes}
                </p>
              )}
              <p>
                <strong>Pago:</strong> {getPaymentMethodName(order.paymentMethod)}
              </p>
            </div>
          </div>

          <Separator className="my-4" />

          {/* Order Items */}
          <div className="space-y-3 mb-4">
            <h3 className="font-semibold">Productos Ordenados</h3>
            {order.items.map((item) => (
              <div key={item.id} className="flex items-center gap-3">
                <img
                  src={item.image || "/placeholder.svg"}
                  alt={item.name}
                  className="w-12 h-12 object-cover rounded border"
                />
                <div className="flex-1">
                  <p className="font-medium">{item.name}</p>
                  <p className="text-sm text-gray-500">
                    ${item.price.toFixed(2)} × {item.quantity}
                  </p>
                </div>
                <p className="font-medium">${(item.price * item.quantity).toFixed(2)}</p>
              </div>
            ))}
          </div>

          <Separator className="my-4" />

          {/* Order Total */}
          <div className="space-y-2">
            <div className="flex justify-between">
              <p>Subtotal</p>
              <p>${order.total.toFixed(2)}</p>
            </div>
            <div className="flex justify-between">
              <p>Impuestos (10%)</p>
              <p>${order.tax.toFixed(2)}</p>
            </div>
            <div className="flex justify-between">
              <p>Domicilio</p>
              <p className="text-green-600">Gratis</p>
            </div>
            <div className="flex justify-between font-bold text-lg">
              <p>Total</p>
              <p>${order.grandTotal.toFixed(2)}</p>
            </div>
          </div>

          {/* Contact Info */}
          <div className="mt-6 p-4 bg-blue-50 rounded-lg">
            <div className="flex items-center gap-2 text-blue-800 mb-2">
              <Phone className="h-4 w-4" />
              <span className="font-semibold">¿Necesitas ayuda?</span>
            </div>
            <p className="text-sm text-blue-700">
              Llámanos al <strong>+57 300 123 4567</strong> si tienes alguna pregunta sobre tu pedido.
            </p>
          </div>

          <div className="mt-6 flex flex-col gap-3 print:hidden">
            <Button onClick={handlePrint} variant="outline" className="w-full">
              <Printer className="mr-2 h-4 w-4" />
              Imprimir Recibo
            </Button>
            <Button
              onClick={handleBackToStore}
              className="w-full bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white"
            >
              Volver a la Tienda
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
