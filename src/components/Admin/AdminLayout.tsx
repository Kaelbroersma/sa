import React from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Users, 
  ShoppingBag, 
  FileText, 
  ChevronDown,
  ArrowLeft
} from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import Button from '../Button';

interface AdminLayoutProps {
  children: React.ReactNode;
}

const AdminLayout: React.FC<AdminLayoutProps> = ({ children }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuthStore();

  // Check if user is super admin
  if (!user?.is_super_admin) {
    navigate('/');
    return null;
  }

  const menuItems = [
    {
      title: 'Dashboard',
      path: '/admin/dashboard',
      icon: <LayoutDashboard size={20} />
    },
    {
      title: 'Sales',
      path: '/admin/sales',
      icon: <ShoppingBag size={20} />
    },
    {
      title: 'User Management',
      path: '/admin/users',
      icon: <Users size={20} />
    },
    {
      title: 'Shop',
      icon: <ShoppingBag size={20} />,
      submenu: [
        { title: 'Products', path: '/admin/shop/products' },
        { title: 'Categories', path: '/admin/shop/categories' }
      ]
    },
    {
      title: 'Blog',
      icon: <FileText size={20} />,
      submenu: [
        { title: 'Posts', path: '/admin/blog/posts' },
        { title: 'Settings', path: '/admin/blog/settings' }
      ]
    }
  ];

  const isActive = (path: string) => location.pathname === path;
  const isSubmenuActive = (submenu: any[]) => 
    submenu.some(item => location.pathname === item.path);

  return (
    <div className="min-h-screen bg-dark-gray">
      {/* Sidebar */}
      <div className="fixed left-0 top-0 w-64 h-screen bg-gunmetal shadow-luxury">
        <div className="p-6">
          <h1 className="font-heading text-2xl font-bold text-tan mb-8">Admin Panel</h1>
          <nav className="space-y-2">
            {menuItems.map((item, index) => (
              <div key={index}>
                {item.submenu ? (
                  <div className="mb-2">
                    <div className={`flex items-center justify-between p-3 rounded-sm cursor-pointer ${
                      isSubmenuActive(item.submenu) ? 'bg-gunmetal-light text-tan' : 'text-gray-400 hover:text-white'
                    }`}>
                      <div className="flex items-center">
                        {item.icon}
                        <span className="ml-3">{item.title}</span>
                      </div>
                      <ChevronDown size={16} />
                    </div>
                    <div className="ml-8 mt-2 space-y-1">
                      {item.submenu.map((subItem, subIndex) => (
                        <Link
                          key={subIndex}
                          to={subItem.path}
                          className={`block p-2 rounded-sm ${
                            isActive(subItem.path) ? 'text-tan' : 'text-gray-400 hover:text-white'
                          }`}
                        >
                          {subItem.title}
                        </Link>
                      ))}
                    </div>
                  </div>
                ) : (
                  <Link
                    to={item.path}
                    className={`flex items-center p-3 rounded-sm ${
                      isActive(item.path) ? 'bg-gunmetal-light text-tan' : 'text-gray-400 hover:text-white'
                    }`}
                  >
                    {item.icon}
                    <span className="ml-3">{item.title}</span>
                  </Link>
                )}
              </div>
            ))}
          </nav>
        </div>
      </div>

      {/* Main Content */}
      <div className="ml-64 p-8">
        <div className="mb-8 flex items-center justify-between">
          <Button
            variant="outline"
            onClick={() => navigate('/account')}
            className="mr-4"
          >
            <ArrowLeft size={20} className="mr-2" />
            Back to Account
          </Button>
        </div>
        {children}
      </div>
    </div>
  );
};

export default AdminLayout; 