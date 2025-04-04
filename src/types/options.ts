// Option Types
export type OptionType = 'select' | 'multi' | 'boolean' | 'number' | 'text';

export interface Option {
  option_id: string;
  name: string;
  description: string | null;
  is_global: boolean;
  category_id: string | null;
  is_required: boolean;
  option_type: OptionType;
  created_at: string;
  values?: OptionValue[];
}

export interface OptionValue {
  value_id: string;
  option_id: string;
  value: string;
  display_name: string | null;
  extra_cost: number;
  sort_order: number;
  created_at: string;
}

export interface ProductOption {
  product_option_id: string;
  product_id: string;
  option_id: string;
  is_enabled: boolean;
  override_required: boolean | null;
  override_values: any | null;
  created_at: string;
  option?: Option;
}

// Selected Options
export interface SelectedOptions {
  [key: string]: any;
}

// Scope Options Types
export interface ScopeReticle {
  name: string;
  type: 'standard' | 'premium';
  price_adjustment?: number;
}

export interface ScopeOptions {
  colors: Array<{
    name: string;
    value: string;
    price_adjustment: number;
  }>;
  reticles: ScopeReticle[];
  elevation: string[] | string;
  turretTypes?: string[];
  turretType?: string;
  selectedColor?: string | null;
  onSizeSelect?: (size: string) => void;
  onTypeSelect?: (type: string) => void;
  onColorSelect?: (color: string) => void;
  optionErrors?: Record<string, string>;
  // Carnimore Models props
  selectedCaliber: string | null;
  carnimoreOptions: Record<string, any>;
}