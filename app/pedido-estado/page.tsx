"use client"

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card'
import { Badge } from '../../components/ui/badge'
import { Button } from '../../components/ui/button'
import { Clock, CheckCircle, Loader2, AlertCircle, Plus, Minus, ShoppingCart, Menu, Search } from 'lucide-react'
import { jwtDecode } from 'jwt-decode'

interface PedidoItem {
  id: number
  name: string
  quantity: number
  price: number
  status: string
  image?: string
}

interface Pedido {
  id: string
  items: PedidoItem[]
  total: number
  status: string
  createdAt: string
  updatedAt: string
}

interface Product {
  id: number
  name: string
  sku: string
  sell_price_inc_tax: number
  image?: string
  product_description?: string
  category_name?: string
}

interface CartItem {
  id: number
  name: string
  price: number
  quantity: number
  image?: string
}

export default function PedidoEstadoPage() {
  const [pedido, setPedido] = useState<Pedido | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showMenu, setShowMenu] = useState(false)
  const [allProducts, setAllProducts] = useState<Product[]>([])
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [cart, setCart] = useState<CartItem[]>([])
  const [showCart, setShowCart] = useState(false)
  const [businessId, setBusinessId] = useState<number | null>(null)
  const [menuLoading, setMenuLoading] = useState(false)

  // Obtener mesa_id de la URL
  const getMesaId = () => {
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search)
      return urlParams.get('mesa')
    }
    return null
  }

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

  const fetchBusinessId = async (mesaId: string) => {
    try {
      const response = await fetch(`/api/mesa-business?mesa_id=${mesaId}`)
      const data = await response.json()

      if (data.success) {
        setBusinessId(data.business_id)
        return data.business_id
      } else {
        console.error('Error obteniendo business_id:', data.message)
        return null
      }
    } catch (err) {
      console.error('Error fetching business_id:', err)
      return null
    }
  }

  const fetchProducts = async (businessId: number) => {
    setMenuLoading(true)
    try {
      const response = await fetch(`/api/products/public?businessId=${businessId}&pageSize=1000`)
      const data = await response.json()

      if (data.products) {
        // Eliminar productos duplicados por ID
        const uniqueProducts = data.products.filter((product: Product, index: number, self: Product[]) => 
          index === self.findIndex(p => p.id === product.id)
        )
        setAllProducts(uniqueProducts)
        setFilteredProducts(uniqueProducts)
      } else {
        setAllProducts([])
        setFilteredProducts([])
      }
    } catch (err) {
      console.error('Error fetching products:', err)
      setAllProducts([])
      setFilteredProducts([])
    } finally {
      setMenuLoading(false)
    }
  }

  const fetchPedidoEstado = async () => {
    const mesaId = getMesaId()
    if (!mesaId) {
      setError('No se especificó mesa')
      setLoading(false)
      return
    }

      try {
        const response = await fetch(`/api/pedido-estado?mesa=${mesaId}`)
        const data = await response.json()

      if (data.success && data.data) {
        // Sincronizar el estado de las comandas con la orden de la mesa
        const businessIdFromToken = getBusinessIdFromToken()
        if (businessIdFromToken) {
          const tablesKey = `restaurant-tables-db-${businessIdFromToken}`
          const existingTables = localStorage.getItem(tablesKey)
          if (existingTables) {
            try {
              const tables = JSON.parse(existingTables)
              const existingTable = tables.find((table: any) => table.id === parseInt(mesaId))
              if (existingTable && existingTable.currentOrder) {
                // Obtener el estado real de las comandas desde la BD
                console.log('🔄 Sincronizando estado de comandas para mesa:', mesaId)
                console.log('🔑 Token usado:', localStorage.getItem('token')?.substring(0, 20) + '...')
                
                const comandasResponse = await fetch(`/api/comandas?mesa_id=${mesaId}`, {
                  headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                  }
                })
                
                console.log('📡 Respuesta de comandas:', comandasResponse.status, comandasResponse.ok)
                
                if (comandasResponse.ok) {
                  const comandasData = await comandasResponse.json()
                  console.log('📋 Comandas obtenidas:', comandasData)
                  console.log('📋 Estructura de comandas:', JSON.stringify(comandasData, null, 2))
                  
                  // Crear un mapa de productos que están en comandas
                  const productosEnComandas = new Set()
                  console.log('🔍 Estructura de comandas.data:', comandasData.data)
                  console.log('🔍 Tipo de comandas.data:', typeof comandasData.data)
                  console.log('🔍 Es array:', Array.isArray(comandasData.data))
                  
                  if (comandasData.data && Array.isArray(comandasData.data)) {
                    comandasData.data.forEach((comanda: any) => {
                      console.log('🔍 Comanda individual:', comanda)
                      if (comanda.items && Array.isArray(comanda.items)) {
                        comanda.items.forEach((item: any) => {
                          console.log('🔍 Item en comanda:', item)
                          productosEnComandas.add(item.id)
                        })
                      }
                    })
                  }
                  
                  console.log('🔍 Productos en comandas:', Array.from(productosEnComandas))
                  console.log('🔍 Productos del pedido original:', data.data.items)
                  
                  // Actualizar el estado de los productos basado en las comandas reales
                  const updatedItems = data.data.items.map((item: any) => {
                    const estaEnComandas = productosEnComandas.has(item.id)
                    console.log(`🔍 Producto ${item.id} (${item.name}):`, estaEnComandas ? 'Enviado' : 'No enviado')
                    
                    if (estaEnComandas) {
                      // Si está en comandas, mantener estado "Enviado"
                      return {
                        ...item,
                        status: 'Enviado'
                      }
        } else {
                      // Si no está en comandas, usar estado por defecto
                      return item
                    }
                  })
                  
                  console.log('✅ Productos con estado actualizado:', updatedItems)
                  
                  // Actualizar la orden en localStorage con el estado sincronizado
                  const updatedOrder = {
                    ...existingTable.currentOrder,
                    items: updatedItems,
                    total: data.data.total,
                    updatedAt: new Date()
                  }
                  
                  const updatedTables = tables.map((table: any) => {
                    if (table.id === parseInt(mesaId)) {
                      return {
                        ...table,
                        currentOrder: updatedOrder
                      }
                    }
                    return table
                  })
                  
                  localStorage.setItem(tablesKey, JSON.stringify(updatedTables))
                  
                  // También actualizar el estado del pedido para mostrar el estado correcto
                  const pedidoConEstado = {
                    ...data.data,
                    items: updatedItems
                  }
                  setPedido(pedidoConEstado)
                  return // Salir temprano para no ejecutar setPedido(data.data) más abajo
                }
              }
            } catch (error) {
              console.error('Error sincronizando estado de comandas:', error)
            }
          }
        }
        
        setPedido(data.data)
        setError(null)
      } else {
        setError(data.message || 'No se encontró el pedido')
        setPedido(null)
        }
      } catch (err) {
      console.error('Error fetching pedido estado:', err)
      setError('Error al obtener el estado del pedido')
      setPedido(null)
      } finally {
        setLoading(false)
      }
    }

  const addToCart = (product: Product) => {
    setCart(prevCart => {
      const existingItem = prevCart.find(item => item.id === product.id)
      if (existingItem) {
        return prevCart.map(item =>
          item.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        )
      } else {
        return [...prevCart, {
          id: product.id,
          name: product.name,
          price: product.sell_price_inc_tax,
          quantity: 1,
          image: product.image
        }]
      }
    })
  }

  const removeFromCart = (productId: number) => {
    setCart(prevCart => {
      const existingItem = prevCart.find(item => item.id === productId)
      if (existingItem && existingItem.quantity > 1) {
        return prevCart.map(item =>
          item.id === productId
            ? { ...item, quantity: item.quantity - 1 }
            : item
        )
      } else {
        return prevCart.filter(item => item.id !== productId)
      }
    })
  }

  const getCartTotal = () => {
    return cart.reduce((total, item) => total + (item.price * item.quantity), 0)
  }

  const handlePlaceOrder = async () => {
    if (cart.length === 0) return

    const mesaId = getMesaId()
    if (!mesaId || !businessId) return

    try {
      // Verificar si ya existe una orden en la mesa
      const businessIdFromToken = getBusinessIdFromToken()
      let existingOrder = null
      
      if (businessIdFromToken) {
        const tablesKey = `restaurant-tables-db-${businessIdFromToken}`
        const existingTables = localStorage.getItem(tablesKey)
        if (existingTables) {
          try {
            const tables = JSON.parse(existingTables)
            const existingTable = tables.find((table: any) => table.id === parseInt(mesaId))
            if (existingTable && existingTable.currentOrder) {
              existingOrder = existingTable.currentOrder
            }
          } catch (error) {
            console.error('Error reading existing tables:', error)
          }
        }
      }

      // Preparar los nuevos productos
      const newItems = cart.map(item => ({
        ...item,
        sell_price_inc_tax: item.price,
        order_area_id: null,
        _orderItemId: Date.now().toString() + Math.random().toString(36).substring(2, 8)
      }))

      let orderData
      
      if (existingOrder) {
        // Agregar productos a la orden existente preservando el estado de los existentes
        const updatedItems = [
          ...existingOrder.items, // Mantener productos existentes con su estado
          ...newItems // Agregar solo los nuevos productos
        ]
        const updatedTotal = updatedItems.reduce((sum, item) => sum + (item.price * item.quantity), 0)
        
        orderData = {
          ...existingOrder,
          items: updatedItems,
          total: updatedTotal,
          updatedAt: new Date()
        }
      } else {
        // Crear nueva orden
        orderData = {
          id: `order-qr-${mesaId}-${Date.now()}`,
          items: newItems,
          total: getCartTotal(),
          status: 'active' as const,
          orderType: 'dine-in' as const,
          waiter: 'Cliente QR',
          customerInfo: { name: 'Cliente Mesa ' + mesaId },
          bills: [],
          splitMode: false,
          printedAreas: [],
          createdAt: new Date(),
          updatedAt: new Date()
        }
      }

      // Guardar en localStorage para que aparezca en /tables
      const orderKey = `table-order-${mesaId}`
      localStorage.setItem(orderKey, JSON.stringify(orderData))

      // Actualizar en el localStorage del contexto de mesas
      if (businessIdFromToken) {
        const tablesKey = `restaurant-tables-db-${businessIdFromToken}`
        const existingTables = localStorage.getItem(tablesKey)
        if (existingTables) {
          try {
            const tables = JSON.parse(existingTables)
            const updatedTables = tables.map((table: any) => {
              if (table.id === parseInt(mesaId)) {
                return {
                  ...table,
                  status: 'occupied',
                  currentOrder: orderData,
                  updatedAt: new Date()
                }
              }
              return table
            })
            localStorage.setItem(tablesKey, JSON.stringify(updatedTables))
          } catch (error) {
            console.error('Error updating tables in localStorage:', error)
          }
        }
      }

      // Guardar también en table_orders_temp para sincronización entre dispositivos
      try {
        const tempOrderResponse = await fetch('/api/table-orders-temp', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          },
          body: JSON.stringify({
            mesa_id: parseInt(mesaId),
            business_id: businessId,
            items: newItems
          })
        })

        if (tempOrderResponse.ok) {
          console.log('✅ Pedido guardado en table_orders_temp para sincronización')
        } else {
          console.error('❌ Error guardando en table_orders_temp')
        }
      } catch (error) {
        console.error('❌ Error guardando en table_orders_temp:', error)
      }

      // Limpiar carrito y mostrar mensaje de éxito
      setCart([])
      setShowMenu(false)
      alert('¡Pedido realizado con éxito! El personal del restaurante lo verá en el dashboard.')
      
      // Notificar a la página de /tables que hay un nuevo pedido
      window.dispatchEvent(new CustomEvent('newOrderPlaced', { 
        detail: { mesaId: parseInt(mesaId), orderData } 
      }))
      
      // Recargar el estado del pedido
      fetchPedidoEstado()
    } catch (error) {
      console.error('Error placing order:', error)
      alert('Error al realizar el pedido. Inténtalo de nuevo.')
    }
  }

  useEffect(() => {
    const mesaId = getMesaId()
    if (mesaId) {
      fetchBusinessId(mesaId)
    }
    fetchPedidoEstado()
    
    // Refrescar cada 5 segundos para sincronización en tiempo real
    const interval = setInterval(fetchPedidoEstado, 5000)
    
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    if (businessId) {
      fetchProducts(businessId)
    }
  }, [businessId])

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 text-purple-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Cargando estado del pedido...</p>
        </div>
      </div>
    )
  }

  if (error && !showMenu) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-purple-100 flex items-center justify-center p-4">
        <div className="text-center max-w-md mx-auto">
          <div className="bg-white rounded-2xl shadow-lg p-8 border border-purple-100">
            <div className="w-20 h-20 bg-gradient-to-br from-purple-400 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-6">
              <Menu className="h-10 w-10 text-white" />
            </div>
            <h2 className="text-2xl font-bold text-gray-800 mb-3">
              ¡Bienvenido!
            </h2>
            <p className="text-gray-600 mb-6 leading-relaxed">
              {error}
            </p>
            <Button 
              onClick={() => setShowMenu(true)} 
              className="w-full bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white font-semibold py-3 px-6 rounded-xl shadow-lg transition-all duration-200 transform hover:scale-105"
            >
              <Menu className="h-5 w-5 mr-2" />
              Ver Menú y Realizar Pedido
            </Button>
          </div>
        </div>
      </div>
    )
  }

  if (!pedido && !showMenu) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Menu className="h-12 w-12 text-orange-500 mx-auto mb-4" />
          <p className="text-gray-600">Realiza tu pedido</p>
          <Button 
            onClick={() => setShowMenu(true)} 
            className="mt-4"
            variant="outline"
          >
            Ver Menú
          </Button>
        </div>
      </div>
    )
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-600" />
      case 'ready':
        return <CheckCircle className="h-4 w-4 text-green-600" />
      case 'preparing':
        return <Loader2 className="h-4 w-4 text-yellow-600 animate-spin" />
      case 'pending':
        return <Clock className="h-4 w-4 text-red-600" />
      default:
        return <Clock className="h-4 w-4 text-gray-600" />
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'completed':
        return 'Completado'
      case 'ready':
        return 'Listo'
      case 'preparing':
        return 'Preparando'
      case 'pending':
        return 'Pendiente'
      default:
        return 'Pendiente'
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800'
      case 'ready':
        return 'bg-green-100 text-green-800'
      case 'preparing':
        return 'bg-yellow-100 text-yellow-800'
      case 'pending':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-2">
            {pedido ? 'Estado de tu Pedido' : 'Mesa ' + getMesaId()}
          </h1>
          
          {/* Botones de acción */}
          <div className="flex flex-col sm:flex-row justify-center gap-2 sm:gap-4 mt-4">
            <Button
              onClick={() => setShowMenu(!showMenu)}
              variant={showMenu ? "outline" : "default"}
              className={`flex items-center gap-2 ${showMenu ? 'border-purple-500 text-purple-600 hover:bg-purple-50' : 'bg-purple-500 hover:bg-purple-600 text-white'}`}
            >
              <Menu className="h-4 w-4" />
              {showMenu ? 'Ocultar Menú' : 'Ver Menú'}
            </Button>
            
            {cart.length > 0 && (
              <Button
                onClick={() => setShowMenu(true)}
                variant="secondary"
                className="flex items-center gap-2"
              >
                <ShoppingCart className="h-4 w-4" />
                Carrito ({cart.length})
              </Button>
            )}
          </div>
        </div>

        {/* Menú de productos */}
        {showMenu && (
          <Card className="mb-4 sm:mb-6">
            <CardHeader>
              <CardTitle className="text-lg sm:text-xl">
                Menú del Restaurante
              </CardTitle>
            </CardHeader>
            <CardContent>
              {menuLoading ? (
                <div className="text-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2" />
                  <p>Cargando menú...</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Campo de búsqueda */}
                  <div className="relative mb-4">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                    <input
                      type="text"
                      placeholder="Buscar productos..."
                      value={searchTerm}
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                      onChange={(e) => {
                        const term = e.target.value
                        setSearchTerm(term)
                        
                        if (term.trim() === '') {
                          setFilteredProducts(allProducts)
                        } else {
                          const filtered = allProducts.filter(product => 
                            product.name.toLowerCase().includes(term.toLowerCase())
                          )
                          console.log('🔍 Búsqueda:', term)
                          console.log('🔍 Productos filtrados:', filtered.map(p => p.name))
                          setFilteredProducts(filtered)
                        }
                      }}
                    />
                  </div>
                  <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-5 gap-3">
                    {filteredProducts.map((product) => (
                      <div key={product.id} className="bg-white rounded-lg border p-2 sm:p-3 cursor-pointer hover:shadow-md transition-shadow" onClick={() => addToCart(product)}>
                        <div className="aspect-square mb-2 bg-gray-100 rounded-lg overflow-hidden">
                          {product.image ? (
                            <img 
                              src={product.image} 
                              alt={product.name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <div className="w-8 h-8 bg-gray-300 rounded"></div>
                            </div>
                          )}
                </div>
                        <h3 className="font-semibold text-gray-800 text-xs sm:text-sm mb-1 truncate">{product.name}</h3>
                        {product.category_name && (
                          <p className="text-xs text-gray-600 mb-1">{product.category_name}</p>
                        )}
                        <p className="font-bold text-purple-600 text-xs sm:text-sm">$ {Math.round(product.sell_price_inc_tax).toLocaleString('es-CO')}</p>
              </div>
            ))}
          </div>
          </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Estado general del pedido */}
        {pedido && (
          <>
            <Card className="mb-4 sm:mb-6">
              <CardContent className="pt-6">
                <p className="text-sm sm:text-base text-gray-600 text-center">
                  Pedido realizado el {new Date(pedido.createdAt).toLocaleString()}
                </p>
              </CardContent>
            </Card>

            {/* Lista de productos */}
            <Card className="mb-4 sm:mb-6">
              <CardHeader>
                <CardTitle className="text-lg sm:text-xl">Productos del Pedido</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 sm:space-y-4">
                  {pedido.items.map((item, index) => (
                    <div key={`${item.id}-${index}`} className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-3 sm:p-4 bg-white rounded-lg border gap-3 sm:gap-0">
                      <div className="flex items-center gap-3 sm:gap-4 w-full sm:w-auto">
                        {item.image && (
                          <img 
                            src={item.image} 
                            alt={item.name}
                            className="w-12 h-12 sm:w-16 sm:h-16 object-cover rounded-lg flex-shrink-0"
                          />
                        )}
                        <div className="min-w-0 flex-1">
                          <h3 className="font-semibold text-gray-800 text-sm sm:text-base truncate">{item.name}</h3>
                          <p className="text-xs sm:text-sm text-gray-600">Cantidad: {item.quantity}</p>
                          <p className="font-medium text-gray-800 text-sm sm:text-base">$ {Math.round(item.price).toLocaleString('es-CO')}</p>
            </div>
          </div>
                      <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                        <Badge className={`${getStatusColor(item.status)} text-xs sm:text-sm`}>
                          {getStatusIcon(item.status)}
                          {getStatusText(item.status)}
                        </Badge>
              </div>
            </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Total */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg sm:text-xl">Total del Pedido</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center">
                  <span className="text-lg sm:text-xl font-bold text-purple-600">$ {Math.round(pedido.total).toLocaleString('es-CO')}</span>
              </div>
              </CardContent>
            </Card>
          </>
        )}
            </div>
            
      {/* Carrito flotante */}
      {cart.length > 0 && (
        <>
          {/* Botón flotante del carrito */}
          {!showCart && (
            <div 
              className="fixed bottom-4 right-4 bg-orange-600 text-white rounded-full p-4 shadow-lg cursor-pointer hover:bg-orange-700 transition-colors"
              onClick={() => setShowCart(true)}
            >
              <ShoppingCart className="h-6 w-6" />
              {cart.length > 0 && (
                <div className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full w-6 h-6 flex items-center justify-center">
                  {cart.reduce((sum, item) => sum + item.quantity, 0)}
                </div>
              )}
            </div>
          )}

          {/* Carrito expandido */}
          {showCart && (
            <div className="fixed bottom-4 left-4 right-4 sm:left-auto sm:right-4 sm:max-w-sm bg-white rounded-lg shadow-lg border p-3 sm:p-4">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-semibold flex items-center gap-2 text-sm sm:text-base">
                  <ShoppingCart className="h-4 w-4" />
                  Tu Pedido
                </h3>
                <Button 
                  onClick={() => setShowCart(false)}
                  variant="ghost"
                  size="sm"
                  className="p-1 h-6 w-6"
                >
                  ×
                </Button>
              </div>
              <div className="space-y-2 max-h-32 sm:max-h-40 overflow-y-auto">
                {cart.map((item) => (
                  <div key={item.id} className="flex items-center justify-between text-xs sm:text-sm">
                    <span className="truncate flex-1 mr-2">{item.name}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-gray-600">x{item.quantity}</span>
                      <span className="font-medium">$ {Math.round(item.price * item.quantity).toLocaleString('es-CO')}</span>
                    </div>
                  </div>
                ))}
              </div>
              <div className="border-t pt-2 mt-2">
                <div className="flex items-center justify-between mb-2 text-sm sm:text-base">
                  <span className="font-semibold">Total:</span>
                  <span className="font-bold text-purple-600">$ {Math.round(getCartTotal()).toLocaleString('es-CO')}</span>
                </div>
                <Button onClick={handlePlaceOrder} className="w-full" size="sm" className="text-xs sm:text-sm">
                  Realizar Pedido
                </Button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}
