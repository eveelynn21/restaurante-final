"use client"

import { useState, useEffect } from "react"
import { Search, MapPin, LayoutDashboard, Grid3X3, ChevronDown, ChevronRight, User } from "lucide-react"
import { Input } from "../../components/ui/input"
import ProductGrid from "../components/product-grid"
import CartSidebar from "../components/cart-sidebar"
import CategorySidebar from "../components/category-sidebar"
import { useSearchParams, useRouter } from "next/navigation"
import { useTables } from "../context/table-context"
import { Button } from "../../components/ui/button"
import { CartProvider, useCart } from "../context/cart-context"
import ClientSearchDialog from "../components/client-search-dialog"
import CreateClientDialog from "../components/create-client-dialog"
import LocationSelectorModal from "../components/location-selector-modal"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../../components/ui/dialog"


function POSContent() {
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("all")
  const [selectedClient, setSelectedClient] = useState<{ id: number; name: string } | null>(null)
  const [selectedLocation, setSelectedLocation] = useState<{ id: number; name: string } | null>(null)
  const [showLocationModal, setShowLocationModal] = useState(false)
  const [showCategories, setShowCategories] = useState(false)
  const [showClientDialog, setShowClientDialog] = useState(false)
  const [categories, setCategories] = useState<{ id: string; name: string }[]>([])
  const [isEditing, setIsEditing] = useState(false)


  const searchParams = useSearchParams()
  const tableId = searchParams.get("table")
  const { getTableById } = useTables()
  const currentTable = tableId ? getTableById(Number.parseInt(tableId)) : null

  const router = useRouter()
  const { loadCartFromTransaction } = useCart()

  useEffect(() => {
    console.log('🚀 useEffect inicial ejecutándose...')
    
    // Verificar si ya hay una ubicación seleccionada
    const savedLocation = localStorage.getItem('selectedLocation')
    console.log('📍 Ubicación guardada:', savedLocation)
    
    if (savedLocation) {
      setSelectedLocation(JSON.parse(savedLocation))
    } else {
      setShowLocationModal(true)
    }

    // Al cargar la página, buscar el cliente predeterminado
    const fetchDefaultClient = async () => {
      const token = localStorage.getItem('token')
      if (!token) return
      const response = await fetch('/api/clients?default=1', {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      if (response.ok) {
        const data = await response.json()
        if (Array.isArray(data) && data.length > 0) {
          const defaultClient = { id: data[0].id, name: data[0].name }
          setSelectedClient(defaultClient)
          localStorage.setItem('selectedClient', JSON.stringify(defaultClient))
        }
      }
    }
    fetchDefaultClient()
  }, [])



  // IDs de categorías válidas según la consulta SQL del usuario
  const categoriasValidas = [
    3913,3916,3917,4938,4939,3915,4937,3914,5341,6051,6052,6055,6064,6065,6066,6067,6069,6070,6080,6081,10380,5313,35240,35560,10656,35723,39695,44234
  ];

  useEffect(() => {
    async function fetchCategories() {
      if (!selectedLocation) return;
      try {
        const res = await fetch(`/api/products/categories?businessId=165`);
        if (!res.ok) throw new Error('Error al obtener categorías');
        const data = await res.json();

        // Tomar el category_id del primer producto de cada categoría
        const cats = data.categories
          .filter((cat: any) => {
            if (Array.isArray(cat.products) && cat.products.length > 0) {
              const id = Number(cat.products[0].category_id);
              console.log("Comparando:", id, categoriasValidas.includes(id), cat.category);
              return categoriasValidas.includes(id);
            }
            return false;
          })
          .map((cat: any) => ({
            id: String(cat.products[0].category_id),
            name: cat.category
          }));

        console.log("CATEGORIAS FILTRADAS:", cats);

        setCategories([{ id: 'all', name: 'Todos' }, ...cats]);
      } catch (err) {
        setCategories([{ id: 'all', name: 'Todos' }]);
      }
    }
    fetchCategories();
  }, [selectedLocation]);

  // useEffect separado para cargar factura en edición
  useEffect(() => {
    console.log('🔍 useEffect de carga de factura ejecutándose...')
    const editingTransaction = localStorage.getItem('editingTransaction')
    console.log('📋 editingTransaction en localStorage:', editingTransaction)
    
    if (editingTransaction && !isEditing) {
      try {
        const transaction = JSON.parse(editingTransaction)
        console.log('✅ Factura parseada correctamente:', transaction)
        
        // Marcar que estamos en modo edición
        setIsEditing(true)
        
        // Establecer el cliente de la factura
        if (transaction.contact_id) {
          console.log('👤 Estableciendo cliente:', transaction.contact_id)
          setSelectedClient({ 
            id: transaction.contact_id, 
            name: transaction.contact_name || transaction.supplier_business_name || 'Cliente genérico'
          })
        }
        
        // Cargar los productos de la factura en el carrito
        console.log('🛒 Llamando a loadCartFromTransaction...')
        loadCartFromTransaction(transaction).then(() => {
          // NO limpiar editingTransaction aquí - se limpiará en el checkout después de guardar
          console.log('✅ Productos cargados exitosamente para edición')
        }).catch((error: any) => {
          console.error('❌ Error al cargar productos:', error)
          localStorage.removeItem('editingTransaction')
          setIsEditing(false)
        })
        
      } catch (error) {
        console.error('❌ Error al cargar factura para edición:', error)
        localStorage.removeItem('editingTransaction')
        setIsEditing(false)
      }
    } else {
      console.log('ℹ️ No hay factura en edición en localStorage o ya está en modo edición')
    }
  }, [loadCartFromTransaction, isEditing])

  // useEffect para limpiar carrito cuando se sale del POS sin editar
  useEffect(() => {
    const handleBeforeUnload = () => {
      // Si estamos en modo edición y el usuario sale sin actualizar, limpiar todo
      if (isEditing) {
        console.log('🚪 Usuario saliendo del POS en modo edición sin actualizar - limpiando carrito')
        localStorage.removeItem('editingTransaction')
        localStorage.removeItem('cart')
      }
    }

    const handleVisibilityChange = () => {
      // Si la página se oculta y estamos en modo edición, limpiar
      if (document.hidden && isEditing) {
        console.log('👁️ Página oculta en modo edición - limpiando carrito')
        localStorage.removeItem('editingTransaction')
        localStorage.removeItem('cart')
      }
    }

    window.addEventListener('beforeunload', handleBeforeUnload)
    document.addEventListener('visibilitychange', handleVisibilityChange)

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload)
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [isEditing])

  // Agregar categoría 'OTROS' al final
  const categoriasConOtros = [...categories, { id: 'otros', name: 'OTROS' }];

  const handleLocationSelected = (location: { id: number; name: string }) => {
    setSelectedLocation(location)
    localStorage.setItem('selectedLocation', JSON.stringify(location))
    setShowLocationModal(false)
  }

  const handleClientSelected = (client: { id: number; name: string }) => {
    setSelectedClient(client)
    localStorage.setItem('selectedClient', JSON.stringify(client))
    setShowClientDialog(false)
  }

  const handleClientCreated = (newClient: any) => {
    // Actualizar el cliente seleccionado con el nuevo cliente creado
    const clientData = { id: newClient.id, name: newClient.name }
    setSelectedClient(clientData)
    localStorage.setItem('selectedClient', JSON.stringify(clientData))
    console.log('✅ Nuevo cliente creado y seleccionado:', newClient)
  }

  return (
    <CartProvider>
      <>
        <LocationSelectorModal 
          isOpen={showLocationModal} 
          onLocationSelected={handleLocationSelected} 
        />
        <div className="flex h-screen bg-background">
          {showCategories && (
            <CategorySidebar selectedCategory={selectedCategory} onSelectCategory={setSelectedCategory} categories={categoriasConOtros} isOpen={showCategories} />
          )}
          <main className="flex-1 flex flex-col h-screen overflow-hidden">
            <div className="w-full px-10 pt-2 pb-1 bg-background">
              <div className="max-w-6xl mx-auto bg-white rounded-2xl shadow-lg border border-gray-200 px-6 py-3 flex items-center justify-between gap-2">
                {/* Título */}
                <h1 className="text-2xl font-bold text-primary whitespace-nowrap">POS</h1>
                {/* Ubicación */}
                <div className="flex items-center gap-2 bg-gray-50 rounded-lg px-3 py-1">
                  <MapPin className="h-3 w-3 text-primary" />
                  <span className="text-sm text-gray-700">{selectedLocation?.name || 'RESTAURANTE BOGOTÁ'}</span>
                  <Button
                    variant="link"
                    size="sm"
                    className="text-primary font-medium px-0 py-0 h-auto min-w-0 text-sm hover:underline"
                    onClick={() => setShowLocationModal(true)}
                  >
                    Cambiar
                  </Button>
                </div>
                {/* Botón CLIENTE PUNTO DE VENTA y + */}
                <div className="flex items-center gap-1">
                  <ClientSearchDialog 
                    onClientSelect={handleClientSelected}
                    selectedClient={selectedClient}
                  />
                  {/* Botón + para crear cliente */}
                  <CreateClientDialog 
                    onClientCreated={handleClientCreated}
                    trigger={
                      <Button
                        variant="outline"
                        className="flex items-center justify-center px-2 py-1 rounded-lg text-sm font-medium bg-purple-50 text-purple-700 border-2 border-purple-300 shadow-sm hover:shadow-md hover:border-purple-600 hover:bg-purple-100 transition-all duration-200 h-[32px] w-[32px]"
                      >
                        <span className="text-lg font-bold">+</span>
                      </Button>
                    }
                  />
                </div>
                {/* Botones de navegación */}
                <div className="flex items-center gap-2">
                  <Button
                    variant={showCategories ? "default" : "outline"}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium border-2 shadow-sm hover:shadow-md transition-all duration-200 ${showCategories ? 'bg-purple-600 text-white border-purple-600 shadow-lg' : 'bg-purple-50 text-purple-700 border-purple-300 hover:border-purple-600 hover:bg-purple-100'}`}
                    onClick={() => setShowCategories(!showCategories)}
                  >
                    <Grid3X3 className="h-4 w-4" />
                    Categorías
                  </Button>
                  <Button
                    variant="outline"
                    className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium bg-purple-50 text-purple-700 border-2 border-purple-300 shadow-sm hover:shadow-md hover:border-purple-600 hover:bg-purple-100 transition-all duration-200"
                    onClick={() => router.push('/tables')}
                  >
                    <MapPin className="h-4 w-4" />
                    Mesas
                  </Button>
                  <Button
                    variant="outline"
                    className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium bg-purple-50 text-purple-700 border-2 border-purple-300 shadow-sm hover:shadow-md hover:border-purple-600 hover:bg-purple-100 transition-all duration-200"
                    onClick={() => router.push('/dashboard')}
                  >
                    <LayoutDashboard className="h-4 w-4" />
                    Dashboard
                  </Button>
                </div>
              </div>
            </div>
            <div className="flex-1 overflow-auto p-4">
              <ProductGrid category={selectedCategory} searchQuery={searchQuery} compact={false} />
            </div>
          </main>
          <CartSidebar searchQuery={searchQuery} setSearchQuery={setSearchQuery} />
        </div>
      </>
    </CartProvider>
  )
}

export default function POSPage() {
  return <POSContent />
}
