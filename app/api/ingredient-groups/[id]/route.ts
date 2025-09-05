import { NextResponse } from 'next/server';
import { getIngredientGroupById, updateIngredientGroup, deleteIngredientGroup } from '../../../../lib/services/ingredient-group-service';

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  try {
    const group = await getIngredientGroupById(params.id);
    if (!group) return NextResponse.json({ error: 'Grupo no encontrado' }, { status: 404 });
    return NextResponse.json(group);
  } catch (error) {
    return NextResponse.json({ error: 'Error al obtener grupo', details: error?.message }, { status: 500 });
  }
}

export async function PUT(request: Request, { params }: { params: { id: string } }) {
  try {
    const data = await request.json();
    const group = await updateIngredientGroup(params.id, data);
    return NextResponse.json(group);
  } catch (error) {
    return NextResponse.json({ error: 'Error al actualizar grupo', details: error?.message }, { status: 500 });
  }
}

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  try {
    await deleteIngredientGroup(params.id);
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Error al eliminar grupo', details: error?.message }, { status: 500 });
  }
} 