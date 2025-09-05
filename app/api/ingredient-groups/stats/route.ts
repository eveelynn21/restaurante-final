import { NextRequest, NextResponse } from 'next/server';
import { executePosQuery } from '../../../../lib/database';

export async function GET(request: NextRequest) {
  try {
    // Estadísticas generales de grupos
    const generalStatsSql = `
      SELECT 
        COUNT(DISTINCT ig.id) as total_groups,
        COUNT(DISTINCT p.id) as total_ingredients,
        COUNT(DISTINCT CASE WHEN p.group_id IS NOT NULL THEN p.id END) as grouped_ingredients,
        COUNT(DISTINCT CASE WHEN p.group_id IS NULL THEN p.id END) as ungrouped_ingredients
      FROM mfg_ingredient_groups ig
      CROSS JOIN products p
    `;

    const generalStats = await executePosQuery(generalStatsSql);

    // Estadísticas por grupo
    const groupStatsSql = `
      SELECT 
        ig.id,
        ig.name,
        ig.description,
        COUNT(p.id) as ingredient_count,
        COALESCE(SUM(p.price), 0) as total_value,
        COALESCE(AVG(p.price), 0) as avg_price,
        MIN(p.price) as min_price,
        MAX(p.price) as max_price
      FROM mfg_ingredient_groups ig
      LEFT JOIN products p ON ig.id = p.group_id
      GROUP BY ig.id
      ORDER BY ingredient_count DESC
    `;

    const groupStats = await executePosQuery(groupStatsSql);

    // Top 5 grupos con más ingredientes
    const topGroupsSql = `
      SELECT 
        ig.name,
        COUNT(p.id) as ingredient_count
      FROM mfg_ingredient_groups ig
      LEFT JOIN products p ON ig.id = p.group_id
      GROUP BY ig.id
      ORDER BY ingredient_count DESC
      LIMIT 5
    `;

    const topGroups = await executePosQuery(topGroupsSql);

    // Ingredientes más costosos por grupo
    const expensiveIngredientsSql = `
      SELECT 
        ig.name as group_name,
        p.name as ingredient_name,
        p.price,
        p.description
      FROM products p
      JOIN mfg_ingredient_groups ig ON p.group_id = ig.id
      WHERE p.price > 0
      ORDER BY p.price DESC
      LIMIT 10
    `;

    const expensiveIngredients = await executePosQuery(expensiveIngredientsSql);

    // Distribución de ingredientes sin grupo por categoría
    const ungroupedByCategorySql = `
      SELECT 
        c.name as category_name,
        COUNT(p.id) as ingredient_count
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      WHERE p.group_id IS NULL
      GROUP BY c.id
      ORDER BY ingredient_count DESC
    `;

    const ungroupedByCategory = await executePosQuery(ungroupedByCategorySql);

    return NextResponse.json({
      success: true,
      data: {
        general: (generalStats as any)[0],
        groups: groupStats,
        top_groups: topGroups,
        expensive_ingredients: expensiveIngredients,
        ungrouped_by_category: ungroupedByCategory
      }
    });

  } catch (error) {
    console.error('Error fetching ingredient group stats:', error);
    return NextResponse.json(
      { success: false, error: 'Error al obtener estadísticas de grupos' },
      { status: 500 }
    );
  }
} 