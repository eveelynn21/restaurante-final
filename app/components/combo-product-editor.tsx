"use client"

import { useState, useEffect } from "react"
import { Package, Info, Plus, X, Save } from "lucide-react"
import { Label } from "../../components/ui/label"
import { Button } from "../../components/ui/button"
import { formatPrice } from "../../lib/format-price"

interface ComboProduct {
  id: number
  name: string
  sku: string
  image: string
  sell_price_inc_tax: number
}

interface ComboProductEditorProps {
  productId: number
  comboData: string | null
  productName: string
  onComboChange?: (comboIds: number[]) => void
}

export default function ComboProductEditor({ productId, comboData, productName, onComboChange }: ComboProductEditorProps) {
  const [comboProducts, setComboProducts] = useState<ComboProduct[]>([])
  const [availableProducts, setAvailableProducts] = useState<ComboProduct[]>([])
  const [loading, setLoading] = useState(true)
  const [showAvailable, setShowAvailable] = useState(false)

  useEffect(() => {
    loadComboProducts()
  }, [comboData])

  useEffect(() => {
    if (comboProducts.length >= 0) {
      loadAvailableProducts()
    }
  }, [comboProducts, productId])

  // Separate effect for notifying parent of combo changes
  useEffect(() => {
    if (onComboChange) {
      const comboIds = comboProducts.map(p => p.id)
      onComboChange(comboIds)
    }
  }, [comboProducts]) // Remove onComboChange from dependencies

  const loadComboProducts = async () => {
    if (!comboData) {
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      
      // Clean and validate combo data
      const cleanComboData = String(comboData).trim()
      console.log('🔍 Raw combo data:', comboData)
      console.log('🧹 Clean combo data:', cleanComboData)
      
      // Check if it's empty or null-like values
      if (!cleanComboData || cleanComboData === 'null' || cleanComboData === 'NULL' || cleanComboData === '[]') {
        setComboProducts([])
        setLoading(false)
        return
      }
      
      let combo
      try {
        // Try to parse as JSON first
        combo = JSON.parse(cleanComboData)
      } catch (parseError) {
        console.warn('Failed to parse as JSON, trying alternative formats:', parseError)
        
        // If it's not JSON, try to handle it as a comma-separated string of IDs
        if (cleanComboData.includes(',')) {
          combo = cleanComboData.split(',').map(id => parseInt(id.trim())).filter(id => !isNaN(id))
        } else {
          // Try to parse as a single number
          const singleId = parseInt(cleanComboData)
          if (!isNaN(singleId)) {
            combo = [singleId]
          } else {
            console.error('Unable to parse combo data:', cleanComboData)
            setComboProducts([])
            setLoading(false)
            return
          }
        }
      }
      
      console.log('✅ Parsed combo:', combo)
      console.log('🔢 Combo product IDs:', combo)
      console.log('📊 Type of combo:', typeof combo)
      
      // Ensure combo is always an array
      const comboArray = Array.isArray(combo) ? combo : [combo]
      console.log('🔄 Normalized combo array:', comboArray)
      console.log('📊 Number of IDs in combo:', comboArray.length)
      console.log('🔍 Unique IDs in combo:', [...new Set(comboArray)])
      
      if (!Array.isArray(comboArray) || comboArray.length === 0) {
        setComboProducts([])
        setLoading(false)
        return
      }

      // Get product details for each combo product ID
      const token = localStorage.getItem('token')
      
      // Make a single API call to get all products and then filter by combo IDs
      try {
        const response = await fetch(`/api/products?page=1&pageSize=1000`, {
          headers: { 'Authorization': `Bearer ${token}` }
        })
        
        if (response.ok) {
          const data = await response.json()
          const allProducts = data.products || []
          
          // Filter products that match our combo IDs
          const comboProductDetails: ComboProduct[] = []
          const seenProductIds = new Set<number>()
          
          for (const comboProductId of comboArray) {
            const product = allProducts.find((p: any) => p.id === comboProductId)
            
            if (product && !seenProductIds.has(product.id)) {
              comboProductDetails.push({
                id: product.id,
                name: product.name,
                sku: product.sku,
                image: product.image || '/placeholder.svg',
                sell_price_inc_tax: product.sell_price_inc_tax || 0
              })
              seenProductIds.add(product.id)
              console.log(`✅ Added product: ${product.name} (ID: ${product.id})`)
            } else if (!product) {
              console.error(`❌ Product with ID ${comboProductId} not found`)
            }
          }
          
          console.log(`📦 Total unique products loaded: ${comboProductDetails.length}`)
          setComboProducts(comboProductDetails)
        } else {
          console.error('Failed to load products')
          setComboProducts([])
        }
      } catch (error) {
        console.error('Error loading all products:', error)
        setComboProducts([])
      }
    } catch (error) {
      console.error('Error processing combo data:', error)
      setComboProducts([])
    } finally {
      setLoading(false)
    }
  }

  const loadAvailableProducts = async () => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`/api/products?page=1&pageSize=1000`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      
      if (response.ok) {
        const data = await response.json()
        const allProducts = data.products || []
        
        // Filter out products that are already in the combo and the combo product itself
        const currentComboIds = comboProducts.map(p => p.id)
        const available = allProducts
          .filter((p: any) => !currentComboIds.includes(p.id) && p.id !== productId)
          .map((p: any) => ({
            id: p.id,
            name: p.name,
            sku: p.sku,
            image: p.image || '/placeholder.svg',
            sell_price_inc_tax: p.sell_price_inc_tax || 0
          }))
        
        setAvailableProducts(available)
      }
    } catch (error) {
      console.error('Error loading available products:', error)
    }
  }

  const addProductToCombo = (product: ComboProduct) => {
    setComboProducts(prev => [...prev, product])
    setAvailableProducts(prev => prev.filter(p => p.id !== product.id))
  }

  const removeProductFromCombo = (productIdToRemove: number) => {
    const productToMove = comboProducts.find(p => p.id === productIdToRemove)
    if (productToMove) {
      setComboProducts(prev => prev.filter(p => p.id !== productIdToRemove))
      setAvailableProducts(prev => [...prev, productToMove])
    }
  }

  if (loading) {
    return (
      <div className="space-y-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
        <div className="flex items-center gap-2">
          <Package className="h-5 w-5 text-blue-600" />
          <h3 className="font-semibold text-blue-800">🎯 Combo: {productName}</h3>
        </div>
        <p className="text-sm text-blue-600">Cargando productos del combo...</p>
      </div>
    )
  }

  return (
    <div className="space-y-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
      <div className="flex items-center gap-2">
        <Package className="h-5 w-5 text-blue-600" />
        <h3 className="font-semibold text-blue-800">🎯 Combo: {productName}</h3>
      </div>
      
      <p className="text-sm text-blue-600 mb-4">
        Este es un producto combo. Aquí puedes ver los productos que lo componen:
      </p>
      
      {/* Display combo products */}
      <div className="space-y-2">
        <Label className="text-blue-700 font-medium">Productos en el combo:</Label>
        {comboProducts.length > 0 ? (
          <div className="grid gap-2">
            {comboProducts.map((product, index) => (
              <div key={`combo-${product.id}-${index}`} className="flex items-center justify-between p-3 bg-white rounded-lg border border-blue-200">
                <div className="flex items-center gap-3">
                  <img
                    src={product.image}
                    alt={product.name}
                    className="w-10 h-10 rounded-lg object-cover"
                  />
                  <div>
                    <p className="font-medium text-gray-800">{product.name}</p>
                    <p className="text-sm text-gray-500">{product.sku}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="text-right">
                    <p className="font-medium text-blue-600">{formatPrice(product.sell_price_inc_tax)}</p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => removeProductFromCombo(product.id)}
                    className="ml-2 hover:bg-red-50 hover:border-red-300"
                  >
                    <X className="h-4 w-4 text-red-500" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex items-center gap-2 p-3 bg-yellow-50 rounded-lg border border-yellow-200">
            <Info className="h-4 w-4 text-yellow-600" />
            <p className="text-sm text-yellow-800">No se pudieron cargar los productos del combo</p>
          </div>
        )}
      </div>
      
      {/* Display available products for selection */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label className="text-blue-700 font-medium">Agregar más productos:</Label>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowAvailable(!showAvailable)}
            className="text-blue-600 border-blue-200 hover:bg-blue-50"
          >
            <Plus className="h-4 w-4 mr-2" />
            {showAvailable ? 'Ocultar productos' : 'Ver productos disponibles'}
          </Button>
        </div>
        
        {showAvailable && (
          <div className="max-h-64 overflow-y-auto border border-blue-200 rounded-lg">
            {availableProducts.length > 0 ? (
              <div className="grid gap-1">
                {availableProducts.map((product, index) => (
                  <div key={`available-${product.id}-${index}`} className="flex items-center justify-between p-2 hover:bg-blue-50 border-b border-blue-100 last:border-b-0">
                    <div className="flex items-center gap-2">
                      <img
                        src={product.image}
                        alt={product.name}
                        className="w-8 h-8 rounded object-cover"
                      />
                      <div>
                        <p className="font-medium text-sm text-gray-800">{product.name}</p>
                        <p className="text-xs text-gray-500">{product.sku} - {formatPrice(product.sell_price_inc_tax)}</p>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        addProductToCombo(product)
                        if (availableProducts.length === 1) setShowAvailable(false)
                      }}
                      className="text-blue-600 hover:bg-blue-100"
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex items-center gap-2 p-3 text-center">
                <Info className="h-4 w-4 text-yellow-600" />
                <p className="text-sm text-yellow-800">No hay productos disponibles para agregar.</p>
              </div>
            )}
          </div>
        )}
      </div>
      
      {/* Note about editing combos */}
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
        <div className="flex items-start gap-2">
          <Info className="h-4 w-4 text-yellow-600 mt-0.5" />
          <p className="text-sm text-yellow-800">
            <strong>Nota:</strong> Los cambios se guardarán cuando presiones "Guardar" al final del formulario.
          </p>
        </div>
      </div>
    </div>
  )
} 