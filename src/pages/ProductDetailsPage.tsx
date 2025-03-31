import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, ChevronLeft, ChevronRight, X, ChevronDown, ChevronUp } from 'lucide-react';
import { useProductStore } from '../store/productStore';
import { productService } from '../services/productService';
import { useCartStore } from '../store/cartStore';
import { useMobileDetection } from '../components/MobileDetection';
import { getImageUrl } from '../utils/imageUtils';
import Button from '../components/Button';
import Breadcrumbs from '../components/Breadcrumbs';
import OptionSelector from '../components/ProductOptions/OptionSelector';

const ProductDetailsPage: React.FC = () => {
  const { categorySlug, productSlug } = useParams();
  const navigate = useNavigate();
  const isMobile = useMobileDetection();
  
  const {
    selectedProduct: product,
    selectedCaliber,
    selectedOptions,
    optionErrors,
    colors,
    loading,
    error,
    fetchProduct,
    setSelectedCaliber,
    setSelectedOption,
    setColors,
    calculateTotalPrice,
    clearSelections
  } = useProductStore();

  useEffect(() => {
    if (!categorySlug || !productSlug) return;
    clearSelections();
    const loadProduct = async () => {
      try {
        await fetchProduct(productSlug);
      } catch (error) {
        console.error('Failed to fetch product:', error);
      }
    };
    loadProduct();
  }, [categorySlug, productSlug]);

  const handleBack = () => {
    if (!categorySlug) return;
    navigate(`/shop/${categorySlug}`);
  };

  useEffect(() => {
    const fetchParentCategory = async () => {
      if (!categorySlug) return;
      
      try {
        const result = await productService.getCategories();
        if (result.error) throw result.error;
        
        const categories = result.data || [];
        const currentCategory = categories.find(cat => cat.slug === categorySlug);
        
        if (currentCategory?.parent_category_id) {
          const parent = categories.find(cat => cat.category_id === currentCategory.parent_category_id);
          if (parent) {
            setParentCategory(parent.name);
          }
        }
      } catch (error) {
        console.error('Failed to fetch parent category:', error);
      }
    };

    fetchParentCategory();
  }, [categorySlug]);

  const { addItem } = useCartStore();
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [showLightbox, setShowLightbox] = useState(false);
  const [isAddingToCart, setIsAddingToCart] = useState(false);
  const [showSpecs, setShowSpecs] = useState(false);
  const [parentCategory, setParentCategory] = useState<string | null>(null);
  const [selectedSize, setSelectedSize] = useState<string | null>(null);
  const [selectedType, setSelectedType] = useState<string | null>(null);
  const [selectedColor, setSelectedColor] = useState<string | null>(null);
  const [selectedReticle, setSelectedReticle] = useState<string | null>(null);
  const [selectedElevation, setSelectedElevation] = useState<string | null>(null);
  const [selectedTurretType, setSelectedTurretType] = useState<string | null>(null);

  const calculateDuracoatTotal = () => {
    if (!product) return 0;
    
    const basePrice = product.price;
    const additionalColorCost = product.options?.additionalColorCost || 30;
    const basePrepCharge = product.options?.basePrepCharge || 50;
    const additionalPrepCharge = product.options?.additionalPrepCharge || 50;
    
    let total = basePrice;
    
    // Add cost for additional colors
    if (colors > 1) {
      total += (colors - 1) * additionalColorCost;
    }
    
    // Add prep charges
    total += basePrepCharge;
    if (selectedOptions.isDirty) {
      total += additionalPrepCharge;
    }
    
    return total;
  };

  const calculateAccessoryTotal = () => {
    if (!product || !product.options) return product?.price || 0;
    
    let total = product.price;
    
    // Add size-based price adjustment
    if (selectedSize && product.options.sizes) {
      const sizeOption = product.options.sizes.find(s => s.size === selectedSize);
      if (sizeOption?.price) {
        total = sizeOption.price;
      }
    }

    // Add type-based price adjustment
    if (selectedType && product.options.types) {
      const typeOption = product.options.types.find(t => t.name === selectedType);
      if (typeOption?.price) {
        total = typeOption.price;
      }
    }

    // Add color-based price adjustment
    if (selectedColor && product.options.colors) {
      const colorOption = product.options.colors.find(c => c.name === selectedColor);
      if (colorOption?.price_adjustment) {
        total += colorOption.price_adjustment;
      }
    }

    return total;
  };

  const calculateScopeTotal = () => {
    if (!product) return product?.price || 0;
    
    let total = product.price;
    
    // Add color-based price adjustment
    if (selectedColor && product.options?.colors) {
      const colorOption = product.options.colors.find(c => c.name === selectedColor);
      if (colorOption?.price_adjustment) {
        total += colorOption.price_adjustment;
      }
    }

    // Add reticle-based price adjustment
    if (selectedReticle && product.options?.reticles) {
      const reticleOption = product.options.reticles.find(r => r.name === selectedReticle);
      if (reticleOption?.type === 'premium' && reticleOption.price_adjustment) {
        total += reticleOption.price_adjustment;
      }
    }

    return total;
  };

  const handleAddToCart = async () => {
    if (!product) return;

    setIsAddingToCart(true);
    try {
      const baseItem = {
        id: product.product_id,
        name: product.name,
        quantity: 1,
        image: product.images?.[0]?.image_url || '/img/Logo-Main.webp'
      };

      let finalPrice = product.price;

      switch (categorySlug) {
        case 'carnimore-models':
        case 'barreled-actions':
          if (!selectedCaliber) return;
          finalPrice = calculateTotalPrice();
          const barreledActionOptions = {
            caliber: selectedCaliber
          };
          
          // Only add colors if duracoat was selected
          if (selectedOptions.wantsDuracoat && colors > 0) {
            barreledActionOptions['colors'] = colors;
          }
          
          await addItem({
            ...baseItem,
            price: finalPrice,
            options: barreledActionOptions
          });
          break;

        case 'duracoat':
          finalPrice = calculateDuracoatTotal();
          await addItem({
            ...baseItem,
            price: finalPrice,
            options: Object.entries({
              colors,
              isDirty: selectedOptions.isDirty
            }).reduce((acc, [key, value]) => {
              if (value) {
                acc[key] = value;
              }
              return acc;
            }, {} as Record<string, any>)
          });
          break;

        case 'merch':
          if (!selectedOptions.size || !selectedOptions.color) return;
          finalPrice = product.price;
          const merchOptions = {
            size: selectedOptions.size,
            color: selectedOptions.color
          };
          console.log('Adding merch item with options:', {
            timestamp: new Date().toISOString(),
            options: merchOptions
          });
          await addItem({
            ...baseItem,
            price: finalPrice,
            options: merchOptions
          });
          break;

        case 'optics':
          if (!selectedReticle || !selectedElevation || !selectedTurretType) return;
          finalPrice = calculateScopeTotal();
          await addItem({
            ...baseItem,
            price: finalPrice,
            options: {
              reticle: selectedReticle,
              elevation: selectedElevation,
              turretType: selectedTurretType,
              color: selectedColor
            }
          });
          break;

        case 'accessories':
        case 'mounts':
        case 'scope-covers':
        case 'sunshades':
        case 'ard':
          finalPrice = calculateAccessoryTotal();
          await addItem({
            ...baseItem,
            price: finalPrice,
            options: {
              size: selectedSize,
              type: selectedType,
              color: selectedColor
            }
          });
          break;

        default:
          finalPrice = product.price;
          await addItem({
            ...baseItem,
            price: finalPrice
          });
          break;
      }
    } catch (error) {
      console.error('Failed to add item to cart:', error);
    } finally {
      setIsAddingToCart(false);
    }
  };

  const specifications = product?.specifications ? 
    (Array.isArray(product.specifications) ? 
      product.specifications : 
      JSON.parse(product.specifications as string)
    ) : null;

  if (!product || loading) return null;

  const needsCaliberSelection = ['carnimore-models', 'barreled-actions'].includes(categorySlug || '');
  const needsSizeColorSelection = categorySlug === 'merch';
  const needsScopeOptions = categorySlug === 'optics';
  const isDisabled = isAddingToCart || 
    (needsCaliberSelection && !selectedCaliber) || 
    (needsSizeColorSelection && (!selectedOptions.size || !selectedOptions.color)) || 
    (needsScopeOptions && (!selectedReticle || !selectedElevation || !selectedTurretType || !selectedColor)) ||
    (!needsSizeColorSelection && product.options?.sizes && !selectedSize) ||
    (!needsSizeColorSelection && product.options?.types && !selectedType);

  const getButtonText = () => {
    if (isAddingToCart) return 'Adding to Cart...';
    if (needsCaliberSelection && !selectedCaliber) return 'Select Caliber to Continue';
    if (needsSizeColorSelection && (!selectedOptions.size || !selectedOptions.color)) {
      return 'Select Size and Color to Continue';
    }
    if (needsScopeOptions && (!selectedReticle || !selectedElevation || !selectedTurretType || !selectedColor)) {
      return 'Select All Options to Continue';
    }
    
    const price = categorySlug === 'duracoat' ? 
      calculateDuracoatTotal() : 
      needsCaliberSelection ? calculateTotalPrice() : 
      needsScopeOptions ? calculateScopeTotal() :
      calculateAccessoryTotal();
    
    return product.stock_quantity === 0 
      ? `Pre-order - $${price.toLocaleString()}`
      : `Add to Cart - $${price.toLocaleString()}`;
  };

  return (
    <div>
      {/* Hero Image */}
      <section className="relative h-[30vh] flex items-center justify-center overflow-hidden">
        {product?.images && product.images.length > 0 && (
          <div 
            className="absolute inset-0 bg-cover bg-center"
            style={{ 
              backgroundImage: `url(${getImageUrl(product.images[0].image_url)})`,
              filter: 'brightness(0.4)'
            }}
          />
        )}
      </section>

      <div className="pt-12 pb-16">
        <div className="container mx-auto px-4">
          {/* Back Button and Breadcrumbs */}
          <button
            onClick={handleBack}
            className="flex items-center text-gray-400 hover:text-tan transition-colors mb-8"
          >
            <ArrowLeft size={20} className="mr-2" />
            Back
          </button>

          <Breadcrumbs
            items={[
              { label: 'Shop', href: '/shop' },
              ...(parentCategory ? [
                { label: 'Accessories', href: '/shop/accessories' },
                { label: getCategoryLabel(categorySlug), href: `/shop/${categorySlug}` }
              ] : [
                { 
                  label: getCategoryLabel(categorySlug),
                  href: `/shop/${categorySlug}`
                }
              ]),
              { label: product.name }
            ]}
          />

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            {/* Product Images */}
            <div className={`${!isMobile && 'lg:sticky lg:top-24'}`}>
              <motion.div
                className="space-y-4"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
              >
                {/* Main Image */}
                <div 
                  className="relative aspect-w-4 aspect-h-3 bg-gunmetal rounded-sm overflow-hidden cursor-pointer"
                  onClick={() => setShowLightbox(true)}
                >
                  {product.images && product.images.length > 0 ? (
                    <img
                    src={`/.netlify/images?url=${getImageUrl(product.images[selectedImageIndex].image_url)}`}
                      alt={`${product.name} - View ${selectedImageIndex + 1}`}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-dark-gray flex items-center justify-center">
                      <span className="text-gray-400">No image available</span>
                    </div>
                  )}
                </div>

                {/* Thumbnail Grid */}
                {product.images && product.images.length > 1 && (
                  <div className="grid grid-cols-4 gap-2">
                    {product.images.map((image, index) => (
                      <button
                        key={image.image_id}
                        onClick={() => setSelectedImageIndex(index)}
                        className={`aspect-w-1 aspect-h-1 rounded-sm overflow-hidden ${
                          index === selectedImageIndex 
                            ? 'ring-2 ring-tan' 
                            : 'ring-1 ring-gunmetal hover:ring-tan/50'
                        }`}
                      >
                        <img
                          src={`/.netlify/images?url=${getImageUrl(image.image_url)}`}
                          alt={`${product.name} - Thumbnail ${index + 1}`}
                          className="w-full h-full object-cover"
                        />
                      </button>
                    ))}
                  </div>
                )}
              </motion.div>
            </div>

            {/* Product Details */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <h1 className="font-heading text-3xl md:text-4xl font-bold mb-4">
                {product.name}
              </h1>
              {product.brand && (
                <p className="text-tan text-lg mb-4">
                  By {product.brand}
                </p>
              )}
              <p className="text-gray-400 mb-6">{product.description}</p>

              <div className="flex justify-between items-center mb-8">
                <span className="text-tan text-3xl font-bold">
                  ${product.price.toLocaleString()}
                </span>
                {product.weight && (
                  <span className="text-gray-400">
                    Weight: {product.weight}
                  </span>
                )}
              </div>

              {/* Product Options */}
              <OptionSelector
                categorySlug={categorySlug}
                product={product}
                optionErrors={optionErrors}
                selectedReticle={selectedReticle}
                selectedElevation={selectedElevation}
                selectedTurretType={selectedTurretType}
                onReticleSelect={setSelectedReticle}
                onElevationSelect={setSelectedElevation}
                onTurretTypeSelect={setSelectedTurretType}
                selectedCaliber={selectedCaliber}
                carnimoreOptions={selectedOptions}
                carnimoreColors={colors}
                selectedSize={selectedSize}
                selectedType={selectedType}
                selectedColor={selectedColor}
                duracoatColors={colors}
                isDirty={selectedOptions.isDirty}
                onCaliberSelect={setSelectedCaliber}
                onOptionChange={setSelectedOption}
                onCarnimoreColorsChange={setColors}
                onDuracoatColorsChange={setColors}
                onDirtyChange={(isDirty) => setSelectedOption('isDirty', isDirty)}
                selectedMerchSize={selectedOptions.size}
                selectedMerchColor={selectedOptions.color}
                onMerchSizeSelect={(size) => setSelectedOption('size', size)}
                onMerchColorSelect={(color) => setSelectedOption('color', color)}
                onSizeSelect={setSelectedSize}
                onTypeSelect={setSelectedType}
                onColorSelect={setSelectedColor}
              />

              {/* Add to Cart Button */}
              <div className="mt-8">
                <Button
                  variant={product.stock_quantity === 0 ? "primary" : "primary"}
                  fullWidth
                  disabled={isDisabled}
                  onClick={handleAddToCart}
                >
                  {getButtonText()}
                </Button>
                {product.stock_quantity === 0 && (
                  <p className="text-gray-400 text-sm text-center mt-2">
                    This item is currently out of stock. Pre-order now to reserve yours.
                  </p>
                )}
              </div>
            </motion.div>
          </div>

          {/* Product Content Divider */}
          <div className="border-t border-gunmetal-light my-12"></div>
          
          {/* Product Information Sections */}
          <div className="space-y-12">
            {/* Details and Description */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="space-y-6"
            >
              <h2 className="font-heading text-2xl font-bold">Details & Description</h2>
              <div className="bg-gunmetal rounded-sm p-6">
                {product.description_information ? (
                  <div className="space-y-4">
                    {product.description_information.split('\n').map((paragraph, index) => {
                      const trimmedParagraph = paragraph.trim();
                      if (!trimmedParagraph) return null;
                      
                      if (trimmedParagraph.startsWith('•')) {
                        return (
                          <li key={index} className="flex items-start">
                            <span className="text-tan mr-3">•</span>
                            <span className="text-gray-300">{trimmedParagraph.substring(1).trim()}</span>
                          </li>
                        );
                      }
                      
                      return (
                        <p key={index} className="text-gray-300 leading-relaxed">
                          {trimmedParagraph}
                        </p>
                      );
                    })}
                  </div>
                )
                : (
                  <p className="text-gray-400">No detailed product information available.</p>
                )}
              </div>
            </motion.div>

            {/* Specifications Section */}
            {specifications && specifications.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.3 }}
                className="space-y-6"
              >
                <h2 className="font-heading text-2xl font-bold">Specifications</h2>
                <div className="bg-gunmetal rounded-sm p-6">
                  <ul className="space-y-4">
                    {specifications.map((spec: string, index: number) => (
                      <li key={index} className="flex items-start">
                        <span className="text-tan mr-3">•</span>
                        <span className="text-gray-300">{spec}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </motion.div>
            )}
          </div>
        </div>
      </div>

      {/* Lightbox */}
      {showLightbox && product.images && product.images.length > 0 && (
        <motion.div
          className="fixed inset-0 bg-black bg-opacity-90 z-50 flex items-center justify-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <button
            onClick={() => setShowLightbox(false)}
            className="absolute top-4 right-4 text-white hover:text-tan transition-colors"
          >
            <X size={24} />
          </button>

          <button
            onClick={() => setSelectedImageIndex((prev) => 
              prev === 0 ? product.images!.length - 1 : prev - 1
            )}
            className="absolute left-4 text-white hover:text-tan transition-colors"
          >
            <ChevronLeft size={32} />
          </button>

          <button
            onClick={() => setSelectedImageIndex((prev) => 
              prev === product.images!.length - 1 ? 0 : prev + 1
            )}
            className="absolute right-4 text-white hover:text-tan transition-colors"
          >
            <ChevronRight size={32} />
          </button>

          <img
            src={getImageUrl(product.images[selectedImageIndex].image_url)}
            alt={`${product.name} - Full View`}
            className="max-w-full max-h-[90vh] object-contain"
          />
        </motion.div>
      )}
    </div>
  );
};

// Helper function to get category label
const getCategoryLabel = (slug: string | undefined): string => {
  switch (slug) {
    case 'carnimore-models':
      return 'Carnimore Models';
    case 'duracoat':
      return 'Duracoat Services';
    case 'optics':
      return 'Optics';
    case 'accessories':
      return 'Accessories';
    case 'nfa':
      return 'NFA Items';
    case 'barreled-actions':
      return 'Barreled Actions';
    case 'scope-covers':
      return 'Scope Covers';
    case 'sunshades':
      return 'Sunshades';
    case 'ard':
      return 'Anti-Reflection Devices';
    case 'mounts':
      return 'Scope Mounts';
    case 'scope-accessories':
      return 'Scope Accessories';
    default:
      return 'Merchandise';
  }
};

export default ProductDetailsPage;