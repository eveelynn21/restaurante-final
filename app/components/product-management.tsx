"use client"

import { useState, useEffect } from "react"
import { Plus, Edit, Trash2, Search, X, Save, Loader2, Image as ImageIcon, Link, Package } from "lucide-react"
import { Button } from "../../components/ui/button"
import { Input } from "../../components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card"
import { Badge } from "../../components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "../../components/ui/dialog"
import { Label } from "../../components/ui/label"
import { Textarea } from "../../components/ui/textarea"
import { RadioGroup, RadioGroupItem } from "../../components/ui/radio-group"
import type { Product } from "../../lib/services/product-service"
import { formatPrice } from "../../lib/format-price"
import ComboManagement from "./combo-management"
import ComboProductEditor from "./combo-product-editor"

interface ExtendedProduct extends Omit<Product, 'image' | 'product_description'> {
  price?: number
  image: string
  product_description: string | null
  not_for_selling: number
  tax?: number | null
}

interface ProductFormData {
  id?: number
  name: string
  sku: string
  price: number
  image: string
  product_description: string
  not_for_selling: number
  order_area_id: number | null
  tax: number | null
  purchase_price_without_tax: number
  purchase_price_with_tax: number
  profit_percent: number
  sell_price_without_tax: number
  sell_price_with_tax: number
}

type ImageSource = 'file' | 'url'

const PAGE_SIZE = 1000;

export default function ProductManagement() {
  const [products, setProducts] = useState<ExtendedProduct[]>([])
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingProduct, setEditingProduct] = useState<ExtendedProduct | null>(null)
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const [searchTerm, setSearchTerm] = useState('')
  const [imageSource, setImageSource] = useState<ImageSource>('url')
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string>('')
  const [areas, setAreas] = useState<{ id: number, name: string }[]>([])
  const [taxRates, setTaxRates] = useState<{ id: number, name: string, amount: number }[]>([])
  const [showComboModal, setShowComboModal] = useState(false)
  const [isEditingCombo, setIsEditingCombo] = useState(false)
  const [comboProducts, setComboProducts] = useState<any[]>([])
  const [availableProducts, setAvailableProducts] = useState<any[]>([])
  const [updatedComboIds, setUpdatedComboIds] = useState<number[]>([])
  const [activeTab, setActiveTab] = useState<'products' | 'combos'>('products')
  const [formData, setFormData] = useState<ProductFormData>({
    name: "",
    sku: "",
    price: 0,
    image: "",
    product_description: "",
    not_for_selling: 1,
    order_area_id: null,
    tax: null,
    purchase_price_without_tax: 0,
    purchase_price_with_tax: 0,
    profit_percent: 25,
    sell_price_without_tax: 0,
    sell_price_with_tax: 0
  })

  useEffect(() => {
    fetchProducts()
    fetchAvailableProducts()
    fetch("/api/order-areas").then(res => res.json()).then(data => setAreas(data.data || []))
    
    // Obtener impuestos con autorización
    const token = localStorage.getItem('token')
    if (token) {
      fetch("/api/tax-rates", {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      }).then(res => res.json()).then(data => setTaxRates(data.data || []))
    }
  }, [page])

  // Helper function to check if a product is a combo
  const isProductCombo = (product: ExtendedProduct): boolean => {
    if (!product.combo) return false
    try {
      const combo = typeof product.combo === 'string' ? JSON.parse(product.combo) : product.combo
      return Array.isArray(combo) && combo.length > 0
    } catch {
      return false
    }
  }

  // Load available products for combo selection
  const fetchAvailableProducts = async () => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`/api/products?page=1&pageSize=1000`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      const data = await response.json()
      if (response.ok) {
        setAvailableProducts(data.products || [])
      }
    } catch (error) {
      console.error('Error fetching available products:', error)
    }
  }

  // Recalcular precios cuando cambie el impuesto
  useEffect(() => {
    if (formData.tax !== null) {
      let field = ''
      let baseValue = 0
      
      // Determinar qué campo usar como base para el cálculo
      if (formData.purchase_price_without_tax > 0) {
        field = 'purchase_without_tax'
        baseValue = formData.purchase_price_without_tax
      } else if (formData.purchase_price_with_tax > 0) {
        field = 'purchase_with_tax'
        baseValue = formData.purchase_price_with_tax
      } else if (formData.sell_price_without_tax > 0) {
        field = 'sell_without_tax'
        baseValue = formData.sell_price_without_tax
      } else if (formData.sell_price_with_tax > 0) {
        field = 'sell_with_tax'
        baseValue = formData.sell_price_with_tax
      }
      
      if (field && baseValue > 0) {
        const prices = calculatePrices(baseValue, field, formData.tax, formData.profit_percent)
        setFormData(prev => ({ ...prev, ...prices }))
      }
    }
  }, [formData.tax])

  const fetchProducts = async () => {
    try {
      setLoading(true)
      const token = localStorage.getItem('token')
      const response = await fetch(`/api/products?page=${page}&pageSize=${PAGE_SIZE}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      const data = await response.json()
      if (response.ok) {
        // Eliminar duplicados usando un Map basado en el ID
        const uniqueProductsMap = new Map()
        data.products.forEach((product: Product) => {
          const mappedProduct = {
            ...product,
            price: product.sell_price_inc_tax,
            image: product.image || '/placeholder.svg',
            product_description: product.product_description || null,
            not_for_selling: product.not_for_selling ?? 1,
            tax: (product as any).tax ?? null
          }
          uniqueProductsMap.set(product.id, mappedProduct)
        })
        
        setProducts(Array.from(uniqueProductsMap.values()))
        setTotal(data.total)
      } else {
        console.error('Error fetching products:', data.error)
      }
    } catch (error) {
      console.error('Error fetching products:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = async () => {
    if (!searchTerm.trim()) {
      fetchProducts()
      return
    }

    try {
      setLoading(true)
      const token = localStorage.getItem('token')
      
      const response = await fetch(`/api/products?search=${encodeURIComponent(searchTerm)}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (!response.ok) {
        throw new Error('Error en la búsqueda')
      }

      const data = await response.json()
      
      // Eliminar duplicados usando un Map basado en el ID
      const uniqueProductsMap = new Map()
      if (data.products) {
        data.products.forEach((product: Product) => {
          const mappedProduct = {
            ...product,
            price: product.sell_price_inc_tax,
            image: product.image || '/placeholder.svg',
            product_description: product.product_description || null,
            not_for_selling: product.not_for_selling ?? 1
          }
          uniqueProductsMap.set(product.id, mappedProduct)
        })
      }
      
      setProducts(Array.from(uniqueProductsMap.values()))
    } catch (error) {
      console.error('Error searching products:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleCreateProduct = () => {
    setEditingProduct(null)
    resetForm()
    setIsDialogOpen(true)
  }

  const handleEditProduct = async (product: ExtendedProduct) => {
    setEditingProduct(product)
    
    // Check if this is a combo product
    const productIsCombo = isProductCombo(product)
    setIsEditingCombo(productIsCombo)
    
    if (productIsCombo) {
      // Load combo products
      try {
        const combo = typeof product.combo === 'string' ? JSON.parse(product.combo) : product.combo
        if (Array.isArray(combo)) {
          // Get product details for each combo product ID
          const comboProductDetails = []
          for (const productId of combo) {
            const productDetail = availableProducts.find(p => p.id === productId)
            if (productDetail) {
              comboProductDetails.push({
                ...productDetail,
                selected: true
              })
            }
          }
          setComboProducts(comboProductDetails)
        }
      } catch (error) {
        console.error('Error parsing combo products:', error)
        setComboProducts([])
      }
    } else {
      setComboProducts([])
    }
    
    setFormData({
      id: product.id,
      name: product.name,
      sku: product.sku,
      price: Number(product.price) || 0,
      image: product.image,
      product_description: product.product_description || '',
      not_for_selling: product.not_for_selling ?? 1,
      order_area_id: product.order_area_id ?? null,
      tax: product.tax ?? null,
      purchase_price_without_tax: 0,
      purchase_price_with_tax: 0,
      profit_percent: 25,
      sell_price_without_tax: 0,
      sell_price_with_tax: Number(product.price) || 0
    })
    setImageSource(product.image.startsWith('/media/') ? 'file' : 'url')
    setImagePreview(product.image)
    setIsDialogOpen(true)
  }

  const handleDeleteProduct = async (productId: number) => {
    if (!confirm('¿Estás seguro de que quieres eliminar este producto?')) {
      return
    }

    try {
      const token = localStorage.getItem('token')
      
      const response = await fetch(`/api/products?id=${productId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (!response.ok) {
        throw new Error('Error al eliminar producto')
      }

      await fetchProducts()
    } catch (error) {
      console.error('Error deleting product:', error)
      alert('Error al eliminar el producto')
    }
  }

  const handleImageSourceChange = (value: ImageSource) => {
    setImageSource(value)
    setSelectedFile(null)
    setFormData(prev => ({ ...prev, image: "" }))
    setImagePreview("")
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setSelectedFile(file)
    const reader = new FileReader()
    reader.onloadend = () => {
      setImagePreview(reader.result as string)
    }
    reader.readAsDataURL(file)
  }

  const uploadImage = async (file: File): Promise<string> => {
    try {
      const formData = new FormData()
      formData.append('file', file)
      const token = localStorage.getItem('token')

      if (!token) {
        throw new Error('No se encontró el token de autenticación. Por favor, inicie sesión de nuevo.')
      }

      const response = await fetch('/api/upload-image', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      })

      if (!response.ok) {
        let errorMessage = 'Error al subir la imagen.'
        try {
          const errorData = await response.json()
          errorMessage = errorData.error || errorMessage
        } catch (e) {
          // La respuesta no es JSON, puede ser un error del servidor (HTML, etc.)
          errorMessage = `${errorMessage} (Código: ${response.status})`
        }
        throw new Error(errorMessage)
      }

      const data = await response.json()
      return data.url
    } catch (error) {
      console.error('Error en uploadImage:', error)
      // Re-lanzar el error para que sea atrapado por handleSaveProduct
      throw error
    }
  }

  const handleSaveProduct = async () => {
    if (!formData.name || !formData.sku || formData.sell_price_with_tax <= 0) {
      alert('Por favor completa todos los campos requeridos')
      return
    }

    // Validar la longitud de la URL de la imagen
    if (imageSource === 'url' && formData.image && formData.image.length > 191) {
      alert('La URL de la imagen es demasiado larga (máx. 191 caracteres). Por favor, use una URL más corta o suba la imagen directamente.')
      return
    }

    try {
      setSaving(true)
      const token = localStorage.getItem('token')

      let imageUrl = formData.image
      if (imageSource === 'file' && selectedFile) {
        imageUrl = await uploadImage(selectedFile)
      }

      const url = editingProduct ? '/api/products' : '/api/products'
      const method = editingProduct ? 'PUT' : 'POST'
      
      const requestBody = {
        id: editingProduct?.id,
        name: formData.name,
        sku: formData.sku,
        sell_price_inc_tax: formData.sell_price_with_tax,
        default_sell_price: formData.sell_price_without_tax,
        profit_percent: formData.profit_percent,
        default_purchase_price: formData.purchase_price_without_tax,
        dpp_inc_tax: formData.purchase_price_with_tax,
        image: imageUrl,
        product_description: formData.product_description,
        not_for_selling: formData.not_for_selling,
        order_area_id: formData.order_area_id || null,
        tax: formData.tax,
        combo: editingProduct && (editingProduct as any).combo ? updatedComboIds : undefined
      }
      
      console.log('🔍 Frontend - Datos a enviar:', JSON.stringify(requestBody, null, 2))
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(requestBody)
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Error al guardar producto')
      }

      await fetchProducts()
      setIsDialogOpen(false)
      resetForm()
    } catch (error) {
      console.error('Error saving product:', error)
      alert(error instanceof Error ? error.message : 'Error al guardar el producto')
    } finally {
      setSaving(false)
    }
  }

  const resetForm = () => {
    setFormData({
      name: "",
      sku: "",
      price: 0,
      image: "",
      product_description: "",
      not_for_selling: 1,
      order_area_id: null,
      tax: null,
      purchase_price_without_tax: 0,
      purchase_price_with_tax: 0,
      profit_percent: 25,
      sell_price_without_tax: 0,
      sell_price_with_tax: 0
    })
    setSelectedFile(null)
    setImagePreview("")
    setImageSource("url")
    setUpdatedComboIds([])
  }

  const getTaxName = (taxId: number | null) => {
    if (!taxId) return 'Sin impuesto'
    const taxRate = taxRates.find(tr => tr.id === taxId)
    return taxRate ? taxRate.name : 'Impuesto no encontrado'
  }

  const getTaxRate = (taxId: number | null) => {
    if (!taxId) return null
    return taxRates.find(tr => tr.id === taxId) || null
  }

  const calculatePrices = (baseValue: number, field: string, taxId: number | null, profitPercent: number) => {
    const taxRate = getTaxRate(taxId)
    const taxPercent = taxRate ? taxRate.amount : 0
    
    let purchaseWithoutTax = 0
    let purchaseWithTax = 0
    let sellWithoutTax = 0
    let sellWithTax = 0

    switch (field) {
      case 'purchase_without_tax':
        // Si cambio precio de compra SIN impuesto
        purchaseWithoutTax = baseValue
        // Precio con IVA = valor sin IVA × (1 + tasa_iva)
        purchaseWithTax = baseValue * (1 + taxPercent / 100)
        // Precio de venta sin impuesto = precio compra sin impuesto × (1 + margen)
        sellWithoutTax = purchaseWithoutTax * (1 + profitPercent / 100)
        // Precio de venta con impuesto = precio venta sin impuesto × (1 + tasa_iva)
        sellWithTax = sellWithoutTax * (1 + taxPercent / 100)
        break
        
      case 'purchase_with_tax':
        // Si cambio precio de compra CON impuesto
        purchaseWithTax = baseValue
        // valor sin IVA = valor con IVA ÷ (1 + tasa_iva)
        purchaseWithoutTax = baseValue / (1 + taxPercent / 100)
        sellWithoutTax = purchaseWithoutTax * (1 + profitPercent / 100)
        sellWithTax = sellWithoutTax * (1 + taxPercent / 100)
        break
        
      case 'sell_without_tax':
        // Si cambio precio de venta SIN impuesto
        sellWithoutTax = baseValue
        // Mantener precios de compra sin cambios (solo los cambia el usuario)
        purchaseWithoutTax = formData.purchase_price_without_tax
        purchaseWithTax = formData.purchase_price_with_tax
        // Solo recalcular el precio de venta con impuesto
        sellWithTax = sellWithoutTax * (1 + taxPercent / 100)
        break
        
      case 'sell_with_tax':
        // Si cambio precio de venta CON impuesto
        sellWithTax = baseValue
        // Mantener precios de compra sin cambios (solo los cambia el usuario)
        purchaseWithoutTax = formData.purchase_price_without_tax
        purchaseWithTax = formData.purchase_price_with_tax
        // Solo recalcular el precio de venta sin impuesto
        sellWithoutTax = baseValue / (1 + taxPercent / 100)
        break
        
      case 'profit_percent':
        // Si cambio el margen
        purchaseWithoutTax = formData.purchase_price_without_tax
        purchaseWithTax = purchaseWithoutTax * (1 + taxPercent / 100)
        sellWithoutTax = purchaseWithoutTax * (1 + baseValue / 100)
        sellWithTax = sellWithoutTax * (1 + taxPercent / 100)
        break
    }

    return {
      purchase_price_without_tax: Math.round(purchaseWithoutTax * 100) / 100,
      purchase_price_with_tax: Math.round(purchaseWithTax * 100) / 100,
      sell_price_without_tax: Math.round(sellWithoutTax * 100) / 100,
      sell_price_with_tax: Math.round(sellWithTax * 100) / 100
    }
  }

  // Filter products based on active tab
  const getFilteredProducts = () => {
    const filtered = products.filter(product =>
      product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.sku.toLowerCase().includes(searchTerm.toLowerCase())
    )
    
    if (activeTab === 'products') {
      return filtered.filter(product => !isProductCombo(product))
    } else {
      return filtered.filter(product => isProductCombo(product))
    }
  }

  const filteredProducts = getFilteredProducts()


  return (
    <div className="bg-white p-0">
      <div className="space-y-6 -mt-12">
        {/* Header con diseño mejorado */}
        <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-gray-800 mb-2">Gestión de Productos</h1>
              <p className="text-gray-600">Administra el catálogo de productos y sus precios</p>
            </div>
            
            {/* Search Bar y botones en línea */}
            <div className="flex items-center space-x-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  type="text"
                  placeholder="Buscar productos por nombre o SKU..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                  className="pl-10 pr-4 py-3 border-gray-200 focus:border-purple-500 focus:ring-purple-500 rounded-xl w-64"
                />
              </div>
              
              <Button 
                onClick={handleCreateProduct} 
                className="!bg-purple-600 !hover:bg-purple-700 text-white px-6 py-3 rounded-lg shadow-md hover:shadow-lg transition-all duration-200 font-medium"
              >
                <Plus className="mr-2 h-5 w-5" />
                Nuevo Producto
              </Button>
              <Button 
                onClick={() => setShowComboModal(true)} 
                className="!bg-purple-600 !hover:bg-purple-700 text-white px-6 py-3 rounded-lg shadow-md hover:shadow-lg transition-all duration-200 font-medium"
              >
                <Package className="mr-2 h-5 w-5" />
                Nuevo Combo
              </Button>
            </div>
          </div>
        </div>

        {/* Tabs Navigation */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
          <div className="flex border-b border-gray-100">
            <button
              onClick={() => setActiveTab('products')}
              className={`flex-1 px-6 py-4 text-center font-medium transition-colors duration-200 ${
                activeTab === 'products'
                  ? 'text-purple-600 border-b-2 border-purple-600 bg-purple-50'
                  : 'text-gray-600 hover:text-gray-800 hover:bg-gray-50'
              }`}
            >
              <div className="flex items-center justify-center gap-2">
                <Package className="h-5 w-5" />
                Productos Individuales
                <Badge variant="secondary" className="ml-2">
                  {products.filter(p => !isProductCombo(p)).length}
                </Badge>
              </div>
            </button>
            <button
              onClick={() => setActiveTab('combos')}
              className={`flex-1 px-6 py-4 text-center font-medium transition-colors duration-200 ${
                activeTab === 'combos'
                  ? 'text-purple-600 border-b-2 border-purple-600 bg-purple-50'
                  : 'text-gray-600 hover:text-gray-800 hover:bg-gray-50'
              }`}
            >
              <div className="flex items-center justify-center gap-2">
                <Package className="h-5 w-5" />
                Combos
                <Badge variant="secondary" className="ml-2">
                  {products.filter(p => isProductCombo(p)).length}
                </Badge>
              </div>
            </button>
          </div>
        </div>

        {/* Products List con diseño mejorado */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
          <div className="p-6 border-b border-gray-100">
            <h2 className="text-xl font-semibold text-gray-800">
              {activeTab === 'products' ? 'Productos Individuales' : 'Combos'} ({filteredProducts.length})
            </h2>
            <p className="text-gray-600 mt-1">
              {activeTab === 'products' 
                ? 'Productos individuales disponibles para venta' 
                : 'Combos que incluyen múltiples productos'
              }
            </p>
          </div>
          
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <div className="text-center">
                <Loader2 className="h-12 w-12 animate-spin text-purple-600 mx-auto mb-4" />
                <p className="text-gray-600 font-medium">Cargando productos...</p>
              </div>
            </div>
          ) : filteredProducts.length > 0 ? (
            <div className="divide-y divide-gray-100">
              {filteredProducts.map((product) => (
                <div key={product.id || product.sku} className="group hover:bg-gray-50 transition-colors duration-200">
                  <div className="flex items-center p-6">
                    {/* Imagen del producto mejorada */}
                    <div className="relative w-24 h-24 flex-shrink-0 mr-6">
                      {product.image && product.image !== "/placeholder.svg" ? (
                        <img
                          src={product.image}
                          alt={product.name}
                          className="w-full h-full object-cover rounded-xl shadow-md"
                        />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-gray-200 to-gray-300 rounded-xl shadow-md flex items-center justify-center">
                          <span className="text-gray-400 text-xs font-medium">Sin imagen</span>
                        </div>
                      )}
                      <div className="absolute -top-2 -right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                        <div className="bg-white rounded-full p-1 shadow-lg">
                          <div className={`w-2 h-2 rounded-full ${isProductCombo(product) ? 'bg-orange-500' : 'bg-green-500'}`}></div>
                        </div>
                      </div>
                    </div>
                    
                    {/* Información del producto mejorada */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-2">
                            <h3 className="font-bold text-xl text-gray-800 group-hover:text-purple-600 transition-colors duration-200">
                              {product.name}
                            </h3>
                            {isProductCombo(product) && (
                              <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-200 px-2 py-1 rounded-full text-xs font-medium">
                                Combo
                              </Badge>
                            )}
                          </div>
                          <div className="flex items-center gap-4">
                            <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200 px-3 py-1 rounded-full text-sm font-medium">
                              SKU: {product.sku}
                            </Badge>
                            <div className="flex items-center gap-2 text-sm text-gray-600">
                              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                              <span>Impuesto: {getTaxName(product.tax ?? null)}</span>
                            </div>
                          </div>
                        </div>
                        
                        {/* Precio y botones mejorados */}
                        <div className="flex-shrink-0 ml-6 flex items-center gap-4">
                          <div className="text-right">
                            <span className="font-bold text-2xl text-green-600">
                              {formatPrice(Number(product.price))}
                            </span>
                          </div>
                          
                          <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleEditProduct(product)}
                              className="h-8 w-8 p-0 rounded-full border-gray-200 hover:border-purple-300 hover:bg-purple-50"
                            >
                              <Edit className="h-3 w-3 text-gray-600" />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleDeleteProduct(product.id!)}
                              className="h-8 w-8 p-0 rounded-full border-gray-200 hover:border-red-300 hover:bg-red-50"
                            >
                              <Trash2 className="h-3 w-3 text-red-500" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-16">
              <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Package className="h-12 w-12 text-gray-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-800 mb-2">
                No se encontraron {activeTab === 'products' ? 'productos individuales' : 'combos'}
              </h3>
              <p className="text-gray-600 mb-6">
                {activeTab === 'products' 
                  ? 'Intenta crear un nuevo producto usando el botón "Nuevo Producto"' 
                  : 'Intenta crear un nuevo combo usando el botón "Nuevo Combo"'
                }
              </p>
              <Button 
                onClick={activeTab === 'products' ? handleCreateProduct : () => setShowComboModal(true)}
                className="bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white px-6 py-3 rounded-xl shadow-lg hover:shadow-xl transition-all duration-200"
              >
                <Plus className="mr-2 h-5 w-5" />
                {activeTab === 'products' ? 'Crear Primer Producto' : 'Crear Primer Combo'}
              </Button>
            </div>
          )}
        </div>

        {/* Paginación mejorada */}
        {products.length > 0 && (
          <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
            <div className="flex items-center justify-center gap-4">
              <Button 
                disabled={page === 1} 
                onClick={() => setPage(page - 1)}
                variant="outline"
                className="px-6 py-3 rounded-xl border-gray-200 hover:bg-gray-50 disabled:opacity-50"
              >
                ← Anterior
              </Button>
              <div className="flex items-center gap-2">
                <span className="px-4 py-2 bg-purple-100 text-purple-700 rounded-lg font-medium">
                  Página {page}
                </span>
                <span className="text-gray-500">de {Math.ceil(total / PAGE_SIZE)}</span>
              </div>
              <Button 
                disabled={products.length < PAGE_SIZE} 
                onClick={() => setPage(page + 1)}
                variant="outline"
                className="px-6 py-3 rounded-xl border-gray-200 hover:bg-gray-50 disabled:opacity-50"
              >
                Siguiente →
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Product Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingProduct ? 'Editar Producto' : 'Nuevo Producto'}
            </DialogTitle>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Nombre *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Nombre del producto"
                className="w-full"
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="sku">SKU *</Label>
              <Input
                id="sku"
                value={formData.sku}
                onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                placeholder="SKU del producto"
                className="w-full"
              />
            </div>

            {/* Show combo products if editing a combo */}
            {editingProduct && (editingProduct as any).combo && (
              <ComboProductEditor
                productId={editingProduct.id!}
                comboData={(editingProduct as any).combo}
                productName={editingProduct.name}
                onComboChange={(updatedIds) => setUpdatedComboIds(updatedIds)}
              />
            )}

            {/* Only show regular product form if not a combo */}
            {!(editingProduct as any)?.combo && (
              <>
                {/* Configuración de Impuesto */}
                <div className="grid gap-2">
                  <Label htmlFor="tax">Impuesto aplicable</Label>
                  <select
                    id="tax"
                    value={formData.tax ?? ''}
                    onChange={e => setFormData({ ...formData, tax: e.target.value ? Number(e.target.value) : null })}
                    className="border rounded px-2 py-1 w-full"
                  >
                    <option value="">Sin impuesto</option>
                    {taxRates.map(taxRate => (
                      <option key={taxRate.id} value={taxRate.id}>{taxRate.name}</option>
                    ))}
                  </select>
                </div>

                {/* Configuración de Precios */}
                <div className="space-y-4 p-4 bg-gray-50 rounded-lg">
                  <h3 className="font-semibold text-gray-800 mb-3">Configuración de Precios</h3>
                  
                  {/* Precio de Compra */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="grid gap-2">
                      <Label htmlFor="purchase_without_tax">Precio de compra sin impuesto</Label>
                      <Input
                        id="purchase_without_tax"
                        type="number"
                        step="0.01"
                        value={formData.purchase_price_without_tax || ''}
                        onChange={(e) => {
                          const value = e.target.value === '' ? 0 : parseFloat(e.target.value) || 0
                          const prices = calculatePrices(value, 'purchase_without_tax', formData.tax, formData.profit_percent)
                          setFormData({ ...formData, ...prices, purchase_price_without_tax: value })
                        }}
                        placeholder="0.00"
                        className="w-full"
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="purchase_with_tax">Precio de compra con impuesto</Label>
                      <Input
                        id="purchase_with_tax"
                        type="number"
                        step="0.01"
                        value={formData.purchase_price_with_tax || ''}
                        onChange={(e) => {
                          const value = e.target.value === '' ? 0 : parseFloat(e.target.value) || 0
                          const prices = calculatePrices(value, 'purchase_with_tax', formData.tax, formData.profit_percent)
                          setFormData({ ...formData, ...prices, purchase_price_with_tax: value })
                        }}
                        placeholder="0.00"
                        className="w-full"
                      />
                    </div>
                  </div>

                  {/* Margen */}
                  <div className="grid gap-2">
                    <Label htmlFor="profit_percent">Margen (%)</Label>
                    <Input
                      id="profit_percent"
                      type="number"
                      step="0.01"
                      value={formData.profit_percent || ''}
                      onChange={(e) => {
                        const value = e.target.value === '' ? 0 : parseFloat(e.target.value) || 0
                        const prices = calculatePrices(value, 'profit_percent', formData.tax, value)
                        setFormData({ ...formData, ...prices, profit_percent: value })
                      }}
                      placeholder="25.00"
                      className="w-full"
                    />
                  </div>

                  {/* Precio de Venta */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="grid gap-2">
                      <Label htmlFor="sell_without_tax">Precio de venta sin impuesto</Label>
                      <Input
                        id="sell_without_tax"
                        type="number"
                        step="0.01"
                        value={formData.sell_price_without_tax || ''}
                        onChange={(e) => {
                          const value = e.target.value === '' ? 0 : parseFloat(e.target.value) || 0
                          const prices = calculatePrices(value, 'sell_without_tax', formData.tax, formData.profit_percent)
                          setFormData({ ...formData, ...prices, sell_price_without_tax: value })
                        }}
                        placeholder="0.00"
                        className="w-full"
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="sell_with_tax">Precio de venta con impuesto *</Label>
                      <Input
                        id="sell_with_tax"
                        type="number"
                        step="0.01"
                        value={formData.sell_price_with_tax || ''}
                        onChange={(e) => {
                          const value = e.target.value === '' ? 0 : parseFloat(e.target.value) || 0
                          const prices = calculatePrices(value, 'sell_with_tax', formData.tax, formData.profit_percent)
                          setFormData({ ...formData, ...prices, sell_price_with_tax: value, price: value })
                        }}
                        placeholder="0.00"
                        required
                        className="w-full"
                      />
                    </div>
                  </div>
                </div>
              </>
            )}

            <div className="grid gap-2">
              <Label>Imagen del Producto</Label>
              <RadioGroup value={imageSource} onValueChange={(value: ImageSource) => handleImageSourceChange(value)}>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="file" id="file" />
                  <Label htmlFor="file" className="flex items-center gap-2">
                    <ImageIcon size={16} />
                    Subir Imagen
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="url" id="url" />
                  <Label htmlFor="url" className="flex items-center gap-2">
                    <Link size={16} />
                    URL de Imagen
                  </Label>
                </div>
              </RadioGroup>

              {imageSource === 'file' ? (
                <div className="grid gap-2">
                                  <Input
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="w-full"
                />
                  {imagePreview && (
                    <div className="relative aspect-square w-full max-w-[200px] mx-auto">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={imagePreview}
                        alt="Preview"
                        className="rounded-md object-cover w-full h-full"
                      />
                    </div>
                  )}
                </div>
              ) : (
                <Input
                  value={formData.image}
                  onChange={(e) => setFormData({ ...formData, image: e.target.value })}
                  placeholder="URL de la imagen"
                  className="w-full"
                />
              )}
            </div>

            <div className="grid gap-2">
              <Label htmlFor="description">Descripción</Label>
              <Textarea
                id="description"
                value={formData.product_description}
                onChange={(e) => setFormData({ ...formData, product_description: e.target.value })}
                placeholder="Descripción del producto"
                className="w-full"
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="area">Área</Label>
              <select
                id="area"
                value={formData.order_area_id ?? ''}
                onChange={e => setFormData({ ...formData, order_area_id: e.target.value ? Number(e.target.value) : null })}
                className="border rounded px-2 py-1 w-full"
              >
                <option value="">General</option>
                {areas.map(area => (
                  <option key={area.id} value={area.id}>{area.name}</option>
                ))}
              </select>
            </div>


          </div>

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSaveProduct} disabled={saving}>
              {saving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Guardando...
                </>
              ) : (
                'Guardar'
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Combo Modal */}
      <Dialog open={showComboModal} onOpenChange={setShowComboModal}>
        <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Nuevo Combo</DialogTitle>
          </DialogHeader>
          <ComboManagement modalMode={true} />
        </DialogContent>
      </Dialog>
    </div>
  )
} 