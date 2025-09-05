import { NextResponse } from 'next/server'
import { executePosQuery } from '../../../../../lib/database'
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

export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    console.log('🔍 GET /api/transactions/[id]/items - Iniciando')
    console.log('📋 Parámetros:', params)
    
    const authHeader = req.headers.get('authorization')
    const { businessId } = verifyToken(authHeader)
    const transactionId = parseInt(params.id)

    console.log('🔑 Business ID:', businessId)
    console.log('🆔 Transaction ID:', transactionId)

    if (isNaN(transactionId)) {
      console.error('❌ ID de transacción inválido:', params.id)
      return NextResponse.json({ error: 'ID de transacción inválido' }, { status: 400 })
    }

    // Verificar que la transacción pertenece al negocio
    console.log('🔍 Verificando transacción en base de datos...')
    const existingTransaction = await executePosQuery(
      'SELECT * FROM transactions WHERE id = ? AND business_id = ?',
      [transactionId, businessId]
    ) as any[]

    console.log('📊 Transacción encontrada:', existingTransaction?.length || 0, 'registros')

    if (!existingTransaction || existingTransaction.length === 0) {
      console.error('❌ Transacción no encontrada')
      return NextResponse.json({ error: 'Transacción no encontrada' }, { status: 404 })
    }

    // Obtener los items de la transacción
    console.log('🔍 Obteniendo items de la transacción...')
    const items = await executePosQuery(
      `SELECT 
        tsl.transaction_id,
        tsl.product_id,
        tsl.variation_id,
        tsl.quantity,
        tsl.unit_price,
        tsl.unit_price_inc_tax,
        tsl.item_tax,
        tsl.combo_group_id,
        p.name as product_name,
        p.sku,
        p.image,
        p.combo
      FROM transaction_sell_lines tsl
      LEFT JOIN products p ON tsl.product_id = p.id
      WHERE tsl.transaction_id = ?
      ORDER BY tsl.combo_group_id, tsl.id`,
      [transactionId]
    ) as any[]

    console.log('📦 Items encontrados:', items?.length || 0, 'productos')
    console.log('📋 Items:', items)

    // Agrupar items por combo_group_id
    const groupedItems = []
    const comboGroups = new Map()
    const individualItems = []

    for (const item of items) {
      if (item.combo_group_id) {
        // Es parte de un combo
        if (!comboGroups.has(item.combo_group_id)) {
          comboGroups.set(item.combo_group_id, [])
        }
        comboGroups.get(item.combo_group_id).push(item)
      } else {
        // Es un producto individual
        individualItems.push(item)
      }
    }

    // Procesar combos agrupados
    for (const [comboGroupId, comboItems] of comboGroups) {
      // Extraer info del combo_group_id: combo_100_1
      const match = comboGroupId.match(/^combo_(\d+)_(\d+)$/)
      if (match) {
        const comboProductId = parseInt(match[1])
        const comboSequence = parseInt(match[2])
        
        // Obtener información del producto combo principal
        const comboProductInfo = await executePosQuery(
          'SELECT * FROM products WHERE id = ?',
          [comboProductId]
        ) as any[]
        
        if (comboProductInfo.length > 0) {
          const comboProduct = comboProductInfo[0]
          
          // Calcular el precio total del combo basado en sus componentes
          const totalComboPrice = comboItems.reduce((sum: number, item: any) => sum + (item.unit_price_inc_tax * item.quantity), 0)
          
          groupedItems.push({
            product_id: comboProductId,
            product_name: comboProduct.name,
            sku: comboProduct.sku,
            image: comboProduct.image,
            quantity: comboItems[0].quantity, // Todos los items del combo tienen la misma cantidad
            unit_price_inc_tax: totalComboPrice / comboItems[0].quantity,
            is_combo: true,
            combo_group_id: comboGroupId,
            combo_products: comboItems.map((item: any) => ({
              product_id: item.product_id,
              product_name: item.product_name,
              sku: item.sku,
              quantity: item.quantity,
              unit_price_inc_tax: item.unit_price_inc_tax
            }))
          })
        }
      }
    }

    // Agregar productos individuales
    for (const item of individualItems) {
      groupedItems.push({
        ...item,
        is_combo: false,
        combo_products: []
      })
    }

    console.log('📦 Items agrupados:', groupedItems?.length || 0)

    return NextResponse.json(groupedItems)

  } catch (error) {
    console.error('❌ Error fetching transaction items:', error)
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : 'Error al obtener items de la transacción' 
    }, { status: 500 })
  }
} 