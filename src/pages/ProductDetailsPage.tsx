import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, ChevronLeft, ChevronRight, X, ChevronDown, ChevronUp } from 'lucide-react';
import { useProductStore } from '../store/productStore';
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

  const { addItem } = useCartStore();
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [showLightbox, setShowLightbox] = useState(false);
  const [isAddingToCart, setIsAddingToCart] = useState(false);
  const [showSpecs, setShowSpecs] = useState(false);
  const [parentCategory, setParentCategory] = useState<string | null>(null);

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
  const [selectedSize, setSelectedSize] = useState<string | null>(null);
  const [selectedType, setSelectedType] = useState<string | null>(null);
  const [selectedColor, setSelectedColor] = useState<string | null>(null);

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

  useEffect(() => {
    if (!categorySlug || !productSlug) return;
    clearSelections();
    fetchProduct(productSlug);
  }, [categorySlug, productSlug]);

  const handleBack = () => {
    if (!categorySlug) return;
    navigate(`/shop/${categorySlug}`);
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
          await addItem({
            ...baseItem,
            price: finalPrice,
            options: {
              caliber: selectedCaliber,
              colors,
              ...selectedOptions
            }
          });
          break;

        case 'duracoat':
          finalPrice = calculateDuracoatTotal();
          await addItem({
            ...baseItem,
            price: finalPrice,
            options: {
              colors,
              isDirty: selectedOptions.isDirty,
              additionalColorCost: product.options?.additionalColorCost || 30,
              basePrepCharge: product.options?.basePrepCharge || 50,
              additionalPrepCharge: product.options?.additionalPrepCharge || 50
            }
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
  const isDisabled = isAddingToCart || 
    (needsCaliberSelection && !selectedCaliber) || 
    (needsSizeColorSelection && (!selectedOptions.size || !selectedOptions.color)) || 
    (!needsSizeColorSelection && product.options?.sizes && !selectedSize) ||
    (!needsSizeColorSelection && product.options?.types && !selectedType);

  const getButtonText = () => {
    if (isAddingToCart) return 'Adding to Cart...';
    if (needsCaliberSelection && !selectedCaliber) return 'Select Caliber to Continue';
    if (needsSizeColorSelection && (!selectedOptions.size || !selectedOptions.color)) {
      return 'Select Size and Color to Continue';
    }
    
    const price = categorySlug === 'duracoat' ? 
      calculateDuracoatTotal() : 
      needsCaliberSelection ? calculateTotalPrice() : calculateAccessoryTotal();
    
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

              {/* Specifications Section */}
              {specifications && specifications.length > 0 && (
                <div className="mb-8">
                  <button
                    onClick={() => setShowSpecs(!showSpecs)}
                    className="w-full flex items-center justify-between p-4 bg-gunmetal hover:bg-gunmetal-light transition-colors rounded-sm"
                  >
                    <span className="font-heading text-lg">Specifications</span>
                    {showSpecs ? (
                      <ChevronUp className="text-tan" size={20} />
                    ) : (
                      <ChevronDown className="text-tan" size={20} />
                    )}
                  </button>
                  
                  {showSpecs && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3 }}
                      className="bg-gunmetal-dark p-4 mt-2 rounded-sm"
                    >
                      <ul className="space-y-2">
                        {specifications.map((spec: string, index: number) => (
                          <li key={index} className="flex items-start">
                            <span className="text-tan mr-2">•</span>
                            <span className="text-gray-300">{spec}</span>
                          </li>
                        ))}
                      </ul>
                    </motion.div>
                  )}
                </div>
              )}
              {/* Add to Cart Button */}
              <div className="mt-8">
                <Button
                  variant={product.stock_quantity === 0 ? "secondary" : "primary"}
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