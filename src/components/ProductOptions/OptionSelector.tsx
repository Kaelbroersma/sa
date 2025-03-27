import React, { useEffect, useState } from 'react';
import { Plus, Minus } from 'lucide-react';
import { optionService } from '../../services/optionService';
import type { Product } from '../../types/database';
import type { ScopeOptions } from '../../types/options';
import type { ProductOption } from '../../types/options';

interface OptionSelectorProps {
  categorySlug?: string;
  product: Product;
  // Scope options
  selectedReticle?: string | null;
  selectedElevation?: string | null;
  selectedTurretType?: string | null;
  onReticleSelect?: (reticle: string) => void;
  onElevationSelect?: (elevation: string) => void;
  onTurretTypeSelect?: (turretType: string) => void;
  selectedSize?: string | null;
  selectedType?: string | null;
  selectedColor?: string | null;
  onSizeSelect?: (size: string) => void;
  onTypeSelect?: (type: string) => void;
  onColorSelect?: (color: string) => void;
  // Carnimore Models props
  selectedCaliber: string | null;
  carnimoreOptions: Record<string, any>;
  carnimoreColors: number;
  onCaliberSelect: (caliber: string) => void;
  onOptionChange: (key: string, value: any) => void;
  onCarnimoreColorsChange: (count: number) => void;
  // Duracoat props
  duracoatColors: number;
  isDirty: boolean;
  onDuracoatColorsChange: (count: number) => void;
  onDirtyChange: (isDirty: boolean) => void;
  // Merch props
  selectedMerchSize: string | null;
  selectedMerchColor: string | null;
  onMerchSizeSelect: (size: string) => void;
  onMerchColorSelect: (color: string) => void;
}

const OptionSelector: React.FC<OptionSelectorProps> = ({
  categorySlug,
  product,
  // Carnimore Models props
  selectedCaliber,
  carnimoreOptions,
  carnimoreColors,
  onCaliberSelect,
  onOptionChange,
  onCarnimoreColorsChange,
  // Duracoat props
  duracoatColors,
  isDirty,
  onDuracoatColorsChange,
  onDirtyChange,
  // Merch props
  selectedMerchSize,
  selectedMerchColor,
  onMerchSizeSelect,
  onMerchColorSelect,
  // Scope options
  selectedReticle,
  selectedElevation,
  selectedTurretType,
  onReticleSelect,
  onElevationSelect,
  onTurretTypeSelect,
  selectedSize,
  selectedType,
  selectedColor,
  onSizeSelect,
  onTypeSelect,
  onColorSelect
}) => {
  // Helper function to get price display
  const getPriceDisplay = (price: number) => {
    return price ? `$${price.toFixed(2)}` : '';
  };

  // Render accessory options
  const renderAccessoryOptions = () => {
    const { sizes = [], types = [], colors = [] } = product.options || {};
    return (
      <div className="space-y-8">
        {/* Size Selection */}
        {sizes?.length > 0 && (
          <div>
            <h3 className="font-heading text-xl font-bold mb-4">
              Select Size <span className="text-tan">*</span>
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {sizes.map((sizeOption, index) => {
                const sizeValue = typeof sizeOption === 'string' ? sizeOption : sizeOption.size;
                const sizePrice = typeof sizeOption === 'object' ? sizeOption.price : null;
                return (
                  <button
                    key={`accessory-size-${sizeValue}-${index}`}
                    onClick={() => onSizeSelect?.(sizeValue)}
                    className={`px-4 py-3 rounded-sm transition-colors ${
                      selectedSize === sizeValue
                        ? 'bg-tan text-black'
                        : 'bg-dark-gray hover:bg-tan/10'
                    }`}
                  >
                    <div>
                      <span className="block">{sizeValue}</span>
                      {sizePrice && (
                        <span className="text-sm opacity-75 block">
                          {getPriceDisplay(sizePrice)}
                        </span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Type Selection */}
        {types?.length > 0 && (
          <div>
            <h3 className="font-heading text-xl font-bold mb-4">
              Select Type <span className="text-tan">*</span>
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {types.map((typeOption) => (
                <button
                  key={`accessory-type-${typeOption.name}`}
                  onClick={() => onTypeSelect?.(typeOption.name)}
                  className={`p-4 rounded-sm transition-colors ${
                    selectedType === typeOption.name
                      ? 'bg-tan text-black'
                      : 'bg-dark-gray hover:bg-tan/10'
                  }`}
                >
                  <div>
                    <span className="block">{typeOption.name}</span>
                    <span className="text-sm opacity-75 block">
                      ${typeOption.price.toFixed(2)}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Color Selection */}
        {colors?.length > 0 && (
          <div>
            <h3 className="font-heading text-xl font-bold mb-4">
              Select Color
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {colors.map((colorOption, index) => {
                const colorName = typeof colorOption === 'string' ? colorOption : colorOption.name;
                const colorValue = typeof colorOption === 'object' ? colorOption.value : colorOption;
                const priceAdjustment = typeof colorOption === 'object' ? colorOption.price_adjustment : null;
                return (
                  <button
                    key={`accessory-color-${colorName}-${index}`}
                    onClick={() => onColorSelect?.(colorName)}
                    className={`flex items-center p-4 rounded-sm transition-colors ${
                      selectedColor === colorName
                        ? 'bg-tan text-black'
                        : 'bg-dark-gray hover:bg-tan/10'
                    }`}
                  >
                    <div className="flex items-center space-x-4 w-full">
                      <div
                        className="w-8 h-8 rounded-full flex-shrink-0 border-2"
                        style={{ 
                          backgroundColor: colorValue,
                          borderColor: selectedColor === colorName ? 'currentColor' : 'transparent'
                        }}
                      />
                      <div className="flex-grow">
                        <span className="block">{colorName}</span>
                        {priceAdjustment && priceAdjustment !== 0 && (
                          <span className="text-sm opacity-75 block">
                            {priceAdjustment > 0 ? '+' : '-'}
                            ${Math.abs(priceAdjustment).toFixed(2)}
                          </span>
                        )}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>
    );
  };

  const [productOptions, setProductOptions] = useState<ProductOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchOptions = async () => {
      if (!product?.product_id) return;

      setLoading(true);
      const result = await optionService.getProductOptions(product.product_id);
      
      if (result.error) {
        setError(result.error.message);
      } else {
        setProductOptions(result.data || []);
      }
      
      setLoading(false);
    };

    fetchOptions();
  }, [product?.product_id]);

  // Render Carnimore Models options
  const renderCarnimoreOptions = () => {
    const { availableCalibers = [] } = product.options || {};
    const isBarreledAction = categorySlug === 'barreled-actions';

    // Check if this model has the Deluxe Version option enabled
    const hasDeluxeVersion = productOptions.some(po => 
      po.option_name === 'Deluxe Version' && 
      po.is_enabled && 
      po.override_values?.value === true
    );

    return (
      <div className="space-y-6">
        {/* Caliber Selection */}
        <div>
          <h2 className="font-heading text-xl font-bold mb-4">
            Select Caliber <span className="text-tan">*</span>
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {availableCalibers.map((caliber) => (
              <button
                key={`carnimore-caliber-${caliber}`}
                onClick={() => onCaliberSelect(caliber)}
                className={`px-4 py-3 rounded-sm transition-colors ${
                  selectedCaliber === caliber
                    ? 'bg-tan text-black'
                    : 'bg-dark-gray hover:bg-tan/10'
                }`}
              >
                {caliber}
              </button>
            ))}
          </div>
          {!selectedCaliber && (
            <p className="text-red-400 text-sm mt-2">Please select a caliber</p>
          )}
        </div>

        {/* Additional Options */}
        <div className="bg-gunmetal p-6 rounded-sm space-y-4">
          <h3 className="font-heading text-xl font-bold mb-4">Additional Options</h3>
          
          {/* Long Action Option */}
          {productOptions.some(po => po.option_name === 'Long Action' && po.is_enabled) && (
            <label className="flex items-center space-x-2 cursor-pointer">
              <input
                type="checkbox"
                checked={carnimoreOptions.longAction || false}
                onChange={(e) => onOptionChange('longAction', e.target.checked)}
                className="form-checkbox text-tan rounded-sm"
              />
              <span className="text-gray-300">Long Action (+$150)</span>
            </label>
          )}
          
          {/* Deluxe Version Option - Only show if enabled for this model */}
          {hasDeluxeVersion && (
            <label className="flex items-center space-x-2 cursor-pointer">
              <input
                type="checkbox"
                checked={carnimoreOptions.deluxeVersion || false}
                onChange={(e) => onOptionChange('deluxeVersion', e.target.checked)}
                className="form-checkbox text-tan rounded-sm"
              />
              <span className="text-gray-300">Deluxe Version: Fluted Bolt & Barrel (+$300)</span>
            </label>
          )}

          {/* Duracoat Colors Selection */}
          {isBarreledAction ? (
            <div className="mt-6">
              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={carnimoreOptions.wantsDuracoat || false}
                  onChange={(e) => {
                    onOptionChange('wantsDuracoat', e.target.checked);
                    if (!e.target.checked) {
                      onCarnimoreColorsChange(0);
                    } else {
                      onCarnimoreColorsChange(1);
                    }
                  }}
                  className="form-checkbox text-tan rounded-sm"
                />
                <span className="text-gray-300">Add Duracoat Finish (+${product.options?.colorBasePrice || 150})</span>
              </label>
              
              {carnimoreOptions.wantsDuracoat && (
                <div className="mt-4">
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Number of Colors
                  </label>
                  <div className="flex items-center justify-between mb-2">
                    <button
                      onClick={() => onCarnimoreColorsChange(carnimoreColors - 1)}
                      className="bg-dark-gray p-2 rounded-sm hover:bg-tan/10 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      disabled={carnimoreColors <= 1}
                    >
                      <Minus size={20} />
                    </button>
                    <span className="text-2xl font-bold">{carnimoreColors}</span>
                    <button
                      onClick={() => onCarnimoreColorsChange(carnimoreColors + 1)}
                      className="bg-dark-gray p-2 rounded-sm hover:bg-tan/10 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      disabled={carnimoreColors >= 5}
                    >
                      <Plus size={20} />
                    </button>
                  </div>
                  <div className="text-gray-400 text-sm space-y-1">
                    {carnimoreColors > 1 && (
                      <p>Additional colors: +${(carnimoreColors - 1) * (product.options?.additionalColorCost || 30)}</p>
                    )}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="mt-6">
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Duracoat Colors (Included)
              </label>
              <div className="flex items-center justify-between mb-2">
                <button
                  onClick={() => onCarnimoreColorsChange(carnimoreColors - 1)}
                  className="bg-dark-gray p-2 rounded-sm hover:bg-tan/10 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={carnimoreColors <= 1}
                >
                  <Minus size={20} />
                </button>
                <span className="text-2xl font-bold">{carnimoreColors}</span>
                <button
                  onClick={() => onCarnimoreColorsChange(carnimoreColors + 1)}
                  className="bg-dark-gray p-2 rounded-sm hover:bg-tan/10 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={carnimoreColors >= 5}
                >
                  <Plus size={20} />
                </button>
              </div>
              <p className="text-gray-400 text-sm">
                Select between 1 and 5 colors for your custom finish
              </p>
            </div>
          )}
        </div>
      </div>
    );
  };

  // Render Duracoat options
  const renderDuracoatOptions = () => {
    const {
      additionalColorCost = 30,
      maxColors = 5,
      basePrepCharge = 50,
      additionalPrepCharge = 50
    } = product.options || {};

    return (
      <div className="space-y-6">
        {/* Colors Selection */}
        <div className="bg-gunmetal p-6 rounded-sm">
          <h3 className="font-heading text-xl font-bold mb-4">
            Duracoat Colors <span className="text-tan">*</span>
          </h3>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            First color included
          </label>
          <div className="flex items-center justify-between mb-2">
            <button
              onClick={() => onDuracoatColorsChange(duracoatColors - 1)}
              className="bg-dark-gray p-2 rounded-sm hover:bg-tan/10 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={duracoatColors <= 1}
            >
              <Minus size={20} />
            </button>
            <span className="text-2xl font-bold">{duracoatColors}</span>
            <button
              onClick={() => onDuracoatColorsChange(duracoatColors + 1)}
              className="bg-dark-gray p-2 rounded-sm hover:bg-tan/10 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={duracoatColors >= maxColors}
            >
              <Plus size={20} />
            </button>
          </div>
          <p className="text-gray-400 text-sm">
            Select between 1 and {maxColors} colors for your custom finish
          </p>
        </div>

        {/* Prep Charge */}
        <div className="bg-gunmetal p-6 rounded-sm">
          <h3 className="font-heading text-xl font-bold mb-4">Prep Charge</h3>
          <p className="text-gray-400 mb-4">
            A prep charge of ${basePrepCharge} is applied to all orders. For excessively dirty/oily firearms, 
            an additional ${additionalPrepCharge} prep charge will be applied.
          </p>
          <label className="flex items-center space-x-2 cursor-pointer">
            <input
              type="checkbox"
              checked={isDirty}
              onChange={(e) => onDirtyChange(e.target.checked)}
              className="form-checkbox text-tan rounded-sm"
            />
            <span className="text-gray-300">Firearm requires additional cleaning (+${additionalPrepCharge})</span>
          </label>
        </div>

        {/* Price Calculation */}
        <div className="bg-gunmetal p-6 rounded-sm">
          <div className="space-y-4">
            <div className="flex justify-between">
              <span className="text-gray-400">Base Cost (Includes First Color):</span>
              <span>${product.price}</span>
            </div>
            {duracoatColors > 1 && (
              <div className="flex justify-between">
                <span className="text-gray-400">Additional Colors ({duracoatColors - 1}):</span>
                <span>${(duracoatColors - 1) * additionalColorCost}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-gray-400">Prep Charge:</span>
              <span>${isDirty ? basePrepCharge + additionalPrepCharge : basePrepCharge}</span>
            </div>
            <div className="border-t border-gunmetal-light pt-4">
              <div className="flex justify-between items-center">
                <span className="font-bold">Total:</span>
                <span className="text-tan text-2xl font-bold">${(
                  product.price + 
                  (duracoatColors > 1 ? (duracoatColors - 1) * additionalColorCost : 0) +
                  basePrepCharge +
                  (isDirty ? additionalPrepCharge : 0)
                ).toLocaleString()}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Render Merch options
  const renderMerchOptions = () => {
    if (!product.options) return null;

    // Handle both string array and object array for sizes
    const sizes = (product.options.sizes || []).map(size => 
      typeof size === 'string' ? { size } : size
    );
    const colors = Array.isArray(product.options.colors) ? product.options.colors : [];

    return (
      <div className="space-y-8">
        {/* Size Selection */}
        {sizes.length > 0 && (
          <div>
            <h3 className="font-heading text-xl font-bold mb-4">
              Select Size <span className="text-tan">*</span>
            </h3>
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
              {sizes.map((sizeOption, index) => {
                const sizeValue = typeof sizeOption === 'string' ? sizeOption : sizeOption.size;
                return (
                <button
                  key={`merch-size-${sizeValue}-${index}`}
                  onClick={() => onMerchSizeSelect(sizeValue)}
                  className={`px-4 py-3 rounded-sm transition-colors ${
                    selectedMerchSize === sizeValue
                      ? 'bg-tan text-black'
                      : 'bg-dark-gray hover:bg-tan/10'
                  }`}
                >
                  {sizeValue}
                </button>
                );
              })}
            </div>
            {!selectedMerchSize && (
              <p className="text-red-400 text-sm mt-2">Please select a size</p>
            )}
          </div>
        )}

        {/* Color Selection */}
        {colors.length > 0 && (
          <div>
            <h3 className="font-heading text-xl font-bold mb-4">
              Select Color <span className="text-tan">*</span>
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {colors.map((color) => (
                <button
                  key={`merch-color-${color.name}`}
                  onClick={() => onMerchColorSelect(color.name)}
                  className={`flex items-center p-4 rounded-sm transition-colors ${
                    selectedMerchColor === color.name
                      ? 'bg-tan text-black'
                      : 'bg-dark-gray hover:bg-tan/10'
                  }`}
                >
                  <div className="flex items-center space-x-4 w-full">
                    <div
                      className="w-8 h-8 rounded-full flex-shrink-0 border-2"
                      style={{ 
                        backgroundColor: color.value,
                        borderColor: selectedMerchColor === color.name ? 'currentColor' : 'transparent'
                      }}
                    />
                    <div className="flex-grow">
                      <span className="block">{color.name}</span>
                      {color.hasRedLogo && (
                        <span className="text-sm opacity-75 block">(Red Logo)</span>
                      )}
                    </div>
                  </div>
                </button>
              ))}
            </div>
            {!selectedMerchColor && (
              <p className="text-red-400 text-sm mt-2">Please select a color</p>
            )}
          </div>
        )}
      </div>
    );
  };
  // Helper function to calculate reticle price adjustment
  const getReticlePrice = (reticle: any) => {
    if (reticle.type === 'premium') {
      return reticle.price_adjustment || 0;
    }
    return 0;
  };

  // Render scope options
  const renderScopeOptions = () => {
    if (!product.options) return null;
    const options = product.options as ScopeOptions;

    // Auto-select single options on mount
    useEffect(() => {
      // Handle single elevation option
      if (!Array.isArray(options.elevation) && options.elevation && !selectedElevation) {
        onElevationSelect?.(options.elevation);
      }

      // Handle single turret type option
      if (!Array.isArray(options.turretTypes) && options.turretType && !selectedTurretType) {
        onTurretTypeSelect?.(options.turretType);
      }
    }, [options]);

    return (
      <div className="space-y-8">
        {/* Color Selection */}
        {options.colors && (
          <div>
            <h3 className="font-heading text-xl font-bold mb-4">
              Select Color <span className="text-tan">*</span>
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {options.colors.map((colorOption, index) => (
                <button
                  key={`scope-color-${colorOption.name}-${index}`}
                  onClick={() => onColorSelect?.(colorOption.name)}
                  className={`flex items-center p-4 rounded-sm transition-colors ${
                    selectedColor === colorOption.name
                      ? 'bg-tan text-black'
                      : 'bg-dark-gray hover:bg-tan/10'
                  }`}
                >
                  <div className="flex items-center space-x-4 w-full">
                    <div
                      className="w-8 h-8 rounded-full flex-shrink-0 border-2"
                      style={{ 
                        backgroundColor: colorOption.value,
                        borderColor: selectedColor === colorOption.name ? 'currentColor' : 'transparent'
                      }}
                    />
                    <div className="flex-grow">
                      <span className="block">{colorOption.name}</span>
                      {colorOption.price_adjustment > 0 && (
                        <span className="text-sm opacity-75 block">
                          +${colorOption.price_adjustment.toFixed(2)}
                        </span>
                      )}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Reticle Selection */}
        {options.reticles && (
          <div>
            <h3 className="font-heading text-xl font-bold mb-4">
              Select Reticle <span className="text-tan">*</span>
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {options.reticles.map((reticle) => (
                <button
                  key={reticle.name}
                  onClick={() => onReticleSelect?.(reticle.name)}
                  className={`p-4 rounded-sm transition-colors ${
                    selectedReticle === reticle.name
                      ? 'bg-tan text-black'
                      : 'bg-dark-gray hover:bg-tan/10'
                  }`}
                >
                  <div>
                    <span className="block">{reticle.name}</span>
                    {reticle.type === 'premium' && reticle.price_adjustment && (
                      <span className="text-sm opacity-75 block">
                        +${reticle.price_adjustment.toFixed(2)}
                      </span>
                    )}
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Elevation Selection */}
        {options.elevation && (
          <div>
            <h3 className="font-heading text-xl font-bold mb-4 flex items-center justify-between">
              <span>Elevation <span className="text-tan">*</span></span>
              {!Array.isArray(options.elevation) && (
                <span className="text-sm text-gray-400">(Auto-selected)</span>
              )}
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {(Array.isArray(options.elevation) ? options.elevation : [options.elevation]).map((elevation) => (
                <button
                  key={elevation}
                  onClick={() => onElevationSelect?.(elevation)}
                  disabled={!Array.isArray(options.elevation)}
                  className={`p-4 rounded-sm transition-colors ${
                    selectedElevation === elevation
                      ? 'bg-tan text-black'
                      : 'bg-dark-gray hover:bg-tan/10 disabled:hover:bg-dark-gray disabled:cursor-default'
                  }`}
                >
                  {elevation}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Turret Type Selection */}
        {(options.turretTypes || options.turretType) && (
          <div>
            <h3 className="font-heading text-xl font-bold mb-4 flex items-center justify-between">
              <span>Turret Type <span className="text-tan">*</span></span>
              {!Array.isArray(options.turretTypes) && options.turretType && (
                <span className="text-sm text-gray-400">(Auto-selected)</span>
              )}
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {(Array.isArray(options.turretTypes) ? options.turretTypes : [options.turretType]).map((turretType) => (
                turretType && (
                  <button
                    key={turretType}
                    onClick={() => onTurretTypeSelect?.(turretType)}
                    disabled={!Array.isArray(options.turretTypes)}
                    className={`p-4 rounded-sm transition-colors ${
                      selectedTurretType === turretType
                        ? 'bg-tan text-black'
                        : 'bg-dark-gray hover:bg-tan/10 disabled:hover:bg-dark-gray disabled:cursor-default'
                    }`}
                  >
                    {turretType}
                  </button>
                )
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  // Render options based on category
  switch (categorySlug) {
    case 'optics':
      return renderScopeOptions();
    case 'carnimore-models':
    case 'barreled-actions':
      return renderCarnimoreOptions();
    case 'duracoat':
      return renderDuracoatOptions();
    case 'merch':
      return renderMerchOptions();
    default:
      // For scopes and accessories
      return renderAccessoryOptions();
  }
};

export default OptionSelector;