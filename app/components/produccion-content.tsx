"use client"

import React, { useState, useEffect } from "react"
import { Button } from "../../components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card"
import { Package, Calculator, AlertTriangle, CheckCircle, Clock, User, MapPin, AlertCircle, Database, FileText, X } from "lucide-react"
import { Badge } from "../../components/ui/badge"
import { useComandas } from "../context/comandas-context"
import { toast } from "sonner"
import { formatPrice } from "../../lib/format-price"

interface Transaction {
  id: number
  invoice_no: string
  final_total: number
  created_at: string
  contact_name?: string
  res_table_id?: number
}

interface TransactionProduct {
  id: number
  product_id: number
  product_name: string
  product_sku: string
  quantity: number
  unit_price_inc_tax: number
  variation_name?: string
}

interface Recipe {
  id: string
  product_id: string
  product_name: string
  total_quantity: number
  ingredients: Ingredient[]
}

interface Ingredient {
  product_id: string
  name: string
  quantity: number
  unit_name: string
  precio_unitario: number
}

interface InsumoResumen {
  product_id: string
  name: string
  unidad: string
  cantidad: number
  costo_total: number
  precio_unitario: number
}

export default function ProduccionContent() {
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [selectedTransactions, setSelectedTransactions] = useState<number[]>([])
  const [transactionProducts, setTransactionProducts] = useState<Record<number, TransactionProduct[]>>({})
  const [loading, setLoading] = useState(false)
  const [insumosResumen, setInsumosResumen] = useState<InsumoResumen[]>([])
  const [showResumen, setShowResumen] = useState(false)
  const [processing, setProcessing] = useState(false)

  // Cargar transacciones no procesadas
  const loadUnprocessedTransactions = async () => {
    try {
      setLoading(true)
      const token = localStorage.getItem('token')
      console.log('🔍 Token encontrado:', token ? 'Sí' : 'No')
      if (!token) return

      console.log('🌐 Haciendo petición a /api/transactions/unprocessed')
      const response = await fetch('/api/transactions/unprocessed', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      console.log('📡 Status de respuesta:', response.status)
      console.log('📡 OK:', response.ok)

      if (response.ok) {
        const data = await response.json()
        console.log('📦 Datos recibidos:', data)
        if (data.success) {
          setTransactions(data.data || [])
          console.log('✅ Transacciones no procesadas cargadas:', data.data?.length || 0)
        } else {
          console.error('❌ Error en respuesta:', data.error)
          toast.error('Error al cargar transacciones: ' + (data.error || 'Error desconocido'))
        }
      } else {
        console.error('❌ Error HTTP:', response.status, response.statusText)
        toast.error('Error al cargar transacciones')
      }
    } catch (error) {
      console.error('❌ Error cargando transacciones:', error)
      toast.error('Error al cargar transacciones')
    } finally {
      setLoading(false)
    }
  }

  // Cargar productos de una transacción
  const loadTransactionProducts = async (transactionId: number) => {
    try {
      const token = localStorage.getItem('token')
      if (!token) return

      const response = await fetch(`/api/transactions/${transactionId}/products`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (response.ok) {
        const data = await response.json()
        if (data.success) {
          setTransactionProducts(prev => ({
            ...prev,
            [transactionId]: data.data || []
          }))
        }
      }
    } catch (error) {
      console.error('Error cargando productos de transacción:', error)
    }
  }

  useEffect(() => {
    loadUnprocessedTransactions()
  }, [])

  useEffect(() => {
    selectedTransactions.forEach(transactionId => {
      if (!transactionProducts[transactionId]) {
        loadTransactionProducts(transactionId)
      }
    })
  }, [selectedTransactions])

  const toggleTransactionSelection = (transactionId: number) => {
    setSelectedTransactions(prev => 
      prev.includes(transactionId) 
        ? prev.filter(id => id !== transactionId)
        : [...prev, transactionId]
    )
  }

  const selectAllTransactions = () => {
    setSelectedTransactions(transactions.map(t => t.id))
  }

  const deselectAllTransactions = () => {
    setSelectedTransactions([])
  }

  const handleProcesarTransacciones = async () => {
    if (selectedTransactions.length === 0) {
      toast.error('Selecciona al menos una transacción para procesar')
      return
    }

    try {
      setProcessing(true)
      const token = localStorage.getItem('token')
      if (!token) return

      const insumosMap: Record<string, InsumoResumen> = {}
      console.log('=== INICIANDO PROCESAMIENTO DE TRANSACCIONES ===')
      console.log('Transacciones seleccionadas:', selectedTransactions)
      console.log('Productos cargados:', transactionProducts)

      for (const transactionId of selectedTransactions) {
        const products = transactionProducts[transactionId] || []
        console.log(`Procesando transacción ${transactionId} con ${products.length} productos`)

        if (products.length === 0) {
          console.log(`⚠️ No hay productos cargados para transacción ${transactionId}, cargando...`)
          await loadTransactionProducts(transactionId)
          // Esperar un poco y obtener los productos actualizados
          await new Promise(resolve => setTimeout(resolve, 500))
          const updatedProducts = transactionProducts[transactionId] || []
          console.log(`Productos actualizados para transacción ${transactionId}:`, updatedProducts)
        }

        for (const product of products) {
          console.log('=== PROCESANDO PRODUCTO ===')
          console.log('Producto vendido:', product)
          console.log(`Producto ID: ${product.product_id}, Cantidad: ${product.quantity}`)
          
          try {
            console.log(`🔍 Buscando receta para producto ${product.product_id}`)
            // Primero buscar la receta
            const res = await fetch(`/api/recipes?product_id=${product.product_id}`, { 
              headers: { 'Authorization': `Bearer ${token}` } 
            })
            const data = await res.json()
            console.log(`Respuesta de receta para producto ${product.product_id}:`, data)
            
            if (data.success && data.data && data.data.length > 0) {
              // Buscar la receta específica para este producto
              const receta = data.data.find((r: any) => r.product_id === product.product_id)
              if (!receta) {
                console.log(`⚠️ No se encontró receta específica para producto ${product.product_id}`)
                continue
              }
              console.log('Receta encontrada:', receta)
              
              // Ahora buscar los ingredientes de esta receta
              console.log(`🔍 Buscando ingredientes para receta ${receta.id}`)
              const ingredientesRes = await fetch(`/api/recipes/${receta.id}/ingredients`, { 
                headers: { 'Authorization': `Bearer ${token}` } 
              })
              const ingredientesData = await ingredientesRes.json()
              console.log(`Ingredientes encontrados para receta ${receta.id}:`, ingredientesData)
              
              if (ingredientesData.success && ingredientesData.data && ingredientesData.data.length > 0) {
                console.log('Ingredientes de la receta:', ingredientesData.data)
                console.log(`📊 Procesando ${ingredientesData.data.length} ingredientes para producto ${product.product_id}`)
                
                for (const ing of ingredientesData.data) {
                  const cantidadTotal = (Number(ing.quantity) || 0) * (product.quantity || 1)
                  const costoTotal = cantidadTotal * (Number(ing.default_purchase_price) || 0)
                  
                  console.log(`📦 Ingrediente ${ing.final_product_id || ing.variation_id}: ${cantidadTotal} unidades, costo: ${costoTotal}`)
                  
                  if (!insumosMap[ing.final_product_id || ing.variation_id]) {
                    insumosMap[ing.final_product_id || ing.variation_id] = { 
                      product_id: ing.final_product_id || ing.variation_id,
                      name: ing.product_name || `Ingrediente ${ing.final_product_id || ing.variation_id}`, 
                      unidad: ing.unidad || ing.unit_name || '', 
                      cantidad: 0,
                      costo_total: 0,
                      precio_unitario: 0
                    }
                    console.log(`🆕 Nuevo ingrediente agregado al mapa: ${ing.final_product_id || ing.variation_id}`)
                  } else {
                    console.log(`➕ Ingrediente existente actualizado: ${ing.final_product_id || ing.variation_id}`)
                  }
                  
                  insumosMap[ing.final_product_id || ing.variation_id].cantidad += cantidadTotal
                  insumosMap[ing.final_product_id || ing.variation_id].costo_total += costoTotal
                  insumosMap[ing.final_product_id || ing.variation_id].precio_unitario = Number(ing.default_purchase_price) || 0
                  
                  console.log(`📊 Estado actual del ingrediente ${ing.final_product_id || ing.variation_id}: cantidad=${insumosMap[ing.final_product_id || ing.variation_id].cantidad}, costo=${insumosMap[ing.final_product_id || ing.variation_id].costo_total}`)
                }
              } else {
                console.log(`⚠️ No se encontraron ingredientes para receta ${receta.id}`)
              }
            } else {
              console.log(`⚠️ No se encontró receta para producto ${product.product_id}`)
            }
          } catch (e) { 
            console.error('Error buscando receta para producto', product.product_id, e) 
          }
          console.log('=== FIN PRODUCTO ===')
        }
      }

      console.log('Resumen de insumos calculado:', insumosMap)
      setInsumosResumen(Object.values(insumosMap))
      setShowResumen(true)
    } catch (error) {
      console.error('Error procesando transacciones:', error)
      toast.error('Error al procesar transacciones')
    } finally {
      setProcessing(false)
    }
  }

  const handleConfirmarProcesamiento = async () => {
    try {
      setProcessing(true)
      const token = localStorage.getItem('token')
      if (!token) return

      const response = await fetch('/api/transactions/unprocessed', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          transactionIds: selectedTransactions
        })
      })

      if (response.ok) {
        const data = await response.json()
        if (data.success) {
          toast.success(`${data.affectedRows} transacciones procesadas exitosamente`)
          setShowResumen(false)
          setSelectedTransactions([])
          setTransactionProducts({})
          setInsumosResumen([])
          await loadUnprocessedTransactions() // Recargar lista
        }
      } else {
        toast.error('Error al confirmar procesamiento')
      }
    } catch (error) {
      console.error('Error confirmando procesamiento:', error)
      toast.error('Error al confirmar procesamiento')
    } finally {
      setProcessing(false)
    }
  }

  const handleCancelarProcesamiento = () => {
    setShowResumen(false)
    setInsumosResumen([])
  }

  // Función temporal para probar la base de datos
  const testDatabase = async () => {
    try {
      const token = localStorage.getItem('token')
      if (!token) return

      const response = await fetch('/api/test-database', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (response.ok) {
        const data = await response.json()
        console.log('🔍 Resultado de prueba de BD:', data)
        if (data.success) {
          alert(`Resultado de prueba:
- Campo is_produced existe: ${data.data.columnExists}
- Transacciones de ejemplo: ${data.data.sampleTransactions.length}
- Conteo por estado: ${JSON.stringify(data.data.countByStatus)}
- Business ID: ${data.data.businessId}`)
        }
      }
    } catch (error) {
      console.error('Error probando BD:', error)
    }
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Panel izquierdo - Transacciones no procesadas */}
      <Card className="border border-gray-200 shadow-sm bg-white">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-base font-semibold text-purple-700">
            <Database className="h-5 w-5 text-purple-500" />
            Transacciones de Venta no Procesadas
          </CardTitle>
        </CardHeader>
        <CardContent className="max-h-96 overflow-y-auto">
          {loading ? (
            <div className="text-center py-8">
              <div className="w-8 h-8 border-4 border-teal-400 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-gray-500">Cargando transacciones...</p>
            </div>
          ) : transactions.length === 0 ? (
            <div className="text-center py-8">
              <AlertTriangle className="h-12 w-12 text-orange-400 mx-auto mb-4" />
              <p className="text-gray-500 mb-2">No hay transacciones no procesadas</p>
              <p className="text-xs text-gray-400">Las transacciones aparecerán aquí cuando se completen las ventas.</p>
              <Button 
                onClick={testDatabase}
                className="mt-4 bg-blue-500 hover:bg-blue-600 text-white"
                size="sm"
              >
                🔍 Probar Base de Datos
              </Button>
            </div>
          ) : (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Button
                  size="sm"
                  className="bg-teal-500 hover:bg-teal-600 text-white font-medium rounded-md px-4 py-2 shadow-none"
                  onClick={selectAllTransactions}
                  disabled={selectedTransactions.length === transactions.length}
                >
                  <CheckCircle className="mr-2 h-4 w-4" />
                  Seleccionar Todos ({transactions.length})
                </Button>
                <Button
                  size="sm"
                  className="bg-red-500 hover:bg-red-600 text-white font-medium rounded-md px-4 py-2 shadow-none"
                  onClick={deselectAllTransactions}
                  disabled={selectedTransactions.length === 0}
                >
                  <X className="mr-2 h-4 w-4" />
                  Deseleccionar Todos
                </Button>
              </div>
              {transactions.map((transaction) => (
                <div
                  key={transaction.id}
                  className={`p-3 border border-gray-100 rounded-md cursor-pointer transition-all duration-200 ${
                    selectedTransactions.includes(transaction.id)
                      ? 'border-teal-400 bg-teal-50'
                      : 'hover:border-teal-300 hover:bg-gray-50'
                  }`}
                  onClick={() => toggleTransactionSelection(transaction.id)}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-semibold text-gray-800 text-sm">Factura: {transaction.invoice_no}</h3>
                      <p className="text-xs text-gray-500">
                        Mesa: {transaction.res_table_id || 'Desconocida'} • Cliente: {transaction.contact_name || 'Desconocido'}
                      </p>
                    </div>
                    {selectedTransactions.includes(transaction.id) && (
                      <CheckCircle className="h-4 w-5 text-teal-500" />
                    )}
                  </div>
                  <div className="text-xs text-gray-400 mt-1">
                    Total: {formatPrice(transaction.final_total)} • Fecha: {new Date(transaction.created_at).toLocaleDateString()}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Panel derecho - Resumen de Insumos */}
      <Card className="border border-gray-200 shadow-sm bg-white">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-base font-semibold text-blue-700">
            <FileText className="h-5 w-5 text-blue-500" />
            Resumen de Insumos Utilizados
          </CardTitle>
        </CardHeader>
        <CardContent className="max-h-96 overflow-y-auto">
          {!selectedTransactions.length ? (
            <div className="text-center py-8">
              <Package className="h-12 w-12 text-gray-200 mx-auto mb-4" />
              <p className="text-gray-400">Selecciona transacciones para ver los ingredientes necesarios</p>
            </div>
          ) : (
            <div>
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2 mb-4">
                <div className="flex-1">
                  <label className="block text-xs font-medium text-gray-700 mb-1">Cantidad a producir</label>
                  <p className="text-xs text-gray-400">Basado en las cantidades de las transacciones</p>
                </div>
                <Button 
                  size="sm"
                  className="w-full md:w-auto bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-600 hover:to-cyan-600 text-white py-2 rounded-md shadow-none mt-2 md:mt-0"
                  disabled={selectedTransactions.length === 0 || processing}
                  onClick={handleProcesarTransacciones}
                >
                  <Package className="mr-2 h-5 w-5" />
                  Procesar Transacciones
                </Button>
              </div>

              <div className="space-y-2">
                {insumosResumen.map((ins, index) => (
                  <div key={index} className="flex items-center justify-between p-2 bg-white border border-gray-100 rounded-md text-xs">
                    <div className="flex-1">
                      <h4 className="font-medium text-gray-800">{ins.name}</h4>
                      <p className="text-xs text-gray-500">
                        {ins.cantidad.toFixed(2)} {ins.unidad}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-gray-800">
                        {formatPrice(ins.costo_total || 0)}
                      </p>
                      <p className="text-xs text-gray-400">
                        {formatPrice(Number(ins.precio_unitario) || 0)} c/u
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Total */}
              <div className="bg-green-50 p-3 rounded-md border border-green-100 mt-4">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-green-800 text-sm">Costo total de ingredientes:</span>
                  <span className="font-bold text-green-800 text-base">
                    {formatPrice(insumosResumen.reduce((sum, ing) => sum + ing.costo_total, 0) || 0)}
                  </span>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Panel de confirmación */}
      {showResumen && (
        <div className="col-span-full">
          <Card className="border border-gray-200 shadow-sm bg-white">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-base font-semibold text-green-700">
                <CheckCircle className="h-5 w-5 text-green-500" />
                Confirmar Procesamiento de Transacciones
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2 mb-4">
                <Button
                  size="sm"
                  className="bg-green-500 hover:bg-green-600 text-white font-medium rounded-md px-4 py-2 shadow-none"
                  onClick={handleConfirmarProcesamiento}
                  disabled={selectedTransactions.length === 0 || processing}
                >
                  <CheckCircle className="mr-2 h-4 w-4" />
                  Confirmar Procesamiento
                </Button>
                <Button size="sm" variant="outline" className="rounded-md" onClick={handleCancelarProcesamiento}>
                  Cancelar Procesamiento
                </Button>
              </div>
              {insumosResumen && insumosResumen.length > 0 ? (
                <div className="space-y-1">
                  {insumosResumen.map((ins, idx) => (
                    <div key={idx} className="flex justify-between border-b border-gray-100 pb-1 text-sm">
                      <span className="font-medium text-gray-700">{ins.name}</span>
                      <span className="text-gray-600">{ins.cantidad.toFixed(2)} {ins.unidad}</span>
                    </div>
                  ))}
                  <div className="mt-2 text-xs text-gray-400">* Cuando el inventario esté implementado, estos insumos se descontarán automáticamente.</div>
                </div>
              ) : (
                <div className="text-gray-400 text-center py-4">No se encontraron insumos para descontar.</div>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
} 