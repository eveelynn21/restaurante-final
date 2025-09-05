const mysql = require('mysql2/promise');

async function testComanda() {
  const connection = await mysql.createConnection({
    host: '148.113.218.187',
    user: 'admin',
    password: 'Siscontri+2024*',
    database: 'siscontr_pos37'
  });

  try {
    // Insertar una comanda de prueba para la mesa 191
    const comandaTest = {
      mesa_id: 191,
      items: JSON.stringify([
        {
          id: 1,
          name: "Hamburguesa Clásica",
          quantity: 2,
          price: 12.50
        },
        {
          id: 2,
          name: "Papas Fritas",
          quantity: 1,
          price: 5.00
        }
      ]),
      total: 30.00,
      estado: 'pendiente'
    };

    const [result] = await connection.execute(
      'INSERT INTO comandas (mesa_id, items, total, estado) VALUES (?, ?, ?, ?)',
      [comandaTest.mesa_id, comandaTest.items, comandaTest.total, comandaTest.estado]
    );

    console.log('✅ Comanda de prueba insertada con ID:', result.insertId);
    
    // Verificar que se insertó correctamente
    const [rows] = await connection.execute(
      'SELECT * FROM comandas WHERE mesa_id = ? ORDER BY created_at DESC LIMIT 1',
      [191]
    );
    
    console.log('📋 Comanda encontrada:', rows[0]);

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await connection.end();
  }
}

testComanda();

