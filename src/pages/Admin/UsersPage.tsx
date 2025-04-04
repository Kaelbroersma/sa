import React, { useState, useEffect } from 'react';
import { Search, Filter, User, X, Check, AlertCircle } from 'lucide-react';
import { callNetlifyFunction } from '../../lib/supabase';

interface UserData {
  user_id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone_number: string;
  address_line1: string;
  address_line2: string;
  city: string;
  state: string;
  country: string;
  postal_code: string;
  user_role: string;
  account_created_date: string;
  account_status: string;
  last_login: string;
  accepted_terms: boolean;
  marketing_opt_in: boolean;
  is_super_admin: boolean;
}

const UsersPage: React.FC = () => {
  const [users, setUsers] = useState<UserData[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState('all');
  const [isEditing, setIsEditing] = useState(false);
  const [editingUser, setEditingUser] = useState<UserData | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      console.log('Fetching users...');
      const response = await callNetlifyFunction('adminUsers');
      console.log('Raw response:', response);
      
      if (response.error) {
        console.error('Error in response:', response.error);
        setError(response.error.message || 'Failed to fetch users');
        return;
      }
      
      if (!response.data) {
        console.error('No data in response');
        setError('No users found');
        return;
      }
      
      console.log('Users data:', response.data);
      setUsers(response.data);
    } catch (error: any) {
      console.error('Error fetching users:', error);
      setError(error.message || 'Failed to fetch users');
    }
  };

  const handleUpdateUser = async (userId: string, updates: any) => {
    try {
      const response = await callNetlifyFunction('adminUpdateUser', {
        user_id: userId,
        ...updates
      });
      if (response.error) throw response.error;
      fetchUsers();
    } catch (error) {
      console.error('Error updating user:', error);
      setError('Failed to update user');
    }
  };

  const handleEdit = (user: UserData) => {
    setEditingUser(user);
    setIsEditing(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;

    const { error } = await callNetlifyFunction('updateUser', {
      user_id: editingUser.user_id,
      first_name: editingUser.first_name,
      last_name: editingUser.last_name,
      phone_number: editingUser.phone_number,
      user_role: editingUser.user_role,
      account_status: editingUser.account_status,
      marketing_opt_in: editingUser.marketing_opt_in
    });

    if (error) {
      console.error('Error updating user:', error);
      return;
    }

    setIsEditing(false);
    setEditingUser(null);
    fetchUsers();
  };

  const filteredUsers = users.filter(user => {
    const matchesSearch = 
      user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      `${user.first_name} ${user.last_name}`.toLowerCase().includes(searchTerm.toLowerCase());

    if (filterRole === 'all') return matchesSearch;
    return matchesSearch && user.user_role === filterRole;
  });

  return (
    <div>
      <h2 className="text-3xl font-bold text-tan mb-8">User Management</h2>

      {/* Search and Filter Bar */}
      <div className="bg-gunmetal p-4 rounded-sm shadow-luxury mb-6 flex flex-wrap gap-4">
        <div className="flex-1 min-w-[200px]">
          <div className="relative">
            <Search size={20} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search users..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-gunmetal-light pl-10 pr-4 py-2 rounded-sm"
            />
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Filter size={20} className="text-gray-400" />
          <select
            value={filterRole}
            onChange={(e) => setFilterRole(e.target.value)}
            className="bg-gunmetal-light px-4 py-2 rounded-sm"
          >
            <option value="all">All Roles</option>
            <option value="customer">Customers</option>
            <option value="admin">Admins</option>
          </select>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-gunmetal rounded-sm shadow-luxury overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gunmetal-light">
              <tr>
                <th className="px-6 py-3 text-left text-sm font-medium">User</th>
                <th className="px-6 py-3 text-left text-sm font-medium">Contact</th>
                <th className="px-6 py-3 text-left text-sm font-medium">Role</th>
                <th className="px-6 py-3 text-left text-sm font-medium">Status</th>
                <th className="px-6 py-3 text-left text-sm font-medium">Last Login</th>
                <th className="px-6 py-3 text-left text-sm font-medium">Marketing</th>
                <th className="px-6 py-3 text-left text-sm font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gunmetal-light">
              {filteredUsers.map((user) => (
                <tr
                  key={user.user_id}
                  className="hover:bg-gunmetal-light/50 transition-colors"
                >
                  <td className="px-6 py-4">
                    <div className="flex items-center">
                      <div className="bg-tan/10 p-2 rounded-sm mr-3">
                        <User size={16} className="text-tan" />
                      </div>
                      <div>
                        <div className="font-medium">{user.first_name} {user.last_name}</div>
                        <div className="text-sm text-gray-400">{user.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm">
                    <div>{user.phone_number || 'N/A'}</div>
                    <div className="text-gray-400">{user.city}, {user.state}</div>
                  </td>
                  <td className="px-6 py-4 text-sm">
                    <span className={`px-2 py-1 rounded-sm ${
                      user.is_super_admin ? 'bg-purple-500/10 text-purple-500' : 'bg-blue-500/10 text-blue-500'
                    }`}>
                      {user.is_super_admin ? 'Super Admin' : user.user_role}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm">
                    <span className={`px-2 py-1 rounded-sm ${
                      user.account_status === 'active' ? 'bg-green-500/10 text-green-500' : 'bg-yellow-500/10 text-yellow-500'
                    }`}>
                      {user.account_status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm">
                    {new Date(user.last_login).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4">
                    {user.marketing_opt_in ? (
                      <Check size={16} className="text-green-500" />
                    ) : (
                      <X size={16} className="text-gray-400" />
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <button
                      onClick={() => handleEdit(user)}
                      className="text-tan hover:text-tan/80 transition-colors"
                    >
                      Edit
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Edit Modal */}
      {isEditing && editingUser && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center">
          <div className="bg-gunmetal p-6 rounded-sm w-full max-w-lg">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold">Edit User</h3>
              <button
                onClick={() => setIsEditing(false)}
                className="p-2 hover:bg-gunmetal-light rounded-sm transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSave}>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">First Name</label>
                    <input
                      type="text"
                      value={editingUser.first_name}
                      onChange={(e) => setEditingUser({ ...editingUser, first_name: e.target.value })}
                      className="w-full bg-gunmetal-light p-2 rounded-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Last Name</label>
                    <input
                      type="text"
                      value={editingUser.last_name}
                      onChange={(e) => setEditingUser({ ...editingUser, last_name: e.target.value })}
                      className="w-full bg-gunmetal-light p-2 rounded-sm"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Phone Number</label>
                  <input
                    type="text"
                    value={editingUser.phone_number}
                    onChange={(e) => setEditingUser({ ...editingUser, phone_number: e.target.value })}
                    className="w-full bg-gunmetal-light p-2 rounded-sm"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Role</label>
                  <select
                    value={editingUser.user_role}
                    onChange={(e) => setEditingUser({ ...editingUser, user_role: e.target.value })}
                    className="w-full bg-gunmetal-light p-2 rounded-sm"
                    disabled={editingUser.is_super_admin}
                  >
                    <option value="customer">Customer</option>
                    <option value="admin">Admin</option>
                  </select>
                  {editingUser.is_super_admin && (
                    <div className="flex items-center mt-2 text-sm text-yellow-500">
                      <AlertCircle size={16} className="mr-2" />
                      Super Admin role can only be modified through database
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Account Status</label>
                  <select
                    value={editingUser.account_status}
                    onChange={(e) => setEditingUser({ ...editingUser, account_status: e.target.value })}
                    className="w-full bg-gunmetal-light p-2 rounded-sm"
                  >
                    <option value="active">Active</option>
                    <option value="suspended">Suspended</option>
                  </select>
                </div>

                <div className="flex items-center">
                  <input
                    type="checkbox"
                    checked={editingUser.marketing_opt_in}
                    onChange={(e) => setEditingUser({ ...editingUser, marketing_opt_in: e.target.checked })}
                    className="mr-2"
                  />
                  <label className="text-sm font-medium">Marketing Communications Opt-in</label>
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

export default UsersPage; 