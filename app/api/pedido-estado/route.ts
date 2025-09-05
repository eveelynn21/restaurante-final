import { NextRequest, NextResponse } from 'next/server'
import { executePosQuery } from '../../../lib/database'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const mesaId = searchParams.get('mesa')

    if (!mesaId) {
      return NextResponse.json({ error: 'mesa es requerido' }, { status: 400 })
    }

    console.log('🔍 Buscando comandas para mesa:', mesaId)

    // Obtener todas las comandas para la mesa especificada
    const comandas = await executePosQuery(
      `SELECT 
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
        v.sell_price_inc_tax as price,
        p.image as product_image
      FROM comandas c
      LEFT JOIN products p ON c.product_id = p.id
      LEFT JOIN variations v ON p.id = v.product_id AND v.id = (SELECT MIN(id) FROM variations WHERE product_id = p.id)
      WHERE c.mesa_id = ? 
      ORDER BY c.id DESC`,
      [mesaId]
    ) as any[]

    console.log('🔍 Mesa buscada:', mesaId)
    console.log('🔍 Comandas encontradas (raw):', comandas)

    if (!comandas || comandas.length === 0) {
      return NextResponse.json({ 
        success: false, 
        message: 'No se encontraron comandas para esta mesa' 
      })
    }

    console.log('📋 Comandas encontradas:', comandas.length)

    // Agrupar productos por comanda y calcular totales
    let allItems: any[] = []
    let totalGeneral = 0
    let statusGeneral = 'pending'

    // Agrupar por comanda
    const comandasAgrupadas = comandas.reduce((acc, comanda) => {
      const comandaKey = comanda.id
      
      if (!acc[comandaKey]) {
        acc[comandaKey] = {
          id: comanda.id,
          mesa_id: comanda.mesa_id,
          area: comanda.area,
          items: [],
          total: 0,
          estado: comanda.estado,
          created_at: comanda.created_at,
          updated_at: comanda.updated_at
        }
      }

      // Agregar producto a la comanda
      acc[comandaKey].items.push({
        id: comanda.product_id,
        name: comanda.product_name,
        quantity: comanda.quantity,
        price: Math.round(comanda.price || 0),
        status: comanda.item_status || comanda.estado,
        image: comanda.product_image
      })

      acc[comandaKey].total += parseFloat(comanda.price || 0) * comanda.quantity

      return acc
    }, {})

    // Procesar todas las comandas
    Object.values(comandasAgrupadas).forEach((comanda: any) => {
      allItems = [...allItems, ...comanda.items]
      totalGeneral += comanda.total
      
      // Determinar estado general
      if (comanda.estado === 'preparando' || comanda.estado === 'listo') {
        statusGeneral = comanda.estado
      }
    })

    const comandaFormateada = {
      id: comandas[0].id, // ID de referencia
      items: allItems,
      total: totalGeneral,
      status: statusGeneral,
      createdAt: comandas[0].created_at,
      updatedAt: comandas[0].updated_at
    }

    console.log('✅ Comanda formateada:', {
      totalItems: allItems.length,
      totalGeneral: totalGeneral,
      statusGeneral: statusGeneral
    })

    return NextResponse.json({
      success: true,
      data: comandaFormateada
    })

  } catch (error) {
    console.error('❌ Error obteniendo pedido estado:', error)
    return NextResponse.json({ 
      error: 'Error interno del servidor' 
    }, { status: 500 })
  }
}
