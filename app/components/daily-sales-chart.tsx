"use client"

import { useState, useEffect } from "react"
import { TrendingUp, DollarSign, ShoppingCart } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

interface DailySalesData {
  date: string
  total_transactions: number
  total_sales: number
  hourly_data: Array<{
    hour: number
    transaction_count: number
    total_sales: number
  }>
}

export default function DailySalesChart() {
  const [salesData, setSalesData] = useState<DailySalesData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchDailySales()
  }, [])

  const fetchDailySales = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const token = localStorage.getItem('token')
      if (!token) {
        setError('No se encontró token de autenticación')
        return
      }

      const response = await fetch('/api/transactions/daily-sales', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (!response.ok) {
        throw new Error('Error al obtener datos de ventas')
      }

             const data = await response.json()
       if (data.success) {
         setSalesData(data.data)
       } else {
         setError(data.error || 'Error al obtener datos')
       }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido')
    } finally {
      setLoading(false)
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(Math.round(amount))
  }

  const formatHour = (hour: number) => {
    return `${hour.toString().padStart(2, '0')}:00`
  }

  const getMaxSales = () => {
    if (!salesData) return 0
    return Math.max(...salesData.hourly_data.map(h => h.total_sales))
  }

  const getBarHeight = (sales: number) => {
    const maxSales = getMaxSales()
    if (maxSales === 0) return 0
    // Si hay ventas, mostrar al menos 20px de altura para que sea visible
    if (sales > 0) {
      return Math.max((sales / maxSales) * 200, 20)
    }
    return 0
  }

  if (loading) {
    return (
      <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-3 text-xl">
            <TrendingUp className="h-6 w-6 text-purple-600" />
            Ventas del Día
          </CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="w-8 h-8 border-4 border-purple-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-500">Cargando datos de ventas...</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-3 text-xl">
            <TrendingUp className="h-6 w-6 text-purple-600" />
            Ventas del Día
          </CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <TrendingUp className="h-8 w-8 text-red-500" />
            </div>
            <p className="text-red-500 mb-2">Error al cargar datos</p>
            <p className="text-gray-500 text-sm">{error}</p>
            <button 
              onClick={fetchDailySales}
              className="mt-4 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
            >
              Reintentar
            </button>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (!salesData) {
    return (
      <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-3 text-xl">
            <TrendingUp className="h-6 w-6 text-purple-600" />
            Ventas del Día
          </CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <TrendingUp className="h-8 w-8 text-gray-400" />
            </div>
            <p className="text-gray-500">No hay datos disponibles</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-3 text-xl">
          <TrendingUp className="h-6 w-6 text-purple-600" />
          Ventas del Día
        </CardTitle>
        <div className="flex items-center gap-6 text-sm text-gray-600">
          <div className="flex items-center gap-2">
            <DollarSign className="h-4 w-4 text-green-600" />
            <span>Total: {formatCurrency(salesData.total_sales)}</span>
          </div>
          <div className="flex items-center gap-2">
            <ShoppingCart className="h-4 w-4 text-blue-600" />
            <span>Transacciones: {salesData.total_transactions}</span>
          </div>
        </div>
      </CardHeader>
             <CardContent>
         <div className="space-y-4">
           {/* Gráfico de barras */}
           <div className="h-64 flex items-end justify-between gap-1 px-4">
                          {salesData.hourly_data.map((hourData, index) => (
               <div key={index} className="flex-1 flex flex-col items-center">
                 <div className="relative group">
                                     <div 
                     className="w-full bg-gradient-to-t from-purple-600 to-purple-400 rounded-t-lg transition-all duration-200 hover:from-purple-700 hover:to-purple-500 cursor-pointer border border-purple-300"
                     style={{ 
                       height: `${getBarHeight(hourData.total_sales)}px`,
                       minHeight: hourData.total_sales > 0 ? '20px' : '0px'
                     }}
                   />
                  {/* Tooltip */}
                  <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap z-10">
                    <div>{formatHour(hourData.hour)}</div>
                    <div>{formatCurrency(hourData.total_sales)}</div>
                    <div>{hourData.transaction_count} ventas</div>
                  </div>
                </div>
                <span className="text-xs text-gray-500 mt-2">
                  {formatHour(hourData.hour)}
                </span>
              </div>
            ))}
          </div>
          
          {/* Leyenda */}
          <div className="flex items-center justify-center gap-4 text-xs text-gray-500">
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 bg-purple-600 rounded"></div>
              <span>Ventas por hora</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
