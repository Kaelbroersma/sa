import React from 'react';
import { useNavigate } from 'react-router-dom';
import { SprayCan } from 'lucide-react';
import { useDuracoatStore } from '../store/duracoatStore';
import ProductPage from './ProductPage';

const DuracoatPage: React.FC = () => {
  const navigate = useNavigate();
  const { services: products, loading, error, fetchServices, clearServices } = useDuracoatStore();

  const handleProductClick = (productSlug: string) => {
    navigate(`/shop/duracoat/${productSlug}`);
  };

  return (
    <ProductPage
      title="Duracoat Services"
      description="Professional-grade firearm coating with unmatched durability and precision"
      categorySlug="duracoat"
      products={products}
      loading={loading}
      error={error}
      fetchProducts={fetchServices}
      clearProducts={clearServices}
      onProductClick={handleProductClick}
    />
  );
};

export default DuracoatPage;