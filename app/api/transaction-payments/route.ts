import { NextResponse } from 'next/server'
import { executePosQuery } from '../../../lib/database'
import jwt from 'jsonwebtoken'

const JWT_SECRET = process.env.JWT_SECRET || 'supersecretkey'

function verifyToken(authHeader) {
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new Error('Token requerido')
  }
  const token = authHeader.substring(7)
  jwt.verify(token, JWT_SECRET)
}

export async function POST(req) {
  try {
    const authHeader = req.headers.get('authorization')
    verifyToken(authHeader)
    const { transaction_id, method, amount } = await req.json()
    if (!transaction_id || !method || amount === undefined) {
      return NextResponse.json({ error: 'Faltan campos requeridos' }, { status: 400 })
    }
    await executePosQuery(
      `INSERT INTO transaction_payments (transaction_id, method, amount) VALUES (?, ?, ?)`,
      [transaction_id, method, amount]
    )
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error creando pago:', error)
    return NextResponse.json({ error: error.message || 'Error al crear pago' }, { status: 500 })
  }
} 