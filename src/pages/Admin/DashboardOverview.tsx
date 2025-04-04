import React, { useState, useEffect } from 'react';
import { Users, ShoppingBag, Package, FileText, TrendingUp } from 'lucide-react';
import { callNetlifyFunction } from '../../lib/supabase';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';
import { Line } from 'react-chartjs-2';

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

interface DashboardStats {
  userCount: number;
  orderCount: number;
  productCount: number;
  blogPostCount: number;
}

interface SalesData {
  date: string;
  total: number;
}

const DashboardOverview: React.FC = () => {
  const [stats, setStats] = useState<DashboardStats>({
    userCount: 0,
    orderCount: 0,
    productCount: 0,
    blogPostCount: 0
  });
  const [salesData, setSalesData] = useState<SalesData[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchStats();
    fetchSalesData();
  }, []);

  const fetchStats = async () => {
    try {
      setIsLoading(true);
      console.log('Fetching dashboard stats...');
      const response = await callNetlifyFunction('adminDashboardStats');
      console.log('Raw response:', response);
      
      if (response.error) {
        console.error('Error in response:', response.error);
        setError(response.error.message || 'Failed to fetch dashboard statistics');
        return;
      }
      
      if (!response.data) {
        console.error('No data in response');
        setError('No statistics found');
        return;
      }
      
      console.log('Dashboard stats data:', response.data);
      setStats({
        userCount: response.data.totalUsers || 0,
        orderCount: response.data.totalOrders || 0,
        productCount: response.data.totalProducts || 0,
        blogPostCount: response.data.totalBlogPosts || 0
      });
    } catch (error: any) {
      console.error('Error fetching dashboard stats:', error);
      setError(error.message || 'Failed to fetch dashboard statistics');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchSalesData = async () => {
    try {
      const response = await callNetlifyFunction('adminOrders');
      if (response.error) throw response.error;

      // Process orders to get daily sales totals
      const salesByDate = response.data.reduce((acc: { [key: string]: number }, order: any) => {
        const date = new Date(order.created_at).toLocaleDateString();
        acc[date] = (acc[date] || 0) + (order.total_amount || 0);
        return acc;
      }, {});

      // Convert to array and sort by date
      const processedData = Object.entries(salesByDate)
        .map(([date, total]) => ({ date, total }))
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

      setSalesData(processedData);
    } catch (error) {
      console.error('Error fetching sales data:', error);
    }
  };

  const chartData = {
    labels: salesData.map(data => data.date),
    datasets: [
      {
        label: 'Daily Sales',
        data: salesData.map(data => data.total),
        fill: true,
        borderColor: '#D5B895', // tan color
        backgroundColor: 'rgba(213, 184, 149, 0.1)', // tan color with opacity
        tension: 0.4,
        pointBackgroundColor: '#D5B895',
        pointBorderColor: '#D5B895',
        pointHoverBackgroundColor: '#D5B895',
        pointHoverBorderColor: '#ffffff',
      }
    ]
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false
      },
      tooltip: {
        backgroundColor: '#1E2A2D', // gunmetal color
        titleColor: '#D5B895', // tan color
        bodyColor: '#ffffff',
        borderColor: '#D5B895',
        borderWidth: 1,
        padding: 12,
        displayColors: false,
        callbacks: {
          label: (context: any) => `$${context.parsed.y.toFixed(2)}`
        }
      }
    },
    scales: {
      x: {
        grid: {
          color: 'rgba(255, 255, 255, 0.1)',
        },
        ticks: {
          color: '#9CA3AF'
        }
      },
      y: {
        grid: {
          color: 'rgba(255, 255, 255, 0.1)',
        },
        ticks: {
          color: '#9CA3AF',
          callback: (value: number) => `$${value}`
        }
      }
    }
  };

  const StatCard = ({ 
    title, 
    value, 
    icon: Icon, 
    color 
  }: { 
    title: string; 
    value: number; 
    icon: React.ElementType;
    color: string;
  }) => (
    <div className="bg-gunmetal p-6 rounded-sm shadow-luxury hover:shadow-luxury-lg transition-all duration-300">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-400 mb-1">{title}</p>
          <h3 className="text-3xl font-bold text-tan">{isLoading ? '...' : value}</h3>
        </div>
        <div className={`p-3 rounded-sm ${color}`}>
          <Icon size={24} className="text-tan" />
        </div>
      </div>
      <div className="mt-4 pt-4 border-t border-gunmetal-light">
        <div className="flex items-center text-sm text-gray-400">
          <TrendingUp size={16} className="mr-1" />
          <span>Updated just now</span>
        </div>
      </div>
    </div>
  );

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h2 className="text-3xl font-bold text-tan">Dashboard Overview</h2>
          <p className="text-gray-400 mt-1">Welcome to your admin dashboard</p>
        </div>
      </div>

      {error && (
        <div className="mb-6 p-4 rounded-sm bg-red-500/10 text-red-500">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard
          title="Total Users"
          value={stats.userCount}
          icon={Users}
          color="bg-blue-500/10"
        />
        <StatCard
          title="Total Orders"
          value={stats.orderCount}
          icon={ShoppingBag}
          color="bg-green-500/10"
        />
        <StatCard
          title="Total Products"
          value={stats.productCount}
          icon={Package}
          color="bg-purple-500/10"
        />
        <StatCard
          title="Blog Posts"
          value={stats.blogPostCount}
          icon={FileText}
          color="bg-orange-500/10"
        />
      </div>

      {/* Sales Graph */}
      <div className="bg-gunmetal p-6 rounded-sm shadow-luxury mb-8">
        <h3 className="text-xl font-bold text-tan mb-6">Sales Overview</h3>
        <div className="h-[400px]">
          <Line data={chartData} options={chartOptions} />
        </div>
      </div>
    </div>
  );
};

export default DashboardOverview; 