import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useProductStore } from '../../store/productStore';
import ProductPage from '../ProductPage';

const AccessoriesPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { products, loading, error, fetchProducts, clearProducts } = useProductStore();

  const handleProductClick = (productSlug: string) => {
    // Get the current category from the URL
    const categorySlug = location.pathname.split('/')[2];
    navigate(`/shop/${categorySlug}/${productSlug}`);
  };

  // Get category info based on URL
  const getCategoryInfo = () => {
    const categorySlug = location.pathname.split('/')[2];
    switch (categorySlug) {
      case 'scope-covers':
        return {
          title: 'Scope Covers',
          description: 'Protective covers for optics'
        };
      case 'sunshades':
        return {
          title: 'Sunshades',
          description: 'Anti-glare accessories for scopes'
        };
      case 'ard':
        return {
          title: 'Anti-Reflection Devices',
          description: 'Reduce scope glare and enhance target acquisition'
        };
      case 'mounts':
        return {
          title: 'Scope Mounts',
          description: 'Premium scope mounting solutions'
        };
      case 'scope-accessories':
        return {
          title: 'Scope Accessories',
          description: 'Additional scope accessories and components'
        };
      default:
        return {
          title: 'Accessories',
          description: 'Essential firearm accessories and components'
        };
    }
  };

  const categoryInfo = getCategoryInfo();
  const categorySlug = location.pathname.split('/')[2];

  return (
    <ProductPage
      title={categoryInfo.title}
      description={categoryInfo.description}
      categorySlug={categorySlug}
      products={products}
      loading={loading}
      error={error}
      fetchProducts={fetchProducts}
      clearProducts={clearProducts}
      onProductClick={handleProductClick}
    />
  );
};

export default AccessoriesPage;