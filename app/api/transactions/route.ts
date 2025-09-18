import { NextResponse } from 'next/server'
import { executePosQuery } from '../../../lib/database'
import jwt from 'jsonwebtoken'
import type { RowDataPacket } from 'mysql2'

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

export async function POST(req: Request) {
  try {
    const authHeader = req.headers.get('authorization')
    const { businessId, userId } = verifyToken(authHeader)

    const { 
      location_id, 
      contact_id, 
      invoice_number, 
      prefix, 
      final_total, 
      res_table_id,
      items = []
    } = await req.json()
    
    // Obtener el porcentaje de propina de la ubicación
    const locationInfo = await executePosQuery(
      'SELECT propina FROM business_locations WHERE id = ?',
      [location_id]
    ) as any[]
    
    const propinaPorcentaje = locationInfo[0]?.propina || 0
    const propinaMonto = +(final_total * (propinaPorcentaje / 100)).toFixed(2)
    const totalConPropina = +(final_total + propinaMonto).toFixed(2)
    
    console.log('💰 Propina calculada:', { propinaPorcentaje, propinaMonto, totalConPropina })
    
    console.log('📝 Datos recibidos:', { location_id, contact_id, invoice_number, prefix, final_total, businessId, userId })
    
    if (!location_id || !contact_id || invoice_number === undefined || !prefix || final_total === undefined) {
      return NextResponse.json({ 
        error: 'Faltan campos requeridos: location_id, contact_id, invoice_number, prefix, final_total' 
      }, { status: 400 })
    }

    // Crear la factura concatenando prefix + number
    const invoice_no = `${prefix}${invoice_number}`
    
    // Fecha y hora actual de Bogotá, Colombia (UTC-5)
    const bogotaTime = new Date(new Date().getTime() - (5 * 60 * 60 * 1000))
    const transaction_date = bogotaTime.toISOString().slice(0, 19).replace('T', ' ')
    const created_at = transaction_date
    const updated_at = transaction_date

    console.log('💾 Datos a insertar:', {
      businessId,
      location_id,
      contact_id,
      invoice_number,
      invoice_no,
      transaction_date,
      final_total,
      userId
    })

    // Insertar en la tabla transactions con campos básicos primero
    console.log('🔄 Ejecutando INSERT...')
    
    const result = await executePosQuery(
      `INSERT INTO transactions (
        business_id,
        location_id,
        type,
        status,
        payment_status,
        contact_id,
        number,
        invoice_no,
        transaction_date,
        final_total,
        created_by,
        created_at,
        updated_at,
        resolution,
        prefix,
        res_table_id,
        essentials_duration
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        businessId,           // business_id
        location_id,          // location_id
        'sell',               // type
        'final',              // status
        'paid',               // payment_status
        contact_id,           // contact_id
        invoice_number,       // number
        invoice_no,           // invoice_no (prefix + number)
        transaction_date,     // transaction_date (hora Bogotá)
        totalConPropina,      // final_total (ya incluye propina)
        userId,               // created_by
        created_at,           // created_at (hora Bogotá)
        updated_at,           // updated_at (hora Bogotá)
        'POSE',               // resolution (prefijo del POS)
        'POSE',               // prefix (prefijo del POS)
        res_table_id || null, // res_table_id (id de la mesa)
        0                     // essentials_duration
      ]
    ) as any
    
    console.log('✅ INSERT exitoso, result:', result)

    // Guardar líneas de productos en transaction_sell_lines
    if (Array.isArray(items) && items.length > 0) {
      let comboSequence: { [key: string]: number } = {} // Track combo instances per combo product
      
      for (const item of items) {
        // Verificar si el producto es un combo
        const productInfo = await executePosQuery(
          'SELECT combo FROM products WHERE id = ?',
          [item.id]
        ) as any[]
        
        const product = productInfo[0]
        let comboProductIds = null
        if (product && product.combo) {
          try {
            // Limpiar el string antes de parsear, pero mantener los corchetes del JSON
            const cleanCombo = String(product.combo).trim()
            console.log('🔍 Product ID:', item.id, 'Combo field:', product.combo, 'Clean combo:', cleanCombo)
            if (cleanCombo && cleanCombo !== 'null' && cleanCombo !== 'NULL' && cleanCombo !== '[]') {
              // Si no tiene corchetes, agregarlos para hacer un JSON válido
              const jsonString = cleanCombo.startsWith('[') ? cleanCombo : `[${cleanCombo}]`
              comboProductIds = JSON.parse(jsonString)
              console.log('✅ Combo detected for product', item.id, 'with products:', comboProductIds)
            } else {
              console.log('❌ Not a combo for product', item.id, 'cleanCombo:', cleanCombo)
            }
          } catch (error) {
            console.warn('Error parsing combo JSON for product', item.id, ':', error)
            comboProductIds = null
          }
        } else {
          console.log('❌ No combo field for product', item.id)
        }
        
        if (comboProductIds && Array.isArray(comboProductIds) && comboProductIds.length > 0) {
          // Generate combo_group_id for this combo instance
          if (!comboSequence[item.id]) {
            comboSequence[item.id] = 0
          }
          comboSequence[item.id]++
          const comboGroupId = `combo_${item.id}_${comboSequence[item.id]}`
          
          // Es un combo - insertar cada producto individual
          for (const comboProductId of comboProductIds) {
            // Buscar información del producto individual del combo
            const comboProductInfo = await executePosQuery(
              'SELECT * FROM products WHERE id = ?',
              [comboProductId]
            ) as any[]
            
            if (comboProductInfo.length > 0) {
              const comboProduct = comboProductInfo[0]
              
              // Buscar el variation_id correspondiente al product_id
              const variations = await executePosQuery(
                'SELECT * FROM variations WHERE product_id = ?',
                [comboProductId]
              ) as any[]
              const variation = Array.isArray(variations) && variations.length > 0 ? variations[0] : null
              const variation_id = variation ? variation.id : null

              // Calcular precios e impuestos para el producto individual
              const quantity = item.quantity // Usar la cantidad del combo
              const unit_price_inc_tax = variation ? variation.sell_price_inc_tax : 0
              const tax_percent = variation && variation.tax_percent ? parseFloat(variation.tax_percent) : 19
              const unit_price = +(unit_price_inc_tax / (1 + tax_percent / 100)).toFixed(2)
              const unit_price_before_discount = unit_price
              const item_tax = +((unit_price_inc_tax - unit_price) * quantity).toFixed(2)

              await executePosQuery(
                `INSERT INTO transaction_sell_lines (
                  transaction_id,
                  product_id,
                  variation_id,
                  quantity,
                  unit_price,
                  unit_price_before_discount,
                  unit_price_inc_tax,
                  item_tax,
                  item_tax2,
                  tax2_id,
                  combo_group_id,
                  created_at,
                  updated_at
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)` ,
                [
                  result.insertId,
                  comboProductId,
                  variation_id,
                  quantity,
                  unit_price,
                  unit_price_before_discount,
                  unit_price_inc_tax,
                  item_tax,
                  0, // item_tax2
                  null, // tax2_id
                  comboGroupId, // combo_group_id
                  created_at,
                  updated_at
                ]
              )
            }
          }
        } else {
          // No es un combo - insertar normalmente
          // Buscar el variation_id correspondiente al product_id
          const variations = await executePosQuery(
            'SELECT * FROM variations WHERE product_id = ?',
            [item.id]
          ) as any[]
          const variation = Array.isArray(variations) && variations.length > 0 ? variations[0] : null
          const variation_id = variation ? variation.id : null

          // Calcular precios e impuestos
          const quantity = item.quantity
          const unit_price_inc_tax = item.price
          // Suponiendo que el impuesto es 19% si no hay info en variation
          const tax_percent = variation && variation.tax_percent ? parseFloat(variation.tax_percent) : 19
          const unit_price = +(unit_price_inc_tax / (1 + tax_percent / 100)).toFixed(2)
          const unit_price_before_discount = unit_price
          const item_tax = +((unit_price_inc_tax - unit_price) * quantity).toFixed(2)

          await executePosQuery(
            `INSERT INTO transaction_sell_lines (
              transaction_id,
              product_id,
              variation_id,
              quantity,
              unit_price,
              unit_price_before_discount,
              unit_price_inc_tax,
              item_tax,
              item_tax2,
              tax2_id,
              combo_group_id,
              created_at,
              updated_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)` ,
            [
              result.insertId,
              item.id,
              variation_id,
              quantity,
              unit_price,
              unit_price_before_discount,
              unit_price_inc_tax,
              item_tax,
              0, // item_tax2
              null, // tax2_id
              null, // combo_group_id (null for non-combo products)
              created_at,
              updated_at
            ]
          )
        }
      }
    }

    return NextResponse.json({
      success: true,
      transaction_id: result.insertId,
      invoice_no: invoice_no,
      transaction_date: transaction_date,
      propina: {
        porcentaje: propinaPorcentaje,
        monto: propinaMonto,
        total_con_propina: totalConPropina
      }
    })
  } catch (error) {
    console.error('Error creating transaction:', error)
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : 'Error al crear transacción' 
    }, { status: 500 })
  }
} 

export async function GET(req: Request) {
  try {
    console.log('🔍 Iniciando GET /api/transactions')
    const authHeader = req.headers.get('authorization')
    console.log('🔑 Auth header:', authHeader ? 'Presente' : 'Ausente')
    
    const { businessId } = verifyToken(authHeader)
    console.log('✅ Token verificado, businessId:', businessId)

    // Paso 1: Contar el total de facturas
    const totalResult = await executePosQuery(
      `SELECT COUNT(*) as total FROM transactions WHERE business_id = ?`,
      [businessId]
    ) as any[]
    
    const total = totalResult[0]?.total || 0
    console.log('📊 Total de facturas en BD:', total)

    // Paso 2: Obtener parámetros de paginación
    const url = new URL(req.url)
    const page = parseInt(url.searchParams.get('page') || '1')
    const limit = parseInt(url.searchParams.get('limit') || '100')
    const offset = (page - 1) * limit
    
    console.log('📄 Parámetros de paginación:', { page, limit, offset })

    // Obtener transacciones con paginación
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
        c.name as contact_name,
        c.supplier_business_name
      FROM transactions t
      LEFT JOIN contacts c ON t.contact_id = c.id
      WHERE t.business_id = ?
      ORDER BY t.created_at DESC
      LIMIT ${limit} OFFSET ${offset}`,
      [businessId]
    ) as any[]

    console.log('✅ Transacciones obtenidas:', transactions?.length || 0)

    return NextResponse.json({
      success: true,
      transactions: transactions || [],
      total: total,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasNextPage: page < Math.ceil(total / limit),
        hasPrevPage: page > 1
      }
    })
  } catch (error) {
    console.error('❌ Error fetching transactions:', error)
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : 'Error al obtener transacciones' 
    }, { status: 500 })
  }
} 