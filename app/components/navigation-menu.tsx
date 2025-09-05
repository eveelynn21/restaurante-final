"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Button } from "../../components/ui/button"
import { Store, Globe, LayoutDashboard } from "lucide-react"

export default function NavigationMenu() {
  const pathname = usePathname()

  return (
    <div className="flex gap-2">
      <Button variant={pathname === "/presencial" ? "default" : "outline"} asChild className="flex items-center gap-2">
        <Link href="/presencial">
          <Store className="h-4 w-4" />
          Presencial
        </Link>
      </Button>

      <Button variant={pathname === "/web" ? "default" : "outline"} asChild className="flex items-center gap-2">
        <Link href="/web">
          <Globe className="h-4 w-4" />
          Online
        </Link>
      </Button>

      <Button variant={pathname === "/dashboard" ? "default" : "outline"} asChild className="flex items-center gap-2">
        <Link href="/dashboard">
          <LayoutDashboard className="h-4 w-4" />
          Dashboard
        </Link>
      </Button>
    </div>
  )
}
