// Copia de respaldo de page.tsx antes de agregar la opción de configuración global de comandas
// --- INICIO DE RESPALDO ---

"use client"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import {
  LayoutDashboard,
  Users,
  User,
  UtensilsCrossed,
  Settings,
  Globe,
  BarChart3,
  Plus,
  Edit,
  Trash2,
  Eye,
  ShoppingCart,
  MapPin,
  Clock,
  Database,
  BarChart,
  FileText,
  ChefHat,
  Package,
  LogOut,
  TrendingUp,
  DollarSign,
  Activity,
  Calendar,
  Building,
  ShoppingBag,
  ChevronDown,
  ChevronRight,
} from "lucide-react"
import { Button } from "../../components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../../components/ui/card"
import { Badge } from "../../components/ui/badge"
import { useTables } from "../context/table-context"
import { jwtDecode } from "jwt-decode"
import ProductManagement from "../components/product-management"
import TestDatabaseContent from "../components/test-database-content"
import ClientsContent from "../components/clients-content"
import KitchenContent from "../components/kitchen-content"
import AreaOrdersContent from "../components/area-orders-content"
import ProduccionContent from "../components/produccion-content"
import ComandasContent from "../components/comandas-content"
import Link from "next/link"

// ... (resto del archivo igual que el original, omitido aquí por brevedad) 