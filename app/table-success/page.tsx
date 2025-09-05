"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Check, Printer, MapPin } from "lucide-react"

import { Button } from "../../components/ui/button"
import { Separator } from "../../components/ui/separator"

interface TableReceipt {
  tableId: number
  tableNumber: number
  items: Array<{ id: number; name: string; price: number; quantity: number; image: string }>
  total: number
  tax: number
  grandTotal: number
  paymentMethod: string
  receiptNumber: number
  date: string
  fromCart?: boolean // Indicador si viene del POS
}

export default function TableSuccessPage() {
  const router = useRouter()
  const [receipt, setReceipt] = useState<TableReceipt | null>(null)

  useEffect(() => {
    const savedReceipt = localStorage.getItem("table-receipt")
    if (savedReceipt) {
      try {
        setReceipt(JSON.parse(savedReceipt))
      } catch (error) {
        console.error("Error parsing receipt:", error)
        router.push("/tables")
      }
    } else {
      router.push("/tables")
    }
  }, [router])

  const handleBackToTables = () => {
    localStorage.removeItem("table-receipt")
    // Redirigir según el origen
    if (receipt?.fromCart) {
      router.push("/pos")
    } else {
      router.push("/tables")
    }
  }

  const handlePrint = () => {
    window.print()
  }

  if (!receipt) {
    return null
  }

  return (
    <div className="container mx-auto max-w-md py-8">
      <div className="rounded-lg border p-6 print:border-none bg-white">
        <div className="mb-6 flex items-center justify-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
            <Check className="h-6 w-6 text-green-600" />
          </div>
        </div>

        <h1 className="mb-2 text-center text-2xl font-bold">Pago Exitoso</h1>
        <p className="mb-6 text-center text-muted-foreground">¡Gracias por su compra!</p>

        <div className="mb-6 text-center">
          <div className="flex items-center justify-center gap-2 mb-2">
            <MapPin className="h-4 w-4" />
            <span className="font-medium">Mesa {receipt.tableNumber}</span>
          </div>
          <p className="font-medium">Recibo #{receipt.receiptNumber}</p>
          <p className="text-sm text-muted-foreground">{receipt.date}</p>
        </div>

        <Separator className="my-4" />

        <div className="space-y-3">
          {Object.values(
            receipt.items.reduce((acc, item) => {
              if (!item.id) return acc;
              const key = String(item.id);
              if (!acc[key]) {
                acc[key] = { ...item };
              } else {
                acc[key].quantity += item.quantity;
              }
              return acc;
            }, {} as Record<string, typeof receipt.items[0]>)
          ).map((item, index) => (
            <div key={item.id + '-' + index} className="flex justify-between">
              <div>
                <p>
                  {item.name} × {item.quantity}
                </p>
              </div>
              <p>${(item.price * item.quantity).toFixed(2)}</p>
            </div>
          ))}
        </div>

        <Separator className="my-4" />

        <div className="space-y-2">
          <div className="flex justify-between font-bold">
            <p>Total</p>
            <p>${receipt.grandTotal.toFixed(2)}</p>
          </div>
        </div>

        <div className="mt-6 flex flex-col gap-3 print:hidden">
          <Button onClick={handlePrint} variant="outline" className="w-full">
            <Printer className="mr-2 h-4 w-4" />
            Imprimir Recibo
          </Button>
          <Button onClick={handleBackToTables} className="w-full">
            {receipt?.fromCart ? "Volver al POS" : "Volver a Mesas"}
          </Button>
        </div>
      </div>
    </div>
  )
}
