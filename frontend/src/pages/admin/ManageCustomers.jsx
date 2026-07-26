import React, { useState, useEffect } from 'react';
import API from '../../api/axios';
import { useAuth } from '../../context/AuthContext';
import { Users, Search, RefreshCw, AlertCircle, MapPin, X, User } from 'lucide-react';
import toast from 'react-hot-toast';

const ManageCustomers = () => {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Selected user for address details modal
  const [selectedUser, setSelectedUser] = useState(null);
  const [showAddressModal, setShowAddressModal] = useState(false);

  const fetchUsers = async () => {
    setLoading(true);
    setError('');
    try {
      const { data } = await API.get('/api/auth/users');
      setUsers(data);
      setLoading(false);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to retrieve customers registry');
      setLoading(false);
    }
  };

  const handleRoleChange = async (userId, newRole) => {
    try {
      await API.put(`/api/auth/users/${userId}/role`, { role: newRole });
      
      // Update local state dynamically
      setUsers((prev) =>
        prev.map((u) => (u._id === userId ? { ...u, role: newRole } : u))
      );
      
      toast.success('User role updated successfully');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update user role');
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  // Filtered users lists
  const filteredUsers = users.filter((u) => {
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      return (
        u.name?.toLowerCase().includes(query) ||
        u.email?.toLowerCase().includes(query)
      );
    }
    return true;
  });

  const totalUsers = users.length;
  const customersCount = users.filter((u) => u.role === 'customer').length;
  const adminsCount = users.filter((u) => u.role === 'admin').length;

  const handleOpenAddresses = (userObj) => {
    setSelectedUser(userObj);
    setShowAddressModal(true);
  };

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <RefreshCw className="h-8 w-8 animate-spin text-blue-500" />
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Customer Directory</h1>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Review registered user accounts, update permission roles, and check total order counts</p>
      </div>

      {error && (
        <div className="rounded-xl border border-red-500/20 bg-red-500/10 p-4 text-xs text-red-405 flex items-center gap-2">
          <AlertCircle className="h-5 w-5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Metrics Cards Grid */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
        <div className="glass-card rounded-2xl border border-slate-200 dark:border-slate-850 p-5 flex items-center justify-between shadow-sm">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-slate-455">Total Accounts</span>
            <h3 className="text-2xl font-extrabold text-slate-900 dark:text-white mt-1">{totalUsers}</h3>
          </div>
          <div className="rounded-2xl bg-blue-500/10 p-3 text-blue-600 dark:text-blue-400 border border-blue-500/20">
            <Users className="h-6 w-6" />
          </div>
        </div>

        <div className="glass-card rounded-2xl border border-slate-200 dark:border-slate-850 p-5 flex items-center justify-between shadow-sm">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-slate-455">Customers</span>
            <h3 className="text-2xl font-extrabold text-slate-900 dark:text-white mt-1">{customersCount}</h3>
          </div>
          <div className="rounded-2xl bg-emerald-500/10 p-3 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
            <User className="h-6 w-6" />
          </div>
        </div>

        <div className="glass-card rounded-2xl border border-slate-200 dark:border-slate-850 p-5 flex items-center justify-between shadow-sm">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-slate-455">Administrators</span>
            <h3 className="text-2xl font-extrabold text-slate-900 dark:text-white mt-1">{adminsCount}</h3>
          </div>
          <div className="rounded-2xl bg-purple-500/10 p-3 text-purple-600 dark:text-purple-400 border border-purple-500/20">
            <Users className="h-6 w-6" />
          </div>
        </div>
      </div>

      {/* Filter and Search actions bar */}
      <div className="flex bg-slate-100/50 dark:bg-[#0f172a]/20 p-4 rounded-2xl border border-slate-200 dark:border-slate-850">
        <div className="relative w-full sm:max-w-md">
          <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400 dark:text-slate-500">
            <Search className="h-4.5 w-4.5" />
          </span>
          <input
            type="text"
            placeholder="Search by name or email address..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0f172a] py-2 pl-9 pr-4 text-xs text-slate-900 dark:text-slate-200 outline-none focus:border-blue-500"
          />
        </div>
      </div>

      {/* Users table list */}
      <div className="glass-card overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-850 shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left text-xs text-slate-700 dark:text-slate-350">
            <thead className="border-b border-slate-200 dark:border-slate-850 bg-[#0f172a]/5 dark:bg-[#0f172a]/40 text-[10px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-450">
              <tr>
                <th className="px-6 py-4">Account Name</th>
                <th className="px-6 py-4">Email Address</th>
                <th className="px-6 py-4">Security Role</th>
                <th className="px-6 py-4">Orders Placed</th>
                <th className="px-6 py-4">Date Registered</th>
                <th className="px-6 py-4">Saved Locations</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-850/50">
              {filteredUsers.length > 0 ? (
                filteredUsers.map((u) => (
                  <tr key={u._id} className="hover:bg-slate-100/50 dark:hover:bg-slate-800/10 transition-colors">
                    <td className="px-6 py-3.5 font-bold text-slate-900 dark:text-white truncate max-w-[150px]">{u.name}</td>
                    <td className="px-6 py-3.5 text-slate-600 dark:text-slate-300">{u.email}</td>
                    <td className="px-6 py-3.5">
                      {currentUser && (currentUser._id === u._id || currentUser.id === u._id) ? (
                        <span className="rounded-full px-2.5 py-1 font-bold text-[10px] border uppercase bg-purple-550/15 text-purple-600 border-purple-500/20">
                          {u.role} (You)
                        </span>
                      ) : (
                        <select
                          value={u.role}
                          onChange={(e) => handleRoleChange(u._id, e.target.value)}
                          className="rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0f172a] px-2 py-0.5 text-xs text-slate-905 dark:text-slate-200 outline-none focus:border-blue-500 font-semibold"
                        >
                          <option value="customer">customer</option>
                          <option value="admin">admin</option>
                        </select>
                      )}
                    </td>
                    <td className="px-6 py-3.5 font-extrabold text-blue-600 dark:text-blue-400">
                      {u.orderCount || 0} orders
                    </td>
                    <td className="px-6 py-3.5 text-slate-500 dark:text-slate-450">
                      {new Date(u.createdAt).toLocaleDateString(undefined, {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric'
                      })}
                    </td>
                    <td className="px-6 py-3.5 font-semibold text-slate-850 dark:text-slate-200">
                      {u.addresses?.length || 0} addresses saved
                    </td>
                    <td className="px-6 py-3.5 text-right">
                      {u.addresses && u.addresses.length > 0 ? (
                        <button
                          onClick={() => handleOpenAddresses(u)}
                          className="rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0f172a] px-3 py-1.5 font-semibold hover:border-slate-350 dark:hover:border-slate-700 transition-all text-blue-500 hover:text-blue-650"
                        >
                          View Addresses
                        </button>
                      ) : (
                        <span className="text-slate-400 dark:text-slate-655 italic">No saved addresses</span>
                      )}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="7" className="py-12 text-center text-slate-550 dark:text-slate-450">
                    No matching accounts in user index directory
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Shipping Address Details popup modal */}
      {showAddressModal && selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="glass-card w-full max-w-lg rounded-2xl p-6 border border-slate-200 dark:border-slate-850 bg-white dark:bg-[#0f172a] shadow-2xl relative space-y-6">
            <button
              onClick={() => setShowAddressModal(false)}
              className="absolute right-4 top-4 rounded-full p-1.5 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              <X className="h-5 w-5" />
            </button>

            <div>
              <h3 className="text-md font-bold text-slate-905 dark:text-white">Shipping Addresses</h3>
              <p className="text-xs text-slate-500 mt-1">Saved addresses list for {selectedUser.name}</p>
            </div>

            <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
              {selectedUser.addresses?.map((addr, idx) => (
                <div key={idx} className="flex items-start gap-3 rounded-xl bg-slate-100/50 dark:bg-slate-900/30 p-3.5 border border-slate-200 dark:border-slate-850 text-xs">
                  <MapPin className="h-4.5 w-4.5 text-blue-500 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold text-slate-800 dark:text-slate-200 block">Address #{idx + 1}</span>
                    <p className="mt-1 text-slate-700 dark:text-slate-355">{addr.line1}</p>
                    <p className="text-slate-600 dark:text-slate-400">{addr.city}, {addr.state} - {addr.pincode}</p>
                    <p className="text-slate-500 mt-1">Phone: {addr.phone}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="pt-2">
              <button
                type="button"
                onClick={() => setShowAddressModal(false)}
                className="w-full rounded-lg bg-slate-100 dark:bg-slate-900 border border-slate-250 dark:border-slate-850 py-2.5 text-center text-xs font-semibold text-slate-700 dark:text-slate-350 hover:bg-slate-200 dark:hover:bg-slate-850 transition-colors"
              >
                Close details
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ManageCustomers;
