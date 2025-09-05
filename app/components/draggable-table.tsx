"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { cn } from "../../lib/utils"
import { useTables, type Table } from "../context/table-context"
import { ShoppingBag, Printer } from "lucide-react"
import type { Product } from "../context/cart-context"
import { formatPrice } from "../../lib/format-price"

interface DraggableTableProps {
  table: Table
  onTableClick?: (table: Table) => void
  isDragMode: boolean
  showTicketIndicator?: boolean
}

export default function DraggableTable({
  table,
  onTableClick,
  isDragMode,
  showTicketIndicator = false,
}: DraggableTableProps) {
  const { updateTablePosition, addProductToTable } = useTables()
  const [isDragging, setIsDragging] = useState(false)
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 })
  const [isDragOver, setIsDragOver] = useState(false)
  const tableRef = useRef<HTMLDivElement>(null)

  const getStatusColor = (status: Table["status"]) => {
    switch (status) {
      case "available":
        return "bg-green-100 border-green-300 text-green-800"
      case "occupied":
        return "bg-red-100 border-red-300 text-red-800"
      case "reserved":
        return "bg-yellow-100 border-yellow-300 text-yellow-800"
      case "needs-cleaning":
        return "bg-gray-100 border-gray-300 text-gray-800"
      default:
        return "bg-gray-100 border-gray-300 text-gray-800"
    }
  }

  const handleMouseDown = (e: React.MouseEvent) => {
    if (!isDragMode) {
      onTableClick?.(table)
      return
    }

    e.preventDefault()
    setIsDragging(true)

    const rect = tableRef.current?.getBoundingClientRect()
    if (rect) {
      setDragOffset({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      })
    }
  }

  const handleGlobalMouseMove = (e: MouseEvent) => {
    if (!isDragging || !isDragMode) return

    e.preventDefault()
    const container = tableRef.current?.parentElement
    if (container) {
      const containerRect = container.getBoundingClientRect()
      const newX = Math.max(
        0,
        Math.min(e.clientX - containerRect.left - dragOffset.x, containerRect.width - table.width),
      )
      const newY = Math.max(
        0,
        Math.min(e.clientY - containerRect.top - dragOffset.y, containerRect.height - table.height),
      )

      updateTablePosition(table.id, newX, newY)
    }
  }

  const handleGlobalMouseUp = () => {
    setIsDragging(false)
  }

  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleGlobalMouseMove)
      document.addEventListener('mouseup', handleGlobalMouseUp)
      
      return () => {
        document.removeEventListener('mousemove', handleGlobalMouseMove)
        document.removeEventListener('mouseup', handleGlobalMouseUp)
      }
    }
  }, [isDragging, dragOffset, isDragMode])

  // Handle product drop
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)

    try {
      const productData = e.dataTransfer.getData("application/json")
      const product: Product = JSON.parse(productData)
      addProductToTable(table.id, product)
    } catch (error) {
      console.error("Error dropping product:", error)
    }
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
  }

  const orderItems = table.currentOrder?.items || []
  const itemCount = orderItems.reduce((sum, item) => sum + (Number(item.quantity) || 0), 0)

  return (
    <div
      ref={tableRef}
      className={cn(
        "absolute border-2 flex flex-col items-center justify-center font-semibold text-xs transition-all duration-200 select-none overflow-hidden",
        getStatusColor(table.status),
        isDragMode ? "cursor-move" : "cursor-pointer",
        isDragging ? "shadow-lg scale-105 z-10" : "hover:shadow-md",
        isDragOver ? "ring-2 ring-blue-400 ring-offset-2" : "",
        table.shape === "circle" ? "rounded-full" : "rounded-lg",
      )}
      style={{
        left: table.x,
        top: table.y,
        width: table.width,
        height: table.height,
      }}
      onMouseDown={handleMouseDown}
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
    >
      {/* Table Header */}
      <div className="text-center mb-1">
        <div className="font-bold text-sm">{table.number}</div>
        <div className="text-xs opacity-75">{table.seats} asientos</div>
      </div>

      {/* Order Items Preview */}
      {orderItems.length > 0 && (
        <div className="flex-1 w-full px-2">
          <div className="flex items-center justify-center mb-1">
            <ShoppingBag className="h-3 w-3 mr-1" />
            <span className="text-xs font-medium">{itemCount} items</span>
          </div>

          {/* Product Images Grid */}
          <div className="grid grid-cols-2 gap-1 max-h-8 overflow-hidden">
            {orderItems.slice(0, 4).map((item, index) => (
              <div key={`${item.id}-${index}`} className="relative">
                <img
                  src={item.image || "/placeholder.svg"}
                  alt={item.name}
                  className="w-4 h-4 object-cover rounded border"
                />
                {(Number(item.quantity) || 0) > 1 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-3 h-3 flex items-center justify-center leading-none">
                    {Number(item.quantity) || 0}
                  </span>
                )}
              </div>
            ))}
          </div>

          {orderItems.length > 4 && (
            <div className="text-xs text-center mt-1 opacity-75">+{orderItems.length - 4} más</div>
          )}

          <div className="text-xs text-center font-bold mt-1">{formatPrice(Number(table.currentOrder?.total || 0))}</div>
        </div>
      )}

      {/* Ticket Indicator */}
      {showTicketIndicator && (
        <div className="absolute top-1 right-1">
          <div className="bg-amber-500 text-white rounded-full p-1 animate-pulse">
            <Printer className="h-3 w-3" />
          </div>
        </div>
      )}

      {/* Drop Zone Indicator */}
      {isDragOver && (
        <div className="absolute inset-0 bg-blue-400 bg-opacity-20 flex items-center justify-center">
          <div className="text-blue-800 font-bold text-xs">Soltar aquí</div>
        </div>
      )}
    </div>
  )
}
