"use client"

import type React from "react"
import { useState } from "react"

import { Coffee, IceCream, LayoutGrid, Utensils, ChevronDown, ChevronRight, Grid3X3 } from "lucide-react"
import { Button } from "../../components/ui/button"
import { cn } from "../../lib/utils"

interface CategorySidebarProps {
  selectedCategory: string
  onSelectCategory: (category: string) => void
  categories: { id: string; name: string }[]
  isOpen: boolean
}

interface CategoryItem {
  id: string
  name: string
  icon: React.ElementType
}

export default function CategorySidebar({ selectedCategory, onSelectCategory, categories, isOpen }: CategorySidebarProps) {
  return (
    <div className="w-56 border-r border-white/20 bg-gradient-to-b from-white/90 to-white/70 backdrop-blur-md p-4 animate-in slide-in-from-left-2 duration-300 shadow-xl">
      {/* Header con gradiente */}
      <div className="mb-6">
        <h2 className="text-lg font-bold gradient-text mb-2">Categorías</h2>
        <div className="w-12 h-1 gradient-bg rounded-full"></div>
      </div>
      
      {/* Categorías desplegables */}
      <div className="space-y-3">
        {categories.map((category) => (
          <Button
            key={category.id}
            variant="ghost"
            className={cn(
              "w-full flex items-center justify-start p-3 rounded-xl border-2 transition-all duration-300 hover:scale-[1.02] hover:shadow-lg group relative overflow-hidden",
              selectedCategory === category.id
                ? "gradient-bg text-white font-semibold shadow-xl border-transparent"
                : "glass-effect border-white/30 hover:border-primary/50 hover:bg-white/80 text-muted-foreground hover:text-foreground"
            )}
            onClick={() => onSelectCategory(category.id)}
          >
            {/* Efecto de brillo en hover */}
            <div className={cn(
              "absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent transform -skew-x-12 transition-transform duration-500",
              selectedCategory === category.id ? "translate-x-full" : "group-hover:translate-x-full"
            )} />
            
            <div className={cn(
              "w-2 h-2 rounded-full mr-2 transition-all duration-300 relative z-10",
              selectedCategory === category.id 
                ? "bg-white shadow-lg" 
                : "bg-muted-foreground group-hover:bg-primary"
            )} />
            <span className="text-sm font-medium relative z-10">{category.name}</span>
          </Button>
        ))}
      </div>
    </div>
  )
}
