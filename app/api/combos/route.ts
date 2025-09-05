import { NextResponse } from 'next/server'
import { executePosQuery } from '../../../lib/database'
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

export async function GET(req: Request) {
  try {
    const authHeader = req.headers.get('authorization')
    const { businessId } = verifyToken(authHeader)

    const url = new URL(req.url)
    const page = parseInt(url.searchParams.get('page') || '1')
    const pageSize = parseInt(url.searchParams.get('pageSize') || '20')

    const limitValue = Number.isInteger(Number(pageSize)) && Number(pageSize) > 0 ? Number(pageSize) : 20;
    const offsetValue = Number.isInteger(Number((page - 1) * limitValue)) && Number((page - 1) * limitValue) >= 0 ? Number((page - 1) * limitValue) : 0;

    const query = `
      SELECT 
        c.id, 
        c.name, 
        c.sku, 
        c.image, 
        c.description,
        c.tax,
        c.profit_percent,
        c.total_price_without_tax,
        c.total_price_with_tax,
        c.business_id,
        c.created_at,
        c.updated_at
      FROM combos c
      WHERE c.business_id = ?
      ORDER BY c.id DESC
      LIMIT ${limitValue} OFFSET ${offsetValue}
    `;

    const [combos, totalArr] = await Promise.all([
      executePosQuery(query, [businessId]) as Promise<any[]>,
      executePosQuery(
        `SELECT COUNT(*) as total FROM combos WHERE business_id = ?`,
        [businessId]
      ) as Promise<[{ total: number }]>
    ])

    const total = Array.isArray(totalArr) && totalArr.length > 0 ? totalArr[0].total : 0;

    // Obtener productos de cada combo
    const combosWithProducts = await Promise.all(
      combos.map(async (combo) => {
        const comboProductsQuery = `
          SELECT 
            cp.product_id,
            cp.quantity,
            cp.price_without_tax,
            p.name,
            p.sku
          FROM combo_products cp
          JOIN products p ON cp.product_id = p.id
          WHERE cp.combo_id = ?
        `
        const comboProducts = await executePosQuery(comboProductsQuery, [combo.id]) as any[]
        
        return {
          ...combo,
          products: comboProducts.map(cp => ({
            id: cp.product_id,
            name: cp.name,
            sku: cp.sku,
            price_without_tax: cp.price_without_tax,
            quantity: cp.quantity
          }))
        }
      })
    )

    return NextResponse.json({
      combos: combosWithProducts,
      total: total
    })
  } catch (error) {
    console.error('Error getting combos:', error)
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : 'Error al obtener combos' 
    }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const authHeader = req.headers.get('authorization')
    const { businessId, userId } = verifyToken(authHeader)

    const data = await req.json()
    
    if (!data.name || data.name.trim() === '') {
      return NextResponse.json({ error: 'El nombre del combo es requerido' }, { status: 400 })
    }
    
    if (!data.sku || data.sku.trim() === '') {
      return NextResponse.json({ error: 'El SKU del combo es requerido' }, { status: 400 })
    }

    if (!data.products || data.products.length === 0) {
      return NextResponse.json({ error: 'El combo debe tener al menos un producto' }, { status: 400 })
    }

    const connection = await executePosQuery('SELECT 1') // Obtener conexión
    
    try {
      // 1. Crear el combo
      const [comboResult] = await executePosQuery(
        `INSERT INTO combos (
          name, sku, image, description, tax, profit_percent, 
          total_price_without_tax, total_price_with_tax, business_id, created_by
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          data.name.trim(),
          data.sku.trim(),
          data.image || null,
          data.description || null,
          data.tax || null,
          data.profit_percent || 25,
          data.total_price_without_tax || 0,
          data.total_price_with_tax || 0,
          businessId,
          userId
        ]
      ) as any

      const comboId = comboResult.insertId

      // 2. Crear las relaciones con productos
      for (const product of data.products) {
        await executePosQuery(
          `INSERT INTO combo_products (
            combo_id, product_id, quantity, price_without_tax
          ) VALUES (?, ?, ?, ?)`,
          [
            comboId,
            product.id,
            product.quantity || 1,
            product.price_without_tax || 0
          ]
        )
      }

      return NextResponse.json({ success: true, comboId })
    } catch (error) {
      console.error('Error creating combo:', error)
      throw error
    }
  } catch (error) {
    console.error('Error creating combo:', error)
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : 'Error al crear combo' 
    }, { status: 500 })
  }
}

export async function PUT(req: Request) {
  try {
    const authHeader = req.headers.get('authorization')
    const { businessId, userId } = verifyToken(authHeader)

    const data = await req.json()
    
    if (!data.id) {
      return NextResponse.json({ error: 'ID de combo requerido' }, { status: 400 })
    }

    // 1. Actualizar el combo
    await executePosQuery(
      `UPDATE combos SET 
        name = ?, sku = ?, image = ?, description = ?, tax = ?, 
        profit_percent = ?, total_price_without_tax = ?, total_price_with_tax = ?,
        updated_by = ?, updated_at = NOW()
       WHERE id = ? AND business_id = ?`,
      [
        data.name,
        data.sku,
        data.image || null,
        data.description || null,
        data.tax || null,
        data.profit_percent || 25,
        data.total_price_without_tax || 0,
        data.total_price_with_tax || 0,
        userId,
        data.id,
        businessId
      ]
    )

    // 2. Eliminar productos existentes del combo
    await executePosQuery(
      `DELETE FROM combo_products WHERE combo_id = ?`,
      [data.id]
    )

    // 3. Agregar nuevos productos al combo
    for (const product of data.products) {
      await executePosQuery(
        `INSERT INTO combo_products (
          combo_id, product_id, quantity, price_without_tax
        ) VALUES (?, ?, ?, ?)`,
        [
          data.id,
          product.id,
          product.quantity || 1,
          product.price_without_tax || 0
        ]
      )
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error updating combo:', error)
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : 'Error al actualizar combo' 
    }, { status: 500 })
  }
}

export async function DELETE(req: Request) {
  try {
    const authHeader = req.headers.get('authorization')
    const { businessId } = verifyToken(authHeader)

    const url = new URL(req.url)
    const id = url.searchParams.get('id')
    
    if (!id) {
      return NextResponse.json({ error: 'ID de combo requerido' }, { status: 400 })
    }

    // Eliminar productos del combo
    await executePosQuery(
      `DELETE FROM combo_products WHERE combo_id = ?`,
      [id]
    )

    // Eliminar el combo
    await executePosQuery(
      `DELETE FROM combos WHERE id = ? AND business_id = ?`,
      [id, businessId]
    )

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting combo:', error)
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : 'Error al eliminar combo' 
    }, { status: 500 })
  }
} 