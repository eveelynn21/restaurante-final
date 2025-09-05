"use client"

import ProduccionContent from "../components/produccion-content"
import { Button } from "../../components/ui/button"
import { LayoutDashboard } from "lucide-react"
import { useRouter } from "next/navigation"

export default function ProduccionPage() {
  const router = useRouter()

  return (
    <div className="container mx-auto p-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 mb-2">Sistema de Producción</h1>
          <p className="text-gray-600">
            Procesa transacciones y calcula el consumo de insumos.
          </p>
        </div>
        <Button
          variant="outline"
          className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium bg-purple-50 text-purple-700 border-2 border-purple-300 shadow-sm hover:shadow-md hover:border-purple-600 hover:bg-purple-100 transition-all duration-200"
          onClick={() => router.push('/dashboard')}
        >
          <LayoutDashboard className="h-4 w-4" />
          Dashboard
        </Button>
      </div>
      <ProduccionContent />
    </div>
  )
}

