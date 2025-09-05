import { NextRequest, NextResponse } from 'next/server'
import { executePosQuery } from '../../../../lib/database'
import { verifyToken } from '../../../../lib/utils'

export async function GET(req: NextRequest) {
  try {
    console.log('🔍 Iniciando GET /api/transactions/unprocessed')
    const authHeader = req.headers.get('authorization')
    console.log('🔑 Auth header:', authHeader ? 'Presente' : 'Ausente')
    
    const { businessId } = verifyToken(authHeader)
    console.log('✅ Token verificado, businessId:', businessId)

    // Obtener transacciones no procesadas (is_produced = 0)
    const transactions = await executePosQuery(
      `SELECT 
        t.id,
        t.business_id,
        t.location_id,
        t.type,
        t.status,
        t.payment_status,
        t.contact_id,
        t.number,
        t.invoice_no,
        t.transaction_date,
        t.final_total,
        t.created_by,
        t.created_at,
        t.updated_at,
        t.resolution,
        t.prefix,
        t.res_table_id,
        t.essentials_duration,
        t.is_produced,
        c.name as contact_name,
        c.supplier_business_name
      FROM transactions t
      LEFT JOIN contacts c ON t.contact_id = c.id
      WHERE t.business_id = ? AND t.is_produced = 0 AND t.type = 'sell'
      ORDER BY t.created_at ASC`,
      [businessId]
    ) as any[]

    console.log('✅ Transacciones no procesadas obtenidas:', transactions?.length || 0)

    return NextResponse.json({
      success: true,
      data: transactions,
      total: transactions?.length || 0
    })
  } catch (error) {
    console.error('❌ Error en GET /api/transactions/unprocessed:', error)
    return NextResponse.json(
      { success: false, error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

export async function PUT(req: NextRequest) {
  try {
    console.log('🔄 Iniciando PUT /api/transactions/unprocessed')
    const authHeader = req.headers.get('authorization')
    const { businessId } = verifyToken(authHeader)
    
    const { transactionIds } = await req.json()
    
    if (!transactionIds || !Array.isArray(transactionIds) || transactionIds.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Se requieren IDs de transacciones válidos' },
        { status: 400 }
      )
    }

    // Marcar transacciones como procesadas (is_produced = 1)
    const placeholders = transactionIds.map(() => '?').join(',')
    const result = await executePosQuery(
      `UPDATE transactions 
       SET is_produced = 1, updated_at = NOW() 
       WHERE id IN (${placeholders}) AND business_id = ?`,
      [...transactionIds, businessId]
    ) as any

    console.log('✅ Transacciones marcadas como procesadas:', result.affectedRows)

    return NextResponse.json({
      success: true,
      message: `${result.affectedRows} transacciones marcadas como procesadas`,
      affectedRows: result.affectedRows
    })
  } catch (error) {
    console.error('❌ Error en PUT /api/transactions/unprocessed:', error)
    return NextResponse.json(
      { success: false, error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}




