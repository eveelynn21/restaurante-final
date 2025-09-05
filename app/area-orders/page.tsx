"use client"

import { useEffect, useState } from "react"
import { Button } from "../../components/ui/button"
import { Input } from "../../components/ui/input"

interface Area {
  id: number
  name: string
}

export default function AreaOrdersPage() {
  const [areas, setAreas] = useState<Area[]>([])
  const [newArea, setNewArea] = useState("")
  const [editingId, setEditingId] = useState<number | null>(null)
  const [editingName, setEditingName] = useState("")

  // Cargar áreas
  const fetchAreas = async () => {
    try {
      console.log('🔍 Cargando áreas...')
      const res = await fetch("/api/order-areas")
      const data = await res.json()
      console.log('📦 Respuesta de la API:', data)
      setAreas(data.data || [])
      console.log('✅ Áreas cargadas:', data.data || [])
    } catch (error) {
      console.error('❌ Error cargando áreas:', error)
    }
  }

  useEffect(() => {
    fetchAreas()
  }, [])

  // Agregar área
  const handleAdd = async () => {
    if (!newArea.trim()) return
    // Obtener business_location_id de localStorage
    let business_location_id = null
    if (typeof window !== "undefined") {
      const loc = localStorage.getItem('selectedLocation')
      if (loc) {
        try {
          business_location_id = JSON.parse(loc).id
        } catch {}
      }
    }
    if (!business_location_id) {
      alert('No se ha seleccionado una ubicación de negocio')
      return
    }
    await fetch("/api/order-areas", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: newArea, business_location_id })
    })
    setNewArea("")
    fetchAreas()
  }

  // Eliminar área
  const handleDelete = async (id: number) => {
    await fetch(`/api/order-areas?id=${id}`, { method: "DELETE" })
    fetchAreas()
  }

  // Editar área
  const handleEdit = (area: Area) => {
    setEditingId(area.id)
    setEditingName(area.name)
  }
  const handleUpdate = async () => {
    if (!editingName.trim() || editingId === null) return
    await fetch(`/api/order-areas?id=${editingId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: editingName })
    })
    setEditingId(null)
    setEditingName("")
    fetchAreas()
  }
  const handleCancel = () => {
    setEditingId(null)
    setEditingName("")
  }

  return (
    <div className="max-w-xl mx-auto py-8">
      <h1 className="text-2xl font-bold mb-6">Gestión de Áreas</h1>
      <div className="flex gap-2 mb-6">
        <Input
          placeholder="Nueva área"
          value={newArea}
          onChange={e => setNewArea(e.target.value)}
        />
        <Button onClick={handleAdd}>Agregar</Button>
      </div>
      
      {/* Debug info */}
      <div className="mb-4 p-2 bg-gray-100 rounded text-sm">
        <p>Estado actual: {areas.length} áreas cargadas</p>
        <p>Áreas: {JSON.stringify(areas)}</p>
      </div>
      
      <ul className="space-y-2">
        {areas.length === 0 ? (
          <li className="text-gray-500 text-center py-4">No hay áreas configuradas</li>
        ) : (
          areas.map(area => (
            <li key={area.id} className="flex items-center gap-2 border p-2 rounded">
              {editingId === area.id ? (
                <>
                  <Input
                    value={editingName}
                    onChange={e => setEditingName(e.target.value)}
                    className="flex-1"
                  />
                  <Button size="sm" onClick={handleUpdate}>Guardar</Button>
                  <Button size="sm" variant="outline" onClick={handleCancel}>Cancelar</Button>
                </>
              ) : (
                <>
                  <span className="flex-1">{area.name}</span>
                  <Button size="sm" variant="outline" onClick={() => handleEdit(area)}>Editar</Button>
                  <Button size="sm" variant="destructive" onClick={() => handleDelete(area.id)}>Eliminar</Button>
                </>
              )}
            </li>
          ))
        )}
      </ul>
    </div>
  )
} 