import React, { useState } from 'react';
import { Link, Outlet, useLocation } from 'react-router-dom';
import { LayoutDashboard, ShoppingBag, Store, FileText, Settings, ChevronDown, Users } from 'lucide-react';

const AdminDashboard: React.FC = () => {
  const location = useLocation();
  const [storeOpen, setStoreOpen] = useState(false);
  const [blogOpen, setBlogOpen] = useState(false);

  const isActive = (path: string) => location.pathname === path;

  return (
    <div className="min-h-screen bg-gunmetal">
      {/* Sidebar */}
      <div className="fixed inset-y-0 left-0 w-64 bg-gunmetal-light shadow-luxury">
        <div className="flex flex-col h-full">
          <div className="p-6">
            <h1 className="text-2xl font-bold text-tan">Admin Dashboard</h1>
          </div>

          <nav className="flex-1 px-4 space-y-2">
            {/* Overview */}
            <Link
              to="/admin/overview"
              className={`flex items-center px-4 py-2 rounded-sm transition-colors ${
                isActive('/admin/overview') ? 'bg-tan text-gunmetal' : 'text-tan hover:bg-tan/10'
              }`}
            >
              <LayoutDashboard size={20} className="mr-3" />
              Overview
            </Link>

            {/* Sales Management */}
            <Link
              to="/admin/sales"
              className={`flex items-center px-4 py-2 rounded-sm transition-colors ${
                isActive('/admin/sales') ? 'bg-tan text-gunmetal' : 'text-tan hover:bg-tan/10'
              }`}
            >
              <ShoppingBag size={20} className="mr-3" />
              Sales Management
            </Link>

            {/* User Management */}
            <Link
              to="/admin/users"
              className={`flex items-center px-4 py-2 rounded-sm transition-colors ${
                isActive('/admin/users') ? 'bg-tan text-gunmetal' : 'text-tan hover:bg-tan/10'
              }`}
            >
              <Users size={20} className="mr-3" />
              User Management
            </Link>

            {/* Store Dropdown */}
            <div className="relative">
              <button
                onClick={() => setStoreOpen(!storeOpen)}
                className={`w-full flex items-center justify-between px-4 py-2 rounded-sm transition-colors ${
                  (isActive('/admin/products') || isActive('/admin/categories')) ? 'bg-tan text-gunmetal' : 'text-tan hover:bg-tan/10'
                }`}
              >
                <div className="flex items-center">
                  <Store size={20} className="mr-3" />
                  Store
                </div>
                <ChevronDown size={16} className={`transition-transform ${storeOpen ? 'rotate-180' : ''}`} />
              </button>
              
              {storeOpen && (
                <div className="mt-2 ml-4 space-y-1">
                  <Link
                    to="/admin/products"
                    className={`block px-4 py-2 rounded-sm transition-colors ${
                      isActive('/admin/products') ? 'bg-tan text-gunmetal' : 'text-tan hover:bg-tan/10'
                    }`}
                  >
                    Products
                  </Link>
                  <Link
                    to="/admin/categories"
                    className={`block px-4 py-2 rounded-sm transition-colors ${
                      isActive('/admin/categories') ? 'bg-tan text-gunmetal' : 'text-tan hover:bg-tan/10'
                    }`}
                  >
                    Categories
                  </Link>
                </div>
              )}
            </div>

            {/* Blog Dropdown */}
            <div className="relative">
              <button
                onClick={() => setBlogOpen(!blogOpen)}
                className={`w-full flex items-center justify-between px-4 py-2 rounded-sm transition-colors ${
                  (isActive('/admin/blog') || isActive('/admin/blog/settings')) ? 'bg-tan text-gunmetal' : 'text-tan hover:bg-tan/10'
                }`}
              >
                <div className="flex items-center">
                  <FileText size={20} className="mr-3" />
                  Blog
                </div>
                <ChevronDown size={16} className={`transition-transform ${blogOpen ? 'rotate-180' : ''}`} />
              </button>
              
              {blogOpen && (
                <div className="mt-2 ml-4 space-y-1">
                  <Link
                    to="/admin/blog"
                    className={`block px-4 py-2 rounded-sm transition-colors ${
                      isActive('/admin/blog') ? 'bg-tan text-gunmetal' : 'text-tan hover:bg-tan/10'
                    }`}
                  >
                    Blog Posts
                  </Link>
                  <Link
                    to="/admin/blog/settings"
                    className={`block px-4 py-2 rounded-sm transition-colors ${
                      isActive('/admin/blog/settings') ? 'bg-tan text-gunmetal' : 'text-tan hover:bg-tan/10'
                    }`}
                  >
                    Blog Settings
                  </Link>
                </div>
              )}
            </div>
          </nav>
        </div>
      </div>

      {/* Main Content */}
      <div className="ml-64 p-8">
        <Outlet />
      </div>
    </div>
  );
};

export default AdminDashboard; 