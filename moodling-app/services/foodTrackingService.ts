/**
 * Food Tracking Service
 *
 * Comprehensive food and calorie tracking with:
 * - Manual food logging
 * - AI detection from journal entries
 * - Calorie counting and daily summaries
 * - Integration with period correlation service
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  FoodItem,
  FoodLogEntry,
  FoodTrackingData,
  FoodTrackingSettings,
  DailyFoodSummary,
  MealType,
  COMMON_FOODS,
  FOOD_KEYWORDS,
  MEAL_KEYWORDS,
  DEFAULT_FOOD_SETTINGS,
  createEmptyFoodTrackingData,
} from '../types/FoodTracking';
import { logFoodTags } from './periodCorrelationService';

// ============================================
// STORAGE
// ============================================

const STORAGE_KEY = 'moodleaf_food_tracking';

export async function getFoodTrackingData(): Promise<FoodTrackingData> {
  try {
    const stored = await AsyncStorage.getItem(STORAGE_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
    return createEmptyFoodTrackingData();
  } catch (error) {
    console.error('[FoodTracking] Error loading data:', error);
    return createEmptyFoodTrackingData();
  }
}

export async function saveFoodTrackingData(data: FoodTrackingData): Promise<void> {
  try {
    data.lastUpdated = new Date().toISOString();
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (error) {
    console.error('[FoodTracking] Error saving data:', error);
    throw error;
  }
}

// ============================================
// SETTINGS
// ============================================

export async function getFoodSettings(): Promise<FoodTrackingSettings> {
  const data = await getFoodTrackingData();
  return data.settings;
}

export async function updateFoodSettings(
  updates: Partial<FoodTrackingSettings>
): Promise<FoodTrackingSettings> {
  const data = await getFoodTrackingData();
  data.settings = { ...data.settings, ...updates };
  await saveFoodTrackingData(data);
  return data.settings;
}

// ============================================
// MANUAL FOOD LOGGING
// ============================================

/**
 * Log a food item manually
 */
export async function logFood(
  foodItem: FoodItem,
  servings: number = 1,
  mealType: MealType = 'snack',
  notes?: string
): Promise<FoodLogEntry> {
  const data = await getFoodTrackingData();
  const now = new Date();

  const entry: FoodLogEntry = {
    id: `food_${Date.now()}`,
    date: now.toISOString().split('T')[0],
    time: now.toTimeString().slice(0, 5),
    mealType,
    foodItem,
    servings,
    totalCalories: Math.round(foodItem.calories * servings),
    source: 'manual',
    notes,
  };

  data.entries.push(entry);
  await saveFoodTrackingData(data);

  // Also log to correlation service
  if (foodItem.tags.length > 0) {
    await logFoodTags(foodItem.tags);
  }

  return entry;
}

/**
 * Log food by ID from common foods database
 */
export async function logFoodById(
  foodId: string,
  servings: number = 1,
  mealType: MealType = 'snack'
): Promise<FoodLogEntry | null> {
  const food = COMMON_FOODS.find((f) => f.id === foodId);
  if (!food) {
    console.warn(`[FoodTracking] Food not found: ${foodId}`);
    return null;
  }
  return logFood(food, servings, mealType);
}

/**
 * Quick log by food name (searches common foods)
 */
export async function logFoodByName(
  name: string,
  servings: number = 1,
  mealType: MealType = 'snack'
): Promise<FoodLogEntry | null> {
  const food = COMMON_FOODS.find(
    (f) => f.name.toLowerCase() === name.toLowerCase()
  );
  if (food) {
    return logFood(food, servings, mealType);
  }
  return null;
}

/**
 * Delete a food entry
 */
export async function deleteFoodEntry(entryId: string): Promise<void> {
  const data = await getFoodTrackingData();
  data.entries = data.entries.filter((e) => e.id !== entryId);
  await saveFoodTrackingData(data);
}

/**
 * Update a food entry
 */
export async function updateFoodEntry(
  entryId: string,
  updates: Partial<Pick<FoodLogEntry, 'servings' | 'mealType' | 'notes'>>
): Promise<FoodLogEntry | null> {
  const data = await getFoodTrackingData();
  const entry = data.entries.find((e) => e.id === entryId);

  if (!entry) return null;

  if (updates.servings !== undefined) {
    entry.servings = updates.servings;
    entry.totalCalories = Math.round(entry.foodItem.calories * updates.servings);
  }
  if (updates.mealType) entry.mealType = updates.mealType;
  if (updates.notes !== undefined) entry.notes = updates.notes;

  await saveFoodTrackingData(data);
  return entry;
}

// ============================================
// AI DETECTION FROM JOURNAL
// ============================================

export interface DetectedFood {
  foodItem: FoodItem;
  servings: number;
  mealType: MealType;
  confidence: number;
  matchedText: string;
}

/**
 * Detect food mentions in journal text
 * Called automatically when user journals
 */
export async function detectFoodFromText(text: string): Promise<DetectedFood[]> {
  const settings = await getFoodSettings();
  if (!settings.enabled || !settings.aiDetectionEnabled) {
    return [];
  }

  const detected: DetectedFood[] = [];
  const lowerText = text.toLowerCase();

  // Detect meal type from context
  const mealType = detectMealType(lowerText);

  // Search for food keywords
  for (const mapping of FOOD_KEYWORDS) {
    for (const keyword of mapping.keywords) {
      if (lowerText.includes(keyword)) {
        const food = COMMON_FOODS.find((f) => f.id === mapping.foodId);
        if (!food) continue;

        // Check for portion hints
        let servings = 1;
        for (const hint of mapping.portionHints) {
          if (lowerText.includes(hint.keyword)) {
            servings = hint.servings;
            break;
          }
        }

        // Avoid duplicates
        if (!detected.find((d) => d.foodItem.id === food.id)) {
          detected.push({
            foodItem: food,
            servings,
            mealType,
            confidence: calculateConfidence(lowerText, keyword, mapping.keywords),
            matchedText: keyword,
          });
        }
        break; // Found this food, move to next
      }
    }
  }

  return detected;
}

/**
 * Detect meal type from text context
 */
function detectMealType(text: string): MealType {
  for (const [meal, keywords] of Object.entries(MEAL_KEYWORDS)) {
    for (const keyword of keywords) {
      if (text.includes(keyword)) {
        return meal as MealType;
      }
    }
  }

  // Guess based on current time
  const hour = new Date().getHours();
  if (hour >= 5 && hour < 11) return 'breakfast';
  if (hour >= 11 && hour < 15) return 'lunch';
  if (hour >= 17 && hour < 21) return 'dinner';
  return 'snack';
}

/**
 * Calculate confidence score for detection
 */
function calculateConfidence(
  text: string,
  matchedKeyword: string,
  allKeywords: string[]
): number {
  let confidence = 0.7; // Base confidence

  // Higher confidence for specific brand names
  const specificKeywords = allKeywords.filter(
    (k) => k.includes(' ') || /[A-Z]/.test(k)
  );
  if (specificKeywords.includes(matchedKeyword)) {
    confidence = 0.9;
  }

  // Higher confidence if context words present
  const contextWords = ['ate', 'had', 'eating', 'drank', 'drink', 'grabbed', 'ordered'];
  for (const word of contextWords) {
    if (text.includes(word)) {
      confidence = Math.min(1, confidence + 0.1);
      break;
    }
  }

  return confidence;
}

/**
 * Auto-log detected foods from journal text
 * Returns summary of what was logged
 */
export async function autoLogFromJournal(
  text: string
): Promise<{ logged: FoodLogEntry[]; totalCalories: number } | null> {
  const detected = await detectFoodFromText(text);

  if (detected.length === 0) {
    return null;
  }

  const logged: FoodLogEntry[] = [];
  let totalCalories = 0;

  for (const detection of detected) {
    const entry = await logFood(
      detection.foodItem,
      detection.servings,
      detection.mealType
    );
    // Mark as AI detected
    const data = await getFoodTrackingData();
    const savedEntry = data.entries.find((e) => e.id === entry.id);
    if (savedEntry) {
      savedEntry.source = 'ai_detected';
      savedEntry.confidence = detection.confidence;
      await saveFoodTrackingData(data);
    }

    logged.push(entry);
    totalCalories += entry.totalCalories;
  }

  return { logged, totalCalories };
}

// ============================================
// DAILY SUMMARY
// ============================================

/**
 * Get food summary for a specific date
 */
export async function getDailySummary(date?: string): Promise<DailyFoodSummary> {
  const data = await getFoodTrackingData();
  const targetDate = date || new Date().toISOString().split('T')[0];

  const entries = data.entries.filter((e) => e.date === targetDate);

  const mealBreakdown = {
    breakfast: 0,
    lunch: 0,
    dinner: 0,
    snack: 0,
  };

  let totalCalories = 0;
  const correlationTags = new Set<string>();

  for (const entry of entries) {
    totalCalories += entry.totalCalories;
    mealBreakdown[entry.mealType] += entry.totalCalories;

    // Collect correlation tags
    entry.foodItem.tags.forEach((tag) => correlationTags.add(tag));
  }

  return {
    date: targetDate,
    entries,
    totalCalories,
    calorieGoal: data.settings.calorieGoal,
    mealBreakdown,
    correlationTags: Array.from(correlationTags),
  };
}

/**
 * Get today's summary
 */
export async function getTodaySummary(): Promise<DailyFoodSummary> {
  return getDailySummary();
}

/**
 * Get calorie progress for today
 */
export async function getTodayCalorieProgress(): Promise<{
  consumed: number;
  goal: number;
  remaining: number;
  percentage: number;
}> {
  const summary = await getTodaySummary();

  return {
    consumed: summary.totalCalories,
    goal: summary.calorieGoal || 2000,
    remaining: Math.max(0, (summary.calorieGoal || 2000) - summary.totalCalories),
    percentage: Math.round(
      (summary.totalCalories / (summary.calorieGoal || 2000)) * 100
    ),
  };
}

// ============================================
// FOOD SEARCH
// ============================================

/**
 * Search common foods database
 */
export function searchFoods(query: string): FoodItem[] {
  const lowerQuery = query.toLowerCase();
  return COMMON_FOODS.filter(
    (food) =>
      food.name.toLowerCase().includes(lowerQuery) ||
      food.category.includes(lowerQuery)
  ).slice(0, 20); // Limit results
}

/**
 * Get foods by category
 */
export function getFoodsByCategory(category: FoodItem['category']): FoodItem[] {
  return COMMON_FOODS.filter((food) => food.category === category);
}

/**
 * Get recent foods (most logged)
 */
export async function getRecentFoods(limit: number = 10): Promise<FoodItem[]> {
  const data = await getFoodTrackingData();

  // Count food occurrences
  const counts = new Map<string, number>();
  for (const entry of data.entries) {
    const id = entry.foodItem.id;
    counts.set(id, (counts.get(id) || 0) + 1);
  }

  // Sort by count and return top items
  const sorted = Array.from(counts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit);

  return sorted
    .map(([id]) => COMMON_FOODS.find((f) => f.id === id))
    .filter((f): f is FoodItem => f !== undefined);
}

// ============================================
// CUSTOM FOODS
// ============================================

/**
 * Add a custom food item
 */
export async function addCustomFood(
  food: Omit<FoodItem, 'id' | 'isCustom'>
): Promise<FoodItem> {
  const data = await getFoodTrackingData();

  const customFood: FoodItem = {
    ...food,
    id: `custom_${Date.now()}`,
    isCustom: true,
  };

  data.customFoods.push(customFood);
  await saveFoodTrackingData(data);

  return customFood;
}

/**
 * Get all custom foods
 */
export async function getCustomFoods(): Promise<FoodItem[]> {
  const data = await getFoodTrackingData();
  return data.customFoods;
}

/**
 * Delete a custom food
 */
export async function deleteCustomFood(foodId: string): Promise<void> {
  const data = await getFoodTrackingData();
  data.customFoods = data.customFoods.filter((f) => f.id !== foodId);
  await saveFoodTrackingData(data);
}

// ============================================
// HISTORY & STATS
// ============================================

/**
 * Get entries for a date range
 */
export async function getEntriesForRange(
  startDate: string,
  endDate: string
): Promise<FoodLogEntry[]> {
  const data = await getFoodTrackingData();
  return data.entries.filter(
    (e) => e.date >= startDate && e.date <= endDate
  );
}

/**
 * Get weekly calorie average
 */
export async function getWeeklyAverage(): Promise<number> {
  const today = new Date();
  const weekAgo = new Date(today);
  weekAgo.setDate(weekAgo.getDate() - 7);

  const entries = await getEntriesForRange(
    weekAgo.toISOString().split('T')[0],
    today.toISOString().split('T')[0]
  );

  const totalCalories = entries.reduce((sum, e) => sum + e.totalCalories, 0);
  return Math.round(totalCalories / 7);
}

/**
 * Get food tracking stats
 */
export async function getFoodStats(): Promise<{
  totalEntries: number;
  daysTracked: number;
  avgDailyCalories: number;
  mostLoggedFood: FoodItem | null;
  totalCaloriesAllTime: number;
}> {
  const data = await getFoodTrackingData();

  // Count unique days
  const uniqueDays = new Set(data.entries.map((e) => e.date));

  // Find most logged food
  const counts = new Map<string, number>();
  let totalCalories = 0;

  for (const entry of data.entries) {
    counts.set(entry.foodItem.id, (counts.get(entry.foodItem.id) || 0) + 1);
    totalCalories += entry.totalCalories;
  }

  const mostLoggedId = Array.from(counts.entries())
    .sort((a, b) => b[1] - a[1])[0]?.[0];

  const mostLoggedFood = mostLoggedId
    ? COMMON_FOODS.find((f) => f.id === mostLoggedId) || null
    : null;

  return {
    totalEntries: data.entries.length,
    daysTracked: uniqueDays.size,
    avgDailyCalories:
      uniqueDays.size > 0 ? Math.round(totalCalories / uniqueDays.size) : 0,
    mostLoggedFood,
    totalCaloriesAllTime: totalCalories,
  };
}

// ============================================
// CLEAR DATA
// ============================================

/**
 * Clear all food tracking data
 */
export async function clearFoodTrackingData(): Promise<void> {
  await AsyncStorage.removeItem(STORAGE_KEY);
}

/**
 * Export food tracking data
 */
export async function exportFoodTrackingData(): Promise<string> {
  const data = await getFoodTrackingData();
  return JSON.stringify(data, null, 2);
}
