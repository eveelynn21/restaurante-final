"use client"

import { useState, useEffect, useCallback } from "react"
import { RefreshCw, FileText, Lock } from "lucide-react"
import { Button } from "../../components/ui/button"
import { Card, CardContent } from "../../components/ui/card"
import { Badge } from "../../components/ui/badge"

interface InvoiceNumberDisplayProps {
  locationId: number
  onNumberReserved?: (invoiceNumber: string) => void
}

interface InvoiceScheme {
  scheme_id: number
  prefix: string
  next_number: number
  full_invoice_number: string
  current_count: number
}

export default function InvoiceNumberDisplay({ locationId, onNumberReserved }: InvoiceNumberDisplayProps) {
  const [invoiceScheme, setInvoiceScheme] = useState<InvoiceScheme | null>(null)
  const [loading, setLoading] = useState(true)
  const [reserving, setReserving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date())

  const fetchInvoiceNumber = useCallback(async () => {
    try {
      const token = localStorage.getItem('token')
      if (!token) {
        setError('No hay token de autenticación')
        return
      }

      const response = await fetch(`/api/invoice-number?location_id=${locationId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (!response.ok) {
        throw new Error('Error al obtener número de factura')
      }

      const data = await response.json()
      setInvoiceScheme(data)
      setLastUpdate(new Date())
      setError(null)
    } catch (err) {
      console.error('Error fetching invoice number:', err)
      setError('Error al cargar número de factura')
    } finally {
      setLoading(false)
    }
  }, [locationId])

  const reserveInvoiceNumber = async () => {
    if (!invoiceScheme || reserving) return

    try {
      setReserving(true)
      const token = localStorage.getItem('token')
      
      const response = await fetch('/api/invoice-number', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ location_id: locationId })
      })

      if (!response.ok) {
        throw new Error('Error al reservar número de factura')
      }

      const data = await response.json()
      
      // Llamar callback si se proporciona
      if (onNumberReserved) {
        onNumberReserved(data.full_invoice_number)
      }

      // Actualizar inmediatamente después de reservar
      await fetchInvoiceNumber()
      
    } catch (err) {
      console.error('Error reserving invoice number:', err)
      setError('Error al reservar número de factura')
    } finally {
      setReserving(false)
    }
  }

  // Polling para actualización en tiempo real
  useEffect(() => {
    fetchInvoiceNumber()

    const interval = setInterval(() => {
      fetchInvoiceNumber()
    }, 3000) // Actualizar cada 3 segundos

    return () => clearInterval(interval)
  }, [fetchInvoiceNumber])

  if (loading) {
    return (
      <Card className="w-full max-w-md">
        <CardContent className="p-4">
          <div className="flex items-center justify-center">
            <RefreshCw className="h-4 w-4 animate-spin mr-2" />
            <span className="text-sm">Cargando número de factura...</span>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card className="w-full max-w-md border-red-200">
        <CardContent className="p-4">
          <div className="text-red-600 text-sm text-center">
            {error}
            <Button 
              variant="outline" 
              size="sm" 
              onClick={fetchInvoiceNumber}
              className="ml-2"
            >
              <RefreshCw className="h-3 w-3" />
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (!invoiceScheme) {
    return (
      <Card className="w-full max-w-md">
        <CardContent className="p-4">
          <div className="text-center text-sm text-muted-foreground">
            No se encontró esquema de facturación
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="w-full max-w-md">
      <CardContent className="p-4">
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FileText className="h-4 w-4 text-blue-600" />
              <span className="text-sm font-medium">Siguiente Factura</span>
            </div>
            <Badge variant="outline" className="text-xs">
              Actualizado: {lastUpdate.toLocaleTimeString()}
            </Badge>
          </div>

          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">
              {invoiceScheme.full_invoice_number}
            </div>
            <div className="text-xs text-muted-foreground mt-1">
              Contador actual: {invoiceScheme.current_count}
            </div>
          </div>

          <Button 
            onClick={reserveInvoiceNumber}
            disabled={reserving}
            className="w-full"
            variant="default"
          >
            {reserving ? (
              <>
                <RefreshCw className="h-4 w-4 animate-spin mr-2" />
                Reservando...
              </>
            ) : (
              <>
                <Lock className="h-4 w-4 mr-2" />
                Tomar Número
              </>
            )}
          </Button>

          <div className="flex justify-center">
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={fetchInvoiceNumber}
              className="text-xs"
            >
              <RefreshCw className="h-3 w-3 mr-1" />
              Actualizar
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
} 