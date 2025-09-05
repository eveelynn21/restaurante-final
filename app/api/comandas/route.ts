import { NextRequest, NextResponse } from 'next/server'
import { executePosQuery } from '../../../lib/database'
import jwt from 'jsonwebtoken'

export async function GET(request: NextRequest) {
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

    const { searchParams } = new URL(request.url)
    const area = searchParams.get('area')

    let query = `
      SELECT 
        c.id,
        c.mesa_id,
        c.product_id,
        c.quantity,
        c.item_status,
        c.area,
        c.total,
        c.estado,
        c.created_at,
        c.updated_at,
        p.name as product_name,
        c.total / c.quantity as price,
        p.image as product_image,
        t.number as table_number
      FROM comandas c
      LEFT JOIN products p ON c.product_id = p.id
      LEFT JOIN tables t ON c.mesa_id = t.id
      WHERE p.business_id = ?
    `
    const params = [businessId]

    if (area && area !== 'General') {
      query += ' AND c.area = ?'
      params.push(area)
    } else if (area === 'General') {
      query += ' AND (c.area IS NULL OR c.area = "null" OR c.area = "undefined" OR c.area = "General")'
    }
    
    // Solo mostrar productos que no estén completados
    query += ' AND c.item_status != "completed"'

    query += ' ORDER BY c.mesa_id, c.created_at DESC'

    const comandas = await executePosQuery(query, params) as any[]

    // Agrupar por mesa y área
    const comandasAgrupadas = comandas.reduce((acc, comanda) => {
      const key = `${comanda.mesa_id}-${comanda.area || 'General'}`
      
      if (!acc[key]) {
        acc[key] = {
          id: comanda.id,
          mesa_id: comanda.mesa_id,
          tableNumber: comanda.table_number,
          area: comanda.area || 'General',
          items: [],
          total: 0,
          estado: comanda.estado,
          createdAt: comanda.created_at,
          updatedAt: comanda.updated_at
        }
      }

      acc[key].items.push({
        id: comanda.product_id,
        name: comanda.product_name,
        quantity: comanda.quantity,
        price: comanda.price,
        status: comanda.item_status,
        image: comanda.product_image
      })

      acc[key].total += parseFloat(comanda.price || 0) * comanda.quantity

      return acc
    }, {})

    const comandasFormateadas = Object.values(comandasAgrupadas)

    return NextResponse.json({ 
      success: true, 
      data: comandasFormateadas
    })

  } catch (error) {
    console.error('Error obteniendo comandas:', error)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
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

    // Obtener datos del body
    const { mesa_id, items, total, estado, area } = await request.json()

    if (!mesa_id || !items || total === undefined) {
      return NextResponse.json({ error: 'mesa_id, items y total son requeridos' }, { status: 400 })
    }

    console.log('🔍 Datos recibidos:', { mesa_id, items, total, estado, area })
    console.log('🔍 Business ID:', businessId)

    // Insertar comanda en la base de datos con la nueva estructura
    // Para cada producto en items, crear un registro individual
    const itemsArray = Array.isArray(items) ? items : JSON.parse(items)
    
    console.log('🔍 Items a insertar:', itemsArray)
    
    for (const item of itemsArray) {
      console.log('🔍 Insertando item:', item)
      const insertResult = await executePosQuery(
        `INSERT INTO comandas (mesa_id, product_id, quantity, item_status, area, total, estado, items) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          mesa_id, 
          item.id, 
          item.quantity, 
          item.status || 'pending', 
          area || 'General', 
          item.price * item.quantity, 
          estado || 'pendiente',
          '[]'
        ]
      )
      console.log('🔍 Resultado de inserción:', insertResult)
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Comanda creada exitosamente'
    })

  } catch (error) {
    console.error('Error creando comanda:', error)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    console.log('🗑️ DELETE request recibido para comandas')
    
    // Verificar token
    const authHeader = request.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.log('❌ No hay token de autorización')
      return NextResponse.json({ error: 'Token requerido' }, { status: 401 })
    }

    const token = authHeader.substring(7)
    console.log('🔑 Token recibido:', token.substring(0, 20) + '...')
    
    let decoded: any
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET || 'supersecretkey') as any
      console.log('🔓 Token decodificado:', { business_id: decoded.business_id })
    } catch (jwtError) {
      console.error('❌ Error verificando JWT:', jwtError)
      return NextResponse.json({ error: 'Token inválido' }, { status: 401 })
    }
    
    const businessId = decoded.business_id

    if (!businessId) {
      console.log('❌ No hay business_id en el token')
      return NextResponse.json({ error: 'business_id requerido' }, { status: 400 })
    }

    const { searchParams } = new URL(request.url)
    const mesaId = searchParams.get('mesa_id')
    console.log('🏠 Mesa ID recibido:', mesaId, 'tipo:', typeof mesaId)

    if (!mesaId) {
      console.log('❌ No hay mesa_id en los parámetros')
      return NextResponse.json({ error: 'mesa_id es requerido' }, { status: 400 })
    }

    console.log('🗑️ Eliminando comandas para mesa:', mesaId, 'business:', businessId)
    
    // Eliminar todas las comandas de la mesa especificada
    const result = await executePosQuery(
      'DELETE FROM comandas WHERE mesa_id = ?',
      [mesaId]
    ) as any

    console.log('✅ Resultado de eliminación:', result)

    return NextResponse.json({ 
      success: true, 
      message: 'Comandas de la mesa eliminadas correctamente',
      deletedRows: result.affectedRows
    })

  } catch (error) {
    console.error('❌ Error eliminando comandas:', error)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}

