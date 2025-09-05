"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "../../components/ui/dialog"
import { Button } from "../../components/ui/button"
import { Input } from "../../components/ui/input"
import { Label } from "../../components/ui/label"
import { User, Search, Loader2 } from "lucide-react"
import { Card, CardContent } from "../../components/ui/card"

interface Client {
  id: number;
  name: string;
}

interface ClientSearchDialogProps {
  onClientSelect: (client: Client) => void;
  selectedClient?: Client | null;
}

export default function ClientSearchDialog({ onClientSelect, selectedClient }: ClientSearchDialogProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [clients, setClients] = useState<Client[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [defaultClient, setDefaultClient] = useState<Client | null>(null)

  // Cargar cliente por defecto
  useEffect(() => {
    const loadDefaultClient = async () => {
      try {
        const token = localStorage.getItem('token')
        if (!token) return
        
        const response = await fetch('/api/clients?default=1', {
          headers: { 'Authorization': `Bearer ${token}` }
        })
        
        if (response.ok) {
          const clients = await response.json()
          if (Array.isArray(clients) && clients.length > 0) {
            setDefaultClient(clients[0])
          }
        }
      } catch (error) {
        console.error('Error loading default client:', error)
      }
    }
    
    loadDefaultClient()
  }, [])

  useEffect(() => {
    if (isOpen) {
      const fetchClients = async () => {
        setLoading(true)
        setError(null)
        try {
          const token = localStorage.getItem('token')
          if (!token) throw new Error("Autenticación requerida")

          const response = await fetch('/api/clients', {
            headers: { 'Authorization': `Bearer ${token}` }
          })

          if (!response.ok) throw new Error("Error al cargar clientes")

          const data = await response.json()
          setClients(data)
        } catch (err) {
          setError(err instanceof Error ? err.message : "Error desconocido")
        } finally {
          setLoading(false)
        }
      }
      fetchClients()
    }
  }, [isOpen])

  const filteredClients = clients.filter(client =>
    client.name.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const handleSelect = (client: Client) => {
    onClientSelect(client)
    setIsOpen(false)
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium bg-purple-50 text-purple-700 border-2 border-purple-300 shadow-sm hover:shadow-md hover:border-purple-600 hover:bg-purple-100 transition-all duration-200">
          <User className="h-4 w-4 text-purple-700" />
          <span className="text-sm font-medium text-purple-700 leading-tight">
            {selectedClient ? selectedClient.name : (defaultClient ? defaultClient.name : "CLIENTE PUNTO DE VENTA")}
          </span>
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Buscar Cliente</DialogTitle>
        </DialogHeader>
        <div className="mt-4">
          <Input
            placeholder="Escribe para buscar..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="mt-4 h-64 overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center h-full">
              <Loader2 className="animate-spin" />
            </div>
          ) : error ? (
            <div className="text-red-500">{error}</div>
          ) : (
            <ul>
              {filteredClients.map(client => (
                <li key={client.id} className="p-2 hover:bg-gray-100 cursor-pointer" onClick={() => handleSelect(client)}>
                  {client.name}
                </li>
              ))}
            </ul>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
} 