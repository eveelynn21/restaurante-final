"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { ArrowLeft, CreditCard, Wallet, MapPin, User, Phone, QrCode, Store, Truck } from "lucide-react"

import { Button } from "../../components/ui/button"
import { RadioGroup, RadioGroupItem } from "../../components/ui/radio-group"
import { Label } from "../../components/ui/label"
import { Input } from "../../components/ui/input"
import { Textarea } from "../../components/ui/textarea"
import { Separator } from "../../components/ui/separator"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../../components/ui/tabs"
import { useCart } from "../context/cart-context"
import { useTables } from "../context/table-context"

export default function WebCheckoutPage() {
  const router = useRouter()
  const { cart, cartTotal, clearCart } = useCart()
  const { addTable } = useTables()
  const [orderType, setOrderType] = useState<"online" | "presencial">("online")
  const [paymentMethod, setPaymentMethod] = useState("wompi")
  const [showQR, setShowQR] = useState(false)
  const [customerInfo, setCustomerInfo] = useState({
    name: "",
    phone: "",
    address: "",
    notes: "",
  })

  const tax = cartTotal * 0.1
  const grandTotal = cartTotal + tax

  useEffect(() => {
    if (cart.length === 0) {
      router.push("/web")
    }
  }, [cart, router])

  const generateQRCode = () => {
    // Simular generación de QR para pago
    const qrData = {
      amount: grandTotal,
      reference: `order-${Date.now()}`,
      merchant: "DeliciousEats",
    }
    return `https://api.qr-server.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(JSON.stringify(qrData))}`
  }

  const handleWompiPayment = () => {
    const wompiData = {
      amount: Math.round(grandTotal * 100),
      currency: "COP",
      reference: `order-${Date.now()}`,
      customer: {
        name: customerInfo.name,
        phone: customerInfo.phone,
        email: `${customerInfo.phone}@temp.com`,
      },
      delivery_address: customerInfo.address,
    }

    console.log("Redirecting to Wompi with data:", wompiData)
    setTimeout(() => {
      handlePaymentSuccess("online")
    }, 2000)
  }

  const handlePresencialPayment = () => {
    if (paymentMethod === "qr") {
      setShowQR(true)
    } else {
      handlePaymentSuccess("presencial")
    }
  }

  const handlePaymentSuccess = (type: "online" | "presencial") => {
    const tableNumber = type === "online" ? 999 : 998 // 998 para presencial, 999 para online

    const newTable = {
      number: tableNumber,
      x: 50,
      y: 50,
      width: 120,
      height: 80,
      seats: 1,
      status: "occupied" as const,
      shape: "rectangle" as const,
    }

    addTable(newTable)

    const order = {
      customerInfo: type === "online" ? customerInfo : { name: customerInfo.name, phone: customerInfo.phone },
      items: cart,
      total: cartTotal,
      tax,
      grandTotal,
      paymentMethod,
      orderType: type,
      receiptNumber: Math.floor(100000 + Math.random() * 900000),
      date: new Date().toLocaleString(),
    }

    localStorage.setItem(`${type}-order`, JSON.stringify(order))
    clearCart()
    router.push("/web-success")
  }

  if (cart.length === 0) {
    return null
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto max-w-5xl py-8 px-4">
        <Button variant="ghost" className="mb-6" onClick={() => router.push("/web")}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Volver a la Tienda
        </Button>

        <h1 className="mb-6 text-3xl font-bold">Finalizar Pedido</h1>

        {/* Selector de Tipo de Pedido */}
        <div className="mb-8">
          <Tabs value={orderType} onValueChange={(value) => setOrderType(value as "online" | "presencial")}>
            <TabsList className="grid w-full grid-cols-2 mb-6">
              <TabsTrigger value="online" className="flex items-center gap-2">
                <Truck className="h-4 w-4" />
                Pedido Online (Domicilio)
              </TabsTrigger>
              <TabsTrigger value="presencial" className="flex items-center gap-2">
                <Store className="h-4 w-4" />
                Pedido Presencial (Recoger)
              </TabsTrigger>
            </TabsList>

            <TabsContent value="online">
              <div className="grid gap-8 md:grid-cols-2">
                {/* Información del Cliente - Online */}
                <div className="space-y-6">
                  <div className="bg-white rounded-lg p-6 shadow-sm">
                    <h2 className="mb-4 text-xl font-semibold flex items-center">
                      <User className="mr-2 h-5 w-5" />
                      Información de Entrega
                    </h2>
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="name">Nombre completo *</Label>
                        <Input
                          id="name"
                          value={customerInfo.name}
                          onChange={(e) => setCustomerInfo({ ...customerInfo, name: e.target.value })}
                          placeholder="Tu nombre completo"
                          required
                        />
                      </div>
                      <div>
                        <Label htmlFor="phone">Teléfono *</Label>
                        <Input
                          id="phone"
                          type="tel"
                          value={customerInfo.phone}
                          onChange={(e) => setCustomerInfo({ ...customerInfo, phone: e.target.value })}
                          placeholder="+57 300 123 4567"
                          required
                        />
                      </div>
                      <div>
                        <Label htmlFor="address">Dirección de entrega *</Label>
                        <Input
                          id="address"
                          value={customerInfo.address}
                          onChange={(e) => setCustomerInfo({ ...customerInfo, address: e.target.value })}
                          placeholder="Calle 123 #45-67, Barrio, Ciudad"
                          required
                        />
                      </div>
                      <div>
                        <Label htmlFor="notes">Notas especiales (opcional)</Label>
                        <Textarea
                          id="notes"
                          value={customerInfo.notes}
                          onChange={(e) => setCustomerInfo({ ...customerInfo, notes: e.target.value })}
                          placeholder="Instrucciones especiales para la entrega..."
                          rows={3}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Método de Pago Online */}
                  <div className="bg-white rounded-lg p-6 shadow-sm">
                    <h2 className="mb-4 text-xl font-semibold">Método de Pago Online</h2>
                    <RadioGroup value={paymentMethod} onValueChange={setPaymentMethod}>
                      <div className="flex items-center space-x-2 rounded-md border p-4 bg-purple-50">
                        <RadioGroupItem value="wompi" id="wompi" />
                        <Label htmlFor="wompi" className="flex items-center flex-1">
                          <CreditCard className="mr-3 h-5 w-5 text-purple-600" />
                          <div>
                            <div className="font-medium">Wompi - Pago Seguro</div>
                            <div className="text-sm text-gray-600">Tarjetas, PSE, Nequi y más</div>
                          </div>
                        </Label>
                      </div>

                      <div className="mt-3 flex items-center space-x-2 rounded-md border p-4 bg-green-50">
                        <RadioGroupItem value="cash" id="cash" />
                        <Label htmlFor="cash" className="flex items-center flex-1">
                          <Wallet className="mr-3 h-5 w-5 text-green-600" />
                          <div>
                            <div className="font-medium">Pago Contra Entrega</div>
                            <div className="text-sm text-gray-600">Paga en efectivo al recibir</div>
                          </div>
                        </Label>
                      </div>
                    </RadioGroup>
                  </div>
                </div>

                {/* Resumen del Pedido Online */}
                <div className="bg-white rounded-lg p-6 shadow-sm h-fit">
                  <h2 className="mb-4 text-xl font-semibold">Resumen del Pedido</h2>
                  <div className="space-y-3 mb-4">
                    {cart.map((item) => (
                      <div key={item.id} className="flex items-center gap-3">
                        <img
                          src={item.image || "/placeholder.svg"}
                          alt={item.name}
                          className="w-12 h-12 object-cover rounded border"
                        />
                        <div className="flex-1">
                          <p className="font-medium text-sm">{item.name}</p>
                          <p className="text-xs text-gray-500">
                            ${item.price.toFixed(2)} × {item.quantity}
                          </p>
                        </div>
                        <p className="font-medium">${(item.price * item.quantity).toFixed(2)}</p>
                      </div>
                    ))}
                  </div>

                  <Separator className="my-4" />

                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <p>Subtotal</p>
                      <p>${cartTotal.toFixed(2)}</p>
                    </div>
                    <div className="flex justify-between">
                      <p>Impuestos (10%)</p>
                      <p>${tax.toFixed(2)}</p>
                    </div>
                    <div className="flex justify-between">
                      <p>Domicilio</p>
                      <p className="text-green-600">Gratis</p>
                    </div>
                    <Separator />
                    <div className="flex justify-between font-bold text-lg">
                      <p>Total</p>
                      <p>${grandTotal.toFixed(2)}</p>
                    </div>
                  </div>

                  <div className="mt-6 space-y-3">
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <MapPin className="h-4 w-4" />
                      <span>Tiempo estimado: 30-45 min</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Phone className="h-4 w-4" />
                      <span>Te contactaremos para confirmar</span>
                    </div>
                  </div>

                  <Button
                    className="mt-6 w-full text-white"
                    size="lg"
                    onClick={paymentMethod === "wompi" ? handleWompiPayment : () => handlePaymentSuccess("online")}
                    disabled={!customerInfo.name || !customerInfo.phone || !customerInfo.address}
                    style={{
                      background: paymentMethod === "wompi" ? "#6B46C1" : "#059669",
                    }}
                  >
                    {paymentMethod === "wompi" ? (
                      <>
                        <CreditCard className="mr-2 h-4 w-4" />
                        Pagar con Wompi - ${grandTotal.toFixed(2)}
                      </>
                    ) : (
                      <>
                        <Wallet className="mr-2 h-4 w-4" />
                        Confirmar Pedido - ${grandTotal.toFixed(2)}
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="presencial">
              <div className="grid gap-8 md:grid-cols-2">
                {/* Información del Cliente - Presencial */}
                <div className="space-y-6">
                  <div className="bg-white rounded-lg p-6 shadow-sm">
                    <h2 className="mb-4 text-xl font-semibold flex items-center">
                      <User className="mr-2 h-5 w-5" />
                      Información de Contacto
                    </h2>
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="name-presencial">Nombre *</Label>
                        <Input
                          id="name-presencial"
                          value={customerInfo.name}
                          onChange={(e) => setCustomerInfo({ ...customerInfo, name: e.target.value })}
                          placeholder="Tu nombre"
                          required
                        />
                      </div>
                      <div>
                        <Label htmlFor="phone-presencial">Teléfono *</Label>
                        <Input
                          id="phone-presencial"
                          type="tel"
                          value={customerInfo.phone}
                          onChange={(e) => setCustomerInfo({ ...customerInfo, phone: e.target.value })}
                          placeholder="+57 300 123 4567"
                          required
                        />
                      </div>
                      <div>
                        <Label htmlFor="notes-presencial">Notas especiales (opcional)</Label>
                        <Textarea
                          id="notes-presencial"
                          value={customerInfo.notes}
                          onChange={(e) => setCustomerInfo({ ...customerInfo, notes: e.target.value })}
                          placeholder="Instrucciones especiales..."
                          rows={3}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Método de Pago Presencial */}
                  <div className="bg-white rounded-lg p-6 shadow-sm">
                    <h2 className="mb-4 text-xl font-semibold">Método de Pago Presencial</h2>
                    <RadioGroup value={paymentMethod} onValueChange={setPaymentMethod}>
                      <div className="flex items-center space-x-2 rounded-md border p-4 bg-blue-50">
                        <RadioGroupItem value="qr" id="qr" />
                        <Label htmlFor="qr" className="flex items-center flex-1">
                          <QrCode className="mr-3 h-5 w-5 text-blue-600" />
                          <div>
                            <div className="font-medium">Pago con QR</div>
                            <div className="text-sm text-gray-600">Nequi, Bancolombia, Daviplata</div>
                          </div>
                        </Label>
                      </div>

                      <div className="mt-3 flex items-center space-x-2 rounded-md border p-4 bg-green-50">
                        <RadioGroupItem value="cash-presencial" id="cash-presencial" />
                        <Label htmlFor="cash-presencial" className="flex items-center flex-1">
                          <Wallet className="mr-3 h-5 w-5 text-green-600" />
                          <div>
                            <div className="font-medium">Efectivo</div>
                            <div className="text-sm text-gray-600">Pago en el restaurante</div>
                          </div>
                        </Label>
                      </div>
                    </RadioGroup>

                    {/* QR Code Display */}
                    {showQR && paymentMethod === "qr" && (
                      <div className="mt-6 p-4 bg-gray-50 rounded-lg text-center">
                        <h3 className="font-semibold mb-3">Escanea para Pagar</h3>
                        <img
                          src={generateQRCode() || "/placeholder.svg"}
                          alt="QR Code para pago"
                          className="mx-auto mb-3"
                        />
                        <p className="text-sm text-gray-600 mb-4">
                          Total a pagar: <span className="font-bold">${grandTotal.toFixed(2)}</span>
                        </p>
                        <Button
                          onClick={() => handlePaymentSuccess("presencial")}
                          className="bg-green-600 hover:bg-green-700"
                        >
                          Confirmar Pago Recibido
                        </Button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Resumen del Pedido Presencial */}
                <div className="bg-white rounded-lg p-6 shadow-sm h-fit">
                  <h2 className="mb-4 text-xl font-semibold">Resumen del Pedido</h2>
                  <div className="space-y-3 mb-4">
                    {cart.map((item) => (
                      <div key={item.id} className="flex items-center gap-3">
                        <img
                          src={item.image || "/placeholder.svg"}
                          alt={item.name}
                          className="w-12 h-12 object-cover rounded border"
                        />
                        <div className="flex-1">
                          <p className="font-medium text-sm">{item.name}</p>
                          <p className="text-xs text-gray-500">
                            ${item.price.toFixed(2)} × {item.quantity}
                          </p>
                        </div>
                        <p className="font-medium">${(item.price * item.quantity).toFixed(2)}</p>
                      </div>
                    ))}
                  </div>

                  <Separator className="my-4" />

                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <p>Subtotal</p>
                      <p>${cartTotal.toFixed(2)}</p>
                    </div>
                    <div className="flex justify-between">
                      <p>Impuestos (10%)</p>
                      <p>${tax.toFixed(2)}</p>
                    </div>
                    <Separator />
                    <div className="flex justify-between font-bold text-lg">
                      <p>Total</p>
                      <p>${grandTotal.toFixed(2)}</p>
                    </div>
                  </div>

                  <div className="mt-6 space-y-3">
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Store className="h-4 w-4" />
                      <span>Tiempo de preparación: 15-20 min</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Phone className="h-4 w-4" />
                      <span>Te avisaremos cuando esté listo</span>
                    </div>
                  </div>

                  {!showQR && (
                    <Button
                      className="mt-6 w-full text-white"
                      size="lg"
                      onClick={handlePresencialPayment}
                      disabled={!customerInfo.name || !customerInfo.phone}
                      style={{
                        background: paymentMethod === "qr" ? "#3B82F6" : "#059669",
                      }}
                    >
                      {paymentMethod === "qr" ? (
                        <>
                          <QrCode className="mr-2 h-4 w-4" />
                          Generar QR - ${grandTotal.toFixed(2)}
                        </>
                      ) : (
                        <>
                          <Wallet className="mr-2 h-4 w-4" />
                          Confirmar Pedido - ${grandTotal.toFixed(2)}
                        </>
                      )}
                    </Button>
                  )}
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  )
}
