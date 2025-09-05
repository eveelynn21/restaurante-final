import { NextResponse } from 'next/server'
import { executePosQuery } from '../../../lib/database'
import jwt from 'jsonwebtoken'

const JWT_SECRET = process.env.JWT_SECRET || 'supersecretkey'

// Función helper para verificar el token y obtener business_id y user_id
function verifyToken(authHeader: string | null): { businessId: number; userId: number } {
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new Error('Token de autenticación requerido')
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
    const isDefault = url.searchParams.get('default') === '1'
    let query = `
      SELECT 
        c.id,
        COALESCE(NULLIF(TRIM(c.name), ''), c.supplier_business_name) as name,
        c.supplier_business_name, 
        c.contact_id 
      FROM contacts c 
      WHERE c.business_id = ?
    `
    if (isDefault) {
      query += ' AND c.is_default = 1'
    }
    const clients = await executePosQuery(query, [businessId])
    
    return NextResponse.json(clients)
  } catch (error) {
    console.error('Error al obtener clientes:', error)
    const errorMessage = error instanceof Error ? error.message : 'Error desconocido'
    return NextResponse.json({ error: `Error interno del servidor: ${errorMessage}` }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const authHeader = req.headers.get('authorization')
    const { businessId, userId } = verifyToken(authHeader)
    
    const clientData = await req.json()
    
    // Validar campos requeridos
    if (!clientData.contact_id) {
      return NextResponse.json({ error: 'NIT es requerido' }, { status: 400 })
    }
    
    if (clientData.type_organization_id === 2 && (!clientData.first_name || !clientData.last_name)) {
      return NextResponse.json({ error: 'Primer nombre y primer apellido son requeridos para persona natural' }, { status: 400 })
    }
    
    if (clientData.type_organization_id === 1 && !clientData.supplier_business_name) {
      return NextResponse.json({ error: 'Nombre de la empresa es requerido para persona jurídica' }, { status: 400 })
    }

    // Verificar si ya existe un cliente con el mismo NIT
    const existingClient = await executePosQuery(
      'SELECT id FROM contacts WHERE contact_id = ? AND business_id = ? AND deleted_at IS NULL',
      [clientData.contact_id, businessId]
    ) as any[]

    if (existingClient.length > 0) {
      return NextResponse.json({ error: 'Ya existe un cliente con este NIT' }, { status: 400 })
    }

    // Preparar datos para inserción
    const insertData = {
      business_id: businessId,
      type: clientData.type || 'customer',
      type_organization_id: clientData.type_organization_id,
      type_document_identification_id: clientData.type_document_identification_id,
      type_regime_id: clientData.type_regime_id,
      contact_id: clientData.contact_id,
      name: clientData.name,
      supplier_business_name: clientData.supplier_business_name || null,
      first_name: clientData.first_name || null,
      middle_name: clientData.middle_name || null,
      last_name: clientData.last_name || null,
      second_last_name: clientData.second_last_name || null,
      mobile: clientData.mobile || null,
      email: clientData.email || null,
      address_line_1: clientData.address_line_1 || null,
      contact_status: clientData.contact_status || 'active',
      is_default: clientData.is_default || 0,
      created_by: userId,
      created_at: new Date(),
      updated_at: new Date()
    }

    // Construir la consulta SQL dinámicamente
    const fields = Object.keys(insertData)
    const values = Object.values(insertData)
    const placeholders = fields.map(() => '?').join(', ')
    
    const query = `
      INSERT INTO contacts (${fields.join(', ')}) 
      VALUES (${placeholders})
    `

    const result = await executePosQuery(query, values) as any
    
    // Obtener el cliente creado
    const newClient = await executePosQuery(
      `SELECT 
        id,
        COALESCE(NULLIF(TRIM(name), ''), supplier_business_name) as name,
        supplier_business_name, 
        contact_id 
       FROM contacts 
       WHERE id = ?`,
      [result.insertId]
    ) as any[]

    return NextResponse.json(newClient[0])
  } catch (error) {
    console.error('Error al crear cliente:', error)
    const errorMessage = error instanceof Error ? error.message : 'Error desconocido'
    return NextResponse.json({ error: `Error interno del servidor: ${errorMessage}` }, { status: 500 })
  }
} 