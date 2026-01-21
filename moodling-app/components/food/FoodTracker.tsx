/**
 * Food Tracker Component
 *
 * Quick food logging with calorie counting.
 * Features:
 * - Search common foods
 * - Quick-tap recent foods
 * - Daily calorie summary
 * - Meal breakdown
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  TextInput,
  Alert,
  ActivityIndicator,
} from 'react-native';
import {
  FoodItem,
  FoodLogEntry,
  MealType,
  COMMON_FOODS,
  FoodCategory,
} from '../../types/FoodTracking';
import {
  logFood,
  searchFoods,
  getRecentFoods,
  getTodaySummary,
  getTodayCalorieProgress,
  deleteFoodEntry,
  getFoodsByCategory,
} from '../../services/foodTrackingService';

// ============================================
// TYPES
// ============================================

interface FoodTrackerProps {
  onClose?: () => void;
  onFoodLogged?: (entry: FoodLogEntry) => void;
}

type ViewMode = 'summary' | 'add' | 'search';

// ============================================
// COMPONENT
// ============================================

export function FoodTracker({ onClose, onFoodLogged }: FoodTrackerProps) {
  const [viewMode, setViewMode] = useState<ViewMode>('summary');
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<FoodItem[]>([]);
  const [recentFoods, setRecentFoods] = useState<FoodItem[]>([]);
  const [todayEntries, setTodayEntries] = useState<FoodLogEntry[]>([]);
  const [calorieProgress, setCalorieProgress] = useState({
    consumed: 0,
    goal: 2000,
    remaining: 2000,
    percentage: 0,
  });
  const [selectedMeal, setSelectedMeal] = useState<MealType>('snack');
  const [selectedCategory, setSelectedCategory] = useState<FoodCategory | null>(null);

  // Load data on mount
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [summary, progress, recent] = await Promise.all([
        getTodaySummary(),
        getTodayCalorieProgress(),
        getRecentFoods(8),
      ]);
      setTodayEntries(summary.entries);
      setCalorieProgress(progress);
      setRecentFoods(recent);
    } catch (error) {
      console.error('[FoodTracker] Failed to load:', error);
    } finally {
      setLoading(false);
    }
  };

  // Search handler
  useEffect(() => {
    if (searchQuery.length >= 2) {
      const results = searchFoods(searchQuery);
      setSearchResults(results);
    } else {
      setSearchResults([]);
    }
  }, [searchQuery]);

  // Log food handler
  const handleLogFood = useCallback(
    async (food: FoodItem, servings: number = 1) => {
      try {
        const entry = await logFood(food, servings, selectedMeal);
        await loadData(); // Refresh
        onFoodLogged?.(entry);
        setViewMode('summary');
        setSearchQuery('');
      } catch (error) {
        Alert.alert('Error', 'Failed to log food');
      }
    },
    [selectedMeal, onFoodLogged]
  );

  // Delete entry handler
  const handleDeleteEntry = useCallback(async (entryId: string) => {
    Alert.alert('Delete Entry', 'Remove this food entry?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          await deleteFoodEntry(entryId);
          await loadData();
        },
      },
    ]);
  }, []);

  // ============================================
  // RENDER: Loading
  // ============================================

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#8b7cf7" />
          <Text style={styles.loadingText}>Loading...</Text>
        </View>
      </View>
    );
  }

  // ============================================
  // RENDER: Summary View
  // ============================================

  const renderSummary = () => (
    <>
      {/* Calorie Progress */}
      <View style={styles.calorieCard}>
        <View style={styles.calorieHeader}>
          <Text style={styles.calorieTitle}>Today's Calories</Text>
          <Text style={styles.calorieGoal}>Goal: {calorieProgress.goal}</Text>
        </View>

        <View style={styles.calorieDisplay}>
          <Text style={styles.calorieNumber}>{calorieProgress.consumed}</Text>
          <Text style={styles.calorieUnit}>cal</Text>
        </View>

        <View style={styles.progressBarContainer}>
          <View style={styles.progressBar}>
            <View
              style={[
                styles.progressFill,
                {
                  width: `${Math.min(100, calorieProgress.percentage)}%`,
                  backgroundColor:
                    calorieProgress.percentage > 100 ? '#ef4444' : '#8b7cf7',
                },
              ]}
            />
          </View>
          <Text style={styles.progressText}>
            {calorieProgress.remaining > 0
              ? `${calorieProgress.remaining} cal remaining`
              : `${Math.abs(calorieProgress.remaining)} cal over`}
          </Text>
        </View>
      </View>

      {/* Add Food Button */}
      <TouchableOpacity
        style={styles.addButton}
        onPress={() => setViewMode('add')}
      >
        <Text style={styles.addButtonIcon}>+</Text>
        <Text style={styles.addButtonText}>Add Food</Text>
      </TouchableOpacity>

      {/* Today's Entries */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Today's Food</Text>
        {todayEntries.length === 0 ? (
          <Text style={styles.emptyText}>No food logged yet today</Text>
        ) : (
          todayEntries.map((entry) => (
            <TouchableOpacity
              key={entry.id}
              style={styles.entryRow}
              onLongPress={() => handleDeleteEntry(entry.id)}
            >
              <View style={styles.entryInfo}>
                <Text style={styles.entryName}>{entry.foodItem.name}</Text>
                <Text style={styles.entryDetails}>
                  {entry.servings !== 1 && `${entry.servings}x `}
                  {entry.mealType} • {entry.time}
                  {entry.source === 'ai_detected' && ' • AI detected'}
                </Text>
              </View>
              <Text style={styles.entryCalories}>{entry.totalCalories}</Text>
            </TouchableOpacity>
          ))
        )}
      </View>
    </>
  );

  // ============================================
  // RENDER: Add Food View
  // ============================================

  const renderAddFood = () => (
    <>
      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search foods..."
          placeholderTextColor="#666"
          value={searchQuery}
          onChangeText={setSearchQuery}
          autoFocus
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity
            style={styles.clearButton}
            onPress={() => setSearchQuery('')}
          >
            <Text style={styles.clearButtonText}>✕</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Meal Type Selector */}
      <View style={styles.mealSelector}>
        {(['breakfast', 'lunch', 'dinner', 'snack'] as MealType[]).map((meal) => (
          <TouchableOpacity
            key={meal}
            style={[
              styles.mealButton,
              selectedMeal === meal && styles.mealButtonSelected,
            ]}
            onPress={() => setSelectedMeal(meal)}
          >
            <Text
              style={[
                styles.mealButtonText,
                selectedMeal === meal && styles.mealButtonTextSelected,
              ]}
            >
              {meal.charAt(0).toUpperCase() + meal.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Search Results */}
      {searchResults.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Search Results</Text>
          {searchResults.map((food) => (
            <FoodItemRow
              key={food.id}
              food={food}
              onPress={() => handleLogFood(food)}
            />
          ))}
        </View>
      )}

      {/* Recent Foods */}
      {searchQuery.length < 2 && recentFoods.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Recent</Text>
          {recentFoods.map((food) => (
            <FoodItemRow
              key={food.id}
              food={food}
              onPress={() => handleLogFood(food)}
            />
          ))}
        </View>
      )}

      {/* Category Quick Select */}
      {searchQuery.length < 2 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Browse by Category</Text>
          <View style={styles.categoryGrid}>
            {(
              [
                { id: 'fast_food', emoji: '🍔', label: 'Fast Food' },
                { id: 'protein', emoji: '🍗', label: 'Protein' },
                { id: 'carbs', emoji: '🍞', label: 'Carbs' },
                { id: 'vegetables', emoji: '🥗', label: 'Veggies' },
                { id: 'fruits', emoji: '🍎', label: 'Fruits' },
                { id: 'drinks', emoji: '☕', label: 'Drinks' },
                { id: 'snacks', emoji: '🍿', label: 'Snacks' },
                { id: 'sweets', emoji: '🍫', label: 'Sweets' },
              ] as { id: FoodCategory; emoji: string; label: string }[]
            ).map((cat) => (
              <TouchableOpacity
                key={cat.id}
                style={[
                  styles.categoryButton,
                  selectedCategory === cat.id && styles.categoryButtonSelected,
                ]}
                onPress={() =>
                  setSelectedCategory(
                    selectedCategory === cat.id ? null : cat.id
                  )
                }
              >
                <Text style={styles.categoryEmoji}>{cat.emoji}</Text>
                <Text style={styles.categoryLabel}>{cat.label}</Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Category Items */}
          {selectedCategory && (
            <View style={styles.categoryItems}>
              {getFoodsByCategory(selectedCategory).map((food) => (
                <FoodItemRow
                  key={food.id}
                  food={food}
                  onPress={() => handleLogFood(food)}
                />
              ))}
            </View>
          )}
        </View>
      )}

      {/* Back Button */}
      <TouchableOpacity
        style={styles.backButton}
        onPress={() => {
          setViewMode('summary');
          setSearchQuery('');
          setSelectedCategory(null);
        }}
      >
        <Text style={styles.backButtonText}>← Back to Summary</Text>
      </TouchableOpacity>
    </>
  );

  // ============================================
  // MAIN RENDER
  // ============================================

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>
          {viewMode === 'summary' ? '🍽️ Food Tracker' : '➕ Add Food'}
        </Text>
        {onClose && (
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Text style={styles.closeText}>Done</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Content */}
      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {viewMode === 'summary' && renderSummary()}
        {viewMode === 'add' && renderAddFood()}
      </ScrollView>
    </View>
  );
}

// ============================================
// FOOD ITEM ROW COMPONENT
// ============================================

function FoodItemRow({
  food,
  onPress,
}: {
  food: FoodItem;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity style={styles.foodRow} onPress={onPress}>
      <View style={styles.foodInfo}>
        <Text style={styles.foodName}>{food.name}</Text>
        <Text style={styles.foodServing}>{food.servingSize}</Text>
      </View>
      <View style={styles.foodCalories}>
        <Text style={styles.foodCaloriesNumber}>{food.calories}</Text>
        <Text style={styles.foodCaloriesUnit}>cal</Text>
      </View>
    </TouchableOpacity>
  );
}

// ============================================
// STYLES
// ============================================

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a2e',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: '#888',
    marginTop: 12,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#2a2a4a',
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    color: '#fff',
  },
  closeButton: {
    padding: 8,
  },
  closeText: {
    color: '#8b7cf7',
    fontSize: 16,
    fontWeight: '500',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  calorieCard: {
    backgroundColor: '#2a2a4a',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
  },
  calorieHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  calorieTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#aaa',
  },
  calorieGoal: {
    fontSize: 14,
    color: '#888',
  },
  calorieDisplay: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: 16,
  },
  calorieNumber: {
    fontSize: 48,
    fontWeight: '700',
    color: '#fff',
  },
  calorieUnit: {
    fontSize: 20,
    color: '#888',
    marginLeft: 8,
  },
  progressBarContainer: {
    gap: 8,
  },
  progressBar: {
    height: 8,
    backgroundColor: '#3a3a5a',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  progressText: {
    fontSize: 14,
    color: '#888',
    textAlign: 'center',
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#8b7cf7',
    paddingVertical: 14,
    borderRadius: 12,
    marginBottom: 20,
    gap: 8,
  },
  addButtonIcon: {
    fontSize: 24,
    color: '#fff',
    fontWeight: '600',
  },
  addButtonText: {
    fontSize: 16,
    color: '#fff',
    fontWeight: '600',
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 12,
  },
  emptyText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    paddingVertical: 20,
  },
  entryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#2a2a4a',
  },
  entryInfo: {
    flex: 1,
  },
  entryName: {
    fontSize: 16,
    color: '#fff',
  },
  entryDetails: {
    fontSize: 12,
    color: '#888',
    marginTop: 2,
  },
  entryCalories: {
    fontSize: 18,
    fontWeight: '600',
    color: '#8b7cf7',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2a2a4a',
    borderRadius: 12,
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 14,
    fontSize: 16,
    color: '#fff',
  },
  clearButton: {
    padding: 8,
  },
  clearButtonText: {
    color: '#888',
    fontSize: 16,
  },
  mealSelector: {
    flexDirection: 'row',
    marginBottom: 16,
    gap: 8,
  },
  mealButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: '#2a2a4a',
    alignItems: 'center',
  },
  mealButtonSelected: {
    backgroundColor: '#8b7cf7',
  },
  mealButtonText: {
    fontSize: 12,
    color: '#888',
    fontWeight: '500',
  },
  mealButtonTextSelected: {
    color: '#fff',
  },
  foodRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#2a2a4a',
  },
  foodInfo: {
    flex: 1,
  },
  foodName: {
    fontSize: 16,
    color: '#fff',
  },
  foodServing: {
    fontSize: 12,
    color: '#888',
    marginTop: 2,
  },
  foodCalories: {
    alignItems: 'flex-end',
  },
  foodCaloriesNumber: {
    fontSize: 18,
    fontWeight: '600',
    color: '#8b7cf7',
  },
  foodCaloriesUnit: {
    fontSize: 10,
    color: '#888',
  },
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  categoryButton: {
    width: '23%',
    aspectRatio: 1,
    backgroundColor: '#2a2a4a',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#3a3a5a',
  },
  categoryButtonSelected: {
    borderColor: '#8b7cf7',
    backgroundColor: '#3a3a6a',
  },
  categoryEmoji: {
    fontSize: 24,
    marginBottom: 4,
  },
  categoryLabel: {
    fontSize: 10,
    color: '#aaa',
  },
  categoryItems: {
    marginTop: 16,
  },
  backButton: {
    paddingVertical: 16,
    alignItems: 'center',
  },
  backButtonText: {
    color: '#8b7cf7',
    fontSize: 16,
  },
});

export default FoodTracker;
