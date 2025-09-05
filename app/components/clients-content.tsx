"use client"

import { useState, useEffect } from "react"
import { Button } from "../../components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card"
import { Users, Loader2 } from "lucide-react"

interface Client {
  id: number;
  name: string;
  supplier_business_name: string | null;
  contact_id: string | null;
}

export default function ClientsContent() {
  const [clients, setClients] = useState<Client[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchClients = async () => {
      try {
        const token = localStorage.getItem('token')
        if (!token) {
          setError('No hay token de autenticación')
          setLoading(false)
          return
        }

        const response = await fetch('/api/clients', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        })

        if (!response.ok) {
          const errorData = await response.json()
          throw new Error(errorData.error || 'Error al obtener los clientes')
        }

        const data = await response.json()
        setClients(data)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Un error desconocido ocurrió')
      } finally {
        setLoading(false)
      }
    }

    fetchClients()
  }, [])

  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold flex items-center">
          <Users className="mr-3 h-8 w-8" />
          Gestión de Clientes
        </h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Lista de Clientes</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center items-center py-10">
              <Loader2 className="h-8 w-8 animate-spin text-gray-500" />
              <p className="ml-3 text-gray-600">Cargando clientes...</p>
            </div>
          ) : error ? (
            <div className="text-center py-10 text-red-600">
              <p>Error: {error}</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b">
                    <th className="p-4">Nombre</th>
                    <th className="p-4">Nombre del Negocio</th>
                    <th className="p-4">ID de Contacto</th>
                  </tr>
                </thead>
                <tbody>
                  {clients.map((client) => (
                    <tr key={client.id} className="border-b hover:bg-gray-50">
                      <td className="p-4">{client.name}</td>
                      <td className="p-4">{client.supplier_business_name || 'N/A'}</td>
                      <td className="p-4">{client.contact_id || 'N/A'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {clients.length === 0 && (
                <p className="text-center text-gray-500 py-10">
                  No se encontraron clientes.
                </p>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
} 