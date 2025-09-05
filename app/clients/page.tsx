"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "../../components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card"
import { ArrowLeft, Users, Loader2, Plus } from "lucide-react"
import CreateClientDialog from "../components/create-client-dialog"

interface Client {
  id: number;
  name: string;
  supplier_business_name: string | null;
  contact_id: string | null;
}

export default function ClientsPage() {
  const [clients, setClients] = useState<Client[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  const handleClientCreated = (newClient: any) => {
    // Recargar la lista de clientes después de crear uno nuevo
    setClients(prevClients => [...prevClients, newClient])
  }

  useEffect(() => {
    const fetchClients = async () => {
      try {
        const token = localStorage.getItem('token')
        if (!token) {
          router.push('/login')
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
  }, [router])

  return (
    <div className="container mx-auto p-4 md:p-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold flex items-center">
          <Users className="mr-3 h-6 w-6" />
          Gestión de Clientes
        </h1>
                 <div className="flex items-center gap-3">
           <CreateClientDialog 
             onClientCreated={handleClientCreated}
             trigger={
               <Button className="bg-purple-600 hover:bg-purple-700 text-white">
                 <Plus className="mr-2 h-4 w-4" />
                 Crear Cliente
               </Button>
             }
           />
           <Button variant="outline" onClick={() => router.push('/dashboard')}>
             <ArrowLeft className="mr-2 h-4 w-4" />
             Volver al Dashboard
           </Button>
         </div>
      </div>

      <Card className="shadow-lg border-0 bg-gradient-to-br from-white to-gray-50">
        <CardHeader className="bg-gradient-to-r from-purple-200 to-purple-300 text-purple-800 rounded-t-lg py-4">
          <CardTitle className="flex items-center text-purple-800 text-lg">
            <Users className="mr-2 h-4 w-4" />
            Lista de Clientes
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex justify-center items-center py-16">
              <div className="text-center">
                <Loader2 className="h-10 w-10 animate-spin text-purple-500 mx-auto mb-4" />
                <p className="text-gray-600 font-medium">Cargando clientes...</p>
              </div>
            </div>
          ) : error ? (
            <div className="text-center py-16">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Users className="h-8 w-8 text-red-500" />
              </div>
              <p className="text-red-600 font-medium">Error: {error}</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-gradient-to-r from-purple-50 to-purple-100 border-b-2 border-purple-200">
                    <th className="p-3 text-left font-semibold text-purple-800 uppercase text-xs tracking-wide">
                      <div className="flex items-center">
                        <Users className="mr-1 h-3 w-3" />
                        Nombre
                      </div>
                    </th>
                    <th className="p-3 text-left font-semibold text-purple-800 uppercase text-xs tracking-wide">
                      Nombre del Negocio
                    </th>
                    <th className="p-3 text-left font-semibold text-purple-800 uppercase text-xs tracking-wide">
                      ID de Contacto
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {clients.map((client, index) => (
                    <tr 
                      key={client.id} 
                      className={`border-b border-gray-100 transition-all duration-200 hover:bg-gradient-to-r hover:from-purple-50 hover:to-purple-100 hover:shadow-sm ${
                        index % 2 === 0 ? 'bg-white' : 'bg-gray-50'
                      }`}
                    >
                      <td className="p-3 font-medium text-gray-800">
                        <div className="flex items-center">
                          <div className="w-6 h-6 bg-purple-100 rounded-full flex items-center justify-center mr-2">
                            <span className="text-purple-600 font-semibold text-xs">
                              {client.name.charAt(0).toUpperCase()}
                            </span>
                          </div>
                          {client.name}
                        </div>
                      </td>
                      <td className="p-3 text-gray-600">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          client.supplier_business_name 
                            ? 'bg-green-100 text-green-700' 
                            : 'bg-gray-100 text-gray-500'
                        }`}>
                          {client.supplier_business_name || 'N/A'}
                        </span>
                      </td>
                      <td className="p-3 text-gray-600 font-mono text-xs">
                        <span className="bg-blue-50 text-blue-700 px-2 py-1 rounded-md">
                          {client.contact_id || 'N/A'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {clients.length === 0 && (
                <div className="text-center py-16">
                  <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Users className="h-10 w-10 text-gray-400" />
                  </div>
                  <p className="text-gray-500 font-medium">No se encontraron clientes.</p>
                  <p className="text-gray-400 text-sm mt-1">Crea tu primer cliente para comenzar</p>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
} 