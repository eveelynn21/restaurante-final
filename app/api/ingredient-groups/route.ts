import { NextResponse } from 'next/server';
import { getAllIngredientGroups, createIngredientGroup } from '../../../lib/services/ingredient-group-service';

export async function GET() {
  try {
    const groups = await getAllIngredientGroups();
    return NextResponse.json(groups);
  } catch (error) {
    return NextResponse.json({ error: 'Error al obtener grupos', details: error?.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const data = await request.json();
    const group = await createIngredientGroup(data);
    return NextResponse.json(group, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: 'Error al crear grupo', details: error?.message }, { status: 500 });
  }
} 