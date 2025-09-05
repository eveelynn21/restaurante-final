import { executePosQuery } from '../../lib/database';

export async function getAllIngredientGroups() {
  const sql = 'SELECT * FROM mfg_ingredient_groups ORDER BY name ASC';
  return await executePosQuery(sql);
}

export async function createIngredientGroup(data: any) {
  const { name, description } = data;
  const sql = `INSERT INTO mfg_ingredient_groups (name, description, created_at, updated_at)
    VALUES (?, ?, NOW(), NOW())`;
  const result = await executePosQuery(sql, [name, description]);
  return { id: result.insertId, ...data };
}

export async function getIngredientGroupById(id: string) {
  const sql = 'SELECT * FROM mfg_ingredient_groups WHERE id = ?';
  const result = await executePosQuery(sql, [id]);
  return result[0];
}

export async function updateIngredientGroup(id: string, data: any) {
  const { name, description } = data;
  const sql = `UPDATE mfg_ingredient_groups SET name = ?, description = ?, updated_at = NOW() WHERE id = ?`;
  await executePosQuery(sql, [name, description, id]);
  return { id, ...data };
}

export async function deleteIngredientGroup(id: string) {
  const sql = 'DELETE FROM mfg_ingredient_groups WHERE id = ?';
  await executePosQuery(sql, [id]);
  return true;
} 