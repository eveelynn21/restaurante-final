const mysql = require('mysql2/promise');

async function eliminarComandaPrueba() {
  const connection = await mysql.createConnection({
    host: '148.113.218.187',
    user: 'admin',
    password: 'Siscontri+2024*',
    database: 'siscontr_pos37'
  });

  try {
    // Eliminar la comanda de prueba
    const [result] = await connection.execute(
      'DELETE FROM comandas WHERE mesa_id = 191 AND items LIKE "%Hamburguesa Clásica%"'
    );

    console.log('✅ Comanda de prueba eliminada. Filas afectadas:', result.affectedRows);
    
    // Verificar que se eliminó
    const [rows] = await connection.execute(
      'SELECT * FROM comandas WHERE mesa_id = 191'
    );
    
    if (rows.length === 0) {
      console.log('✅ No hay comandas para la mesa 191');
    } else {
      console.log('📋 Comandas restantes:', rows);
    }

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await connection.end();
  }
}

eliminarComandaPrueba();

