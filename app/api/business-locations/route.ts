import { NextResponse } from 'next/server'
import { executePosQuery } from '../../../lib/database'
import jwt from 'jsonwebtoken'

const JWT_SECRET = process.env.JWT_SECRET || 'supersecretkey'

// Función helper para verificar el token
function verifyToken(authHeader: string | null): { businessId: number } {
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new Error('Token requerido')
  }

  const token = authHeader.substring(7)
  const decoded = jwt.verify(token, JWT_SECRET) as { business_id: number }
  
  if (typeof decoded.business_id === 'undefined') {
    throw new Error('Token inválido: business_id no encontrado')
  }
  
  return { businessId: decoded.business_id }
}

export async function GET(req: Request) {
  try {
    const authHeader = req.headers.get('authorization')
    const { businessId } = verifyToken(authHeader)

    const locations = await executePosQuery(
      'SELECT bl.id, bl.name FROM business_locations bl WHERE business_id = ?',
      [businessId]
    ) as Array<{ id: number; name: string }>

    return NextResponse.json({ locations })
  } catch (error) {
    console.error('Error getting business locations:', error)
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : 'Error al obtener ubicaciones' 
    }, { status: 500 })
  }
} 