import { NextRequest, NextResponse } from 'next/server';
import { executePosQuery } from '../../../../lib/database';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search');
    const limit = parseInt(searchParams.get('limit') || '50');

    let whereClause = 'WHERE p.group_id IS NULL';
    const params: any[] = [];

    if (search) {
      whereClause += ' AND p.name LIKE ?';
      params.push(`%${search}%`);
    }

    const sql = `
      SELECT 
        p.id,
        p.name,
        p.sku,
        p.type,
        p.unit_id,
        p.alert_quantity,
        p.enable_stock,
        p.is_inactive
      FROM products p
      WHERE p.business_id = 165
      ORDER BY p.name ASC
      LIMIT 50
    `;

    const ingredients = await executePosQuery(sql, params);

    return NextResponse.json({
      success: true,
      data: ingredients
    });

  } catch (error) {
    console.error('Error fetching ungrouped ingredients:', error);
    return NextResponse.json(
      { success: false, error: 'Error al obtener ingredientes sin grupo' },
      { status: 500 }
    );
  }
} 