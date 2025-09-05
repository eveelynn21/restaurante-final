"use client"

import { useRouter } from "next/navigation"
import { Button } from "../../components/ui/button"
import { LogOut } from "lucide-react"

export function LogoutButton() {
  const router = useRouter()

  const handleLogout = () => {
    // Limpiar el token del localStorage
    localStorage.removeItem("token")
    // Redireccionar al login
    router.replace("/login")
  }

  return (
    <Button 
      onClick={handleLogout}
      variant="ghost" 
      size="sm"
      className="text-red-600 hover:text-red-700 hover:bg-red-100"
    >
      <LogOut className="h-4 w-4 mr-2" />
      Cerrar Sesión
    </Button>
  )
} 