"use client"

import { useRouter } from "next/navigation"
import { Minus, Plus, ShoppingCart, Trash2, Search, ChevronDown, ChevronUp } from "lucide-react"
import { useEffect, useState } from "react"

import { Button } from "@/components/ui/button"
import { useCart } from "../context/cart-context"
import { formatPrice } from "@/lib/format-price"

type CartSidebarProps = {
  searchQuery: string;
  setSearchQuery: (value: string) => void;
}

export default function CartSidebar({ searchQuery, setSearchQuery }: CartSidebarProps) {
  const router = useRouter()
  const { cart, removeFromCart, updateQuantity, cartTotal, itemCount, isLoading } = useCart()
  const [expandedCombos, setExpandedCombos] = useState<Set<number>>(new Set())
  const [comboProducts, setComboProducts] = useState<{[key: number]: any[]}>({})
  
  console.log('🛒 CartSidebar - Estado del carrito:', cart)
  console.log('🛒 CartSidebar - Cantidad de items:', itemCount)
  console.log('🛒 CartSidebar - Total del carrito:', cartTotal)
  console.log('🛒 CartSidebar - isLoading:', isLoading)

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

  const handleCheckout = () => {
    if (cart.length === 0) return
    
    // Guardar el pedido en localStorage antes de ir a table-checkout
    const tempOrder = {
      tableId: 0,
      tableNumber: 0,
      items: cart.map(item => ({
        id: item.id!,
        name: item.name,
        price: item.sell_price_inc_tax,
        quantity: item.quantity,
        image: item.image || "",
        order_area_id: item.order_area_id || null
      })),
      total: cart.reduce((total, item) => total + item.sell_price_inc_tax * item.quantity, 0)
    }
    
    localStorage.setItem("temp-checkout-order", JSON.stringify(tempOrder))
    router.push("/table-checkout")
  }

  return (
    <div className="flex w-80 flex-col border-l border-border bg-card/50 backdrop-blur-sm">
      {/* Header del carrito */}
      <div className="flex items-center justify-between border-b border-border p-6 bg-gradient-to-r from-primary/5 to-secondary/5">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary/10 rounded-lg">
            <ShoppingCart className="h-5 w-5 text-primary" />
          </div>
          <h2 className="text-xl font-bold text-foreground">Cart</h2>
        </div>
        <div className="flex items-center gap-2">
          <span className="rounded-full bg-primary px-3 py-1 text-xs font-bold text-primary-foreground shadow-lg">
            {itemCount} items
          </span>
        </div>
      </div>
      {/* Barra de búsqueda funcional */}
      <div className="px-6 pt-4 pb-2">
        <div className="relative w-full">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar productos..."
            className="pl-10 pr-4 py-2 rounded-lg border border-gray-200 bg-white text-sm focus:border-primary focus:ring-1 focus:ring-primary/20 w-full"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {/* Contenido del carrito */}
      <div className="flex-1 overflow-auto p-6">
        {isLoading ? (
          <div className="flex h-full flex-col items-center justify-center text-center">
            <div className="w-16 h-16 border-4 border-primary/20 border-t-primary rounded-full animate-spin mb-4"></div>
            <h3 className="font-semibold text-foreground mb-2">Cargando productos...</h3>
            <p className="text-sm text-muted-foreground">Espera un momento</p>
          </div>
        ) : cart.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center text-center">
            <div className="w-20 h-20 bg-accent/30 rounded-full flex items-center justify-center mb-4">
              <ShoppingCart className="h-10 w-10 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold text-foreground mb-2">Your cart is empty</h3>
            <p className="text-sm text-muted-foreground">Add items to get started</p>
          </div>
        ) : (
          <div className="space-y-2">
            {cart.map((item, index) => (
              <div key={item.id || index} className="group bg-card border border-border rounded-lg p-2 hover:border-primary/30 hover:shadow-sm transition-all duration-300">
                <div className="flex gap-2">
                  <div className="h-10 w-10 flex-shrink-0 overflow-hidden rounded-md border border-border group-hover:border-primary/30 transition-colors">
                    <img src={item.image || "/placeholder.svg"} alt={item.name} className="h-full w-full object-cover" />
                  </div>
                  <div className="flex flex-1 flex-col">
                    <div className="flex justify-between items-start mb-1">
                      <div className="flex items-center gap-2">
                        <h3 className="font-medium text-foreground text-sm line-clamp-1 group-hover:text-primary transition-colors">
                          {item.name}
                        </h3>
                        {isProductCombo(item) && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-4 w-4 p-0 text-muted-foreground hover:text-primary transition-colors"
                            onClick={() => toggleComboExpansion(item.id!, item.combo)}
                          >
                            {expandedCombos.has(item.id!) ? (
                              <ChevronUp className="h-3 w-3" />
                            ) : (
                              <ChevronDown className="h-3 w-3" />
                            )}
                          </Button>
                        )}
                      </div>
                      <p className="font-bold text-primary text-sm">
                        {formatPrice(Number(item.sell_price_inc_tax) * item.quantity)}
                      </p>
                    </div>
                    <p className="text-xs text-muted-foreground mb-2">
                      {formatPrice(Number(item.sell_price_inc_tax))} each
                    </p>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1 bg-accent/30 rounded-md p-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 hover:bg-primary hover:text-primary-foreground transition-colors"
                          onClick={() => updateQuantity(item.id!, item.quantity - 1)}
                        >
                          <Minus className="h-3 w-3" />
                        </Button>
                        <span className="w-6 text-center font-bold text-foreground text-xs">{item.quantity}</span>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 hover:bg-primary hover:text-primary-foreground transition-colors"
                          onClick={() => updateQuantity(item.id!, item.quantity + 1)}
                        >
                          <Plus className="h-3 w-3" />
                        </Button>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                        onClick={() => removeFromCart(item.id!)}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                </div>
                
                {/* Combo products expanded view */}
                {isProductCombo(item) && expandedCombos.has(item.id!) && (
                  <div className="mt-3 pt-3 border-t border-border/50">
                    <div className="space-y-2">
                      <h4 className="text-xs font-medium text-muted-foreground mb-2">Productos incluidos:</h4>
                      {comboProducts[item.id!] ? (
                        comboProducts[item.id!].map((comboProduct: any, comboIndex: number) => (
                          <div key={comboIndex} className="flex items-center gap-2 pl-4">
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
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Footer con total y checkout */}
      <div className="border-t border-border p-6 bg-gradient-to-r from-accent/20 to-accent/10">
        <div className="mb-6 space-y-3">
          <div className="flex justify-between items-center p-3 bg-card rounded-lg border border-border">
            <p className="font-medium text-foreground">Subtotal</p>
                            <p className="font-bold text-primary text-lg">{formatPrice(cartTotal)}</p>
          </div>
          <div className="flex justify-between items-center p-3 bg-primary/10 rounded-lg border border-primary/20">
            <p className="font-bold text-foreground">Total</p>
                            <p className="font-bold text-primary text-xl">{formatPrice(cartTotal)}</p>
          </div>
        </div>
        <Button 
          className="w-full bg-gradient-to-r from-primary to-secondary hover:from-primary/90 hover:to-secondary/90 text-primary-foreground font-bold py-4 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 disabled:opacity-50" 
          size="lg" 
          disabled={cart.length === 0} 
          onClick={handleCheckout}
        >
          Checkout Presencial
        </Button>
      </div>
    </div>
  )
}
