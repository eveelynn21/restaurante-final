import { NextResponse } from 'next/server'
import { getProductsByBusinessId, getProductById } from '../../../lib/services/product-service'
import { executePosQuery } from '../../../lib/database'
import jwt from 'jsonwebtoken'
import { createProduct, updateProduct, deleteProduct, getProducts } from '../../../lib/services/product-service'

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
    console.log('🔍 GET /api/products - Iniciando')
    const authHeader = req.headers.get('authorization')
    const { businessId } = verifyToken(authHeader)
    console.log('🔑 Business ID:', businessId)

    const url = new URL(req.url)
    const page = parseInt(url.searchParams.get('page') || '1')
    const pageSize = parseInt(url.searchParams.get('pageSize') || '20')
    const search = url.searchParams.get('search')
    console.log('📋 Parámetros:', { page, pageSize, search })

    let result
    if (search) {
      console.log('🔍 Realizando búsqueda...')
      // Realizar búsqueda SOLO para el businessId del usuario
      const products = await executePosQuery(
        `SELECT p.*, v.sell_price_inc_tax, v.default_purchase_price, v.default_sell_price, v.dpp_inc_tax, v.profit_percent FROM products p 
         LEFT JOIN variations v ON p.id = v.product_id 
         WHERE p.business_id = ? AND (p.name LIKE ? OR p.sku LIKE ?)`,
        [businessId, `%${search}%`, `%${search}%`]
      ) as any[]
      console.log('📦 Productos encontrados (búsqueda):', products?.length || 0)
      result = {
        products: products.map(product => ({
          ...product,
          image: product.image && product.image.trim() !== '' ? product.image : '/placeholder.svg',
          default_purchase_price: product.default_purchase_price, // incluir explícitamente
          default_sell_price: product.default_sell_price, // incluir explícitamente
          dpp_inc_tax: product.dpp_inc_tax, // incluir explícitamente
          profit_percent: product.profit_percent // incluir explícitamente
        })),
        total: products.length
      }
    } else {
      console.log('📦 Obteniendo todos los productos...')
      const products = await executePosQuery(
        `SELECT p.*, v.sell_price_inc_tax, v.default_purchase_price, v.default_sell_price, v.dpp_inc_tax, v.profit_percent FROM products p 
         LEFT JOIN variations v ON p.id = v.product_id 
         WHERE p.business_id = ?`,
        [businessId]
      ) as any[]
      console.log('📦 Productos encontrados (todos):', products?.length || 0)
      console.log('📋 Primeros 3 productos:', products?.slice(0, 3))
      result = {
        products: products.map(product => ({
          ...product,
          image: product.image && product.image.trim() !== '' ? product.image : '/placeholder.svg',
          default_purchase_price: product.default_purchase_price, // incluir explícitamente
          default_sell_price: product.default_sell_price, // incluir explícitamente
          dpp_inc_tax: product.dpp_inc_tax, // incluir explícitamente
          profit_percent: product.profit_percent // incluir explícitamente
        })),
        total: products.length
      }
    }
    console.log('✅ Retornando resultado con', result.products?.length || 0, 'productos')
    return NextResponse.json(result)
  } catch (error) {
    console.error('Error getting products:', error)
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : 'Error al obtener productos' 
    }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const authHeader = req.headers.get('authorization')
    const { businessId, userId } = verifyToken(authHeader)

    const data = await req.json()
    console.log('📦 Datos recibidos en POST:', JSON.stringify(data, null, 2))
    console.log('🔍 Validación de campos:')
    console.log('  - name:', data.name, 'tipo:', typeof data.name)
    console.log('  - sku:', data.sku, 'tipo:', typeof data.sku)
    console.log('  - sell_price_inc_tax:', data.sell_price_inc_tax, 'tipo:', typeof data.sell_price_inc_tax)
    
    // Validación adicional
    if (!data.name || data.name.trim() === '') {
      console.error('❌ Error: Campo name está vacío o es null')
      return NextResponse.json({ error: 'El nombre del producto es requerido' }, { status: 400 })
    }
    
    if (!data.sku || data.sku.trim() === '') {
      console.error('❌ Error: Campo sku está vacío o es null')
      return NextResponse.json({ error: 'El SKU del producto es requerido' }, { status: 400 })
    }
    
    const productData = {
      name: data.name.trim(),
      sku: data.sku.trim(),
      sell_price_inc_tax: data.sell_price_inc_tax,
      default_sell_price: data.default_sell_price,
      profit_percent: data.profit_percent,
      default_purchase_price: data.default_purchase_price,
      dpp_inc_tax: data.dpp_inc_tax,
      image: data.image,
      product_description: data.product_description || null,
      business_id: businessId,
      created_by: userId,
      not_for_selling: 1,
      order_area_id: data.order_area_id || null,
      tax: data.tax || null,
      combo: data.combo || []
    }
    console.log('🔧 ProductData a guardar:', JSON.stringify(productData, null, 2))

    const productId = await createProduct(productData)
    return NextResponse.json({ success: true, productId })
  } catch (error) {
    console.error('Error creating product:', error)
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : 'Error al crear producto' 
    }, { status: 500 })
  }
}

export async function PUT(req: Request) {
  try {
    const authHeader = req.headers.get('authorization')
    const { businessId, userId } = verifyToken(authHeader)

    const data = await req.json()
    console.log('📦 Datos recibidos en PUT:', JSON.stringify(data, null, 2))
    if (!data.id) {
      return NextResponse.json({ error: 'ID de producto requerido' }, { status: 400 })
    }

    const productData = {
      name: data.name,
      sku: data.sku,
      sell_price_inc_tax: data.sell_price_inc_tax,
      default_sell_price: data.default_sell_price,
      profit_percent: data.profit_percent,
      default_purchase_price: data.default_purchase_price,
      dpp_inc_tax: data.dpp_inc_tax,
      image: data.image,
      product_description: data.product_description,
      order_area_id: data.order_area_id || null,
      tax: data.tax || null,
      combo: data.combo || []
    }
    console.log('🔧 ProductData a actualizar:', JSON.stringify(productData, null, 2))

    await updateProduct(data.id, productData)
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error updating product:', error)
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : 'Error al actualizar producto' 
    }, { status: 500 })
  }
}

export async function DELETE(req: Request) {
  try {
    const authHeader = req.headers.get('authorization')
    verifyToken(authHeader)

    const url = new URL(req.url)
    const id = url.searchParams.get('id')
    
    if (!id) {
      return NextResponse.json({ error: 'ID de producto requerido' }, { status: 400 })
    }

    await deleteProduct(parseInt(id))
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting product:', error)
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : 'Error al eliminar producto' 
    }, { status: 500 })
  }
}

// Endpoint público para obtener productos por businessId
export async function GET_PUBLIC(req: Request) {
  try {
    const url = new URL(req.url)
    const businessId = url.searchParams.get('businessId')
    if (!businessId) {
      return NextResponse.json({ error: 'businessId requerido' }, { status: 400 })
    }
    const page = parseInt(url.searchParams.get('page') || '1')
    const pageSize = parseInt(url.searchParams.get('pageSize') || '20')
    const result = await getProducts(Number(businessId), page, pageSize)
    return NextResponse.json(result)
  } catch (error) {
    console.error('Error getting public products:', error)
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Error al obtener productos' }, { status: 500 })
  }
} 