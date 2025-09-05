"use client"

import { useState, useEffect } from "react"
import { MapPin, Loader2 } from "lucide-react"
import { Button } from "../../components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../../components/ui/dialog"
import { RadioGroup, RadioGroupItem } from "../../components/ui/radio-group"
import { Label } from "../../components/ui/label"

interface Location {
  id: number
  name: string
}

interface LocationSelectorModalProps {
  isOpen: boolean
  onLocationSelected: (location: Location) => void
}

export default function LocationSelectorModal({ isOpen, onLocationSelected }: LocationSelectorModalProps) {
  const [locations, setLocations] = useState<Location[]>([])
  const [selectedLocationId, setSelectedLocationId] = useState<string>("")
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (isOpen) {
      fetchLocations()
    }
  }, [isOpen])

  const fetchLocations = async () => {
    try {
      setLoading(true)
      const token = localStorage.getItem('token')
      
      if (!token) {
        setError('No hay token de autenticación')
        return
      }

      const response = await fetch('/api/business-locations', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (!response.ok) {
        throw new Error('Error al obtener ubicaciones')
      }

      const data = await response.json()
      setLocations(data.locations || [])
    } catch (err) {
      console.error('Error fetching locations:', err)
      setError('Error al cargar ubicaciones')
    } finally {
      setLoading(false)
    }
  }

  const handleConfirmSelection = () => {
    const selectedLocation = locations.find(loc => loc.id.toString() === selectedLocationId)
    if (selectedLocation) {
      onLocationSelected(selectedLocation)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={() => {}}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            Seleccionar Ubicación
          </DialogTitle>
        </DialogHeader>

        <div className="py-6">
          <p className="text-sm text-muted-foreground mb-4">
            Selecciona la ubicación/sucursal donde vas a trabajar:
          </p>

          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin mr-2" />
              <span>Cargando ubicaciones...</span>
            </div>
          ) : error ? (
            <div className="text-red-500 text-center py-8">
              {error}
            </div>
          ) : locations.length > 0 ? (
            <RadioGroup value={selectedLocationId} onValueChange={setSelectedLocationId}>
              {locations.map((location) => (
                <div key={location.id} className="flex items-center space-x-2 p-3 border rounded-lg hover:bg-gray-50">
                  <RadioGroupItem value={location.id.toString()} id={location.id.toString()} />
                  <Label htmlFor={location.id.toString()} className="flex-1 cursor-pointer">
                    {location.name}
                  </Label>
                </div>
              ))}
            </RadioGroup>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              No se encontraron ubicaciones disponibles
            </div>
          )}
        </div>

        <div className="flex justify-end">
          <Button 
            onClick={handleConfirmSelection}
            disabled={!selectedLocationId || loading}
            className="bg-orange-500 hover:bg-orange-600"
          >
            Confirmar Ubicación
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
} 