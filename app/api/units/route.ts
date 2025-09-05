import { NextResponse } from 'next/server';
import { executePosQuery } from '../../../lib/database';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const ids = searchParams.get('ids');
    if (!ids) {
      return NextResponse.json({ units: [] });
    }
    const idList = ids.split(',').map(id => id.trim()).filter(Boolean);
    if (idList.length === 0) {
      return NextResponse.json({ units: [] });
    }
    const placeholders = idList.map(() => '?').join(',');
    const sql = `SELECT id, actual_name FROM units WHERE id IN (${placeholders})`;
    const units = await executePosQuery(sql, idList);
    return NextResponse.json({ units });
  } catch (error) {
    return NextResponse.json({ error: 'Error al obtener unidades', details: error?.message }, { status: 500 });
  }
} 