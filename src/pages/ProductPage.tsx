import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate, useLocation } from 'react-router-dom';
import { AlertCircle, Loader, ChevronRight } from 'lucide-react';
import { useMobileDetection } from '../components/MobileDetection';
import { getImageUrl } from '../utils/imageUtils';
import Breadcrumbs from '../components/Breadcrumbs';
import { productService } from '../services/productService';
import type { Category, Product } from '../types/database';

interface ProductPageProps {
  title: string;
  description: string;
  categorySlug: string;
  products: any[];
  loading: boolean;
  error: string | null;
  fetchProducts: (categorySlug: string) => Promise<void>;
  clearProducts: () => void;
  onProductClick: (productSlug: string) => void;
  renderProductInfo?: (product: any) => React.ReactNode;
}

const ProductPage: React.FC<ProductPageProps> = ({
  title,
  description,
  categorySlug,
  products,
  loading,
  error,
  fetchProducts,
  clearProducts,
  onProductClick,
  renderProductInfo
}) => {
  const navigate = useNavigate();
  const location = useLocation();
  const isMobile = useMobileDetection();
  const [subcategories, setSubcategories] = useState<Category[]>([]);
  const [loadingSubcategories, setLoadingSubcategories] = useState(false);
  const [subcategoryError, setSubcategoryError] = useState<string | null>(null);
  const [isParentCategory, setIsParentCategory] = useState(false);
  const [currentCategoryId, setCurrentCategoryId] = useState<string | null>(null);
  const [parentCategory, setParentCategory] = useState<Category | null>(null);

  useEffect(() => {
    const fetchSubcategories = async () => {
      try {
        setLoadingSubcategories(true);
        const result = await productService.getCategories();
        if (result.error) throw new Error(result.error.message);
        
        // Find current category to check if it's a parent
        const currentCategory = result.data?.find(cat => cat.slug === categorySlug);
        setCurrentCategoryId(currentCategory?.category_id || null);
        
        // If this is a subcategory, find its parent
        if (currentCategory?.parent_category_id) {
          const parent = result.data?.find(cat => cat.category_id === currentCategory.parent_category_id);
          setParentCategory(parent || null);
          setIsParentCategory(false);
        } else {
          const subs = result.data?.filter(cat => cat.parent_category_id === currentCategory?.category_id) || [];
          setIsParentCategory(subs.length > 0);
          setSubcategories(subs);
        }
      } catch (error: any) {
        setSubcategoryError(error.message);
      } finally {
        setLoadingSubcategories(false);
      }
    };

    fetchSubcategories();
  }, [categorySlug]);

  useEffect(() => {
    // Fetch products if:
    // 1. We have a category ID AND
    // 2. Either it's not a parent category OR it's a subcategory
    if (currentCategoryId && (!isParentCategory || currentCategoryId)) {
      clearProducts();
      fetchProducts(categorySlug);
    }
  }, [categorySlug, currentCategoryId, isParentCategory]);

  return (
    <div>
      {/* Hero Section */}
      <section className="relative h-[30vh] flex items-center justify-center overflow-hidden">
        {/* Background Image */}
        <div 
          className="absolute inset-0 bg-cover bg-center"
          style={{ 
            backgroundImage: 'url("/.netlify/images?url=/img/gallery/DSC_0331.jpg")',
            filter: 'brightness(0.4)'
          }}
        />
      </section>

      {/* Content Section */}
      <div className="py-12">
        <div className="container mx-auto px-4">
          {/* Breadcrumbs and Header */}
          <div className="mb-12">
            <motion.div
              className="mb-4"
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <Breadcrumbs
                items={[
                  { label: 'Shop', href: '/shop' },
                  ...(parentCategory ? [{ label: parentCategory.name, href: `/shop/${parentCategory.slug}` }] : []),
                  { label: title }
                ]}
              />
            </motion.div>

            <motion.h1 
              className="font-heading text-4xl md:text-5xl font-bold mb-4"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              {title}
            </motion.h1>
            <motion.p
              className="text-xl md:text-2xl text-gray-300 max-w-3xl"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              {description}
            </motion.p>
          </div>

          {/* Subcategories Grid */}
          {isParentCategory && !loading && !error && (
            <div className="mb-12">
              {loadingSubcategories ? (
                <div className="flex items-center justify-center py-12">
                  <Loader className="w-8 h-8 text-tan animate-spin" />
                </div>
              ) : subcategoryError ? (
                <div className="bg-red-900/30 border border-red-700 rounded-sm p-4 mb-8">
                  <p className="text-red-400">{subcategoryError}</p>
                </div>
              ) : subcategories.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {subcategories.map((subcategory, index) => (
                    <motion.div
                      key={subcategory.category_id}
                      className="bg-gunmetal p-6 rounded-sm shadow-luxury cursor-pointer group"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.6, delay: index * 0.1 }}
                      onClick={() => navigate(`/shop/${subcategory.slug}`)}
                    >
                      <div className="flex items-center justify-between">
                        <h3 className="font-heading text-xl font-bold group-hover:text-tan transition-colors">
                          {subcategory.name}
                        </h3>
                        <ChevronRight className="text-gray-400 group-hover:text-tan transition-colors" size={20} />
                      </div>
                      {subcategory.description && (
                        <p className="text-gray-400 mt-2">{subcategory.description}</p>
                      )}
                    </motion.div>
                  ))}
                </div>
              ) : null}
            </div>
          )}

          {/* Loading State */}
          {loading && (
            <div className="flex flex-col items-center justify-center py-12">
              <Loader className="w-8 h-8 text-tan animate-spin mb-4" />
              <p className="text-gray-400">Loading products...</p>
            </div>
          )}

          {/* Error State */}
          {error && (
            <div className="flex items-start bg-red-900/30 border border-red-700 rounded-sm p-4 mb-8">
              <AlertCircle className="text-red-400 mr-3 flex-shrink-0 mt-0.5" size={20} />
              <div>
                <h3 className="font-medium text-red-400">Error loading products</h3>
                <p className="text-red-300 mt-1">{error}</p>
              </div>
            </div>
          )}

          {/* Products Grid */}
          {!loading && !error && (!isParentCategory || parentCategory) && (
            <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-8">
              {products.map((product, index) => (
                <motion.div
                  key={product.product_id}
                  className="bg-gunmetal rounded-sm shadow-luxury overflow-hidden cursor-pointer group"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: index * 0.1 }}
                  onClick={() => onProductClick(product.slug)}
                >
                  {/* Product Image */}
                  <div className="relative aspect-w-4 aspect-h-3 overflow-hidden">
                    <img
                      src={`/.netlify/images?url=${getImageUrl(product.images?.[0]?.image_url || '/img/Logo-Main.webp')}`}
                      alt={product.name}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-opacity duration-300" />
                  </div>

                  {/* Product Info */}
                  <div className={`p-4 ${isMobile ? 'space-y-1' : 'p-6 space-y-2'}`}>
                    <h2 className={`font-heading font-bold group-hover:text-tan transition-colors ${isMobile ? 'text-base' : 'text-xl'}`}>
                      {product.name}
                    </h2>
                    {!isMobile && (
                      <p className="text-gray-400 line-clamp-2">
                        {product.description}
                      </p>
                    )}
                    <div className="flex justify-between items-center">
                      <div className="flex flex-col">
                        {hasAdditionalPricing(product) ? (
                          <>
                            <span className={`text-tan font-bold ${isMobile ? 'text-sm' : 'text-xl'}`}>
                              Starting at ${product.price.toLocaleString()}
                            </span>
                            {product.options?.colorBasePrice && (
                              <span className="text-gray-400 text-sm">
                                +${product.options.colorBasePrice} first color
                              </span>
                            )}
                            {product.options?.additionalColorCost && (
                              <span className="text-gray-400 text-sm">
                                +${product.options.additionalColorCost}/additional color
                              </span>
                            )}
                          </>
                        ) : (
                          <span className={`text-tan font-bold ${isMobile ? 'text-sm' : 'text-xl'}`}>
                            ${product.price.toLocaleString()}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// Helper function to determine if a product has additional pricing options
const hasAdditionalPricing = (product: any): boolean => {
  return !!(
    product.options?.colorBasePrice ||
    product.options?.additionalColorCost ||
    product.options?.longAction ||
    product.options?.deluxeVersion ||
    product.options?.basePrepCharge ||
    product.options?.additionalPrepCharge
  );
};

export default ProductPage;