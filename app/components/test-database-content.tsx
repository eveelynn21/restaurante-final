"use client"

import { useState, useEffect } from "react"
import { Button } from "../../components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card"
import { Badge } from "../../components/ui/badge"
import { 
  Database, 
  Building2,
  RefreshCw, 
  CheckCircle, 
  XCircle,
  Loader2
} from "lucide-react"

interface DatabaseTestResponse {
  success: boolean
  timestamp: string
  connections: {
    pos: boolean
    contable: boolean
    ventas: boolean
    cosurca: boolean
  }
  business: {
    id: number
    name: string | null
    error: string | null
  }
  message: string
}

export default function TestDatabaseContent() {
  const [data, setData] = useState<DatabaseTestResponse | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [lastTest, setLastTest] = useState<string | null>(null)

  const testDatabase = async () => {
    console.log('🔍 Iniciando prueba de base de datos...')
    setLoading(true)
    setError(null)
    setLastTest(new Date().toLocaleString())
    
    try {
      console.log('📡 Haciendo fetch a /api/test-database...')
      const token = localStorage.getItem('token')
      if (!token) {
        throw new Error('No hay token de autenticación disponible')
      }
      
      const response = await fetch('/api/test-database', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      console.log('📡 Response status:', response.status)
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      
      const result = await response.json()
      console.log('📡 Resultado recibido:', result)
      
      if (result.success) {
        setData(result)
        console.log('✅ Datos establecidos correctamente')
      } else {
        setError(result.message || 'Error desconocido')
        console.log('❌ Error en resultado:', result.message)
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error de conexión'
      setError(errorMessage)
      console.error('💥 Error en testDatabase:', err)
    } finally {
      setLoading(false)
      console.log('🏁 Prueba completada')
    }
  }

  useEffect(() => {
    console.log('🚀 Componente cargado, ejecutando prueba automática...')
    testDatabase()
  }, [])

  const getConnectionStatus = (connected: boolean) => {
    return connected ? (
      <div className="flex items-center gap-2 text-green-600">
        <CheckCircle className="h-4 w-4" />
        <span>Conectado</span>
      </div>
    ) : (
      <div className="flex items-center gap-2 text-red-600">
        <XCircle className="h-4 w-4" />
        <span>Desconectado</span>
      </div>
    )
  }

  return (
    <div className="w-full">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Prueba de Base de Datos</h1>
        <p className="text-gray-600">
          Verifica la conexión a las bases de datos MySQL y valida la consulta a la tabla business
        </p>
      </div>

      {/* Botón de prueba */}
      <div className="mb-6">
        <Button 
          onClick={testDatabase} 
          disabled={loading}
          className="bg-blue-600 hover:bg-blue-700"
        >
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Probando conexión...
            </>
          ) : (
            <>
              <RefreshCw className="mr-2 h-4 w-4" />
              Probar Conexión
            </>
          )}
        </Button>
        {lastTest && (
          <p className="text-sm text-gray-500 mt-2">
            Última prueba: {lastTest}
          </p>
        )}
      </div>

      {/* Error */}
      {error && (
        <Card className="mb-6 border-red-200 bg-red-50">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-red-600">
              <XCircle className="h-5 w-5" />
              <span className="font-medium">Error:</span>
              <span>{error}</span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Estado de carga */}
      {loading && !data && (
        <Card className="mb-6 border-blue-200 bg-blue-50">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-blue-600">
              <Loader2 className="h-5 w-5 animate-spin" />
              <span>Probando conexión a la base de datos...</span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Resultados */}
      {data && (
        <div className="space-y-6">
          {/* Estado de conexiones */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="h-5 w-5" />
                Estado de Conexiones
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="p-4 border rounded-lg">
                  <h3 className="font-medium mb-2">POS Principal</h3>
                  {getConnectionStatus(data?.connections?.pos || false)}
                </div>
                <div className="p-4 border rounded-lg">
                  <h3 className="font-medium mb-2">Contabilidad</h3>
                  {getConnectionStatus(data?.connections?.contable || false)}
                </div>
                <div className="p-4 border rounded-lg">
                  <h3 className="font-medium mb-2">Ventas</h3>
                  {getConnectionStatus(data?.connections?.ventas || false)}
                </div>
                <div className="p-4 border rounded-lg">
                  <h3 className="font-medium mb-2">Cosurca</h3>
                  {getConnectionStatus(data?.connections?.cosurca || false)}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Información de la Empresa */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="h-5 w-5" />
                Información de la Empresa (ID: 165)
              </CardTitle>
            </CardHeader>
            <CardContent>
              {data?.business?.error ? (
                <div className="p-4 border border-red-200 bg-red-50 rounded-lg">
                  <div className="flex items-center gap-2 text-red-600">
                    <XCircle className="h-5 w-5" />
                    <span className="font-medium">Error:</span>
                    <span>{data.business.error}</span>
                  </div>
                </div>
              ) : data?.business?.name ? (
                <div className="p-4 border border-green-200 bg-green-50 rounded-lg">
                  <div className="flex items-center gap-2 text-green-600">
                    <CheckCircle className="h-5 w-5" />
                    <span className="font-medium">Empresa encontrada:</span>
                    <span className="text-lg font-semibold">{data.business.name}</span>
                  </div>
                  <div className="mt-2 text-sm text-gray-600">
                    ID: {data.business.id}
                  </div>
                </div>
              ) : (
                <div className="p-4 border border-yellow-200 bg-yellow-50 rounded-lg">
                  <div className="flex items-center gap-2 text-yellow-600">
                    <XCircle className="h-5 w-5" />
                    <span>No se encontró la empresa con ID {data?.business?.id || 'N/A'}</span>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Información adicional */}
          <Card>
            <CardHeader>
              <CardTitle>Información de la Prueba</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-sm">
                <p><strong>Timestamp:</strong> {new Date(data.timestamp).toLocaleString()}</p>
                <p><strong>Estado:</strong> {data.success ? 'Exitoso' : 'Fallido'}</p>
                <p><strong>Mensaje:</strong> {data.message}</p>
                <p><strong>Consulta ejecutada:</strong> SELECT name FROM business WHERE id = 165</p>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Estado vacío */}
      {!loading && !data && !error && (
        <Card className="mb-6 border-gray-200 bg-gray-50">
          <CardContent className="pt-6">
            <div className="text-center text-gray-600">
              <p>No hay datos disponibles. Haz clic en "Probar Conexión" para comenzar.</p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
} 