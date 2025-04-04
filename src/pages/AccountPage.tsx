import React, { useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { User, Package, Heart, Settings, LogOut, ShieldCheck } from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { useAdminStore } from '../store/adminStore';
import { authService } from '../services/authService';

const AccountPage: React.FC = () => {
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);
  const loading = useAuthStore((state) => state.loading);
  const { isAdmin, isChecking, checkAdminStatus } = useAdminStore();

  useEffect(() => {
    if (!loading && !user) {
      navigate('/', { replace: true });
    }
  }, [user, loading, navigate]);

  // Check admin status when user changes
  useEffect(() => {
    if (user) {
      checkAdminStatus(user.id);
    }
  }, [user, checkAdminStatus]);

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!user) {
    navigate('/', { replace: true });
    return null;
  }

  const handleSignOut = async () => {
    await authService.signOut();
    navigate('/', { replace: true });
  };

  const menuItems = [
    {
      icon: <Package className="text-tan" size={24} />,
      title: 'Orders',
      description: 'View and track your orders',
      path: '/account/orders'
    },
    {
      icon: <Heart className="text-tan" size={24} />,
      title: 'Wishlist',
      description: 'Manage your saved items',
      path: '/account/wishlist'
    },
    {
      icon: <Settings className="text-tan" size={24} />,
      title: 'Settings',
      description: 'Update your account preferences',
      path: '/account/settings'
    }
  ];

  return (
    <div className="pt-24 pb-16">
      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto">
          {/* User Info */}
          <motion.div
            className="bg-gunmetal p-8 rounded-sm shadow-luxury mb-8"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="bg-tan/10 p-4 rounded-sm">
                  <User className="text-tan" size={32} />
                </div>
                <div className="ml-4">
                  <h1 className="font-heading text-2xl font-bold">
                    {user.user_metadata?.first_name} {user.user_metadata?.last_name}
                  </h1>
                  <p className="text-gray-400">{user.email}</p>
                  <div className="mt-1">
                    {isAdmin && (
                      <p className="text-tan font-semibold">Super Admin</p>
                    )}
                  </div>
                </div>
              </div>
              <button
                onClick={handleSignOut}
                className="flex items-center text-gray-400 hover:text-tan transition-colors"
              >
                <LogOut size={20} className="mr-2" />
                Sign Out
              </button>
            </div>
          </motion.div>

          {/* Menu Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {menuItems.map((item, index) => (
              <motion.div
                key={item.path}
                className="bg-gunmetal p-6 rounded-sm shadow-luxury cursor-pointer hover:bg-gunmetal-light transition-colors"
                onClick={() => navigate(item.path)}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
              >
                <div className="bg-tan/10 p-4 rounded-sm inline-block mb-4">
                  {item.icon}
                </div>
                <h3 className="font-heading text-xl font-bold mb-2">{item.title}</h3>
                <p className="text-gray-400">{item.description}</p>
              </motion.div>
            ))}
          </div>

          {/* Admin Dashboard Section */}
          {isAdmin && (
            <motion.div
              className="mt-8"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
            >
              <div
                onClick={() => navigate('/admin')}
                className="bg-gunmetal p-8 rounded-sm shadow-luxury cursor-pointer hover:bg-gunmetal-light transition-colors border border-tan/20"
              >
                <div className="flex items-center gap-6">
                  <div className="bg-tan/10 p-4 rounded-sm">
                    <ShieldCheck className="text-tan" size={32} />
                  </div>
                  <div>
                    <h3 className="font-heading text-2xl font-bold text-tan mb-2">Admin Dashboard</h3>
                    <p className="text-gray-400">Manage website content and users</p>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AccountPage;