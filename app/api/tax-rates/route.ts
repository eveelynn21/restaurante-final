import { NextRequest, NextResponse } from 'next/server'
import { getTaxRates } from '../../../lib/services/tax-service'
import jwt from 'jsonwebtoken'

const JWT_SECRET = process.env.JWT_SECRET || 'supersecretkey'

// Función helper para verificar el token
function verifyToken(authHeader: string | null): { businessId: number; userId: number } {
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new Error('Token requerido')
  }

  const token = authHeader.substring(7)
  const decoded = jwt.verify(token, JWT_SECRET) as { business_id: number; user_id: number }
  
  if (typeof decoded.business_id === 'undefined') {
    throw new Error('Token inválido: business_id no encontrado')
  }
  
  if (typeof decoded.user_id === 'undefined') {
    throw new Error('Token inválido: user_id no encontrado')
  }
  
  return { businessId: decoded.business_id, userId: decoded.user_id }
}

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization')
    const { businessId } = verifyToken(authHeader)
    
    const taxRates = await getTaxRates(businessId)
    
    return NextResponse.json({
      success: true,
      data: taxRates
    })
  } catch (error) {
    console.error('Error fetching tax rates:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Error al obtener las tasas de impuestos' 
      },
      { status: 500 }
    )
  }
} 