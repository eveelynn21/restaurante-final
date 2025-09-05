"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { ArrowLeft, Wallet, QrCode } from "lucide-react"

import { Button } from "../../components/ui/button"
import { RadioGroup, RadioGroupItem } from "../../components/ui/radio-group"
import { Label } from "../../components/ui/label"
import { Separator } from "../../components/ui/separator"
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card"
import { useCart } from "../context/cart-context"

export default function CheckoutPage() {
  const router = useRouter()
  const { cart, cartTotal, clearCart } = useCart()
  const [paymentMethod, setPaymentMethod] = useState("qr")
  const [showQR, setShowQR] = useState(false)

  const tax = cartTotal * 0.1
  const grandTotal = cartTotal + tax

  const handlePayment = () => {
    if (paymentMethod === "qr") {
      setShowQR(true)
    } else {
      // Para efectivo, proceder directamente
      router.push("/success")
    }
  }

  const handleQRPaymentComplete = () => {
    setShowQR(false)
    router.push("/success")
  }

  if (cart.length === 0) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold">Your cart is empty</h1>
          <p className="mt-2 text-muted-foreground">Add some items to your cart before checkout</p>
          <Button className="mt-4" onClick={() => router.push("/pos")}>
            Return to POS
          </Button>
        </div>
      </div>
    )
  }

  if (showQR) {
    return (
      <div className="container mx-auto max-w-md py-8">
        <Card>
          <CardHeader className="text-center">
            <CardTitle className="flex items-center justify-center gap-2">
              <QrCode className="h-6 w-6" />
              Escanea para Pagar
            </CardTitle>
          </CardHeader>
          <CardContent className="text-center space-y-6">
            {/* QR Code Placeholder */}
            <div className="mx-auto w-64 h-64 bg-white border-2 border-gray-300 rounded-lg flex items-center justify-center">
              <div className="text-center">
                <QrCode className="h-20 w-20 mx-auto mb-4 text-gray-400" />
                <p className="text-sm text-gray-600">Código QR para pago</p>
                <p className="text-lg font-bold mt-2">${grandTotal.toFixed(2)}</p>
              </div>
            </div>

            <div className="space-y-2">
              <p className="font-semibold">Total a Pagar: ${grandTotal.toFixed(2)}</p>
              <p className="text-sm text-gray-600">
                Escanea este código QR con tu app de pagos favorita (Nequi, Bancolombia, Daviplata, etc.)
              </p>
            </div>

            <div className="flex gap-2">
              <Button onClick={handleQRPaymentComplete} className="flex-1 bg-green-600 hover:bg-green-700">
                ✓ Pago Completado
              </Button>
              <Button variant="outline" onClick={() => setShowQR(false)} className="flex-1">
                Cancelar
              </Button>
            </div>

            <div className="text-xs text-gray-500">
              Haz clic en "Pago Completado" una vez que hayas realizado el pago
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="container mx-auto max-w-4xl py-8">
      <Button variant="ghost" className="mb-6" onClick={() => router.push("/pos")}>
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back to POS
      </Button>

      <h1 className="mb-6 text-3xl font-bold">Checkout - Pedido Presencial</h1>

      <div className="grid gap-8 md:grid-cols-2">
        <div>
          <h2 className="mb-4 text-xl font-semibold">Order Summary</h2>
          <div className="rounded-lg border p-4 bg-white">
            {cart.map((item) => (
              <div key={item.id} className="mb-3 flex justify-between">
                <div>
                  <p className="font-medium">{item.name}</p>
                  <p className="text-sm text-muted-foreground">
                    ${item.sell_price_inc_tax.toFixed(2)} × {item.quantity}
                  </p>
                </div>
                <p className="font-medium">${(item.sell_price_inc_tax * item.quantity).toFixed(2)}</p>
              </div>
            ))}

            <Separator className="my-4" />

            <div className="space-y-2">
              <div className="flex justify-between">
                <p>Subtotal</p>
                <p>${cartTotal.toFixed(2)}</p>
              </div>
              <div className="flex justify-between">
                <p>Tax (10%)</p>
                <p>${tax.toFixed(2)}</p>
              </div>
              <div className="flex justify-between font-bold">
                <p>Total</p>
                <p>${grandTotal.toFixed(2)}</p>
              </div>
            </div>
          </div>
        </div>

        <div>
          <h2 className="mb-4 text-xl font-semibold">Método de Pago</h2>
          <div className="rounded-lg border p-4 bg-white">
            <RadioGroup value={paymentMethod} onValueChange={setPaymentMethod}>
              <div className="flex items-center space-x-2 rounded-md border p-4 bg-blue-50">
                <RadioGroupItem value="qr" id="qr" />
                <Label htmlFor="qr" className="flex items-center flex-1">
                  <QrCode className="mr-3 h-5 w-5 text-blue-600" />
                  <div>
                    <div className="font-medium">Pago con QR</div>
                    <div className="text-sm text-gray-600">Nequi, Bancolombia, Daviplata, etc.</div>
                  </div>
                </Label>
              </div>

              <div className="mt-3 flex items-center space-x-2 rounded-md border p-4">
                <RadioGroupItem value="cash" id="cash" />
                <Label htmlFor="cash" className="flex items-center flex-1">
                  <Wallet className="mr-3 h-5 w-5 text-green-600" />
                  <div>
                    <div className="font-medium">Efectivo</div>
                    <div className="text-sm text-gray-600">Pago en efectivo</div>
                  </div>
                </Label>
              </div>
            </RadioGroup>

            <Button className="mt-6 w-full" size="lg" onClick={handlePayment}>
              {paymentMethod === "qr" ? (
                <>
                  <QrCode className="mr-2 h-4 w-4" />
                  Generar QR - ${grandTotal.toFixed(2)}
                </>
              ) : (
                <>
                  <Wallet className="mr-2 h-4 w-4" />
                  Pagar en Efectivo - ${grandTotal.toFixed(2)}
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
