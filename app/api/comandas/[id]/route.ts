import { NextRequest, NextResponse } from 'next/server'
import { executePosQuery } from '../../../../lib/database'
import jwt from 'jsonwebtoken'

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Verificar token
    const authHeader = request.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Token requerido' }, { status: 401 })
    }

    const token = authHeader.substring(7)
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'supersecretkey') as any
    const businessId = decoded.business_id

    if (!businessId) {
      return NextResponse.json({ error: 'business_id requerido' }, { status: 400 })
    }

    const comandaId = parseInt(params.id)
    if (isNaN(comandaId)) {
      return NextResponse.json({ error: 'ID de comanda inválido' }, { status: 400 })
    }

    const { product_id, item_status } = await request.json()

    if (!product_id || !item_status) {
      return NextResponse.json({ error: 'product_id e item_status son requeridos' }, { status: 400 })
    }

    // Actualizar el estado del producto individual
    const result = await executePosQuery(
      `UPDATE comandas 
       SET item_status = ?, updated_at = NOW() 
       WHERE product_id = ?`,
      [item_status, product_id]
    ) as any

    if (result.affectedRows === 0) {
      return NextResponse.json({ error: 'Producto no encontrado en la comanda' }, { status: 404 })
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Estado del producto actualizado correctamente'
    })

  } catch (error) {
    console.error('Error actualizando estado del producto:', error)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}
