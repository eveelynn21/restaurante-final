import { NextRequest, NextResponse } from 'next/server';
import { executePosQuery } from '../../../../lib/database';

export async function POST(request: NextRequest) {
  try {
    // Verificar si ya existen grupos
    const existingGroupsSql = 'SELECT COUNT(*) as count FROM mfg_ingredient_groups';
    const existingGroups = await executePosQuery(existingGroupsSql);
    const groupCount = (existingGroups as any)[0].count;

    if (groupCount > 0) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Ya existen grupos de ingredientes. La inicialización solo se puede hacer cuando no hay grupos existentes.' 
        },
        { status: 400 }
      );
    }

    // Grupos predefinidos según la lógica del usuario
    const predefinedGroups = [
      {
        name: 'Carnes',
        description: 'Proteínas de origen animal (pollo, res, cerdo, mariscos)'
      },
      {
        name: 'Vegetales',
        description: 'Hortalizas y verduras frescas (cebolla, tomate, lechuga, zanahoria)'
      },
      {
        name: 'Condimentos',
        description: 'Especias y condimentos (sal, pimienta, orégano, comino)'
      },
      {
        name: 'Lácteos',
        description: 'Productos derivados de la leche (leche, queso, mantequilla, crema)'
      },
      {
        name: 'Granos',
        description: 'Cereales y granos (arroz, pasta, quinoa)'
      },
      {
        name: 'Aceites y Grasas',
        description: 'Aceites y grasas para cocinar (aceite vegetal, manteca, aceite de oliva)'
      },
      {
        name: 'Frutas',
        description: 'Frutas frescas y procesadas'
      },
      {
        name: 'Harinas',
        description: 'Diferentes tipos de harinas y polvos'
      },
      {
        name: 'Bebidas',
        description: 'Bebidas y líquidos para preparaciones'
      },
      {
        name: 'Otros',
        description: 'Ingredientes misceláneos y especializados'
      }
    ];

    // Insertar grupos predefinidos
    const insertSql = `
      INSERT INTO mfg_ingredient_groups (name, description, created_at, updated_at)
      VALUES (?, ?, NOW(), NOW())
    `;

    const insertedGroups = [];
    for (const group of predefinedGroups) {
      const result = await executePosQuery(insertSql, [group.name, group.description]);
      insertedGroups.push({
        id: (result as any).insertId,
        name: group.name,
        description: group.description
      });
    }

    return NextResponse.json({
      success: true,
      data: {
        message: `${insertedGroups.length} grupos predefinidos creados exitosamente`,
        groups: insertedGroups
      }
    });

  } catch (error) {
    console.error('Error initializing ingredient groups:', error);
    return NextResponse.json(
      { success: false, error: 'Error al inicializar grupos de ingredientes' },
      { status: 500 }
    );
  }
} 