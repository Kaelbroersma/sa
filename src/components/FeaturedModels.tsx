import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { productService } from '../services/productService';
import { useMobileDetection } from './MobileDetection';
import { getImageUrl } from '../utils/imageUtils';

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
    return <div>Loading featured models...</div>;
  }

  if (error) {
    return <div>Error: {error}</div>;
  }

  return (
    <section className="py-20 bg-primary">
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2 place-items-center justify-center">
      {featuredProducts.map((product, index) => (
        <motion.div
          key={product.product_id}
          className="bg-dark-gray rounded-sm overflow-hidden shadow-luxury angular-border"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: index * 0.1 }}
          onClick={() => onProductClick(product.slug)}
        >
          {/* Product Image */}
          <div className="relative h-64 overflow-hidden">
            <img
              src={`/.netlify/images?url=${getImageUrl(product.images?.[0]?.image_url || '/img/Logo-Main.webp')}`}
              alt={product.name}
              className={`w-full h-full object-cover transition-transform duration-500 hover:scale-105 'opacity-100' : 'opacity-0'}`}
              style={{ transition: 'opacity 0.5s ease-in-out, transform 0.5s ease-in-out' }}
            />
            <div className="absolute top-4 left-4 bg-tan text-black px-3 py-1 text-sm font-medium" />
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
            </div>
          </div>
        </motion.div>
      ))}
    </div>
    </section>
  );
};

export default FeaturedModels;