import { NextResponse, NextRequest } from 'next/server'
import { executePosQuery } from '../../../lib/database'
import jwt from 'jsonwebtoken'

const JWT_SECRET = process.env.JWT_SECRET || 'supersecretkey'

export async function GET(request: NextRequest) {
  try {
    console.log('🔍 GET /api/order-areas - Iniciando consulta')
    
    const token = request.headers.get('Authorization')?.replace('Bearer ', '')
    
    if (!token) {
      return NextResponse.json({ error: 'Token requerido' }, { status: 401 })
    }

    // Decodificar el token para obtener el business_id
    const decoded = jwt.verify(token, JWT_SECRET) as { business_id: number }
    const businessId = decoded.business_id

    // Obtener el location_id automáticamente del business_id
    const businessLocation = await executePosQuery(
      `SELECT id FROM business_locations WHERE business_id = ? LIMIT 1`,
      [businessId]
    ) as any[]

    if (!businessLocation || businessLocation.length === 0) {
      console.log('❌ No se encontró ubicación para business_id:', businessId)
      return NextResponse.json({
        success: true,
        data: []
      })
    }

    const locationId = businessLocation[0].id
    console.log('📍 Filtrando áreas para business_id:', businessId, 'location_id:', locationId)
    
    const areas = await executePosQuery(
      'SELECT id, name FROM order_areas WHERE business_location_id = ? ORDER BY name',
      [locationId]
    )
    console.log('📦 Áreas encontradas:', areas)
    
    return NextResponse.json({
      success: true,
      data: areas
    })
  } catch (error) {
    console.error('❌ Error fetching order areas:', error)
    return NextResponse.json({ 
      error: 'Error al cargar áreas de orden' 
    }, { status: 500 })
  }
}

// POST: Agregar área
export async function POST(req: NextRequest) {
  try {
    const { name, business_location_id } = await req.json()
    if (!name || !business_location_id) {
      return NextResponse.json({ error: 'Nombre y business_location_id requeridos' }, { status: 400 })
    }
    await executePosQuery('INSERT INTO order_areas (name, business_location_id) VALUES (?, ?)', [name, business_location_id])
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('❌ Error adding order area:', error)
    return NextResponse.json({ 
      error: 'Error al agregar área: ' + (error instanceof Error ? error.message : String(error))
    }, { status: 500 })
  }
}

// PUT: Editar área
export async function PUT(req: NextRequest) {
  try {
    const url = new URL(req.url)
    const id = url.searchParams.get('id')
    const { name } = await req.json()
    if (!name || !id) {
      return NextResponse.json({ error: 'Nombre e ID requeridos' }, { status: 400 })
    }
    await executePosQuery('UPDATE order_areas SET name = ? WHERE id = ?', [name, id])
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('❌ Error updating order area:', error)
    return NextResponse.json({ 
      error: 'Error al actualizar área: ' + (error instanceof Error ? error.message : String(error))
    }, { status: 500 })
  }
}

// DELETE: Eliminar área
export async function DELETE(req: NextRequest) {
  try {
    const url = new URL(req.url)
    const id = url.searchParams.get('id')
    if (!id) {
      return NextResponse.json({ error: 'ID requerido' }, { status: 400 })
    }
    await executePosQuery('DELETE FROM order_areas WHERE id = ?', [id])
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('❌ Error deleting order area:', error)
    return NextResponse.json({ 
      error: 'Error al eliminar área: ' + (error instanceof Error ? error.message : String(error))
    }, { status: 500 })
  }
} 