"use client"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import {
  LayoutDashboard,
  Users,
  User,
  UtensilsCrossed,
  Settings,
  Globe,
  BarChart3,
  Plus,
  Edit,
  Trash2,
  Eye,
  ShoppingCart,
  MapPin,
  Clock,
  Database,
  BarChart,
  FileText,
  ChefHat,
  Package,
  LogOut,
  TrendingUp,
  DollarSign,
  Activity,
  Calendar,
  Building,
  ShoppingBag,
  ChevronDown,
  ChevronRight,
  HelpCircle,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { useTables } from "../context/table-context"
import { jwtDecode } from "jwt-decode"
import ProductManagement from "../components/product-management"
import ComboManagement from "../components/combo-management"
import TestDatabaseContent from "../components/test-database-content"
import ClientsContent from "../components/clients-content"
import KitchenContent from "../components/kitchen-content"
import AreaOrdersContent from "../components/area-orders-content"
import ComandasContent from "../components/comandas-content"
import Link from "next/link"
import { Switch } from "../components/ui/switch"

export default function DashboardPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { tables } = useTables()
  const [activeTab, setActiveTab] = useState("overview")
  const [showRecetas, setShowRecetas] = useState(false)
  const [currentSection, setCurrentSection] = useState("resumen")
  const [expandedMenus, setExpandedMenus] = useState({
    usuarios: false,
    terceros: false,
    ventas: false,
    compras: false,
    produccion: false,
    configuracion: false,
  })
  const [usaComandas, setUsaComandas] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('usaComandas');
      if (stored !== null) {
        setUsaComandas(stored === 'true');
      }
    }
  }, []);

  useEffect(() => {
    // Verificar JWT en localStorage
    const token = typeof window !== "undefined" ? localStorage.getItem("token") : null
    if (!token) {
      router.replace("/login")
      return
    }
    try {
      // Decodificar y validar expiración
      const decoded: any = jwtDecode(token)
      if (!decoded.user_id || !decoded.business_id) {
        throw new Error("Token inválido")
      }
      if (decoded.exp && Date.now() >= decoded.exp * 1000) {
        localStorage.removeItem("token")
        router.replace("/login")
      }
    } catch (err) {
      localStorage.removeItem("token")
      router.replace("/login")
    }
  }, [router])

  // Cuando el usuario cambia el switch, guardar el valor
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('usaComandas', usaComandas ? 'true' : 'false');
    }
  }, [usaComandas]);

  // Leer parámetro section de la URL
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search)
      const section = urlParams.get('section')
      console.log('URL section parameter:', section)
      if (section) {
        console.log('Setting current section to:', section)
        setCurrentSection(section)
      }
    }
  }, [])

  const handleLogout = () => {
    // Limpiar el token del localStorage
    localStorage.removeItem("token")
    // Redireccionar al login
    router.replace("/login")
  }

  const toggleMenu = (menu: string) => {
    setExpandedMenus(prev => ({
      ...prev,
      [menu]: !prev[menu as keyof typeof prev]
    }))
  }

  // Statistics
  const totalTables = tables.length
  const occupiedTables = tables.filter((t) => t.status === "occupied").length
  const totalProducts = 0 // Se obtendrá de la base de datos
  const onlineOrders = 12 // Mock data

  const stats = [
    {
      title: "Mesas Totales",
      value: totalTables,
      icon: LayoutDashboard,
      color: "text-primary",
      bgColor: "bg-primary/10",
    },
    {
      title: "Mesas Ocupadas",
      value: occupiedTables,
      icon: Users,
      color: "text-secondary",
      bgColor: "bg-secondary/10",
    },
    {
      title: "Productos",
      value: totalProducts,
      icon: UtensilsCrossed,
      color: "text-accent-foreground",
      bgColor: "bg-accent",
    },
    {
      title: "Pedidos Online",
      value: onlineOrders,
      icon: Globe,
      color: "text-primary",
      bgColor: "bg-primary/10",
    },
  ]

  return (
    <div className="flex h-screen w-full bg-gradient-to-br from-gray-50 to-gray-100 overflow-hidden">
      {/* Sidebar */}
      <div className="w-80 bg-white shadow-xl flex flex-col flex-shrink-0 border-r border-gray-200">
        {/* Título del Menú */}
        <div className="p-6 border-b border-gray-100 bg-gradient-to-r from-purple-50 to-gray-50">
          <h2 className="text-xl font-bold text-gray-800">Menú Principal</h2>
          <p className="text-sm text-gray-600 mt-1">Sistema de Restaurante</p>
        </div>

        {/* Botón POS Principal */}
        <div className="p-6">
            <Button 
            onClick={() => router.push("/pos")} 
            className="w-full bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white py-4 rounded-xl shadow-lg transition-all duration-200 transform hover:scale-105"
            >
            <ShoppingCart className="mr-3 h-6 w-6" />
            Abrir POS
            </Button>
        </div>

        {/* Botón Ir a Mesas */}
        <div className="px-6 pb-6">
            <Button 
            onClick={() => router.push("/tables")} 
            className="w-full bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white py-4 rounded-xl shadow-lg transition-all duration-200 transform hover:scale-105"
            >
            <LayoutDashboard className="mr-3 h-6 w-6" />
            Ir a Mesas
            </Button>
        </div>

        {/* Menú de Navegación */}
        <div className="flex-1 overflow-y-auto px-6">
          <nav className="space-y-3">
            {/* Usuarios */}
            <div>
              <button
                onClick={() => toggleMenu('usuarios')}
                className="w-full flex items-center justify-between p-4 text-left text-gray-700 hover:bg-purple-50 hover:text-purple-700 rounded-xl transition-all duration-200 border border-transparent hover:border-purple-200"
              >
                <div className="flex items-center">
                  <Users className="h-5 w-5 mr-3 text-purple-600" />
                  <span className="font-semibold">Usuarios</span>
                </div>
                {expandedMenus.usuarios ? (
                  <ChevronDown className="h-4 w-4 text-purple-600" />
                ) : (
                  <ChevronRight className="h-4 w-4 text-gray-400" />
                )}
              </button>
              {expandedMenus.usuarios && (
                <div className="ml-8 space-y-2 mt-2">
                  <button
                    onClick={() => setCurrentSection("usuarios")}
                    className="w-full flex items-center p-3 text-sm text-gray-600 hover:bg-purple-100 hover:text-purple-700 rounded-lg transition-all duration-200"
                  >
                    <User className="h-4 w-4 mr-3" />
                    Usuarios
                  </button>
                  <button
                    onClick={() => setCurrentSection("meseros")}
                    className="w-full flex items-center p-3 text-sm text-gray-600 hover:bg-purple-100 hover:text-purple-700 rounded-lg transition-all duration-200"
                  >
                    <Users className="h-4 w-4 mr-3" />
                    Meseros
                  </button>
                </div>
              )}
            </div>

            {/* Terceros */}
            <div>
              <button
                onClick={() => toggleMenu('terceros')}
                className="w-full flex items-center justify-between p-4 text-left text-gray-700 hover:bg-purple-50 hover:text-purple-700 rounded-xl transition-all duration-200 border border-transparent hover:border-purple-200"
              >
                <div className="flex items-center">
                  <Building className="h-5 w-5 mr-3 text-purple-600" />
                  <span className="font-semibold">Terceros</span>
                </div>
                {expandedMenus.terceros ? (
                  <ChevronDown className="h-4 w-4 text-purple-600" />
                ) : (
                  <ChevronRight className="h-4 w-4 text-gray-400" />
                )}
              </button>
              {expandedMenus.terceros && (
                <div className="ml-8 space-y-2 mt-2">
                  <button
                    onClick={() => router.push("/clients")}
                    className="w-full flex items-center p-3 text-sm text-gray-600 hover:bg-purple-100 hover:text-purple-700 rounded-lg transition-all duration-200"
                  >
                    <Users className="h-4 w-4 mr-3" />
                    Gestión de Clientes
                  </button>
                  <button
                    onClick={() => setCurrentSection("proveedores")}
                    className="w-full flex items-center p-3 text-sm text-gray-600 hover:bg-purple-100 hover:text-purple-700 rounded-lg transition-all duration-200"
                  >
                    <Building className="h-4 w-4 mr-3" />
                    Proveedores
                  </button>
                </div>
              )}
            </div>

            {/* Ventas */}
            <div>
              <button
                onClick={() => toggleMenu('ventas')}
                className="w-full flex items-center justify-between p-4 text-left text-gray-700 hover:bg-purple-50 hover:text-purple-700 rounded-xl transition-all duration-200 border border-transparent hover:border-purple-200"
              >
                <div className="flex items-center">
                  <DollarSign className="h-5 w-5 mr-3 text-purple-600" />
                  <span className="font-semibold">Ventas</span>
                </div>
                {expandedMenus.ventas ? (
                  <ChevronDown className="h-4 w-4 text-purple-600" />
                ) : (
                  <ChevronRight className="h-4 w-4 text-gray-400" />
                )}
              </button>
              {expandedMenus.ventas && (
                <div className="ml-8 space-y-2 mt-2">
                  <button
                    onClick={() => router.push("/dashboard/compras")}
                    className="w-full flex items-center p-3 text-sm text-gray-600 hover:bg-purple-100 hover:text-purple-700 rounded-lg transition-all duration-200"
                  >
                    <BarChart className="h-4 w-4 mr-3" />
                    Lista de Ventas
                  </button>
                  <button
                    onClick={() => router.push("/pos")}
                    className="w-full flex items-center p-3 text-sm text-gray-600 hover:bg-purple-100 hover:text-purple-700 rounded-lg transition-all duration-200"
                  >
                    <FileText className="h-4 w-4 mr-3" />
                    Agregar Factura
                  </button>
                </div>
              )}
            </div>

            {/* Compras */}
                      <div>
              <button
                onClick={() => toggleMenu('compras')}
                className="w-full flex items-center justify-between p-4 text-left text-gray-700 hover:bg-purple-50 hover:text-purple-700 rounded-xl transition-all duration-200 border border-transparent hover:border-purple-200"
              >
                <div className="flex items-center">
                  <ShoppingBag className="h-5 w-5 mr-3 text-purple-600" />
                  <span className="font-semibold">Compras</span>
                </div>
                {expandedMenus.compras ? (
                  <ChevronDown className="h-4 w-4 text-purple-600" />
                ) : (
                  <ChevronRight className="h-4 w-4 text-gray-400" />
                )}
              </button>
              {expandedMenus.compras && (
                <div className="ml-8 space-y-2 mt-2">
                  <button
                    onClick={() => setCurrentSection("agregar-compra")}
                    className="w-full flex items-center p-3 text-sm text-gray-600 hover:bg-purple-100 hover:text-purple-700 rounded-lg transition-all duration-200"
                  >
                    <Plus className="h-4 w-4 mr-3" />
                    Agregar Compra
                  </button>
                  <button
                    onClick={() => setCurrentSection("compras")}
                    className="w-full flex items-center p-3 text-sm text-gray-600 hover:bg-purple-100 hover:text-purple-700 rounded-lg transition-all duration-200"
                  >
                    <BarChart className="h-4 w-4 mr-3" />
                    Lista de Compras
                  </button>
                </div>
              )}
                      </div>

            {/* Producción */}
            <div>
              <button
                onClick={() => toggleMenu('produccion')}
                className="w-full flex items-center justify-between p-4 text-left text-gray-700 hover:bg-purple-50 hover:text-purple-700 rounded-xl transition-all duration-200 border border-transparent hover:border-purple-200"
              >
                <div className="flex items-center">
                  <ChefHat className="h-5 w-5 mr-3 text-purple-600" />
                  <span className="font-semibold">Producción</span>
                </div>
                {expandedMenus.produccion ? (
                  <ChevronDown className="h-4 w-4 text-purple-600" />
                ) : (
                  <ChevronRight className="h-4 w-4 text-gray-400" />
                )}
              </button>
              {expandedMenus.produccion && (
                <div className="ml-8 space-y-2 mt-2">
                  <button
                    onClick={() => router.push("/dashboard/recetas")}
                    className="w-full flex items-center p-3 text-sm text-gray-600 hover:bg-purple-100 hover:text-purple-700 rounded-lg transition-all duration-200"
                  >
                    <FileText className="h-4 w-4 mr-3" />
                    Gestión de Recetas
                  </button>
                  <button
                    onClick={() => router.push('/produccion')}
                    className="w-full flex items-center p-3 text-sm text-gray-600 hover:bg-purple-100 hover:text-purple-700 rounded-lg transition-all duration-200"
                  >
                    <Package className="h-4 w-4 mr-3" />
                    Producir
                  </button>
                </div>
              )}
            </div>

            {/* Configuración */}
            <div>
              <button
                onClick={() => toggleMenu('configuracion')}
                className="w-full flex items-center justify-between p-4 text-left text-gray-700 hover:bg-purple-50 hover:text-purple-700 rounded-xl transition-all duration-200 border border-transparent hover:border-purple-200"
              >
                <div className="flex items-center">
                  <Settings className="h-5 w-5 mr-3 text-purple-600" />
                  <span className="font-semibold">Configuración</span>
                </div>
                {expandedMenus.configuracion ? (
                  <ChevronDown className="h-4 w-4 text-purple-600" />
                ) : (
                  <ChevronRight className="h-4 w-4 text-gray-400" />
                )}
              </button>
              {expandedMenus.configuracion && (
                <div className="ml-8 space-y-2 mt-2">
                  <button
                    onClick={() => router.push("/tables")}
                    className="w-full flex items-center p-3 text-sm text-gray-600 hover:bg-purple-100 hover:text-purple-700 rounded-lg transition-all duration-200"
                  >
                    <LayoutDashboard className="h-4 w-4 mr-3" />
                    Gestionar Mesas
                  </button>
                  <button
                    onClick={() => router.push('/comandas')}
                    className="w-full flex items-center p-3 text-sm text-gray-600 hover:bg-purple-100 hover:text-purple-700 rounded-lg transition-all duration-200"
                  >
                    <Clock className="h-4 w-4 mr-3" />
                    Ver Comandas
                  </button>
                </div>
              )}
            </div>

            {/* Gestionar Productos */}
            <button
              onClick={() => setCurrentSection("productos")}
              className="w-full flex items-center p-4 text-left text-gray-700 hover:bg-purple-50 hover:text-purple-700 rounded-xl transition-all duration-200 border border-transparent hover:border-purple-200"
            >
              <Package className="h-5 w-5 mr-3 text-purple-600" />
              <span className="font-semibold">Gestionar Productos</span>
            </button>



            {/* Comandas */}
            <button
              onClick={() => router.push('/comandas')}
              className="w-full flex items-center p-4 text-left text-gray-700 hover:bg-purple-50 hover:text-purple-700 rounded-xl transition-all duration-200 border border-transparent hover:border-purple-200"
            >
              <Clock className="h-5 w-5 mr-3 text-purple-600" />
              <span className="font-semibold">Comandas</span>
            </button>



            {/* Gestión de Áreas */}
            <button
              onClick={() => setCurrentSection("areas")}
              className="w-full flex items-center p-4 text-left text-gray-700 hover:bg-purple-50 hover:text-purple-700 rounded-xl transition-all duration-200 border border-transparent hover:border-purple-200"
                  >
              <Settings className="h-5 w-5 mr-3 text-purple-600" />
              <span className="font-semibold">Gestión de Áreas</span>
            </button>

            {/* Configurar Web */}
            <button
              onClick={() => setCurrentSection("web")}
              className="w-full flex items-center p-4 text-left text-gray-700 hover:bg-purple-50 hover:text-purple-700 rounded-xl transition-all duration-200 border border-transparent hover:border-purple-200"
            >
              <Globe className="h-5 w-5 mr-3 text-purple-600" />
              <span className="font-semibold">Configurar Web</span>
            </button>

            {/* Probar BD */}
            <button
              onClick={() => setCurrentSection("test-database")}
              className="w-full flex items-center p-4 text-left text-gray-700 hover:bg-purple-50 hover:text-purple-700 rounded-xl transition-all duration-200 border border-transparent hover:border-purple-200"
                  >
              <Database className="h-5 w-5 mr-3 text-purple-600" />
              <span className="font-semibold">Probar BD</span>
            </button>

            {/* Centro de Ayuda */}
            <button
              onClick={() => router.push("/help")}
              className="w-full flex items-center p-4 text-left text-gray-700 hover:bg-purple-50 hover:text-purple-700 rounded-xl transition-all duration-200 border border-transparent hover:border-purple-200"
            >
              <HelpCircle className="h-5 w-5 mr-3 text-purple-600" />
              <span className="font-semibold">Centro de Ayuda</span>
            </button>

            {/* Ajustes */}
            <div className="mt-8 p-6 border-t border-gray-200 bg-gray-50">
              <div className="flex items-center gap-3">
                <Settings className="h-5 w-5 text-gray-500" />
                <span className="font-semibold text-gray-700">Ajustes</span>
              </div>
              <div className="flex items-center justify-between mt-4">
                <span className="text-sm text-gray-700">Usar comandas</span>
                {isMounted && <Switch checked={usaComandas} onCheckedChange={setUsaComandas} />}
              </div>
            </div>
          </nav>
        </div>

        {/* Botón Cerrar Sesión */}
        <div className="p-6 border-t border-gray-200 bg-gray-50">
                  <Button
            onClick={handleLogout}
            className="w-full bg-red-500 hover:bg-red-600 text-white py-4 rounded-xl shadow-lg transition-all duration-200 transform hover:scale-105"
                  >
            <LogOut className="mr-3 h-6 w-6" />
            Cerrar Sesión
                  </Button>
        </div>
      </div>

      {/* Contenido Principal */}
      <div className="flex-1 flex flex-col bg-gradient-to-br from-gray-50 to-gray-100 overflow-hidden w-full">
        <div className="flex-1 p-8 flex flex-col min-h-0 w-full">
          {currentSection === "resumen" && (
            <div className="flex-1 flex flex-col min-h-0">
              {/* Header del Contenido */}
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h1 className="text-4xl font-bold text-gray-800">Resumen</h1>
                  <p className="text-gray-600 mt-2 text-lg">Vista general de tu restaurante</p>
                </div>
                <div className="flex gap-4">
                  <Button
                    variant="outline"
                    onClick={() => router.push("/tables")}
                    className="bg-white/80 backdrop-blur-sm text-purple-700 border-purple-300 hover:bg-purple-50 hover:border-purple-400 shadow-sm transition-all duration-200"
                  >
                    <LayoutDashboard className="mr-2 h-4 w-4" />
                    Gestionar Mesas
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => router.push("/pos")}
                    className="bg-white/80 backdrop-blur-sm text-purple-700 border-purple-300 hover:bg-purple-50 hover:border-purple-400 shadow-sm transition-all duration-200"
                  >
                    <ShoppingCart className="mr-2 h-4 w-4" />
                    Abrir POS
                  </Button>
                </div>
              </div>

              {/* Cards de Estadísticas */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                {stats.map((stat, index) => (
                  <Card key={index} className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 bg-white/80 backdrop-blur-sm">
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-gray-600 mb-1">{stat.title}</p>
                          <p className="text-3xl font-bold text-gray-800">{stat.value}</p>
                        </div>
                        <div className={`p-4 rounded-xl ${stat.bgColor} shadow-md`}>
                          <stat.icon className={`h-7 w-7 ${stat.color}`} />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {/* Actividad Reciente */}
              <div className="flex-1 min-h-0">
                <Card className="border-0 shadow-lg h-full flex flex-col bg-white/80 backdrop-blur-sm">
                  <CardHeader className="pb-4">
                    <CardTitle className="flex items-center gap-3 text-xl">
                      <BarChart3 className="h-6 w-6 text-purple-600" />
                      Actividad Reciente
                    </CardTitle>
                    <CardDescription className="text-gray-600">Resumen de la actividad del restaurante</CardDescription>
                  </CardHeader>
                  <CardContent className="flex-1 flex items-center justify-center min-h-0">
                    <div className="text-center py-12">
                      <div className="w-16 h-16 bg-gradient-to-r from-purple-400 to-purple-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
                        <BarChart3 className="h-8 w-8 text-white" />
                      </div>
                      <p className="text-gray-500 text-lg">Los datos de actividad aparecerán aquí</p>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          )}

          {currentSection === "productos" && (
            <div className="h-full overflow-y-auto">
              <div className="mb-8">
              </div>
              <ProductManagement />
            </div>
          )}



          {currentSection === "web" && (
            <div>
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h1 className="text-4xl font-bold text-gray-800 mb-2">
                    Configuración de Página Web
                  </h1>
                  <p className="text-gray-600 text-lg">
                    Gestiona tu presencia online y pedidos web
                  </p>
                </div>
                <div className="flex gap-4">
                  <Button
                    className="bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white shadow-lg hover:shadow-xl transition-all duration-200 px-6 py-3 rounded-xl"
                    onClick={() => {
                      const token = localStorage.getItem("token")
                      if (token) {
                        try {
                          const decoded: any = jwtDecode(token)
                          const businessId = decoded.business_id
                          if (businessId) {
                            window.open(`/web/${businessId}`, "_blank")
                          } else {
                            window.open("/web", "_blank")
                          }
                        } catch {
                          window.open("/web", "_blank")
                        }
                      } else {
                        window.open("/web", "_blank")
                      }
                    }}
                  >
                    <Eye className="mr-2 h-5 w-5" />
                    Ver Página Web
                  </Button>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
                <Card className="border border-gray-200 shadow-sm hover:shadow-md transition-shadow duration-200">
                  <CardHeader className="pb-4">
                    <CardTitle className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                      <Globe className="h-5 w-5 text-purple-500" />
                      Estado Web
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-center justify-between py-2">
                      <span className="text-sm text-gray-600">Estado</span>
                      <Badge className="bg-green-100 text-green-700 text-xs px-2 py-1">Activa</Badge>
                    </div>
                    <div className="flex items-center justify-between py-2">
                      <span className="text-sm text-gray-600">Pedidos Online</span>
                      <Badge className="bg-blue-100 text-blue-700 text-xs px-2 py-1">Habilitados</Badge>
                    </div>
                    <div className="flex items-center justify-between py-2">
                      <span className="text-sm text-gray-600">Actualización</span>
                      <span className="text-xs text-gray-500">Hace 2h</span>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border border-gray-200 shadow-sm hover:shadow-md transition-shadow duration-200">
                  <CardHeader className="pb-4">
                    <CardTitle className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                      <BarChart3 className="h-5 w-5 text-purple-500" />
                      Estadísticas
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-center justify-between py-2">
                      <span className="text-sm text-gray-600">Visitas hoy</span>
                      <span className="font-semibold text-purple-600">127</span>
                    </div>
                    <div className="flex items-center justify-between py-2">
                      <span className="text-sm text-gray-600">Pedidos online</span>
                      <span className="font-semibold text-purple-600">12</span>
                    </div>
                    <div className="flex items-center justify-between py-2">
                      <span className="text-sm text-gray-600">Conversión</span>
                      <span className="font-semibold text-gray-700">9.4%</span>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border border-gray-200 shadow-sm hover:shadow-md transition-shadow duration-200">
                  <CardHeader className="pb-4">
                    <CardTitle className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                      <Settings className="h-5 w-5 text-purple-500" />
                      Acciones
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <Button
                      className="w-full bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200 hover:border-purple-300 transition-all duration-200 py-2 text-sm"
                      onClick={() => router.push("/web-admin")}
                    >
                      <Settings className="mr-2 h-4 w-4" />
                      Configurar
                    </Button>
                    <Button
                      className="w-full bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200 hover:border-purple-300 transition-all duration-200 py-2 text-sm"
                      onClick={() => window.open("/web", "_blank")}
                    >
                      <Eye className="mr-2 h-4 w-4" />
                      Vista Previa
                    </Button>
                    <Button 
                      className="w-full bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200 hover:border-purple-300 transition-all duration-200 py-2 text-sm"
                    >
                      <BarChart3 className="mr-2 h-4 w-4" />
                      Analíticas
                    </Button>
                  </CardContent>
                </Card>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card className="border border-gray-200 shadow-sm hover:shadow-md transition-all duration-200 group cursor-pointer">
                  <CardContent className="p-6 text-center">
                    <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mx-auto mb-3 group-hover:bg-purple-200 transition-colors duration-200">
                      <Settings className="h-6 w-6 text-purple-600" />
                    </div>
                    <h3 className="font-semibold text-gray-800 mb-1">Configurar Contenido</h3>
                    <p className="text-xs text-gray-500">Personaliza tu página web</p>
                  </CardContent>
                </Card>

                <Card className="border border-gray-200 shadow-sm hover:shadow-md transition-all duration-200 group cursor-pointer">
                  <CardContent className="p-6 text-center">
                    <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mx-auto mb-3 group-hover:bg-purple-200 transition-colors duration-200">
                      <Eye className="h-6 w-6 text-purple-600" />
                    </div>
                    <h3 className="font-semibold text-gray-800 mb-1">Vista Previa</h3>
                    <p className="text-xs text-gray-500">Ve cómo se ve tu sitio</p>
                  </CardContent>
                </Card>

                <Card className="border border-gray-200 shadow-sm hover:shadow-md transition-all duration-200 group cursor-pointer">
                  <CardContent className="p-6 text-center">
                    <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mx-auto mb-3 group-hover:bg-purple-200 transition-colors duration-200">
                      <BarChart3 className="h-6 w-6 text-purple-600" />
                    </div>
                    <h3 className="font-semibold text-gray-800 mb-1">Analíticas</h3>
                    <p className="text-xs text-gray-500">Métricas y estadísticas</p>
                  </CardContent>
                </Card>

                <Card className="border border-gray-200 shadow-sm hover:shadow-md transition-all duration-200 group cursor-pointer">
                  <CardContent className="p-6 text-center">
                    <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mx-auto mb-3 group-hover:bg-purple-200 transition-colors duration-200">
                      <Globe className="h-6 w-6 text-purple-600" />
                    </div>
                    <h3 className="font-semibold text-gray-800 mb-1">Dominio</h3>
                    <p className="text-xs text-gray-500">Configura tu dominio</p>
                  </CardContent>
                </Card>
              </div>
            </div>
          )}

          {currentSection === "meseros" && (
            <div>
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h1 className="text-3xl font-bold text-gray-800">Gestión de Meseros</h1>
                  <p className="text-gray-600 mt-1">Administra el personal y sus asignaciones</p>
                </div>
                <Button className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white shadow-lg transform hover:scale-105 transition-all duration-200">
                  <Plus className="mr-2 h-5 w-5" />
                  Agregar Mesero
                </Button>
              </div>

              <Card className="border-0 shadow-xl bg-gradient-to-r from-white to-gray-50">
                <CardContent className="p-12">
                  <div className="text-center py-12">
                    <div className="w-24 h-24 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
                      <Users className="h-12 w-12 text-white" />
                    </div>
                    <h3 className="text-2xl font-bold text-gray-800 mb-4">Gestión de Personal</h3>
                    <p className="text-gray-600 mb-8 text-lg max-w-md mx-auto">
                      Aquí podrás gestionar los meseros y su asignación a las mesas de manera eficiente
                    </p>
                    <Button className="bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white px-8 py-3 rounded-full shadow-lg transform hover:scale-105 transition-all duration-200">
                      Próximamente
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {currentSection === "areas" && (
            <div>
              <AreaOrdersContent />
            </div>
          )}

          {currentSection === "test-database" && (
            <div>
              <TestDatabaseContent />
            </div>
          )}

          {currentSection === "usuarios" && (
            <div>
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h1 className="text-3xl font-bold text-gray-800">Gestión de Usuarios</h1>
                  <p className="text-gray-600 mt-1">Administra los usuarios del sistema</p>
                </div>
                <Button className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white shadow-lg transform hover:scale-105 transition-all duration-200">
                  <Plus className="mr-2 h-5 w-5" />
                  Nuevo Usuario
                </Button>
              </div>
              <Card className="border-0 shadow-xl bg-gradient-to-r from-white to-gray-50">
                <CardContent className="p-12">
                  <div className="text-center py-12">
                    <div className="w-24 h-24 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
                      <User className="h-12 w-12 text-white" />
                    </div>
                    <h3 className="text-2xl font-bold text-gray-800 mb-4">Gestión de Usuarios</h3>
                    <p className="text-gray-600 mb-8 text-lg max-w-md mx-auto">
                      Administra los usuarios del sistema y sus permisos
                    </p>
                    <Button className="bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white px-8 py-3 rounded-full shadow-lg transform hover:scale-105 transition-all duration-200">
                      Próximamente
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {currentSection === "clientes" && (
            <div>
              <ClientsContent />
            </div>
          )}

          {currentSection === "proveedores" && (
            <div>
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h1 className="text-3xl font-bold text-gray-800">Gestión de Proveedores</h1>
                  <p className="text-gray-600 mt-1">Administra los proveedores del restaurante</p>
                </div>
                <Button className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white shadow-lg transform hover:scale-105 transition-all duration-200">
                  <Plus className="mr-2 h-5 w-5" />
                  Nuevo Proveedor
                </Button>
              </div>
              <Card className="border-0 shadow-xl bg-gradient-to-r from-white to-gray-50">
                <CardContent className="p-12">
                  <div className="text-center py-12">
                    <div className="w-24 h-24 bg-gradient-to-r from-orange-500 to-red-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
                      <Building className="h-12 w-12 text-white" />
                    </div>
                    <h3 className="text-2xl font-bold text-gray-800 mb-4">Gestión de Proveedores</h3>
                    <p className="text-gray-600 mb-8 text-lg max-w-md mx-auto">
                      Administra la información de tus proveedores
                    </p>
                    <Button className="bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white px-8 py-3 rounded-full shadow-lg transform hover:scale-105 transition-all duration-200">
                      Próximamente
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}



          {currentSection === "facturas" && (
            <div>
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h1 className="text-3xl font-bold text-gray-800">Agregar Factura</h1>
                  <p className="text-gray-600 mt-1">Crea nuevas facturas de venta</p>
                </div>
                <Button className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white shadow-lg transform hover:scale-105 transition-all duration-200">
                  <FileText className="mr-2 h-5 w-5" />
                  Nueva Factura
                </Button>
              </div>
              <Card className="border-0 shadow-xl bg-gradient-to-r from-white to-gray-50">
                <CardContent className="p-12">
                  <div className="text-center py-12">
                    <div className="w-24 h-24 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
                      <FileText className="h-12 w-12 text-white" />
                    </div>
                    <h3 className="text-2xl font-bold text-gray-800 mb-4">Agregar Factura</h3>
                    <p className="text-gray-600 mb-8 text-lg max-w-md mx-auto">
                      Crea y gestiona facturas de venta
                    </p>
                    <Button className="bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 text-white px-8 py-3 rounded-full shadow-lg transform hover:scale-105 transition-all duration-200">
                      Próximamente
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {currentSection === "agregar-compra" && (
            <div>
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h1 className="text-3xl font-bold text-gray-800">Agregar Compra</h1>
                  <p className="text-gray-600 mt-1">Registra nuevas compras de inventario</p>
                </div>
                <Button className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white shadow-lg transform hover:scale-105 transition-all duration-200">
                  <Plus className="mr-2 h-5 w-5" />
                  Nueva Compra
                </Button>
              </div>
              <Card className="border-0 shadow-xl bg-gradient-to-r from-white to-gray-50">
                <CardContent className="p-12">
                  <div className="text-center py-12">
                    <div className="w-24 h-24 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
                      <Plus className="h-12 w-12 text-white" />
                    </div>
                    <h3 className="text-2xl font-bold text-gray-800 mb-4">Agregar Compra</h3>
                    <p className="text-gray-600 mb-8 text-lg max-w-md mx-auto">
                      Registra compras de inventario y materias primas
                    </p>
                    <Button className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white px-8 py-3 rounded-full shadow-lg transform hover:scale-105 transition-all duration-200">
                      Próximamente
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {currentSection === "compras" && (
            <div>
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h1 className="text-3xl font-bold text-gray-800">Lista de Compras</h1>
                  <p className="text-gray-600 mt-1">Consulta el historial de compras</p>
                </div>
                <Button className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white shadow-lg transform hover:scale-105 transition-all duration-200">
                  <BarChart className="mr-2 h-5 w-5" />
                  Exportar
                </Button>
              </div>
              <Card className="border-0 shadow-xl bg-gradient-to-r from-white to-gray-50">
                <CardContent className="p-12">
                  <div className="text-center py-12">
                    <div className="w-24 h-24 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
                      <BarChart className="h-12 w-12 text-white" />
                    </div>
                    <h3 className="text-2xl font-bold text-gray-800 mb-4">Lista de Compras</h3>
                    <p className="text-gray-600 mb-8 text-lg max-w-md mx-auto">
                      Consulta el historial completo de compras
                    </p>
                    <Button className="bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white px-8 py-3 rounded-full shadow-lg transform hover:scale-105 transition-all duration-200">
                      Próximamente
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {currentSection === "recetas" && (
            <div>
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h1 className="text-3xl font-bold text-gray-800">Gestión de Recetas</h1>
                  <p className="text-gray-600 mt-1">Administra las recetas de producción</p>
                </div>
                <Button className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white shadow-lg transform hover:scale-105 transition-all duration-200">
                  <FileText className="mr-2 h-5 w-5" />
                  Nueva Receta
                  </Button>
              </div>
              <Card className="border-0 shadow-xl bg-gradient-to-r from-white to-gray-50">
                <CardContent className="p-12">
                  <div className="text-center py-12">
                    <div className="w-24 h-24 bg-gradient-to-r from-yellow-500 to-orange-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
                      <FileText className="h-12 w-12 text-white" />
                    </div>
                    <h3 className="text-2xl font-bold text-gray-800 mb-4">Gestión de Recetas</h3>
                    <p className="text-gray-600 mb-8 text-lg max-w-md mx-auto">
                      Administra las recetas y fórmulas de producción
                    </p>
                  <Button
                      onClick={() => router.push("/dashboard/recetas")}
                      className="bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-white px-8 py-3 rounded-full shadow-lg transform hover:scale-105 transition-all duration-200"
                    >
                      Ir a Recetas
                  </Button>
                </div>
              </CardContent>
            </Card>
      </div>
          )}

          {currentSection === "comandas" && (
            <ComandasContent />
          )}
        </div>
      </div>
    </div>
  )
}
