import React, { useState, useEffect } from 'react';
import { Plus, Pencil, Trash2, X, ChevronDown } from 'lucide-react';
import { callNetlifyFunction } from '../../lib/supabase';

interface Category {
  category_id: string;
  name: string;
  description: string;
  parent_category_id: string | null;
  category_status: string;
  created_at: string;
  slug: string;
  category_img: string;
  icon: string;
  ffl_required: boolean;
}

const CategoriesPage: React.FC = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [isEditing, setIsEditing] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      const response = await callNetlifyFunction('adminCategories');
      if (response.error) throw response.error;
      setCategories(response.data);
    } catch (error) {
      console.error('Error fetching categories:', error);
      setError('Failed to fetch categories');
    }
  };

  const toggleCategory = (categoryId: string) => {
    setExpandedCategories(prev => {
      const newSet = new Set(prev);
      if (newSet.has(categoryId)) {
        newSet.delete(categoryId);
      } else {
        newSet.add(categoryId);
      }
      return newSet;
    });
  };

  const getChildCategories = (parentId: string) => {
    return categories.filter(category => category.parent_category_id === parentId);
  };

  const getParentCategories = () => {
    return categories.filter(category => !category.parent_category_id);
  };

  const renderCategory = (category: Category, level: number = 0) => {
    const childCategories = getChildCategories(category.category_id);
    const hasChildren = childCategories.length > 0;
    const isExpanded = expandedCategories.has(category.category_id);

    return (
      <div key={category.category_id} className="mb-2">
        <div
          className={`bg-gunmetal p-4 rounded-sm shadow-luxury relative group ${
            level > 0 ? 'ml-6' : ''
          }`}
        >
          <div className="absolute top-2 right-2 space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              onClick={() => handleEdit(category)}
              className="p-1.5 bg-tan/10 rounded-sm hover:bg-tan/20 transition-colors"
            >
              <Pencil size={14} className="text-tan" />
            </button>
            <button className="p-1.5 bg-red-500/10 rounded-sm hover:bg-red-500/20 transition-colors">
              <Trash2 size={14} className="text-red-500" />
            </button>
          </div>

          {category.category_img && (
            <div className="aspect-video mb-2 rounded-sm overflow-hidden max-h-24">
              <img
                src={category.category_img}
                alt={category.name}
                className="w-full h-full object-cover"
              />
            </div>
          )}

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-bold">{category.name}</h3>
              {hasChildren && (
                <button
                  onClick={() => toggleCategory(category.category_id)}
                  className="p-1 hover:bg-gunmetal-light rounded-sm transition-colors"
                >
                  <ChevronDown
                    size={16}
                    className={`text-gray-400 transition-transform ${
                      isExpanded ? 'rotate-180' : ''
                    }`}
                  />
                </button>
              )}
            </div>
          </div>

          <p className="text-gray-400 text-xs mb-2 line-clamp-2">{category.description}</p>

          <div className="flex items-center justify-between text-xs">
            <span className={`px-1.5 py-0.5 rounded-sm ${
              category.category_status === 'active' ? 'bg-green-500/10 text-green-500' : 'bg-yellow-500/10 text-yellow-500'
            }`}>
              {category.category_status}
            </span>
            {category.ffl_required && (
              <span className="bg-blue-500/10 text-blue-500 px-1.5 py-0.5 rounded-sm">
                FFL Required
              </span>
            )}
          </div>
        </div>

        {hasChildren && isExpanded && (
          <div className="mt-1">
            {childCategories.map(child => renderCategory(child, level + 1))}
          </div>
        )}
      </div>
    );
  };

  const handleEdit = (category: Category) => {
    setEditingCategory(category);
    setIsEditing(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCategory) return;

    const { error } = await callNetlifyFunction('categories')
      .update({
        name: editingCategory.name,
        description: editingCategory.description,
        category_status: editingCategory.category_status,
        category_img: editingCategory.category_img,
        icon: editingCategory.icon,
        ffl_required: editingCategory.ffl_required
      })
      .eq('category_id', editingCategory.category_id);

    if (error) {
      console.error('Error updating category:', error);
      return;
    }

    setIsEditing(false);
    setEditingCategory(null);
    fetchCategories();
  };

  const handleUpdateCategory = async (categoryId: string, updates: any) => {
    try {
      const response = await callNetlifyFunction('adminUpdateCategory', {
        category_id: categoryId,
        ...updates
      });
      if (response.error) throw response.error;
      fetchCategories();
    } catch (error) {
      console.error('Error updating category:', error);
      setError('Failed to update category');
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <h2 className="text-3xl font-bold text-tan">Categories</h2>
        <button className="bg-tan text-gunmetal px-4 py-2 rounded-sm flex items-center hover:bg-tan/90 transition-colors">
          <Plus size={20} className="mr-2" />
          Add Category
        </button>
      </div>

      {/* Categories List */}
      <div className="space-y-4">
        {getParentCategories().map(category => renderCategory(category))}
      </div>
    </div>
  );
};

export default CategoriesPage;