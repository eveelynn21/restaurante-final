"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Check, Printer, MapPin, User } from "lucide-react"

import { Button } from "../../components/ui/button"
import { Separator } from "../../components/ui/separator"
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card"
import { Badge } from "../../components/ui/badge"
import { useTables } from "../context/table-context"

interface SplitReceiptsData {
  tableId: number
  tableNumber: number
  bills: Array<{
    id: string
    personName: string
    items: Array<{
      productId: number
      product: { name: string; sell_price_inc_tax: number }
      quantity: number
      isShared: boolean
    }>
    subtotal: number
    tax: number
    total: number
  }>
  paidBills: string[]
  paymentMethods: Record<string, string>
  receiptNumber: number
  date: string
}

export default function SplitSuccessPage() {
  const router = useRouter()
  const { clearTableOrder } = useTables()
  const [receiptsData, setReceiptsData] = useState<SplitReceiptsData | null>(null)

  useEffect(() => {
    const savedData = localStorage.getItem("split-receipts")
    if (savedData) {
      try {
        setReceiptsData(JSON.parse(savedData))
      } catch (error) {
        console.error("Error parsing receipts data:", error)
        router.push("/tables")
      }
    } else {
      router.push("/tables")
    }
  }, [router])

  const handleBackToTables = () => {
    if (receiptsData) {
      clearTableOrder(receiptsData.tableId)
    }
    localStorage.removeItem("split-receipts")
    // Forzar actualización inmediata
    window.location.href = "/tables"
  }

  const handlePrint = () => {
    window.print()
  }

  if (!receiptsData) {
    return null
  }

  const totalAmount = receiptsData.bills.reduce((sum, bill) => sum + bill.total, 0)

  return (
    <div className="container mx-auto max-w-4xl py-8">
      <div className="rounded-lg border p-6 print:border-none bg-white">
        <div className="mb-6 flex items-center justify-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
            <Check className="h-6 w-6 text-green-600" />
          </div>
        </div>

        <h1 className="mb-2 text-center text-2xl font-bold">Pagos Completados</h1>
        <p className="mb-6 text-center text-muted-foreground">¡Todos los pagos han sido procesados exitosamente!</p>

        <div className="mb-6 text-center">
          <div className="flex items-center justify-center gap-2 mb-2">
            <MapPin className="h-4 w-4" />
            <span className="font-medium">Mesa {receiptsData.tableNumber}</span>
          </div>
          <p className="font-medium">Recibo #{receiptsData.receiptNumber}</p>
          <p className="text-sm text-muted-foreground">{receiptsData.date}</p>
        </div>

        <Separator className="my-6" />

        {/* Individual Bills Summary */}
        <div className="space-y-4 mb-6">
          <h3 className="font-semibold text-lg">Resumen de Pagos Individuales</h3>
          {receiptsData.bills.map((bill) => (
            <Card key={bill.id} className="border-green-200 bg-green-50">
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4" />
                    {bill.personName}
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="bg-white">
                      {receiptsData.paymentMethods[bill.id] === "card" ? "Tarjeta" : "Efectivo"}
                    </Badge>
                    <span className="font-bold">${bill.total.toFixed(2)}</span>
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="space-y-1 text-sm">
                  {bill.items.map((item, index) => (
                    <div key={index} className="flex justify-between">
                      <span className="flex items-center gap-1">
                        {item.quantity}x {item.product.name}
                        {item.isShared && (
                          <Badge variant="outline" className="text-xs">
                            Compartido
                          </Badge>
                        )}
                      </span>
                      <span>${(item.product.sell_price_inc_tax * item.quantity).toFixed(2)}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <Separator className="my-6" />

        {/* Total Summary */}
        <div className="space-y-2 mb-6">
          <div className="flex justify-between">
            <span>Total de personas:</span>
            <span>{receiptsData.bills.length}</span>
          </div>
          <div className="flex justify-between">
            <span>Subtotal general:</span>
            <span>${receiptsData.bills.reduce((sum, bill) => sum + bill.subtotal, 0).toFixed(2)}</span>
          </div>
          <div className="flex justify-between">
            <span>Impuestos totales:</span>
            <span>${receiptsData.bills.reduce((sum, bill) => sum + bill.tax, 0).toFixed(2)}</span>
          </div>
          <div className="flex justify-between font-bold text-lg">
            <span>Total General:</span>
            <span>${totalAmount.toFixed(2)}</span>
          </div>
        </div>

        <div className="mt-6 flex flex-col gap-3 print:hidden">
          <Button onClick={handlePrint} variant="outline" className="w-full">
            <Printer className="mr-2 h-4 w-4" />
            Imprimir Recibos
          </Button>
          <Button onClick={handleBackToTables} className="w-full">
            Volver a Mesas
          </Button>
        </div>
      </div>
    </div>
  )
}
