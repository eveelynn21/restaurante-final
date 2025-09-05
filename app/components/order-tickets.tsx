"use client"

import { useState, useEffect } from "react"
import { Printer, Check, AlertCircle } from "lucide-react"
import { useRouter } from "next/navigation"
import { Button } from "../../components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card"
import { Badge } from "../../components/ui/badge"
import { useTables, type Table } from "../context/table-context"
import { useComandas } from "../context/comandas-context"
import { formatPrice } from "../../lib/format-price"

interface OrderTicketsProps {
  table: Table
}

export default function OrderTickets({ table }: OrderTicketsProps) {
  const { getOrderItemsByArea, printOrderByArea } = useTables()
  const { addComanda, markItemsAsSent, isItemSent } = useComandas()
  const [printingArea, setPrintingArea] = useState<string | null>(null)
  const [areas, setAreas] = useState<{ id: number, name: string }[]>([])
  const router = useRouter()

  useEffect(() => {
    fetch("/api/order-areas").then(res => res.json()).then(data => setAreas(data.data || []))
  }, [])

  if (!table.currentOrder || table.currentOrder.items.length === 0) {
    return (
      <div className="text-center p-4 text-muted-foreground">No hay productos en esta mesa para imprimir comandas.</div>
    )
  }

  const itemsByArea = getOrderItemsByArea(table.id)
  const printedAreas = table.currentOrder.printedAreas || []

  const handlePrintArea = (area: string) => {
    setPrintingArea(area)

    // Simulamos la impresión
    setTimeout(() => {
      printOrderByArea(table.id, area)
      setPrintingArea(null)
    }, 1500)
  }

  const handleSendComanda = (area: string) => {
    // Obtener solo los items que no han sido enviados
    const allItems = itemsByArea[area] || []
    const unsentItems = allItems.filter(item => !isItemSent(String(table.id), area, String((item as any)._orderItemId || item.id)))
    
    if (unsentItems.length === 0) return

    // Agrupar productos iguales antes de crear la comanda
    const groupItems = (items: any[]) => {
      const grouped: Record<string, any> = {};
      items.forEach(item => {
        if (!item.id) return;
        const key = String(item.id);
        if (!grouped[key]) {
          grouped[key] = { ...item };
        } else {
          grouped[key].quantity += item.quantity;
        }
      });
      return Object.values(grouped);
    };

    // Crear la comanda para enviar solo con items no enviados (agrupados)
    const comanda = {
      id: `${table.id}-${area}-${Date.now()}`,
      tableNumber: String(table.number),
      tableId: String(table.id),
      waiter: table.currentOrder?.waiter || table.assignedWaiter || "Sin asignar",
      items: groupItems(unsentItems).map(item => ({ ...item, status: 'pending' })),
      createdAt: new Date(),
      status: "pending" as const,
      area: area,
      estimatedTime: unsentItems.length * 5
    }

    console.log('Enviando comanda:', comanda)
    console.log('Área de la comanda:', area)
    console.log('Tipo de área:', typeof area)

    // Agregar la comanda al contexto
    addComanda(comanda)
    
    // Marcar los items como enviados
    const itemIds = unsentItems.map(item => String((item as any)._orderItemId || item.id))
    markItemsAsSent(String(table.id), area, itemIds)
    
    // Mostrar confirmación
    alert(`Comanda enviada a ${getAreaName(area)}`)
  }

  const getAreaName = (area: string) => {
    // Si es null o undefined, es área General
    if (!area || area === "null" || area === "undefined") {
      return "General"
    }
    // Si es un id numérico, buscar en el array de áreas
    const found = areas.find(a => String(a.id) === String(area))
    if (found) return found.name
    // Si no, usar el switch anterior para compatibilidad
    switch (area) {
      case "kitchen":
        return "Cocina"
      case "cafeteria":
        return "Cafetería"
      case "bar":
        return "Bar"
      default:
        return area
    }
  }

  const getAreaIcon = (area: string) => {
    if (printedAreas.includes(area)) {
      return <Check className="h-4 w-4 text-green-500" />
    }
    return null
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium">Comandas por Área</h3>
        <Badge variant="outline" className="text-xs">Mesa {table.number}</Badge>
      </div>

      {Object.keys(itemsByArea).length === 0 ? (
        <div className="text-center p-4 text-muted-foreground">No hay productos para imprimir</div>
      ) : (
        Object.entries(itemsByArea).map(([area, items]) => {
          // Obtener solo los items que no han sido enviados
          const unsentItems = items.filter(item => !isItemSent(String(table.id), area, String((item as any)._orderItemId || item.id)))

          // Agrupar visualmente los productos iguales
          const groupedUnsentItems = Object.values(
            unsentItems.reduce((acc, item) => {
              if (!item.id) return acc;
              const key = String(item.id);
              if (!acc[key]) {
                acc[key] = { ...item };
              } else {
                acc[key].quantity += item.quantity;
              }
              return acc;
            }, {} as Record<string, typeof unsentItems[0]>)
          );
          
          return (
            <Card key={area} className="mb-3">
              <CardHeader className="pb-1 flex flex-row items-center justify-between">
                <CardTitle className="text-sm flex-1">{getAreaName(area)}</CardTitle>
                <Badge variant="outline" className="text-xs">{groupedUnsentItems.length} productos</Badge>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="space-y-1 mb-2">
                  {groupedUnsentItems.map((item, idx) => (
                    <div key={item.id + '-' + idx} className="flex items-center justify-between text-xs">
                      <span>{item.quantity}x {item.name}</span>
                      <span className="font-semibold">{formatPrice(Number(item.sell_price_inc_tax))}</span>
                    </div>
                  ))}
                </div>

              <div className="space-y-1">
                <Button
                  size="sm"
                  className="w-full text-xs"
                  variant={printedAreas.includes(area) ? "outline" : "default"}
                  disabled={printingArea === area || printedAreas.includes(area)}
                  onClick={() => handlePrintArea(area)}
                >
                  {printingArea === area ? (
                    <>
                      <span className="animate-pulse">Imprimiendo...</span>
                    </>
                  ) : printedAreas.includes(area) ? (
                    <>
                      <Check className="h-3 w-3 mr-1" />
                      Impreso
                    </>
                  ) : (
                    <>
                      <Printer className="h-3 w-3 mr-1" />
                      Imprimir en {table.number}
                    </>
                  )}
                </Button>
                <Button
                  size="sm"
                  variant="secondary"
                  className="w-full bg-purple-500 hover:bg-purple-600 text-white text-xs"
                  onClick={() => handleSendComanda(area)}
                  disabled={unsentItems.length === 0}
                >
                  {unsentItems.length === 0 ? "Sin productos nuevos" : "Enviar Comanda"}
                </Button>
              </div>
            </CardContent>
          </Card>
          )
        })
      )}

      {Object.keys(itemsByArea).length > 0 &&
        !Object.keys(itemsByArea).every((area) => printedAreas.includes(area)) && (
          <div className="flex items-center gap-2 text-amber-600 text-sm mt-2">
            <AlertCircle className="h-4 w-4" />
            <span>Hay comandas pendientes de imprimir</span>
          </div>
        )}
    </div>
  )
}
