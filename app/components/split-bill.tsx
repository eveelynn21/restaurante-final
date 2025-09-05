"use client"

import { useState } from "react"
import { Users, User, DollarSign, X } from "lucide-react"
import { Button } from "../../components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card"
import { Input } from "../../components/ui/input"
import { Badge } from "../../components/ui/badge"
import { Separator } from "../../components/ui/separator"
import { Checkbox } from "../../components/ui/checkbox"
import { useTables, type Table } from "../context/table-context"
import { useRouter } from "next/navigation"
import { formatPrice } from "../../lib/format-price"

interface SplitBillProps {
  table: Table
}

interface ProductSelection {
  itemKey: string // Cambio de productId a itemKey para usar _orderItemId
  selected: boolean
  assignedTo: string[]
}

export default function SplitBill({ table }: SplitBillProps) {
  const {
    enableSplitMode,
    addPersonToBill,
    removePersonFromBill,
    assignItemToPerson,
    shareItemBetweenPeople,
    finalizeSplitBills,
    getTableById,
  } = useTables()
  const [newPersonName, setNewPersonName] = useState("")
  const [productSelections, setProductSelections] = useState<Record<string, ProductSelection>>({})
  const router = useRouter()

  // Obtener la mesa actualizada del contexto
  const currentTable = getTableById(table.id) || table

  if (!currentTable.currentOrder || currentTable.currentOrder.items.length === 0) {
    return (
      <div className="text-center p-4 text-muted-foreground">
        <p>No hay productos en esta mesa para dividir la cuenta.</p>
      </div>
    )
  }

  const handleEnableSplitMode = () => {
    enableSplitMode(table.id)
    // Inicializar selecciones de productos
    const initialSelections: Record<string, ProductSelection> = {}
    currentTable.currentOrder?.items.forEach((item) => {
      if (item._orderItemId) {
        initialSelections[item._orderItemId] = {
          itemKey: item._orderItemId,
          selected: false,
          assignedTo: [],
        }
      }
    })
    setProductSelections(initialSelections)
  }

  const handleAddPerson = () => {
    if (newPersonName.trim()) {
      addPersonToBill(table.id, newPersonName.trim())
      setNewPersonName("")
    }
  }

  const handleProductSelection = (itemKey: string, selected: boolean) => {
    setProductSelections((prev) => ({
      ...prev,
      [itemKey]: {
        ...prev[itemKey],
        selected,
        assignedTo: selected ? prev[itemKey]?.assignedTo || [] : [],
      },
    }))
  }

  const handlePersonAssignment = (itemKey: string, personId: string, assigned: boolean) => {
    setProductSelections((prev) => {
      const current = prev[itemKey] || { itemKey, selected: true, assignedTo: [] }
      const assignedTo = assigned
        ? [...current.assignedTo, personId]
        : current.assignedTo.filter((id) => id !== personId)

      return {
        ...prev,
        [itemKey]: {
          ...current,
          assignedTo,
        },
      }
    })
  }

  const handleConfirmAssignments = () => {
    console.log('=== INICIANDO ASIGNACIÓN DE PRODUCTOS ===')
    console.log('Product selections:', productSelections)
    console.log('Bills disponibles:', currentTable.currentOrder?.bills)
    
    if (!currentTable.currentOrder?.bills || currentTable.currentOrder.bills.length === 0) {
      console.error('No hay bills disponibles')
      return
    }
    
    // Crear bills con items asignados directamente
    const billsWithItems = currentTable.currentOrder.bills.map(bill => {
      const billItems: any[] = []
      let billSubtotal = 0
      
      console.log(`Procesando bill para ${bill.personName} (ID: ${bill.id})`)
      
      // Buscar productos asignados a esta persona
      Object.entries(productSelections).forEach(([itemKey, selection]) => {
        console.log(`Revisando selección para itemKey ${itemKey}:`, selection)
        if (selection.selected && selection.assignedTo && selection.assignedTo.length > 0) {
          console.log(`Producto seleccionado para ${bill.personName}, assignedTo:`, selection.assignedTo)
          if (selection.assignedTo.includes(bill.id)) {
            console.log(`Producto asignado a ${bill.personName}`)
            const product = currentTable.currentOrder?.items.find((item) => item._orderItemId === itemKey)
            if (product) {
              console.log(`Asignando ${product.name} a ${bill.personName}`)
              if (selection.assignedTo.length === 1) {
                // Producto asignado solo a esta persona
                billItems.push({
                  productId: product.id,
                  product: product,
                  quantity: product.quantity,
                  assignedTo: [bill.id],
                  isShared: false,
                })
                billSubtotal += product.sell_price_inc_tax * product.quantity
              } else {
                // Producto compartido entre varias personas
                const quantityPerPerson = product.quantity / selection.assignedTo.length
                const pricePerPerson = product.sell_price_inc_tax / selection.assignedTo.length
                billItems.push({
                  productId: product.id,
                  product: { ...product, sell_price_inc_tax: pricePerPerson },
                  quantity: quantityPerPerson,
                  assignedTo: selection.assignedTo,
                  isShared: true,
                })
                billSubtotal += pricePerPerson * quantityPerPerson
              }
            }
          }
        }
      })
      
      // No calcular impuestos adicionales ya que están incluidos en el precio
      const total = billSubtotal
      
      console.log(`Bill para ${bill.personName}: subtotal=${billSubtotal}, total=${total}, items=${billItems.length}`)
      
      return {
        ...bill,
        items: billItems,
        subtotal: billSubtotal,
        tax: 0, // No hay impuestos adicionales
        total: total,
      }
    })
    
    console.log('=== BILLS FINALIZADOS ===')
    console.log('Bills con items asignados:', billsWithItems)
    
    // Guardar directamente en localStorage
    const checkoutData = {
      tableId: table.id,
      tableNumber: table.number,
      bills: billsWithItems,
    }
    
    console.log('Datos a guardar:', checkoutData)
    localStorage.setItem("split-bills-checkout", JSON.stringify(checkoutData))
    console.log('Datos guardados en localStorage, redirigiendo...')
    
    // Verificar que se guardó correctamente
    const savedData = localStorage.getItem("split-bills-checkout")
    console.log('Datos verificados en localStorage:', savedData)
    
    router.push("/split-checkout")
  }

  const handleCheckoutSplit = () => {
    console.log('Iniciando checkout split...')
    const bills = finalizeSplitBills(table.id)
    console.log('Bills finalizados:', bills)
    
    if (bills.length === 0) {
      console.error('No hay bills para procesar')
      return
    }
    
    const checkoutData = {
      tableId: table.id,
      tableNumber: table.number,
      bills,
    }
    console.log('Datos de checkout:', checkoutData)
    
    localStorage.setItem("split-bills-checkout", JSON.stringify(checkoutData))
    console.log('Datos guardados en localStorage, redirigiendo...')
    router.push("/split-checkout")
  }

  const bills = currentTable.currentOrder?.bills || []
  const isInSplitMode = currentTable.currentOrder?.splitMode || false

  const selectedProducts = Object.values(productSelections).filter((s) => s.selected)
  const canProceed =
    bills.length > 0 && selectedProducts.length > 0 && selectedProducts.every((s) => s.assignedTo.length > 0)

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium">División de Cuenta</h3>
        <Badge variant="outline">Mesa {currentTable.number}</Badge>
      </div>

      {!isInSplitMode ? (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center space-y-4">
              <Users className="h-12 w-12 mx-auto text-muted-foreground" />
              <div>
                <h4 className="font-medium">¿Dividir la cuenta?</h4>
                <p className="text-sm text-muted-foreground">Selecciona qué productos va a pagar cada persona</p>
              </div>
              <Button onClick={handleEnableSplitMode} className="w-full">
                <Users className="h-4 w-4 mr-2" />
                Activar División de Cuenta
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Paso 1: Configurar Personas */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">1. Personas en la Mesa</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex gap-2">
                <Input
                  placeholder="Nombre de la persona"
                  value={newPersonName}
                  onChange={(e) => setNewPersonName(e.target.value)}
                  onKeyPress={(e) => e.key === "Enter" && handleAddPerson()}
                  className="text-sm"
                />
                <Button onClick={handleAddPerson} disabled={!newPersonName.trim()} size="sm">
                  Agregar
                </Button>
              </div>

              <div className="flex flex-wrap gap-1">
                {bills.map((bill) => (
                  <Badge key={bill.id} variant="secondary" className="flex items-center gap-1 text-xs">
                    <User className="h-3 w-3" />
                    {bill.personName}
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-3 w-3 p-0 hover:bg-red-100"
                      onClick={() => removePersonFromBill(table.id, bill.id)}
                    >
                      <X className="h-2 w-2" />
                    </Button>
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Paso 2: Seleccionar y Asignar Productos */}
          {bills.length > 0 && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">2. ¿Qué se va a facturar?</CardTitle>
                <p className="text-sm text-muted-foreground">Selecciona los productos y asígnalos a las personas</p>
              </CardHeader>
              <CardContent className="space-y-4">
                {currentTable.currentOrder.items.map((item) => {
                  if (!item._orderItemId) return null
                  const selection = productSelections[item._orderItemId] || {
                    itemKey: item._orderItemId,
                    selected: false,
                    assignedTo: [],
                  }

                  return (
                    <div key={item._orderItemId} className="border rounded-lg p-3">
                      <div className="flex items-center gap-2 mb-2">
                        <Checkbox
                          checked={selection.selected}
                          onCheckedChange={(checked) => handleProductSelection(item._orderItemId!, checked as boolean)}
                        />
                        <img
                          src={item.image || "/placeholder.svg"}
                          alt={item.name}
                          className="w-8 h-8 object-cover rounded"
                        />
                        <div className="flex-1">
                          <h4 className="font-medium text-sm">{item.name}</h4>
                          <p className="text-xs text-muted-foreground">
                            {formatPrice(Number(item.sell_price_inc_tax) || 0)} × {item.quantity} = {formatPrice((Number(item.sell_price_inc_tax) || 0) * item.quantity)}
                          </p>
                        </div>
                      </div>

                      {selection.selected && (
                        <div className="ml-5 space-y-1">
                          <p className="text-xs font-medium text-muted-foreground">¿Quién va a pagar este producto?</p>
                          <div className="grid grid-cols-2 gap-1">
                            {bills.map((bill) => (
                              <label key={bill.id} className="flex items-center space-x-1 cursor-pointer">
                                <Checkbox
                                  checked={selection.assignedTo.includes(bill.id)}
                                  onCheckedChange={(checked) =>
                                    handlePersonAssignment(item._orderItemId!, bill.id, checked as boolean)
                                  }
                                />
                                <span className="text-xs">{bill.personName}</span>
                              </label>
                            ))}
                          </div>
                          {selection.assignedTo.length > 1 && (
                            <Badge variant="outline" className="text-xs">
                              Se dividirá entre {selection.assignedTo.length} personas
                            </Badge>
                          )}
                        </div>
                      )}
                    </div>
                  )
                })}
              </CardContent>
            </Card>
          )}

          {/* Resumen y Confirmación */}
          {bills.length > 0 && selectedProducts.length > 0 && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">3. Resumen</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="space-y-2">
                  <p className="text-sm">
                    <strong>Productos seleccionados:</strong> {selectedProducts.length} de{" "}
                    {currentTable.currentOrder.items.length}
                  </p>
                  <p className="text-sm">
                    <strong>Personas:</strong> {bills.length}
                  </p>
                </div>

                <Separator />

                <div className="space-y-2">
                  {selectedProducts.map((selection) => {
                    const product = currentTable.currentOrder?.items.find((item) => item._orderItemId === selection.itemKey)
                    if (!product) return null

                    return (
                      <div key={selection.itemKey} className="flex justify-between text-sm">
                        <span>{product.name}</span>
                        <span>
                          {selection.assignedTo.length === 1
                            ? bills.find((b) => b.id === selection.assignedTo[0])?.personName
                            : `${selection.assignedTo.length} personas`}
                        </span>
                      </div>
                    )
                  })}
                </div>

                <Button onClick={handleConfirmAssignments} className="w-full" size="lg" disabled={!canProceed}>
                  <DollarSign className="h-4 w-4 mr-2" />
                  {canProceed ? "Proceder al Pago Dividido" : "Selecciona productos y asígnalos"}
                </Button>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  )
}
