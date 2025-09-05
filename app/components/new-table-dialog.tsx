"use client"

import type React from "react"

import { useState } from "react"
import { Plus, Square, Circle, Minus } from "lucide-react"
import { Button } from "../../components/ui/button"
import { Input } from "../../components/ui/input"
import { Label } from "../../components/ui/label"
import { RadioGroup, RadioGroupItem } from "../../components/ui/radio-group"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "../../components/ui/dialog"
import { useTables, type Table } from "../context/table-context"

interface NewTableDialogProps {
  children: React.ReactNode
}

export default function NewTableDialog({ children }: NewTableDialogProps) {
  const { tables, addTable } = useTables()
  const [open, setOpen] = useState(false)
  const [seats, setSeats] = useState(4)
  const [shape, setShape] = useState<"rectangle" | "circle">("rectangle")

  const nextTableNumber = Math.max(...tables.map((t) => t.number), 0) + 1

  const handleCreateTable = () => {
    console.log("handleCreateTable called") // Debug
    console.log("Current tables:", tables.length) // Debug

    const newTable: Omit<Table, "id"> = {
      number: nextTableNumber,
      x: 50,
      y: 50,
      width: shape === "rectangle" ? (seats <= 4 ? 120 : 160) : seats <= 4 ? 100 : 120,
      height: shape === "rectangle" ? 80 : seats <= 4 ? 100 : 120,
      seats: seats,
      status: "available",
      shape: shape,
    }

    console.log("Creating table:", newTable) // Debug
    addTable(newTable)
    console.log("Table added, new count should be:", tables.length + 1) // Debug
    setOpen(false)

    // Reset form
    setSeats(4)
    setShape("rectangle")
  }

  const incrementSeats = () => {
    setSeats((prev) => Math.min(20, prev + 1))
  }

  const decrementSeats = () => {
    setSeats((prev) => Math.max(1, prev - 1))
  }

  const handleSeatsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = Number.parseInt(e.target.value) || 1
    setSeats(Math.max(1, Math.min(20, value)))
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(newOpen) => {
        console.log("Dialog open state changed:", newOpen) // Debug
        setOpen(newOpen)
      }}
    >
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Configurar Nueva Mesa</DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Número de Mesa */}
          <div className="text-center p-4 bg-blue-50 rounded-lg">
            <h3 className="text-lg font-semibold text-blue-900">Mesa #{nextTableNumber}</h3>
            <p className="text-sm text-blue-700">Se creará automáticamente</p>
          </div>

          {/* Forma de la mesa */}
          <div className="space-y-3">
            <Label className="text-base font-semibold">¿Qué forma tendrá la mesa?</Label>
            <RadioGroup value={shape} onValueChange={(value) => setShape(value as "rectangle" | "circle")}>
              <div className="flex items-center space-x-3 p-3 border rounded-lg hover:bg-gray-50">
                <RadioGroupItem value="rectangle" id="rectangle" />
                <Label htmlFor="rectangle" className="flex items-center cursor-pointer flex-1">
                  <Square className="mr-3 h-5 w-5 text-blue-600" />
                  <div>
                    <div className="font-medium">Rectangular</div>
                    <div className="text-sm text-gray-500">Ideal para familias y grupos</div>
                  </div>
                </Label>
              </div>
              <div className="flex items-center space-x-3 p-3 border rounded-lg hover:bg-gray-50">
                <RadioGroupItem value="circle" id="circle" />
                <Label htmlFor="circle" className="flex items-center cursor-pointer flex-1">
                  <Circle className="mr-3 h-5 w-5 text-green-600" />
                  <div>
                    <div className="font-medium">Circular/Ovalada</div>
                    <div className="text-sm text-gray-500">Perfecta para conversaciones</div>
                  </div>
                </Label>
              </div>
            </RadioGroup>
          </div>

          {/* Número de asientos */}
          <div className="space-y-3">
            <Label className="text-base font-semibold">¿Cuántos asientos necesitas?</Label>
            <div className="flex items-center justify-center space-x-4">
              <Button variant="outline" size="icon" onClick={decrementSeats} disabled={seats <= 1}>
                <Minus className="h-4 w-4" />
              </Button>

              <div className="text-center">
                <Input
                  type="number"
                  min="1"
                  max="20"
                  value={seats}
                  onChange={handleSeatsChange}
                  className="w-20 text-center text-lg font-semibold"
                />
                <p className="text-xs text-gray-500 mt-1">asientos</p>
              </div>

              <Button variant="outline" size="icon" onClick={incrementSeats} disabled={seats >= 20}>
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            <p className="text-center text-sm text-gray-500">Entre 1 y 20 asientos</p>
          </div>

          {/* Vista previa */}
          <div className="space-y-3">
            <Label className="text-base font-semibold">Vista Previa</Label>
            <div className="flex items-center justify-center p-6 bg-gray-50 rounded-lg">
              <div
                className={`border-2 border-dashed border-green-400 bg-green-100 flex items-center justify-center text-sm font-medium transition-all ${
                  shape === "rectangle" ? "rounded-lg" : "rounded-full"
                }`}
                style={{
                  width: shape === "rectangle" ? (seats <= 4 ? "100px" : "130px") : seats <= 4 ? "80px" : "100px",
                  height: shape === "rectangle" ? "60px" : seats <= 4 ? "80px" : "100px",
                }}
              >
                <div className="text-center text-green-800">
                  <div className="font-bold">Mesa {nextTableNumber}</div>
                  <div className="text-xs">{seats} asientos</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-end space-x-3 pt-4 border-t">
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancelar
          </Button>
          <Button
            onClick={() => {
              console.log("Create button clicked") // Debug
              handleCreateTable()
            }}
            className="bg-blue-600 hover:bg-blue-700"
          >
            <Plus className="mr-2 h-4 w-4" />
            Crear Mesa
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
