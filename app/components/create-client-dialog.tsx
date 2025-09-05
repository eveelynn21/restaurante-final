"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "../../components/ui/dialog"
import { Button } from "../../components/ui/button"
import { Input } from "../../components/ui/input"
import { Label } from "../../components/ui/label"
import { RadioGroup, RadioGroupItem } from "../../components/ui/radio-group"
import { Plus, Loader2 } from "lucide-react"

interface CreateClientDialogProps {
  onClientCreated?: (client: any) => void;
  trigger?: React.ReactNode;
}

export default function CreateClientDialog({ onClientCreated, trigger }: CreateClientDialogProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
                       // Estado del formulario
     const [formData, setFormData] = useState({
       clientType: "natural", // "natural" o "juridica"
       // Campos para persona natural
       firstName: "",
       middleName: "",
       lastName: "",
       secondLastName: "",
       // Campos para persona jurídica
       businessName: "",
       // Campos comunes
       documentType: "CC", // Tipo de documento (CC o NIT)
       contactId: "", // NIT
       dv: "", // Dígito verificado
       typeRegimeId: "2", // 1 = responsable IVA, 2 = no responsable (por defecto No responsable para persona natural)
       mobile: "",
       email: "",
       address: ""
     })

  const handleInputChange = (field: string, value: string) => {
    // Validar que el valor sea un string
    if (typeof value !== 'string') {
      console.error('Error: handleInputChange recibió un valor que no es string:', field, value, typeof value)
      return
    }
    
    console.log('handleInputChange:', field, value, typeof value)
    
    // Si se cambia el tipo de cliente, actualizar automáticamente otros campos
    if (field === "clientType") {
      setFormData(prev => ({
        ...prev,
        [field]: value,
        // Si es persona natural: CC y No responsable de IVA
        // Si es persona jurídica: NIT y Responsable de IVA
        documentType: value === "natural" ? "CC" : "NIT",
        typeRegimeId: value === "natural" ? "2" : "1"
      }))
    } else {
      setFormData(prev => ({
        ...prev,
        [field]: value
      }))
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const token = localStorage.getItem('token')
      if (!token) throw new Error("Token no encontrado")

             // Preparar datos según el tipo de cliente
       const clientData: any = {
         // business_id se obtiene del token en el servidor
         type: "customer",
         type_organization_id: formData.clientType === "juridica" ? 1 : 2,
         type_document_identification_id: formData.clientType === "juridica" ? 6 : 3,
         type_regime_id: parseInt(formData.typeRegimeId),
         contact_id: formData.contactId,
         mobile: formData.mobile || null,
         email: formData.email || null,
         address_line_1: formData.address || null,
         contact_status: "active",
         is_default: 0
       }

             // Agregar campos específicos según el tipo
       if (formData.clientType === "natural") {
         clientData.first_name = formData.firstName
         clientData.middle_name = formData.middleName
         clientData.last_name = formData.lastName
         clientData.second_last_name = formData.secondLastName
         clientData.name = [
           formData.firstName || '',
           formData.middleName || '',
           formData.lastName || '',
           formData.secondLastName || ''
         ].filter(Boolean).join(' ').trim()
       } else {
         clientData.supplier_business_name = formData.businessName
         clientData.name = formData.businessName
       }

      const response = await fetch('/api/clients', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(clientData)
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Error al crear cliente')
      }

      const newClient = await response.json()
      
      // Cerrar modal y limpiar formulario
      setIsOpen(false)
      setFormData({
        clientType: "natural",
        firstName: "",
        middleName: "",
        lastName: "",
        secondLastName: "",
        businessName: "",
        documentType: "CC",
        contactId: "",
        dv: "",
        typeRegimeId: "1",
        mobile: "",
        email: "",
        address: ""
      })

      // Notificar al componente padre
      onClientCreated?.(newClient)
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido')
    } finally {
      setLoading(false)
    }
  }

                       const resetForm = () => {
       setFormData({
         clientType: "natural",
         firstName: "",
         middleName: "",
         lastName: "",
         secondLastName: "",
         businessName: "",
         documentType: "CC",
         contactId: "",
         dv: "",
         typeRegimeId: "2",
         mobile: "",
         email: "",
         address: ""
       })
       setError(null)
     }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => {
      setIsOpen(open)
      if (!open) resetForm()
    }}>
      <DialogTrigger asChild>
        {trigger || (
          <Button
            variant="outline"
            className="flex items-center justify-center px-2 py-1 rounded-lg text-sm font-medium bg-purple-50 text-purple-700 border-2 border-purple-300 shadow-sm hover:shadow-md hover:border-purple-600 hover:bg-purple-100 transition-all duration-200 h-[32px] w-[32px]"
          >
            <Plus className="h-4 w-4" />
          </Button>
        )}
      </DialogTrigger>
             <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Crear Nuevo Cliente</DialogTitle>
        </DialogHeader>
        
                                   <form onSubmit={handleSubmit} className="space-y-4">
           {/* Tipo de cliente */}
           <div className="space-y-2">
             <Label>Tipo de cliente</Label>
             <RadioGroup
               value={formData.clientType}
               onValueChange={(value) => handleInputChange("clientType", value)}
               className="flex space-x-4"
             >
               <div className="flex items-center space-x-2">
                 <RadioGroupItem value="natural" id="natural" />
                 <Label htmlFor="natural">Persona Natural</Label>
               </div>
               <div className="flex items-center space-x-2">
                 <RadioGroupItem value="juridica" id="juridica" />
                 <Label htmlFor="juridica">Persona Jurídica</Label>
               </div>
             </RadioGroup>
           </div>

                       {/* Tipo de documento + NIT + DV de primero */}
            <div className="flex gap-2">
              <div className="w-20">
                <Label htmlFor="documentType">Tipo</Label>
                <select
                  id="documentType"
                  value={formData.documentType}
                  onChange={(e) => handleInputChange("documentType", e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm"
                >
                  <option value="CC">CC</option>
                  <option value="NIT">NIT</option>
                </select>
              </div>
              <div className="flex-1">
                <Label htmlFor="contactId">NIT *</Label>
                <Input
                  id="contactId"
                  value={formData.contactId}
                  onChange={(e) => handleInputChange("contactId", e.target.value)}
                  placeholder={formData.clientType === "natural" ? "Cédula de ciudadanía" : "NIT"}
                  required
                  className="py-1 text-sm"
                />
              </div>
              <div className="w-16">
                <Label htmlFor="dv">DV</Label>
                <Input
                  id="dv"
                  value={formData.dv || ""}
                  onChange={(e) => handleInputChange("dv", e.target.value)}
                  placeholder="DV"
                  className="py-1 text-sm"
                  maxLength={1}
                />
              </div>
            </div>

                      {/* Campos según tipo de cliente */}
            {formData.clientType === "natural" ? (
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="firstName">Primer nombre *</Label>
                  <Input
                     id="firstName"
                     value={formData.firstName}
                     onChange={(e) => {
                       console.log('onChange firstName:', e.target.value, typeof e.target.value)
                       handleInputChange("firstName", e.target.value)
                     }}
                     onFocus={() => {
                       console.log('onFocus firstName:', formData.firstName, typeof formData.firstName)
                     }}
                     required
                     className="py-1 text-sm"
                   />
                </div>
                <div>
                  <Label htmlFor="middleName">Segundo nombre</Label>
                  <Input
                    id="middleName"
                    value={formData.middleName}
                    onChange={(e) => handleInputChange("middleName", e.target.value)}
                    className="py-1 text-sm"
                  />
                </div>
                <div>
                  <Label htmlFor="lastName">Primer apellido *</Label>
                  <Input
                    id="lastName"
                    value={formData.lastName}
                    onChange={(e) => handleInputChange("lastName", e.target.value)}
                    required
                    className="py-1 text-sm"
                  />
                </div>
                <div>
                  <Label htmlFor="secondLastName">Segundo apellido</Label>
                  <Input
                    id="secondLastName"
                    value={formData.secondLastName}
                    onChange={(e) => handleInputChange("secondLastName", e.target.value)}
                    className="py-1 text-sm"
                  />
                </div>
              </div>
           ) : (
             <div>
               <Label htmlFor="businessName">Nombre de la empresa *</Label>
               <Input
                 id="businessName"
                 value={formData.businessName}
                 onChange={(e) => handleInputChange("businessName", e.target.value)}
                 required
               />
             </div>
           )}

                      {/* Email después de nombres y apellidos */}
            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                value={formData.email}
                onChange={(e) => handleInputChange("email", e.target.value)}
                type="email"
                className="py-1 text-sm"
              />
            </div>

                        {/* Campos comunes */}
             <div className="grid grid-cols-2 gap-3">

             <div>
               <Label htmlFor="typeRegimeId">Régimen</Label>
               <select
                 id="typeRegimeId"
                 value={formData.typeRegimeId}
                 onChange={(e) => handleInputChange("typeRegimeId", e.target.value)}
                 className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm"
               >
                 <option value="1">Responsable de IVA</option>
                 <option value="2">No responsable de IVA</option>
               </select>
             </div>

             <div>
               <Label htmlFor="mobile">Teléfono</Label>
               <Input
                 id="mobile"
                 value={formData.mobile}
                 onChange={(e) => handleInputChange("mobile", e.target.value)}
                 type="tel"
                 className="py-1 text-sm"
               />
             </div>

             <div className="col-span-2">
               <Label htmlFor="address">Dirección</Label>
               <Input
                 id="address"
                 value={formData.address}
                 onChange={(e) => handleInputChange("address", e.target.value)}
                 className="py-1 text-sm"
               />
             </div>
           </div>

          {/* Error message */}
          {error && (
            <div className="text-red-500 text-sm">{error}</div>
          )}

          {/* Botones */}
          <div className="flex justify-end space-x-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsOpen(false)}
              disabled={loading}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="bg-purple-600 hover:bg-purple-700"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creando...
                </>
              ) : (
                'Crear Cliente'
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
} 