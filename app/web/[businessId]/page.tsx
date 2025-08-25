"use client"

import type React from "react"
import { useState, useEffect, use, useMemo, useRef } from "react"
import {
  ShoppingCart,
  Star,
  Clock,
  Truck,
  Phone,
  MapPin,
  Instagram,
  Facebook,
  Twitter,
  X,
  Plus,
  Minus,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { useCart } from "../../context/cart-context"
import Image from "next/image"
import { useRouter } from "next/navigation"
import { formatPrice } from "@/lib/format-price"

interface WebConfig {
  heroTitle: string
  heroSubtitle: string
  heroDescription: string
  heroButtonText: string
  heroSecondaryButtonText: string
  companyName: string
  companySlogan: string
  companyLogo: string
  phone: string
  address: string
  promoTitle: string
  promoDescription: string
  promoDiscount: string
  promoButtonText: string
  primaryColor: string
  secondaryColor: string
  accentColor: string
  feature1Title: string
  feature1Description: string
  feature2Title: string
  feature2Description: string
  feature3Title: string
  feature3Description: string
}

const defaultConfig: WebConfig = {
  heroTitle: "Sabores que Conquistan",
  heroSubtitle: "Sabor que conquista",
  heroDescription:
    "Descubre una experiencia culinaria única con ingredientes frescos y sabores auténticos que despertarán todos tus sentidos.",
  heroButtonText: "🛒 Pedir Ahora",
  heroSecondaryButtonText: "📱 Ver Menú",
  companyName: "DeliciousEats",
  companySlogan: "Sabor que conquista",
  companyLogo: "🍕",
  phone: "+57 300 123 4567",
  address: "Calle 123 #45-67, Bogotá, Colombia",
  promoTitle: "¡50% OFF en tu Primer Pedido!",
  promoDescription:
    "Únete a nuestra familia y disfruta de un descuento increíble en tu primera orden. ¡No te lo pierdas!",
  promoDiscount: "50%",
  promoButtonText: "🎯 Reclamar Oferta",
  primaryColor: "#f97316",
  secondaryColor: "#dc2626",
  accentColor: "#7c3aed",
  feature1Title: "Entrega Rápida",
  feature1Description: "En 30 minutos o menos",
  feature2Title: "Abierto 24/7",
  feature2Description: "Siempre disponible para ti",
  feature3Title: "Calidad Premium",
  feature3Description: "Ingredientes frescos diarios",
}

export default function WebPage({ params }: { params: Promise<{ businessId: string }> }) {
  const resolvedParams = use(params)
  const businessId = typeof resolvedParams === 'object' && resolvedParams !== null ? resolvedParams.businessId : undefined
  const { addToCart, removeFromCart, updateQuantity, cart, cartTotal, itemCount, clearCart } = useCart()
  const [selectedCategory, setSelectedCategory] = useState("all")
  const [config, setConfig] = useState<WebConfig>(defaultConfig)
  const [isCartOpen, setIsCartOpen] = useState(false)
  const router = useRouter()
  const [products, setProducts] = useState<any[]>([])
  const [loadingProducts, setLoadingProducts] = useState(true)
  const [errorProducts, setErrorProducts] = useState<string | null>(null)

  // Eliminar categorías estáticas y crear categorías dinámicamente a partir de los productos
  const [categories, setCategories] = useState<{ id: string; name: string }[]>([])

  // Load config from localStorage
  useEffect(() => {
    const savedConfig = localStorage.getItem("web-config")
    if (savedConfig) {
      try {
        setConfig(JSON.parse(savedConfig))
      } catch (error) {
        console.error("Error loading config:", error)
      }
    }
  }, [])

  useEffect(() => {
    async function fetchProducts() {
      setLoadingProducts(true)
      setErrorProducts(null)
      try {
        console.log('businessId:', businessId)
        if (!businessId) {
          setErrorProducts('No se encontró el negocio (businessId)');
          setLoadingProducts(false);
          return;
        }
        const res = await fetch(`/api/products/public?businessId=${businessId}&pageSize=1000`)
        if (!res.ok) {
          const errorData = await res.json()
          throw new Error(errorData.error || 'Error al obtener productos')
        }
        const data = await res.json()
        
        console.log('Respuesta de la API:', data)
        
        // Filtrar productos duplicados por id antes de guardar
        const uniqueProducts = Array.from(new Map((data.products || []).map((p: any) => [p.id, p])).values())
        
        // Asegurar que todos los productos tengan un precio válido
        const productsWithPrices = uniqueProducts.map((product: any) => ({
          ...product,
          sell_price_inc_tax: Number(product.sell_price_inc_tax || product.price || 0),
          image: product.image && product.image.trim() !== '' ? product.image : '/placeholder.svg'
        }))
        
        console.log('Productos cargados:', productsWithPrices.length)
        setProducts(productsWithPrices)
      } catch (err: any) {
        console.error('Error cargando productos:', err)
        setErrorProducts(err.message || 'Error al obtener productos')
      } finally {
        setLoadingProducts(false)
      }
    }
    if (businessId) fetchProducts()
  }, [businessId])

  // Obtener categorías igual que el POS
  useEffect(() => {
    async function fetchCategories() {
      if (!businessId) return;
      try {
        const res = await fetch(`/api/products/categories?businessId=${businessId}`)
        if (!res.ok) throw new Error('Error al obtener categorías')
        const data = await res.json()
        // Formato: [{ category: string, products: [] }]
        const cats = data.categories
          .filter((cat: any) => Array.isArray(cat.products) && cat.products.length > 0 && cat.products[0].category_id)
          .map((cat: any) => ({
            id: String(cat.products[0].category_id),
            name: cat.category
          }))
        setCategories([{ id: 'all', name: 'Todos' }, ...cats, { id: 'otros', name: 'OTROS' }])
      } catch (err) {
        setCategories([{ id: 'all', name: 'Todos' }, { id: 'otros', name: 'OTROS' }])
      }
    }
    fetchCategories()
  }, [businessId])

  // Filtrar productos igual que el POS
  const filteredProducts = useMemo(() => {
    if (selectedCategory === 'all') return products;
    if (selectedCategory === 'otros') {
      return products.filter((product) => !product.category_id)
    }
    return products.filter((product) => String(product.category_id) === String(selectedCategory))
  }, [products, selectedCategory])

  // Función helper para asignar emojis a categorías
  function getCategoryEmoji(categoryName: string): string {
    const categoryLower = categoryName.toLowerCase()
    if (categoryLower.includes('bebida') || categoryLower.includes('drink') || categoryLower.includes('soda')) return '🥤'
    if (categoryLower.includes('comida') || categoryLower.includes('food') || categoryLower.includes('plato')) return '🍽️'
    if (categoryLower.includes('postre') || categoryLower.includes('dessert') || categoryLower.includes('dulce')) return '🍰'
    if (categoryLower.includes('entrada') || categoryLower.includes('appetizer')) return '🥗'
    if (categoryLower.includes('pizza')) return '🍕'
    if (categoryLower.includes('hamburguesa') || categoryLower.includes('burger')) return '🍔'
    if (categoryLower.includes('café') || categoryLower.includes('coffee')) return '☕'
    if (categoryLower.includes('cerveza') || categoryLower.includes('beer')) return '🍺'
    if (categoryLower.includes('vino') || categoryLower.includes('wine')) return '🍷'
    return '🍽️'
  }

  // Mostrar todos los productos sin filtrar por categoría
  // const filteredProducts = products;

  console.log("PRODUCTOS FILTRADOS:", filteredProducts.length, "para categoría:", selectedCategory)

  // Log cuando cambia selectedCategory
  useEffect(() => {
    console.log("selectedCategory CAMBIÓ A:", selectedCategory)
  }, [selectedCategory])

  const handleCheckout = () => {
    router.push("/web-checkout")
  }

  const scrollToMenu = () => {
    document.getElementById("menu")?.scrollIntoView({ behavior: "smooth" })
  }

  // Obtener 12 productos aleatorios para 'Nuestros Favoritos'
  function getRandomProducts(arr: any[], n: number) {
    if (!Array.isArray(arr)) return [];
    const shuffled = arr.slice().sort(() => 0.5 - Math.random());
    return shuffled.slice(0, n);
  }
  const featuredProducts = getRandomProducts(products, 12);

  // Filtrar productos duplicados por id antes de renderizar
  const uniqueFilteredProducts = Array.from(
    new Map(filteredProducts.map(p => [p.id, p])).values()
  );

  // Lógica de estado y filtrado para el buscador (solo frontend)
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [filterCategory, setFilterCategory] = useState("");
  const [filterAvailability, setFilterAvailability] = useState("");
  const [filterPrice, setFilterPrice] = useState("");

  const filteredSearchResults = useMemo(() => {
    let results = products;
    if (searchQuery.length > 0) {
      results = results.filter(p =>
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (p.category_name || '').toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    if (filterCategory) {
      results = results.filter(p => String(p.category_id) === String(filterCategory));
    }
    if (filterAvailability) {
      if (filterAvailability === 'disponible') results = results.filter(p => p.not_for_selling !== 0);
      if (filterAvailability === 'nodisponible') results = results.filter(p => p.not_for_selling === 0);
    }
    if (filterPrice) {
      if (filterPrice === 'low') results = results.filter(p => Number(p.sell_price_inc_tax) < 10);
      if (filterPrice === 'mid') results = results.filter(p => Number(p.sell_price_inc_tax) >= 10 && Number(p.sell_price_inc_tax) <= 20);
      if (filterPrice === 'high') results = results.filter(p => Number(p.sell_price_inc_tax) > 20);
    }
    return results.slice(0, 8); // Limita autosuggest
  }, [products, searchQuery, filterCategory, filterAvailability, filterPrice]);

  function handleSelectProduct(product) {
    setSelectedProduct(product);
    setSearchQuery("");
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-lg border-b border-white/20 shadow-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center"
                style={{ background: `linear-gradient(to right, ${config.primaryColor}, ${config.secondaryColor})` }}
              >
                <span className="text-white font-bold text-xl">{config.companyLogo}</span>
              </div>
              <div>
                <h1
                  className="text-2xl font-bold bg-clip-text text-transparent"
                  style={{
                    backgroundImage: `linear-gradient(to right, ${config.primaryColor}, ${config.secondaryColor})`,
                  }}
                >
                  {config.companyName}
                </h1>
                <p className="text-xs text-gray-500">{config.companySlogan}</p>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              <div className="hidden md:flex items-center space-x-6 text-sm">
                <button onClick={scrollToMenu} className="text-gray-600 hover:text-orange-600 transition-colors">
                  Menú
                </button>
                <a href="#about" className="text-gray-600 hover:text-orange-600 transition-colors">
                  Nosotros
                </a>
                <a href="#contact" className="text-gray-600 hover:text-orange-600 transition-colors">
                  Contacto
                </a>
              </div>

              <Button
                onClick={() => setIsCartOpen(true)}
                className="relative text-white shadow-lg"
                style={{ background: `linear-gradient(to right, ${config.primaryColor}, ${config.secondaryColor})` }}
              >
                <ShoppingCart className="w-4 h-4 mr-2" />
                Carrito
                {itemCount > 0 && (
                  <Badge className="absolute -top-2 -right-2 bg-red-500 text-white text-xs px-1.5 py-0.5">
                    {itemCount}
                  </Badge>
                )}
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Cart Sidebar */}
      {isCartOpen && (
        <div className="fixed inset-0 z-50 overflow-hidden">
          <div className="absolute inset-0 bg-black/50" onClick={() => setIsCartOpen(false)}></div>
          <div className="absolute right-0 top-0 h-full w-96 bg-white shadow-xl">
            <div className="flex flex-col h-full">
              {/* Cart Header */}
              <div className="flex items-center justify-between p-4 border-b">
                <h2 className="text-lg font-semibold flex items-center">
                  <ShoppingCart className="mr-2 h-5 w-5" />
                  Carrito
                </h2>
                <div className="flex items-center gap-2">
                  <Badge variant="outline">{itemCount} items</Badge>
                  <Button variant="ghost" size="sm" onClick={() => setIsCartOpen(false)}>
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {/* Cart Content */}
              <div className="flex-1 overflow-auto p-4">
                {cart.length === 0 ? (
                  <div className="flex h-full flex-col items-center justify-center text-center">
                    <ShoppingCart className="mb-4 h-12 w-12 text-muted-foreground" />
                    <h3 className="font-medium">Tu carrito está vacío</h3>
                    <p className="text-sm text-muted-foreground">Agrega productos para comenzar</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {cart.map((item) => (
                      <div key={item.id} className="flex gap-3 p-3 border rounded-lg">
                        <div className="h-16 w-16 flex-shrink-0 overflow-hidden rounded-md border">
                          <img
                            src={item.image || "/placeholder.svg"}
                            alt={item.name}
                            className="h-full w-full object-cover"
                          />
                        </div>
                        <div className="flex flex-1 flex-col">
                          <div className="flex justify-between">
                            <h3 className="font-medium line-clamp-1">{item.name}</h3>
                            <p className="font-medium">{formatPrice(item.sell_price_inc_tax * item.quantity)}</p>
                          </div>
                          <p className="text-sm text-muted-foreground">{formatPrice(item.sell_price_inc_tax)} c/u</p>
                          <div className="mt-auto flex items-center justify-between">
                            <div className="flex items-center">
                              <Button
                                variant="outline"
                                size="icon"
                                className="h-7 w-7"
                                onClick={() => updateQuantity(Number(item.id), (item.quantity ?? 1) - 1)}
                              >
                                <Minus className="h-3 w-3" />
                              </Button>
                              <span className="w-8 text-center">{item.quantity}</span>
                              <Button
                                variant="outline"
                                size="icon"
                                className="h-7 w-7"
                                onClick={() => updateQuantity(Number(item.id), (item.quantity ?? 1) + 1)}
                              >
                                <Plus className="h-3 w-3" />
                              </Button>
                            </div>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 text-red-500"
                              onClick={() => removeFromCart(Number(item.id))}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Cart Footer */}
              {cart.length > 0 && (
                <div className="border-t p-4">
                  <div className="mb-4 space-y-2">
                    <div className="flex justify-between">
                      <p>Subtotal</p>
                      <p>${cartTotal.toFixed(2)}</p>
                    </div>
                    <div className="flex justify-between font-medium text-lg">
                      <p>Total</p>
                      <p>${cartTotal.toFixed(2)}</p>
                    </div>
                  </div>
                  <Button
                    className="w-full mb-2"
                    size="lg"
                    onClick={handleCheckout}
                    style={{
                      background: `linear-gradient(to right, ${config.primaryColor}, ${config.secondaryColor})`,
                    }}
                  >
                    Realizar Pedido
                  </Button>
                  <Button variant="outline" className="w-full" onClick={() => setIsCartOpen(false)}>
                    Seguir Comprando
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div
          className="absolute inset-0 opacity-20"
          style={{ background: `linear-gradient(to right, ${config.primaryColor}, ${config.secondaryColor})` }}
        ></div>
        <div className="container mx-auto px-4 py-20 relative">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-8">
              <div className="space-y-4">
                <Badge
                  className="px-4 py-2 text-sm font-medium text-white"
                  style={{ backgroundColor: config.primaryColor }}
                >
                  🔥 ¡Nuevos sabores disponibles!
                </Badge>
                <h1 className="text-5xl lg:text-7xl font-bold leading-tight">
                  <span className="bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 bg-clip-text text-transparent">
                    Sabores que
                  </span>
                  <br />
                  <span
                    className="bg-clip-text text-transparent"
                    style={{
                      backgroundImage: `linear-gradient(to right, ${config.primaryColor}, ${config.secondaryColor})`,
                    }}
                  >
                    {config.heroTitle.split(" ").slice(-1)[0]}
                  </span>
                </h1>
                <p className="text-xl text-gray-600 leading-relaxed max-w-lg">{config.heroDescription}</p>
              </div>

              <div className="flex flex-col sm:flex-row gap-4">
                <Button
                  size="lg"
                  onClick={scrollToMenu}
                  className="text-white px-8 py-4 text-lg shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-105"
                  style={{ background: `linear-gradient(to right, ${config.primaryColor}, ${config.secondaryColor})` }}
                >
                  {config.heroButtonText}
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  onClick={scrollToMenu}
                  className="border-2 border-gray-300 hover:border-orange-500 px-8 py-4 text-lg transition-all duration-300"
                >
                  {config.heroSecondaryButtonText}
                </Button>
              </div>

              <div className="flex items-center space-x-8 pt-4">
                <div className="flex items-center space-x-2">
                  <div className="flex -space-x-2">
                    {[1, 2, 3, 4].map((i) => (
                      <div
                        key={i}
                        className="w-8 h-8 rounded-full border-2 border-white"
                        style={{
                          background: `linear-gradient(to right, ${config.primaryColor}, ${config.secondaryColor})`,
                        }}
                      ></div>
                    ))}
                  </div>
                  <span className="text-sm text-gray-600">+2,500 clientes felices</span>
                </div>
                <div className="flex items-center space-x-1">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                  ))}
                  <span className="text-sm text-gray-600 ml-2">4.9/5</span>
                </div>
              </div>
            </div>

            <div className="relative">
              <div
                className="absolute inset-0 rounded-3xl transform rotate-6 opacity-20"
                style={{ background: `linear-gradient(to right, ${config.primaryColor}, ${config.secondaryColor})` }}
              ></div>
              <div className="relative bg-white rounded-3xl shadow-2xl p-8 transform -rotate-2 hover:rotate-0 transition-transform duration-500">
                <Image
                  src="/delicious-pizza.png"
                  alt="Delicious Food"
                  width={500}
                  height={400}
                  className="w-full h-80 object-cover rounded-2xl"
                />
                <div
                  className="absolute -top-4 -right-4 text-white rounded-full w-16 h-16 flex items-center justify-center font-bold text-lg shadow-lg"
                  style={{ backgroundColor: config.secondaryColor }}
                >
                  -{config.promoDiscount}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Banner */}
      <section
        className="py-12"
        style={{ background: `linear-gradient(to right, ${config.primaryColor}, ${config.secondaryColor})` }}
      >
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-3 gap-8 text-white">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
                <Truck className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-bold text-lg">{config.feature1Title}</h3>
                <p className="text-orange-100">{config.feature1Description}</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
                <Clock className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-bold text-lg">{config.feature2Title}</h3>
                <p className="text-orange-100">{config.feature2Description}</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
                <Star className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-bold text-lg">{config.feature3Title}</h3>
                <p className="text-orange-100">{config.feature3Description}</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Products */}
      <section className="py-20" id="menu">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <Badge
              className="px-4 py-2 text-sm font-medium mb-4 text-white"
              style={{ backgroundColor: config.primaryColor }}
            >
              ⭐ Más Populares
            </Badge>
            <h2 className="text-4xl lg:text-5xl font-bold mb-4">
              <span className="bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
                Nuestros Favoritos
              </span>
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Los platos más amados por nuestros clientes, preparados con amor y los mejores ingredientes.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {featuredProducts.map((product) => (
              <Card
                key={product.id}
                className="group overflow-hidden border-0 shadow-lg hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-2 bg-white"
              >
                <div className="relative overflow-hidden">
                  <Image
                    src={product.image || "/placeholder.svg"}
                    alt={product.name}
                    width={400}
                    height={250}
                    className="w-full h-48 object-cover group-hover:scale-110 transition-transform duration-500"
                  />
                  <div className="absolute top-4 left-4">
                    <Badge className="text-white" style={{ backgroundColor: config.secondaryColor }}>
                      🔥 Popular
                    </Badge>
                  </div>
                  <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                </div>
                <CardContent className="p-6">
                  <div className="space-y-3">
                    <h3 className="text-xl font-bold text-gray-900">{product.name}</h3>
                    <div className="flex items-center space-x-2">
                      <div className="flex items-center">
                        {[1, 2, 3, 4, 5].map((i) => (
                          <Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                        ))}
                      </div>
                      <span className="text-sm text-gray-500">(4.8)</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="space-y-1">
                        <p className="text-2xl font-bold" style={{ color: config.primaryColor }}>
                          {formatPrice(Number(product.sell_price_inc_tax ?? product.price ?? 0))}
                        </p>
                        <p className="text-sm text-gray-500 line-through">{formatPrice(Number(product.sell_price_inc_tax ?? product.price ?? 0) * 1.2)}</p>
                      </div>
                      <Button
                        onClick={() => addToCart(product)}
                        className="text-white shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
                        style={{
                          background: `linear-gradient(to right, ${config.primaryColor}, ${config.secondaryColor})`,
                        }}
                      >
                        <ShoppingCart className="w-4 h-4 mr-2" />
                        Agregar
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Promotional Banner */}
      <section
        className="py-20 relative overflow-hidden"
        style={{
          background: `linear-gradient(to right, ${config.accentColor}, ${config.primaryColor}, ${config.secondaryColor})`,
        }}
      >
        <div className="absolute inset-0 bg-black/20"></div>
        <div className="container mx-auto px-4 relative">
          <div className="text-center text-white space-y-8">
            <Badge className="bg-white/20 text-white px-6 py-3 text-lg font-medium">🎉 Oferta Especial</Badge>
            <h2 className="text-4xl lg:text-6xl font-bold leading-tight">
              {config.promoTitle.split("Primer")[0]}
              <br />
              <span className="text-yellow-300">{config.promoTitle.split("Primer")[1]}</span>
            </h2>
            <p className="text-xl text-purple-100 max-w-2xl mx-auto">{config.promoDescription}</p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button
                size="lg"
                onClick={scrollToMenu}
                className="bg-white hover:bg-gray-100 px-8 py-4 text-lg font-bold shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-105"
                style={{ color: config.accentColor }}
              >
                {config.promoButtonText}
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="border-2 border-white text-white hover:bg-white px-8 py-4 text-lg transition-all duration-300"
                style={{ "--hover-color": config.accentColor } as React.CSSProperties}
              >
                📞 Llamar Ahora
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Menu Categories */}
      <section className="py-24 bg-gradient-to-b from-white to-orange-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-20">
            <h2 className="text-5xl font-extrabold mb-6 text-gray-900 drop-shadow-sm">
              <span className="bg-gradient-to-r from-orange-500 to-red-500 bg-clip-text text-transparent">
                Explora Nuestro Menú
              </span>
            </h2>
            <p className="text-2xl text-gray-600 max-w-2xl mx-auto font-light">
              Desde deliciosas comidas hasta refrescantes bebidas y postres irresistibles.
            </p>
          </div>

          {/* Category Filter */}
          <div className="flex flex-wrap justify-center gap-4 mb-12">
            {categories.map((category) => (
              <Button
                key={category.id}
                variant={selectedCategory === category.id ? "default" : "outline"}
                onClick={() => setSelectedCategory(category.id)}
                className={`px-8 py-3 text-lg font-semibold rounded-full shadow-md transition-all duration-300 border-2 border-transparent ${
                  selectedCategory === category.id
                    ? "bg-gradient-to-r from-orange-500 to-red-500 text-white shadow-lg scale-105"
                    : "bg-white text-gray-700 hover:border-orange-400 hover:text-orange-600 hover:scale-105"
                }`}
                style={
                  selectedCategory === category.id
                    ? { background: "linear-gradient(to right, #f97316, #dc2626)" }
                    : {}
                }
              >
                {category.name}
              </Button>
            ))}
          </div>

          {/* Products Grid */}
          {loadingProducts ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto mb-4"></div>
                <p className="text-gray-600">Cargando productos...</p>
              </div>
            </div>
          ) : errorProducts ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <p className="text-red-500 mb-4">{errorProducts}</p>
                <Button 
                  onClick={() => window.location.reload()} 
                  variant="outline"
                >
                  Reintentar
                </Button>
              </div>
            </div>
          ) : uniqueFilteredProducts.length === 0 ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <p className="text-gray-600 mb-2">No se encontraron productos en esta categoría</p>
                <p className="text-sm text-gray-500">Intenta seleccionar otra categoría</p>
              </div>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {uniqueFilteredProducts.map((product) => (
              <Card
                key={product.id}
                className="group overflow-hidden border-0 shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1 bg-white rounded-2xl"
              >
                <div className="relative overflow-hidden rounded-t-2xl">
                  <Image
                    src={product.image || "/placeholder.svg"}
                    alt={product.name}
                    width={300}
                    height={200}
                    className="w-full h-44 object-cover group-hover:scale-110 transition-transform duration-300"
                  />
                </div>
                <CardContent className="p-6">
                  <div className="space-y-2">
                    <h3 className="font-bold text-gray-900 text-lg line-clamp-1">{product.name}</h3>
                    <div className="flex items-center justify-between mt-2">
                      <p className="text-xl font-bold text-orange-600">
                        {formatPrice(Number(product.sell_price_inc_tax ?? product.price ?? 0))}
                      </p>
                      <Button
                        size="sm"
                        onClick={() => addToCart(product)}
                        className="text-white rounded-full px-4 py-2 shadow-md hover:scale-110 transition-transform bg-gradient-to-r from-orange-500 to-red-500"
                      >
                        <ShoppingCart className="w-4 h-4 mr-1" />
                        Agregar
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
          )}
        </div>
      </section>

      {/* Encuentra tu producto */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-extrabold mb-4 text-gray-900 drop-shadow-sm">
              Encuentra tu producto
            </h2>
            <p className="text-lg text-gray-600 max-w-xl mx-auto font-light">
              Busca entre todos nuestros productos y filtra por categoría, precio o disponibilidad.
            </p>
          </div>
          <div className="flex flex-col items-center justify-center gap-6">
            {/* Barra de búsqueda */}
            <div className="w-full max-w-2xl relative">
              <input
                type="text"
                className="w-full px-6 py-4 rounded-full border-2 border-orange-300 focus:border-orange-500 shadow-md text-lg outline-none transition-all"
                placeholder="¿Qué producto buscas? (ej: pizza, bebida, postre...)"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
              />
              {/* Autosuggest */}
              {searchQuery.length > 0 && (
                <div className="absolute left-0 right-0 mt-2 bg-white rounded-xl shadow-lg z-20 max-h-80 overflow-auto border border-orange-100">
                  {filteredSearchResults.length === 0 ? (
                    <div className="p-4 text-gray-400 text-center">No se encontraron productos</div>
                  ) : (
                    filteredSearchResults.map(product => (
                      <div
                        key={product.id}
                        className="flex items-center gap-4 px-4 py-3 hover:bg-orange-50 cursor-pointer transition-all"
                        onClick={() => handleSelectProduct(product)}
                      >
                        <img
                          src={product.image || "/placeholder.svg"}
                          alt={product.name}
                          className="w-12 h-12 object-cover rounded-lg border"
                        />
                        <div className="flex-1">
                          <div className="font-semibold text-gray-900 line-clamp-1">{product.name}</div>
                          <div className="text-sm text-gray-500 line-clamp-1">{product.category_name || 'Sin categoría'}</div>
                        </div>
                        <div className="font-bold text-orange-600 text-lg">{formatPrice(Number(product.sell_price_inc_tax))}</div>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
            {/* Filtros visuales (solo frontend) */}
            <div className="flex flex-wrap gap-3 justify-center mt-4">
              <select
                className="px-4 py-2 rounded-full border border-orange-200 bg-white text-gray-700 shadow-sm focus:border-orange-400"
                value={filterCategory}
                onChange={e => setFilterCategory(e.target.value)}
              >
                <option value="">Todas las categorías</option>
                {categories.filter(c => c.id !== 'all' && c.id !== 'otros').map(cat => (
                  <option key={cat.id} value={cat.id}>{cat.name}</option>
                ))}
              </select>
              <select
                className="px-4 py-2 rounded-full border border-orange-200 bg-white text-gray-700 shadow-sm focus:border-orange-400"
                value={filterAvailability}
                onChange={e => setFilterAvailability(e.target.value)}
              >
                <option value="">Todas</option>
                <option value="disponible">Disponible</option>
                <option value="nodisponible">No disponible</option>
              </select>
              <select
                className="px-4 py-2 rounded-full border border-orange-200 bg-white text-gray-700 shadow-sm focus:border-orange-400"
                value={filterPrice}
                onChange={e => setFilterPrice(e.target.value)}
              >
                <option value="">Todos los precios</option>
                <option value="low">Menos de $10</option>
                <option value="mid">$10 - $20</option>
                <option value="high">Más de $20</option>
              </select>
            </div>
          </div>
          {/* Resultados destacados (opcional) */}
          {selectedProduct && (
            <div className="mt-10 flex flex-col items-center">
              <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-lg w-full flex flex-col items-center">
                <img
                  src={selectedProduct.image || "/placeholder.svg"}
                  alt={selectedProduct.name}
                  className="w-32 h-32 object-cover rounded-xl border mb-4"
                />
                <h3 className="text-2xl font-bold mb-2 text-gray-900">{selectedProduct.name}</h3>
                <div className="text-lg text-gray-500 mb-2">{selectedProduct.category_name || 'Sin categoría'}</div>
                <div className="text-2xl font-bold text-orange-600 mb-4">{formatPrice(Number(selectedProduct.sell_price_inc_tax))}</div>
                <Button className="bg-gradient-to-r from-orange-500 to-red-500 text-white px-8 py-3 rounded-full shadow-lg text-lg font-semibold">
                  <ShoppingCart className="w-5 h-5 mr-2" />Agregar al carrito
                </Button>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Contact Section */}
      <section className="py-20 bg-gray-900 text-white" id="contact">
        <div className="container mx-auto px-4">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-8">
              <div>
                <h2 className="text-4xl lg:text-5xl font-bold mb-4">
                  <span
                    className="bg-clip-text text-transparent"
                    style={{
                      backgroundImage: `linear-gradient(to right, ${config.primaryColor}, ${config.secondaryColor})`,
                    }}
                  >
                    ¿Listo para Ordenar?
                  </span>
                </h2>
                <p className="text-xl text-gray-300">
                  Contáctanos y disfruta de la mejor comida en la comodidad de tu hogar.
                </p>
              </div>

              <div className="space-y-4">
                <div className="flex items-center space-x-4">
                  <div
                    className="w-12 h-12 rounded-full flex items-center justify-center"
                    style={{
                      background: `linear-gradient(to right, ${config.primaryColor}, ${config.secondaryColor})`,
                    }}
                  >
                    <Phone className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="font-bold">Teléfono</p>
                    <p className="text-gray-300">{config.phone}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-4">
                  <div
                    className="w-12 h-12 rounded-full flex items-center justify-center"
                    style={{
                      background: `linear-gradient(to right, ${config.primaryColor}, ${config.secondaryColor})`,
                    }}
                  >
                    <MapPin className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="font-bold">Dirección</p>
                    <p className="text-gray-300">{config.address}</p>
                  </div>
                </div>
              </div>

              <div className="flex space-x-4">
                <Button className="bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600">
                  <Instagram className="w-5 h-5" />
                </Button>
                <Button className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700">
                  <Facebook className="w-5 h-5" />
                </Button>
                <Button className="bg-gradient-to-r from-sky-400 to-sky-500 hover:from-sky-500 hover:to-sky-600">
                  <Twitter className="w-5 h-5" />
                </Button>
              </div>
            </div>

            <div className="bg-white/10 backdrop-blur-lg rounded-3xl p-8 border border-white/20">
              <h3 className="text-2xl font-bold mb-6">Haz tu Pedido</h3>
              <div className="space-y-4">
                <input
                  type="text"
                  placeholder="Tu nombre"
                  className="w-full px-4 py-3 rounded-xl bg-white/10 border border-white/20 text-white placeholder-gray-300 focus:outline-none focus:ring-2"
                  style={{ "--focus-ring-color": config.primaryColor } as React.CSSProperties}
                />
                <input
                  type="tel"
                  placeholder="Tu teléfono"
                  className="w-full px-4 py-3 rounded-xl bg-white/10 border border-white/20 text-white placeholder-gray-300 focus:outline-none focus:ring-2"
                  style={{ "--focus-ring-color": config.primaryColor } as React.CSSProperties}
                />
                <textarea
                  placeholder="¿Qué te gustaría ordenar?"
                  rows={4}
                  className="w-full px-4 py-3 rounded-xl bg-white/10 border border-white/20 text-white placeholder-gray-300 focus:outline-none focus:ring-2 resize-none"
                  style={{ "--focus-ring-color": config.primaryColor } as React.CSSProperties}
                ></textarea>
                <Button
                  className="w-full text-white py-3 text-lg font-bold"
                  style={{ background: `linear-gradient(to right, ${config.primaryColor}, ${config.secondaryColor})` }}
                >
                  🚀 Enviar Pedido
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-black text-white py-12">
        <div className="container mx-auto px-4">
          <div className="text-center space-y-4">
            <div className="flex items-center justify-center space-x-2">
              <div
                className="w-8 h-8 rounded-lg flex items-center justify-center"
                style={{ background: `linear-gradient(to right, ${config.primaryColor}, ${config.secondaryColor})` }}
              >
                <span className="text-white font-bold">{config.companyLogo}</span>
              </div>
              <h3
                className="text-2xl font-bold bg-clip-text text-transparent"
                style={{
                  backgroundImage: `linear-gradient(to right, ${config.primaryColor}, ${config.secondaryColor})`,
                }}
              >
                {config.companyName}
              </h3>
            </div>
            <p className="text-gray-400">© 2024 {config.companyName}. Todos los derechos reservados.</p>
            <p className="text-gray-500 text-sm">Hecho con ❤️ para los amantes de la buena comida</p>
          </div>
        </div>
      </footer>
    </div>
  )
} 