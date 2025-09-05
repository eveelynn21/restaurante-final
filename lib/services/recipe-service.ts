import { executePosQuery } from '../../lib/database';

export async function getAllRecipes(all = false) {
  let sql;
  let params: any[] = [];
  if (all) {
    sql = `SELECT r.*, p.name AS product_name
      FROM mfg_recipes r
      LEFT JOIN products p ON r.product_id = p.id
      ORDER BY r.id ASC`;
  } else {
    const today = new Date().toISOString().slice(0, 10);
    sql = `SELECT r.*, p.name AS product_name
      FROM mfg_recipes r
      LEFT JOIN products p ON r.product_id = p.id
      WHERE DATE(r.created_at) >= ?
      ORDER BY r.id ASC`;
    params = [today];
  }
  return await executePosQuery(sql, params);
}

export async function createRecipe(data: any) {
  const {
    product_id,
    instructions,
    waste_percent,
    ingredients_cost,
    extra_cost,
    production_cost_type = 'percentage',
    total_quantity,
    final_price,
    sub_unit_id,
    ingredientes = [] // array de ingredientes
  } = data;

  // Buscar variation_id correspondiente al product_id
  const variationResult: any = await executePosQuery('SELECT id FROM variations WHERE product_id = ?', [product_id]);
  if (!variationResult || !variationResult[0] || !variationResult[0].id) {
    throw new Error('No existe una variación para el producto seleccionado');
  }
  const variation_id = variationResult[0].id;

  // Si sub_unit_id es undefined, usar 1025 como predeterminado
  const subUnitValue = typeof sub_unit_id === 'undefined' ? 1025 : sub_unit_id;

  // Insertar la receta y obtener el id generado
  const sql = `INSERT INTO mfg_recipes (
    product_id,
    variation_id,
    instructions,
    waste_percent,
    ingredients_cost,
    extra_cost,
    production_cost_type,
    total_quantity,
    final_price,
    sub_unit_id,
    created_at,
    updated_at
  ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`;
  const result: any = await executePosQuery(sql, [
    product_id,
    variation_id,
    instructions,
    waste_percent,
    ingredients_cost,
    extra_cost,
    production_cost_type,
    total_quantity,
    final_price,
    subUnitValue
  ]);
  // Obtener el id de la receta recién creada
  const recipeId = result.insertId || result[0]?.insertId;
  console.log('✅ Receta creada con ID:', recipeId);

  // Guardar ingredientes si hay
  console.log('🧪 Guardando ingredientes:', ingredientes.length);
  for (const ing of ingredientes) {
    try {
      console.log('📦 Procesando ingrediente:', ing);
      // Buscar variation_id del ingrediente
      const varRes: any = await executePosQuery('SELECT id FROM variations WHERE product_id = ?', [ing.product_id]);
      const ing_variation_id = varRes && varRes[0] ? varRes[0].id : null;
      
      if (!ing_variation_id) {
        console.warn('⚠️ No se encontró variation_id para product_id:', ing.product_id);
        continue; // Saltar este ingrediente pero continuar con los demás
      }
      
      await executePosQuery(
        `INSERT INTO mfg_recipe_ingredients (
          mfg_recipe_id,
          variation_id,
          mfg_ingredient_group_id,
          quantity,
          waste_percent,
          sub_unit_id,
          sort_order,
          created_at,
          updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
        [
          recipeId,
          ing_variation_id,
          ing.mfg_ingredient_group_id || null,
          ing.quantity,
          ing.waste_percent || 0,
          ing.sub_unit_id || 1025,
          ing.sort_order || 0
        ]
      );
      console.log('✅ Ingrediente guardado:', ing.product_id);
    } catch (error) {
      console.error('❌ Error al guardar ingrediente:', ing.product_id, error);
      // No lanzar error, solo continuar con los demás ingredientes
    }
  }
  console.log('🎉 Proceso de guardado completado');
  return { ...data, variation_id, id: recipeId };
}

export async function getRecipeById(id: string) {
  const sql = 'SELECT * FROM mfg_recipes WHERE id = ?';
  const result: any = await executePosQuery(sql, [id]);
  const receta = result[0];
  if (!receta) return null;
  // Obtener ingredientes asociados con nombre y precio unitario usando variation_id
  const ingredientes = await executePosQuery(
    `SELECT mri.*, p.name as name, p.id as product_id, v.default_purchase_price as precio_unitario
     FROM mfg_recipe_ingredients mri
     LEFT JOIN variations v ON mri.variation_id = v.id
     LEFT JOIN products p ON v.product_id = p.id
     WHERE mri.mfg_recipe_id = ?
     ORDER BY mri.sort_order ASC, mri.id ASC`,
    [id]
  );
  return { ...receta, ingredientes };
}

export async function updateRecipe(id: string, data: any) {
  const {
    product_id,
    instructions,
    waste_percent,
    ingredients_cost,
    extra_cost,
    production_cost_type = 'percentage',
    total_quantity,
    final_price,
    sub_unit_id,
    ingredientes = []
  } = data;

  // Buscar variation_id correspondiente al product_id
  const variationResult: any = await executePosQuery('SELECT id FROM variations WHERE product_id = ?', [product_id]);
  if (!variationResult || !variationResult[0] || !variationResult[0].id) {
    throw new Error('No existe una variación para el producto seleccionado');
  }
  const variation_id = variationResult[0].id;
  const subUnitValue = typeof sub_unit_id === 'undefined' ? 1025 : sub_unit_id;

  // Actualizar la receta principal
  const sql = `UPDATE mfg_recipes SET
    product_id = ?,
    variation_id = ?,
    instructions = ?,
    waste_percent = ?,
    ingredients_cost = ?,
    extra_cost = ?,
    production_cost_type = ?,
    total_quantity = ?,
    final_price = ?,
    sub_unit_id = ?,
    updated_at = NOW()
    WHERE id = ?`;
  await executePosQuery(sql, [
    product_id ?? null,
    variation_id ?? null,
    instructions ?? null,
    waste_percent ?? null,
    ingredients_cost ?? null,
    extra_cost ?? null,
    production_cost_type ?? null,
    total_quantity ?? null,
    final_price ?? null,
    subUnitValue ?? null,
    id
  ]);

  // NUNCA eliminar ingredientes existentes, solo agregar o actualizar
  console.log('Procesando ingredientes enviados:', ingredientes.length);
  
  for (const ing of ingredientes) {
    // Buscar variation_id del ingrediente
    const varRes: any = await executePosQuery('SELECT id FROM variations WHERE product_id = ?', [ing.product_id]);
    const ing_variation_id = varRes && varRes[0] ? varRes[0].id : null;
    
    if (ing_variation_id) {
      // Verificar si el ingrediente ya existe
      const existingIng: any = await executePosQuery(
        'SELECT id FROM mfg_recipe_ingredients WHERE mfg_recipe_id = ? AND variation_id = ?',
        [id, ing_variation_id]
      );
      
      if (existingIng && existingIng.length > 0) {
        // Actualizar ingrediente existente
        await executePosQuery(
          `UPDATE mfg_recipe_ingredients SET
            mfg_ingredient_group_id = ?,
            quantity = ?,
            waste_percent = ?,
            sub_unit_id = ?,
            sort_order = ?,
            updated_at = NOW()
            WHERE id = ?`,
          [
            ing.mfg_ingredient_group_id ?? null,
            ing.quantity ?? null,
            ing.waste_percent ?? null,
            ing.sub_unit_id ?? null,
            ing.sort_order ?? null,
            existingIng[0].id
          ]
        );
        console.log('Ingrediente actualizado:', ing.product_id);
      } else {
        // Insertar nuevo ingrediente
        await executePosQuery(
          `INSERT INTO mfg_recipe_ingredients (
            mfg_recipe_id,
            variation_id,
            mfg_ingredient_group_id,
            quantity,
            waste_percent,
            sub_unit_id,
            sort_order,
            created_at,
            updated_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
          [
            id,
            ing_variation_id,
            ing.mfg_ingredient_group_id ?? null,
            ing.quantity ?? null,
            ing.waste_percent ?? null,
            ing.sub_unit_id ?? null,
            ing.sort_order ?? null
          ]
        );
        console.log('Nuevo ingrediente agregado:', ing.product_id);
      }
    }
  }
  
  console.log('Procesamiento de ingredientes completado');
  return { id, ...data };
}

export async function deleteRecipe(id: string) {
  const sql = 'DELETE FROM mfg_recipes WHERE id = ?';
  await executePosQuery(sql, [id]);
  return true;
} 