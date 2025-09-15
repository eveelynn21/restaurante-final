"use client"

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card'
import { Button } from '../../components/ui/button'
import { Badge } from '../../components/ui/badge'
import { Clock, MapPin, User, Check, Loader2 } from 'lucide-react'
import { useComandas } from '../context/comandas-context'
import { useRouter } from 'next/navigation'

interface OrderArea {
  id: number
  name: string
}

const getBusinessIdFromToken = (): number | null => {
  try {
    const token = localStorage.getItem('token')
    if (!token) return null
    const payload = JSON.parse(atob(token.split('.')[1]))
    return payload.business_id || null
  } catch {
    return null
  }
}

export default function ComandasContent() {
  const [areas, setAreas] = useState<OrderArea[]>([])
  const [selectedArea, setSelectedArea] = useState<OrderArea | null>(null)
  const [loading, setLoading] = useState(true)
  const { getComandasByArea, updateProductStatus, moveToProduccion, clearComandasByArea, loadComandasByArea } = useComandas()
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

  // Cargar comandas cuando cambie el área seleccionada
  useEffect(() => {
    if (selectedArea) {
      loadComandasByArea(selectedArea.name)
    }
  }, [selectedArea, loadComandasByArea])

  // Polling para refrescar la página completamente cada 10 segundos
  useEffect(() => {
    const interval = setInterval(() => {
      setRefresh(prev => prev + 1)
    }, 10000)

    return () => clearInterval(interval)
  }, [])

  // Refrescar comandas cuando cambie el refresh
  useEffect(() => {
    if (selectedArea) {
      loadComandasByArea(selectedArea.name)
    }
  }, [refresh, selectedArea, loadComandasByArea])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-purple-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando comandas...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-purple-600">Sistema de Comandas</h1>
            <p className="text-gray-600 mt-1">Gestiona las comandas por área de preparación</p>
          </div>
          <div className="flex items-center gap-4">
            <Button variant="outline" onClick={() => router.push('/dashboard')}>
              Dashboard
            </Button>
            <Button variant="outline" onClick={() => router.push('/tables')}>
              Mesas
            </Button>
            <Button variant="outline" onClick={() => router.push('/pos')}>
              POS
            </Button>
            <Button variant="outline" onClick={() => router.push('/produccion')}>
              Producción
            </Button>
            <Button 
              variant="destructive" 
              onClick={() => {
                if (selectedArea) {
                  clearComandasByArea(selectedArea.name)
                }
              }}
            >
              Limpiar comandas
            </Button>
          </div>
        </div>
      </div>

      {/* Contenido principal */}
      <div className="flex gap-6 p-6">
        {/* Sidebar de áreas */}
        <div className="w-64 space-y-2">
          {areas.map((area) => (
            <Button
              key={area.id}
              variant={selectedArea?.id === area.id ? "default" : "outline"}
              className="w-full justify-start"
              onClick={() => setSelectedArea(area)}
            >
              {area.name}
            </Button>
          ))}
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
                onUpdateProductStatus={updateProductStatus}
                onMoveToProduccion={moveToProduccion}
                refresh={refresh}
              />
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}

interface ComandasListProps {
  areaId: string
  areaName: string
  onUpdateProductStatus: (comandaId: string, productId: number, status: string) => Promise<void>
  onMoveToProduccion: (comanda: any) => void
  refresh: number
}

function ComandasList({ areaId, areaName, onUpdateProductStatus, onMoveToProduccion, refresh }: ComandasListProps) {
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
      {localComandas.filter(comanda => comanda.items.some(item => item.status !== 'completed')).map((comanda) => (
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
              {comanda.items.filter(item => item.status !== 'completed').map((item, idx) => (
                <div key={item.id + '-' + idx} className="flex items-center justify-between bg-white rounded p-1 border text-xs">
                  <div className="flex-1">
                    <span className="font-medium text-xs">{item.quantity}x {item.name}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Badge className={item.status === 'pending' ? 'bg-red-100 text-red-800' : item.status === 'preparing' ? 'bg-yellow-100 text-yellow-800' : item.status === 'ready' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'} style={{ fontSize: '0.7rem', padding: '2px 6px' }}>
                      {item.status === 'pending' ? 'Pendiente' : item.status === 'preparing' ? 'Preparando' : item.status === 'ready' ? 'Listo' : 'Completado'}
                    </Badge>
                    {item.status === "pending" && (
                      <Button size="sm" style={{ fontSize: '0.7rem', padding: '2px 8px', minWidth: '70px' }} onClick={async () => {
                        await onUpdateProductStatus(comanda.id, item.id, 'preparing')
                      }} className="bg-yellow-500 hover:bg-yellow-600 whitespace-nowrap">
                        <Loader2 className="h-3 w-3 mr-1" />
                        Empezar
                      </Button>
                    )}
                    {item.status === "preparing" && (
                      <Button size="sm" style={{ fontSize: '0.7rem', padding: '2px 8px', minWidth: '70px' }} onClick={async () => {
                        await onUpdateProductStatus(comanda.id, item.id, 'completed')
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