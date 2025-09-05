"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { CheckCircle, Clock, Phone, User, ArrowLeft } from "lucide-react"
import { Button } from "../../components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card"
import { Separator } from "../../components/ui/separator"

export default function PresencialSuccessPage() {
  const router = useRouter()
  const [order, setOrder] = useState<any>(null)

  useEffect(() => {
    const savedOrder = localStorage.getItem("presencial-order")
    if (savedOrder) {
      setOrder(JSON.parse(savedOrder))
    } else {
      router.push("/presencial")
    }
  }, [router])

  if (!order) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold">Cargando...</h1>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto max-w-2xl px-4">
        <Button variant="ghost" className="mb-6" onClick={() => router.push("/presencial")}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Hacer Otro Pedido
        </Button>

        <Card className="mb-6">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
            <CardTitle className="text-2xl text-green-600">¡Pedido Confirmado!</CardTitle>
            <p className="text-muted-foreground">Tu pedido ha sido recibido y está siendo preparado</p>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Información del Pedido */}
            <div className="rounded-lg bg-gray-50 p-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="font-medium">Número de Pedido</p>
                  <p className="text-lg font-bold">#{order.receiptNumber}</p>
                </div>
                <div>
                  <p className="font-medium">Fecha y Hora</p>
                  <p>{order.date}</p>
                </div>
              </div>
            </div>

            {/* Información del Cliente */}
            <div>
              <h3 className="mb-3 flex items-center font-semibold">
                <User className="mr-2 h-4 w-4" />
                Información del Cliente
              </h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>Nombre:</span>
                  <span className="font-medium">{order.customerInfo.name}</span>
                </div>
                <div className="flex justify-between">
                  <span>Teléfono:</span>
                  <span className="font-medium">{order.customerInfo.phone}</span>
                </div>
              </div>
            </div>

            {/* Resumen del Pedido */}
            <div>
              <h3 className="mb-3 font-semibold">Resumen del Pedido</h3>
              <div className="space-y-2">
                {order.items.map((item: any) => (
                  <div key={item.id} className="flex justify-between text-sm">
                    <span>
                      {item.name} × {item.quantity}
                    </span>
                    <span>${(item.price * item.quantity).toFixed(2)}</span>
                  </div>
                ))}
              </div>

              <Separator className="my-3" />

              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span>${order.total.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Impuestos (10%)</span>
                  <span>${order.tax.toFixed(2)}</span>
                </div>
                <div className="flex justify-between font-bold">
                  <span>Total</span>
                  <span>${order.grandTotal.toFixed(2)}</span>
                </div>
              </div>
            </div>

            {/* Tiempo de Espera */}
            <div className="rounded-lg bg-blue-50 p-4">
              <div className="flex items-center gap-3">
                <Clock className="h-5 w-5 text-blue-600" />
                <div>
                  <p className="font-medium text-blue-900">Tiempo Estimado de Preparación</p>
                  <p className="text-sm text-blue-700">15-20 minutos</p>
                </div>
              </div>
            </div>

            {/* Notificación */}
            <div className="rounded-lg bg-green-50 p-4">
              <div className="flex items-center gap-3">
                <Phone className="h-5 w-5 text-green-600" />
                <div>
                  <p className="font-medium text-green-900">Te Notificaremos</p>
                  <p className="text-sm text-green-700">
                    Recibirás una llamada o mensaje cuando tu pedido esté listo para recoger
                  </p>
                </div>
              </div>
            </div>

            {/* Instrucciones */}
            <div className="rounded-lg border border-orange-200 bg-orange-50 p-4">
              <h4 className="font-medium text-orange-900">Instrucciones:</h4>
              <ul className="mt-2 space-y-1 text-sm text-orange-800">
                <li>
                  • Presenta tu número de pedido: <strong>#{order.receiptNumber}</strong>
                </li>
                <li>• El pago se realiza al momento de recoger</li>
                <li>• Mantén tu teléfono disponible para notificaciones</li>
              </ul>
            </div>
          </CardContent>
        </Card>

        <div className="text-center">
          <Button onClick={() => router.push("/presencial")} size="lg" className="w-full sm:w-auto">
            Hacer Otro Pedido
          </Button>
        </div>
      </div>
    </div>
  )
}
