"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { ArrowLeft, CreditCard, Wallet, Receipt } from "lucide-react"

import { Button } from "../../components/ui/button"
import { RadioGroup, RadioGroupItem } from "../../components/ui/radio-group"
import { Label } from "../../components/ui/label"
import { Separator } from "../../components/ui/separator"
import { useTables } from "../context/table-context"
import { useCart } from "../context/cart-context"
import { useComandas } from "../context/comandas-context"
import { formatPrice } from "../../lib/format-price"
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

// Helper function to get propina info from location
const getPropinaInfo = async (locationId: number): Promise<{ porcentaje: number; monto: number } | null> => {
  try {
    const token = localStorage.getItem('token')
    if (!token) return null
    
    const response = await fetch('/api/business-locations', {
      headers: { 'Authorization': `Bearer ${token}` }
    })
    
    if (!response.ok) return null
    
    const data = await response.json()
    const location = data.locations?.find((loc: any) => loc.id === locationId)
    
    if (!location || !location.propina || location.propina <= 0) return null
    
    return {
      porcentaje: location.propina,
      monto: 0 // Se calculará en el componente
    }
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
  const [propinaInfo, setPropinaInfo] = useState<{ porcentaje: number; monto: number } | null>(null)

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

    // Cargar información de propina de la ubicación
    const loadPropinaInfo = async () => {
      const businessLocation = localStorage.getItem('selectedLocation')
      if (businessLocation) {
        try {
          const location = JSON.parse(businessLocation)
          const propina = await getPropinaInfo(location.id)
          setPropinaInfo(propina)
        } catch (error) {
          console.error("Error loading propina info:", error)
        }
      }
    }
    
    loadPropinaInfo()

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
  const propinaMonto = propinaInfo ? +(tempOrder.total * (propinaInfo.porcentaje / 100)).toFixed(2) : 0
  const grandTotal = tempOrder.total + propinaMonto // El total ya incluye impuestos + propina

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
          const produccionItems = tempOrder.items.map(item => ({ ...item, status: 'completed' as const }));
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
          propina: propinaInfo ? {
            porcentaje: propinaInfo.porcentaje,
            monto: propinaMonto
          } : undefined,
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
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto max-w-4xl py-8 px-4">
        {/* Header simplificado */}
        <div className="mb-8">
          <Button 
            variant="ghost" 
            className="mb-6 text-gray-600 hover:text-gray-900 hover:bg-gray-100" 
            onClick={() => router.push(fromCart ? "/pos" : "/tables")}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            {fromCart ? "Volver a POS" : "Volver a Mesas"}
          </Button>

          <div className="mb-8">
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-3xl font-semibold text-gray-900">
                {isEditing ? "Editar Factura" : "Facturación"}
              </h1>
              {isEditing && (
                <span className="text-sm bg-gray-100 text-gray-700 px-3 py-1 rounded-md font-medium">
                  #{editingTransaction?.invoice_no}
                </span>
              )}
            </div>
            <p className="text-gray-600">
              {isEditing ? "Editando factura existente" : fromCart ? "Pedido POS (sin mesa)" : `Mesa ${tempOrder.tableNumber}`}
            </p>
          </div>
        </div>

        <div className="grid gap-8 lg:grid-cols-2">
          {/* Resumen del Pedido Simplificado */}
          <div>
            <h2 className="text-xl font-semibold text-gray-900 mb-6">Resumen del Pedido</h2>
            
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              {/* Lista de productos simplificada */}
              <div className="space-y-4 mb-6">
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
                  <div key={item.id + '-' + index} className="flex items-center gap-4 py-3">
                    <img
                      src={item.image || "/placeholder.svg"}
                      alt={item.name}
                      className="w-12 h-12 object-cover rounded-lg"
                    />
                    <div className="flex-1">
                      <h3 className="font-medium text-gray-900">{item.name}</h3>
                      <p className="text-sm text-gray-500">
                        {formatPrice(Number(item.price) || 0)} × {item.quantity}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-gray-900">
                        {formatPrice((Number(item.price) || 0) * item.quantity)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Resumen de costos simplificado */}
              <div className="border-t border-gray-200 pt-4">
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Subtotal</span>
                    <span className="font-medium">{formatPrice(tempOrder.total)}</span>
                  </div>
                  
                  {propinaInfo && propinaInfo.porcentaje > 0 && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">
                        Propina ({propinaInfo.porcentaje}%)
                      </span>
                      <span className="font-medium">{formatPrice(propinaMonto)}</span>
                    </div>
                  )}
                  
                  <div className="border-t border-gray-200 pt-3">
                    <div className="flex justify-between">
                      <span className="text-lg font-semibold text-gray-900">Total</span>
                      <span className="text-lg font-semibold text-gray-900">
                        {formatPrice(grandTotal)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Métodos de Pago Simplificados */}
          <div>
            <h2 className="text-xl font-semibold text-gray-900 mb-6">Método de Pago</h2>
            
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <RadioGroup value={paymentMethod} onValueChange={setPaymentMethod} className="space-y-3">
                {/* Tarjeta */}
                <div className="flex items-center space-x-3 p-3 rounded-lg border border-gray-200 hover:border-gray-300 hover:bg-gray-50 transition-colors">
                  <RadioGroupItem value="card" id="card" />
                  <CreditCard className="h-5 w-5 text-gray-600" />
                  <Label htmlFor="card" className="flex-1 cursor-pointer">
                    Tarjeta Débito/Crédito
                  </Label>
                </div>

                {/* Efectivo */}
                <div className="flex items-center space-x-3 p-3 rounded-lg border border-gray-200 hover:border-gray-300 hover:bg-gray-50 transition-colors">
                  <RadioGroupItem value="cash" id="cash" />
                  <Wallet className="h-5 w-5 text-gray-600" />
                  <Label htmlFor="cash" className="flex-1 cursor-pointer">
                    Efectivo
                  </Label>
                </div>

                {/* Nequi */}
                <div className="flex items-center space-x-3 p-3 rounded-lg border border-gray-200 hover:border-gray-300 hover:bg-gray-50 transition-colors">
                  <RadioGroupItem value="nequi" id="nequi" />
                  <div className="w-5 h-5 bg-purple-600 rounded"></div>
                  <Label htmlFor="nequi" className="flex-1 cursor-pointer">
                    Nequi
                  </Label>
                </div>

                {/* Bancolombia */}
                <div className="flex items-center space-x-3 p-3 rounded-lg border border-gray-200 hover:border-gray-300 hover:bg-gray-50 transition-colors">
                  <RadioGroupItem value="bancolombia" id="bancolombia" />
                  <div className="w-5 h-5 bg-yellow-500 rounded"></div>
                  <Label htmlFor="bancolombia" className="flex-1 cursor-pointer">
                    Bancolombia
                  </Label>
                </div>

                {/* Daviplata */}
                <div className="flex items-center space-x-3 p-3 rounded-lg border border-gray-200 hover:border-gray-300 hover:bg-gray-50 transition-colors">
                  <RadioGroupItem value="daviplata" id="daviplata" />
                  <div className="w-5 h-5 bg-orange-500 rounded"></div>
                  <Label htmlFor="daviplata" className="flex-1 cursor-pointer">
                    Daviplata
                  </Label>
                </div>

                {/* Transferencia Bancaria */}
                <div className="flex items-center space-x-3 p-3 rounded-lg border border-gray-200 hover:border-gray-300 hover:bg-gray-50 transition-colors">
                  <RadioGroupItem value="transferencia" id="transferencia" />
                  <div className="w-5 h-5 bg-blue-500 rounded"></div>
                  <Label htmlFor="transferencia" className="flex-1 cursor-pointer">
                    Transferencia Bancaria
                  </Label>
                </div>

                {/* Addi */}
                <div className="flex items-center space-x-3 p-3 rounded-lg border border-gray-200 hover:border-gray-300 hover:bg-gray-50 transition-colors">
                  <RadioGroupItem value="addi" id="addi" />
                  <div className="w-5 h-5 bg-pink-500 rounded"></div>
                  <Label htmlFor="addi" className="flex-1 cursor-pointer">
                    Addi (Crédito)
                  </Label>
                </div>

                {/* Sistecredito */}
                <div className="flex items-center space-x-3 p-3 rounded-lg border border-gray-200 hover:border-gray-300 hover:bg-gray-50 transition-colors">
                  <RadioGroupItem value="sistecredito" id="sistecredito" />
                  <div className="w-5 h-5 bg-red-500 rounded"></div>
                  <Label htmlFor="sistecredito" className="flex-1 cursor-pointer">
                    Sistecredito
                  </Label>
                </div>
              </RadioGroup>

              {/* Botón de pago simplificado */}
              <div className="mt-8">
                <Button 
                  className="w-full h-12 text-base font-medium bg-gray-900 hover:bg-gray-800 text-white" 
                  size="lg" 
                  onClick={handlePayment}
                >
                  {isEditing ? "Actualizar Factura" : "Procesar Pago"} - {formatPrice(grandTotal)}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
