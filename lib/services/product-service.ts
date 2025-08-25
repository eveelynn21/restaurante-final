import { executePosQuery, posPool } from '../database'
import mysql from 'mysql2/promise'

export interface Product {
  id?: number
  name: string
  sku: string
  sell_price_inc_tax: number
  default_sell_price?: number // Precio sin impuesto
  default_purchase_price?: number // Precio de compra sin impuesto
  dpp_inc_tax?: number // Precio de compra con impuesto
  profit_percent?: number // Margen de ganancia
  image: string | null
  product_description: string | null
  business_id: number
  created_by?: number
  not_for_selling: number
  order_area_id?: number | null
  combo?: number[] | null // Array de IDs de productos que forman el combo
}

interface ProductQueryResult {
  products: Product[]
  total: number
}

// Función helper para manejar errores de autenticación
function handleAuthError(error: any): never {
  console.error('❌ Error de autenticación:', error)
  throw new Error('Error de autenticación')
}

export async function getProducts(businessId: number, page: number = 1, pageSize: number = 20): Promise<ProductQueryResult> {
  try {
    console.log('🔍 getProducts - BusinessId:', businessId, 'Page:', page, 'PageSize:', pageSize)
    
    if (!businessId || businessId <= 0) {
      throw new Error('businessId inválido')
    }
    
    const limitValue = Number.isInteger(Number(pageSize)) && Number(pageSize) > 0 ? Number(pageSize) : 20;
    const offsetValue = Number.isInteger(Number((page - 1) * limitValue)) && Number((page - 1) * limitValue) >= 0 ? Number((page - 1) * limitValue) : 0;
  
  const query = `
    SELECT 
         p.id, 
         p.name, 
         p.sku, 
         p.category_id, 
         COALESCE(c.name, 'Sin categoría') as category_name,
         COALESCE(v.sell_price_inc_tax, 0) as sell_price_inc_tax,
         0 as tax_percent,
         COALESCE(v.sell_price_inc_tax, 0) as default_sell_price,
         p.image, 
         p.product_description, 
         p.business_id, 
         p.not_for_selling, 
         p.order_area_id,
         p.combo
       FROM products p
       LEFT JOIN variations v ON p.id = v.product_id
       LEFT JOIN categories c ON p.category_id = c.id
       WHERE p.business_id = ?
       ORDER BY p.id DESC
       LIMIT ${limitValue} OFFSET ${offsetValue}
  `;
  
  console.log('🔍 Query SQL:', query);
  console.log('🔍 Parámetros:', [businessId, limitValue, offsetValue]);
  
  // Primero probar una consulta simple para verificar que hay productos
  const simpleQuery = `SELECT COUNT(*) as total FROM products WHERE business_id = ?`;
  const simpleResult = await executePosQuery(simpleQuery, [businessId]) as any[];
  console.log('🔍 Consulta simple - Total productos:', simpleResult[0]?.total);
  
  console.log('🔍 Query SQL:', query);
  console.log('🔍 Parámetros:', [businessId, limitValue, offsetValue]);

  console.log('🔍 Ejecutando consulta con businessId:', businessId)
  
  let products: any[] = []
  let total = 0
  
  try {
    console.log('🔍 Antes de ejecutar consultas...')
    
    // Probar conexión simple primero
    const simpleQuery = `SELECT COUNT(*) as total FROM products WHERE business_id = ?`;
    console.log('🔍 Ejecutando consulta simple:', simpleQuery, 'con businessId:', businessId);
    const simpleResult = await executePosQuery(simpleQuery, [businessId]) as any[];
    console.log('🔍 Resultado consulta simple:', simpleResult);
    
    const [productsResult, totalArr] = await Promise.all([
      executePosQuery(query, [businessId]) as Promise<Product[]>,
      executePosQuery(
        `SELECT COUNT(p.id) as total
         FROM products p
         WHERE p.business_id = ?`,
        [businessId]
      ) as Promise<[{ total: number }]>
    ])
    
    products = Array.isArray(productsResult) ? productsResult : []
    total = Array.isArray(totalArr) && totalArr.length > 0 ? totalArr[0].total : 0;
    
    console.log('✅ Productos obtenidos de DB:', products?.length || 0);
    console.log('✅ Total de productos:', total);
    console.log('✅ Primer producto (si existe):', products?.[0]);
    console.log('✅ Todos los productos:', JSON.stringify(products, null, 2));
  } catch (dbError) {
    console.error('❌ Error en consulta DB:', dbError)
    products = []
    total = 0
  }

  return { 
    products: products.map(product => ({
      ...product,
      image: product.image && product.image.trim() !== '' ? product.image : '/placeholder.svg',
      sell_price_inc_tax: Number(product.sell_price_inc_tax) || 0,
      default_sell_price: Number((product as any).default_sell_price) || 0,
      category_id: (product as any).category_id ?? null,
      category_name: (product as any).category_name ?? 'Sin categoría',
      order_area_id: product.order_area_id ?? null,
      combo: (product as any).combo && typeof (product as any).combo === 'string' && (product as any).combo.trim() !== '' ? 
        (() => {
          try {
            return JSON.parse((product as any).combo)
          } catch (e) {
            console.log('Error parsing combo for product:', product.id, 'combo value:', (product as any).combo)
            return null
          }
        })() : null
    })),
    total: total || 0 
  }
  } catch (error) {
    console.error('❌ Error en getProducts:', error)
    console.error('❌ Stack trace:', error instanceof Error ? error.stack : 'No stack trace')
    return { 
      products: [], 
      total: 0 
    }
  }
}

export async function getProductsByBusinessId(businessId: number, limit = 20, offset = 0): Promise<Product[]> {
  try {
    const query = `
      SELECT DISTINCT 
        p.id, 
        p.name, 
        p.sku, 
        v.sell_price_inc_tax,
        0 as tax_percent,
        COALESCE(v.sell_price_inc_tax, 0) as default_sell_price,
        p.image, 
        p.product_description, 
        p.business_id, 
        p.not_for_selling, 
        p.order_area_id,
        p.combo
      FROM products p
      LEFT JOIN variations v ON p.id = v.product_id
      WHERE p.business_id = ?
        AND p.not_for_selling = 1
        AND p.is_inactive = 0
      ORDER BY p.id DESC
      LIMIT ? OFFSET ?
    `
    console.log('🔍 Ejecutando query:', query)
    console.log('📊 Parámetros:', [businessId, limit, offset])
    
    const rows = await executePosQuery(query, [businessId, limit, offset]) as any[]
    console.log('📦 Resultados crudos:', JSON.stringify(rows, null, 2))
    
    const mappedProducts = rows.map(row => ({
      id: row.id,
      name: row.name || 'Sin nombre',
      sku: row.sku || 'SIN-SKU',
      sell_price_inc_tax: parseFloat(row.sell_price_inc_tax) || 0,
      default_sell_price: parseFloat(row.default_sell_price) || 0,
      image: row.image && row.image.trim() !== '' ? row.image : '/placeholder.svg',
      product_description: row.product_description || null,
      business_id: row.business_id,
      not_for_selling: row.not_for_selling,
      order_area_id: row.order_area_id ?? null,
      combo: row.combo ? JSON.parse(row.combo) : null
    }))
    
    console.log('✅ Total productos:', mappedProducts.length)
    return mappedProducts
  } catch (error) {
    console.error('❌ Error obteniendo productos:', error)
    return []
  }
}

export async function createProduct(data: Omit<Product, 'id'>) {
  // Validación de datos antes de proceder
  console.log('🔍 Validación en createProduct:')
  console.log('  - name:', data.name, 'tipo:', typeof data.name, 'longitud:', data.name?.length)
  console.log('  - sku:', data.sku, 'tipo:', typeof data.sku)
  console.log('  - business_id:', data.business_id, 'tipo:', typeof data.business_id)
  console.log('  - created_by:', data.created_by, 'tipo:', typeof data.created_by)
  
  if (!data.name || data.name.trim() === '') {
    throw new Error('El nombre del producto es requerido')
  }
  
  if (!data.sku || data.sku.trim() === '') {
    throw new Error('El SKU del producto es requerido')
  }
  
  if (!data.business_id) {
    throw new Error('El business_id es requerido')
  }
  
  if (!data.created_by) {
    throw new Error('El created_by es requerido')
  }
  
  const connection = await posPool.getConnection()
  
  try {
    await connection.beginTransaction()

    // 1. Crear el producto base
    console.log('🔧 Ejecutando INSERT con order_area_id:', data.order_area_id)
    console.log('🔍 Valores a insertar:')
    console.log('  - name:', data.name)
    console.log('  - sku:', data.sku)
    console.log('  - image:', data.image)
    console.log('  - product_description:', data.product_description)
    console.log('  - business_id:', data.business_id)
    console.log('  - created_by:', data.created_by)
    console.log('  - not_for_selling:', data.not_for_selling)
    console.log('  - order_area_id:', data.order_area_id)
    
    const [productResult] = await connection.execute(
      `INSERT INTO products (name, sku, image, product_description, business_id, created_by, not_for_selling, order_area_id, tax, combo)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [data.name, data.sku, data.image, data.product_description, data.business_id, data.created_by, data.not_for_selling, data.order_area_id, data.tax, data.combo ? JSON.stringify(data.combo) : '[]']
    ) as any

    const productId = productResult.insertId

    // 2. Crear una entrada en product_variations (dummy)
    const [pvResult] = await connection.execute(
      `INSERT INTO product_variations (product_id, name, is_dummy)
       VALUES (?, 'DUMMY', 1)`,
      [productId]
    ) as any

    const pvId = pvResult.insertId

    // 3. Crear la variación
    await connection.execute(
      `INSERT INTO variations (product_id, product_variation_id, name, sell_price_inc_tax, default_sell_price, profit_percent, default_purchase_price, dpp_inc_tax)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [productId, pvId, data.name, data.sell_price_inc_tax, data.default_sell_price || 0, data.profit_percent || 0, data.default_purchase_price || 0, data.dpp_inc_tax || 0]
    )

    await connection.commit()
    return productId
  } catch (error) {
    await connection.rollback()
    throw error
  } finally {
    connection.release()
  }
}

export async function updateProduct(id: number, data: Partial<Product>) {
  // Se refactoriza para usar el helper executePosQuery que gestiona la conexión
  // de forma más robusta, eliminando la gestión manual de transacciones que causaba el error.

    // 1. Actualizar el producto base
    console.log('🔧 Ejecutando UPDATE con order_area_id:', data.order_area_id)
  await executePosQuery(
      `UPDATE products 
       SET name = COALESCE(?, name),
           sku = COALESCE(?, sku),
           image = COALESCE(?, image),
         product_description = COALESCE(?, product_description),
         not_for_selling = COALESCE(?, not_for_selling),
         order_area_id = COALESCE(?, order_area_id),
         tax = COALESCE(?, tax),
         combo = COALESCE(?, combo)
       WHERE id = ?`,
    [
      data.name ?? null, 
      data.sku ?? null, 
      data.image ?? null, 
      data.product_description ?? null, 
      data.not_for_selling ?? null, 
      data.order_area_id ?? null,
      data.tax ?? null,
      data.combo ? JSON.stringify(data.combo) : '[]',
      id
    ]
    )

    // 2. Actualizar la variación con todos los campos de precio
    await executePosQuery(
      `UPDATE variations 
       SET sell_price_inc_tax = COALESCE(?, sell_price_inc_tax),
           default_sell_price = COALESCE(?, default_sell_price),
           profit_percent = COALESCE(?, profit_percent),
           default_purchase_price = COALESCE(?, default_purchase_price),
           dpp_inc_tax = COALESCE(?, dpp_inc_tax)
       WHERE product_id = ?`,
      [data.sell_price_inc_tax, data.default_sell_price, data.profit_percent, data.default_purchase_price, data.dpp_inc_tax, id]
    )
    return true
}

export async function deleteProduct(id: number) {
  const connection = await posPool.getConnection()
  
  try {
    await connection.beginTransaction()

    // 1. Eliminar las variaciones
    await connection.execute(
      `DELETE v FROM variations v
       JOIN product_variations pv ON pv.id = v.product_variation_id
       WHERE v.product_id = ?`,
      [id]
    )

    // 2. Eliminar las entradas de product_variations
    await connection.execute(
      `DELETE FROM product_variations WHERE product_id = ?`,
      [id]
    )

    // 3. Eliminar el producto
    await connection.execute(
      `DELETE FROM products WHERE id = ?`,
      [id]
    )

    await connection.commit()
    return true
  } catch (error) {
    await connection.rollback()
    throw error
  } finally {
    connection.release()
  }
}

export async function getProductById(id: number): Promise<Product | null> {
  const products = await executePosQuery('SELECT * FROM products WHERE id = ?', [id]) as Product[]
  return products[0] || null
} 