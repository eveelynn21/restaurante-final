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
import { formatPrice } from "../../lib/format-price"

interface ComboProduct {
  id: number
  name: string
  sku: string
  price_without_tax: number
  quantity: number
}

interface ComboFormData {
  id?: number
  name: string
  sku: string
  image: string
  description: string
  products: ComboProduct[]
  tax: number | null
  profit_percent: number
  total_price_without_tax: number
  total_price_with_tax: number
}

interface TaxRate {
  id: number
  name: string
  amount: number
}

type ImageSource = 'file' | 'url'

const PAGE_SIZE = 1000

interface ComboManagementProps {
  modalMode?: boolean
}

export default function ComboManagement({ modalMode = false }: ComboManagementProps) {
  const [combos, setCombos] = useState<any[]>([])
  const [products, setProducts] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingCombo, setEditingCombo] = useState<any | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [imageSource, setImageSource] = useState<ImageSource>('url')
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string>('')
  const [taxRates, setTaxRates] = useState<TaxRate[]>([])
  const [formData, setFormData] = useState<ComboFormData>({
    name: "",
    sku: "",
    image: "",
    description: "",
    products: [],
    tax: null,
    profit_percent: 25,
    total_price_without_tax: 0,
    total_price_with_tax: 0,
  })

  useEffect(() => {
    if (!modalMode) {
      fetchCombos()
    }
    fetchProducts()
    fetchTaxRates()
  }, [modalMode])

  const fetchCombos = async () => {
    try {
      setLoading(true)
      const token = localStorage.getItem('token')
      const response = await fetch(`/api/products?page=1&pageSize=${PAGE_SIZE}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      const data = await response.json()
      if (response.ok) {
        // Filtrar solo los productos que son combos (tienen campo combo)
        const combosOnly = (data.products || []).filter((product: any) => 
          product.combo && Array.isArray(product.combo) && product.combo.length > 0
        )
        setCombos(combosOnly)
      } else {
        console.error('Error fetching combos:', data.error)
      }
    } catch (error) {
      console.error('Error fetching combos:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchProducts = async () => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`/api/products?page=1&pageSize=${PAGE_SIZE}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      const data = await response.json()
      if (response.ok) {
        setProducts(data.products || [])
      }
    } catch (error) {
      console.error('Error fetching products:', error)
    }
  }

  const fetchTaxRates = async () => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch('/api/tax-rates', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      const data = await response.json()
      if (response.ok) {
        setTaxRates(data.data || [])
      }
    } catch (error) {
      console.error('Error fetching tax rates:', error)
    }
  }

  const handleCreateCombo = () => {
    setEditingCombo(null)
    resetForm()
    setIsDialogOpen(true)
  }

  const handleEditCombo = (combo: any) => {
    setEditingCombo(combo)
    
    // Calcular campos de variations basándose en sell_price_inc_tax
    const variationsFields = calculateVariationsFields(
      combo.sell_price_inc_tax || 0, 
      combo.tax, 
      combo.profit_percent || 25
    )
    
    setFormData({
      id: combo.id,
      name: combo.name,
      sku: combo.sku,
      image: combo.image || '',
      description: combo.description || '',
      products: combo.products || [],
      tax: combo.tax,
      profit_percent: combo.profit_percent || 25,
      total_price_without_tax: variationsFields.default_sell_price,
      total_price_with_tax: combo.sell_price_inc_tax || 0,
    })
    setImageSource(combo.image?.startsWith('/media/') ? 'file' : 'url')
    setImagePreview(combo.image || '')
    setIsDialogOpen(true)
  }

  const handleDeleteCombo = async (comboId: number) => {
    if (!confirm('¿Estás seguro de que quieres eliminar este combo?')) {
      return
    }

    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`/api/products`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ id: comboId })
      })

      if (response.ok) {
        await fetchCombos()
      } else {
        const errorData = await response.json()
        alert(errorData.error || 'Error al eliminar combo')
      }
    } catch (error) {
      console.error('Error deleting combo:', error)
      alert('Error al eliminar combo')
    }
  }

  const handleImageSourceChange = (value: ImageSource) => {
    setImageSource(value)
    if (value === 'url') {
      setSelectedFile(null)
      setImagePreview('')
    } else {
      setFormData(prev => ({ ...prev, image: '' }))
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setSelectedFile(file)
    const reader = new FileReader()
    reader.onload = (e) => {
      setImagePreview(e.target?.result as string)
    }
    reader.readAsDataURL(file)
  }

  const uploadImage = async (file: File): Promise<string> => {
    const formData = new FormData()
    formData.append('image', file)

    const token = localStorage.getItem('token')
    const response = await fetch('/api/upload-image', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`
      },
      body: formData
    })

    if (!response.ok) {
      throw new Error('Error uploading image')
    }

    const data = await response.json()
    return data.url
  }

  const addProductToCombo = () => {
    setFormData(prev => ({
      ...prev,
      products: [...prev.products, {
        id: 0,
        name: '',
        sku: '',
        price_without_tax: 0,
        quantity: 1
      }]
    }))
  }

  const removeProductFromCombo = (index: number) => {
    setFormData(prev => ({
      ...prev,
      products: prev.products.filter((_, i) => i !== index)
    }))
  }

  const updateProductInCombo = (index: number, field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      products: prev.products.map((product, i) => 
        i === index ? { ...product, [field]: value } : product
      )
    }))
  }

  const calculateComboPrice = () => {
    const totalWithoutTax = formData.products.reduce((sum, product) => {
      return sum + (product.price_without_tax * product.quantity)
    }, 0)

    const taxRate = taxRates.find(tr => tr.id === formData.tax)
    const taxPercent = taxRate ? taxRate.amount : 0

    const priceWithMargin = totalWithoutTax * (1 + formData.profit_percent / 100)
    const priceWithTax = priceWithMargin * (1 + taxPercent / 100)

    setFormData(prev => ({
      ...prev,
      total_price_without_tax: Math.round(priceWithMargin * 100) / 100,
      total_price_with_tax: Math.round(priceWithTax * 100) / 100
    }))
  }

  useEffect(() => {
    calculateComboPrice()
  }, [formData.products, formData.profit_percent, formData.tax])

  const handleSaveCombo = async () => {
    if (!formData.name || !formData.sku || formData.products.length === 0) {
      alert('Por favor completa todos los campos requeridos')
      return
    }

    try {
      setSaving(true)
      const token = localStorage.getItem('token')

      let imageUrl = formData.image
      if (imageSource === 'file' && selectedFile) {
        imageUrl = await uploadImage(selectedFile)
      }

      const url = editingCombo ? '/api/products' : '/api/products'
      const method = editingCombo ? 'PUT' : 'POST'
      
      // Extraer los IDs de los productos del combo
      const comboProductIds = formData.products.map(product => product.id).filter(id => id > 0)
      
      // Calcular campos de variations
      const variationsFields = calculateVariationsFields(
        formData.total_price_with_tax, 
        formData.tax, 
        formData.profit_percent
      )
      
      const requestBody = {
        id: editingCombo?.id,
        name: formData.name,
        sku: formData.sku,
        image: imageUrl,
        product_description: formData.description,
        sell_price_inc_tax: formData.total_price_with_tax,
        default_sell_price: variationsFields.default_sell_price,
        profit_percent: variationsFields.profit_percent,
        default_purchase_price: variationsFields.default_purchase_price,
        dpp_inc_tax: variationsFields.dpp_inc_tax,
        tax: formData.tax,
        combo: comboProductIds, // Array de IDs de productos que forman el combo
      }
      
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
        throw new Error(errorData.error || 'Error al guardar combo')
      }

      if (modalMode) {
        window.location.reload()
      } else {
        await fetchCombos()
        setIsDialogOpen(false)
      }
      resetForm()
    } catch (error) {
      console.error('Error saving combo:', error)
      alert(error instanceof Error ? error.message : 'Error al guardar el combo')
    } finally {
      setSaving(false)
    }
  }

  const resetForm = () => {
    setFormData({
      name: "",
      sku: "",
      image: "",
      description: "",
      products: [],
      tax: null,
      profit_percent: 25,
      total_price_without_tax: 0,
      total_price_with_tax: 0,
    })
    setSelectedFile(null)
    setImagePreview("")
    setImageSource("url")
  }

  const getTaxName = (taxId: number | null) => {
    if (!taxId) return 'Sin impuesto'
    const taxRate = taxRates.find(tr => tr.id === taxId)
    return taxRate ? taxRate.name : 'Impuesto no encontrado'
  }

  // Función para calcular campos de variations basándose en sell_price_inc_tax
  const calculateVariationsFields = (sellPriceIncTax: number, taxId: number | null, profitPercent: number = 25) => {
    const taxRate = taxRates.find(tr => tr.id === taxId)
    const taxPercent = taxRate ? taxRate.amount : 0
    
    // Precio de venta sin impuesto = precio con impuesto ÷ (1 + tasa_impuesto)
    const defaultSellPrice = sellPriceIncTax / (1 + taxPercent / 100)
    
    // Precio de compra sin impuesto = precio venta sin impuesto ÷ (1 + margen)
    const defaultPurchasePrice = defaultSellPrice / (1 + profitPercent / 100)
    
    // Precio de compra con impuesto = precio compra sin impuesto × (1 + tasa_impuesto)
    const dppIncTax = defaultPurchasePrice * (1 + taxPercent / 100)
    
    return {
      default_sell_price: Math.round(defaultSellPrice * 100) / 100,
      profit_percent: profitPercent,
      default_purchase_price: Math.round(defaultPurchasePrice * 100) / 100,
      dpp_inc_tax: Math.round(dppIncTax * 100) / 100
    }
  }

  const filteredCombos = combos.filter(combo =>
    combo.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    combo.sku.toLowerCase().includes(searchTerm.toLowerCase())
  )

  // Si está en modo modal, solo mostrar el formulario
  if (modalMode) {
    return (
      <div className="space-y-6">
        <div className="grid gap-4">
          {/* Nombre del Combo */}
          <div className="grid gap-2">
            <Label htmlFor="name">Nombre del Combo *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Nombre del combo"
              className="w-full"
            />
          </div>

          {/* SKU del Combo */}
          <div className="grid gap-2">
            <Label htmlFor="sku">SKU del Combo *</Label>
            <Input
              id="sku"
              value={formData.sku}
              onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
              placeholder="SKU del combo"
              className="w-full"
            />
          </div>

          {/* Descripción */}
          <div className="grid gap-2">
            <Label htmlFor="description">Descripción</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Descripción del combo"
              className="w-full"
            />
          </div>

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

          {/* Productos del Combo */}
          <div className="grid gap-2">
            <div className="flex items-center justify-between">
              <Label>Productos del Combo</Label>
              <Button onClick={addProductToCombo} size="sm" className="bg-purple-600 hover:bg-purple-700">
                <Plus className="mr-1 h-3 w-3" />
                Agregar Producto
              </Button>
            </div>
            
            <div className="border rounded p-4 bg-gray-50 min-h-[100px]">
              {formData.products.length === 0 ? (
                <p className="text-gray-500 text-center py-4">No hay productos agregados</p>
              ) : (
                <div className="space-y-2">
                  {formData.products.map((product, index) => (
                    <div key={index} className="grid grid-cols-12 gap-2 items-center p-2 bg-white rounded border">
                      <div className="col-span-4">
                        <select
                          value={product.id}
                          onChange={(e) => {
                            const selectedProduct = products.find(p => p.id === Number(e.target.value))
                            updateProductInCombo(index, 'id', Number(e.target.value))
                            if (selectedProduct) {
                              updateProductInCombo(index, 'name', selectedProduct.name)
                              updateProductInCombo(index, 'sku', selectedProduct.sku)
                              // Usar el precio sin impuesto del producto
                              updateProductInCombo(index, 'price_without_tax', selectedProduct.default_sell_price || 0)
                            }
                          }}
                          className="w-full border rounded px-2 py-1 text-sm"
                        >
                          <option value="">Seleccionar producto</option>
                          {products.map((p, pIndex) => (
                            <option key={`product-${p.id}-${pIndex}`} value={p.id}>{p.name}</option>
                          ))}
                        </select>
                      </div>
                      <div className="col-span-2">
                        <Input
                          type="number"
                          value={product.quantity}
                          onChange={(e) => updateProductInCombo(index, 'quantity', Number(e.target.value))}
                          placeholder="Cantidad"
                          className="w-full text-sm"
                        />
                      </div>
                      <div className="col-span-4">
                        <span className="text-sm text-gray-600">
                          {formatPrice(product.price_without_tax * product.quantity)}
                        </span>
                      </div>
                      <div className="col-span-2">
                        <Button
                          onClick={() => removeProductFromCombo(index)}
                          size="sm"
                          variant="destructive"
                          className="h-8 w-8 p-0"
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

                             {/* Precios del Combo */}
               <div className="grid grid-cols-2 gap-4 mt-4 p-4 bg-white rounded border">
                 <div>
                   <Label className="text-sm font-medium">Precio de compra sin impuesto</Label>
                   <div className="text-lg font-bold text-gray-800">
                     {(() => {
                       const variationsFields = calculateVariationsFields(
                         formData.total_price_with_tax, 
                         formData.tax, 
                         formData.profit_percent
                       )
                       return formatPrice(variationsFields.default_purchase_price)
                     })()}
                   </div>
                 </div>
                 <div>
                   <Label className="text-sm font-medium">Precio de compra con impuesto</Label>
                   <div className="text-lg font-bold text-orange-600">
                     {(() => {
                       const variationsFields = calculateVariationsFields(
                         formData.total_price_with_tax, 
                         formData.tax, 
                         formData.profit_percent
                       )
                       return formatPrice(variationsFields.dpp_inc_tax)
                     })()}
                   </div>
                 </div>
               </div>

               {/* Campos de Variations Calculados */}
               <div className="grid grid-cols-2 gap-4 mt-4 p-4 bg-blue-50 rounded border">
                 <div>
                   <Label className="text-sm font-medium text-blue-700">Precio de venta sin impuesto</Label>
                   <div className="text-lg font-bold text-blue-800">
                     {formatPrice(formData.total_price_without_tax)}
                   </div>
                 </div>
                 <div>
                   <Label className="text-sm font-medium text-blue-700">Precio de venta con impuesto</Label>
                   <div className="text-lg font-bold text-blue-600">
                     {formatPrice(formData.total_price_with_tax)}
                   </div>
                 </div>
               </div>
            </div>
          </div>

          {/* Imagen del Combo */}
          <div className="grid gap-2">
            <Label>Imagen del Combo</Label>
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
        </div>

        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => modalMode ? window.location.reload() : setIsDialogOpen(false)}>
            Cancelar
          </Button>
          <Button onClick={handleSaveCombo} disabled={saving} className="bg-orange-600 hover:bg-orange-700">
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
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        {/* Search Bar */}
        <div className="flex items-center space-x-2 max-w-md">
          <Input
            type="text"
            placeholder="Buscar combos por nombre o SKU..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="flex-1"
          />
          <Button onClick={() => setSearchTerm('')} variant="outline">
            <Search className="h-4 w-4" />
          </Button>
        </div>
        
        <Button onClick={handleCreateCombo} className="bg-orange-600 hover:bg-orange-700">
          <Plus className="mr-2 h-4 w-4" />
          Nuevo Combo
        </Button>
      </div>

      {/* Combos Grid */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin" />
          <span className="ml-2">Cargando combos...</span>
        </div>
      ) : combos.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredCombos.map((combo) => (
            <Card key={combo.id || combo.sku} className="overflow-hidden">
              <div className="aspect-square relative">
                <img
                  src={combo.image || "/placeholder.svg"}
                  alt={combo.name}
                  className="w-full h-full object-cover"
                />
                <div className="absolute top-2 left-2">
                  <Badge className="bg-orange-500 text-white">COMBO</Badge>
                </div>
                <div className="absolute top-2 right-2 flex gap-1">
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => handleEditCombo(combo)}
                    className="h-8 w-8 p-0"
                  >
                    <Edit className="h-3 w-3" />
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => handleDeleteCombo(combo.id!)}
                    className="h-8 w-8 p-0"
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </div>
              <CardContent className="p-4">
                <div className="space-y-2">
                  <h3 className="font-semibold line-clamp-1">{combo.name}</h3>
                  <div className="flex items-center justify-between">
                    <Badge variant="outline" className="text-xs">
                      {combo.sku}
                    </Badge>
                    <span className="font-bold text-orange-600">
                      {formatPrice(combo.total_price_with_tax || 0)}
                    </span>
                  </div>
                  <div className="text-xs text-gray-500">
                    {combo.products?.length || 0} productos
                  </div>
                  <div className="text-xs text-gray-500">
                    Impuesto: {getTaxName(combo.tax)}
                  </div>
                  {/* Mostrar campos de variations calculados */}
                  {(() => {
                    const variationsFields = calculateVariationsFields(
                      combo.sell_price_inc_tax || 0, 
                      combo.tax, 
                      combo.profit_percent || 25
                    )
                    return (
                      <>
                        <div className="text-xs text-gray-500">
                          Margen: {variationsFields.profit_percent}%
                        </div>
                        <div className="text-xs text-gray-500">
                          Sin IVA: {formatPrice(variationsFields.default_sell_price)}
                        </div>
                      </>
                    )
                  })()}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No hay combos</h3>
          <p className="text-gray-500 mb-4">Crea tu primer combo para empezar</p>
          <Button onClick={handleCreateCombo} className="bg-orange-600 hover:bg-orange-700">
            <Plus className="mr-2 h-4 w-4" />
            Crear Combo
          </Button>
        </div>
      )}

      {/* Combo Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingCombo ? 'Editar Combo' : 'Nuevo Combo'}
            </DialogTitle>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Nombre del Combo *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Nombre del combo"
                className="w-full"
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="sku">SKU del Combo *</Label>
              <Input
                id="sku"
                value={formData.sku}
                onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                placeholder="SKU del combo"
                className="w-full"
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="description">Descripción</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Descripción del combo"
                className="w-full"
              />
            </div>

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

            {/* Productos del Combo */}
            <div className="space-y-4 p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-gray-800">Productos del Combo</h3>
                <Button onClick={addProductToCombo} size="sm" className="bg-orange-600 hover:bg-orange-700">
                  <Plus className="h-4 w-4 mr-1" />
                  Agregar Producto
                </Button>
              </div>

              {formData.products.map((product, index) => (
                <div key={index} className="grid grid-cols-12 gap-2 items-center p-3 bg-white rounded border">
                  <div className="col-span-4">
                    <select
                      value={product.id}
                      onChange={(e) => {
                        const selectedProduct = products.find(p => p.id === Number(e.target.value))
                        updateProductInCombo(index, 'id', Number(e.target.value))
                        if (selectedProduct) {
                          updateProductInCombo(index, 'name', selectedProduct.name)
                          updateProductInCombo(index, 'sku', selectedProduct.sku)
                          // Usar el precio sin impuesto del producto
                          updateProductInCombo(index, 'price_without_tax', selectedProduct.default_sell_price || 0)
                        }
                      }}
                      className="border rounded px-2 py-1 w-full text-sm"
                    >
                      <option value="">Seleccionar producto</option>
                      {products.map((p, pIndex) => (
                        <option key={`product-${p.id}-${pIndex}`} value={p.id}>{p.name}</option>
                      ))}
                    </select>
                  </div>
                  <div className="col-span-2">
                    <Input
                      type="number"
                      step="0.01"
                      value={product.price_without_tax}
                      onChange={(e) => updateProductInCombo(index, 'price_without_tax', parseFloat(e.target.value) || 0)}
                      placeholder="Precio"
                      className="w-full text-sm"
                    />
                  </div>
                  <div className="col-span-2">
                    <Input
                      type="number"
                      min="1"
                      value={product.quantity}
                      onChange={(e) => updateProductInCombo(index, 'quantity', parseInt(e.target.value) || 1)}
                      placeholder="Cantidad"
                      className="w-full text-sm"
                    />
                  </div>
                  <div className="col-span-2">
                    <span className="text-sm font-medium">
                      {formatPrice(product.price_without_tax * product.quantity)}
                    </span>
                  </div>
                  <div className="col-span-2">
                    <Button
                      onClick={() => removeProductFromCombo(index)}
                      size="sm"
                      variant="destructive"
                      className="h-8 w-8 p-0"
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              ))}

              {/* Precios del Combo */}
              <div className="grid grid-cols-2 gap-4 mt-4 p-4 bg-white rounded border">
                <div>
                  <Label className="text-sm font-medium">Precio de compra sin impuesto</Label>
                  <div className="text-lg font-bold text-gray-800">
                    {(() => {
                      const variationsFields = calculateVariationsFields(
                        formData.total_price_with_tax, 
                        formData.tax, 
                        formData.profit_percent
                      )
                      return formatPrice(variationsFields.default_purchase_price)
                    })()}
                  </div>
                </div>
                <div>
                  <Label className="text-sm font-medium">Precio de compra con impuesto</Label>
                  <div className="text-lg font-bold text-orange-600">
                    {(() => {
                      const variationsFields = calculateVariationsFields(
                        formData.total_price_with_tax, 
                        formData.tax, 
                        formData.profit_percent
                      )
                      return formatPrice(variationsFields.dpp_inc_tax)
                    })()}
                  </div>
                </div>
              </div>

              {/* Campos de Variations Calculados */}
              <div className="grid grid-cols-2 gap-4 mt-4 p-4 bg-blue-50 rounded border">
                <div>
                  <Label className="text-sm font-medium text-blue-700">Precio de venta sin impuesto</Label>
                  <div className="text-lg font-bold text-blue-800">
                    {formatPrice(formData.total_price_without_tax)}
                  </div>
                </div>
                <div>
                  <Label className="text-sm font-medium text-blue-700">Precio de venta con impuesto</Label>
                  <div className="text-lg font-bold text-blue-600">
                    {formatPrice(formData.total_price_with_tax)}
                  </div>
                </div>
              </div>
            </div>

            {/* Imagen del Combo */}
            <div className="grid gap-2">
              <Label>Imagen del Combo</Label>
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
          </div>

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSaveCombo} disabled={saving} className="bg-orange-600 hover:bg-orange-700">
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
    </div>
  )
} 