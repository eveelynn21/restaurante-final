import { NextResponse } from 'next/server'
import { executePosQuery } from '../../../../lib/database'

export async function GET(req: Request) {
  try {
    const url = new URL(req.url)
    const businessId = url.searchParams.get('businessId')
    if (!businessId) {
      return NextResponse.json({ error: 'businessId requerido' }, { status: 400 })
    }
    // Obtener categorías con productos
    const categories = await executePosQuery(
      `SELECT DISTINCT c.id, c.name
       FROM products p
       JOIN categories c ON p.category_id = c.id
       WHERE p.business_id = ?`,
      [businessId]
    ) as Array<{ id: number; name: string }>

    // Obtener todos los productos del negocio
    const products = await executePosQuery(
      `SELECT p.*, c.name as category_name
       FROM products p
       LEFT JOIN categories c ON p.category_id = c.id
       WHERE p.business_id = ?`,
      [businessId]
    ) as any[]

    // Agrupar productos por categoría
    const categoryMap: Record<string, any[]> = {}
    categories.forEach(cat => {
      categoryMap[cat.name] = []
    })
    // Para productos sin categoría
    categoryMap['Sin categoría'] = []

    products.forEach(prod => {
      const catName = prod.category_name || 'Sin categoría'
      if (!categoryMap[catName]) categoryMap[catName] = []
      categoryMap[catName].push(prod)
    })

    // Formato de respuesta: array de { category: string, products: [] }
    const result = Object.entries(categoryMap).map(([category, products]) => ({ category, products }))
    return NextResponse.json({ categories: result })
  } catch (error) {
    console.error('Error obteniendo categorías y productos:', error)
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Error al obtener categorías' }, { status: 500 })
  }
} 