/**
 * Anuvaad Food API Service
 * Connects to the Anuvaad Food Dataset via the internal cluster food-api microservice.
 * Routed through Nginx Gateway at /api/food/
 *
 * Used by the 24-Hour Dietary Recall Field component (DietaryRecallField.jsx).
 *
 * Endpoints used:
 *   GET /api/food/search?q={query}&limit=10  → fuzzy food name search
 *   GET /api/food/items/{id}                  → full nutritional details
 */

// In development, the dev server proxies /api/food/ → food-api (via vite.config proxy or direct localhost)
// In production (cluster), Nginx gateway routes /api/food/ → food-api:8000
const FOOD_API_BASE = import.meta.env.VITE_FOOD_API_URL || '/api/food';

/**
 * searchFoodItems
 * Direct search by name — used for autocomplete dropdown suggestions.
 *
 * @param {string} query - Search text (e.g. "roti", "dal", "rice")
 * @param {number} limit - Max results to return (default 10)
 * @returns {Promise<Array>} - Array of matching food items
 */
export const searchFoodItems = async (query, limit = 10) => {
  if (!query || query.trim().length < 2) return [];

  try {
    const res = await fetch(
      `${FOOD_API_BASE}/search?q=${encodeURIComponent(query.trim())}&limit=${limit}`
    );

    if (!res.ok) throw new Error(`Food API responded with status ${res.status}`);

    const data = await res.json();

    // Normalize to consistent shape: { id, food_name, energy_kcal, ... }
    return (data.matches || []).map((item) => ({
      matchedItemId: String(item.id),
      food_name: item.food_name,
      food_name_hindi: item.food_name_hindi || null,
      category: item.category || null,
      serving_size: item.serving_size || '100g',
      energy_kcal: item.energy_kcal || 0,
      protein_g: item.protein_g || 0,
      carbs_g: item.carbs_g || 0,
      fat_g: item.fat_g || 0,
      fiber_g: item.fiber_g || 0,
      quantity: 1,
      unit: item.serving_size || '100g',
    }));
  } catch (error) {
    console.error('[Food API] searchFoodItems error:', error);
    return [];
  }
};

/**
 * matchFoodItem
 * Accepts a natural language description (e.g. "2 rotis and 1 bowl dal")
 * and returns matched food items by extracting keywords and searching each.
 *
 * This is the drop-in replacement for the old Firebase Cloud Function.
 * The old API did NLP server-side; we replicate the behaviour client-side
 * by tokenising the description and running parallel searches.
 *
 * @param {string} description - Natural language text e.g. "2 rotis and 1 bowl dal"
 * @returns {Promise<Array>} - Array of matched Anuvaad food items
 */
export const matchFoodItem = async (description) => {
  if (!description || description.trim().length < 2) return [];

  // Stop words to exclude from searches
  const STOP_WORDS = new Set([
    'and', 'or', 'with', 'a', 'an', 'the', 'of', 'in', 'on', 'at', 'to',
    'for', 'is', 'was', 'cup', 'bowl', 'plate', 'glass', 'piece', 'pieces',
    'slice', 'slices', 'serving', 'tbsp', 'tsp', 'ml', 'g', 'kg', 'gm',
    '1', '2', '3', '4', '5', 'one', 'two', 'three', 'four', 'five',
  ]);

  try {
    // Try a direct full-description search first (works well for short inputs like "roti")
    const directResults = await searchFoodItems(description.trim(), 5);

    // Also tokenize the description to catch multi-item inputs like "2 rotis and 1 bowl dal"
    const tokens = description
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, ' ')
      .split(/\s+/)
      .map((t) => t.trim())
      .filter((t) => t.length >= 3 && !STOP_WORDS.has(t));

    // Remove duplicates and limit to top 4 tokens
    const uniqueTokens = [...new Set(tokens)].slice(0, 4);

    // Run searches for each token in parallel
    const tokenResults = await Promise.all(
      uniqueTokens.map((token) => searchFoodItems(token, 3))
    );

    // Merge all results, deduplicate by matchedItemId
    const allResults = [...directResults, ...tokenResults.flat()];
    const seen = new Set();
    const deduplicated = allResults.filter((item) => {
      if (seen.has(item.matchedItemId)) return false;
      seen.add(item.matchedItemId);
      return true;
    });

    return deduplicated.slice(0, 10);
  } catch (error) {
    console.error('[Food API] matchFoodItem error:', error);
    throw error;
  }
};
