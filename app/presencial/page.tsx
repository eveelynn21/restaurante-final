"use client"

import { useState } from "react"
import { Search, ShoppingCart, User, LayoutDashboard } from "lucide-react"
import { Input } from "../../components/ui/input"
import { Button } from "../../components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "../../components/ui/dialog"
import { Label } from "../../components/ui/label"
import ProductGrid from "../components/product-grid"
import CategorySidebar from "../components/category-sidebar"
import { useCart } from "../context/cart-context"
import { useRouter } from "next/navigation"
import { formatPrice } from "../../lib/format-price"

export default function PresencialPage() {
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("all")
  const [customerInfo, setCustomerInfo] = useState({
    name: "",
    phone: "",
  })
  const [showCustomerDialog, setShowCustomerDialog] = useState(false)

  const { cart, removeFromCart, updateQuantity, cartTotal, itemCount, clearCart } = useCart()
  const router = useRouter()

  const handleCheckout = () => {
    if (cart.length === 0) return
    setShowCustomerDialog(true)
  }

  const handleConfirmOrder = () => {
    if (!customerInfo.name || !customerInfo.phone) return

    // Crear pedido presencial
    const order = {
      customerInfo,
      items: cart,
      total: cartTotal,
      tax: cartTotal * 0.1,
      grandTotal: cartTotal * 1.1,
      orderType: "presencial",
      receiptNumber: Math.floor(100000 + Math.random() * 900000),
      date: new Date().toLocaleString(),
      status: "pending",
    }

    // Guardar pedido
    localStorage.setItem("presencial-order", JSON.stringify(order))

    // Limpiar carrito y cerrar dialog
    clearCart()
    setShowCustomerDialog(false)
    setCustomerInfo({ name: "", phone: "" })

    // Redirigir a página de confirmación
    router.push("/presencial-success")
  }

  return (
    <div className="flex h-screen bg-background">
      {/* Sidebar de Categorías */}
      <CategorySidebar selectedCategory={selectedCategory} onSelectCategory={setSelectedCategory} categories={[
        { id: "all", name: "Todos" },
        { id: "1", name: "Bebidas" },
        { id: "2", name: "Platos Principales" },
        { id: "3", name: "Postres" },
        { id: "4", name: "Entradas" },
        { id: "otros", name: "Otros" }
      ]} isOpen={true} />

      {/* Contenido Principal */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden">
        {/* Header */}
        <div className="sticky top-0 z-10 glass-effect p-3 border-b border-white/20">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <h1 className="text-2xl font-bold gradient-text">Point of Sale</h1>
              <div className="w-px h-6 bg-gradient-to-b from-transparent via-primary/30 to-transparent"></div>
            </div>
            <div className="relative w-64">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar productos..."
                className="pl-10 glass-effect border-white/30 focus:border-primary/50 focus:ring-primary/20"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => router.push("/dashboard")}
                className="glass-effect border-white/30 hover:border-primary/50 hover:bg-primary/10 text-primary hover:text-primary font-medium"
              >
                <LayoutDashboard className="mr-2 h-4 w-4" />
                Dashboard
              </Button>
            </div>
          </div>
        </div>

        {/* Grid de Productos */}
        <div className="flex-1 overflow-auto p-3">
          <ProductGrid category={selectedCategory} searchQuery={searchQuery} compact={false} />
        </div>
      </main>

      {/* Sidebar del Carrito */}
      <div className="flex w-72 flex-col glass-effect border-l border-white/20">
        <div className="flex items-center justify-between border-b border-white/20 p-3">
          <h2 className="flex items-center text-lg font-semibold gradient-text">
            <ShoppingCart className="mr-2 h-5 w-5" />
            Carrito
          </h2>
          <span className="rounded-full gradient-bg px-3 py-1 text-xs font-medium text-white shadow-lg">
            {itemCount} items
          </span>
        </div>

        <div className="flex-1 overflow-auto p-3">
          {cart.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center text-center">
              <div className="glass-card p-6 rounded-2xl mb-4">
                <ShoppingCart className="mb-2 h-12 w-12 text-muted-foreground" />
              </div>
              <h3 className="font-medium gradient-text">Tu carrito está vacío</h3>
              <p className="text-sm text-muted-foreground">Agrega productos para comenzar</p>
            </div>
          ) : (
            <div className="space-y-3">
              {cart.map((item) => (
                <div key={item.id} className="glass-card p-3 rounded-xl border border-white/20">
                  <div className="flex gap-3">
                    <div className="h-16 w-16 flex-shrink-0 overflow-hidden rounded-lg border border-white/20">
                      <img
                        src={item.image || "/placeholder.svg"}
                        alt={item.name}
                        className="h-full w-full object-cover"
                      />
                    </div>
                    <div className="flex flex-1 flex-col">
                      <div className="flex justify-between">
                        <h3 className="font-medium line-clamp-1 text-foreground">{item.name}</h3>
                        <p className="font-bold gradient-text">{formatPrice((item.sell_price_inc_tax || 0) * (item.quantity || 0))}</p>
                      </div>
                      <p className="text-sm text-muted-foreground mb-3">{formatPrice(item.sell_price_inc_tax || 0)} cada uno</p>
                      <div className="mt-auto flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="icon"
                            className="h-7 w-7 glass-effect border-white/30 hover:border-primary/50"
                            onClick={() => item.id && updateQuantity(item.id, (item.quantity || 0) - 1)}
                          >
                            -
                          </Button>
                          <span className="w-8 text-center font-medium">{item.quantity || 0}</span>
                          <Button
                            variant="outline"
                            size="icon"
                            className="h-7 w-7 glass-effect border-white/30 hover:border-primary/50"
                            onClick={() => item.id && updateQuantity(item.id, (item.quantity || 0) + 1)}
                          >
                            +
                          </Button>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-muted-foreground hover:text-destructive"
                          onClick={() => item.id && removeFromCart(item.id)}
                        >
                          ×
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="border-t border-white/20 p-3">
          <div className="mb-4 space-y-2">
            <div className="flex justify-between">
              <p className="text-muted-foreground">Subtotal</p>
              <p className="font-medium">{formatPrice(cartTotal || 0)}</p>
            </div>
            <div className="flex justify-between font-bold">
              <p className="gradient-text">Total</p>
              <p className="gradient-text">{formatPrice(cartTotal || 0)}</p>
            </div>
          </div>

          <Dialog open={showCustomerDialog} onOpenChange={setShowCustomerDialog}>
            <DialogTrigger asChild>
              <Button 
                className="w-full gradient-bg hover:shadow-lg transition-all duration-300 text-white font-semibold py-3 rounded-xl" 
                size="lg" 
                disabled={cart.length === 0} 
                onClick={handleCheckout}
              >
                <ShoppingCart className="mr-2 h-5 w-5" />
                Checkout Presencial
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Información del Cliente
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="customer-name">Nombre *</Label>
                  <Input
                    id="customer-name"
                    placeholder="Tu nombre completo"
                    value={customerInfo.name}
                    onChange={(e) => setCustomerInfo({ ...customerInfo, name: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="customer-phone">Teléfono *</Label>
                  <Input
                    id="customer-phone"
                    placeholder="+57 300 123 4567"
                    value={customerInfo.phone}
                    onChange={(e) => setCustomerInfo({ ...customerInfo, phone: e.target.value })}
                  />
                </div>
                <div className="text-sm text-muted-foreground">
                  Te enviaremos una notificación cuando tu pedido esté listo para recoger.
                </div>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setShowCustomerDialog(false)} className="flex-1">
                  Cancelar
                </Button>
                <Button
                  onClick={handleConfirmOrder}
                  disabled={!customerInfo.name || !customerInfo.phone}
                  className="flex-1"
                >
                  Confirmar Pedido
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>
    </div>
  )
}
