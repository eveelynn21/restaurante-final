import { NextRequest, NextResponse } from 'next/server'
import { executePosQuery } from '../../../../../lib/database'
import { verifyToken } from '../../../../../lib/utils'

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    console.log('🔍 Iniciando GET /api/transactions/[id]/products')
    const authHeader = req.headers.get('authorization')
    const { businessId } = verifyToken(authHeader)
    
    const transactionId = params.id
    
    if (!transactionId) {
      return NextResponse.json(
        { success: false, error: 'ID de transacción requerido' },
        { status: 400 }
      )
    }

    // Obtener productos de la transacción
    const products = await executePosQuery(
      `SELECT 
        tsl.id,
        tsl.transaction_id,
        tsl.product_id,
        tsl.variation_id,
        tsl.quantity,
        tsl.unit_price,
        tsl.unit_price_inc_tax,
        tsl.item_tax,
        tsl.tax_id,
        tsl.created_at,
        tsl.updated_at,
        p.name as product_name,
        p.sku as product_sku,
        p.image as product_image,
        v.name as variation_name,
        v.sub_sku as variation_sku
      FROM transaction_sell_lines tsl
      LEFT JOIN products p ON tsl.product_id = p.id
      LEFT JOIN variations v ON tsl.variation_id = v.id
      WHERE tsl.transaction_id = ?`,
      [transactionId]
    ) as any[]

    console.log('✅ Productos de transacción obtenidos:', products?.length || 0)

    return NextResponse.json({
      success: true,
      data: products,
      total: products?.length || 0
    })
  } catch (error) {
    console.error('❌ Error en GET /api/transactions/[id]/products:', error)
    return NextResponse.json(
      { success: false, error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}




