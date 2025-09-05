import { NextResponse } from 'next/server'
import { getProducts } from '../../../../lib/services/product-service'

export async function GET(req: Request) {
  try {
    console.log('🔍 Iniciando GET /api/products/public')
    const url = new URL(req.url)
    const businessId = url.searchParams.get('businessId')
    
    if (!businessId) {
      console.log('❌ businessId no proporcionado')
      return NextResponse.json({ error: 'businessId requerido' }, { status: 400 })
    }
    
    console.log('✅ Business ID:', businessId)
    const page = parseInt(url.searchParams.get('page') || '1')
    const pageSize = parseInt(url.searchParams.get('pageSize') || '20')
    
    console.log('📄 Página:', page, 'Tamaño:', pageSize)
    
    const result = await getProducts(Number(businessId), page, pageSize)
    console.log('✅ Productos obtenidos:', result.products?.length || 0)
    console.log('✅ Resultado completo:', JSON.stringify(result, null, 2))
    
    if (!result || !result.products) {
      return NextResponse.json({ 
        products: [], 
        total: 0,
        error: 'No se encontraron productos'
      })
    }
    
    return NextResponse.json(result)
  } catch (error) {
    console.error('❌ Error getting public products:', error);
    if (error instanceof Error) {
      console.error('Mensaje:', error.message);
      console.error('Stack:', error.stack);
    }
    return NextResponse.json({ 
      products: [],
      total: 0,
      error: error instanceof Error ? error.message : 'Error al obtener productos'
    }, { status: 500 })
  }
} 