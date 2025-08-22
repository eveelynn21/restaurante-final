"use client"

import React, { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Clock, AlertCircle, CheckCircle, Loader2, Check, User, MapPin } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { useComandas } from "../context/comandas-context"
import { useRouter } from "next/navigation"
import { jwtDecode } from "jwt-decode"

interface OrderArea {
  id: number
  name: string
}

// Helper function to get business_id from token
const getBusinessIdFromToken = (): number | null => {
  try {
    const token = localStorage.getItem('token')
    if (!token) return null
    const decoded: any = jwtDecode(token)
    return decoded.business_id || null
  } catch {
    return null
  }
}

export default function ComandasContent() {
  const [areas, setAreas] = useState<OrderArea[]>([])
  const [selectedArea, setSelectedArea] = useState<OrderArea | null>(null)
  const [loading, setLoading] = useState(true)
  const { getComandasByArea, updateComandaStatus, moveToProduccion, clearComandasByArea } = useComandas()
  const router = useRouter()
  const [refresh, setRefresh] = useState(0)

  // Cargar áreas de la base de datos
  useEffect(() => {
    const loadAreas = async () => {
      try {
        setLoading(true)
        const token = localStorage.getItem('token')
        const response = await fetch('/api/order-areas', {
          headers: { 'Authorization': `Bearer ${token}` }
        })
        if (response.ok) {
          const data = await response.json()
          if (data.success && Array.isArray(data.data)) {
            // Siempre agregar área General al inicio
            const areasWithGeneral = [
              { id: 0, name: "General" },
              ...data.data
            ]
            setAreas(areasWithGeneral)
            // Seleccionar General por defecto
            setSelectedArea(areasWithGeneral[0])
          } else {
            // Si no hay datos válidos, al menos mostrar General
            setAreas([{ id: 0, name: "General" }])
            setSelectedArea({ id: 0, name: "General" })
          }
        } else {
          // Si la respuesta no es ok, mostrar solo General
          setAreas([{ id: 0, name: "General" }])
          setSelectedArea({ id: 0, name: "General" })
        }
      } catch (error) {
        console.error('Error cargando áreas:', error)
        // Si hay error, al menos mostrar General
        setAreas([{ id: 0, name: "General" }])
        setSelectedArea({ id: 0, name: "General" })
      } finally {
        setLoading(false)
      }
    }

    loadAreas()
  }, [])

  // Polling para refrescar la página completamente cada 10 segundos
  useEffect(() => {
    const interval = setInterval(() => {
      window.location.reload()
    }, 10000)
    return () => clearInterval(interval)
  }, [])

  return (
    <div className="flex flex-col h-full min-h-[80vh] space-y-6">
      {/* Header mejorado */}
      <div className="bg-gradient-to-r from-purple-50 to-gray-50 border-b border-purple-200 shadow-sm">
        <div className="flex items-center justify-between px-6 py-4">
          <div>
            <h1 className="text-3xl font-bold text-purple-800">
              Sistema de Comandas
            </h1>
            <p className="text-purple-600 mt-1 text-sm font-medium">
              Gestiona las comandas por área de preparación
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Button 
              onClick={() => router.push('/dashboard')} 
              variant="outline" 
              size="default" 
              className="bg-white/90 backdrop-blur-sm text-purple-700 border-purple-300 hover:bg-purple-50 hover:border-purple-400 shadow-sm transition-all duration-200"
            >
              Dashboard
            </Button>
            <Button 
              onClick={() => router.push('/tables')} 
              variant="outline" 
              size="default" 
              className="bg-white/90 backdrop-blur-sm text-purple-700 border-purple-300 hover:bg-purple-50 hover:border-purple-400 shadow-sm transition-all duration-200"
            >
              Mesas
            </Button>
            <Button 
              onClick={() => router.push('/pos')} 
              variant="outline" 
              size="default" 
              className="bg-white/90 backdrop-blur-sm text-purple-700 border-purple-300 hover:bg-purple-50 hover:border-purple-400 shadow-sm transition-all duration-200"
            >
              POS
            </Button>
            <Button 
              onClick={() => router.push('/produccion')} 
              variant="outline" 
              size="default" 
              className="bg-white/90 backdrop-blur-sm text-purple-700 border-purple-300 hover:bg-purple-50 hover:border-purple-400 shadow-sm transition-all duration-200"
            >
              Producción
            </Button>
            <button
              className="px-6 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg shadow-md text-sm font-semibold transition-all duration-200 transform hover:scale-105"
              onClick={() => selectedArea && clearComandasByArea(selectedArea.name)}
              disabled={!selectedArea || getComandasByArea(selectedArea.name).length === 0}
            >
              Limpiar comandas
            </button>
          </div>
        </div>
      </div>

      {/* Pestañas de áreas */}
      {loading ? (
        <div className="text-center py-12">
          <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando áreas...</p>
        </div>
      ) : areas.length === 0 ? (
        <div className="text-center py-12">
          <AlertCircle className="h-12 w-12 text-orange-500 mx-auto mb-4" />
          <p className="text-gray-600 mb-2">No hay áreas configuradas</p>
          <p className="text-sm text-gray-500">Configura las áreas en la sección de configuración</p>
        </div>
      ) : (
        <>
          {/* Tabs de áreas mejorados */}
          <div className="px-6">
            <div className="flex space-x-1 bg-purple-50 p-1 rounded-xl">
              {areas.map((area) => (
                <button
                  key={area.id}
                  onClick={() => setSelectedArea(area)}
                  className={`px-6 py-3 text-sm font-medium rounded-lg transition-all duration-200 flex-1 ${
                    selectedArea?.id === area.id
                      ? 'bg-white text-purple-700 shadow-md transform scale-105'
                      : 'text-purple-600 hover:bg-white/70 hover:text-purple-800'
                  }`}
                >
                  {area.name}
                </button>
              ))}
            </div>
          </div>

          {/* Contenido del área seleccionada */}
          {selectedArea && (
            <Card className="border-0 shadow-lg flex-1 flex flex-col overflow-y-auto">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5 text-purple-600" />
                  Comandas - {selectedArea.name}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ComandasList 
                  areaId={selectedArea.id.toString()} 
                  areaName={selectedArea.name}
                  onUpdateStatus={updateComandaStatus}
                  onMoveToProduccion={moveToProduccion}
                  refresh={refresh}
                />
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  )
}

interface ComandasListProps {
  areaId: string
  areaName: string
  onUpdateStatus: (id: string, status: "pending" | "preparing" | "ready" | "completed") => void
  onMoveToProduccion: (comanda: any) => void
  refresh: number
}

function ComandasList({ areaId, areaName, onUpdateStatus, onMoveToProduccion, refresh }: ComandasListProps) {
  const { getComandasByArea, comandas } = useComandas()
  const [localComandas, setLocalComandas] = useState(() => getComandasByArea(areaName))
  useEffect(() => {
    setLocalComandas(getComandasByArea(areaName))
  }, [areaName, refresh, getComandasByArea, comandas])

  if (localComandas.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="w-24 h-24 bg-gradient-to-r from-purple-400 to-purple-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
          <Clock className="h-12 w-12 text-white" />
        </div>
        <h3 className="text-2xl font-bold text-gray-800 mb-4">Comandas de {areaName}</h3>
        <p className="text-gray-600 mb-8 text-lg max-w-md mx-auto">
          Aquí se mostrarán las comandas pendientes y en preparación para {areaName}
        </p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {localComandas.map((comanda) => (
        <Card key={comanda.id} className="border shadow-md">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <MapPin className="h-4 w-4 text-gray-500" />
                <span className="font-medium">Mesa {comanda.tableNumber}</span>
                <User className="h-4 w-4 text-gray-500" />
                <span className="text-sm text-gray-600">{comanda.waiter}</span>
              </div>
              <span className="text-xs text-gray-500">{new Date(comanda.createdAt).toLocaleTimeString()}</span>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {comanda.items.map((item, idx) => (
                <div key={item.id + '-' + idx} className="flex items-center justify-between bg-white rounded p-1 border text-xs">
                  <div className="flex-1">
                    <span className="font-medium text-xs">{item.quantity}x {item.name}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Badge className={item.status === 'pending' ? 'bg-red-100 text-red-800' : item.status === 'preparing' ? 'bg-yellow-100 text-yellow-800' : item.status === 'ready' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'} style={{ fontSize: '0.7rem', padding: '2px 6px' }}>
                      {item.status === 'pending' ? 'Pendiente' : item.status === 'preparing' ? 'Preparando' : item.status === 'ready' ? 'Listo' : 'Completado'}
                    </Badge>
                    {item.status === "pending" && (
                      <Button size="sm" style={{ fontSize: '0.7rem', padding: '2px 8px', minWidth: '70px' }} onClick={() => {
                        const newItems = comanda.items.map((it, i) => i === idx ? { ...it, status: "ready" } : it)
                        comanda.items = newItems
                        onUpdateStatus(comanda.id, comanda.status)
                      }} className="bg-yellow-500 hover:bg-yellow-600 whitespace-nowrap">
                        <Loader2 className="h-3 w-3 mr-1" />
                        Empezar
                      </Button>
                    )}
                    {item.status === "ready" && (
                      <Button size="sm" style={{ fontSize: '0.7rem', padding: '2px 8px', minWidth: '70px' }} onClick={() => {
                        // Marcar como completado y eliminar el producto de la comanda
                        const newItems = comanda.items.filter((it, i) => i !== idx)
                        if (newItems.length === 0) {
                          // Si no quedan productos, eliminar la comanda completamente
                          const businessId = getBusinessIdFromToken()
                          const comandasKey = businessId ? `restaurante-comandas-${businessId}` : 'restaurante-comandas'
                          const existingComandas = JSON.parse(localStorage.getItem(comandasKey) || '[]')
                          const updatedComandas = existingComandas.filter((c: any) => c.id !== comanda.id)
                          localStorage.setItem(comandasKey, JSON.stringify(updatedComandas))
                          // Actualizar el estado local inmediatamente
                          setLocalComandas(prev => prev.filter(c => c.id !== comanda.id))
                        } else {
                          // Actualizar la comanda con los items restantes
                          const updatedComanda = { ...comanda, items: newItems }
                          // Actualizar localStorage directamente
                          const businessId = getBusinessIdFromToken()
                          const comandasKey = businessId ? `restaurante-comandas-${businessId}` : 'restaurante-comandas'
                          const existingComandas = JSON.parse(localStorage.getItem(comandasKey) || '[]')
                          const updatedComandas = existingComandas.map((c: any) => 
                            c.id === comanda.id ? updatedComanda : c
                          )
                          localStorage.setItem(comandasKey, JSON.stringify(updatedComandas))
                          // Actualizar el estado local inmediatamente
                          setLocalComandas(prev => prev.map(c => c.id === comanda.id ? updatedComanda : c))
                        }
                        // Agregar a produccion solo este producto
                        onMoveToProduccion({
                          ...comanda,
                          items: [{ ...item, status: 'completed' }],
                        })
                      }} variant="outline" className="whitespace-nowrap">
                        <Check className="h-3 w-3 mr-1" />
                        Completado
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
} 