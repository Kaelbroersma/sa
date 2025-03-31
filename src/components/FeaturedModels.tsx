import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ChevronRight } from 'lucide-react';
import { productService } from '../services/productService';
import { useMobileDetection } from './MobileDetection';
import { getImageUrl } from '../utils/imageUtils';
import Button from './Button';

const FeaturedModels: React.FC = () => {
  const navigate = useNavigate();
  const isMobile = useMobileDetection();
  const [featuredProducts, setFeaturedProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadFeaturedProducts = async () => {
      try {
        setIsLoading(true);
        // Fetch products from your regular category
        const result = await productService.getProductsByCategory('carnimore-models');
        
        if (result.error) {
          throw new Error(result.error.message);
        }

        // Limit to only 3 products (you can adjust this logic as needed)
        const limitedProducts = result.data?.slice(0, 3) || [];

        setFeaturedProducts(limitedProducts);
      } catch (err: any) {
        console.error('Error fetching featured products:', err);
        setError(err.message || 'Failed to load featured products');
      } finally {
        setIsLoading(false);
      }
    };

    loadFeaturedProducts();
  }, []); 

  const onProductClick = (slug: string) => {
    navigate(`/shop/carnimore-models/${slug}`);
  };

  if (isLoading) {
    return (
      <section className="py-20 bg-primary">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-tan"></div>
          </div>
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section className="py-20 bg-primary">
        <div className="container mx-auto px-4">
          <div className="bg-red-900/30 border border-red-700 rounded-sm p-4 mb-8">
            <p className="text-red-400">{error}</p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="py-20 bg-primary">
      <div className="container mx-auto px-4">
        {/* Header Section */}
        <div className="text-center mb-16">
          <motion.h2
            className="font-heading text-3xl md:text-4xl font-bold mb-4"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            Featured <span className="text-tan">Carnimore Models</span>
          </motion.h2>
          <motion.p
            className="text-gray-400 max-w-2xl mx-auto"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            Shop our most precise builds today
          </motion.p>
        </div>

        {/* Products Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
          {featuredProducts.map((product, index) => (
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
                  src={`${getImageUrl(product.images?.[0]?.image_url || '/img/Logo-Main.webp')}`}
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
                  <span className={`text-tan font-bold ${isMobile ? 'text-sm' : 'text-xl'}`}>
                    ${product.price.toLocaleString()}
                  </span>
                  <ChevronRight className="text-gray-400 group-hover:text-tan transition-colors" size={20} />
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* View All Button */}
        <div className="text-center">
          <Button
            to="/shop/carnimore-models"
            variant="outline"
            size="lg"
          >
            View All Models
          </Button>
        </div>
      </div>
    </section>
  );
};

export default FeaturedModels;