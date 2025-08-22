"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Plus, Move, Hand, Settings, Receipt, Trash2, Minus, User, Circle, ShoppingCart, Search, X, ChevronDown, ChevronUp, Send } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useTables, type Table } from "../context/table-context"
import { useComandas } from "../context/comandas-context"
import DraggableTable from "./draggable-table"
import OrderTickets from "./order-tickets"
import SplitBill from "./split-bill"
import { useRouter } from "next/navigation"
import { Input } from "@/components/ui/input"
import NewTableDialog from "./new-table-dialog"
import { formatPrice } from "@/lib/format-price"

interface RestaurantCanvasProps {
  onTableSelect?: (table: Table) => void
  resTables?: Array<{ id: number; name: string; location_id: number; [key: string]: any }>
  searchQuery?: string
  setSearchQuery?: (query: string) => void
  products?: any[] // Lista de productos para mostrar nombres en combos
}

export default function RestaurantCanvas({ onTableSelect, resTables, searchQuery, setSearchQuery, products = [] }: RestaurantCanvasProps) {
  console.log('RestaurantCanvas - resTables recibidas:', resTables)
  
  const {
    tables,
    updateTableStatus,
    removeProductFromTable,
    updateProductQuantityInTable,
    completeTableOrder,
    clearTableOrder,
    assignWaiterToTable,
    addTable,
    getOrderItemsByArea,
  } = useTables()
  
  const { addComanda, markItemsAsSent, isItemSent } = useComandas()
  
  const [isDragMode, setIsDragMode] = useState(false)
  const [selectedTable, setSelectedTable] = useState<Table | null>(null)
  const [isDraggingProduct, setIsDraggingProduct] = useState(false)
  const [activeTab, setActiveTab] = useState("order")
  const router = useRouter()
  const [waiterName, setWaiterName] = useState("")
  const [expandedCombos, setExpandedCombos] = useState<Set<number>>(new Set())
  const [comboProducts, setComboProducts] = useState<{[key: number]: any[]}>({})
  const [areas, setAreas] = useState<{ id: number, name: string }[]>([])

  // Cargar áreas al inicializar
  useEffect(() => {
    const fetchAreas = async () => {
      try {
        const token = localStorage.getItem('token')
        if (token) {
          const response = await fetch('/api/order-areas', {
            headers: { 'Authorization': `Bearer ${token}` }
          })
          const data = await response.json()
          setAreas(data.data || [])
        }
      } catch (error) {
        console.error('Error fetching areas:', error)
      }
    }
    fetchAreas()
  }, [])

  const handleTableClick = (table: Table) => {
    if (!isDragMode) {
      setSelectedTable(table)
      onTableSelect?.(table)
    }
  }

  const handleCloseSelection = () => {
    setSelectedTable(null)
  }

  // Actualizar selectedTable cuando cambien las tables
  const currentSelectedTable = selectedTable ? tables.find(t => t.id === selectedTable.id) : null

  const handleCheckoutTable = (table: Table) => {
    if (table.currentOrder && table.currentOrder.items.length > 0) {
      // Mapear los items para que tengan la estructura correcta para el checkout
      const mappedItems = table.currentOrder.items.map(item => ({
        id: item.id || 0,
        name: item.name,
        price: Number(item.sell_price_inc_tax) || 0,
        quantity: item.quantity,
        image: item.image || ""
      }))
      
      localStorage.setItem(
        "temp-checkout-order",
        JSON.stringify({
          tableId: table.id,
          tableNumber: table.number,
          items: mappedItems,
          total: table.currentOrder.total,
        }),
      )
      router.push("/table-checkout")
    }
  }

  // Función para enviar todas las comandas de una vez
  const handleSendAllOrders = (table: Table) => {
    if (!table.currentOrder || table.currentOrder.items.length === 0) return

    // Obtener items agrupados por área
    const itemsByArea = getOrderItemsByArea(table.id)
    
    // Enviar comandas para cada área
    Object.entries(itemsByArea).forEach(([areaName, items]) => {
      if (items.length === 0) return

      // Filtrar solo items no enviados
      const unsentItems = items.filter(item => 
        !isItemSent(String(table.id), areaName, String((item as any)._orderItemId || item.id))
      )
      
      if (unsentItems.length === 0) return

      // Agrupar productos iguales
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

      // Crear la comanda
      const comanda = {
        id: `${table.id}-${areaName}-${Date.now()}`,
        tableNumber: String(table.number),
        tableId: String(table.id),
        waiter: table.currentOrder?.waiter || table.assignedWaiter || "Sin asignar",
        items: groupItems(unsentItems).map(item => ({ ...item, status: 'pending' })),
        createdAt: new Date(),
        status: "pending" as const,
        area: areaName,
        estimatedTime: unsentItems.length * 5
      }

      console.log('Enviando comanda:', comanda)

      // Agregar la comanda al contexto
      addComanda(comanda)
      
      // Marcar los items como enviados
      const itemIds = unsentItems.map(item => String((item as any)._orderItemId || item.id))
      markItemsAsSent(String(table.id), areaName, itemIds)
    })

    // Mostrar confirmación
    alert('Pedido enviado a todas las áreas')
  }

  const handleCanvasDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDraggingProduct(true)
  }

  const handleCanvasDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDraggingProduct(false)
  }

  const handleCanvasDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDraggingProduct(false)
    
    const productData = e.dataTransfer.getData("application/json")
    if (productData) {
      try {
        const product = JSON.parse(productData)
        console.log("Producto arrastrado:", product)
        
        // Encontrar la mesa más cercana al punto de drop
        const rect = e.currentTarget.getBoundingClientRect()
        const x = e.clientX - rect.left
        const y = e.clientY - rect.top
        
        let closestTable: Table | null = null
        let minDistance = Infinity
        
        tables.forEach(table => {
          const distance = Math.sqrt(
            Math.pow(x - table.x, 2) + Math.pow(y - table.y, 2)
          )
          if (distance < minDistance) {
            minDistance = distance
            closestTable = table
          }
        })
        
        if (closestTable && minDistance < 100) {
          console.log("Agregando producto a mesa:", (closestTable as any).number)
          // Note: addProductToTable function needs to be implemented in table context
          // For now, we'll just log the action
          console.log("Would add product to table:", (closestTable as any).id, product)
        }
      } catch (error) {
        console.error("Error parsing dragged product:", error)
      }
    }
  }

  const getStatusStats = () => {
    const stats = {
      available: tables.filter((t) => t.status === "available").length,
      occupied: tables.filter((t) => t.status === "occupied").length,
      reserved: tables.filter((t) => t.status === "reserved").length,
      "needs-cleaning": tables.filter((t) => t.status === "needs-cleaning").length,
    }
    return stats
  }

    const stats = getStatusStats()

  // Verificar si hay comandas pendientes de imprimir
  const hasPendingTickets = (table: Table) => {
    if (!table.currentOrder || !table.currentOrder.items.length) return false

    const areas = new Set(table.currentOrder.items.map((item) => item.preparationArea || 'general'))
    const printedAreas = new Set(table.currentOrder.printedAreas || [])

    return Array.from(areas).some((area) => !printedAreas.has(area))
  }

  // Verificar si la cuenta está dividida
  const isSplitBill = (table: Table) => {
    return table.currentOrder?.splitMode || false
  }

  // Helper function to check if a product is a combo
  const isProductCombo = (item: any): boolean => {
    if (!item.combo) return false
    try {
      const combo = typeof item.combo === 'string' ? JSON.parse(item.combo) : item.combo
      return Array.isArray(combo) && combo.length > 0
    } catch {
      return false
    }
  }

  // Load combo products when a combo is expanded
  const loadComboProducts = async (itemId: number, comboData: any) => {
    if (comboProducts[itemId]) return // Already loaded
    
    try {
      const token = localStorage.getItem('token')
      if (!token) return

      // Get all products to find combo components
      const response = await fetch('/api/products?page=1&pageSize=1000', {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      
      if (response.ok) {
        const data = await response.json()
        const allProducts = data.products || []
        
        // Parse combo data
        const comboIds = typeof comboData === 'string' ? JSON.parse(comboData) : comboData
        
        // Find combo products
        const comboProductDetails = comboIds.map((productId: number) => {
          const product = allProducts.find((p: any) => p.id === productId)
          return product ? {
            id: product.id,
            name: product.name,
            sku: product.sku,
            image: product.image,
            price: product.sell_price_inc_tax
          } : null
        }).filter(Boolean)
        
        setComboProducts(prev => ({
          ...prev,
          [itemId]: comboProductDetails
        }))
      }
    } catch (error) {
      console.error('Error loading combo products:', error)
    }
  }

  const toggleComboExpansion = (itemId: number, comboData: any) => {
    setExpandedCombos(prev => {
      const newSet = new Set(prev)
      if (newSet.has(itemId)) {
        newSet.delete(itemId)
      } else {
        newSet.add(itemId)
        // Load combo products when expanding
        loadComboProducts(itemId, comboData)
      }
      return newSet
    })
  }

  // Helper function to check if an item has been sent to any area
  const isItemSentToAnyArea = (item: any, table: Table) => {
    if (!table.currentOrder) return false
    
    const itemsByArea = getOrderItemsByArea(table.id)
    return Object.entries(itemsByArea).some(([areaName, items]) => {
      const foundItem = items.find(i => (i as any)._orderItemId === (item as any)._orderItemId)
      return foundItem && isItemSent(String(table.id), areaName, String((item as any)._orderItemId || item.id))
    })
  }

  return (
    <div className="flex h-full">
      {/* Canvas Area */}
      <div className="flex-1 relative bg-slate-50 border rounded-lg overflow-hidden">
        {/* Canvas Header */}
        <div className="absolute top-4 left-4 right-4 z-20 flex justify-between items-center">
          <div className="flex gap-2">
            <Button variant={isDragMode ? "default" : "outline"} size="sm" onClick={() => setIsDragMode(!isDragMode)}>
              {isDragMode ? <Move className="h-4 w-4 mr-2" /> : <Hand className="h-4 w-4 mr-2" />}
              {isDragMode ? "Editando" : "Selección"}
            </Button>
            {/* 
<NewTableDialog>
  <Button variant="outline" size="sm" className="bg-blue-50 border-blue-200 hover:bg-blue-100">
    <Plus className="h-4 w-4 mr-2" />
    Agregar Mesa
  </Button>
</NewTableDialog>
*/}
            <NewTableDialog>
              <Button variant="outline" size="sm" className="bg-blue-50 border-blue-200 hover:bg-blue-100">
                <Plus className="h-4 w-4 mr-2" />
                Agregar Mesa
              </Button>
            </NewTableDialog>
            {/* Debug: Verificar que el diálogo funciona */}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                console.log("Botón de prueba clickeado")
                console.log("Número de mesas actuales:", tables.length)
              }}
              className="text-xs opacity-50"
            >
              Debug
            </Button>
          </div>

          <div className="flex gap-2">
            <Badge variant="secondary" className="bg-green-100 text-green-800">
              Libres: {stats.available}
            </Badge>
            <Badge variant="secondary" className="bg-red-100 text-red-800">
              Ocupadas: {stats.occupied}
            </Badge>
            <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
              Reservadas: {stats.reserved}
            </Badge>
          </div>
        </div>

        {/* Canvas Content */}
        <div className="absolute inset-0 pt-20 p-4">
          <div
            className={`relative w-full h-full bg-white rounded-lg border-2 transition-all duration-200 ${
              isDraggingProduct ? "border-blue-400 border-dashed bg-blue-50" : "border-dashed border-gray-300"
            }`}
            style={{ minHeight: "600px" }}
            onDragOver={handleCanvasDragOver}
            onDragLeave={handleCanvasDragLeave}
            onDrop={handleCanvasDrop}
          >
            {/* Grid Pattern */}
            <div
              className="absolute inset-0 opacity-10"
              style={{
                backgroundImage: `
                  linear-gradient(to right, #000 1px, transparent 1px),
                  linear-gradient(to bottom, #000 1px, transparent 1px)
                `,
                backgroundSize: "20px 20px",
              }}
            />

            {/* Tables from context (original) - always show these for drag & drop functionality */}
            {tables.map((table) => (
              <DraggableTable
                key={table.id}
                table={table}
                onTableClick={handleTableClick}
                isDragMode={isDragMode}
                showTicketIndicator={hasPendingTickets(table)}
              />
            ))}

            {/* Empty State */}
            {tables.length === 0 && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center text-gray-500">
                  <Settings className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p className="text-lg font-medium">Canvas del Restaurante</p>
                  <p className="text-sm">Haz clic en "Nueva Mesa" para comenzar</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Table Info Panel */}
      {currentSelectedTable && (
        <div className="w-96 border-l bg-background p-4 overflow-y-auto">
          <Card className="shadow-xl border-2 border-primary/20 rounded-2xl">
            <CardHeader className="pb-2 relative">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleCloseSelection}
                className="absolute top-2 right-2 h-8 w-8 p-0 hover:bg-gray-100 rounded-full z-10"
              >
                <X className="h-4 w-4 text-gray-500 hover:text-gray-700" />
              </Button>
              <CardTitle className="flex items-center justify-between gap-2">
                <span className="flex items-center gap-2 text-2xl font-extrabold">
                  <ShoppingCart className="h-6 w-6 text-primary/80" />
                  {currentSelectedTable.name}
                </span>
                <div className="flex gap-2">
                  <Badge
                    variant="secondary"
                    className={
                      currentSelectedTable.status === "available"
                        ? "bg-green-100 text-green-800 border border-green-300"
                        : currentSelectedTable.status === "occupied"
                          ? "bg-red-100 text-red-800 border border-red-300"
                          : currentSelectedTable.status === "reserved"
                            ? "bg-yellow-100 text-yellow-800 border border-yellow-300"
                            : "bg-gray-100 text-gray-800 border border-gray-300"
                    }
                  >
                    {currentSelectedTable.status === "available"
                      ? <><span className='inline-block w-2 h-2 bg-green-500 rounded-full mr-1'></span>Libre</>
                      : currentSelectedTable.status === "occupied"
                        ? <><span className='inline-block w-2 h-2 bg-red-500 rounded-full mr-1'></span>Ocupada</>
                        : currentSelectedTable.status === "reserved"
                          ? <><span className='inline-block w-2 h-2 bg-yellow-400 rounded-full mr-1'></span>Reservada</>
                          : <><span className='inline-block w-2 h-2 bg-gray-400 rounded-full mr-1'></span>Necesita Limpieza</>}
                  </Badge>
                  {isSplitBill(currentSelectedTable) && (
                    <Badge variant="outline" className="bg-purple-50 text-purple-700 border border-purple-200">
                      Cuenta Dividida
                    </Badge>
                  )}
                </div>
              </CardTitle>
              <div className="flex items-center gap-3 mt-2 text-gray-500 text-sm">
                <User className="h-4 w-4" />
                {currentSelectedTable.seats} asientos
                <span className="mx-2">•</span>
                <span className="flex items-center gap-1">
                  {currentSelectedTable.shape === "rectangle" ? <Move className="h-4 w-4" /> : <Circle className="h-4 w-4" />}
                  {currentSelectedTable.shape === "rectangle" ? "Rectangular" : "Circular"}
                </span>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-2">
                <TabsList className="grid w-full grid-cols-2 rounded-xl bg-primary/5">
                  <TabsTrigger value="order">Pedido</TabsTrigger>
                  <TabsTrigger value="split" className="relative">
                    Dividir
                    {currentSelectedTable && isSplitBill(currentSelectedTable) && (
                      <span className="absolute -top-1 -right-1 bg-purple-500 text-white text-xs rounded-full h-4 w-4 flex items-center justify-center">
                        ✓
                      </span>
                    )}
                  </TabsTrigger>
                </TabsList>
                <TabsContent value="order" className="mt-4 space-y-4">
                  {/* Search Bar */}
                  {setSearchQuery && (
                    <div className="relative">
                      <svg className="absolute left-3 top-2.5 h-4 w-4 text-black z-10" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                      </svg>
                      <Input
                        placeholder="Buscar productos..."
                        className="pl-10 bg-purple-50 text-purple-700 border-2 border-purple-300 rounded-lg shadow-sm hover:shadow-md hover:border-purple-600 hover:bg-purple-100 transition-all duration-200 focus:border-purple-600 focus:ring-2 focus:ring-purple-100 placeholder-purple-500"
                        value={searchQuery || ""}
                        onChange={(e) => setSearchQuery(e.target.value)}
                      />
                    </div>
                  )}
                  
                  {/* Current Order */}
                  {currentSelectedTable.currentOrder && currentSelectedTable.currentOrder.items.length > 0 ? (
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <p className="text-sm font-medium">Pedido Actual</p>
                        <Badge variant="outline">
                          {currentSelectedTable.currentOrder.items.reduce((sum, item) => sum + (Number(item.quantity) || 0), 0)} items
                        </Badge>
                      </div>

                      {/* Agrupamiento visual de productos iguales */}
                      <div className="space-y-2 max-h-60 overflow-y-auto">
                        {Object.values(
                          currentSelectedTable.currentOrder.items.reduce((acc, item) => {
                            if (!item.id) return acc;
                            const key = String(item.id);
                            if (!acc[key]) {
                              acc[key] = { ...item };
                            } else {
                              acc[key].quantity += (Number(item.quantity) || 0);
                            }
                            return acc;
                          }, {} as Record<string, typeof currentSelectedTable.currentOrder.items[0]>)
                        ).map((item, index) => (
                          <div key={item.id + '-' + index} className="flex items-center gap-2 p-2 border rounded">
                            <img
                              src={item.image || "/placeholder.svg"}
                              alt={item.name}
                              className="w-10 h-10 object-cover rounded"
                            />
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <p className="font-medium text-sm truncate">{item.name}</p>
                                {isProductCombo(item) && (
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-4 w-4 p-0 text-muted-foreground hover:text-primary transition-colors"
                                    onClick={() => toggleComboExpansion(item.id!, (item as any).combo)}
                                  >
                                    {expandedCombos.has(item.id!) ? (
                                      <ChevronUp className="h-3 w-3" />
                                    ) : (
                                      <ChevronDown className="h-3 w-3" />
                                    )}
                                  </Button>
                                )}
                                {isItemSentToAnyArea(item, currentSelectedTable) && (
                                  <div className="flex items-center gap-1 text-green-600">
                                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                                    <span className="text-xs font-medium">Enviado</span>
                                  </div>
                                )}
                              </div>
                              <p className="text-xs text-muted-foreground">{formatPrice(Number(item.sell_price_inc_tax))}</p>
                            </div>
                            <div className="flex items-center gap-1">
                              <Button
                                variant="outline"
                                size="icon"
                                className="h-6 w-6"
                                onClick={() => {
                                  updateProductQuantityInTable(currentSelectedTable.id, item.id!, (Number(item.quantity) || 0) - 1)
                                }}
                              >
                                <Minus className="h-3 w-3" />
                              </Button>
                              <span className="w-8 text-center text-sm">{Number(item.quantity) || 0}</span>
                              <Button
                                variant="outline"
                                size="icon"
                                className="h-6 w-6"
                                onClick={() => {
                                  updateProductQuantityInTable(currentSelectedTable.id, item.id!, (Number(item.quantity) || 0) + 1)
                                }}
                              >
                                <Plus className="h-3 w-3" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6 text-red-500"
                                onClick={() => removeProductFromTable(currentSelectedTable.id, item.id!)}
                              >
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            </div>
                          </div>
                        ))}
                        
                        {/* Combo products expanded view */}
                        {Object.values(
                          currentSelectedTable.currentOrder.items.reduce((acc, item) => {
                            if (!item.id) return acc;
                            const key = String(item.id);
                            if (!acc[key]) {
                              acc[key] = { ...item };
                            } else {
                              acc[key].quantity += (Number(item.quantity) || 0);
                            }
                            return acc;
                          }, {} as Record<string, typeof currentSelectedTable.currentOrder.items[0]>)
                        ).map((item, index) => (
                          isProductCombo(item) && expandedCombos.has(item.id!) && (
                            <div key={`combo-${item.id}-${index}`} className="ml-4 mt-2 p-2 bg-gray-50 rounded border-l-2 border-primary/30">
                              <div className="space-y-1">
                                <h4 className="text-xs font-medium text-muted-foreground mb-2">Productos incluidos:</h4>
                                {comboProducts[item.id!] ? (
                                  comboProducts[item.id!].map((comboProduct: any, comboIndex: number) => (
                                    <div key={comboIndex} className="flex items-center gap-2 pl-2">
                                      <div className="w-2 h-2 bg-primary/30 rounded-full"></div>
                                      <span className="text-xs text-muted-foreground">
                                        {comboProduct.name}
                                      </span>
                                    </div>
                                  ))
                                ) : (
                                  <div className="flex items-center justify-center py-2">
                                    <div className="w-4 h-4 border-2 border-primary/20 border-t-primary rounded-full animate-spin"></div>
                                    <span className="text-xs text-muted-foreground ml-2">Cargando productos...</span>
                                  </div>
                                )}
                              </div>
                            </div>
                          )
                        ))}
                      </div>

                      <Separator className="my-3" />

                      <div className="flex justify-between items-center font-bold">
                        <span>Total:</span>
                        <span>{formatPrice(Number(currentSelectedTable.currentOrder.total || 0))}</span>
                      </div>

                      <div className="space-y-2 mt-4">
                        <div className="flex gap-2">
                          <Button
                            className="flex-1"
                            onClick={() => currentSelectedTable && handleCheckoutTable(currentSelectedTable)}
                            disabled={!currentSelectedTable || isSplitBill(currentSelectedTable)}
                          >
                            <Receipt className="h-4 w-4 mr-2" />
                            {currentSelectedTable && isSplitBill(currentSelectedTable) ? "Cuenta Dividida" : "Facturar"}
                          </Button>
                          <Button variant="outline" onClick={() => currentSelectedTable && clearTableOrder(currentSelectedTable.id)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                        <Button 
                          variant="outline"
                          onClick={() => currentSelectedTable && handleSendAllOrders(currentSelectedTable)}
                          disabled={!currentSelectedTable || !currentSelectedTable.currentOrder || currentSelectedTable.currentOrder.items.length === 0}
                          className="w-full bg-green-50 text-green-700 border-green-200 hover:bg-green-100"
                        >
                          <Send className="h-4 w-4 mr-2" />
                          Realizar Pedido
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center py-10 text-muted-foreground">
                      <ShoppingCart className="h-10 w-10 mb-2 text-primary/40" />
                      <p className="font-semibold text-lg">No hay productos en esta mesa</p>
                    </div>
                  )}

                  {/* Table Status Controls */}
                  <div className="space-y-2 pt-6">
                    <p className="text-sm text-muted-foreground font-semibold mb-1 flex items-center gap-2">
                      <Settings className="h-4 w-4 text-primary/60" /> Cambiar Estado
                    </p>
                    <div className="grid grid-cols-2 gap-2">
                      <Button
                        variant={currentSelectedTable?.status === "available" ? "default" : "outline"}
                        size="sm"
                        className="rounded-lg flex items-center gap-2 border border-green-200 bg-green-50 text-green-800 hover:bg-green-100"
                        onClick={() => currentSelectedTable && updateTableStatus(currentSelectedTable.id, "available")}
                      >
                        <Circle className="h-3 w-3 text-green-500" /> Libre
                      </Button>
                      <Button
                        variant={currentSelectedTable?.status === "reserved" ? "default" : "outline"}
                        size="sm"
                        className="rounded-lg flex items-center gap-2 border border-yellow-200 bg-yellow-50 text-yellow-800 hover:bg-yellow-100"
                        onClick={() => currentSelectedTable && updateTableStatus(currentSelectedTable.id, "reserved")}
                      >
                        <Circle className="h-3 w-3 text-yellow-400" /> Reservada
                      </Button>
                      <Button
                        variant={currentSelectedTable?.status === "needs-cleaning" ? "default" : "outline"}
                        size="sm"
                        className="rounded-lg flex items-center gap-2 border border-gray-200 bg-gray-50 text-gray-700 hover:bg-gray-100 col-span-2"
                        onClick={() => currentSelectedTable && updateTableStatus(currentSelectedTable.id, "needs-cleaning")}
                      >
                        <Hand className="h-3 w-3 text-gray-400" /> Necesita Limpieza
                      </Button>
                    </div>
                  </div>
                  {/* Waiter Assignment */}
                  <div className="space-y-2 pt-6">
                    <p className="text-sm text-muted-foreground font-semibold mb-1 flex items-center gap-2">
                      <User className="h-4 w-4 text-primary/60" /> Asignar Mesero
                    </p>
                    <div className="flex gap-2">
                      <Input
                        placeholder="Nombre del mesero"
                        value={waiterName}
                        onChange={(e) => setWaiterName(e.target.value)}
                        className="flex-1 rounded-lg border-primary/20"
                      />
                      <Button
                        size="sm"
                        className="rounded-lg bg-primary/80 text-white hover:bg-primary flex items-center gap-1"
                        onClick={() => {
                          if (waiterName.trim() && currentSelectedTable) {
                            assignWaiterToTable(currentSelectedTable.id, waiterName.trim())
                            setWaiterName("")
                          }
                        }}
                        disabled={!waiterName.trim()}
                      >
                        <User className="h-4 w-4 mr-1" /> Asignar
                      </Button>
                    </div>
                    {currentSelectedTable?.assignedWaiter && (
                      <div className="flex items-center gap-2 text-sm mt-1 bg-primary/5 rounded px-2 py-1">
                        <User className="h-4 w-4 text-primary" />
                        <span className="font-medium text-primary">Mesero: {currentSelectedTable.assignedWaiter}</span>
                      </div>
                    )}
                  </div>
                </TabsContent>
                <TabsContent value="split" className="mt-4">
                  {currentSelectedTable && <SplitBill table={currentSelectedTable} />}
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
