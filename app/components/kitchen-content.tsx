"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Clock, CheckCircle, AlertCircle, User, MapPin } from "lucide-react"
import { Button } from "../../components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card"
import { Badge } from "../../components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../../components/ui/tabs"
import { useTables } from "../context/table-context"

type OrderStatus = "pending" | "preparing" | "ready" | "delivered"

interface KitchenOrder {
  id: string
  tableNumber: number
  tableId: number
  waiter?: string
  items: Array<{
    id: number
    name: string
    quantity: number
    image: string
    preparationArea: string
    notes?: string
  }>
  createdAt: Date
  status: OrderStatus
  area: "kitchen" | "cafeteria" | "bar"
  estimatedTime?: number
}

export default function KitchenContent() {
  const { tables } = useTables()
  const [orders, setOrders] = useState<KitchenOrder[]>([])
  const [selectedArea, setSelectedArea] = useState<"kitchen" | "cafeteria" | "bar">("kitchen")

  // Generar órdenes desde las mesas
  useEffect(() => {
    const kitchenOrders: KitchenOrder[] = []

    tables.forEach((table) => {
      if (table.currentOrder && table.currentOrder.items.length > 0) {
        // Agrupar items por área de preparación
        const itemsByArea = table.currentOrder.items.reduce(
          (acc, item) => {
            const area = item.preparationArea
            if (!acc[area]) {
              acc[area] = []
            }
            acc[area].push(item)
            return acc
          },
          {} as Record<string, typeof table.currentOrder.items>,
        )

        // Crear una orden por cada área
        Object.entries(itemsByArea).forEach(([area, items]) => {
          const isPrinted = table.currentOrder?.printedAreas?.includes(area)
          if (isPrinted) {
            kitchenOrders.push({
              id: `${table.id}-${area}-${table.currentOrder?.id}`,
              tableNumber: table.number,
              tableId: table.id,
              waiter: table.currentOrder?.waiter || table.assignedWaiter,
              items: items,
              createdAt: table.currentOrder?.createdAt || new Date(),
              status: "pending",
              area: area as "kitchen" | "cafeteria" | "bar",
              estimatedTime: items.length * 5, // 5 minutos por item
            })
          }
        })
      }
    })

    setOrders(kitchenOrders)
  }, [tables])

  const updateOrderStatus = (orderId: string, newStatus: OrderStatus) => {
    setOrders((prev) => prev.map((order) => (order.id === orderId ? { ...order, status: newStatus } : order)))
  }

  const getAreaName = (area: string) => {
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

  const getStatusColor = (status: OrderStatus) => {
    switch (status) {
      case "pending":
        return "bg-red-100 text-red-800"
      case "preparing":
        return "bg-yellow-100 text-yellow-800"
      case "ready":
        return "bg-green-100 text-green-800"
      case "delivered":
        return "bg-gray-100 text-gray-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const getStatusIcon = (status: OrderStatus) => {
    switch (status) {
      case "pending":
        return <AlertCircle className="h-4 w-4" />
      case "preparing":
        return <Clock className="h-4 w-4" />
      case "ready":
        return <CheckCircle className="h-4 w-4" />
      case "delivered":
        return <CheckCircle className="h-4 w-4" />
      default:
        return <Clock className="h-4 w-4" />
    }
  }

  const filteredOrders = orders.filter((order) => order.area === selectedArea)
  const pendingCount = filteredOrders.filter((o) => o.status === "pending").length
  const preparingCount = filteredOrders.filter((o) => o.status === "preparing").length
  const readyCount = filteredOrders.filter((o) => o.status === "ready").length

  return (
    <div className="w-full">
      {/* Header */}
      <div className="bg-white border-b p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <h1 className="text-2xl font-bold">Sistema de Comandas</h1>
          </div>

          <div className="flex gap-2">
            <Badge variant="secondary" className="bg-red-100 text-red-800">
              Pendientes: {pendingCount}
            </Badge>
            <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
              Preparando: {preparingCount}
            </Badge>
            <Badge variant="secondary" className="bg-green-100 text-green-800">
              Listos: {readyCount}
            </Badge>
          </div>
        </div>
      </div>

      {/* Tabs por área */}
      <div className="p-4">
        <Tabs value={selectedArea} onValueChange={(value) => setSelectedArea(value as "kitchen" | "cafeteria" | "bar")}>
          <TabsList className="grid w-full grid-cols-3 mb-6">
            <TabsTrigger value="kitchen" className="relative">
              Cocina
              {orders.filter((o) => o.area === "kitchen" && o.status !== "delivered").length > 0 && (
                <Badge className="ml-2 bg-red-500 text-white text-xs">
                  {orders.filter((o) => o.area === "kitchen" && o.status !== "delivered").length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="cafeteria" className="relative">
              Cafetería
              {orders.filter((o) => o.area === "cafeteria" && o.status !== "delivered").length > 0 && (
                <Badge className="ml-2 bg-red-500 text-white text-xs">
                  {orders.filter((o) => o.area === "cafeteria" && o.status !== "delivered").length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="bar" className="relative">
              Bar
              {orders.filter((o) => o.area === "bar" && o.status !== "delivered").length > 0 && (
                <Badge className="ml-2 bg-red-500 text-white text-xs">
                  {orders.filter((o) => o.area === "bar" && o.status !== "delivered").length}
                </Badge>
              )}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="kitchen">
            <OrdersGrid
              orders={filteredOrders}
              area="Cocina"
              onUpdateStatus={updateOrderStatus}
              getStatusColor={getStatusColor}
              getStatusIcon={getStatusIcon}
            />
          </TabsContent>
          <TabsContent value="cafeteria">
            <OrdersGrid
              orders={filteredOrders}
              area="Cafetería"
              onUpdateStatus={updateOrderStatus}
              getStatusColor={getStatusColor}
              getStatusIcon={getStatusIcon}
            />
          </TabsContent>
          <TabsContent value="bar">
            <OrdersGrid
              orders={filteredOrders}
              area="Bar"
              onUpdateStatus={updateOrderStatus}
              getStatusColor={getStatusColor}
              getStatusIcon={getStatusIcon}
            />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}

interface OrdersGridProps {
  orders: KitchenOrder[]
  area: string
  onUpdateStatus: (orderId: string, status: OrderStatus) => void
  getStatusColor: (status: OrderStatus) => string
  getStatusIcon: (status: OrderStatus) => React.ReactNode
}

function OrdersGrid({ orders, area, onUpdateStatus, getStatusColor, getStatusIcon }: OrdersGridProps) {
  if (orders.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-gray-500">
          <Clock className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <h3 className="text-lg font-medium">No hay comandas en {area}</h3>
          <p className="text-sm">Las nuevas órdenes aparecerán aquí automáticamente</p>
        </div>
      </div>
    )
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {orders.map((order) => (
        <Card key={order.id} className="overflow-hidden">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center justify-between text-base">
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                Mesa {order.tableNumber}
              </div>
              <Badge className={getStatusColor(order.status)}>
                {getStatusIcon(order.status)}
                <span className="ml-1">
                  {order.status === "pending"
                    ? "Pendiente"
                    : order.status === "preparing"
                      ? "Preparando"
                      : order.status === "ready"
                        ? "Listo"
                        : "Entregado"}
                </span>
              </Badge>
            </CardTitle>
            <div className="flex items-center justify-between text-sm text-gray-500">
              <span>{new Date(order.createdAt).toLocaleTimeString()}</span>
              {order.waiter && (
                <div className="flex items-center gap-1">
                  <User className="h-3 w-3" />
                  {order.waiter}
                </div>
              )}
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {/* Items */}
            <div className="space-y-2">
              {order.items.map((item) => (
                <div key={item.id} className="flex items-center gap-3 p-2 bg-gray-50 rounded">
                  <img
                    src={item.image || "/placeholder.svg"}
                    alt={item.name}
                    className="w-8 h-8 object-cover rounded"
                  />
                  <div className="flex-1">
                    <p className="font-medium text-sm">{item.name}</p>
                    <p className="text-xs text-gray-500">Cantidad: {item.quantity}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Actions */}
            <div className="flex gap-2 pt-2">
              {order.status === "pending" && (
                <Button size="sm" onClick={() => onUpdateStatus(order.id, "preparing")} className="flex-1">
                  Iniciar Preparación
                </Button>
              )}
              {order.status === "preparing" && (
                <Button
                  size="sm"
                  onClick={() => onUpdateStatus(order.id, "ready")}
                  className="flex-1 bg-green-600 hover:bg-green-700"
                >
                  Marcar Listo
                </Button>
              )}
              {order.status === "ready" && (
                <Button
                  size="sm"
                  onClick={() => onUpdateStatus(order.id, "delivered")}
                  variant="outline"
                  className="flex-1"
                >
                  Marcar Entregado
                </Button>
              )}
            </div>

            {/* Estimated time */}
            {order.estimatedTime && order.status !== "delivered" && (
              <div className="text-xs text-gray-500 text-center">Tiempo estimado: {order.estimatedTime} min</div>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  )
} 