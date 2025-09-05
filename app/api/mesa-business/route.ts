import { NextRequest, NextResponse } from 'next/server'
import { executePosQuery } from '../../../lib/database'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const mesaId = searchParams.get('mesa_id')

    if (!mesaId) {
      return NextResponse.json({ error: 'mesa_id es requerido' }, { status: 400 })
    }

    console.log('🔍 Buscando business_id para mesa:', mesaId)

    // Obtener el business_id desde la mesa
    const result = await executePosQuery(
      `SELECT business_id FROM res_tables WHERE id = ? AND deleted_at IS NULL`,
      [mesaId]
    ) as any[]

    if (!result || result.length === 0) {
      return NextResponse.json({ 
        success: false, 
        message: 'Mesa no encontrada' 
      }, { status: 404 })
    }

    const businessId = result[0].business_id

    console.log('✅ Business ID encontrado para mesa:', mesaId, 'business_id:', businessId)

    return NextResponse.json({
      success: true,
      business_id: businessId,
      mesa_id: mesaId
    })

  } catch (error) {
    console.error('❌ Error obteniendo business_id de mesa:', error)
    return NextResponse.json({ 
      error: 'Error interno del servidor' 
    }, { status: 500 })
  }
}


