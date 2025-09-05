import { NextRequest, NextResponse } from 'next/server'
import { executePosQuery } from '../../../lib/database'
import { verifyToken } from '../../../lib/utils'

export async function GET(req: NextRequest) {
  try {
    console.log('🔍 Iniciando GET /api/test-database')
    const authHeader = req.headers.get('authorization')
    
    if (!authHeader) {
      return NextResponse.json(
        { success: false, error: 'Token de autorización requerido' },
        { status: 401 }
      )
    }

    const { businessId } = verifyToken(authHeader)
    console.log('✅ Business ID:', businessId)
    
    // Verificar si existe el campo is_produced
    const checkColumn = await executePosQuery(
      `SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE, COLUMN_DEFAULT 
       FROM INFORMATION_SCHEMA.COLUMNS 
       WHERE TABLE_SCHEMA = 'siscontr_pos37' 
       AND TABLE_NAME = 'transactions' 
       AND COLUMN_NAME = 'is_produced'`
    ) as any[]

    console.log('✅ Verificación de columna:', checkColumn)

    // Obtener algunas transacciones de ejemplo
    const sampleTransactions = await executePosQuery(
      `SELECT 
        id, invoice_no, final_total, is_produced, type, created_at
       FROM transactions 
       WHERE business_id = ? 
       ORDER BY created_at DESC 
       LIMIT 5`,
      [businessId]
    ) as any[]

    console.log('✅ Transacciones de ejemplo:', sampleTransactions)

    // Contar transacciones por estado
    const countByStatus = await executePosQuery(
      `SELECT 
        is_produced,
        COUNT(*) as count
       FROM transactions 
       WHERE business_id = ? AND type = 'sell'
       GROUP BY is_produced`,
      [businessId]
    ) as any[]

    console.log('✅ Conteo por estado:', countByStatus)

    return NextResponse.json({
      success: true,
      data: {
        columnExists: checkColumn.length > 0,
        columnInfo: checkColumn[0] || null,
        sampleTransactions,
        countByStatus,
        businessId
      }
    })
  } catch (error) {
    console.error('❌ Error en GET /api/test-database:', error)
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