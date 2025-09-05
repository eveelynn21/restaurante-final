import { NextRequest, NextResponse } from 'next/server'
import { executePosQuery } from '../../../../lib/database'
import jwt from 'jsonwebtoken'

const JWT_SECRET = process.env.JWT_SECRET || 'supersecretkey'

// Función helper para verificar el token
function verifyToken(authHeader: string | null): { businessId: number; userId: number } {
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new Error('Token requerido')
  }

  const token = authHeader.substring(7)
  const decoded = jwt.verify(token, JWT_SECRET) as { business_id: number; user_id: number }
  
  if (typeof decoded.business_id === 'undefined' || typeof decoded.user_id === 'undefined') {
    throw new Error('Token inválido: business_id o user_id no encontrado')
  }
  
  return { businessId: decoded.business_id, userId: decoded.user_id }
}

export async function GET(req: NextRequest) {
  try {
    console.log('🔍 Iniciando GET /api/transactions/daily-sales')
    const authHeader = req.headers.get('authorization')
    console.log('🔑 Auth header:', authHeader ? 'Presente' : 'Ausente')
    
    const { businessId } = verifyToken(authHeader)
    console.log('✅ Token verificado, businessId:', businessId)

    // Obtener la fecha actual en formato YYYY-MM-DD
    const today = new Date().toISOString().split('T')[0]
    
    // Obtener ventas del día actual
    const dailySales = await executePosQuery(
      `SELECT 
        HOUR(transaction_date) as hour,
        COUNT(*) as transaction_count,
        SUM(final_total) as total_sales
      FROM transactions 
      WHERE business_id = ? 
        AND type = 'sell' 
        AND status = 'final'
        AND DATE(transaction_date) = ?
      GROUP BY HOUR(transaction_date)
      ORDER BY hour ASC`,
      [businessId, today]
    ) as any[]

    // Obtener total del día
    const totalDayResult = await executePosQuery(
      `SELECT 
        COUNT(*) as total_transactions,
        SUM(final_total) as total_sales
      FROM transactions 
      WHERE business_id = ? 
        AND type = 'sell' 
        AND status = 'final'
        AND DATE(transaction_date) = ?`,
      [businessId, today]
    ) as any[]

    const totalDay = totalDayResult[0] || { total_transactions: 0, total_sales: 0 }

    // Crear array con todas las horas del día (0-23)
    const hourlyData = Array.from({ length: 24 }, (_, hour) => {
      const hourData = dailySales.find(sale => sale.hour === hour)
      return {
        hour,
        transaction_count: hourData?.transaction_count || 0,
        total_sales: hourData?.total_sales || 0
      }
    })

    console.log('✅ Ventas del día obtenidas:', {
      total_transactions: totalDay.total_transactions,
      total_sales: totalDay.total_sales,
      hourly_data: hourlyData.length
    })

    return NextResponse.json({
      success: true,
      data: {
        date: today,
        total_transactions: totalDay.total_transactions,
        total_sales: totalDay.total_sales,
        hourly_data: hourlyData
      }
    })
  } catch (error) {
    console.error('❌ Error en GET /api/transactions/daily-sales:', error)
    return NextResponse.json(
      { success: false, error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}
