import { NextResponse } from 'next/server'
import { executePosQuery } from '../../../lib/database'

export async function GET() {
  try {
    console.log('🔍 Verificando estructura de la base de datos...')
    
    // Verificar si la tabla users existe
    const checkTableQuery = `
      SELECT COUNT(*) as table_exists 
      FROM information_schema.tables 
      WHERE table_schema = 'siscontr_pos37' 
      AND table_name = 'users'
    `
    
    const tableCheck = await executePosQuery(checkTableQuery) as any[]
    const tableExists = tableCheck[0]?.table_exists > 0
    
    console.log('📋 Tabla users existe:', tableExists)
    
    if (!tableExists) {
      return NextResponse.json({
        success: false,
        error: 'La tabla users no existe en la base de datos',
        tableExists: false
      })
    }
    
    // Verificar estructura de la tabla users
    const structureQuery = `
      DESCRIBE users
    `
    
    const structure = await executePosQuery(structureQuery) as any[]
    console.log('🏗️ Estructura de la tabla users:', structure)
    
    // Obtener todos los usuarios
    const usersQuery = `
      SELECT id, username, password, business_id, created_at, updated_at 
      FROM users 
      ORDER BY id
    `
    
    const users = await executePosQuery(usersQuery) as any[]
    console.log('👥 Usuarios encontrados:', users.length)
    
    // Obtener información de la tabla business
    const businessQuery = `
      SELECT id, name, status 
      FROM business 
      ORDER BY id
    `
    
    const businesses = await executePosQuery(businessQuery) as any[]
    console.log('🏢 Empresas encontradas:', businesses.length)
    
    return NextResponse.json({
      success: true,
      tableExists: true,
      structure: structure,
      users: users,
      businesses: businesses,
      summary: {
        totalUsers: users.length,
        totalBusinesses: businesses.length,
        usersWithBusinessId: users.filter(u => u.business_id).length,
        usersWithoutBusinessId: users.filter(u => !u.business_id).length
      }
    })
    
  } catch (error) {
    console.error('💥 Error verificando usuarios:', error)
    return NextResponse.json({ 
      success: false, 
      error: 'Error verificando la base de datos',
      details: error instanceof Error ? error.message : 'Error desconocido'
    }, { status: 500 })
  }
} 