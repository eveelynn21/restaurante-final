import { NextResponse } from 'next/server'
import { executePosQuery } from '../../../lib/database'
import jwt from 'jsonwebtoken'
import bcrypt from 'bcryptjs'

const JWT_SECRET = process.env.JWT_SECRET || 'supersecretkey'

export async function POST(req: Request) {
  try {
    const { username, password } = await req.json()
    console.log('🔍 Login intento:', { username, password: password ? '***' : 'undefined' })
    
    if (!username || !password) {
      console.log('❌ Datos faltantes:', { username: !!username, password: !!password })
      return NextResponse.json({ success: false, error: 'Usuario y contraseña requeridos' }, { status: 400 })
    }

    // Buscar usuario por username
    const query = 'SELECT id, username, password, business_id FROM users WHERE username = ? LIMIT 1'
    console.log('🔍 Ejecutando query:', query, 'con parámetros:', [username])
    
    const rows = await executePosQuery(query, [username]) as any[]
    console.log('📊 Resultados encontrados:', rows.length)
    
    if (rows.length === 0) {
      console.log('❌ Usuario no encontrado:', username)
      return NextResponse.json({ success: false, error: 'Usuario o contraseña incorrectos' }, { status: 401 })
    }
    
    const user = rows[0]
    
    // Verificar si la contraseña está hasheada (empieza con $2y$)
    const isHashed = user.password.startsWith('$2y$')
    console.log('🔐 Contraseña hasheada:', isHashed)
    
    let passwordMatch = false
    
    if (isHashed) {
      // Comparar con bcrypt
      passwordMatch = await bcrypt.compare(password, user.password)
      console.log('🔍 Comparación bcrypt:', passwordMatch)
    } else {
      // Comparación directa (para contraseñas en texto plano)
      passwordMatch = user.password === password
      console.log('🔍 Comparación directa:', passwordMatch)
    }
    
    console.log('👤 Usuario encontrado:', { 
      id: user.id, 
      username: user.username, 
      business_id: user.business_id,
      password_match: passwordMatch 
    })

    if (!passwordMatch) {
      console.log('❌ Contraseña incorrecta para usuario:', username)
      return NextResponse.json({ success: false, error: 'Usuario o contraseña incorrectos' }, { status: 401 })
    }

    // Verificar que tenga business_id
    if (!user.business_id) {
      console.log('❌ Usuario sin business_id:', username)
      return NextResponse.json({ success: false, error: 'El usuario no está asociado a ninguna empresa' }, { status: 403 })
    }

    // Crear JWT
    const token = jwt.sign({ user_id: user.id, business_id: user.business_id }, JWT_SECRET, { expiresIn: '2h' })
    console.log('✅ Login exitoso para usuario:', username, 'business_id:', user.business_id)

    return NextResponse.json({
      success: true,
      token,
      user: {
        id: user.id,
        username: user.username,
        business_id: user.business_id
      }
    })
  } catch (error) {
    console.error('💥 Error en login:', error)
    return NextResponse.json({ success: false, error: 'Error interno del servidor' }, { status: 500 })
  }
} 