import React from 'react';
import { motion } from 'framer-motion';
import { Users, ShoppingBag, FileText, DollarSign } from 'lucide-react';
import AdminLayout from '../../components/Admin/AdminLayout';

const DashboardPage: React.FC = () => {
  const stats = [
    {
      title: 'Total Sales',
      value: '$0.00',
      icon: <DollarSign size={24} className="text-green-400" />,
      change: '+0%',
      period: 'from last month'
    },
    {
      title: 'Active Users',
      value: '0',
      icon: <Users size={24} className="text-blue-400" />,
      change: '+0%',
      period: 'from last month'
    },
    {
      title: 'Products',
      value: '0',
      icon: <ShoppingBag size={24} className="text-purple-400" />,
      change: '+0%',
      period: 'from last month'
    },
    {
      title: 'Blog Posts',
      value: '0',
      icon: <FileText size={24} className="text-orange-400" />,
      change: '+0%',
      period: 'from last month'
    }
  ];

  return (
    <AdminLayout>
      <div>
        <h1 className="font-heading text-3xl font-bold mb-8">Dashboard Overview</h1>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {stats.map((stat, index) => (
            <motion.div
              key={index}
              className="bg-gunmetal p-6 rounded-sm shadow-luxury"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <div className="flex items-center justify-between mb-4">
                <div className="p-2 bg-gunmetal-light rounded-sm">
                  {stat.icon}
                </div>
                <span className={`text-sm ${stat.change.startsWith('+') ? 'text-green-400' : 'text-red-400'}`}>
                  {stat.change}
                </span>
              </div>
              <h3 className="font-heading text-2xl font-bold mb-1">{stat.value}</h3>
              <p className="text-gray-400 text-sm">{stat.title}</p>
              <p className="text-gray-500 text-xs mt-2">{stat.period}</p>
            </motion.div>
          ))}
        </div>

        {/* Placeholder for future charts/tables */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-gunmetal p-6 rounded-sm shadow-luxury">
            <h3 className="font-heading text-xl font-bold mb-4">Recent Orders</h3>
            <p className="text-gray-400">No recent orders to display.</p>
          </div>
          <div className="bg-gunmetal p-6 rounded-sm shadow-luxury">
            <h3 className="font-heading text-xl font-bold mb-4">Popular Products</h3>
            <p className="text-gray-400">No products to display.</p>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};

export default DashboardPage; 