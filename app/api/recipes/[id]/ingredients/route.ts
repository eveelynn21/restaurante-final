import { NextRequest, NextResponse } from 'next/server'
import { executePosQuery } from '../../../../../lib/database'
import { verifyToken } from '../../../../../lib/utils'

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    console.log('🔍 Iniciando GET /api/recipes/[id]/ingredients')
    const authHeader = req.headers.get('authorization')
    const { businessId } = verifyToken(authHeader)
    
    const recipeId = params.id
    
    if (!recipeId) {
      return NextResponse.json(
        { success: false, error: 'ID de receta requerido' },
        { status: 400 }
      )
    }

    // Obtener ingredientes de la receta desde mfg_recipe_ingredients (consulta simple)
    const ingredients = await executePosQuery(
      `SELECT * FROM mfg_recipe_ingredients mri WHERE mfg_recipe_id = ?`,
      [recipeId]
    ) as any[]

    // Enriquecer con el product_id correcto y datos de nombre/precio para cada ingrediente
    const enrichedIngredients = await Promise.all(
      ingredients.map(async (ingredient) => {
        let finalProductId = ingredient.product_id
        
        // Si no tiene product_id pero tiene variation_id, buscar el product_id en variations
        if (!ingredient.product_id && ingredient.variation_id) {
          const variationResult = await executePosQuery(
            `SELECT product_id FROM variations v WHERE v.id = ?`,
            [ingredient.variation_id]
          ) as any[]
          
          if (variationResult.length > 0) {
            finalProductId = variationResult[0].product_id
          }
        }
        
        // Obtener nombre del producto usando el product_id final
        const productResult = await executePosQuery(
          `SELECT name FROM products p WHERE p.id = ?`,
          [finalProductId]
        ) as any[]
        
        // Obtener precio del producto usando el product_id final
        const priceResult = await executePosQuery(
          `SELECT default_purchase_price FROM variations v WHERE v.product_id = ?`,
          [finalProductId]
        ) as any[]
        
        return {
          ...ingredient,
          final_product_id: finalProductId,
          product_name: productResult[0]?.name || `Ingrediente ${finalProductId}`,
          default_purchase_price: priceResult[0]?.default_purchase_price || 0
        }
      })
    )

    console.log('✅ Ingredientes de receta obtenidos:', enrichedIngredients?.length || 0)

    return NextResponse.json({
      success: true,
      data: enrichedIngredients,
      total: enrichedIngredients?.length || 0
    })
  } catch (error) {
    console.error('❌ Error en GET /api/recipes/[id]/ingredients:', error)
    return NextResponse.json(
      { success: false, error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}
