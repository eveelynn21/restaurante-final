import { NextResponse } from 'next/server'
import { executePosQuery } from '@/lib/database'

export async function GET(req: Request) {
  try {
    console.log('🔍 Iniciando GET /api/test-products')
    const url = new URL(req.url)
    const businessId = url.searchParams.get('businessId')
    
    if (!businessId) {
      return NextResponse.json({ error: 'businessId requerido' }, { status: 400 })
    }

    console.log('✅ Business ID:', businessId)

    // Verificar si existen productos para este business
    const productsCount = await executePosQuery(
      `SELECT COUNT(*) as total FROM products WHERE business_id = ?`,
      [businessId]
    ) as any[]

    console.log('✅ Total de productos:', productsCount)

    // Obtener algunos productos de ejemplo
    const sampleProducts = await executePosQuery(
      `SELECT 
        p.id, 
        p.name, 
        p.sku, 
        p.category_id,
        c.name as category_name,
        v.sell_price_inc_tax,
        p.image,
        p.not_for_selling
       FROM products p
       LEFT JOIN variations v ON p.id = v.product_id
       LEFT JOIN categories c ON p.category_id = c.id
       WHERE p.business_id = ?
       ORDER BY p.id DESC
       LIMIT 5`,
      [businessId]
    ) as any[]

    console.log('✅ Productos de ejemplo:', sampleProducts)

    // Verificar si hay variaciones
    const variationsCount = await executePosQuery(
      `SELECT COUNT(*) as total FROM variations v
       INNER JOIN products p ON v.product_id = p.id
       WHERE p.business_id = ?`,
      [businessId]
    ) as any[]

    console.log('✅ Total de variaciones:', variationsCount)

    // Verificar categorías
    const categoriesCount = await executePosQuery(
      `SELECT COUNT(*) as total FROM categories WHERE business_id = ?`,
      [businessId]
    ) as any[]

    console.log('✅ Total de categorías:', categoriesCount)

    return NextResponse.json({
      success: true,
      data: {
        businessId: Number(businessId),
        productsCount: productsCount[0]?.total || 0,
        variationsCount: variationsCount[0]?.total || 0,
        categoriesCount: categoriesCount[0]?.total || 0,
        sampleProducts
      }
    })
  } catch (error) {
    console.error('❌ Error en GET /api/test-products:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Error interno del servidor',
        details: error instanceof Error ? error.message : 'Error desconocido'
      },
      { status: 500 }
    )
  }
}


