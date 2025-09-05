"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { ArrowLeft, CreditCard, Wallet, Receipt } from "lucide-react"

import { Button } from "@/components/ui/button"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { useTables } from "../context/table-context"
import { useCart } from "../context/cart-context"
import { useComandas } from "../context/comandas-context"
import { formatPrice } from "@/lib/format-price"
import { jwtDecode } from "jwt-decode"

interface TempOrder {
  tableId: number
  tableNumber: number
  items: Array<{ id: number; name: string; price: number; quantity: number; image: string; order_area_id?: number | null }>
  total: number
}

// ID de cliente POS genérico, AJUSTA este valor según tu base de datos
const CONTACT_ID_POS = 11405;

// Helper function to get business_id from token
const getBusinessIdFromToken = (): number | null => {
  try {
    const token = localStorage.getItem('token')
    if (!token) return null
    const decoded: any = jwtDecode(token)
    return decoded.business_id || null
  } catch {
    return null
  }
}

// Helper function to get default client for current business
const getDefaultClientId = async (): Promise<number | null> => {
  try {
    const token = localStorage.getItem('token')
    if (!token) return null
    
    const response = await fetch('/api/clients?default=1', {
      headers: { 'Authorization': `Bearer ${token}` }
    })
    
    if (!response.ok) return null
    
    const clients = await response.json()
    if (!Array.isArray(clients) || clients.length === 0) return null
    
    return clients[0].id
  } catch {
    return null
  }
}

export default function TableCheckoutPage() {
  const router = useRouter()
  const { completeTableOrder, clearTableOrder } = useTables()
  const { cart, cartTotal, clearCart } = useCart()
  const { addComanda, moveToProduccion } = useComandas();
  const [paymentMethod, setPaymentMethod] = useState("card")
  const [tempOrder, setTempOrder] = useState<TempOrder | null>(null)
  const [fromCart, setFromCart] = useState(false)
  const [selectedClient, setSelectedClient] = useState<{ id: number; name: string } | null>(null)
  const [isEditing, setIsEditing] = useState(false)
  const [editingTransaction, setEditingTransaction] = useState<any>(null)

  useEffect(() => {
    // Verificar si estamos editando una factura
    const editingTransactionData = localStorage.getItem('editingTransaction')
    if (editingTransactionData) {
      try {
        const transaction = JSON.parse(editingTransactionData)
        setIsEditing(true)
        setEditingTransaction(transaction)
        console.log('🔄 Modo edición activado para factura:', transaction.id)
      } catch (error) {
        console.error("Error parsing editing transaction:", error)
      }
    }

    // Obtener el cliente seleccionado del localStorage
    const savedClient = localStorage.getItem('selectedClient')
    if (savedClient) {
      try {
        setSelectedClient(JSON.parse(savedClient))
      } catch (error) {
        console.error("Error parsing selected client:", error)
      }
    }

    // Forzar recarga del carrito si el contexto está vacío pero localStorage tiene productos
    if (cart.length === 0) {
      const savedCart = localStorage.getItem("cart")
      if (savedCart) {
        try {
          const parsedCart = JSON.parse(savedCart)
          if (Array.isArray(parsedCart) && parsedCart.length > 0) {
            setFromCart(true)
            setTempOrder({
              tableId: 0,
              tableNumber: 0,
              items: parsedCart.map(item => ({
                id: item.id,
                name: item.name,
                price: item.sell_price_inc_tax,
                quantity: item.quantity,
                image: item.image || "",
                order_area_id: item.order_area_id || null
              })),
              total: parsedCart.reduce((total, item) => total + item.sell_price_inc_tax * item.quantity, 0)
            })
            return
          }
        } catch (e) { /* ignorar */ }
      }
    }
    console.log('Contenido del carrito (cart):', cart)
    console.log('Contenido de temp-checkout-order:', localStorage.getItem("temp-checkout-order"))
    const savedOrder = localStorage.getItem("temp-checkout-order")
    if (savedOrder) {
      try {
        const parsedOrder = JSON.parse(savedOrder)
        
        // Si el tableId es 0, significa que viene del carrito del POS
        if (parsedOrder.tableId === 0) {
          setFromCart(true)
          console.log('✅ Detectado pedido desde POS (tableId = 0)')
        }
        
        setTempOrder(parsedOrder)
      } catch (error) {
        console.error("Error parsing temp order:", error)
        router.push("/tables")
      }
    } else if (cart.length > 0) {
      // Si no hay pedido de mesa pero sí hay carrito global, usarlo
      setFromCart(true)
      setTempOrder({
        tableId: 0,
        tableNumber: 0,
        items: cart.map(item => ({
          id: item.id!,
          name: item.name,
          price: item.sell_price_inc_tax !== undefined ? item.sell_price_inc_tax : 0,
          quantity: item.quantity,
          image: item.image || "",
          order_area_id: item.order_area_id || null
        })),
        total: cart.reduce((total, item) => total + (item.sell_price_inc_tax !== undefined ? item.sell_price_inc_tax : 0) * item.quantity, 0)
      })
    } else {
      // Mostrar mensaje en vez de redirigir
      setTempOrder(null)
    }
  }, [router, cart, cartTotal])

  if (!tempOrder) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold">No hay productos en el carrito</h1>
          <p className="mt-2 text-muted-foreground">Agrega productos en el POS antes de facturar.</p>
          <Button className="mt-4" onClick={() => router.push("/pos")}>Ir al POS</Button>
        </div>
      </div>
    )
  }

  const tax = 0 // Los productos ya tienen impuesto incluido
  const grandTotal = tempOrder.total // El total ya incluye impuestos

  const handlePayment = async () => {
    try {
      // Get current business location
      const businessLocation = localStorage.getItem('selectedLocation')
      if (!businessLocation) {
        alert('Error: No se ha seleccionado una ubicación de negocio')
        return
      }

      const location = JSON.parse(businessLocation)
      const token = localStorage.getItem('token')
      if (!token) {
        alert('Error: No se ha encontrado el token de autenticación')
        return
      }

      // Verificar si estamos editando una factura existente
      const editingTransaction = localStorage.getItem('editingTransaction')
      let isEditing = false
      let existingTransactionId = null
      let existingInvoiceNo = null

      if (editingTransaction) {
        try {
          const transaction = JSON.parse(editingTransaction)
          isEditing = true
          existingTransactionId = transaction.id
          existingInvoiceNo = transaction.invoice_no
          console.log('🔄 Editando factura existente:', transaction.id, transaction.invoice_no)
        } catch (error) {
          console.error('Error parsing editingTransaction:', error)
        }
      }

      let transactionResult: any
      let receiptNumber

      if (isEditing && existingTransactionId) {
        // Actualizar factura existente
        console.log('🔄 Actualizando factura existente:', existingTransactionId)
        
        const updateData = {
          final_total: grandTotal,
          payment_status: 'paid',
          items: tempOrder.items
        }

        const transactionResponse = await fetch(`/api/transactions/${existingTransactionId}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify(updateData),
        })

        if (!transactionResponse.ok) {
          const errorData = await transactionResponse.json();
          throw new Error('Error actualizando transacción: ' + (errorData.error || ''))
        }

        transactionResult = await transactionResponse.json()
        receiptNumber = existingInvoiceNo
        console.log('✅ Factura actualizada exitosamente')

      } else {
        // Crear nueva factura
        console.log('🆕 Creando nueva factura')
        
        // 1. Reserva y obtiene el número de factura ÚNICO
        const reserveResponse = await fetch(`/api/invoice-number`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            location_id: location.id
          }),
        })

        if (!reserveResponse.ok) {
          throw new Error('Error reservando número de factura')
        }

        const reserveData = await reserveResponse.json()

        // 2. Create transaction in database
        const transactionData = {
          location_id: location.id,
          contact_id: selectedClient?.id || await getDefaultClientId() || 11405, // Fallback a cliente genérico
          invoice_number: Number(reserveData.reserved_number),
          prefix: reserveData.prefix || "POSE",
          final_total: grandTotal,
          custom_fields: { payment_method: paymentMethod },
          res_table_id: tempOrder.tableId > 0 ? tempOrder.tableId : null,
          items: tempOrder.items
        }
        
        // Validación y log
        console.log('transactionData a enviar:', transactionData)
        if (!transactionData.location_id || !transactionData.contact_id || transactionData.invoice_number === undefined || !transactionData.prefix || transactionData.final_total === undefined) {
          alert('Faltan datos para la transacción: ' + JSON.stringify(transactionData))
          return
        }

        const transactionResponse = await fetch('/api/transactions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify(transactionData),
        })

        if (!transactionResponse.ok) {
          const errorData = await transactionResponse.json();
          throw new Error('Error creando transacción en base de datos: ' + (errorData.error || ''))
        }

        transactionResult = await transactionResponse.json()
        receiptNumber = `${reserveData.prefix}${reserveData.reserved_number}`
        console.log('✅ Nueva factura creada exitosamente')

        // === AGREGAR COMANDA AUTOMÁTICAMENTE ===
        const usaComandas = localStorage.getItem('usaComandas') !== 'false';
        // Solo crear comanda automática si es POS (tableId === 0) Y usaComandas está activado
        if (usaComandas && tempOrder.tableId === 0) {
          // Obtener nombres de áreas
          let areaMap: Record<string, string> = {};
          try {
            const resAreas = await fetch('/api/order-areas');
            if (resAreas.ok) {
              const dataAreas = await resAreas.json();
              if (dataAreas.success && Array.isArray(dataAreas.data)) {
                areaMap = Object.fromEntries(dataAreas.data.map((a: any) => [String(a.id), a.name]));
              }
            }
          } catch {}
          const productosPorArea: Record<string, any[]> = {};
          tempOrder.items.forEach((item) => {
            const areaId = item.order_area_id ? String(item.order_area_id) : null;
            const areaName = areaId && areaMap[areaId] ? areaMap[areaId] : "General";
            if (!productosPorArea[areaName]) productosPorArea[areaName] = [];
            productosPorArea[areaName].push({ ...item, status: 'pending' });
          });
          Object.entries(productosPorArea).forEach(([area, items]) => {
            const comandaId = `factura-${transactionResult.id || Date.now()}-${area}`;
            // Evitar duplicados: buscar si ya existe una comanda con este id
            const businessId = getBusinessIdFromToken()
            const comandasKey = businessId ? `restaurante-comandas-${businessId}` : 'restaurante-comandas'
            const existingComandas = JSON.parse(localStorage.getItem(comandasKey) || '[]');
            if (existingComandas.some((c: any) => c.id === comandaId)) return;
            const comanda = {
              id: comandaId,
              tableNumber: tempOrder.tableNumber ? String(tempOrder.tableNumber) : "POS",
              tableId: tempOrder.tableId ? String(tempOrder.tableId) : "POS",
              waiter: "POS",
              items: items,
              createdAt: new Date(),
              status: "pending" as const,
              area: area,
              estimatedTime: items.reduce((acc, item) => acc + (item.quantity || 1) * 5, 0)
            };
            addComanda(comanda);
          });
        } else if (!usaComandas) {
          // Si NO se usan comandas, subir todo a producción como registro
          const produccionItems = tempOrder.items.map(item => ({ ...item, status: 'completed' }));
          const produccionObj = {
            id: `prod-factura-${transactionResult.id || Date.now()}`,
            comandaId: null,
            tableNumber: tempOrder.tableNumber ? String(tempOrder.tableNumber) : "POS",
            tableId: tempOrder.tableId ? String(tempOrder.tableId) : "POS",
            waiter: "POS",
            items: produccionItems,
            createdAt: new Date(),
            completedAt: new Date(),
            status: "completed" as const,
            area: "General",
            estimatedTime: produccionItems.reduce((acc, item) => acc + (item.quantity || 1) * 5, 0),
            hasRecipe: false
          };
          moveToProduccion(produccionObj);
        }
        // === FIN AGREGAR COMANDA / PRODUCCIÓN ===
      }

      // Registrar el pago en transaction_payments
      await fetch('/api/transaction-payments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          transaction_id: transactionResult.id || transactionResult.transaction_id || existingTransactionId,
          method: paymentMethod,
          amount: grandTotal
        })
      })

      // Complete the order
      completeTableOrder(tempOrder.tableId)

      // Limpiar comandas de la mesa después de facturar
      console.log('🧹 Verificando si se deben limpiar comandas...')
      console.log('🧹 tempOrder.tableId:', tempOrder.tableId)
      console.log('🧹 fromCart:', fromCart)
      console.log('🧹 Condición:', tempOrder.tableId && !fromCart)
      
      if (tempOrder.tableId && !fromCart) {
        try {
          console.log('🧹 Limpiando comandas para mesa:', tempOrder.tableId, 'tipo:', typeof tempOrder.tableId)
          const response = await fetch(`/api/comandas?mesa_id=${tempOrder.tableId}`, {
            method: 'DELETE',
            headers: {
              'Authorization': `Bearer ${token}`
            }
          })
          
          if (response.ok) {
            const result = await response.json()
            console.log('✅ Comandas de la mesa eliminadas después de facturar:', result)
          } else {
            const errorData = await response.json()
            console.error('❌ Error en respuesta de API:', response.status, errorData)
          }
        } catch (error) {
          console.error('❌ Error eliminando comandas:', error)
        }
      } else {
        console.log('🧹 No se limpiaron comandas - tableId:', tempOrder.tableId, 'fromCart:', fromCart)
      }

      // Store receipt data with real invoice number
      localStorage.setItem(
        "table-receipt",
        JSON.stringify({
          ...tempOrder,
          tax,
          grandTotal,
          paymentMethod,
          receiptNumber: receiptNumber,
          date: new Date().toLocaleString(),
          transactionId: transactionResult?.id || existingTransactionId,
          fromCart: fromCart, // Agregar información del origen
        }),
      )

      // Clear temp order and editing transaction
      localStorage.removeItem("temp-checkout-order")
      localStorage.removeItem("editingTransaction")
      
      // Limpiar carrito global si es pedido POS
      if (fromCart) {
        clearCart()
      }

      // Redirect to success page
      router.push("/table-success")

    } catch (error) {
      console.error('Error processing payment:', error)
      alert(`Error procesando el pago: ${error instanceof Error ? error.message : 'Error desconocido'}`)
    }
  }

  return (
    <div className="container mx-auto max-w-4xl py-8">
      <Button variant="ghost" className="mb-6" onClick={() => router.push("/tables")}>
        <ArrowLeft className="mr-2 h-4 w-4" />
        Volver a Mesas
      </Button>

      <div className="flex items-center gap-4 mb-6">
        <Receipt className="h-8 w-8" />
        <div>
          <h1 className="text-3xl font-bold">
            {isEditing ? "Editar Factura" : "Facturación"}
            {isEditing && (
              <span className="ml-2 text-sm bg-blue-100 text-blue-800 px-2 py-1 rounded">
                #{editingTransaction?.invoice_no}
              </span>
            )}
          </h1>
          {isEditing ? (
            <p className="text-muted-foreground">Editando factura existente</p>
          ) : fromCart ? (
            <p className="text-muted-foreground">Pedido POS (sin mesa)</p>
          ) : (
            <p className="text-muted-foreground">Mesa {tempOrder.tableNumber}</p>
          )}
        </div>
      </div>

      <div className="grid gap-8 md:grid-cols-2">
        <div>
          <h2 className="mb-4 text-xl font-semibold">Resumen del Pedido</h2>
          <div className="rounded-lg border p-4 bg-white">
            {/* Agrupar productos iguales para la visualización */}
            {Object.values(
              tempOrder.items.reduce((acc, item) => {
                if (!item.id) return acc;
                const key = String(item.id);
                if (!acc[key]) {
                  acc[key] = { ...item };
                } else {
                  acc[key].quantity += item.quantity;
                }
                return acc;
              }, {} as Record<string, typeof tempOrder.items[0]>)
            ).map((item, index) => (
              <div key={item.id + '-' + index} className="mb-3 flex items-center gap-3">
                <img
                  src={item.image || "/placeholder.svg"}
                  alt={item.name}
                  className="w-12 h-12 object-cover rounded border"
                />
                <div className="flex-1">
                  <p className="font-medium">{item.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {formatPrice(Number(item.price) || 0)} × {item.quantity}
                  </p>
                </div>
                <p className="font-medium">{formatPrice((Number(item.price) || 0) * item.quantity)}</p>
              </div>
            ))}

            <Separator className="my-4" />

            <div className="space-y-2">
              <div className="flex justify-between font-bold text-lg">
                <p>Total</p>
                <p>{formatPrice(grandTotal)}</p>
              </div>
            </div>
          </div>
        </div>

        <div>
          <h2 className="mb-4 text-xl font-semibold">Método de Pago</h2>
          <div className="rounded-lg border p-4 bg-white">
            <RadioGroup value={paymentMethod} onValueChange={setPaymentMethod}>
              <div className="flex items-center space-x-2 rounded-md border p-3">
                <RadioGroupItem value="card" id="card" />
                <Label htmlFor="card" className="flex items-center">
                  <CreditCard className="mr-2 h-4 w-4" />
                  Tarjeta Débito/Crédito
                </Label>
              </div>

              <div className="mt-3 flex items-center space-x-2 rounded-md border p-3">
                <RadioGroupItem value="cash" id="cash" />
                <Label htmlFor="cash" className="flex items-center">
                  <Wallet className="mr-2 h-4 w-4" />
                  Efectivo
                </Label>
              </div>

              <div className="mt-3 flex items-center space-x-2 rounded-md border p-3 bg-green-50">
                <RadioGroupItem value="nequi" id="nequi" />
                <Label htmlFor="nequi" className="flex items-center">
                  <div className="w-4 h-4 bg-purple-600 rounded mr-2"></div>
                  Nequi
                </Label>
              </div>

              <div className="mt-3 flex items-center space-x-2 rounded-md border p-3 bg-yellow-50">
                <RadioGroupItem value="bancolombia" id="bancolombia" />
                <Label htmlFor="bancolombia" className="flex items-center">
                  <div className="w-4 h-4 bg-yellow-500 rounded mr-2"></div>
                  Bancolombia
                </Label>
              </div>

              <div className="mt-3 flex items-center space-x-2 rounded-md border p-3 bg-orange-50">
                <RadioGroupItem value="daviplata" id="daviplata" />
                <Label htmlFor="daviplata" className="flex items-center">
                  <div className="w-4 h-4 bg-orange-500 rounded mr-2"></div>
                  Daviplata
                </Label>
              </div>

              <div className="mt-3 flex items-center space-x-2 rounded-md border p-3 bg-blue-50">
                <RadioGroupItem value="transferencia" id="transferencia" />
                <Label htmlFor="transferencia" className="flex items-center">
                  <div className="w-4 h-4 bg-blue-500 rounded mr-2"></div>
                  Transferencia Bancaria
                </Label>
              </div>

              <div className="mt-3 flex items-center space-x-2 rounded-md border p-3 bg-pink-50">
                <RadioGroupItem value="addi" id="addi" />
                <Label htmlFor="addi" className="flex items-center">
                  <div className="w-4 h-4 bg-pink-500 rounded mr-2"></div>
                  Addi (Crédito)
                </Label>
              </div>

              <div className="mt-3 flex items-center space-x-2 rounded-md border p-3 bg-red-50">
                <RadioGroupItem value="sistecredito" id="sistecredito" />
                <Label htmlFor="sistecredito" className="flex items-center">
                  <div className="w-4 h-4 bg-red-500 rounded mr-2"></div>
                  Sistecredito
                </Label>
              </div>
            </RadioGroup>

            <Button className="mt-6 w-full" size="lg" onClick={handlePayment}>
              {isEditing ? "Actualizar Factura" : "Procesar Pago"} - {formatPrice(grandTotal)}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
