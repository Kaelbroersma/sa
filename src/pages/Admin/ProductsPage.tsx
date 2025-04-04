import React, { useState, useEffect } from 'react';
import { Plus, Pencil, Trash2, X, Search, Filter, ChevronDown, CheckCircle2, Clock, XCircle, AlertCircle, AlertTriangle } from 'lucide-react';
import { callNetlifyFunction } from '../../lib/supabase';

interface Product {
  product_id: string;
  category_id: string;
  description_information: string;
  brand: string;
  product_status: string;
  added_date: string;
  specifications: any;
  options: any;
  weight: number;
  slug: string;
  name: string;
  category_name?: string;
}

interface Category {
  category_id: string;
  category_name: string;
}

const ProductsPage: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [isEditing, setIsEditing] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      // Fetch products
      const productsResponse = await callNetlifyFunction('adminProducts');
      if (productsResponse.error) throw productsResponse.error;

      // Fetch categories
      const categoriesResponse = await callNetlifyFunction('adminCategories');
      if (categoriesResponse.error) throw categoriesResponse.error;

      setCategories(categoriesResponse.data);

      // Map category names to products
      const productsWithCategories = productsResponse.data.map((product: Product) => ({
        ...product,
        category_name: categoriesResponse.data.find(
          (category: Category) => category.category_id === product.category_id
        )?.category_name || 'Unknown'
      }));

      setProducts(productsWithCategories);
    } catch (error) {
      console.error('Error fetching data:', error);
      setError('Failed to fetch products and categories');
    }
  };

  const handleEdit = (product: Product) => {
    setEditingProduct(product);
    setIsEditing(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProduct) return;

    const { error } = await callNetlifyFunction('adminProducts', {
      method: 'PUT',
      body: JSON.stringify({
        description_information: editingProduct.description_information,
        brand: editingProduct.brand,
        product_status: editingProduct.product_status,
        specifications: editingProduct.specifications,
        options: editingProduct.options,
        weight: editingProduct.weight,
        category_id: editingProduct.category_id
      })
    });

    if (error) {
      console.error('Error updating product:', error);
      return;
    }

    setIsEditing(false);
    setEditingProduct(null);
    fetchData();
  };

  const handleUpdateProduct = async (productId: string, updates: any) => {
    try {
      const response = await callNetlifyFunction('adminUpdateProduct', {
        product_id: productId,
        ...updates
      });
      if (response.error) throw response.error;
      fetchData();
    } catch (error) {
      console.error('Error updating product:', error);
      setError('Failed to update product');
    }
  };

  const filteredProducts = products.filter(product => {
    const matchesSearch = 
      product.brand.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.description_information.toLowerCase().includes(searchTerm.toLowerCase());

    if (filterCategory === 'all') return matchesSearch;
    return matchesSearch && product.category_id === filterCategory;
  });

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-8">
        <h2 className="text-3xl font-bold text-tan">Products</h2>
        <button className="bg-tan text-gunmetal px-4 py-2 rounded-sm flex items-center hover:bg-tan/90 transition-colors">
          <Plus size={20} className="mr-2" />
          Add Product
        </button>
      </div>

      {/* Search and Filter Bar */}
      <div className="bg-gunmetal p-4 rounded-sm shadow-luxury mb-6 flex flex-wrap gap-4">
        <div className="flex-1 min-w-[200px]">
          <div className="relative">
            <Search size={20} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search products..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-gunmetal-light pl-10 pr-4 py-2 rounded-sm"
            />
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Filter size={20} className="text-gray-400" />
          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="bg-gunmetal-light px-4 py-2 rounded-sm"
          >
            <option value="all">All Categories</option>
            {categories.map((category) => (
              <option key={category.category_id} value={category.category_id}>
                {category.category_name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Products Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredProducts.map((product) => (
          <div
            key={product.product_id}
            className="bg-gunmetal p-6 rounded-sm shadow-luxury relative group"
          >
            <div className="absolute top-4 right-4 space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
              <button
                onClick={() => handleEdit(product)}
                className="p-2 bg-tan/10 rounded-sm hover:bg-tan/20 transition-colors"
              >
                <Pencil size={16} className="text-tan" />
              </button>
              <button className="p-2 bg-red-500/10 rounded-sm hover:bg-red-500/20 transition-colors">
                <Trash2 size={16} className="text-red-500" />
              </button>
            </div>

            <div className="mb-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-heading text-lg font-bold text-tan">{product.name}</h3>
                  <p className="text-sm text-gray-400">
                    {product.category_name} • {product.brand}
                  </p>
                </div>
                <span className={`px-2 py-1 rounded-sm ${
                  product.product_status === 'active' ? 'bg-green-500/10 text-green-500' : 'bg-yellow-500/10 text-yellow-500'
                }`}>
                  {product.product_status}
                </span>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">Category:</span>
                <span>{categories.find(c => c.category_id === product.category_id)?.category_name || 'Unknown'}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">Weight:</span>
                <span>{product.weight}g</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">Added:</span>
                <span>{new Date(product.added_date).toLocaleDateString()}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Edit Modal */}
      {isEditing && editingProduct && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center">
          <div className="bg-gunmetal p-6 rounded-sm w-full max-w-lg">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold">Edit Product</h3>
              <button
                onClick={() => setIsEditing(false)}
                className="p-2 hover:bg-gunmetal-light rounded-sm transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSave}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Name</label>
                  <input
                    type="text"
                    value={editingProduct.name}
                    onChange={(e) => setEditingProduct({ ...editingProduct, name: e.target.value })}
                    className="w-full bg-gunmetal-light p-2 rounded-sm"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Brand</label>
                  <input
                    type="text"
                    value={editingProduct.brand}
                    onChange={(e) => setEditingProduct({ ...editingProduct, brand: e.target.value })}
                    className="w-full bg-gunmetal-light p-2 rounded-sm"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Description</label>
                  <textarea
                    value={editingProduct.description_information}
                    onChange={(e) => setEditingProduct({ ...editingProduct, description_information: e.target.value })}
                    className="w-full bg-gunmetal-light p-2 rounded-sm h-24"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Category</label>
                  <select
                    value={editingProduct.category_id}
                    onChange={(e) => setEditingProduct({ ...editingProduct, category_id: e.target.value })}
                    className="w-full bg-gunmetal-light p-2 rounded-sm"
                  >
                    {categories.map((category) => (
                      <option key={category.category_id} value={category.category_id}>
                        {category.category_name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Weight (g)</label>
                  <input
                    type="number"
                    value={editingProduct.weight}
                    onChange={(e) => setEditingProduct({ ...editingProduct, weight: parseFloat(e.target.value) })}
                    className="w-full bg-gunmetal-light p-2 rounded-sm"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Status</label>
                  <select
                    value={editingProduct.product_status}
                    onChange={(e) => setEditingProduct({ ...editingProduct, product_status: e.target.value })}
                    className="w-full bg-gunmetal-light p-2 rounded-sm"
                  >
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                    <option value="out_of_stock">Out of Stock</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Specifications</label>
                  <textarea
                    value={JSON.stringify(editingProduct.specifications, null, 2)}
                    onChange={(e) => {
                      try {
                        const specs = JSON.parse(e.target.value);
                        setEditingProduct({ ...editingProduct, specifications: specs });
                      } catch (error) {
                        // Handle invalid JSON
                      }
                    }}
                    className="w-full bg-gunmetal-light p-2 rounded-sm h-32 font-mono text-sm"
                  />
                </div>
              </div>

              <div className="flex justify-end mt-6 space-x-3">
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="px-4 py-2 bg-gunmetal-light rounded-sm hover:bg-gunmetal-light/80 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-tan text-gunmetal rounded-sm hover:bg-tan/90 transition-colors"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductsPage; 