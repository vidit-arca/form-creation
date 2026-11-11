import React, { useState, useEffect, useCallback } from 'react';
import { matchFoodItem, searchFoodItems } from '../services/svasthyamApi';
import debounce from 'lodash.debounce';

const DEFAULT_MEAL_SLOTS = [
  'Early Morning',
  'Breakfast',
  'Mid-Morning',
  'Lunch',
  'Evening Snack',
  'Dinner',
  'Bedtime',
];

export function DietaryRecallField({ field, onChange, value }) {
  const mealSlots = field?.config?.mealSlots || DEFAULT_MEAL_SLOTS;
  const allowCustom = field?.config?.allowCustomItems !== false;

  const [meals, setMeals] = useState(() => {
    if (value && Array.isArray(value.meals) && value.meals.length > 0) return value.meals;
    return mealSlots.map((slot) => ({
      meal_type: slot,
      raw_description: '',
      matched_items: [],
    }));
  });

  const [loadingSlot, setLoadingSlot] = useState(null);
  const [expandedSlot, setExpandedSlot] = useState(mealSlots[1] || mealSlots[0]); 
  const [slotFeedback, setSlotFeedback] = useState({});
  const [suggestions, setSuggestions] = useState({});
  const [loadingSuggestions, setLoadingSuggestions] = useState({});
  const [activeSuggestionId, setActiveSuggestionId] = useState(null);

  const updateMeals = (updated) => {
    setMeals(updated);
    onChange && onChange({ meals: updated });
  };

  const fetchSuggestions = useCallback(
    debounce(async (slotName, itemIndex, text) => {
      if (!text || text.length < 2) {
        setSuggestions((prev) => ({ ...prev, [`${slotName}-${itemIndex}`]: [] }));
        return;
      }
      
      const key = `${slotName}-${itemIndex}`;
      setLoadingSuggestions((prev) => ({ ...prev, [key]: true }));
      try {
        // Use direct search for autocomplete — faster than full NLP matching
        const matches = await searchFoodItems(text, 8);
        setSuggestions((prev) => ({ ...prev, [key]: matches || [] }));
      } catch (err) {
        console.error('Fetch suggestions error:', err);
      } finally {
        setLoadingSuggestions((prev) => ({ ...prev, [key]: false }));
      }
    }, 400),
    []
  );

  const handleDescriptionChange = (slotName, text) => {
    const updated = meals.map((m) =>
      m.meal_type === slotName ? { ...m, raw_description: text } : m
    );
    updateMeals(updated);
  };

  const handleMatchItems = async (slotName) => {
    const meal = meals.find((m) => m.meal_type === slotName);
    if (!meal?.raw_description.trim()) return;

    setLoadingSlot(slotName);
    setSlotFeedback((prev) => ({ ...prev, [slotName]: null }));

    try {
      const matches = await matchFoodItem(meal.raw_description);

      if (!matches || matches.length === 0) {
        setSlotFeedback((prev) => ({
          ...prev,
          [slotName]: { type: 'error', text: 'No matching items found for this description. Try simple item names like "2 rotis and 1 cup dal", or use + Add custom food item below.' },
        }));
      } else {
        const updated = meals.map((m) => {
          if (m.meal_type !== slotName) return m;
          const existing = m.matched_items || [];
          const combined = [...existing];
          for (const match of matches) {
            const idx = combined.findIndex((i) => i.matchedItemId && i.matchedItemId === match.matchedItemId);
            if (idx >= 0) {
              combined[idx] = { ...combined[idx], ...match };
            } else {
              combined.push(match);
            }
          }
          return { ...m, matched_items: combined };
        });
        updateMeals(updated);
        setSlotFeedback((prev) => ({
          ...prev,
          [slotName]: { type: 'success', text: `Successfully matched ${matches.length} food item${matches.length > 1 ? 's' : ''}!` },
        }));
      }
    } catch (err) {
      console.error('Match items error:', err);
      setSlotFeedback((prev) => ({
        ...prev,
        [slotName]: { type: 'error', text: 'Unable to connect to food matching server. Please check your network connection.' },
      }));
    } finally {
      setLoadingSlot(null);
    }
  };

  const handleQuantityChange = (slotName, itemIndex, qty) => {
    const updated = meals.map((m) => {
      if (m.meal_type !== slotName) return m;
      const items = m.matched_items.map((item, idx) =>
        idx === itemIndex ? { ...item, quantity: qty } : item
      );
      return { ...m, matched_items: items };
    });
    updateMeals(updated);
  };

  const handleRemoveItem = (slotName, itemIndex) => {
    const updated = meals.map((m) => {
      if (m.meal_type !== slotName) return m;
      return { ...m, matched_items: m.matched_items.filter((_, idx) => idx !== itemIndex) };
    });
    updateMeals(updated);
    setSuggestions((prev) => {
      const newObj = { ...prev };
      delete newObj[`${slotName}-${itemIndex}`];
      return newObj;
    });
  };

  const handleAddCustomItem = (slotName) => {
    const updated = meals.map((m) => {
      if (m.meal_type !== slotName) return m;
      return {
        ...m,
        matched_items: [
          ...m.matched_items,
          { foodItem: '', quantity: 1, portion_unit: '', matchedItemId: null, similarityScore: null, isCustom: true },
        ],
      };
    });
    updateMeals(updated);
  };

  const handleCustomItemChange = (slotName, itemIndex, field, val) => {
    const updated = meals.map((m) => {
      if (m.meal_type !== slotName) return m;
      const items = m.matched_items.map((item, idx) =>
        idx === itemIndex ? { ...item, [field]: val } : item
      );
      return { ...m, matched_items: items };
    });
    updateMeals(updated);
    
    if (field === 'foodItem') {
      setActiveSuggestionId(`${slotName}-${itemIndex}`);
      fetchSuggestions(slotName, itemIndex, val);
    }
  };

  const handleSelectSuggestion = (slotName, itemIndex, suggestion) => {
    const updated = meals.map((m) => {
      if (m.meal_type !== slotName) return m;
      const items = m.matched_items.map((item, idx) =>
        idx === itemIndex ? { 
          ...item, 
          foodItem: suggestion.foodItem, 
          matchedItemId: suggestion.matchedItemId,
          portion_unit: suggestion.portion_unit || '',
          similarityScore: suggestion.similarityScore
        } : item
      );
      return { ...m, matched_items: items };
    });
    updateMeals(updated);
    setActiveSuggestionId(null);
    setSuggestions((prev) => ({ ...prev, [`${slotName}-${itemIndex}`]: [] }));
  };

  const getTotalItemCount = (meal) => meal.matched_items.length;

  return (
    <div className="space-y-3">
      {meals.map((meal) => {
        const isExpanded = expandedSlot === meal.meal_type;
        const itemCount = getTotalItemCount(meal);

        return (
          <div key={meal.meal_type} className="border border-gray-200 rounded-xl shadow-sm">
            {/* Accordion Header */}
            <button
              type="button"
              onClick={() => setExpandedSlot(isExpanded ? null : meal.meal_type)}
              className="w-full flex items-center justify-between px-4 py-3 bg-gray-50 hover:bg-emerald-50 transition-colors rounded-t-xl"
            >
              <div className="flex items-center gap-3">
                <span className="text-base font-semibold text-gray-700">{meal.meal_type}</span>
                {itemCount > 0 && (
                  <span className="bg-emerald-100 text-emerald-700 text-xs font-bold px-2 py-0.5 rounded-full">
                    {itemCount} item{itemCount > 1 ? 's' : ''} added
                  </span>
                )}
              </div>
              <svg className={`w-5 h-5 text-gray-500 transition-transform ${isExpanded ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {/* Accordion Body */}
            {isExpanded && (
              <div className="p-4 bg-white space-y-4">
                {/* Matched / Custom Items Table */}
                {meal.matched_items.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Confirmed Food Items</p>
                    <div className="grid grid-cols-12 gap-2 text-[11px] font-bold text-gray-400 uppercase tracking-wider px-3 py-1">
                      <span className="col-span-6">Food Name</span>
                      <span className="col-span-3 text-center">Quantity</span>
                      <span className="col-span-2">Unit</span>
                      <span className="col-span-1 text-center"></span>
                    </div>

                    <div className="space-y-2 pr-1 border border-emerald-100 rounded-xl p-2 bg-emerald-50/40">
                      {meal.matched_items.map((item, idx) => {
                        const key = `${meal.meal_type}-${idx}`;
                        const isTyping = activeSuggestionId === key;
                        const itemSuggestions = suggestions[key] || [];
                        const isLoading = loadingSuggestions[key];

                        return (
                          <div key={idx} className="grid grid-cols-12 gap-2 items-start bg-white border border-emerald-100 rounded-lg px-3 py-2 shadow-sm text-sm">
                            <div className="col-span-6 flex flex-col relative">
                              {item.isCustom ? (
                                <>
                                  <input
                                    type="text"
                                    value={item.foodItem}
                                    onFocus={() => setActiveSuggestionId(key)}
                                    onChange={(e) => handleCustomItemChange(meal.meal_type, idx, 'foodItem', e.target.value)}
                                    placeholder="Enter food name"
                                    className="w-full text-sm bg-gray-50 border border-gray-300 rounded px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                                  />
                                  {isTyping && (isLoading || itemSuggestions.length > 0) && (
                                    <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-xl z-50 max-h-48 overflow-y-auto">
                                      {isLoading ? (
                                        <div className="p-2 text-xs text-gray-500 flex items-center justify-center gap-2">
                                          <svg className="w-3 h-3 animate-spin text-emerald-500" fill="none" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" className="opacity-25" /><path fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" className="opacity-75" /></svg>
                                          Searching...
                                        </div>
                                      ) : itemSuggestions.length > 0 ? (
                                        itemSuggestions.map((s, i) => (
                                          <button
                                            key={i}
                                            type="button"
                                            onClick={() => handleSelectSuggestion(meal.meal_type, idx, s)}
                                            className="w-full text-left px-3 py-2 hover:bg-emerald-50 border-b border-gray-50 last:border-0"
                                          >
                                            <div className="font-medium text-sm text-gray-800">{s.foodItem}</div>
                                            {s.portion_unit && <div className="text-xs text-gray-500">Unit: {s.portion_unit}</div>}
                                          </button>
                                        ))
                                      ) : null}
                                    </div>
                                  )}
                                </>
                              ) : (
                                <span className="font-medium text-gray-800 break-words py-1.5" title={item.foodItem}>
                                  {item.foodItem}
                                  {item.similarityScore && (
                                    <span className="ml-1 text-[11px] text-emerald-600 font-normal">({Math.round(item.similarityScore * 100)}%)</span>
                                  )}
                                </span>
                              )}
                            </div>

                            <div className="col-span-3 flex items-center justify-center pt-0.5">
                              <input
                                type="number"
                                min={0.25}
                                step={0.25}
                                value={item.quantity}
                                onChange={(e) => handleQuantityChange(meal.meal_type, idx, parseFloat(e.target.value) || 1)}
                                className="w-16 text-sm text-center font-semibold bg-gray-50 border border-gray-300 rounded px-1 py-1.5 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                              />
                            </div>

                            <div className="col-span-2 flex items-center pt-0.5">
                              {item.isCustom ? (
                                <input
                                  type="text"
                                  value={item.portion_unit}
                                  onChange={(e) => handleCustomItemChange(meal.meal_type, idx, 'portion_unit', e.target.value)}
                                  placeholder="unit"
                                  className="w-full text-sm bg-gray-50 border border-gray-300 rounded px-1.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                                />
                              ) : (
                                <span className="text-xs text-gray-500 break-words py-1.5" title={item.portion_unit || 'serving'}>{item.portion_unit || 'serving'}</span>
                              )}
                            </div>

                            <div className="col-span-1 flex items-center justify-center pt-1.5">
                              <button type="button" onClick={() => handleRemoveItem(meal.meal_type, idx)} className="text-red-400 hover:text-red-600 p-1 transition-colors" title="Remove item">
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {allowCustom && (
                  <button type="button" onClick={() => handleAddCustomItem(meal.meal_type)} className="text-sm text-emerald-600 hover:text-emerald-800 font-medium flex items-center gap-1 transition-colors">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                    Add food item
                  </button>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
