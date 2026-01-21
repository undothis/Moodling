/**
 * Food Tracking Types
 *
 * Comprehensive food tracking with calorie counting,
 * AI detection from journaling, and manual entry.
 */

// ============================================
// FOOD ITEM
// ============================================

export interface FoodItem {
  id: string;
  name: string;
  calories: number;           // per serving
  servingSize: string;        // "1 cup", "1 slice", etc.
  category: FoodCategory;
  tags: string[];             // Links to correlation tags
  isCustom?: boolean;         // User-added food
}

export type FoodCategory =
  | 'protein'
  | 'carbs'
  | 'vegetables'
  | 'fruits'
  | 'dairy'
  | 'fats'
  | 'snacks'
  | 'drinks'
  | 'fast_food'
  | 'sweets'
  | 'alcohol'
  | 'supplements';

// ============================================
// FOOD LOG ENTRY
// ============================================

export interface FoodLogEntry {
  id: string;
  date: string;               // YYYY-MM-DD
  time: string;               // HH:MM
  mealType: MealType;
  foodItem: FoodItem;
  servings: number;           // 0.5, 1, 2, etc.
  totalCalories: number;      // calories * servings
  source: 'manual' | 'ai_detected';
  notes?: string;
  confidence?: number;        // For AI-detected (0-1)
}

export type MealType = 'breakfast' | 'lunch' | 'dinner' | 'snack';

// ============================================
// DAILY SUMMARY
// ============================================

export interface DailyFoodSummary {
  date: string;
  entries: FoodLogEntry[];
  totalCalories: number;
  calorieGoal?: number;
  macros?: {
    protein: number;          // grams
    carbs: number;
    fat: number;
  };
  mealBreakdown: {
    breakfast: number;
    lunch: number;
    dinner: number;
    snack: number;
  };
  correlationTags: string[];  // Aggregated tags for correlation service
}

// ============================================
// USER SETTINGS
// ============================================

export interface FoodTrackingSettings {
  enabled: boolean;
  calorieGoal: number;        // Daily target
  aiDetectionEnabled: boolean; // Auto-detect from journaling
  showCaloriesInChat: boolean; // Show "logged 450 cal" in chat
  reminderTimes: {
    breakfast?: string;       // "08:00"
    lunch?: string;
    dinner?: string;
  };
}

export const DEFAULT_FOOD_SETTINGS: FoodTrackingSettings = {
  enabled: true,
  calorieGoal: 2000,
  aiDetectionEnabled: true,
  showCaloriesInChat: true,
  reminderTimes: {},
};

// ============================================
// COMMON FOODS DATABASE
// ============================================

export const COMMON_FOODS: FoodItem[] = [
  // Fast Food
  { id: 'burger', name: 'Hamburger', calories: 540, servingSize: '1 burger', category: 'fast_food', tags: ['fast_food', 'processed'] },
  { id: 'pizza_slice', name: 'Pizza Slice', calories: 285, servingSize: '1 slice', category: 'fast_food', tags: ['fast_food', 'processed'] },
  { id: 'fries', name: 'French Fries', calories: 365, servingSize: '1 medium', category: 'fast_food', tags: ['fast_food', 'fried_food'] },
  { id: 'fried_chicken', name: 'Fried Chicken', calories: 320, servingSize: '1 piece', category: 'fast_food', tags: ['fast_food', 'fried_food'] },
  { id: 'taco', name: 'Taco', calories: 210, servingSize: '1 taco', category: 'fast_food', tags: ['fast_food'] },
  { id: 'burrito', name: 'Burrito', calories: 450, servingSize: '1 burrito', category: 'fast_food', tags: ['fast_food'] },
  { id: 'hot_dog', name: 'Hot Dog', calories: 290, servingSize: '1 hot dog', category: 'fast_food', tags: ['fast_food', 'processed'] },
  { id: 'sandwich_sub', name: 'Sub Sandwich', calories: 500, servingSize: '6 inch', category: 'fast_food', tags: ['processed'] },

  // Protein
  { id: 'chicken_breast', name: 'Chicken Breast', calories: 165, servingSize: '100g', category: 'protein', tags: ['fresh_whole'] },
  { id: 'salmon', name: 'Salmon', calories: 208, servingSize: '100g', category: 'protein', tags: ['fish', 'fresh_whole'] },
  { id: 'eggs', name: 'Eggs', calories: 155, servingSize: '2 eggs', category: 'protein', tags: ['fresh_whole'] },
  { id: 'steak', name: 'Steak', calories: 271, servingSize: '100g', category: 'protein', tags: ['red_meat'] },
  { id: 'tofu', name: 'Tofu', calories: 144, servingSize: '100g', category: 'protein', tags: ['fresh_whole'] },
  { id: 'shrimp', name: 'Shrimp', calories: 99, servingSize: '100g', category: 'protein', tags: ['fish', 'fresh_whole'] },

  // Carbs
  { id: 'rice_white', name: 'White Rice', calories: 206, servingSize: '1 cup', category: 'carbs', tags: [] },
  { id: 'rice_brown', name: 'Brown Rice', calories: 216, servingSize: '1 cup', category: 'carbs', tags: ['whole_grains'] },
  { id: 'pasta', name: 'Pasta', calories: 220, servingSize: '1 cup', category: 'carbs', tags: [] },
  { id: 'bread_white', name: 'White Bread', calories: 79, servingSize: '1 slice', category: 'carbs', tags: ['processed'] },
  { id: 'bread_whole', name: 'Whole Wheat Bread', calories: 81, servingSize: '1 slice', category: 'carbs', tags: ['whole_grains'] },
  { id: 'oatmeal', name: 'Oatmeal', calories: 158, servingSize: '1 cup', category: 'carbs', tags: ['whole_grains', 'fresh_whole'] },
  { id: 'cereal', name: 'Cereal', calories: 150, servingSize: '1 cup', category: 'carbs', tags: ['processed'] },

  // Vegetables
  { id: 'salad_mixed', name: 'Mixed Salad', calories: 20, servingSize: '1 cup', category: 'vegetables', tags: ['fresh_whole', 'leafy_greens'] },
  { id: 'broccoli', name: 'Broccoli', calories: 55, servingSize: '1 cup', category: 'vegetables', tags: ['fresh_whole', 'leafy_greens'] },
  { id: 'spinach', name: 'Spinach', calories: 7, servingSize: '1 cup', category: 'vegetables', tags: ['fresh_whole', 'leafy_greens'] },
  { id: 'carrots', name: 'Carrots', calories: 52, servingSize: '1 cup', category: 'vegetables', tags: ['fresh_whole'] },
  { id: 'potato', name: 'Potato', calories: 161, servingSize: '1 medium', category: 'vegetables', tags: ['fresh_whole'] },
  { id: 'sweet_potato', name: 'Sweet Potato', calories: 103, servingSize: '1 medium', category: 'vegetables', tags: ['fresh_whole'] },

  // Fruits
  { id: 'apple', name: 'Apple', calories: 95, servingSize: '1 medium', category: 'fruits', tags: ['fruits', 'fresh_whole'] },
  { id: 'banana', name: 'Banana', calories: 105, servingSize: '1 medium', category: 'fruits', tags: ['fruits', 'fresh_whole'] },
  { id: 'orange', name: 'Orange', calories: 62, servingSize: '1 medium', category: 'fruits', tags: ['fruits', 'fresh_whole'] },
  { id: 'berries', name: 'Mixed Berries', calories: 85, servingSize: '1 cup', category: 'fruits', tags: ['fruits', 'fresh_whole'] },
  { id: 'grapes', name: 'Grapes', calories: 104, servingSize: '1 cup', category: 'fruits', tags: ['fruits', 'fresh_whole'] },

  // Dairy
  { id: 'milk', name: 'Milk', calories: 149, servingSize: '1 cup', category: 'dairy', tags: ['dairy'] },
  { id: 'yogurt', name: 'Yogurt', calories: 150, servingSize: '1 cup', category: 'dairy', tags: ['dairy'] },
  { id: 'cheese', name: 'Cheese', calories: 113, servingSize: '1 oz', category: 'dairy', tags: ['dairy'] },
  { id: 'ice_cream', name: 'Ice Cream', calories: 273, servingSize: '1 cup', category: 'dairy', tags: ['dairy', 'high_sugar'] },

  // Drinks
  { id: 'coffee', name: 'Coffee (black)', calories: 5, servingSize: '1 cup', category: 'drinks', tags: ['caffeine'] },
  { id: 'coffee_latte', name: 'Latte', calories: 190, servingSize: '16 oz', category: 'drinks', tags: ['caffeine', 'dairy'] },
  { id: 'tea', name: 'Tea', calories: 2, servingSize: '1 cup', category: 'drinks', tags: [] },
  { id: 'soda', name: 'Soda', calories: 140, servingSize: '12 oz', category: 'drinks', tags: ['soda', 'high_sugar'] },
  { id: 'juice_orange', name: 'Orange Juice', calories: 112, servingSize: '1 cup', category: 'drinks', tags: ['high_sugar'] },
  { id: 'smoothie', name: 'Smoothie', calories: 250, servingSize: '16 oz', category: 'drinks', tags: ['fruits'] },
  { id: 'water', name: 'Water', calories: 0, servingSize: '1 cup', category: 'drinks', tags: ['water'] },
  { id: 'energy_drink', name: 'Energy Drink', calories: 110, servingSize: '8 oz', category: 'drinks', tags: ['caffeine', 'high_sugar'] },

  // Alcohol
  { id: 'beer', name: 'Beer', calories: 154, servingSize: '12 oz', category: 'alcohol', tags: ['alcohol'] },
  { id: 'wine', name: 'Wine', calories: 125, servingSize: '5 oz', category: 'alcohol', tags: ['alcohol'] },
  { id: 'cocktail', name: 'Cocktail', calories: 200, servingSize: '1 drink', category: 'alcohol', tags: ['alcohol', 'high_sugar'] },
  { id: 'spirits', name: 'Spirits (neat)', calories: 97, servingSize: '1.5 oz', category: 'alcohol', tags: ['alcohol'] },

  // Snacks
  { id: 'chips', name: 'Potato Chips', calories: 152, servingSize: '1 oz', category: 'snacks', tags: ['salty_snacks', 'processed'] },
  { id: 'popcorn', name: 'Popcorn', calories: 93, servingSize: '3 cups', category: 'snacks', tags: ['whole_grains'] },
  { id: 'nuts_mixed', name: 'Mixed Nuts', calories: 172, servingSize: '1 oz', category: 'snacks', tags: ['nuts_seeds', 'fresh_whole'] },
  { id: 'crackers', name: 'Crackers', calories: 120, servingSize: '5 crackers', category: 'snacks', tags: ['processed'] },
  { id: 'protein_bar', name: 'Protein Bar', calories: 200, servingSize: '1 bar', category: 'snacks', tags: [] },

  // Sweets
  { id: 'chocolate', name: 'Chocolate', calories: 210, servingSize: '1.5 oz', category: 'sweets', tags: ['chocolate', 'high_sugar'] },
  { id: 'cookie', name: 'Cookie', calories: 160, servingSize: '1 large', category: 'sweets', tags: ['high_sugar', 'processed'] },
  { id: 'cake', name: 'Cake', calories: 350, servingSize: '1 slice', category: 'sweets', tags: ['high_sugar', 'processed'] },
  { id: 'donut', name: 'Donut', calories: 270, servingSize: '1 donut', category: 'sweets', tags: ['high_sugar', 'fried_food'] },
  { id: 'candy', name: 'Candy', calories: 140, servingSize: '1 oz', category: 'sweets', tags: ['high_sugar'] },

  // Supplements
  { id: 'protein_shake', name: 'Protein Shake', calories: 120, servingSize: '1 scoop', category: 'supplements', tags: [] },
  { id: 'vitamins', name: 'Multivitamin', calories: 0, servingSize: '1 tablet', category: 'supplements', tags: ['vitamin_d', 'calcium'] },
];

// ============================================
// AI DETECTION KEYWORDS
// ============================================

export interface FoodKeywordMap {
  foodId: string;
  keywords: string[];
  portionHints: { keyword: string; servings: number }[];
}

export const FOOD_KEYWORDS: FoodKeywordMap[] = [
  // Fast Food
  {
    foodId: 'burger',
    keywords: ['burger', 'hamburger', 'cheeseburger', 'mcdonald', 'wendy', 'five guys', 'in-n-out'],
    portionHints: [{ keyword: 'double', servings: 2 }, { keyword: 'big mac', servings: 1.5 }]
  },
  {
    foodId: 'pizza_slice',
    keywords: ['pizza', 'domino', 'papa john', 'little caesar'],
    portionHints: [{ keyword: 'whole pizza', servings: 8 }, { keyword: 'half pizza', servings: 4 }, { keyword: 'couple slices', servings: 2 }]
  },
  {
    foodId: 'fries',
    keywords: ['fries', 'french fries', 'chips'],
    portionHints: [{ keyword: 'large', servings: 1.5 }, { keyword: 'small', servings: 0.7 }]
  },
  {
    foodId: 'fried_chicken',
    keywords: ['fried chicken', 'kfc', 'popeye', 'chick-fil-a'],
    portionHints: [{ keyword: 'bucket', servings: 8 }]
  },
  {
    foodId: 'taco',
    keywords: ['taco', 'taco bell'],
    portionHints: [{ keyword: 'few tacos', servings: 3 }]
  },
  {
    foodId: 'burrito',
    keywords: ['burrito', 'chipotle', 'qdoba'],
    portionHints: [{ keyword: 'bowl', servings: 1 }]
  },

  // Drinks
  {
    foodId: 'coffee',
    keywords: ['coffee', 'espresso', 'americano', 'black coffee'],
    portionHints: [{ keyword: 'large', servings: 2 }, { keyword: 'multiple', servings: 3 }, { keyword: 'pot', servings: 6 }]
  },
  {
    foodId: 'coffee_latte',
    keywords: ['latte', 'cappuccino', 'mocha', 'starbucks', 'frappuccino', 'macchiato'],
    portionHints: [{ keyword: 'venti', servings: 1.5 }, { keyword: 'grande', servings: 1 }]
  },
  {
    foodId: 'soda',
    keywords: ['soda', 'coke', 'pepsi', 'sprite', 'dr pepper', 'mountain dew', 'soft drink'],
    portionHints: [{ keyword: 'large', servings: 2 }, { keyword: 'liter', servings: 3 }]
  },
  {
    foodId: 'energy_drink',
    keywords: ['energy drink', 'red bull', 'monster', 'rockstar', 'bang'],
    portionHints: [{ keyword: 'couple', servings: 2 }]
  },

  // Alcohol
  {
    foodId: 'beer',
    keywords: ['beer', 'brew', 'lager', 'ale', 'ipa'],
    portionHints: [{ keyword: 'few beers', servings: 3 }, { keyword: 'couple beers', servings: 2 }, { keyword: 'six pack', servings: 6 }]
  },
  {
    foodId: 'wine',
    keywords: ['wine', 'red wine', 'white wine', 'rosé', 'champagne', 'prosecco'],
    portionHints: [{ keyword: 'bottle', servings: 5 }, { keyword: 'glass', servings: 1 }, { keyword: 'couple glasses', servings: 2 }]
  },
  {
    foodId: 'cocktail',
    keywords: ['cocktail', 'margarita', 'martini', 'mojito', 'mixed drink'],
    portionHints: [{ keyword: 'few drinks', servings: 3 }]
  },

  // Healthy
  {
    foodId: 'salad_mixed',
    keywords: ['salad', 'greens', 'leafy'],
    portionHints: [{ keyword: 'big salad', servings: 2 }, { keyword: 'side salad', servings: 0.5 }]
  },
  {
    foodId: 'chicken_breast',
    keywords: ['chicken', 'grilled chicken', 'chicken breast'],
    portionHints: []
  },
  {
    foodId: 'salmon',
    keywords: ['salmon', 'fish', 'sushi'],
    portionHints: [{ keyword: 'sushi roll', servings: 0.5 }]
  },
  {
    foodId: 'oatmeal',
    keywords: ['oatmeal', 'oats', 'porridge'],
    portionHints: []
  },

  // Sweets
  {
    foodId: 'chocolate',
    keywords: ['chocolate', 'candy bar', 'snickers', 'kit kat'],
    portionHints: [{ keyword: 'whole bar', servings: 1 }, { keyword: 'piece', servings: 0.5 }]
  },
  {
    foodId: 'ice_cream',
    keywords: ['ice cream', 'gelato', 'frozen yogurt'],
    portionHints: [{ keyword: 'pint', servings: 4 }, { keyword: 'scoop', servings: 0.5 }]
  },
  {
    foodId: 'cookie',
    keywords: ['cookie', 'cookies', 'biscuit'],
    portionHints: [{ keyword: 'few cookies', servings: 3 }]
  },
  {
    foodId: 'donut',
    keywords: ['donut', 'doughnut', 'dunkin'],
    portionHints: [{ keyword: 'couple donuts', servings: 2 }]
  },
];

// ============================================
// MEAL TYPE DETECTION
// ============================================

export const MEAL_KEYWORDS: Record<MealType, string[]> = {
  breakfast: ['breakfast', 'morning', 'woke up', 'started the day'],
  lunch: ['lunch', 'midday', 'noon', 'afternoon'],
  dinner: ['dinner', 'supper', 'evening meal', 'tonight'],
  snack: ['snack', 'snacking', 'munchies', 'late night', 'midnight'],
};

// ============================================
// FOOD TRACKING DATA STORE
// ============================================

export interface FoodTrackingData {
  settings: FoodTrackingSettings;
  entries: FoodLogEntry[];
  customFoods: FoodItem[];
  lastUpdated: string;
}

export function createEmptyFoodTrackingData(): FoodTrackingData {
  return {
    settings: DEFAULT_FOOD_SETTINGS,
    entries: [],
    customFoods: [],
    lastUpdated: new Date().toISOString(),
  };
}
