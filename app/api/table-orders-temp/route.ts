import { NextRequest, NextResponse } from 'next/server'
import { executePosQuery } from '@/lib/database'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const mesaId = searchParams.get('mesa_id')
    const businessId = searchParams.get('business_id')

    if (!businessId) {
      return NextResponse.json({ 
        success: false, 
        message: 'business_id es requerido' 
      }, { status: 400 })
    }

    let query: string
    let params: any[]

    if (mesaId) {
      // Obtener pedidos temporales para una mesa específica
      query = `
        SELECT tot.*, p.name as product_name, p.image
        FROM table_orders_temp tot
        LEFT JOIN products p ON tot.product_id = p.id
        WHERE tot.mesa_id = ? AND tot.business_id = ? AND tot.status = 'pending'
        ORDER BY tot.created_at DESC
      `
      params = [mesaId, businessId]
    } else {
      // Obtener todos los pedidos temporales para el negocio
      query = `
        SELECT tot.*, p.name as product_name, p.image
        FROM table_orders_temp tot
        LEFT JOIN products p ON tot.product_id = p.id
        WHERE tot.business_id = ? AND tot.status = 'pending'
        ORDER BY tot.mesa_id, tot.created_at DESC
      `
      params = [businessId]
    }

    console.log('🔍 Ejecutando query:', query)
    console.log('🔍 Parámetros:', params)
    
    const results = await executePosQuery(query, params)
    console.log('🔍 Resultados:', results)

    return NextResponse.json({
      success: true,
      data: results
    })

  } catch (error) {
    console.error('Error fetching temp orders:', error)
    return NextResponse.json({ 
      success: false, 
      message: 'Error interno del servidor' 
    }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { mesa_id, business_id, items } = body

    if (!mesa_id || !business_id || !items || !Array.isArray(items)) {
      return NextResponse.json({ 
        success: false, 
        message: 'mesa_id, business_id e items son requeridos' 
      }, { status: 400 })
    }

    // Insertar cada producto como registro separado
    const insertPromises = items.map(async (item: any) => {
      const query = `
        INSERT INTO table_orders_temp (mesa_id, product_id, quantity, price, status, business_id)
        VALUES (?, ?, ?, ?, 'pending', ?)
      `
      return executePosQuery(query, [
        mesa_id,
        item.id,
        item.quantity,
        item.price,
        business_id
      ])
    })

    await Promise.all(insertPromises)

    return NextResponse.json({
      success: true,
      message: 'Pedido temporal guardado correctamente'
    })

  } catch (error) {
    console.error('Error saving temp order:', error)
    return NextResponse.json({ 
      success: false, 
      message: 'Error interno del servidor' 
    }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const mesaId = searchParams.get('mesa_id')
    const businessId = searchParams.get('business_id')

    if (!mesaId || !businessId) {
      return NextResponse.json({ 
        success: false, 
        message: 'mesa_id y business_id son requeridos' 
      }, { status: 400 })
    }

    // Eliminar pedidos temporales de la mesa
    const query = `DELETE FROM table_orders_temp WHERE mesa_id = ? AND business_id = ?`
    await executePosQuery(query, [mesaId, businessId])

    return NextResponse.json({
      success: true,
      message: 'Pedidos temporales eliminados correctamente'
    })

  } catch (error) {
    console.error('Error deleting temp orders:', error)
    return NextResponse.json({ 
      success: false, 
      message: 'Error interno del servidor' 
    }, { status: 500 })
  }
}
