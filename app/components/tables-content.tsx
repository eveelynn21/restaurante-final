"use client"

import { useState, useEffect } from "react"
import { ShoppingCart, Search, Clock, MapPin } from "lucide-react"
import { Button } from "../../components/ui/button"
import { Input } from "../../components/ui/input"
import RestaurantCanvas from "./restaurant-canvas"
import ProductGrid from "./product-grid"
import CategorySidebar from "./category-sidebar"
import { useTables, type Table } from "../context/table-context"
import { useCart } from "../context/cart-context"
import { CartProvider } from "../context/cart-context"
import { useRouter } from "next/navigation"
import ClientSearchDialog from "./client-search-dialog"
import CreateClientDialog from "./create-client-dialog"
import LocationSelectorModal from "./location-selector-modal"

export default function TablesContent() {
  const { updateTableStatus, addProductToTable, forceReloadComandasState } = useTables()
  const { itemCount } = useCart()
  const [selectedTable, setSelectedTable] = useState<Table | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("all")
  const [selectedClient, setSelectedClient] = useState<{ id: number; name: string } | null>(null)
  const [selectedLocation, setSelectedLocation] = useState<{ id: number; name: string } | null>(null)
  const [showLocationModal, setShowLocationModal] = useState(false)
  const [categories, setCategories] = useState<{ id: string; name: string }[]>([])
  const router = useRouter()

  // Estado para mostrar/ocultar el sidebar de categorías
  const [showCategories, setShowCategories] = useState(false)
  
  // Estado para mostrar/ocultar productos en móvil
  const [showProducts, setShowProducts] = useState(false)

  // Cargar ubicación seleccionada al iniciar
  useEffect(() => {
    const savedLocation = localStorage.getItem('selectedLocation')
    if (savedLocation) {
      try {
        setSelectedLocation(JSON.parse(savedLocation))
      } catch (error) {
        console.error('Error parsing selected location:', error)
      }
    }
  }, [])

  // Forzar recarga del estado real de comandas al cargar la página
  useEffect(() => {
    const reloadComandas = async () => {
      try {
        console.log('🔄 Forzando recarga de comandas al cargar /tables')
        await forceReloadComandasState()
        console.log('✅ Recarga de comandas completada')
      } catch (error) {
        console.error('❌ Error en recarga forzada de comandas:', error)
      }
    }
    
    // Ejecutar después de un breve delay para asegurar que las mesas estén cargadas
    const timeoutId = setTimeout(reloadComandas, 1000)
    
    return () => clearTimeout(timeoutId)
  }, [forceReloadComandasState])

  // Escuchar eventos de nuevos pedidos desde el QR
  useEffect(() => {
    const handleNewOrder = async (event: CustomEvent) => {
      try {
        console.log('🔄 Nuevo pedido recibido desde QR:', event.detail)
        const { mesaId, orderData } = event.detail
        
        // Forzar recarga del estado de comandas para actualizar la mesa
        await forceReloadComandasState()
        
        console.log('✅ Mesa actualizada automáticamente con nuevo pedido')
      } catch (error) {
        console.error('❌ Error actualizando mesa con nuevo pedido:', error)
      }
    }
    
    // Agregar listener para el evento personalizado
    window.addEventListener('newOrderPlaced', handleNewOrder as EventListener)
    
    return () => {
      window.removeEventListener('newOrderPlaced', handleNewOrder as EventListener)
    }
  }, [forceReloadComandasState])

  const handleLocationSelected = (location: { id: number; name: string }) => {
    setSelectedLocation(location)
    localStorage.setItem('selectedLocation', JSON.stringify(location))
    setShowLocationModal(false)
  }

  // IDs de categorías válidas según la consulta SQL del usuario
  const categoriasValidas = [
    3913,3916,3917,4938,4939,3915,4937,3914,5341,6051,6052,6055,6064,6065,6066,6067,6069,6070,6080,6081,10380,5313,35240,35560,10656,35723,39695,44234
  ];

  useEffect(() => {
    async function fetchCategories() {
      try {
        const res = await fetch(`/api/products/categories?businessId=165`);
        if (!res.ok) throw new Error('Error al obtener categorías');
        const data = await res.json();

        // Tomar el category_id del primer producto de cada categoría
        const cats = data.categories
          .filter((cat: any) => {
            if (Array.isArray(cat.products) && cat.products.length > 0) {
              const id = Number(cat.products[0].category_id);
              return categoriasValidas.includes(id);
            }
            return false;
          })
          .map((cat: any) => ({
            id: String(cat.products[0].category_id),
            name: cat.category
          }));

        setCategories([{ id: 'all', name: 'Todos' }, ...cats]);
      } catch (err) {
        setCategories([{ id: 'all', name: 'Todos' }]);
      }
    }
    fetchCategories();
  }, []);

  // Agregar categoría 'OTROS' al final
  const categoriasConOtros = [...categories, { id: 'otros', name: 'OTROS' }];

  const handleTableSelect = (table: Table) => {
    if (table.status === "available") {
      updateTableStatus(table.id, "occupied")
    }
    setSelectedTable(table)
  }

  // Función para manejar el click en producto
  const handleProductClick = (product: any) => {
    if (selectedTable) {
      addProductToTable(selectedTable.id, product)
    }
  }

  const handleClientSelected = (client: { id: number; name: string }) => {
    setSelectedClient(client)
    localStorage.setItem('selectedClient', JSON.stringify(client))
  }

  const handleClientCreated = (newClient: any) => {
    const clientData = { id: newClient.id, name: newClient.name }
    setSelectedClient(clientData)
    localStorage.setItem('selectedClient', JSON.stringify(clientData))
  }

  return (
    <CartProvider>
      <>
        <LocationSelectorModal 
          isOpen={showLocationModal} 
          onLocationSelected={handleLocationSelected} 
        />
        <div className="w-full h-full flex flex-col bg-background">
          {/* Header */}
          <div className="flex items-center justify-between p-3 border-b bg-white shadow-sm tables-header">
            <div className="flex items-center gap-3">
              <h1 className="text-xl font-bold text-gray-800 tables-title">Gestión de Mesas</h1>
              {/* Ubicación */}
              <div className="flex items-center gap-2 bg-gray-50 rounded-lg px-3 py-1">
                <MapPin className="h-3 w-3 text-primary" />
                <span className="text-sm text-gray-700">{selectedLocation?.name || 'RESTAURANT BOGOTÁ'}</span>
                <Button
                  variant="link"
                  size="sm"
                  className="text-primary font-medium px-0 py-0 h-auto min-w-0 text-sm hover:underline"
                  onClick={() => setShowLocationModal(true)}
                >
                  Cambiar
                </Button>
              </div>
            </div>

          <div className="flex items-center gap-1 sm:gap-2 flex-wrap tables-nav-buttons">
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
                    className="flex items-center justify-center px-2 py-1 rounded-lg text-sm font-medium bg-purple-50 text-purple-700 border-2 border-purple-300 shadow-sm hover:shadow-md hover:border-purple-600 hover:bg-purple-100 transition-all duration-200 h-8 w-8"
                  >
                    <span className="text-sm font-bold">+</span>
                  </Button>
                }
              />
            </div>
            {/* Eliminar el input de búsqueda del header */}
            <Button variant="outline"
              className="text-xs bg-purple-100 text-purple-700 border-2 border-purple-400 shadow-sm focus:ring-2 focus:ring-purple-300 focus:border-purple-600 h-8 px-2 sm:px-3 tables-nav-button"
              onClick={() => router.push("/pos")}
              style={{ backgroundColor: '#ede9fe', color: '#7c3aed', borderColor: '#a78bfa' }}
            >
              <ShoppingCart className="mr-1 h-3 w-3" />
              <span className="hidden sm:inline">POS</span>
              <span className="sm:hidden">POS</span>
              {itemCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-4 w-4 flex items-center justify-center">
                  {itemCount}
                </span>
              )}
            </Button>
            <Button variant="outline"
              className="text-xs bg-purple-100 text-purple-700 border-2 border-purple-400 shadow-sm focus:ring-2 focus:ring-purple-300 focus:border-purple-600 h-8 px-2 sm:px-3 tables-nav-button"
              onClick={() => router.push("/comandas")}
              style={{ backgroundColor: '#ede9fe', color: '#7c3aed', borderColor: '#a78bfa' }}
            >
              <Clock className="mr-1 h-3 w-3" />
              <span className="hidden sm:inline">Comandas</span>
              <span className="sm:hidden">Comandas</span>
            </Button>
            <Button variant="outline"
              className="text-xs bg-purple-100 text-purple-700 border-2 border-purple-400 shadow-sm focus:ring-2 focus:ring-purple-300 focus:border-purple-600 h-8 px-2 sm:px-3 tables-nav-button"
              onClick={() => router.push("/dashboard")}
              style={{ backgroundColor: '#ede9fe', color: '#7c3aed', borderColor: '#a78bfa' }}
            >
              <svg className="mr-1 h-3 w-3" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" d="M3 13h2v-2H3v2zm0 4h2v-2H3v2zm0-8h2V7H3v2zm4 8h2v-2H7v2zm0-4h2v-2H7v2zm0-4h2V7H7v2zm4 8h2v-2h-2v2zm0-4h2v-2h-2v2zm0-4h2V7h-2v2zm4 8h2v-2h-2v2zm0-4h2v-2h-2v2zm0-4h2V7h-2v2z"></path></svg>
              <span className="hidden sm:inline">Dashboard</span>
              <span className="sm:hidden">Dash</span>
            </Button>
            <Button
              variant="outline"
              className="text-xs bg-purple-100 text-purple-700 border-2 border-purple-400 shadow-sm focus:ring-2 focus:ring-purple-300 focus:border-purple-600 h-8 px-2 sm:px-3 tables-nav-button"
              onClick={() => setShowCategories((v) => !v)}
              style={{ backgroundColor: '#ede9fe', color: '#7c3aed', borderColor: '#a78bfa' }}
            >
              <span className="hidden sm:inline">{showCategories ? 'Ocultar Categorías' : 'Mostrar Categorías'}</span>
              <span className="sm:hidden">Cat</span>
            </Button>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex flex-1 overflow-hidden flex-col lg:flex-row tables-main-layout">
          {/* Categories Sidebar */}
          {showCategories && (
            <div className="w-full lg:w-56 border-r bg-white tables-categories">
              <CategorySidebar 
                selectedCategory={selectedCategory} 
                onSelectCategory={setSelectedCategory} 
                categories={categoriasConOtros}
                isOpen={showCategories}
              />
            </div>
          )}
          {/* Botón para mostrar/ocultar categorías */}
          {/* Eliminado el botón flotante de categorías */}

          {/* Products Section */}
          <div className={`w-full lg:w-96 border-r bg-white flex flex-col tables-products ${showProducts ? 'expanded' : ''}`}>
            <div className="p-4 border-b flex flex-col gap-2">
              <div>
                <h2 className="text-lg font-semibold">Productos</h2>
                <p className="text-sm text-muted-foreground hidden sm:block">Arrastra los productos a las mesas o haz click para agregar</p>
              </div>
              {/* Filtro de búsqueda */}
              <div className="relative">
                <svg className="absolute left-3 top-2.5 h-4 w-4 text-black z-10" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <Input
                  placeholder="Buscar productos..."
                  className="pl-10 bg-purple-50 text-purple-700 border-2 border-purple-300 rounded-lg shadow-sm hover:shadow-md hover:border-purple-600 hover:bg-purple-100 transition-all duration-200 focus:border-purple-600 focus:ring-2 focus:ring-purple-100 placeholder-purple-500"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>
            <div className="flex-1 overflow-auto p-4 tables-products-content">
              <ProductGrid category={selectedCategory} searchQuery={searchQuery} compact={true} onProductClick={handleProductClick} />
            </div>
          </div>

          {/* Restaurant Canvas */}
          <div className="flex-1 hidden lg:block tables-canvas">
            <RestaurantCanvas 
              onTableSelect={handleTableSelect} 
              searchQuery={searchQuery}
              setSearchQuery={setSearchQuery}
            />
          </div>
        </div>
        
        {/* Botón flotante para mostrar/ocultar productos en móvil */}
        <button 
          className="tables-toggle-products"
          onClick={() => setShowProducts(!showProducts)}
        >
          {showProducts ? '−' : '+'}
        </button>
      </div>
      </>
    </CartProvider>
  )
} 