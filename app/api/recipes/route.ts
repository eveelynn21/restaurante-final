import { NextResponse } from 'next/server';
import { createRecipe } from '../../../lib/services/recipe-service';
import { executePosQuery } from '../../../lib/database';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'supersecretkey';

function verifyToken(authHeader: string | null): { businessId: number } {
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new Error('Token requerido');
  }
  const token = authHeader.substring(7);
  const decoded = jwt.verify(token, JWT_SECRET) as { business_id: number };
  if (typeof decoded.business_id === 'undefined') {
    throw new Error('Token inválido: business_id no encontrado');
  }
  return { businessId: decoded.business_id };
}

export async function GET(request: Request) {
  try {
    const authHeader = request.headers.get('authorization');
    const { businessId } = verifyToken(authHeader);
    const { searchParams } = new URL(request.url);
    const all = searchParams.get('all') === '1';
    let sql = `SELECT r.*, p.name AS product_name
      FROM mfg_recipes r
      LEFT JOIN products p ON r.product_id = p.id
      WHERE p.business_id = ?
      ORDER BY r.id ASC`;
    const recetas = await executePosQuery(sql, [businessId]);
    return NextResponse.json({ success: true, data: recetas });
  } catch (error: any) {
    return NextResponse.json({ error: 'Error al obtener recetas', details: error?.message || '' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    console.log('📥 POST /api/recipes - Iniciando creación de receta');
    
    // Verificar token JWT
    const authHeader = request.headers.get('authorization');
    const { businessId } = verifyToken(authHeader);
    console.log('🔐 Token verificado, businessId:', businessId);
    
    const data = await request.json();
    console.log('📦 Datos recibidos:', data);
    
    const recipe = await createRecipe(data);
    console.log('✅ Receta creada exitosamente:', recipe);
    
    return NextResponse.json(recipe, { status: 201 });
  } catch (error: any) {
    console.error('❌ Error en POST /api/recipes:', error);
    return NextResponse.json({ error: 'Error al crear receta', details: error?.message || '' }, { status: 500 });
  }
} 