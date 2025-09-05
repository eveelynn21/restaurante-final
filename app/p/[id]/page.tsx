"use client"

import { useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'

export default function ShortPedidoPage() {
  const params = useParams()
  const router = useRouter()
  const mesaId = params.id

  useEffect(() => {
    if (mesaId) {
      // Redirigir a la página completa del pedido
      router.push(`/pedido-estado?mesa=${mesaId}`)
    } else {
      // Si no hay mesa, mostrar error
      router.push('/pedido-estado')
    }
  }, [mesaId, router])

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-red-50 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600 mx-auto mb-4"></div>
        <p className="text-gray-600">Redirigiendo al estado del pedido...</p>
      </div>
    </div>
  )
}

