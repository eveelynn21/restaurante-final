import { NextResponse } from 'next/server';
import { getRecipeById, updateRecipe, deleteRecipe } from '../../../../lib/services/recipe-service';

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  try {
    const recipe = await getRecipeById(params.id);
    if (!recipe) return NextResponse.json({ error: 'Receta no encontrada' }, { status: 404 });
    return NextResponse.json(recipe);
  } catch (error) {
    return NextResponse.json({ error: 'Error al obtener receta', details: error?.message }, { status: 500 });
  }
}

export async function PUT(request: Request, { params }: { params: { id: string } }) {
  try {
    const data = await request.json();
    const recipe = await updateRecipe(params.id, data);
    return NextResponse.json(recipe);
  } catch (error) {
    return NextResponse.json({ error: 'Error al actualizar receta', details: error?.message }, { status: 500 });
  }
}

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  try {
    await deleteRecipe(params.id);
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Error al eliminar receta', details: error?.message }, { status: 500 });
  }
} 