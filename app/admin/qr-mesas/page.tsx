"use client"

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Download, QrCode, RefreshCw, Trash2 } from 'lucide-react'

interface Mesa {
  id: number
  name: string
  qr_code: string | null
  status: string
}

export default function QRMesasPage() {
  const [mesas, setMesas] = useState<Mesa[]>([])
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState(false)

  useEffect(() => {
    fetchMesas()
  }, [])

  const fetchMesas = async () => {
    try {
      // Obtener el token del localStorage
      const token = localStorage.getItem('token')
      
      if (!token) {
        console.error('No hay token de autenticación')
        setLoading(false)
        return
      }

      const response = await fetch('/api/res-tables', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      const data = await response.json()
      
      if (data.success) {
        setMesas(data.tables || [])
      }
    } catch (error) {
      console.error('Error fetching mesas:', error)
    } finally {
      setLoading(false)
    }
  }

  const generateAllQR = async () => {
    setGenerating(true)
    try {
      // Obtener el token del localStorage
      const token = localStorage.getItem('token')
      
      if (!token) {
        alert('No hay token de autenticación')
        setGenerating(false)
        return
      }

      console.log('🔍 Iniciando generación de QR...')
      console.log('Token:', token.substring(0, 20) + '...')

      const response = await fetch('/api/generate-qr-codes', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })
      
      console.log('Response status:', response.status)
      const data = await response.json()
      console.log('Response data:', data)
      
      if (data.success) {
        console.log('✅ QR generados exitosamente')
        await fetchMesas() // Recargar mesas
        alert('QR generados exitosamente')
      } else {
        console.error('❌ Error en la respuesta:', data)
        alert('Error generando QR: ' + data.message)
      }
    } catch (error) {
      console.error('❌ Error generating QR:', error)
      alert('Error generando QR: ' + error.message)
    } finally {
      setGenerating(false)
    }
  }

  const downloadQR = (mesa: Mesa) => {
    if (!mesa.qr_code) return
    
    const link = document.createElement('a')
    link.href = mesa.qr_code
    link.download = `qr-mesa-${mesa.name}.png`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const downloadAllQR = () => {
    mesas.forEach(mesa => {
      if (mesa.qr_code) {
        setTimeout(() => downloadQR(mesa), 100)
      }
    })
  }

  const deleteQR = async (mesa: Mesa) => {
    if (!mesa.qr_code) return
    
    if (!confirm(`¿Estás seguro de que quieres eliminar el QR de ${mesa.name}?`)) {
      return
    }

    try {
      const token = localStorage.getItem('token')
      
      if (!token) {
        alert('No hay token de autenticación')
        return
      }

      const response = await fetch(`/api/generate-qr-codes?table_id=${mesa.id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })
      
      const data = await response.json()
      
      if (data.success) {
        console.log('✅ QR eliminado exitosamente')
        await fetchMesas() // Recargar mesas
        alert('QR eliminado exitosamente')
      } else {
        console.error('❌ Error en la respuesta:', data)
        alert('Error eliminando QR: ' + data.message)
      }
    } catch (error) {
      console.error('❌ Error deleting QR:', error)
      alert('Error eliminando QR: ' + error.message)
    }
  }

  const deleteAllQR = async () => {
    if (!confirm('¿Estás seguro de que quieres eliminar TODOS los QR codes? Esta acción no se puede deshacer.')) {
      return
    }

    try {
      const token = localStorage.getItem('token')
      
      if (!token) {
        alert('No hay token de autenticación')
        return
      }

      const response = await fetch('/api/generate-qr-codes', {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })
      
      const data = await response.json()
      
      if (data.success) {
        console.log('✅ Todos los QR eliminados exitosamente')
        await fetchMesas() // Recargar mesas
        alert('Todos los QR codes han sido eliminados exitosamente')
      } else {
        console.error('❌ Error en la respuesta:', data)
        alert('Error eliminando QR: ' + data.message)
      }
    } catch (error) {
      console.error('❌ Error deleting all QR:', error)
      alert('Error eliminando QR: ' + error.message)
    }
  }

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600"></div>
        </div>
      </div>
    )
  }

  const mesasConQR = mesas.filter(mesa => mesa.qr_code)
  const mesasSinQR = mesas.filter(mesa => !mesa.qr_code)

  return (
    <div className="container mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">Gestión de QR para Mesas</h1>
        <p className="text-gray-600">Genera y gestiona códigos QR únicos para cada mesa</p>
      </div>

      {/* Estadísticas */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Mesas</p>
                <p className="text-2xl font-bold text-gray-800">{mesas.length}</p>
              </div>
              <QrCode className="h-8 w-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Con QR</p>
                <p className="text-2xl font-bold text-green-600">{mesasConQR.length}</p>
              </div>
              <Badge variant="default" className="bg-green-100 text-green-800">
                {Math.round((mesasConQR.length / mesas.length) * 100)}%
              </Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Sin QR</p>
                <p className="text-2xl font-bold text-red-600">{mesasSinQR.length}</p>
              </div>
              <Badge variant="destructive">
                Pendiente
              </Badge>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Acciones */}
      <div className="flex flex-wrap gap-4 mb-8">
        <Button 
          onClick={generateAllQR} 
          disabled={generating || mesasSinQR.length === 0}
          className="bg-orange-600 hover:bg-orange-700"
        >
          {generating ? (
            <>
              <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
              Generando...
            </>
          ) : (
            <>
              <QrCode className="h-4 w-4 mr-2" />
              Generar QR para {mesasSinQR.length} Mesa{mesasSinQR.length !== 1 ? 's' : ''}
            </>
          )}
        </Button>

        {mesasConQR.length > 0 && (
          <>
            <Button 
              onClick={downloadAllQR}
              variant="outline"
              className="border-orange-600 text-orange-600 hover:bg-orange-50"
            >
              <Download className="h-4 w-4 mr-2" />
              Descargar Todos los QR
            </Button>

            <Button 
              onClick={deleteAllQR}
              variant="outline"
              className="border-red-600 text-red-600 hover:bg-red-50"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Eliminar Todos
            </Button>
          </>
        )}

        <Button 
          onClick={fetchMesas}
          variant="ghost"
        >
          <RefreshCw className="h-4 w-4 mr-2" />
          Actualizar
        </Button>
      </div>

      {/* Lista de Mesas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {mesas.map((mesa) => (
          <Card key={mesa.id} className="hover:shadow-lg transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">Mesa {mesa.name}</CardTitle>
                <Badge 
                  variant={mesa.qr_code ? "default" : "destructive"}
                  className={mesa.qr_code ? "bg-green-100 text-green-800" : ""}
                >
                  {mesa.qr_code ? 'QR Listo' : 'Sin QR'}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              {mesa.qr_code ? (
                <div className="space-y-4">
                  <div className="flex justify-center">
                    <img 
                      src={mesa.qr_code} 
                      alt={`QR Mesa ${mesa.name}`}
                      className="w-32 h-32 border rounded-lg"
                    />
                  </div>
                  <div className="text-center space-y-2">
                    <p className="text-sm text-gray-600">
                      Escanea para ver el estado del pedido
                    </p>
                    <div className="flex gap-2">
                      <Button 
                        onClick={() => downloadQR(mesa)}
                        size="sm"
                        variant="outline"
                        className="flex-1"
                      >
                        <Download className="h-4 w-4 mr-2" />
                        Descargar
                      </Button>
                      <Button 
                        onClick={() => deleteQR(mesa)}
                        size="sm"
                        variant="outline"
                        className="flex-1 border-red-600 text-red-600 hover:bg-red-50"
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Eliminar
                      </Button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  <QrCode className="h-12 w-12 text-gray-300 mx-auto mb-2" />
                  <p className="text-sm text-gray-500">QR no generado</p>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {mesas.length === 0 && (
        <div className="text-center py-12">
          <QrCode className="h-16 w-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-600 mb-2">No hay mesas</h3>
          <p className="text-gray-500">Crea algunas mesas primero para generar QR</p>
        </div>
      )}
    </div>
  )
}
