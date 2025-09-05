import { NextRequest, NextResponse } from 'next/server';
import { executePosQuery } from '../../../../lib/database';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q');
    const limit = parseInt(searchParams.get('limit') || '10');

    if (!query || query.length < 2) {
      return NextResponse.json({
        success: true,
        data: []
      });
    }

    const sql = `
      SELECT 
        p.id,
        p.name,
        p.description,
        p.price,
        p.category_id,
        c.name as category_name,
        ig.name as group_name
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      LEFT JOIN mfg_ingredient_groups ig ON p.group_id = ig.id
      WHERE p.name LIKE ? OR p.description LIKE ?
      ORDER BY 
        CASE WHEN p.name LIKE ? THEN 1 ELSE 2 END,
        p.name ASC
      LIMIT ${limit}
    `;

    const searchTerm = `%${query}%`;
    const exactMatch = `${query}%`;
    
    const ingredients = await executePosQuery(sql, [searchTerm, searchTerm, exactMatch]);

    return NextResponse.json({
      success: true,
      data: ingredients
    });

  } catch (error) {
    console.error('Error searching ingredients:', error);
    return NextResponse.json(
      { success: false, error: 'Error al buscar ingredientes' },
      { status: 500 }
    );
  }
} 