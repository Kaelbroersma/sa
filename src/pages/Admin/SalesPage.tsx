import React, { useState, useEffect } from 'react';
import { callNetlifyFunction } from '../../lib/supabase';
import { Search, Filter, ChevronDown, CheckCircle2, Clock, XCircle, AlertCircle, AlertTriangle, X } from 'lucide-react';

interface Order {
  order_id: string;
  order_date: string;
  order_status: string;
  payment_status: string;
  total_amount: number;
  user_id: string;
  email: string;
  first_name: string;
  last_name: string;
  phone_number: string;
  shipping_method: string;
  tracking_number: string;
  payment_method: string;
  payment_processor_id: string;
  payment_processor_response: string;
  billing_address: string;
  shipping_address: string;
  created_at: string;
  ffl_dealer_info?: {
    ffl_id: string;
    lic_cnty: string;
    lic_dist: string;
    lic_regn: string;
    lic_seqn: string;
    lic_type: string;
    mail_city: string;
    lic_xprdte: string;
    mail_state: string;
    mail_street: string;
    voice_phone: string;
    license_name: string;
    premise_city: string;
    business_name: string;
    mail_zip_code: string;
    premise_state: string;
    premise_street: string;
    premise_zip_code: string;
  };
  requires_ffl: boolean;
  order_items: Array<{
    product_id: string;
    name: string;
    price: number;
    total: number;
    quantity: number;
    options?: Record<string, any>;
  }> | null;
  user?: {
    first_name: string;
    last_name: string;
    email: string;
  };
}

const SalesPage: React.FC = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [isViewingOrder, setIsViewingOrder] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showStatusMenu, setShowStatusMenu] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      setIsLoading(true);
      const response = await callNetlifyFunction('adminOrders');
      console.log('Orders response:', response); // Debug log
      if (response.error) throw response.error;
      
      // Log the first order to check its structure
      if (response.data && response.data.length > 0) {
        console.log('First order:', response.data[0]);
      }
      
      setOrders(response.data || []);
    } catch (error) {
      console.error('Error fetching orders:', error);
      setError('Failed to fetch orders');
    } finally {
      setIsLoading(false);
    }
  };

  const handleOrderClick = (order: Order) => {
    setSelectedOrder(order);
    setIsViewingOrder(true);
  };

  const handleUpdateStatus = async (orderId: string, newStatus: string) => {
    try {
      const response = await callNetlifyFunction('adminUpdateOrder', {
        order_id: orderId,
        order_status: newStatus
      });
      if (response.error) throw response.error;
      fetchOrders();
      setShowStatusMenu(null);
    } catch (error) {
      console.error('Error updating order status:', error);
      setError('Failed to update order status');
    }
  };

  const getPaymentStatusIcon = (status: string) => {
    switch (status) {
      case 'paid':
        return <CheckCircle2 size={20} className="text-green-500" />;
      case 'pending':
        return <Clock size={20} className="text-yellow-500" />;
      case 'failed':
        return <XCircle size={20} className="text-red-500" />;
      default:
        return <AlertCircle size={20} className="text-gray-500" />;
    }
  };

  const getOrderStatusIcon = (status: string) => {
    switch (status) {
      case 'complete':
        return <CheckCircle2 size={20} className="text-green-500" />;
      case 'pending':
        return <Clock size={20} className="text-yellow-500" />;
      case 'rejected':
        return <XCircle size={20} className="text-red-500" />;
      case 'fraud':
        return <AlertTriangle size={20} className="text-red-500" />;
      default:
        return <AlertCircle size={20} className="text-gray-500" />;
    }
  };

  const StatusMenu = ({ orderId, currentStatus }: { orderId: string, currentStatus: string }) => {
    const [isOpen, setIsOpen] = useState(false);

    return (
      <div className="relative">
        <button
          onClick={(e) => {
            e.stopPropagation();
            setIsOpen(!isOpen);
          }}
          className="flex items-center gap-2 hover:opacity-80 transition-opacity"
        >
          {getOrderStatusIcon(currentStatus)}
          <span className="capitalize">{currentStatus}</span>
          <ChevronDown size={16} className="text-gray-400" />
        </button>
        
        {isOpen && (
          <div className="absolute right-0 mt-2 w-48 bg-gunmetal rounded-sm shadow-luxury z-10">
            <div className="py-1">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleUpdateStatus(orderId, 'complete');
                  setIsOpen(false);
                }}
                className="flex items-center w-full px-4 py-2 text-sm hover:bg-gunmetal-light"
              >
                <CheckCircle2 size={16} className="text-green-500 mr-2" />
                Complete
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleUpdateStatus(orderId, 'pending');
                  setIsOpen(false);
                }}
                className="flex items-center w-full px-4 py-2 text-sm hover:bg-gunmetal-light"
              >
                <Clock size={16} className="text-yellow-500 mr-2" />
                Pending
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleUpdateStatus(orderId, 'rejected');
                  setIsOpen(false);
                }}
                className="flex items-center w-full px-4 py-2 text-sm hover:bg-gunmetal-light"
              >
                <XCircle size={16} className="text-red-500 mr-2" />
                Rejected
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleUpdateStatus(orderId, 'fraud');
                  setIsOpen(false);
                }}
                className="flex items-center w-full px-4 py-2 text-sm hover:bg-gunmetal-light"
              >
                <AlertTriangle size={16} className="text-red-500 mr-2" />
                Fraud
              </button>
            </div>
          </div>
        )}
      </div>
    );
  };

  const filteredOrders = orders.filter(order => {
    const matchesSearch = 
      (order.user?.first_name?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
      (order.email?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
      (order.user?.phone_number || '').includes(searchTerm);
    
    if (filterStatus === 'all') return matchesSearch;
    return matchesSearch && order.order_status === filterStatus;
  });

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-8">
        <h2 className="text-3xl font-bold text-tan">Sales Management</h2>
      </div>

      {/* Search and Filter Bar */}
      <div className="bg-gunmetal p-4 rounded-sm shadow-luxury mb-6 flex flex-wrap gap-4">
        <div className="flex-1 min-w-[200px]">
          <div className="relative">
            <Search size={20} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search orders by phone or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-gunmetal-light pl-10 pr-4 py-2 rounded-sm"
            />
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Filter size={20} className="text-gray-400" />
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="bg-gunmetal-light px-4 py-2 rounded-sm"
          >
            <option value="all">All Statuses</option>
            <option value="pending">Pending</option>
            <option value="processing">Processing</option>
            <option value="shipped">Shipped</option>
            <option value="delivered">Delivered</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>
      </div>

      {error && (
        <div className="mb-6 p-4 rounded-sm bg-red-500/10 text-red-500">
          {error}
        </div>
      )}

      {/* Orders Table */}
      <div className="bg-gunmetal rounded-sm shadow-luxury overflow-hidden">
        {isLoading ? (
          <div className="p-6 text-center text-tan">Loading orders...</div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-gunmetal-light">
                <th className="px-6 py-4 text-left text-sm font-medium text-tan">Order ID</th>
                <th className="px-6 py-4 text-left text-sm font-medium text-tan">Date</th>
                <th className="px-6 py-4 text-left text-sm font-medium text-tan">Customer</th>
                <th className="px-6 py-4 text-left text-sm font-medium text-tan">Phone</th>
                <th className="px-6 py-4 text-left text-sm font-medium text-tan">Amount</th>
                <th className="px-6 py-4 text-left text-sm font-medium text-tan">Status</th>
                <th className="px-6 py-4 text-left text-sm font-medium text-tan">Payment</th>
              </tr>
            </thead>
            <tbody>
              {filteredOrders.map((order) => (
                <tr 
                  key={order.order_id} 
                  className="border-b border-gunmetal-light hover:bg-gunmetal-light/50 cursor-pointer"
                  onClick={() => handleOrderClick(order)}
                >
                  <td className="px-6 py-4 text-sm text-tan">{order.order_id}</td>
                  <td className="px-6 py-4 text-sm text-tan">
                    {new Date(order.created_at).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 text-sm text-tan">
                    <div className="flex flex-col">
                      <span>{order.user?.first_name} {order.user?.last_name}</span>
                      <span className="text-xs text-gray-400">{order.user?.email}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-tan">{order.phone_number || '-'}</td>
                  <td className="px-6 py-4 text-sm text-tan">
                    ${order.total_amount.toFixed(2)}
                  </td>
                  <td className="px-6 py-4">
                    <StatusMenu orderId={order.order_id} currentStatus={order.order_status} />
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded-sm ${
                      order.payment_status === 'paid' ? 'bg-green-500/10 text-green-500' : 
                      order.payment_status === 'pending' ? 'bg-yellow-500/10 text-yellow-500' : 
                      'bg-red-500/10 text-red-500'
                    }`}>
                      {order.payment_status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Order Details Modal */}
      {isViewingOrder && selectedOrder && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-gunmetal rounded-sm shadow-luxury w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gunmetal-light">
              <div className="flex justify-between items-center">
                <h3 className="text-xl font-bold text-tan">Order Details</h3>
                <button
                  onClick={() => setIsViewingOrder(false)}
                  className="p-2 hover:bg-gunmetal-light rounded-sm transition-colors"
                >
                  <X size={20} className="text-tan" />
                </button>
              </div>
            </div>

            <div className="p-6 space-y-6">
              {/* Order Information */}
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <h4 className="text-sm font-medium text-gray-400 mb-2">Order Information</h4>
                  <div className="space-y-2">
                    <p className="text-sm text-tan">
                      <span className="text-gray-400">Order ID:</span> {selectedOrder.order_id}
                    </p>
                    <p className="text-sm text-tan">
                      <span className="text-gray-400">Date:</span> {new Date(selectedOrder.created_at).toLocaleString()}
                    </p>
                    <p className="text-sm text-tan">
                      <span className="text-gray-400">Status:</span> {selectedOrder.order_status}
                    </p>
                    <p className="text-sm text-tan">
                      <span className="text-gray-400">Payment Status:</span> {selectedOrder.payment_status}
                    </p>
                    <p className="text-sm text-tan">
                      <span className="text-gray-400">Payment Method:</span> {selectedOrder.payment_method}
                    </p>
                    <p className="text-sm text-tan">
                      <span className="text-gray-400">Shipping Method:</span> {selectedOrder.shipping_method}
                    </p>
                    {selectedOrder.tracking_number && (
                      <p className="text-sm text-tan">
                        <span className="text-gray-400">Tracking Number:</span> {selectedOrder.tracking_number}
                      </p>
                    )}
                    <p className="text-sm text-tan">
                      <span className="text-gray-400">Total Amount:</span> ${selectedOrder.total_amount.toFixed(2)}
                    </p>
                    {selectedOrder.requires_ffl && (
                      <p className="text-sm text-tan">
                        <span className="text-gray-400">FFL Required:</span> Yes
                      </p>
                    )}
                  </div>
                </div>

                <div>
                  <h4 className="text-sm font-medium text-gray-400 mb-2">Customer Information</h4>
                  <div className="space-y-2">
                    <p className="text-sm text-tan">
                      <span className="text-gray-400">Name:</span> {selectedOrder.user?.first_name} {selectedOrder.user?.last_name}
                    </p>
                    <p className="text-sm text-tan">
                      <span className="text-gray-400">Email:</span> {selectedOrder.user?.email}
                    </p>
                    <p className="text-sm text-tan">
                      <span className="text-gray-400">Phone:</span> {selectedOrder.phone_number || 'Not provided'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Shipping Address */}
              <div>
                <h4 className="text-sm font-medium text-gray-400 mb-2">Shipping Address</h4>
                <div className="bg-gunmetal-light p-4 rounded-sm">
                  <p className="text-sm text-tan whitespace-pre-line">
                    {selectedOrder.shipping_address || 'Not provided'}
                  </p>
                </div>
              </div>

              {/* Billing Address */}
              <div>
                <h4 className="text-sm font-medium text-gray-400 mb-2">Billing Address</h4>
                <div className="bg-gunmetal-light p-4 rounded-sm">
                  <p className="text-sm text-tan whitespace-pre-line">
                    {selectedOrder.billing_address || 'Not provided'}
                  </p>
                </div>
              </div>

              {/* FFL Dealer Info */}
              {selectedOrder.requires_ffl && selectedOrder.ffl_dealer_info && (
                <div>
                  <h4 className="text-sm font-medium text-gray-400 mb-2">FFL Dealer Information</h4>
                  <div className="bg-gunmetal-light p-4 rounded-sm">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-tan">
                          <span className="text-gray-400">License Name:</span> {selectedOrder.ffl_dealer_info.license_name}
                        </p>
                        {selectedOrder.ffl_dealer_info.business_name && (
                          <p className="text-sm text-tan">
                            <span className="text-gray-400">Business Name:</span> {selectedOrder.ffl_dealer_info.business_name}
                          </p>
                        )}
                        <p className="text-sm text-tan">
                          <span className="text-gray-400">License Number:</span> {selectedOrder.ffl_dealer_info.lic_seqn}
                        </p>
                        <p className="text-sm text-tan">
                          <span className="text-gray-400">License Type:</span> {selectedOrder.ffl_dealer_info.lic_type}
                        </p>
                        <p className="text-sm text-tan">
                          <span className="text-gray-400">Phone:</span> {selectedOrder.ffl_dealer_info.voice_phone}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-tan">
                          <span className="text-gray-400">Premise Address:</span>
                        </p>
                        <p className="text-sm text-tan whitespace-pre-line">
                          {selectedOrder.ffl_dealer_info.premise_street}
                          {selectedOrder.ffl_dealer_info.premise_city && `\n${selectedOrder.ffl_dealer_info.premise_city}, ${selectedOrder.ffl_dealer_info.premise_state} ${selectedOrder.ffl_dealer_info.premise_zip_code}`}
                        </p>
                        {selectedOrder.ffl_dealer_info.mail_street !== selectedOrder.ffl_dealer_info.premise_street && (
                          <>
                            <p className="text-sm text-tan mt-2">
                              <span className="text-gray-400">Mailing Address:</span>
                            </p>
                            <p className="text-sm text-tan whitespace-pre-line">
                              {selectedOrder.ffl_dealer_info.mail_street}
                              {selectedOrder.ffl_dealer_info.mail_city && `\n${selectedOrder.ffl_dealer_info.mail_city}, ${selectedOrder.ffl_dealer_info.mail_state} ${selectedOrder.ffl_dealer_info.mail_zip_code}`}
                            </p>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Order Items */}
              <div>
                <h4 className="text-sm font-medium text-gray-400 mb-2">Order Items</h4>
                <div className="bg-gunmetal-light rounded-sm overflow-hidden">
                  {selectedOrder.order_items === null ? (
                    <div className="p-4 text-center text-tan">Order items not available</div>
                  ) : selectedOrder.order_items && selectedOrder.order_items.length > 0 ? (
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-gunmetal">
                          <th className="px-4 py-2 text-left text-sm font-medium text-tan">Product</th>
                          <th className="px-4 py-2 text-left text-sm font-medium text-tan">Options</th>
                          <th className="px-4 py-2 text-left text-sm font-medium text-tan">Quantity</th>
                          <th className="px-4 py-2 text-left text-sm font-medium text-tan">Price</th>
                          <th className="px-4 py-2 text-left text-sm font-medium text-tan">Total</th>
                        </tr>
                      </thead>
                      <tbody>
                        {selectedOrder.order_items.map((item, index) => (
                          <tr key={index} className="border-b border-gunmetal">
                            <td className="px-4 py-2 text-sm text-tan">{item.name || '-'}</td>
                            <td className="px-4 py-2 text-sm text-tan">
                              {item.options && (
                                <pre className="text-xs whitespace-pre-wrap">
                                  {JSON.stringify(item.options, null, 2)}
                                </pre>
                              )}
                            </td>
                            <td className="px-4 py-2 text-sm text-tan">{item.quantity || 0}</td>
                            <td className="px-4 py-2 text-sm text-tan">
                              ${(item.price || 0).toFixed(2)}
                            </td>
                            <td className="px-4 py-2 text-sm text-tan">
                              ${(item.total || 0).toFixed(2)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  ) : (
                    <div className="p-4 text-center text-tan">No items found in this order</div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SalesPage; 