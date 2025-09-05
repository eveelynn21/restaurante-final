import { NextResponse } from 'next/server'
import { executePosQuery } from '../../../lib/database'
import jwt from 'jsonwebtoken'

const JWT_SECRET = process.env.JWT_SECRET || 'supersecretkey'

// Función helper para verificar el token
function verifyToken(authHeader: string | null): { businessId: number } {
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new Error('Token requerido')
  }

  const token = authHeader.substring(7)
  const decoded = jwt.verify(token, JWT_SECRET) as { business_id: number }
  
  if (typeof decoded.business_id === 'undefined') {
    throw new Error('Token inválido: business_id no encontrado')
  }
  
  return { businessId: decoded.business_id }
}

export async function GET(req: Request) {
  try {
    const authHeader = req.headers.get('authorization')
    verifyToken(authHeader)

    const url = new URL(req.url)
    const locationId = url.searchParams.get('location_id')
    
    if (!locationId) {
      return NextResponse.json({ error: 'location_id requerido' }, { status: 400 })
    }

    const invoiceScheme = await executePosQuery(
      `SELECT is2.id, is2.prefix, is2.start_number, is2.invoice_count  
       FROM business_locations bl 
       JOIN invoice_schemes is2 ON bl.invoice_scheme_id = is2.id
       WHERE bl.id = ? AND type_document_id = 1`,
      [parseInt(locationId)]
    ) as Array<{ id: number; prefix: string; start_number: number; invoice_count: number }>

    if (invoiceScheme.length === 0) {
      return NextResponse.json({ error: 'No se encontró esquema de facturación para esta ubicación' }, { status: 404 })
    }

    const scheme = invoiceScheme[0]
    const nextNumber = scheme.start_number + scheme.invoice_count
    const fullInvoiceNumber = `${scheme.prefix}${nextNumber}`

    return NextResponse.json({
      scheme_id: scheme.id,
      prefix: scheme.prefix,
      next_number: nextNumber,
      full_invoice_number: fullInvoiceNumber,
      current_count: scheme.invoice_count
    })
  } catch (error) {
    console.error('Error getting invoice number:', error)
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : 'Error al obtener número de factura' 
    }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const authHeader = req.headers.get('authorization')
    verifyToken(authHeader)

    const { location_id } = await req.json()
    
    if (!location_id) {
      return NextResponse.json({ error: 'location_id requerido' }, { status: 400 })
    }

    // Incrementar el contador de facturas de manera atómica
    const result = await executePosQuery(
      `UPDATE invoice_schemes is2 
       JOIN business_locations bl ON bl.invoice_scheme_id = is2.id
       SET is2.invoice_count = is2.invoice_count + 1
       WHERE bl.id = ? AND is2.type_document_id = 1`,
      [location_id]
    )

    // Obtener el nuevo número
    const invoiceScheme = await executePosQuery(
      `SELECT is2.id, is2.prefix, is2.start_number, is2.invoice_count  
       FROM business_locations bl 
       JOIN invoice_schemes is2 ON bl.invoice_scheme_id = is2.id
       WHERE bl.id = ? AND type_document_id = 1`,
      [location_id]
    ) as Array<{ id: number; prefix: string; start_number: number; invoice_count: number }>

    if (invoiceScheme.length === 0) {
      return NextResponse.json({ error: 'Error al actualizar el número de factura' }, { status: 500 })
    }

    const scheme = invoiceScheme[0]
    const currentNumber = scheme.start_number + scheme.invoice_count - 1 // -1 porque ya se incrementó
    const fullInvoiceNumber = `${scheme.prefix}${currentNumber}`

    return NextResponse.json({
      success: true,
      reserved_number: currentNumber,
      full_invoice_number: fullInvoiceNumber,
      new_next_number: scheme.start_number + scheme.invoice_count
    })
  } catch (error) {
    console.error('Error reserving invoice number:', error)
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : 'Error al reservar número de factura' 
    }, { status: 500 })
  }
} 