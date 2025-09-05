import { NextResponse } from 'next/server'
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

export async function PUT(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const authHeader = req.headers.get('authorization')
    const { businessId } = verifyToken(authHeader)
    const transactionId = parseInt(params.id)

    if (isNaN(transactionId)) {
      return NextResponse.json({ error: 'ID de transacción inválido' }, { status: 400 })
    }

    const { 
      invoice_no, 
      final_total, 
      status, 
      payment_status,
      transaction_date,
      items 
    } = await req.json()

    // Verificar que la transacción pertenece al negocio
    const existingTransaction = await executePosQuery(
      'SELECT * FROM transactions WHERE id = ? AND business_id = ?',
      [transactionId, businessId]
    ) as any[]

    if (!existingTransaction || existingTransaction.length === 0) {
      return NextResponse.json({ error: 'Transacción no encontrada' }, { status: 404 })
    }

    // Actualizar la transacción
    const updateFields = []
    const updateValues = []

    if (invoice_no !== undefined) {
      updateFields.push('invoice_no = ?')
      updateValues.push(invoice_no)
    }

    if (final_total !== undefined) {
      updateFields.push('final_total = ?')
      updateValues.push(final_total)
    }

    if (status !== undefined) {
      updateFields.push('status = ?')
      updateValues.push(status)
    }

    if (payment_status !== undefined) {
      updateFields.push('payment_status = ?')
      updateValues.push(payment_status)
    }

    if (transaction_date !== undefined) {
      updateFields.push('transaction_date = ?')
      updateValues.push(transaction_date)
    }

    // Agregar updated_at
    updateFields.push('updated_at = NOW()')
    updateValues.push(transactionId)

    if (updateFields.length === 0) {
      return NextResponse.json({ error: 'No hay campos para actualizar' }, { status: 400 })
    }

    const query = `UPDATE transactions SET ${updateFields.join(', ')} WHERE id = ?`
    
    await executePosQuery(query, updateValues)

    // Si hay items para actualizar, eliminar los existentes y agregar los nuevos
    if (Array.isArray(items) && items.length > 0) {
      // Eliminar items existentes
      await executePosQuery(
        'DELETE FROM transaction_sell_lines WHERE transaction_id = ?',
        [transactionId]
      )

      // Agregar nuevos items
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
            if (cleanCombo && cleanCombo !== 'null' && cleanCombo !== 'NULL' && cleanCombo !== '[]') {
              // Si no tiene corchetes, agregarlos para hacer un JSON válido
              const jsonString = cleanCombo.startsWith('[') ? cleanCombo : `[${cleanCombo}]`
              comboProductIds = JSON.parse(jsonString)
            }
          } catch (error) {
            console.warn('Error parsing combo JSON for product', item.id, ':', error)
            comboProductIds = null
          }
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
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())` ,
                [
                  transactionId,
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
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())` ,
            [
              transactionId,
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
            ]
          )
        }
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Transacción actualizada exitosamente',
      id: transactionId
    })

  } catch (error) {
    console.error('Error updating transaction:', error)
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : 'Error al actualizar transacción' 
    }, { status: 500 })
  }
} 