"use client"

import type React from "react"
import { useEffect, useState } from "react"
import Image from "next/image"
import { PlusCircle, GripVertical } from "lucide-react"

import { Card, CardContent } from "../../components/ui/card"
import { useCart } from "../context/cart-context"
import type { Product } from "../../lib/services/product-service"
import { formatPrice } from "../../lib/format-price"

// Eliminar la declaración local de Product para evitar conflicto
// interface Product {
//   id: number;
//   name: string;
//   category_id: number;
//   // ...otros campos existentes
// }

interface ProductGridProps {
  category: string
  searchQuery: string
  compact?: boolean
  onProductClick?: (product: Product) => void
}

export default function ProductGrid({ category, searchQuery, compact = false, onProductClick }: ProductGridProps) {
  const { addToCart } = useCart()
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 9

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true)
        const token = localStorage.getItem('token')
        
        console.log('🔑 Token encontrado:', !!token)
        
        if (!token) {
          setError('No hay token de autenticación')
          return
        }

        console.log('📡 Haciendo petición a /api/products...')
        const response = await fetch('/api/products?pageSize=1000', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        })

        console.log('📊 Respuesta del servidor:', response.status, response.ok)

        if (!response.ok) {
          const errorText = await response.text()
          console.error('❌ Error response:', response.status, errorText)
          throw new Error(`Error al obtener productos: ${response.status}`)
        }

        const data = await response.json()
        console.log('📦 Datos recibidos:', data)
        console.log('📋 Productos en respuesta:', data.products?.length || 0)
        
        // Eliminar duplicados usando un Map basado en el ID
        const uniqueProductsMap = new Map()
        if (data.products) {
          data.products.forEach((product: Product) => {
            uniqueProductsMap.set(product.id, product)
          })
        }
        
        const finalProducts = Array.from(uniqueProductsMap.values())
        console.log('🛒 Productos finales:', finalProducts.length)
        setProducts(finalProducts)
      } catch (err) {
        console.error('❌ Error fetching products:', err)
        setError('Error al cargar productos')
      } finally {
        setLoading(false)
      }
    }

    fetchProducts()
  }, [])

  // Filtrar productos por categoría seleccionada
  const filteredProducts = products.filter((product) => {
    if (category === 'all') return true;
    if (category === 'otros') {
      // Mostrar productos sin category_id
      return !('category_id' in product) || product.category_id === null || product.category_id === undefined;
    }
    // Forzar acceso dinámico para category_id
    return String((product as any)['category_id']) === String(category);
  }).filter((product) =>
    product.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Calcular paginación
  const totalPages = Math.ceil(filteredProducts.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const paginatedProducts = filteredProducts.slice(startIndex, endIndex)

  // Resetear página cuando cambie la categoría o búsqueda
  useEffect(() => {
    setCurrentPage(1)
  }, [category, searchQuery])

  console.log("PRODUCTOS:", products);
  console.log("CATEGORÍA SELECCIONADA:", category);
  console.log("FILTRADOS:", filteredProducts);
  console.log("LOADING:", loading);
  console.log("ERROR:", error);

  const handleDragStart = (e: React.DragEvent, product: Product) => {
    if (!e) return // Safety check

    e.dataTransfer.setData("application/json", JSON.stringify(product))
    e.dataTransfer.effectAllowed = "copy"

    // Add visual feedback - with error handling
    try {
      const dragImage = new (window.Image as any)()
      dragImage.src = product.image || "/placeholder.svg"
      e.dataTransfer.setDragImage(dragImage, 25, 25)
    } catch (error) {
      console.warn("Could not set drag image:", error)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-muted-foreground">Cargando productos...</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-red-500">{error}</div>
      </div>
    )
  }

  if (compact) {
    return (
      <>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-3 gap-2 sm:gap-3">
          {paginatedProducts.map((product) => (
          <Card
            key={product.id}
            className="glass-card overflow-hidden hover-lift cursor-grab active:cursor-grabbing group border-0"
            draggable
            onDragStart={(e) => {
              e.preventDefault = e.preventDefault || (() => {})
              handleDragStart(e, product)
            }}
            onClick={() => onProductClick ? onProductClick(product) : addToCart({ ...product, order_area_id: product.order_area_id ?? null })}
          >
            <div className="relative aspect-square bg-gradient-to-br from-accent/20 to-accent/10">
              <div className="absolute inset-0 flex items-center justify-center bg-primary/30 opacity-0 transition-all duration-300 group-hover:opacity-100 z-10 backdrop-blur-sm">
                <div className="flex items-center gap-2 bg-white/20 backdrop-blur-sm rounded-full px-3 py-1.5">
                  <GripVertical className="h-4 w-4 text-white" />
                  <PlusCircle className="h-4 w-4 text-white" />
                </div>
              </div>
              {product.image && product.image !== "/placeholder.svg" && product.image !== "" && (
                <Image 
                  src={product.image} 
                  alt={product.name} 
                  fill 
                  className="object-cover transition-transform duration-300 group-hover:scale-110"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.style.display = 'none';
                  }}
                />
              )}
            </div>
            <CardContent className="p-3 bg-gradient-to-b from-white/90 to-white/70">
              <div className="space-y-1">
                <h3 className="font-medium text-sm line-clamp-1 text-foreground group-hover:text-primary transition-colors">
                  {product.name}
                </h3>
                <p className="text-sm font-bold gradient-text">
                  {formatPrice(Number(product.sell_price_inc_tax) || 0)}
                </p>
              </div>
            </CardContent>
          </Card>
        ))}

        {filteredProducts.length === 0 && (
          <div className="col-span-full py-8 text-center">
            <div className="glass-card p-6 max-w-sm mx-auto">
              <div className="w-12 h-12 bg-accent/30 rounded-full flex items-center justify-center mx-auto mb-3">
                <GripVertical className="h-6 w-6 text-muted-foreground" />
              </div>
              <p className="text-muted-foreground text-sm">No se encontraron productos</p>
            </div>
          </div>
        )}
        </div>
        
        {/* Controles de paginación */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 mt-4">
            <button
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
              className="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Anterior
            </button>
            <span className="text-sm text-gray-600">
              Página {currentPage} de {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
              disabled={currentPage === totalPages}
              className="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Siguiente
            </button>
          </div>
        )}
      </>
    )
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 sm:gap-4 p-4 sm:p-6">
      {filteredProducts.map((product) => (
        <Card
          key={product.id}
          className="glass-card overflow-hidden hover-lift cursor-grab active:cursor-grabbing group border-0 relative"
          draggable
          onDragStart={(e) => {
            e.preventDefault = e.preventDefault || (() => {})
            handleDragStart(e, product)
          }}
          onClick={() => onProductClick ? onProductClick(product) : addToCart({ ...product, order_area_id: product.order_area_id ?? null })}
        >
          {/* Efecto de brillo en hover */}
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent transform -skew-x-12 transition-transform duration-700 opacity-0 group-hover:opacity-100 group-hover:translate-x-full z-10" />
          
          <div className="relative aspect-square bg-gradient-to-br from-accent/20 to-accent/10 overflow-hidden">
            <div className="absolute inset-0 flex items-center justify-center bg-primary/30 opacity-0 transition-all duration-300 group-hover:opacity-100 z-20 backdrop-blur-sm">
              <div className="flex items-center gap-2 bg-white/20 backdrop-blur-sm rounded-full px-4 py-2 shadow-lg">
                <GripVertical className="h-5 w-5 text-white" />
                <PlusCircle className="h-5 w-5 text-white" />
              </div>
            </div>
            {product.image && product.image !== "/placeholder.svg" && product.image !== "" && (
              <Image 
                src={product.image} 
                alt={product.name} 
                fill 
                className="object-cover transition-transform duration-300 group-hover:scale-110"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.style.display = 'none';
                }}
              />
            )}
          </div>
          <CardContent className="p-4 bg-gradient-to-b from-white/95 to-white/85 relative z-10">
            <div className="space-y-2">
              <h3 className="font-semibold text-sm line-clamp-2 text-foreground group-hover:text-primary transition-colors">
                {product.name}
              </h3>
              <div className="flex items-center justify-between">
                <p className="text-sm font-bold gradient-text">
                  {formatPrice(Number(product.sell_price_inc_tax) || 0)}
                </p>
                <div className="w-2 h-2 bg-primary rounded-full opacity-0 group-hover:opacity-100 transition-all duration-300 group-hover:scale-150"></div>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}

      {filteredProducts.length === 0 && (
        <div className="col-span-full py-16 text-center">
          <div className="max-w-md mx-auto">
            <div className="glass-card p-8">
              <div className="w-16 h-16 bg-gradient-to-br from-accent/30 to-accent/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <GripVertical className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-semibold gradient-text mb-2">No se encontraron productos</h3>
              <p className="text-muted-foreground text-sm">Intenta cambiar la categoría o el término de búsqueda</p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
