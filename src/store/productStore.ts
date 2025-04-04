import { create } from 'zustand';
import { productService } from '../services/productService';
import type { Product, Category } from '../types/database';

interface ProductState {
  products: Product[];
  categories: Category[];
  selectedProduct: Product | null;
  selectedCaliber: string | null;
  selectedOptions: Record<string, any>;
  optionErrors: {};
  colors: number;
  loading: boolean;
  error: string | null;
  fetchProducts: (categorySlug: string) => Promise<void>;
  fetchProduct: (productSlug: string) => Promise<void>;
  fetchCategories: () => Promise<void>;
  setSelectedProduct: (product: Product | null) => void;
  setSelectedCaliber: (caliber: string | null) => void;
  setSelectedOption: (key: string, value: any) => void;
  setColors: (count: number) => void;
  calculateTotalPrice: () => number;
  clearSelections: () => void;
  clearProducts: () => void;
}

const getCaliberActionRules = (caliber: string) => {
  // Normalize by removing extra spaces and converting to uppercase
  const normalizedCaliber = caliber.trim().toUpperCase();
  
  // Define the forbidden calibers in a consistent format
  const FORBIDDEN_CALIBERS = ['6.5 CREEDMOOR', '6.5 PRC'];
  const REQUIRED_CALIBERS = ['30 NOSLER', '7 PRC'];
  
  // Debug logging
  console.log('Input Caliber:', caliber);
  console.log('Normalized Caliber:', normalizedCaliber);
  console.log('Is 6.5 PRC:', normalizedCaliber === '6.5 PRC');
  console.log('Is in Forbidden List:', FORBIDDEN_CALIBERS.includes(normalizedCaliber));
  
  const rules = {
    requiresLongAction: REQUIRED_CALIBERS.includes(normalizedCaliber),
    forbidsLongAction: FORBIDDEN_CALIBERS.includes(normalizedCaliber)
  };
  
  console.log('Final Rules:', rules);
  return rules;
};

export const useProductStore = create<ProductState>((set, get) => ({
  products: [],
  categories: [],
  selectedProduct: null,
  selectedCaliber: null,
  selectedOptions: {},
  optionErrors: {},
  colors: 1,
  loading: false,
  error: null,

  fetchProducts: async (categorySlug) => {
    set({ loading: true, error: null });
    try {
      const result = await productService.getProductsByCategory(categorySlug);
      if (result.error) throw new Error(result.error.message);
      set({ products: result.data || [], loading: false });
    } catch (error: any) {
      set({ error: error.message, loading: false });
    }
  },

  fetchProduct: async (productSlug) => {
    // Check if we already have this product in the store
    const existingProduct = get().products.find(p => p.slug === productSlug);
    if (existingProduct) {
      set({ selectedProduct: existingProduct });
      return;
    }
    
    set({ loading: true, error: null });
    try {
      const result = await productService.getProductBySlug(productSlug);
      if (result.error) throw new Error(result.error.message);
      if (result.data) {
        set({ selectedProduct: result.data, loading: false });
      }
    } catch (error: any) {
      set({ error: error.message, loading: false });
    }
  },

  fetchCategories: async () => {
    // Don't fetch if we already have categories
    if (get().categories.length > 0) return;
    
    set({ loading: true, error: null });
    try {
      const result = await productService.getCategories();
      if (result.error) throw new Error(result.error.message);
      set({ categories: result.data || [], loading: false });
    } catch (error: any) {
      set({ error: error.message, loading: false });
    }
  },

  setSelectedProduct: (product) => set({ 
    selectedProduct: product,
    selectedCaliber: null,
    selectedOptions: {
      wantsDuracoat: false
    },
    colors: 1
  }),

  setSelectedCaliber: (caliber) => set({ 
    selectedCaliber: caliber,
    selectedOptions: {
      // Keep other options but update longAction based on caliber
      ...Object.fromEntries(
        Object.entries(get().selectedOptions).filter(([key]) => key !== 'longAction')
      ),
      // Automatically set longAction based on caliber
      longAction: caliber === '7 PRC' || caliber === '30 Nosler',
    },
    // Clear any existing longAction error
    optionErrors: {
      ...get().optionErrors,
      longAction: null
    }
  }),

  setSelectedOption: (key, value) => set((state) => {
    // Validate long action selection based on caliber
    if (key === 'longAction') {
      const caliber = state.selectedCaliber;
      if (!caliber) return state;
  
      const rules = getCaliberActionRules(caliber);
      
      // Add debug logging
      console.log('Caliber:', caliber);
      console.log('Rules:', rules);
      console.log('Value:', value);
      console.log('Is Forbidden:', rules.forbidsLongAction);
      
      // Prevent deselecting long action for required calibers
      if (!value && rules.requiresLongAction) {
        console.log('Blocking deselect for required long action');
        return {
          ...state,
          optionErrors: {
            ...state.optionErrors,
            longAction: `${caliber} requires the long action configuration`
          },
          selectedOptions: {
            ...state.selectedOptions,
            longAction: true // Keep it selected
          }
        };
      }
      
      // Prevent selecting long action for forbidden calibers
      if (value && rules.forbidsLongAction) {
        console.log('Blocking select for forbidden long action');
        return {
          ...state,
          selectedOptions: {
            ...state.selectedOptions,
            longAction: false  // Force it to stay unselected
          },
          optionErrors: {
            ...state.optionErrors,
            longAction: `${caliber} is only available in short action configuration`
          }
        };
      }
  
      // Clear any existing error when making a valid change
      return {
        ...state,
        selectedOptions: {
          ...state.selectedOptions,
          [key]: value
        },
        optionErrors: {
          ...state.optionErrors,
          longAction: null
        }
      };
    }
  
    // Handle other options...
    return {
      ...state,
      selectedOptions: {
        ...state.selectedOptions,
        [key]: value
      },
      optionErrors: {
        ...state.optionErrors,
        [key]: null
      }
    };
  }),

  setColors: (count) => set((state) => {
    const isBarreledAction = state.selectedProduct?.category_id === 'barreled-actions';
    const minColors = isBarreledAction ? 0 : 1;
    return { colors: Math.min(Math.max(minColors, count), 5) };
  }),

  calculateTotalPrice: () => {
    const { selectedProduct, selectedOptions, colors } = get();
    if (!selectedProduct) return 0;

    let total = selectedProduct.price;

    // Add option prices
    if (selectedOptions.longAction) total += 150;
    if (selectedOptions.deluxeVersion) total += 300;
    if (selectedOptions.wantsDuracoat) {
      const colorBasePrice = selectedProduct.options?.colorBasePrice || 150;
      const additionalColorCost = selectedProduct.options?.additionalColorCost || 30;
      total += colorBasePrice; // Base Duracoat price
      if (colors > 1) {
        total += (colors - 1) * additionalColorCost; // Additional colors
      }
    }

    return total;
  },

  clearSelections: () => set({
    selectedProduct: null,
    selectedCaliber: null,
    selectedOptions: {},
    optionErrors: {},
    colors: 1
  }),

  clearProducts: () => set({
    products: [],
    selectedProduct: null,
    selectedCaliber: null,
    selectedOptions: {},
    optionErrors: {},
    colors: 1
  })
}));