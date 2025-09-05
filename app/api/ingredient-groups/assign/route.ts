import { NextRequest, NextResponse } from 'next/server';
import { executePosQuery } from '../../../../lib/database';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { group_id, ingredient_ids, action = 'assign' } = body;

    // Validaciones básicas
    if (!group_id || !ingredient_ids || !Array.isArray(ingredient_ids)) {
      return NextResponse.json(
        { success: false, error: 'Se requiere group_id y un array de ingredient_ids' },
        { status: 400 }
      );
    }

    // Verificar que el grupo existe
    const groupCheckSql = 'SELECT id, name FROM mfg_ingredient_groups WHERE id = ?';
    const groupExists = await executePosQuery(groupCheckSql, [group_id]);
    
    if ((groupExists as any).length === 0) {
      return NextResponse.json(
        { success: false, error: 'El grupo especificado no existe' },
        { status: 404 }
      );
    }

    const groupName = (groupExists as any)[0].name;

    // Verificar que los ingredientes existen
    const ingredientCheckSql = 'SELECT id, name FROM products WHERE id IN (?)';
    const existingIngredients = await executePosQuery(ingredientCheckSql, [ingredient_ids]);
    
    if ((existingIngredients as any).length !== ingredient_ids.length) {
      return NextResponse.json(
        { success: false, error: 'Algunos ingredientes no existen' },
        { status: 400 }
      );
    }

    let updateSql: string;
    let message: string;

    if (action === 'assign') {
      // Asignar ingredientes al grupo
      updateSql = 'UPDATE products SET group_id = ? WHERE id IN (?)';
      message = `${ingredient_ids.length} ingredientes asignados al grupo "${groupName}" exitosamente`;
    } else if (action === 'unassign') {
      // Remover ingredientes del grupo (asignar NULL)
      updateSql = 'UPDATE products SET group_id = NULL WHERE id IN (?)';
      message = `${ingredient_ids.length} ingredientes removidos del grupo exitosamente`;
    } else {
      return NextResponse.json(
        { success: false, error: 'Acción no válida. Use "assign" o "unassign"' },
        { status: 400 }
      );
    }

    // Ejecutar la actualización
    if (action === 'assign') {
      await executePosQuery(updateSql, [group_id, ingredient_ids]);
    } else {
      await executePosQuery(updateSql, [ingredient_ids]);
    }

    // Obtener información actualizada de los ingredientes
    const updatedIngredientsSql = `
      SELECT 
        p.id,
        p.name,
        p.group_id,
        ig.name as group_name
      FROM products p
      LEFT JOIN mfg_ingredient_groups ig ON p.group_id = ig.id
      WHERE p.id IN (?)
    `;
    
    const updatedIngredients = await executePosQuery(updatedIngredientsSql, [ingredient_ids]);

    return NextResponse.json({
      success: true,
      data: { 
        message,
        action,
        assigned_count: ingredient_ids.length,
        ingredients: updatedIngredients
      }
    });

  } catch (error) {
    console.error('Error assigning ingredients to group:', error);
    return NextResponse.json(
      { success: false, error: 'Error al asignar ingredientes al grupo' },
      { status: 500 }
    );
  }
} 