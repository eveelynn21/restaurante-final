"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Settings, Plus, Edit, Trash2, Check, X } from "lucide-react"

interface Area {
  id: number
  name: string
}

export default function AreaOrdersContent() {
  const [areas, setAreas] = useState<Area[]>([])
  const [newArea, setNewArea] = useState("")
  const [editingId, setEditingId] = useState<number | null>(null)
  const [editingName, setEditingName] = useState("")

  // Cargar áreas
  const fetchAreas = async () => {
    const token = localStorage.getItem('token')
    const res = await fetch("/api/order-areas", {
      headers: { 'Authorization': `Bearer ${token}` }
    })
    const data = await res.json()
    setAreas(data.data || [])
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
    <div className="w-full">
      <div className="bg-white rounded-xl shadow-lg p-8 border border-gray-100">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-800 mb-2">Gestión de Áreas</h1>
            <p className="text-gray-600">Administra las áreas de tu restaurante</p>
          </div>
          <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
            <Settings className="h-6 w-6 text-white" />
          </div>
        </div>
        
        <div className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-xl p-6 mb-8 border border-purple-100">
          <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
            <Plus className="h-5 w-5 mr-2 text-purple-600" />
            Agregar Nueva Área
          </h3>
          <div className="flex gap-3">
            <Input
              placeholder="Nombre de la nueva área..."
              value={newArea}
              onChange={e => setNewArea(e.target.value)}
              className="flex-1 border-purple-200 focus:border-purple-500 focus:ring-purple-500"
            />
            <Button 
              onClick={handleAdd}
              className="bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white px-6 py-2 rounded-lg shadow-md hover:shadow-lg transition-all duration-200"
            >
              <Plus className="h-4 w-4 mr-2" />
              Agregar
            </Button>
          </div>
        </div>
        
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
            <Settings className="h-5 w-5 mr-2 text-purple-600" />
            Áreas Existentes ({areas.length})
          </h3>
          
          {areas.length === 0 ? (
            <div className="text-center py-12 bg-gray-50 rounded-xl border-2 border-dashed border-gray-200">
              <Settings className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500 text-lg">No hay áreas configuradas</p>
              <p className="text-gray-400 text-sm">Agrega tu primera área usando el formulario de arriba</p>
            </div>
          ) : (
            <div className="grid gap-4">
              {areas.map(area => (
                <div key={area.id} className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm hover:shadow-md transition-all duration-200">
                  {editingId === area.id ? (
                    <div className="flex items-center gap-3">
                      <Input
                        value={editingName}
                        onChange={e => setEditingName(e.target.value)}
                        className="flex-1 border-purple-200 focus:border-purple-500 focus:ring-purple-500"
                      />
                      <Button 
                        size="sm" 
                        onClick={handleUpdate}
                        className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg"
                      >
                        <Check className="h-4 w-4 mr-1" />
                        Guardar
                      </Button>
                      <Button 
                        size="sm" 
                        variant="outline" 
                        onClick={handleCancel}
                        className="border-gray-300 text-gray-700 hover:bg-gray-50 px-4 py-2 rounded-lg"
                      >
                        <X className="h-4 w-4 mr-1" />
                        Cancelar
                      </Button>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <div className="w-10 h-10 bg-gradient-to-r from-purple-100 to-blue-100 rounded-lg flex items-center justify-center mr-4">
                          <Settings className="h-5 w-5 text-purple-600" />
                        </div>
                        <div>
                          <h4 className="text-lg font-semibold text-gray-800">{area.name}</h4>
                          <p className="text-sm text-gray-500">Área de servicio</p>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button 
                          size="sm" 
                          variant="outline" 
                          onClick={() => handleEdit(area)}
                          className="border-purple-200 text-purple-700 hover:bg-purple-50 px-4 py-2 rounded-lg"
                        >
                          <Edit className="h-4 w-4 mr-1" />
                          Editar
                        </Button>
                        <Button 
                          size="sm" 
                          variant="destructive" 
                          onClick={() => handleDelete(area.id)}
                          className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg"
                        >
                          <Trash2 className="h-4 w-4 mr-1" />
                          Eliminar
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
} 