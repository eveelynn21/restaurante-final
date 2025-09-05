"use client";
import React, { useState, useEffect } from "react";
import { Button } from "../../../components/ui/button";
import { useRouter } from "next/navigation";
import { LayoutDashboard } from "lucide-react";

export default function RecetasPage() {
  const router = useRouter();
  const [showForm, setShowForm] = useState(false);
  const [showIngredienteModal, setShowIngredienteModal] = useState(false);
  const [showGruposModal, setShowGruposModal] = useState(false);
  const [searchIngrediente, setSearchIngrediente] = useState("");
  
  // Estados para datos reales
  const [recipes, setRecipes] = useState([]);
  const [groups, setGroups] = useState([]);
  const [ungroupedIngredients, setUngroupedIngredients] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [productosConReceta, setProductosConReceta] = useState([]);
  const [todosLosProductos, setTodosLosProductos] = useState([]);
  const [productosDisponibles, setProductosDisponibles] = useState([]);

  // Estado para el producto seleccionado y la cantidad total producida
  const [productoSeleccionado, setProductoSeleccionado] = useState("");
  const [cantidadTotal, setCantidadTotal] = useState("");

  // Estado para las unidades de medida disponibles
  const [unidadesDisponibles, setUnidadesDisponibles] = useState<any[]>([]);

  // Estados para los campos del formulario
  const [wastePercent, setWastePercent] = useState(0);
  const [extraCost, setExtraCost] = useState(0);
  const [instructions, setInstructions] = useState("");
  const [ingredientes, setIngredientes] = useState<any[]>([]); // Aquí se agregan los ingredientes

  // Estado para el costo total de ingredientes
  const [ingredientsCost, setIngredientsCost] = useState(0);
  const [finalPrice, setFinalPrice] = useState(ingredientsCost + (Number(extraCost) || 0));
  const [finalPriceEdited, setFinalPriceEdited] = useState(false);
  const [editReceta, setEditReceta] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState("");

  // Actualizar finalPrice automáticamente solo si el usuario no lo ha editado manualmente Y no estamos editando
  useEffect(() => {
    if (!finalPriceEdited && !editReceta) {
      setFinalPrice(ingredientsCost + (Number(extraCost) || 0));
    }
  }, [ingredientsCost, extraCost, finalPriceEdited, editReceta]);

  // Función para cargar recetas
  const loadRecipes = async () => {
    try {
      setLoading(true);
      // Calcular la fecha de ayer en formato YYYY-MM-DD
      const ayer = new Date(Date.now() - 86400000);
      const yyyy = ayer.getFullYear();
      const mm = String(ayer.getMonth() + 1).padStart(2, '0');
      const dd = String(ayer.getDate()).padStart(2, '0');
      const fechaAyer = `${yyyy}-${mm}-${dd}`;
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/recipes?from=${fechaAyer}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await response.json();
      
      if (data.success) {
        setRecipes(data.data);
      } else {
        setError(data.error || 'Error al cargar recetas');
      }
    } catch (err) {
      setError('Error de conexión');
    } finally {
      setLoading(false);
    }
  };

  // Función para cargar grupos
  const loadGroups = async () => {
    try {
      const response = await fetch('/api/ingredient-groups');
      const data = await response.json();
      
      if (data.success) {
        setGroups(data.data);
      }
    } catch (err) {
      console.error('Error cargando grupos:', err);
    }
  };

  // Función para cargar ingredientes sin grupo
  const loadUngroupedIngredients = async () => {
    try {
      const response = await fetch('/api/ingredients/ungrouped');
      const data = await response.json();
      
      if (data.success) {
        setUngroupedIngredients(data.data);
      }
    } catch (err) {
      console.error('Error cargando ingredientes sin grupo:', err);
    }
  };

  // Cargar productos con receta (sin filtro de fecha)
  const loadProductosConReceta = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/recipes?all=1', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await response.json();
      if (data.success) {
        // Obtener productos únicos, incluyendo default_purchase_price y sell_price_inc_tax
        const productos = Array.from(
          new Map(data.data.map((r: any) => [
            r.product_id,
            {
              id: r.product_id,
              name: r.product_name,
              total_quantity: r.total_quantity,
              default_purchase_price: r.default_purchase_price || 0,
              sell_price_inc_tax: r.sell_price_inc_tax || 0
            }
          ])).values()
        );
        setProductosConReceta(productos);
      }
    } catch (err) {
      // No hacer nada especial
    }
  };

  // Cargar todos los productos disponibles
  const loadTodosLosProductos = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/products?pageSize=1000', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await response.json();
      if (data.products) {
        setTodosLosProductos(data.products);
      }
    } catch (err) {
      console.error('Error cargando todos los productos:', err);
    }
  };

  // Filtrar productos disponibles (los que NO tienen receta)
  useEffect(() => {
    if (todosLosProductos.length > 0 && productosConReceta.length > 0) {
      const productosConRecetaIds = productosConReceta.map((p: any) => String(p.id));
      const disponibles = todosLosProductos.filter((producto: any) => 
        !productosConRecetaIds.includes(String(producto.id))
      );
      setProductosDisponibles(disponibles);
    } else if (todosLosProductos.length > 0) {
      // Si no hay recetas, todos los productos están disponibles
      setProductosDisponibles(todosLosProductos);
    }
  }, [todosLosProductos, productosConReceta]);

  // Cuando se selecciona un producto, buscar su total_quantity en productosConReceta
  useEffect(() => {
    if (productoSeleccionado) {
      const receta = productosConReceta.find((p: any) => String(p.id) === String(productoSeleccionado));
      if (receta && receta.total_quantity != null && receta.total_quantity !== undefined) {
        setCantidadTotal(receta.total_quantity);
      } else {
        setCantidadTotal("");
      }
    } else {
      setCantidadTotal("");
    }
  }, [productoSeleccionado, productosConReceta]);

  // Cargar unidades de medida cuando se selecciona un producto
  useEffect(() => {
    async function fetchUnidades() {
      if (productoSeleccionado) {
        // Buscar el producto seleccionado en productosConReceta
        const receta = productosConReceta.find((p: any) => String(p.id) === String(productoSeleccionado));
        if (receta && receta.sub_unit_ids) {
          // Parsear el array de subunidades y agregar 1025 si no está
          let subUnitIds: string[] = [];
          try {
            subUnitIds = JSON.parse(receta.sub_unit_ids);
          } catch {
            subUnitIds = Array.isArray(receta.sub_unit_ids) ? receta.sub_unit_ids : [];
          }
          if (!subUnitIds.includes("1025")) subUnitIds.unshift("1025");
          // Consultar las unidades
          const res = await fetch(`/api/units?ids=${subUnitIds.join(",")}`);
          const data = await res.json();
          setUnidadesDisponibles(data.units || []);
        } else {
          // Si no hay subunidades, solo mostrar la 1025
          const res = await fetch(`/api/units?ids=1025`);
          const data = await res.json();
          setUnidadesDisponibles(data.units || []);
        }
      } else {
        setUnidadesDisponibles([]);
      }
    }
    fetchUnidades();
  }, [productoSeleccionado, productosConReceta]);

  // Cargar datos al montar el componente
  useEffect(() => {
    loadRecipes();
    loadGroups();
    loadUngroupedIngredients();
    loadProductosConReceta();
    loadTodosLosProductos();
  }, []);

  useEffect(() => {
    if (productosConReceta.length > 0) {
      console.log('productosConReceta:', productosConReceta);
    }
  }, [productosConReceta]);

  // Función para guardar la receta
  const handleGuardarReceta = async () => {
    try {
      console.log('🔍 Iniciando guardado de receta...');
      console.log('📋 Estado actual:', {
        editReceta: editReceta,
        ingredientes: ingredientes,
        ingredientesOriginales: ingredientesOriginales,
        productoSeleccionado: productoSeleccionado
      });
      
      // Combinar ingredientes originales con los nuevos para enviar TODOS
      let ingredientesParaEnviar = [...ingredientes];
      
      if (editReceta && editReceta.id) {
        // En modo edición, combinar ingredientes originales con los actuales
        // Crear un mapa de ingredientes actuales por product_id para evitar duplicados
        const ingredientesActualesMap = new Map();
        ingredientes.forEach(ing => {
          if (ing.product_id) {
            ingredientesActualesMap.set(ing.product_id, ing);
          }
        });
        
        // Agregar ingredientes originales que no están en los actuales
        ingredientesOriginales.forEach(ingOriginal => {
          if (ingOriginal.product_id && !ingredientesActualesMap.has(ingOriginal.product_id)) {
            ingredientesParaEnviar.push(ingOriginal);
          }
        });
      }
      
      console.log('📦 Ingredientes antes del filtrado:', ingredientesParaEnviar);
      
      // Filtrar y transformar ingredientes antes de enviar - VERSIÓN SIMPLIFICADA
      const ingredientesLimpios = ingredientesParaEnviar
        .filter(ing => ing.product_id && ing.quantity) // Filtro simple
        .map(ing => ({
          product_id: ing.product_id,
          quantity: ing.quantity,
          mfg_ingredient_group_id: ing.mfg_ingredient_group_id ?? null,
          waste_percent: ing.waste_percent ?? null,
          sub_unit_id: ing.sub_unit_id ?? null,
          sort_order: ing.sort_order ?? null
        }));
      
      console.log('🧪 Ingredientes para enviar:', ingredientesLimpios);
      
      const receta = {
        product_id: String(productoSeleccionado),
        total_quantity: cantidadTotal,
        waste_percent: wastePercent,
        ingredients_cost: ingredientsCost,
        extra_cost: extraCost,
        instructions,
        final_price: finalPrice,
        ingredientes: ingredientesLimpios, // enviar ingredientes limpios al backend
      };
      
      console.log('📤 Enviando receta completa:', receta);
      let response;
      if (editReceta && editReceta.id) {
        // Actualizar receta existente
        response = await fetch(`/api/recipes/${editReceta.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(receta),
        });
      } else {
        // Crear nueva receta
        const token = localStorage.getItem('token');
        response = await fetch('/api/recipes', {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify(receta),
        });
      }
      
      if (!response.ok) {
        const errorData = await response.json();
        console.error('❌ Error del servidor:', errorData);
        throw new Error(errorData.error || 'Error al guardar la receta');
      }
      
      const result = await response.json();
      console.log('✅ Receta guardada exitosamente:', result);
      
      // Cerrar el modal y recargar datos
      setShowForm(false);
      await loadRecipes();
      await loadProductosConReceta(); // Recargar también los productos con receta
      await loadTodosLosProductos(); // Recargar todos los productos para actualizar la lista de disponibles
      
      // Limpiar el formulario
      setProductoSeleccionado("");
      setCantidadTotal("");
      setWastePercent(0);
      setExtraCost(0);
      setInstructions("");
      setIngredientes([]);
      setIngredientesOriginales([]);
      setEditReceta(null);
      setFinalPriceEdited(false);
    } catch (error) {
      console.error('❌ Error al guardar receta:', error);
      alert('Error al guardar la receta: ' + (error instanceof Error ? error.message : 'Error desconocido'));
    }
  };

  const [selectedProductId, setSelectedProductId] = useState("");
  const [cantidadIngrediente, setCantidadIngrediente] = useState("");
  const [unidadIngrediente, setUnidadIngrediente] = useState("");
  const [grupoIngrediente, setGrupoIngrediente] = useState("");
  const [desperdicioIngrediente, setDesperdicioIngrediente] = useState("");
  const [precioIngrediente, setPrecioIngrediente] = useState<string>("");

  useEffect(() => {
    if (selectedProductId) {
      console.log('Obteniendo precio para producto:', selectedProductId);
      fetch(`/api/products/${selectedProductId}`)
        .then(res => res.json())
        .then(data => {
          console.log('Respuesta del API:', data);
          if (data && data.default_purchase_price) {
            setPrecioIngrediente(Number(data.default_purchase_price).toFixed(2));
          } else {
            setPrecioIngrediente("0.00");
          }
        })
        .catch((error) => {
          console.error('Error obteniendo precio:', error);
          setPrecioIngrediente("0.00");
        });
    } else {
      setPrecioIngrediente("");
    }
  }, [selectedProductId]);

  const [ingredientesOriginales, setIngredientesOriginales] = useState<any[]>([]);
  
  // Al hacer clic en Editar, cargar los datos de la receta en el formulario
  const handleEditarReceta = async (receta: any) => {
    console.log('✏️ Iniciando edición de receta:', receta.id);
    console.log('📋 Datos de la receta a editar:', receta);
    
    setProductoSeleccionado(receta.product_id || "");
    setCantidadTotal(receta.total_quantity || "");
    setWastePercent(receta.waste_percent || 0);
    setExtraCost(receta.extra_cost !== null && receta.extra_cost !== undefined ? Number(receta.extra_cost) : 0);
    setFinalPrice(receta.final_price !== null && receta.final_price !== undefined ? Number(receta.final_price) : 0);
    setInstructions(receta.instructions || "");
    setFinalPriceEdited(false);
    setEditReceta(receta);
    try {
      console.log('📡 Cargando ingredientes para editar...');
      const res = await fetch(`/api/recipes/${receta.id}`);
      const data = await res.json();
      console.log('📦 Datos completos recibidos al editar:', data);
      console.log('🧪 Ingredientes recibidos al editar:', data.ingredientes);
      const ingredientesCargados = data.ingredientes || [];
      setIngredientes(ingredientesCargados);
      setIngredientesOriginales(ingredientesCargados); // Guardar copia de los ingredientes originales
      // Setear el costo total de ingredientes recibido
      setIngredientsCost(Number(data.ingredients_cost) || 0);
      console.log('✅ Ingredientes cargados para edición:', ingredientesCargados.length);
    } catch (error) {
      console.error('❌ Error al cargar ingredientes para editar:', error);
      setIngredientes([]);
      setIngredientesOriginales([]);
      setIngredientsCost(0);
    }
    setShowForm(true);
  };

  // Recalcular ingredientsCost cada vez que cambian los ingredientes
  useEffect(() => {
    const total = ingredientes.reduce((acc, ing) => {
      const cantidad = parseFloat(ing.quantity) || 0;
      const precio = parseFloat(ing.precio_unitario) || 0;
      return acc + (precio * cantidad);
    }, 0);
    setIngredientsCost(total);
  }, [ingredientes]);

  // Función para duplicar receta
  const handleDuplicarReceta = async (receta: any) => {
    console.log('🔄 Iniciando duplicación de receta:', receta.id);
    
    // Copiar los datos de la receta pero limpiar el producto
    setCantidadTotal(receta.total_quantity || "");
    setWastePercent(receta.waste_percent || 0);
    setExtraCost(receta.extra_cost !== null && receta.extra_cost !== undefined ? Number(receta.extra_cost) : 0);
    setFinalPrice(receta.final_price !== null && receta.final_price !== undefined ? Number(receta.final_price) : 0);
    setInstructions(receta.instructions || "");
    setFinalPriceEdited(false);
    setEditReceta(null); // No estamos editando, estamos duplicando
    
    // Cargar los ingredientes de la receta original
    try {
      console.log('📡 Cargando ingredientes de la receta original...');
      const res = await fetch(`/api/recipes/${receta.id}`);
      const data = await res.json();
      console.log('📦 Datos recibidos del API:', data);
      console.log('🧪 Ingredientes recibidos al duplicar:', data.ingredientes);
      const ingredientesCargados = data.ingredientes || [];
      
      // Asegurarse de que los ingredientes tengan la estructura correcta
      const ingredientesFormateados = ingredientesCargados.map((ing: any) => {
        const ingredienteFormateado = {
          product_id: String(ing.product_id || ing.variation_id), // Asegurar que sea string
          name: ing.name || ing.product_name,
          quantity: String(ing.quantity || 0), // Asegurar que sea string
          unit_name: ing.unit_name,
          mfg_ingredient_group_id: ing.mfg_ingredient_group_id,
          waste_percent: ing.waste_percent,
          sub_unit_id: ing.sub_unit_id,
          sort_order: ing.sort_order,
          precio_unitario: ing.precio_unitario || 0,
          group_name: ing.group_name
        };
        console.log('🔧 Ingrediente formateado:', ingredienteFormateado);
        return ingredienteFormateado;
      });
      
      console.log('📋 Lista final de ingredientes formateados:', ingredientesFormateados);
      setIngredientes(ingredientesFormateados);
      setIngredientesOriginales([]); // No hay ingredientes originales al duplicar
      setIngredientsCost(Number(data.ingredients_cost) || 0);
    } catch (error) {
      console.error('❌ Error al cargar ingredientes para duplicar:', error);
      setIngredientes([]);
      setIngredientesOriginales([]);
      setIngredientsCost(0);
    }
    
    // Limpiar el producto seleccionado para que el usuario pueda elegir uno nuevo
    setProductoSeleccionado("");
    setShowForm(true);
    console.log('✅ Duplicación completada, modal abierto');
  };

  // Función para eliminar receta
  const handleEliminarReceta = async (recipeId: string) => {
    if (confirm('¿Estás seguro de que quieres eliminar esta receta? Esta acción no se puede deshacer.')) {
      try {
        const response = await fetch(`/api/recipes/${recipeId}`, {
          method: 'DELETE',
        });
        
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Error al eliminar la receta');
        }
        
        // Recargar la lista de recetas
        await loadRecipes();
        await loadProductosConReceta();
        await loadTodosLosProductos();
        
        alert('Receta eliminada exitosamente');
      } catch (error) {
        console.error('Error al eliminar receta:', error);
        alert('Error al eliminar la receta: ' + (error instanceof Error ? error.message : 'Error desconocido'));
      }
    }
  };

  return (
    <div className="container mx-auto px-4 py-6 bg-background">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-foreground">Gestión de Recetas</h2>
        <div className="flex gap-3">
          <Button 
            variant="outline"
            onClick={() => router.push("/dashboard")}
            className="bg-purple-100 text-purple-700 border-purple-200 hover:bg-purple-200"
          >
            <LayoutDashboard className="mr-2 h-4 w-4" />
            Dashboard
          </Button>
          <Button variant="outline" className="bg-purple-100 text-purple-700 border-purple-200 hover:bg-purple-200 px-6 py-2 rounded-full shadow-md font-semibold" onClick={() => setShowGruposModal(true)}>
            Gestionar Grupos
          </Button>
          <Button 
            variant="outline"
            className={`px-6 py-2 rounded-full shadow-md font-semibold ${
              productosDisponibles.length > 0 
                ? 'bg-purple-100 text-purple-700 border-purple-200 hover:bg-purple-200' 
                : 'bg-muted text-muted-foreground cursor-not-allowed'
            }`} 
            onClick={() => {
              if (productosDisponibles.length === 0) return;
              setProductoSeleccionado("");
              setCantidadTotal("");
              setWastePercent(0);
              setExtraCost(0);
              setInstructions("");
              setIngredientes([]);
              setIngredientesOriginales([]);
              setEditReceta(null);
              setFinalPrice(0);
              setFinalPriceEdited(false);
              setShowForm(true);
            }}
            disabled={productosDisponibles.length === 0}
          >
            + Nueva Receta {productosDisponibles.length > 0 && `(${productosDisponibles.length} disponibles)`}
          </Button>
        </div>
      </div>
      {/* Filtros */}
      <div className="flex flex-wrap gap-4 mb-6">
        <input 
          type="text" 
          placeholder="Buscar por producto..." 
          className="px-4 py-2 rounded-lg border border-border shadow-sm w-64 bg-background text-foreground focus:border-primary"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        <select className="px-4 py-2 rounded-lg border border-border shadow-sm bg-background text-foreground focus:border-primary">
          <option>Todos los estados</option>
          <option>Activa</option>
          <option>Inactiva</option>
        </select>
        <input type="date" className="px-4 py-2 rounded-lg border border-border shadow-sm bg-background text-foreground focus:border-primary" />
      </div>
      {/* Tabla de recetas */}
      <div className="overflow-x-auto rounded-2xl shadow-lg bg-card border border-border">
        {loading ? (
          <div className="p-8 text-center">
            <div className="text-muted-foreground">Cargando recetas...</div>
          </div>
        ) : error ? (
          <div className="p-8 text-center">
            <div className="text-destructive">{error}</div>
            <Button className="mt-2 bg-primary text-primary-foreground" onClick={loadRecipes}>Reintentar</Button>
          </div>
        ) : (
          <table className="min-w-full divide-y divide-border">
            <thead className="bg-accent/50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-bold text-muted-foreground uppercase tracking-wider">Producto</th>
                <th className="px-6 py-3 text-left text-xs font-bold text-muted-foreground uppercase tracking-wider">Costo</th>
                <th className="px-6 py-3 text-left text-xs font-bold text-muted-foreground uppercase tracking-wider">Precio Final</th>
                <th className="px-6 py-3 text-left text-xs font-bold text-muted-foreground uppercase tracking-wider">Margen</th>
                <th className="px-6 py-3 text-left text-xs font-bold text-muted-foreground uppercase tracking-wider">Fecha</th>
                <th className="px-6 py-3 text-center text-xs font-bold text-muted-foreground uppercase tracking-wider">Acciones</th>
              </tr>
            </thead>
            <tbody className="bg-card divide-y divide-border">
              {recipes.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-muted-foreground">
                    No hay recetas creadas. Crea tu primera receta para comenzar.
                  </td>
                </tr>
              ) : (
                recipes
                  .filter((recipe: any) => 
                    searchTerm === "" || 
                    recipe.product_name?.toLowerCase().includes(searchTerm.toLowerCase())
                  )
                  .map((recipe: any) => (
                    <tr key={recipe.id} className="hover:bg-accent/20">
                      <td className="px-6 py-4 whitespace-nowrap font-medium text-foreground">{recipe.product_name}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-muted-foreground">${(Number(recipe.ingredients_cost || 0) + Number(recipe.extra_cost || 0)).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-muted-foreground">${Number(recipe.final_price || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-primary font-bold">{recipe.waste_percent != null ? recipe.waste_percent + '%' : '--%'}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-muted-foreground">{new Date(recipe.created_at).toLocaleDateString()}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        <Button size="sm" variant="outline" className="mr-2 bg-purple-100 text-purple-700 border-purple-200 hover:bg-purple-200 rounded-full" onClick={() => handleEditarReceta(recipe)}>Editar</Button>
<Button size="sm" variant="outline" className="mr-2 bg-purple-100 text-purple-700 border-purple-200 hover:bg-purple-200 rounded-full" onClick={() => handleDuplicarReceta(recipe)}>Duplicar</Button>
<Button size="sm" variant="outline" className="mr-2 bg-purple-100 text-purple-700 border-purple-200 hover:bg-purple-200 rounded-full" onClick={() => handleEliminarReceta(recipe.id)}>Eliminar</Button>
                      </td>
                    </tr>
                  ))
              )}
            </tbody>
          </table>
        )}
      </div>
      {/* Formulario de receta (modal visual) */}
      {showForm && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-card rounded-2xl shadow-2xl p-6 w-full max-w-4xl max-h-[90vh] relative border border-border overflow-y-auto">
            <button
              className="absolute top-4 right-4 text-destructive hover:text-destructive/80 text-2xl font-bold"
              onClick={() => setShowForm(false)}
              aria-label="Cerrar"
              type="button"
            >
              &times;
            </button>
            <h3 className="text-2xl font-bold mb-4 text-foreground">{false ? 'Editar Receta' : 'Nueva Receta'}</h3>
            {/* Información general */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
              <div>
                <label className="block text-sm font-semibold mb-1 text-foreground">Producto terminado</label>
                <select
                  className="w-full px-4 py-2 rounded-lg border border-border shadow-sm bg-background text-foreground focus:border-primary"
                  value={productoSeleccionado}
                  onChange={e => setProductoSeleccionado(e.target.value)}
                >
                  <option value="">Selecciona un producto...</option>
                  {/* Si estamos editando y el producto seleccionado no está en productosDisponibles, mostrarlo al inicio */}
                  {editReceta && productoSeleccionado && !(productosDisponibles as any[]).some((prod: any) => String(prod.id) === String(productoSeleccionado)) && (
                    (() => {
                      const prod = (todosLosProductos as any[]).find((p: any) => String(p.id) === String(productoSeleccionado));
                      return prod ? <option key={prod.id + '-edit'} value={prod.id}>{prod.name}</option> : null;
                    })()
                  )}
                  {(productosDisponibles as any[]).map((prod: any, index: number) => (
                    <option key={prod.id + '-' + index} value={prod.id}>{prod.name}</option>
                  ))}
                </select>
                {productosDisponibles.length === 0 && todosLosProductos.length > 0 && (
                  <p className="text-sm text-primary mt-1">
                    Todos los productos ya tienen receta. No se pueden crear más recetas.
                  </p>
                )}
              </div>
              <div>
                <label className="block text-sm font-semibold mb-1 text-foreground">Cantidad total producida</label>
                <input
                  type="number"
                  className="w-full px-4 py-2 rounded-lg border border-border shadow-sm bg-background text-foreground focus:border-primary"
                  placeholder="Ej: 10"
                  value={cantidadTotal !== "" ? parseFloat(cantidadTotal).toString() : ""}
                  onChange={e => setCantidadTotal(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-1 text-foreground">Unidad de medida</label>
                <select className="w-full px-4 py-2 rounded-lg border border-border shadow-sm bg-background text-foreground focus:border-primary">
                  <option value="1025">Unidad</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold mb-1 text-foreground">Desperdicio general (%)</label>
                <input
                  type="number"
                  className="w-full px-4 py-2 rounded-lg border border-border shadow-sm bg-background text-foreground focus:border-primary"
                  placeholder="0"
                  min="0"
                  max="100"
                  value={wastePercent}
                  onChange={e => setWastePercent(Number(e.target.value))}
                />
              </div>
            </div>
            {/* Instrucciones */}
            <div className="mb-6">
              <label className="block text-sm font-semibold mb-1 text-foreground">Instrucciones de preparación</label>
              <textarea
                className="w-full px-4 py-2 rounded-lg border border-border shadow-sm min-h-[80px] bg-background text-foreground focus:border-primary"
                placeholder="Describe el proceso de preparación..."
                value={instructions}
                onChange={e => setInstructions(e.target.value)}
              />
            </div>
            {/* Ingredientes dinámicos */}
            <div className="mb-6">
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-semibold text-foreground">Ingredientes</label>
                <Button size="sm" variant="outline" className="!bg-purple-50 !text-purple-600 hover:!bg-purple-100 !border !border-purple-200 rounded-full" onClick={() => setShowIngredienteModal(true)}>+ Agregar Ingrediente</Button>
              </div>
              <div className="w-full overflow-x-auto rounded-xl border border-border">
                <table className="min-w-full divide-y divide-border">
                  <thead className="bg-accent/50">
                    <tr>
                      <th className="px-2 py-2 text-xs font-bold text-muted-foreground uppercase">Ingrediente</th>
                      <th className="px-2 py-2 text-xs font-bold text-muted-foreground uppercase">Grupo</th>
                      <th className="px-2 py-2 text-xs font-bold text-muted-foreground uppercase">Cantidad</th>
                      <th className="px-2 py-2 text-xs font-bold text-muted-foreground uppercase">Unidad</th>
                      <th className="px-2 py-2 text-xs font-bold text-muted-foreground uppercase">Desperdicio (%)</th>
                      <th className="px-2 py-2 text-xs font-bold text-muted-foreground uppercase">Precio unitario</th>
                      <th className="px-2 py-2 text-xs font-bold text-muted-foreground uppercase">Total</th>
                      <th className="px-2 py-2 text-xs font-bold text-muted-foreground uppercase">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="bg-card">
                    {ingredientes.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="px-2 py-4 text-center text-muted-foreground">
                          No hay ingredientes agregados. Usa el botón "Agregar Ingrediente" para comenzar.
                        </td>
                      </tr>
                    ) : (
                      ingredientes.map((ing, idx) => {
                        const precio = parseFloat(ing.precio_unitario) || 0;
                        const cantidad = parseFloat(ing.quantity) || 0;
                        const costo = precio * cantidad;
                        return (
                          <tr key={idx} className="hover:bg-accent/20">
                            <td className="px-2 py-2 whitespace-nowrap text-foreground">{ing.name || ''}</td>
                            <td className="px-2 py-2 whitespace-nowrap text-muted-foreground">{ing.group_name || ''}</td>
                            <td className="px-2 py-2 whitespace-nowrap text-muted-foreground">{Number(ing.quantity).toFixed(2)}</td>
                            <td className="px-2 py-2 whitespace-nowrap text-muted-foreground">{ing.unit_name || ''}</td>
                            <td className="px-2 py-2 whitespace-nowrap text-muted-foreground">{ing.waste_percent || 0}</td>
                            <td className="px-2 py-2 whitespace-nowrap text-muted-foreground">{precio > 0 ? `$${precio.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : '-'}</td>
                            <td className="px-2 py-2 whitespace-nowrap text-muted-foreground">{precio > 0 ? `$${costo.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : '-'}</td>
                            <td className="px-2 py-2 whitespace-nowrap text-center">
                              <Button size="sm" variant="outline" className="!bg-red-50 !text-red-600 hover:!bg-red-100 !border !border-red-200 rounded-full text-xs px-2 py-1 h-7" onClick={() => {
                                setIngredientes(ingredientes.filter((_, i) => i !== idx));
                              }}>Eliminar</Button>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
            {/* Calculadora de costos */}
            <div className="mb-6 grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-accent/30 rounded-xl p-4 flex flex-col gap-2 border border-border">
                <div className="flex justify-between font-semibold text-foreground">
                  <span>Costo total ingredientes:</span>
                  <span>${ingredientsCost.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || '0.00'}</span>
                </div>
                <div className="flex justify-between text-foreground">
                  <span>Costos extras:</span>
                  <input
                    type="number"
                    className="w-24 px-2 py-1 rounded border border-border bg-background text-foreground focus:border-primary"
                    placeholder="$0.00"
                    value={extraCost}
                    onChange={e => setExtraCost(Number(e.target.value))}
                  />
                </div>
                <div className="flex justify-between text-foreground">
                  <span>Precio final sugerido:</span>
                  <input
                    type="number"
                    className="w-24 px-2 py-1 rounded border border-border font-bold text-primary text-right bg-background focus:border-primary"
                    placeholder="$0.00"
                    value={finalPrice}
                    onChange={e => { setFinalPrice(Number(e.target.value)); setFinalPriceEdited(true); }}
                  />
                </div>
                <div className="flex justify-between text-foreground">
                  <span>Margen de ganancia:</span>
                  <span className="font-bold text-primary">{(finalPrice - ingredientsCost).toFixed(2) || '0.00'}%</span>
                </div>
              </div>
            </div>
            {/* Botones de acción */}
            <div className="flex justify-end gap-3 mt-4">
              <Button variant="outline" className="!bg-gray-50 !text-gray-600 hover:!bg-gray-100 !border !border-gray-200 rounded-full" onClick={() => {
                setShowForm(false);
                // Limpiar el formulario
                setProductoSeleccionado("");
                setCantidadTotal("");
                setWastePercent(0);
                setExtraCost(0);
                setInstructions("");
                setIngredientes([]);
                setIngredientesOriginales([]);
                setEditReceta(null);
                setFinalPrice(0);
                setFinalPriceEdited(false);
              }}>Cancelar</Button>
              <Button variant="outline" className="!bg-purple-50 !text-purple-600 hover:!bg-purple-100 !border !border-purple-200 rounded-full" onClick={() => {
                if (editReceta) {
                  // Si estamos editando, duplicar la receta actual
                  handleDuplicarReceta(editReceta);
                } else {
                  // Si estamos creando nueva, limpiar el formulario
                  setProductoSeleccionado("");
                  setCantidadTotal("");
                  setWastePercent(0);
                  setExtraCost(0);
                  setInstructions("");
                  setIngredientes([]);
                  setIngredientesOriginales([]);
                  setEditReceta(null);
                  setFinalPrice(0);
                  setFinalPriceEdited(false);
                }
              }}>Duplicar</Button>
<Button variant="outline" className="!bg-purple-300 hover:!bg-purple-400 !text-white px-8 py-2 rounded-full shadow-md font-semibold" onClick={handleGuardarReceta}>
                Guardar Receta
              </Button>
            </div>
          </div>
          {/* Modal Agregar Ingrediente */}
          {showIngredienteModal && (
            <div className="fixed inset-0 bg-black/50 z-60 flex items-center justify-center">
              <div className="bg-card rounded-2xl shadow-2xl p-8 w-full max-w-lg relative border border-border">
                <button className="absolute top-4 right-4 text-muted-foreground hover:text-destructive text-2xl" onClick={() => setShowIngredienteModal(false)}>&times;</button>
                <h4 className="text-xl font-bold mb-4 text-foreground">Agregar Ingrediente</h4>
                {/* Buscador autosuggest */}
                <div className="mb-4">
                  <label className="block text-sm font-semibold mb-1 text-foreground">Seleccionar producto</label>
                  <select
                    className="w-full px-4 py-2 rounded-lg border border-border shadow-sm bg-background text-foreground focus:border-primary"
                    value={selectedProductId}
                    onChange={e => setSelectedProductId(e.target.value)}
                  >
                    <option value="">Selecciona un producto...</option>
                    {productosConReceta.map((prod: any) => (
                      <option key={prod.id} value={prod.id}>{prod.name}</option>
                    ))}
                  </select>
                  {selectedProductId && (
                    <div className="mt-2 text-sm text-muted-foreground bg-accent/30 p-2 rounded border border-border">
                      <strong>Precio de compra:</strong> ${precioIngrediente || '0.00'}
                    </div>
                  )}
                </div>
                {/* Cantidad y unidad */}
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="block text-sm font-semibold mb-1 text-foreground">Cantidad</label>
                    <input type="number" className="w-full px-4 py-2 rounded-lg border border-border shadow-sm bg-background text-foreground focus:border-primary" placeholder="Ej: 200" value={cantidadIngrediente} onChange={e => setCantidadIngrediente(e.target.value)} />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold mb-1 text-foreground">Unidad</label>
                    <select className="w-full px-4 py-2 rounded-lg border border-border shadow-sm bg-background text-foreground focus:border-primary" value={unidadIngrediente} onChange={e => setUnidadIngrediente(e.target.value)}>
                      <option value="">Selecciona unidad...</option>
                      <option value="g">g</option>
                      <option value="kg">kg</option>
                      <option value="ml">ml</option>
                      <option value="unidad">unidad</option>
                    </select>
                  </div>
                </div>
                {/* Grupo de ingredientes */}
                <div className="mb-4">
                  <label className="block text-sm font-semibold mb-1 text-foreground">Grupo de ingredientes</label>
                  <select className="w-full px-4 py-2 rounded-lg border border-border shadow-sm bg-background text-foreground focus:border-primary" value={grupoIngrediente} onChange={e => setGrupoIngrediente(e.target.value)}>
                    <option value="">Selecciona un grupo...</option>
                    {groups.map((group: any) => (
                      <option key={group.id} value={group.id}>{group.name}</option>
                    ))}
                  </select>
                </div>
                {/* Desperdicio específico */}
                <div className="mb-6">
                  <label className="block text-sm font-semibold mb-1 text-foreground">Desperdicio (%)</label>
                  <input type="number" className="w-full px-4 py-2 rounded-lg border border-border shadow-sm bg-background text-foreground focus:border-primary" placeholder="0" min="0" max="100" value={desperdicioIngrediente} onChange={e => setDesperdicioIngrediente(e.target.value)} />
                </div>
                {/* Botones */}
                <div className="flex justify-end gap-4 mt-4">
                  <Button className="bg-gray-100 text-gray-600 hover:bg-gray-200 border border-gray-200 rounded-full" onClick={() => setShowIngredienteModal(false)}>Cancelar</Button>
<Button className="bg-purple-100 hover:bg-purple-200 text-purple-700 border border-purple-200 px-6 py-2 rounded-full shadow-md font-semibold"
                    onClick={async () => {
                      if (!selectedProductId || !cantidadIngrediente) return;
                      // Fetch del producto para obtener nombre y precio
                      let nombre_producto = "";
                      let precio_unitario = 0;
                      try {
                        const res = await fetch(`/api/products/${selectedProductId}`);
                        const data = await res.json();
                        precio_unitario = Number(data.default_purchase_price) || 0;
                        nombre_producto = data.name || "";
                      } catch {
                        precio_unitario = 0;
                        nombre_producto = "";
                      }
                      const cantidad = parseFloat(cantidadIngrediente) || 0;
                      const costo = precio_unitario * cantidad;
                      setIngredientes([
                        ...ingredientes,
                        {
                          product_id: selectedProductId,
                          name: nombre_producto,
                          quantity: cantidadIngrediente,
                          unidad: unidadIngrediente,
                          mfg_ingredient_group_id: grupoIngrediente || null,
                          waste_percent: desperdicioIngrediente || 0,
                          precio_unitario,
                          costo,
                        }
                      ]);
                      setShowIngredienteModal(false);
                      setSelectedProductId("");
                      setCantidadIngrediente("");
                      setUnidadIngrediente("");
                      setGrupoIngrediente("");
                      setDesperdicioIngrediente("");
                    }}>
                    Agregar
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
      {/* Modal Gestión de Grupos */}
      {showGruposModal && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center">
          <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-4xl relative max-h-[90vh] overflow-y-auto">
            <button className="absolute top-4 right-4 text-gray-400 hover:text-red-500 text-2xl" onClick={() => setShowGruposModal(false)}>&times;</button>
            <h3 className="text-2xl font-bold mb-6 text-gray-900">Gestión de Grupos de Ingredientes</h3>
            
            {/* Sección: Lista de Grupos */}
            <div className="mb-8">
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-lg font-semibold text-gray-800">Grupos Existentes</h4>
                <Button className="bg-green-100 text-green-700 hover:bg-green-200 px-4 py-2 rounded-full text-sm font-semibold">
                  + Nuevo Grupo
                </Button>
              </div>
              
              <div className="overflow-x-auto rounded-xl border border-gray-100">
                <table className="min-w-full divide-y divide-gray-100">
                  <thead className="bg-blue-50">
                    <tr>
                      <th className="px-4 py-3 text-xs font-bold text-gray-700 uppercase">Nombre del Grupo</th>
                      <th className="px-4 py-3 text-xs font-bold text-gray-700 uppercase">Descripción</th>
                      <th className="px-4 py-3 text-xs font-bold text-gray-700 uppercase">Ingredientes</th>
                      <th className="px-4 py-3 text-xs font-bold text-gray-700 uppercase">Fecha Creación</th>
                      <th className="px-4 py-3 text-center text-xs font-bold text-gray-700 uppercase">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-100">
                    {groups.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="px-4 py-8 text-center text-gray-500">
                          No hay grupos creados. Crea tu primer grupo para comenzar.
                        </td>
                      </tr>
                    ) : (
                      groups.map((group: any) => (
                        <tr key={group.id}>
                          <td className="px-4 py-3 whitespace-nowrap font-medium text-gray-900">{group.name}</td>
                          <td className="px-4 py-3 text-gray-700">{group.description}</td>
                          <td className="px-4 py-3 text-gray-700">{group.ingredient_count} ingredientes</td>
                          <td className="px-4 py-3 text-gray-500">{new Date(group.created_at).toLocaleDateString()}</td>
                          <td className="px-4 py-3 whitespace-nowrap text-center">
                            <Button size="sm" className="mr-2 bg-blue-100 text-blue-700 hover:bg-blue-200 rounded-full text-xs">Editar</Button>
                            <Button size="sm" className="mr-2 bg-orange-100 text-orange-700 hover:bg-orange-200 rounded-full text-xs">Asignar</Button>
                            <Button size="sm" className="bg-red-100 text-red-700 hover:bg-red-200 rounded-full text-xs">Eliminar</Button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Sección: Asignación Masiva */}
            <div className="mb-8">
              <h4 className="text-lg font-semibold text-gray-800 mb-4">Asignación Masiva de Ingredientes</h4>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Panel: Ingredientes sin grupo */}
                <div className="bg-gray-50 rounded-xl p-4">
                  <h5 className="font-semibold text-gray-800 mb-3">Ingredientes sin Grupo</h5>
                  <div className="space-y-2 max-h-40 overflow-y-auto">
                    {ungroupedIngredients.length === 0 ? (
                      <div className="p-3 text-center text-gray-400 text-sm">
                        Todos los ingredientes están asignados a grupos
                      </div>
                    ) : (
                      ungroupedIngredients.slice(0, 10).map((ingredient: any) => (
                        <div key={ingredient.id} className="flex items-center justify-between p-2 bg-white rounded-lg border">
                          <span className="text-sm">{ingredient.name}</span>
                          <Button size="sm" className="bg-blue-100 text-blue-700 hover:bg-blue-200 rounded-full text-xs">Asignar</Button>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                {/* Panel: Asignación rápida */}
                <div className="bg-orange-50 rounded-xl p-4">
                  <h5 className="font-semibold text-gray-800 mb-3">Asignación Rápida</h5>
                  <div className="space-y-3">
                    <div>
                      <label className="block text-sm font-semibold mb-1">Seleccionar Grupo</label>
                      <select className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm">
                        <option>Selecciona un grupo...</option>
                        {groups.map((group: any) => (
                          <option key={group.id} value={group.id}>{group.name}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-semibold mb-1">Ingredientes a asignar</label>
                      <div className="space-y-1">
                        {ungroupedIngredients.length === 0 ? (
                          <div className="text-gray-400 text-sm">No hay ingredientes sin grupo</div>
                        ) : (
                          ungroupedIngredients.slice(0, 8).map((ingredient: any) => (
                            <label key={ingredient.id} className="flex items-center">
                              <input type="checkbox" className="mr-2" value={ingredient.id} />
                              <span className="text-sm">{ingredient.name}</span>
                            </label>
                          ))
                        )}
                      </div>
                    </div>
                    <Button className="w-full bg-gradient-to-r from-orange-500 to-red-500 text-white px-4 py-2 rounded-full text-sm font-semibold">
                      Asignar Seleccionados
                    </Button>
                  </div>
                </div>
              </div>
            </div>

            {/* Sección: Crear Nuevo Grupo */}
            <div className="border-t pt-6">
              <h4 className="text-lg font-semibold text-gray-800 mb-4">Crear Nuevo Grupo</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold mb-1">Nombre del Grupo</label>
                  <input type="text" className="w-full px-4 py-2 rounded-lg border border-gray-200 shadow-sm" placeholder="Ej: Condimentos" />
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-1">Descripción</label>
                  <input type="text" className="w-full px-4 py-2 rounded-lg border border-gray-200 shadow-sm" placeholder="Descripción del grupo..." />
                </div>
              </div>
              <div className="mt-4 flex justify-end">
                <Button className="bg-purple-50 hover:bg-purple-100 text-purple-600 px-6 py-2 rounded-full shadow-md font-semibold">
                  Crear Grupo
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 