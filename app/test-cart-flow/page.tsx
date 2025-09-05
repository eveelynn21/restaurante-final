"use client"

import { useState, useEffect } from "react"
import { Button } from "../../components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card"
import { useCart } from "../context/cart-context"

export default function TestCartFlowPage() {
  const { cart, cartTotal, clearCart } = useCart()
  const [localStorageData, setLocalStorageData] = useState<any>(null)

  useEffect(() => {
    // Verificar localStorage cada segundo
    const interval = setInterval(() => {
      const savedCart = localStorage.getItem("cart")
      const tempOrder = localStorage.getItem("temp-checkout-order")
      
      setLocalStorageData({
        cart: savedCart ? JSON.parse(savedCart) : null,
        tempOrder: tempOrder ? JSON.parse(tempOrder) : null
      })
    }, 1000)

    return () => clearInterval(interval)
  }, [])

  const addTestProduct = () => {
    const testProduct = {
      id: 1,
      sku: "TEST-001",
      name: "Producto de Prueba",
      sell_price_inc_tax: 15.99,
      image: "/placeholder.svg",
      quantity: 1
    }
    
    // Simular agregar al carrito
    const currentCart = JSON.parse(localStorage.getItem("cart") || "[]")
    currentCart.push(testProduct)
    localStorage.setItem("cart", JSON.stringify(currentCart))
  }

  const simulateCheckout = () => {
    if (cart.length === 0) return
    
    const tempOrder = {
      tableId: 0,
      tableNumber: 0,
      items: cart.map(item => ({
        id: item.id!,
        name: item.name,
        price: item.sell_price_inc_tax,
        quantity: item.quantity,
        image: item.image || ""
      })),
      total: cart.reduce((total, item) => total + item.sell_price_inc_tax * item.quantity, 0)
    }
    
    localStorage.setItem("temp-checkout-order", JSON.stringify(tempOrder))
  }

  const clearAll = () => {
    clearCart()
    localStorage.removeItem("temp-checkout-order")
  }

  return (
    <div className="container mx-auto max-w-4xl py-8">
      <h1 className="text-3xl font-bold mb-6">Prueba del Flujo del Carrito</h1>
      
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Carrito Actual</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {cart.map((item, index) => (
                <div key={index} className="flex justify-between">
                  <span>{item.name}</span>
                  <span>${item.sell_price_inc_tax} × {item.quantity}</span>
                </div>
              ))}
              <div className="border-t pt-2 font-bold">
                Total: ${cartTotal.toFixed(2)}
              </div>
            </div>
            
            <div className="mt-4 space-y-2">
              <Button onClick={addTestProduct} className="w-full">
                Agregar Producto de Prueba
              </Button>
              <Button onClick={simulateCheckout} className="w-full" disabled={cart.length === 0}>
                Simular Checkout
              </Button>
              <Button onClick={clearAll} variant="outline" className="w-full">
                Limpiar Todo
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>localStorage</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <h4 className="font-semibold">Carrito en localStorage:</h4>
                <pre className="text-xs bg-gray-100 p-2 rounded mt-1 overflow-auto">
                  {JSON.stringify(localStorageData?.cart, null, 2)}
                </pre>
              </div>
              
              <div>
                <h4 className="font-semibold">Temp Order en localStorage:</h4>
                <pre className="text-xs bg-gray-100 p-2 rounded mt-1 overflow-auto">
                  {JSON.stringify(localStorageData?.tempOrder, null, 2)}
                </pre>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
} 