import { NextResponse } from 'next/server'
import { executePosQuery } from '../../../lib/database'

export async function GET(req: Request) {
  try {
    // Consulta para ver la estructura de las tablas
    const tableQuery = `
      SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE, COLUMN_DEFAULT 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_NAME = 'products' OR TABLE_NAME = 'variations'
      ORDER BY TABLE_NAME, ORDINAL_POSITION
    `
    const tableInfo = await executePosQuery(tableQuery, []) as any[]
    
    // Consulta para ver algunos productos de ejemplo
    const productsQuery = `
      SELECT 
        p.id, p.sku, p.name, p.business_id, p.not_for_selling, p.is_inactive,
        v.sell_price_inc_tax,
        b.id as business_id_from_business,
        u.business_id as business_id_from_user
      FROM products p 
      JOIN variations v ON p.id = v.product_id
      JOIN business b ON p.business_id = b.id 
      JOIN users u ON b.id = u.business_id
      WHERE u.business_id = 165
      LIMIT 5
    `
    const products = await executePosQuery(productsQuery, []) as any[]

    return NextResponse.json({
      success: true,
      tableInfo,
      products,
      message: 'Esto es solo para debug y debe ser eliminado en producción'
    })
  } catch (error) {
    console.error('Error en debug products:', error)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
} 