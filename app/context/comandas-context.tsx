"use client"

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { jwtDecode } from 'jwt-decode'

// Helper function to get business_id from token
const getBusinessIdFromToken = (): number | null => {
  try {
    const token = localStorage.getItem('token')
    if (!token) return null
    const decoded: any = jwtDecode(token)
    return decoded.business_id || null
  } catch {
    return null
  }
}

export interface Comanda {
  id: string
  tableNumber: string
  tableId: string
  waiter: string
  items: ComandaItem[]
  createdAt: Date
  status: 'pending' | 'preparing' | 'ready' | 'completed'
  area: string
  estimatedTime?: number
}

export interface ComandaItem {
  id: number
  name: string
  quantity: number
  price: number
  status: 'pending' | 'preparing' | 'ready' | 'completed'
  image?: string
}

export interface ProduccionItem {
  id: string
  comandaId: string
  tableNumber: string
  tableId: string
  waiter: string
  items: ComandaItem[]
  completedAt: Date
  area: string
  hasRecipe: boolean
}

export interface SentItem {
  tableId: string
  area: string
  itemId: string
  sentAt: Date
}

interface ComandasContextType {
  comandas: Comanda[]
  sentItems: SentItem[]
  produccionItems: ProduccionItem[]
  addComanda: (comanda: Comanda) => void
  updateComandaStatus: (id: string, status: Comanda['status']) => void
  updateProductStatus: (comandaId: string, productId: number, status: string) => Promise<void>
  getComandasByArea: (area: string) => Comanda[]
  markItemsAsSent: (tableId: string, area: string, itemIds: string[]) => void
  isItemSent: (tableId: string, area: string, itemId: string) => boolean
  moveToProduccion: (comanda: Comanda) => void
  getProduccionItems: () => ProduccionItem[]
  clearComandasByArea: (areaName: string) => void
  loadComandasByArea: (area: string) => Promise<void>
}

const ComandasContext = createContext<ComandasContextType | undefined>(undefined)

export function ComandasProvider({ children }: { children: ReactNode }) {
  const [comandas, setComandas] = useState<Comanda[]>([])
  const [sentItems, setSentItems] = useState<SentItem[]>([])
  const [produccionItems, setProduccionItems] = useState<ProduccionItem[]>([])

  // Cargar todas las comandas al inicializar el contexto
  useEffect(() => {
    const loadAllComandas = async () => {
      try {
        const token = localStorage.getItem('token')
        if (!token) return

        const response = await fetch('/api/comandas', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        })

        if (response.ok) {
          const data = await response.json()
          if (data.success) {
            setComandas(data.data)
            console.log('✅ Comandas cargadas desde BD al inicializar:', data.data)
          }
        }
      } catch (error) {
        console.error('Error cargando comandas al inicializar:', error)
      }
    }

    loadAllComandas()
  }, [])

  // Cargar comandas desde la API
  const loadComandasByArea = async (area: string) => {
    try {
      const token = localStorage.getItem('token')
      if (!token) return

      const response = await fetch(`/api/comandas?area=${encodeURIComponent(area)}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (response.ok) {
        const data = await response.json()
        if (data.success) {
          setComandas(data.data)
        }
      }
    } catch (error) {
      console.error('Error cargando comandas:', error)
    }
  }

  const addComanda = async (comanda: Comanda) => {
    // Agregar al estado local
    setComandas(prev => [...prev, comanda])
    
    // También guardar en la base de datos
    try {
      const token = localStorage.getItem('token')
      if (!token) {
        console.warn('No hay token para guardar comanda en BD')
        return
      }

      const response = await fetch('/api/comandas', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          mesa_id: parseInt(comanda.tableId),
          items: JSON.stringify(comanda.items),
          total: comanda.items.reduce((sum, item) => sum + (item.price * item.quantity), 0),
          estado: 'pendiente',
          area: comanda.area
        })
      })

      if (response.ok) {
        console.log('✅ Comanda guardada en base de datos')
        
        // Eliminar pedidos temporales de la mesa después de enviar comanda
        try {
          const businessId = getBusinessIdFromToken()
          if (businessId) {
            const deleteResponse = await fetch(`/api/table-orders-temp?mesa_id=${parseInt(comanda.tableId)}&business_id=${businessId}`, {
              method: 'DELETE',
              headers: {
                'Authorization': `Bearer ${token}`
              }
            })
            
            if (deleteResponse.ok) {
              console.log('✅ Pedidos temporales eliminados después de enviar comanda')
            } else {
              console.error('❌ Error eliminando pedidos temporales')
            }
          }
        } catch (error) {
          console.error('❌ Error eliminando pedidos temporales:', error)
        }
      } else {
        console.error('❌ Error guardando comanda en BD:', response.statusText)
      }
    } catch (error) {
      console.error('❌ Error guardando comanda en BD:', error)
    }
  }

  const updateComandaStatus = (id: string, status: Comanda['status']) => {
    setComandas(prev => prev.map(comanda => 
      comanda.id === id ? { ...comanda, status } : comanda
    ))
  }

  const updateProductStatus = async (comandaId: string, productId: number, status: string) => {
    try {
      const token = localStorage.getItem('token')
      if (!token) return

      const response = await fetch(`/api/comandas/${comandaId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          product_id: productId,
          item_status: status
        })
      })

      if (response.ok) {
        // Actualizar estado local
        setComandas(prev => prev.map(comanda => {
          if (comanda.id === comandaId) {
            return {
              ...comanda,
              items: comanda.items.map(item => 
                item.id === productId ? { ...item, status: status as any } : item
              )
            }
          }
          return comanda
        }))
        console.log('✅ Estado del producto actualizado en BD')
      } else {
        console.error('❌ Error actualizando estado del producto:', response.statusText)
      }
    } catch (error) {
      console.error('❌ Error actualizando estado del producto:', error)
    }
  }

  const getComandasByArea = (area: string) => {
    console.log('getComandasByArea - buscando área:', area)
    console.log('getComandasByArea - todas las comandas:', comandas)
    
    let filtered
    if (area === "General") {
      // Para área General, buscar comandas con área null, undefined, o "General"
      filtered = comandas.filter(comanda => 
        !comanda.area || 
        comanda.area === "null" || 
        comanda.area === "undefined" || 
        comanda.area === "General"
      )
    } else {
      // Para otras áreas, buscar por nombre exacto
      filtered = comandas.filter(comanda => comanda.area === area)
    }
    
    console.log('getComandasByArea - comandas filtradas:', filtered)
    return filtered
  }

  const markItemsAsSent = (tableId: string, area: string, itemIds: string[]) => {
    const newSentItems = itemIds.map(itemId => ({
      tableId,
      area,
      itemId,
      sentAt: new Date()
    }))
    setSentItems(prev => [...prev, ...newSentItems])
  }

  const isItemSent = (tableId: string, area: string, itemId: string) => {
    return sentItems.some(item => 
      item.tableId === tableId && 
      item.area === area && 
      item.itemId === itemId
    )
  }

  const moveToProduccion = async (comanda: Comanda) => {
    // Verificar si los productos tienen recetas
    const itemsWithRecipes = await Promise.all(
      comanda.items.map(async (item) => {
        try {
          const token = localStorage.getItem('token')
          if (!token) return { ...item, hasRecipe: false }

          const response = await fetch(`/api/recipes?product_id=${item.id}`, {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          })
          
          if (response.ok) {
            const data = await response.json()
            return { ...item, hasRecipe: data.success && data.data && data.data.length > 0 }
          }
        } catch (error) {
          console.error('Error verificando receta:', error)
        }
        return { ...item, hasRecipe: false }
      })
    )

    const produccionItem: ProduccionItem = {
      id: `prod-${Date.now()}`,
      comandaId: comanda.id,
      tableNumber: comanda.tableNumber,
      tableId: comanda.tableId,
      waiter: comanda.waiter,
      items: itemsWithRecipes,
      completedAt: new Date(),
      area: comanda.area,
      hasRecipe: itemsWithRecipes.some(item => item.hasRecipe)
    }
    setProduccionItems(prev => [...prev, produccionItem])
  }

  const getProduccionItems = () => {
    return produccionItems
  }

  const clearComandasByArea = (areaName: string) => {
    setComandas(prev => prev.filter(comanda => comanda.area !== areaName))
  }

  return (
    <ComandasContext.Provider value={{
      comandas,
      sentItems,
      produccionItems,
      addComanda,
      updateComandaStatus,
      updateProductStatus,
      getComandasByArea,
      markItemsAsSent,
      isItemSent,
      moveToProduccion,
      getProduccionItems,
      clearComandasByArea,
      loadComandasByArea
    }}>
      {children}
    </ComandasContext.Provider>
  )
}

export function useComandas() {
  const context = useContext(ComandasContext)
  if (context === undefined) {
    throw new Error('useComandas must be used within a ComandasProvider')
  }
  return context
} 