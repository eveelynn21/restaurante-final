import { NextResponse } from 'next/server';
import { executePosQuery } from '../../../../lib/database';

export async function GET(req: Request, { params }: { params: { id: string } }) {
  try {
    const id = params.id;
    if (!id) {
      return NextResponse.json({ error: 'ID requerido' }, { status: 400 });
    }
    const productos = await executePosQuery(
      `SELECT p.*, v.sell_price_inc_tax, v.default_purchase_price FROM products p 
       LEFT JOIN variations v ON p.id = v.product_id 
       WHERE p.id = ?`,
      [id]
    ) as any[];
    if (!productos || productos.length === 0) {
      return NextResponse.json({ error: 'Producto no encontrado' }, { status: 404 });
    }
    const producto = productos[0];
    return NextResponse.json({
      ...producto,
      default_purchase_price: producto.default_purchase_price // asegurar que esté presente
    });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Error al obtener producto' }, { status: 500 });
  }
}
 