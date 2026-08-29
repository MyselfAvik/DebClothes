import React, { useState, useEffect } from 'react';
import API from '../../api/axios';
import { Package, MapPin, User, Save, CheckCircle, RefreshCw, AlertCircle, ShoppingBag, MessageSquare, Truck, RotateCcw, Check, X, ShieldAlert, Sparkles, Filter, CreditCard, Smartphone, Building2, Clock } from 'lucide-react';
import toast from 'react-hot-toast';

const ManageOrders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionLoadingId, setActionLoadingId] = useState(null);

  // Status and Shipping Notes input maps
  const [statusMap, setStatusMap] = useState({});
  const [notesMap, setNotesMap] = useState({});

  // Filter & Search states
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState('needs_action');
  const [lightboxImage, setLightboxImage] = useState(null);

  // Refund Confirmation Modal States
  const [refundModalOrder, setRefundModalOrder] = useState(null);
  const [refundTxnRef, setRefundTxnRef] = useState('');
  const [refundAdminNote, setRefundAdminNote] = useState('');
  const [submittingRefund, setSubmittingRefund] = useState(false);

  const getImageUrl = (imagePath) => {
    if (!imagePath) return 'https://images.unsplash.com/photo-1523381210434-271e8be1f52b?auto=format&fit=crop&q=80&w=100';
    if (imagePath.startsWith('http')) return imagePath;
    return `http://localhost:5000/${imagePath}`;
  };

  const filteredOrders = orders.filter((order) => {
    if (selectedFilter === 'needs_action') {
      const isPending = order.orderStatus === 'placed' || order.orderStatus === 'return_requested' || order.paymentStatus === 'refund_pending';
      if (!isPending) return false;
    } else if (selectedFilter === 'refund_pending') {
      const isPending = order.paymentStatus === 'refund_pending' || (order.orderStatus === 'cancelled' && order.cancellationDetails?.refundMethod && order.cancellationDetails.refundMethod !== 'none') || order.orderStatus === 'return_requested' || order.paymentStatus === 'refunded';
      if (!isPending) return false;
    } else if (selectedFilter === 'in_fulfillment') {
      if (!['confirmed', 'shipped', 'out_for_delivery', 'out_for_pickup'].includes(order.orderStatus)) return false;
    } else if (selectedFilter === 'returns') {
      if (!['return_requested', 'return_approved', 'out_for_pickup', 'returned', 'return_rejected'].includes(order.orderStatus)) return false;
    } else if (selectedFilter !== 'all' && order.orderStatus !== selectedFilter) {
      return false;
    }

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      const orderIdMatch = order._id?.toLowerCase().includes(query);
      const userNameMatch = order.user?.name?.toLowerCase().includes(query);
      const productMatch = order.items?.some(item => item.product?.title?.toLowerCase().includes(query));
      const upiMatch = order.cancellationDetails?.upiId?.toLowerCase().includes(query) || order.returnDetails?.upiId?.toLowerCase().includes(query);
      const bankMatch = order.cancellationDetails?.bankDetails?.accountNumber?.includes(query) || order.returnDetails?.bankDetails?.accountNumber?.includes(query);
      return orderIdMatch || userNameMatch || productMatch || upiMatch || bankMatch;
    }
    return true;
  });

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const { data } = await API.get('/api/orders');
      setOrders(data);

      // Populate input states
      const statuses = {};
      const notes = {};
      data.forEach((o) => {
        statuses[o._id] = o.orderStatus;
        notes[o._id] = o.shippingNotes || '';
      });
      setStatusMap(statuses);
      setNotesMap(notes);
      
      setLoading(false);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load order book');
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const handleUpdateOrder = async (orderId) => {
    setError('');
    setActionLoadingId(orderId);
    try {
      const status = statusMap[orderId];
      const shippingNotes = notesMap[orderId];

      const { data } = await API.put(`/api/orders/${orderId}/status`, {
        status,
        shippingNotes
      });
      
      // Update local state directly
      setOrders((prev) =>
        prev.map((order) => {
          if (order._id === orderId) {
            return {
              ...order,
              orderStatus: data.orderStatus,
              paymentStatus: data.paymentStatus,
              shippingNotes: data.shippingNotes,
              returnDetails: data.returnDetails
            };
          }
          return order;
        })
      );
      
      toast.success('Order updated successfully!');
      setActionLoadingId(null);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update order');
      setError(err.response?.data?.message || 'Failed to update order');
      setActionLoadingId(null);
    }
  };

  const handleQuickUpdateStatus = async (orderId, newStatus, note = '') => {
    setActionLoadingId(orderId);
    try {
      const { data } = await API.put(`/api/orders/${orderId}/status`, {
        status: newStatus,
        shippingNotes: note || `Status updated to ${newStatus.replace(/_/g, ' ')}`
      });

      setOrders((prev) =>
        prev.map((order) => {
          if (order._id === orderId) {
            return {
              ...order,
              orderStatus: data.orderStatus,
              paymentStatus: data.paymentStatus,
              shippingNotes: data.shippingNotes,
              returnDetails: data.returnDetails
            };
          }
          return order;
        })
      );
      
      setStatusMap((prev) => ({ ...prev, [orderId]: data.orderStatus }));
      setNotesMap((prev) => ({ ...prev, [orderId]: data.shippingNotes || '' }));

      toast.success(`Order ${newStatus.replace(/_/g, ' ')} successfully!`);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update order status');
    } finally {
      setActionLoadingId(null);
    }
  };

  const getStatusBadgeClass = (status) => {
    switch (status) {
      case 'placed':
        return 'bg-blue-550/10 text-blue-600 dark:text-blue-400 border-blue-500/20';
      case 'confirmed':
        return 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/20';
      case 'shipped':
        return 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20';
      case 'out_for_delivery':
        return 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20 animate-pulse';
      case 'delivered':
        return 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20';
      case 'return_requested':
        return 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20';
      case 'return_approved':
        return 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/20';
      case 'out_for_pickup':
        return 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20 animate-pulse';
      case 'returning_to_seller':
        return 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/20 animate-pulse';
      case 'returned':
        return 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20';
      case 'return_rejected':
        return 'bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20';
      case 'cancelled':
        return 'bg-red-500/10 text-red-650 dark:text-red-400 border-red-500/20';
      default:
        return 'bg-slate-500/10 text-slate-500 border-slate-500/20';
    }
  };

  const getStatusLabel = (status) => {
    switch (status) {
      case 'placed': return 'Placed';
      case 'confirmed': return 'Order Confirmed';
      case 'shipped': return 'Shipped';
      case 'out_for_delivery': return 'Out For Delivery';
      case 'delivered': return 'Delivered';
      case 'return_requested': return 'Return Requested';
      case 'return_approved': return 'Return Approved';
      case 'out_for_pickup': return 'Out For Pickup';
      case 'returning_to_seller': return 'In Transit to Seller';
      case 'returned': return 'Returned & Refunded';
      case 'return_rejected': return 'Return Rejected';
      case 'cancelled': return 'Cancelled';
      default: return status;
    }
  };

  const pendingNewOrders = orders.filter((o) => o.orderStatus === 'placed');
  const pendingReturnRequests = orders.filter((o) => o.orderStatus === 'return_requested');
  const pendingRefundOrders = orders.filter((o) => {
    const isPaid = o.paymentStatus === 'paid' || o.paymentMethod === 'ONLINE' || (o.cancellationDetails?.refundMethod && o.cancellationDetails.refundMethod !== 'none');
    const isReturn = ['return_requested', 'return_approved', 'out_for_pickup', 'returning_to_seller', 'returned'].includes(o.orderStatus);
    return o.paymentStatus === 'refund_pending' || (o.orderStatus === 'cancelled' && isPaid && o.paymentStatus !== 'refunded') || (isReturn && o.paymentStatus !== 'refunded');
  });
  const totalPendingActionCount = pendingNewOrders.length + pendingReturnRequests.length + pendingRefundOrders.length;

  const handleConfirmRefund = async () => {
    if (!refundModalOrder) return;
    setSubmittingRefund(true);
    try {
      const { data } = await API.put(`/api/orders/${refundModalOrder._id}/refund`, {
        paymentStatus: 'refunded',
        transactionReference: refundTxnRef,
        adminComment: refundAdminNote,
      });

      setOrders((prev) =>
        prev.map((order) => {
          if (order._id === refundModalOrder._id) {
            return {
              ...order,
              paymentStatus: 'refunded',
              cancellationDetails: data.order?.cancellationDetails || order.cancellationDetails,
              returnDetails: data.order?.returnDetails || order.returnDetails,
            };
          }
          return order;
        })
      );

      toast.success(`Refund of ₹${refundModalOrder.totalAmount} marked as completed!`);
      setRefundModalOrder(null);
      setRefundTxnRef('');
      setRefundAdminNote('');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to process refund');
    } finally {
      setSubmittingRefund(false);
    }
  };

  if (loading && orders.length === 0) {
    return (
      <div className="flex h-96 items-center justify-center">
        <RefreshCw className="h-8 w-8 animate-spin text-blue-500" />
      </div>
    );
  }

  return (
    <div className="max-w-[1400px] mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <span>Customer Order Desk</span>
            {totalPendingActionCount > 0 && (
              <span className="rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 px-3 py-0.5 text-xs font-bold animate-pulse">
                {totalPendingActionCount} Action Required
              </span>
            )}
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Review new orders, manage fulfillment status, process refunds and handle returns</p>
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-2 rounded-lg bg-red-500/10 p-4 text-xs text-red-405 border border-red-500/20">
          <AlertCircle className="h-5 w-5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* DEDICATED ADMIN ACTION REQUIRED SECTION */}
      {totalPendingActionCount > 0 && (
        <div className="rounded-2xl border-2 border-amber-500/30 bg-gradient-to-r from-amber-500/10 via-orange-500/5 to-amber-500/10 p-6 space-y-4 shadow-lg shadow-amber-500/5">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
            <div className="flex items-center gap-2">
              <span className="flex h-3 w-3 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-amber-500"></span>
              </span>
              <h2 className="text-md font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                <ShieldAlert className="h-5 w-5 text-amber-500" />
                <span>Admin Input Required ({totalPendingActionCount})</span>
              </h2>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-400">
              Orders, refunds & return requests awaiting your immediate review & approval
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-1">
            {/* New Orders Pending Accept/Confirm */}
            {pendingNewOrders.length > 0 && (
              <div className="bg-white dark:bg-[#0f172a] rounded-xl p-4 border border-blue-500/20 shadow-sm space-y-3">
                <div className="flex justify-between items-center border-b border-slate-150 dark:border-slate-800 pb-2">
                  <span className="text-xs font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider flex items-center gap-1.5">
                    <ShoppingBag className="h-4 w-4" />
                    <span>New Orders ({pendingNewOrders.length})</span>
                  </span>
                  <span className="text-[10px] bg-blue-500/10 text-blue-600 dark:text-blue-400 px-2 py-0.5 rounded font-bold">Needs Confirmation</span>
                </div>

                <div className="space-y-2.5 max-h-60 overflow-y-auto pr-1">
                  {pendingNewOrders.map((order) => (
                    <div key={order._id} className="p-3 rounded-lg bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 text-xs space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="font-bold text-slate-900 dark:text-white uppercase">#{order._id.substring(0, 10)}</span>
                        <span className="font-extrabold text-blue-600 dark:text-blue-400">₹{order.totalAmount}</span>
                      </div>
                      <div className="text-[11px] text-slate-500">
                        Customer: <strong className="text-slate-700 dark:text-slate-300">{order.user?.name || 'Customer'}</strong> ({order.paymentMethod})
                      </div>

                      <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-200/50 dark:border-slate-800/50">
                        <span className="text-[10px] text-slate-450">{order.items?.length || 0} item(s)</span>
                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={() => handleQuickUpdateStatus(order._id, 'confirmed', 'Order accepted & confirmed by admin.')}
                            disabled={actionLoadingId === order._id}
                            className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs transition-all flex items-center gap-1 shadow-sm shadow-blue-500/20"
                          >
                            {actionLoadingId === order._id ? <RefreshCw className="h-3 w-3 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
                            <span>Accept Order</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => handleQuickUpdateStatus(order._id, 'cancelled', 'Order cancelled by admin.')}
                            disabled={actionLoadingId === order._id}
                            className="px-2.5 py-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-500 font-semibold text-xs transition-colors"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Pending Refund Payouts */}
            {pendingRefundOrders.length > 0 && (
              <div className="bg-white dark:bg-[#0f172a] rounded-xl p-4 border border-emerald-500/20 shadow-sm space-y-3">
                <div className="flex justify-between items-center border-b border-slate-150 dark:border-slate-800 pb-2">
                  <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
                    <CreditCard className="h-4 w-4" />
                    <span>Refunds Pending ({pendingRefundOrders.length})</span>
                  </span>
                  <span className="text-[10px] bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 px-2 py-0.5 rounded font-bold">Payout Required</span>
                </div>

                <div className="space-y-2.5 max-h-60 overflow-y-auto pr-1">
                  {pendingRefundOrders.map((order) => (
                    <div key={order._id} className="p-3 rounded-lg bg-emerald-500/5 dark:bg-slate-900/60 border border-emerald-500/20 text-xs space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="font-bold text-slate-900 dark:text-white uppercase">#{order._id.substring(0, 10)}</span>
                        <span className="font-extrabold text-emerald-600 dark:text-emerald-400">₹{order.totalAmount}</span>
                      </div>
                      <div className="text-[11px] text-slate-600 dark:text-slate-300">
                        {order.cancellationDetails?.refundMethod === 'upi' || order.returnDetails?.refundMethod === 'upi' ? (
                          <span className="font-bold text-blue-600 dark:text-blue-400">
                            UPI: {order.cancellationDetails?.upiId || order.returnDetails?.upiId}
                          </span>
                        ) : (
                          <span>
                            Bank: <strong>{order.cancellationDetails?.bankDetails?.bankName || order.returnDetails?.bankDetails?.bankName || 'Bank'}</strong> (A/C: ****{(order.cancellationDetails?.bankDetails?.accountNumber || order.returnDetails?.bankDetails?.accountNumber)?.slice(-4)})
                          </span>
                        )}
                      </div>

                      <div className="flex items-center justify-between gap-2 pt-2 border-t border-emerald-500/20">
                        <span className="text-[10px] text-slate-450 truncate max-w-[100px]">
                          {order.cancellationDetails?.reason || order.returnDetails?.reason || 'Cancelled'}
                        </span>
                        <button
                          type="button"
                          onClick={() => {
                            setRefundModalOrder(order);
                            setRefundTxnRef('');
                            setRefundAdminNote('');
                          }}
                          className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs transition-all flex items-center gap-1 shadow-sm shadow-emerald-500/20"
                        >
                          <Check className="h-3.5 w-3.5" />
                          <span>Pay & Refund</span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Return Requests Pending Accept/Reject */}
            {pendingReturnRequests.length > 0 && (
              <div className="bg-white dark:bg-[#0f172a] rounded-xl p-4 border border-amber-500/20 shadow-sm space-y-3">
                <div className="flex justify-between items-center border-b border-slate-150 dark:border-slate-800 pb-2">
                  <span className="text-xs font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                    <RotateCcw className="h-4 w-4" />
                    <span>Return Requests ({pendingReturnRequests.length})</span>
                  </span>
                  <span className="text-[10px] bg-amber-500/10 text-amber-600 dark:text-amber-400 px-2 py-0.5 rounded font-bold">Needs Review</span>
                </div>

                <div className="space-y-2.5 max-h-60 overflow-y-auto pr-1">
                  {pendingReturnRequests.map((order) => (
                    <div key={order._id} className="p-3 rounded-lg bg-amber-500/5 dark:bg-slate-900/60 border border-amber-500/20 text-xs space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="font-bold text-slate-900 dark:text-white uppercase">#{order._id.substring(0, 10)}</span>
                        <span className="font-extrabold text-slate-900 dark:text-white">₹{order.totalAmount}</span>
                      </div>
                      <p className="text-[11px] text-slate-600 dark:text-slate-300 line-clamp-1">
                        <strong>Reason:</strong> {order.returnDetails?.reason}
                      </p>

                      {order.returnDetails?.photos && order.returnDetails.photos.length > 0 && (
                        <div className="flex gap-1.5 items-center">
                          <span className="text-[10px] text-slate-450">Proof:</span>
                          {order.returnDetails.photos.map((img, i) => (
                            <a key={i} href={getImageUrl(img)} target="_blank" rel="noreferrer">
                              <img src={getImageUrl(img)} alt="" className="h-7 w-7 rounded object-cover border border-amber-500/30 hover:scale-110 transition-transform" />
                            </a>
                          ))}
                        </div>
                      )}

                      <div className="flex items-center justify-end gap-2 pt-2 border-t border-amber-500/20">
                        <button
                          type="button"
                          onClick={() => handleQuickUpdateStatus(order._id, 'return_approved', 'Return request accepted by admin.')}
                          disabled={actionLoadingId === order._id}
                          className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs transition-all flex items-center gap-1 shadow-sm shadow-emerald-500/20"
                        >
                          {actionLoadingId === order._id ? <RefreshCw className="h-3 w-3 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
                          <span>Accept Return</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleQuickUpdateStatus(order._id, 'return_rejected', 'Return request rejected after inspection.')}
                          disabled={actionLoadingId === order._id}
                          className="px-2.5 py-1.5 rounded-lg bg-red-600 hover:bg-red-700 text-white font-bold text-xs transition-colors flex items-center gap-1"
                        >
                          <X className="h-3.5 w-3.5" />
                          <span>Reject</span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ACCESSIBLE SECTION NAVIGATION & SEARCH BAR */}
      <div className="space-y-4">
        {/* Main Category Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 border-b border-slate-200 dark:border-slate-800">
          <button
            onClick={() => setSelectedFilter('needs_action')}
            className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all shrink-0 ${
              selectedFilter === 'needs_action'
                ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                : 'bg-slate-100 dark:bg-slate-900 text-slate-650 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800'
            }`}
          >
            <span>⚡ Needs Action</span>
            {totalPendingActionCount > 0 && (
              <span className="rounded-full bg-slate-950 text-amber-400 px-2 py-0.5 text-[10px] font-black">
                {totalPendingActionCount}
              </span>
            )}
          </button>

          <button
            onClick={() => setSelectedFilter('refund_pending')}
            className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all shrink-0 ${
              selectedFilter === 'refund_pending'
                ? 'bg-emerald-600 text-white shadow-md shadow-emerald-500/20'
                : 'bg-slate-100 dark:bg-slate-900 text-slate-650 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800'
            }`}
          >
            <CreditCard className="h-4 w-4" />
            <span>Refund Desk</span>
            {pendingRefundOrders.length > 0 && (
              <span className="rounded-full bg-white/20 text-white px-2 py-0.5 text-[10px] font-black">
                {pendingRefundOrders.length}
              </span>
            )}
          </button>

          <button
            onClick={() => setSelectedFilter('in_fulfillment')}
            className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all shrink-0 ${
              selectedFilter === 'in_fulfillment'
                ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
                : 'bg-slate-100 dark:bg-slate-900 text-slate-650 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800'
            }`}
          >
            <Truck className="h-4 w-4" />
            <span>Fulfillment Desk</span>
          </button>

          <button
            onClick={() => setSelectedFilter('returns')}
            className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all shrink-0 ${
              selectedFilter === 'returns'
                ? 'bg-purple-600 text-white shadow-md shadow-purple-500/20'
                : 'bg-slate-100 dark:bg-slate-900 text-slate-650 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800'
            }`}
          >
            <RotateCcw className="h-4 w-4" />
            <span>Returns Desk</span>
          </button>

          <button
            onClick={() => setSelectedFilter('delivered')}
            className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all shrink-0 ${
              selectedFilter === 'delivered'
                ? 'bg-emerald-600 text-white shadow-md shadow-emerald-500/20'
                : 'bg-slate-100 dark:bg-slate-900 text-slate-650 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800'
            }`}
          >
            <CheckCircle className="h-4 w-4" />
            <span>Delivered</span>
          </button>

          <button
            onClick={() => setSelectedFilter('all')}
            className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all shrink-0 ${
              selectedFilter === 'all'
                ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-md'
                : 'bg-slate-100 dark:bg-slate-900 text-slate-650 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800'
            }`}
          >
            <Package className="h-4 w-4" />
            <span>All Orders ({orders.length})</span>
          </button>
        </div>

        {/* Sub Status Pills & Search Bar */}
        <div className="flex flex-col sm:flex-row gap-4 justify-between items-center bg-slate-100/50 dark:bg-[#0f172a]/20 p-4 rounded-2xl border border-slate-200 dark:border-slate-800">
          <div className="w-full sm:w-80">
            <input
              type="text"
              placeholder="Search by Order ID, customer, or product..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0f172a] px-3.5 py-2 text-xs text-slate-900 dark:text-slate-200 outline-none focus:border-blue-500"
            />
          </div>
          <div className="flex gap-1.5 items-center w-full sm:w-auto overflow-x-auto shrink-0 pb-1 sm:pb-0">
            {['placed', 'confirmed', 'shipped', 'out_for_delivery', 'delivered', 'return_requested', 'return_approved', 'out_for_pickup', 'returned', 'return_rejected', 'cancelled'].map((status) => (
              <button
                key={status}
                onClick={() => setSelectedFilter(status)}
                className={`px-2.5 py-1 rounded-md text-[10px] font-semibold border transition-all whitespace-nowrap ${
                  selectedFilter === status
                    ? 'bg-blue-600 border-blue-600 text-white shadow-sm shadow-blue-500/20'
                    : 'bg-white dark:bg-[#0f172a] border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:border-slate-350 dark:hover:border-slate-700'
                }`}
              >
                {getStatusLabel(status)}
              </button>
            ))}
          </div>
        </div>
      </div>

      {orders.length === 0 ? (
        <div className="text-center py-20 border border-dashed border-slate-200 dark:border-slate-800 rounded-2xl bg-white dark:bg-[#0f172a]/20">
          <Package className="h-12 w-12 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
          <p className="text-sm font-semibold text-slate-800 dark:text-slate-250">No client orders placed yet</p>
          <p className="text-xs text-slate-500 dark:text-slate-455 mt-1">Pending orders will show up here once checked out.</p>
        </div>
      ) : filteredOrders.length === 0 ? (
        <div className="text-center py-16 border border-dashed border-slate-200 dark:border-slate-800 rounded-2xl bg-white dark:bg-[#0f172a]/20">
          <Package className="h-12 w-12 text-slate-300 dark:text-slate-600 mx-auto mb-3 animate-bounce" />
          <p className="text-sm font-semibold text-slate-850 dark:text-slate-250">No matching orders found</p>
          <p className="text-xs text-slate-500 dark:text-slate-455 mt-1">Try adjusting your search criteria or filter controls.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredOrders.map((order) => {
            const isProcessing = actionLoadingId === order._id;
            const isPaidOrder = order.paymentStatus === 'paid' || order.paymentMethod === 'ONLINE' || (order.cancellationDetails?.refundMethod && order.cancellationDetails.refundMethod !== 'none');
            const isReturnOrder = ['return_requested', 'return_approved', 'out_for_pickup', 'returning_to_seller', 'returned'].includes(order.orderStatus);
            const needsRefund = order.paymentStatus === 'refund_pending' || (order.orderStatus === 'cancelled' && isPaidOrder && order.paymentStatus !== 'refunded') || (isReturnOrder && order.paymentStatus !== 'refunded');

            return (
              <div
                key={order._id}
                className="glass-card rounded-2xl border border-slate-200 dark:border-slate-855 p-6 space-y-6"
              >
                {/* Header Row */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-200 dark:border-slate-800 pb-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-slate-905 dark:text-white uppercase">
                        Order #{order._id.substring(0, 12)}
                      </span>
                      <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold border uppercase ${getStatusBadgeClass(order.orderStatus)}`}>
                        {getStatusLabel(order.orderStatus)}
                      </span>
                      {order.paymentStatus === 'refund_pending' && (
                        <span className="rounded-full px-2.5 py-0.5 text-[10px] font-bold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 uppercase animate-pulse">
                          Refund Pending
                        </span>
                      )}
                      {order.paymentStatus === 'refunded' && (
                        <span className="rounded-full px-2.5 py-0.5 text-[10px] font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 uppercase">
                          ✓ Refunded
                        </span>
                      )}
                    </div>
                    <div className="text-[10px] text-slate-500 mt-1 flex flex-wrap items-center gap-2">
                      <span>Placed on: {new Date(order.createdAt).toLocaleString()}</span>
                      {['delivered', 'return_requested', 'return_approved', 'out_for_pickup', 'returning_to_seller', 'returned', 'return_rejected'].includes(order.orderStatus) && (
                        <span className="font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                          ✓ Delivered on: {order.deliveredAt ? new Date(order.deliveredAt).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' }) : new Date(order.updatedAt || order.createdAt).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Actions / Inputs Controls */}
                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full md:w-auto">
                    {/* Status Dropdown */}
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-slate-500">Status:</span>
                      <select
                        disabled={isProcessing}
                        value={statusMap[order._id] || order.orderStatus}
                        onChange={(e) => setStatusMap({ ...statusMap, [order._id]: e.target.value })}
                        className="rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0f172a] px-3 py-1.5 text-xs text-slate-900 dark:text-slate-200 outline-none focus:border-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <option value="placed">Placed</option>
                        <option value="confirmed">Order Confirmed</option>
                        <option value="shipped">Shipped</option>
                        <option value="out_for_delivery">Out for Delivery</option>
                        <option value="delivered">Delivered</option>
                        {(order.returnDetails?.reason || order.orderStatus.includes('return') || order.orderStatus === 'out_for_pickup' || order.orderStatus === 'returning_to_seller') && (
                          <>
                            <option value="return_requested">Return Requested</option>
                            <option value="return_approved">Return Approved</option>
                            <option value="out_for_pickup">Out for Pickup</option>
                            <option value="returning_to_seller">In Transit to Seller</option>
                            <option value="returned">Returned & Refunded</option>
                            <option value="return_rejected">Return Rejected</option>
                          </>
                        )}
                        <option value="cancelled">Cancelled</option>
                      </select>
                    </div>

                    {/* Shipping notes / tracking message slot */}
                    <div className="flex flex-1 sm:flex-initial items-center gap-2">
                      <span className="text-xs font-bold text-slate-500 shrink-0">Message Slot:</span>
                      <input
                        type="text"
                        placeholder="Courier ID, tracking details..."
                        value={notesMap[order._id] || ''}
                        disabled={isProcessing}
                        onChange={(e) => setNotesMap({ ...notesMap, [order._id]: e.target.value })}
                        className="w-full sm:w-48 rounded-lg border border-slate-205 dark:border-slate-800 bg-white dark:bg-[#0f172a] px-3 py-1.5 text-xs text-slate-900 dark:text-slate-200 outline-none focus:border-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                      />
                    </div>

                    {/* Submit Update button */}
                    <button
                      type="button"
                      disabled={isProcessing}
                      onClick={() => handleUpdateOrder(order._id)}
                      className="rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-blue-700 transition-colors flex items-center justify-center gap-1 disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      {isProcessing ? (
                        <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <Save className="h-3.5 w-3.5" />
                      )}
                      <span>Update</span>
                    </button>

                    {/* Quick Confirm Refund Button if applicable */}
                    {needsRefund && (
                      <button
                        type="button"
                        onClick={() => {
                          setRefundModalOrder(order);
                          setRefundTxnRef('');
                          setRefundAdminNote('');
                        }}
                        className="rounded-lg bg-emerald-600 hover:bg-emerald-700 px-3 py-1.5 text-xs font-bold text-white transition-colors flex items-center justify-center gap-1 shadow-sm shadow-emerald-500/20"
                      >
                        <CreditCard className="h-3.5 w-3.5" />
                        <span>Confirm Refund (₹{order.totalAmount})</span>
                      </button>
                    )}
                  </div>
                </div>

                {/* Grid Details */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-xs text-slate-600 dark:text-slate-400">
                  {/* Customer details */}
                  <div className="space-y-2">
                    <div className="flex items-center gap-1 text-slate-700 dark:text-slate-350 font-bold uppercase tracking-wider text-[10px]">
                      <User className="h-3.5 w-3.5" />
                      <span>Customer Details</span>
                    </div>
                    <div className="space-y-1">
                      <p className="font-semibold text-slate-850 dark:text-slate-200">{order.user?.name || 'Deleted Account'}</p>
                      <p className="text-slate-500">{order.user?.email || 'N/A'}</p>
                    </div>
                  </div>

                  {/* Shipping address details */}
                  <div className="space-y-2">
                    <div className="flex items-center gap-1 text-slate-700 dark:text-slate-350 font-bold uppercase tracking-wider text-[10px]">
                      <MapPin className="h-3.5 w-3.5" />
                      <span>Shipping Destination</span>
                    </div>
                    <div className="space-y-1">
                      <p className="font-semibold text-slate-850 dark:text-slate-200">
                        {order.shippingAddress?.line1 || 'No street address provided'}
                      </p>
                      <p className="text-slate-550 dark:text-slate-455">
                        {order.shippingAddress?.city || ''}{order.shippingAddress?.state ? `, ${order.shippingAddress.state}` : ''}{order.shippingAddress?.pincode ? ` - ${order.shippingAddress.pincode}` : ''}
                      </p>
                      <p className="text-slate-500">Phone: {order.shippingAddress?.phone || 'N/A'}</p>
                    </div>
                  </div>

                  {/* Transaction metadata */}
                  <div className="space-y-2">
                    <div className="flex items-center gap-1 text-slate-700 dark:text-slate-350 font-bold uppercase tracking-wider text-[10px]">
                      <ShoppingBag className="h-3.5 w-3.5" />
                      <span>Billing Summary</span>
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm font-extrabold text-slate-905 dark:text-white">
                        ₹{order.totalAmount}
                      </p>
                      <p className="text-slate-500">Method: {order.paymentMethod}</p>
                      <div className="flex items-center gap-1">
                        <span>Payment Status:</span>
                        <strong className={`capitalize ${
                          order.paymentStatus === 'paid'
                            ? 'text-emerald-500'
                            : order.paymentStatus === 'refunded'
                            ? 'text-emerald-600 dark:text-emerald-400'
                            : order.paymentStatus === 'refund_pending'
                            ? 'text-amber-500 font-bold'
                            : order.paymentStatus === 'failed'
                            ? 'text-red-500'
                            : 'text-amber-500'
                        }`}>
                          {order.paymentStatus}
                        </strong>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Return Request Review Box for Admin */}
                {order.returnDetails?.reason && (
                  <div className="rounded-xl bg-amber-500/5 dark:bg-amber-500/10 border border-amber-500/25 p-4 text-xs space-y-3">
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400 font-bold">
                        <RotateCcw className="h-4 w-4" />
                        <span>Customer Return Request Review</span>
                      </div>
                      <span className="text-[10px] text-slate-450">
                        Requested on: {new Date(order.returnDetails.requestedAt || order.updatedAt).toLocaleString()}
                      </span>
                    </div>

                    <div>
                      <span className="font-bold text-slate-700 dark:text-slate-300">Reason:</span>
                      <p className="text-slate-600 dark:text-slate-300 mt-0.5">{order.returnDetails.reason}</p>
                    </div>

                    {order.returnDetails.photos && order.returnDetails.photos.length > 0 && (
                      <div>
                        <span className="font-bold text-slate-700 dark:text-slate-300 block mb-1.5">Submitted Proof Photos:</span>
                        <div className="flex flex-wrap gap-2">
                          {order.returnDetails.photos.map((photo, pIdx) => (
                            <button
                              key={pIdx}
                              type="button"
                              onClick={() => setLightboxImage(getImageUrl(photo))}
                              className="block rounded-lg overflow-hidden border border-slate-200 dark:border-slate-700 hover:scale-105 transition-transform"
                            >
                              <img
                                src={getImageUrl(photo)}
                                alt="Return Proof"
                                className="h-16 w-16 object-cover"
                              />
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Admin Action Shortcut Buttons */}
                    <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-amber-500/20">
                      <span className="font-bold text-slate-600 dark:text-slate-400 mr-2">Quick Return Actions:</span>
                      
                      {order.orderStatus === 'return_requested' && (
                        <button
                          type="button"
                          onClick={() => {
                            setStatusMap({ ...statusMap, [order._id]: 'return_approved' });
                            setNotesMap({ ...notesMap, [order._id]: 'Return request approved by admin.' });
                          }}
                          className="px-2.5 py-1 rounded bg-indigo-600 text-white font-bold hover:bg-indigo-700 transition-colors"
                        >
                          Approve Return
                        </button>
                      )}

                      {(order.orderStatus === 'return_requested' || order.orderStatus === 'return_approved') && (
                        <button
                          type="button"
                          onClick={() => {
                            setStatusMap({ ...statusMap, [order._id]: 'out_for_pickup' });
                            setNotesMap({ ...notesMap, [order._id]: 'Agent assigned. Out for product pickup.' });
                          }}
                          className="px-2.5 py-1 rounded bg-purple-600 text-white font-bold hover:bg-purple-700 transition-colors"
                        >
                          Set Out For Pickup
                        </button>
                      )}

                      {order.orderStatus === 'out_for_pickup' && (
                        <button
                          type="button"
                          onClick={() => {
                            setStatusMap({ ...statusMap, [order._id]: 'returning_to_seller' });
                            setNotesMap({ ...notesMap, [order._id]: 'Return item picked up & in transit to seller/warehouse.' });
                          }}
                          className="px-2.5 py-1 rounded bg-indigo-600 text-white font-bold hover:bg-indigo-700 transition-colors"
                        >
                          In Transit to Seller
                        </button>
                      )}

                      {(order.orderStatus === 'out_for_pickup' || order.orderStatus === 'returning_to_seller') && (
                        <button
                          type="button"
                          onClick={() => {
                            setStatusMap({ ...statusMap, [order._id]: 'returned' });
                            setNotesMap({ ...notesMap, [order._id]: 'Product received back at warehouse. Refund processed.' });
                          }}
                          className="px-2.5 py-1 rounded bg-emerald-600 text-white font-bold hover:bg-emerald-700 transition-colors"
                        >
                          Complete Return & Refund
                        </button>
                      )}

                      {order.orderStatus === 'return_requested' && (
                        <button
                          type="button"
                          onClick={() => {
                            setStatusMap({ ...statusMap, [order._id]: 'return_rejected' });
                            setNotesMap({ ...notesMap, [order._id]: 'Return request rejected after inspection.' });
                          }}
                          className="px-2.5 py-1 rounded bg-red-600 text-white font-bold hover:bg-red-700 transition-colors"
                        >
                          Reject Return
                        </button>
                      )}
                    </div>
                  </div>
                )}

                {/* Cancellation & Refund Payout Box */}
                {(order.orderStatus === 'cancelled' || order.cancellationDetails?.reason || order.paymentStatus === 'refund_pending' || order.paymentStatus === 'refunded') && (
                  <div className={`rounded-xl p-4 text-xs space-y-3 border ${
                    order.paymentStatus === 'refunded'
                      ? 'bg-emerald-500/5 dark:bg-emerald-500/10 border-emerald-500/25'
                      : 'bg-purple-500/5 dark:bg-purple-500/10 border-purple-500/25'
                  }`}>
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-2 font-bold text-slate-900 dark:text-white">
                        <CreditCard className={`h-4 w-4 ${order.paymentStatus === 'refunded' ? 'text-emerald-500' : 'text-purple-500'}`} />
                        <span>Cancellation & Refund Payout Info</span>
                      </div>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        order.paymentStatus === 'refunded'
                          ? 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400'
                          : needsRefund
                          ? 'bg-amber-500/20 text-amber-600 dark:text-amber-400 animate-pulse'
                          : 'bg-slate-500/20 text-slate-600 dark:text-slate-400'
                      }`}>
                        {order.paymentStatus === 'refunded'
                          ? '✓ REFUNDED & COMPLETED'
                          : needsRefund
                          ? '⚡ REFUND ACTION REQUIRED'
                          : 'COD CANCELLED (NO PAYMENT COLLECTED)'}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div>
                        <span className="text-[11px] text-slate-500 block">Cancellation Reason:</span>
                        <p className="font-semibold text-slate-800 dark:text-slate-200 mt-0.5">
                          {order.cancellationDetails?.reason || 'Customer cancelled order'}
                        </p>
                        {order.cancellationDetails?.requestedAt && (
                          <span className="text-[10px] text-slate-400">
                            Requested at: {new Date(order.cancellationDetails.requestedAt).toLocaleString()}
                          </span>
                        )}
                      </div>

                      <div className="space-y-1">
                        <span className="text-[11px] text-slate-500 block">Payout Destination:</span>
                        {(order.cancellationDetails?.refundMethod === 'upi' || order.returnDetails?.refundMethod === 'upi') ? (
                          <div className="flex items-center gap-1.5 font-bold text-blue-600 dark:text-blue-400">
                            <Smartphone className="h-3.5 w-3.5" />
                            <span>UPI ID: {order.cancellationDetails?.upiId || order.returnDetails?.upiId}</span>
                          </div>
                        ) : (order.cancellationDetails?.bankDetails?.accountNumber || order.returnDetails?.bankDetails?.accountNumber) ? (
                          <div className="space-y-0.5 text-slate-700 dark:text-slate-300">
                            <p className="font-bold flex items-center gap-1">
                              <Building2 className="h-3.5 w-3.5 text-slate-500" />
                              <span>{order.cancellationDetails?.bankDetails?.bankName || order.returnDetails?.bankDetails?.bankName || 'Bank'}</span>
                            </p>
                            <p className="text-[11px] pl-4 text-slate-600 dark:text-slate-400">
                              A/C: {order.cancellationDetails?.bankDetails?.accountNumber || order.returnDetails?.bankDetails?.accountNumber} ({order.cancellationDetails?.bankDetails?.accountHolderName || order.returnDetails?.bankDetails?.accountHolderName})
                            </p>
                            <p className="text-[10px] pl-4 text-slate-500">
                              IFSC: {order.cancellationDetails?.bankDetails?.ifscCode || order.returnDetails?.bankDetails?.ifscCode}
                            </p>
                          </div>
                        ) : (
                          <span className="text-slate-500 italic">No refund destination required (COD order cancelled before delivery)</span>
                        )}
                      </div>
                    </div>

                    {order.cancellationDetails?.adminComment && (
                      <div className="pt-2 border-t border-slate-200/50 dark:border-slate-800/50 text-[11px]">
                        <strong className="text-slate-700 dark:text-slate-300">Admin Processing Note:</strong>{' '}
                        <span className="text-slate-600 dark:text-slate-400">{order.cancellationDetails.adminComment}</span>
                      </div>
                    )}

                    {needsRefund && order.paymentStatus !== 'refunded' && (
                      <div className="pt-2 border-t border-purple-500/20 flex justify-end">
                        <button
                          type="button"
                          onClick={() => {
                            setRefundModalOrder(order);
                            setRefundTxnRef('');
                            setRefundAdminNote('');
                          }}
                          className="px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs transition-all flex items-center gap-1.5 shadow-md shadow-emerald-500/20"
                        >
                          <Check className="h-3.5 w-3.5" />
                          <span>Confirm Refund Paid (₹{order.totalAmount})</span>
                        </button>
                      </div>
                    )}
                  </div>
                )}

                {/* Display current saved message notes on admin card */}
                {order.shippingNotes && (
                  <div className="flex items-start gap-2 rounded-xl bg-slate-100/60 dark:bg-slate-900/60 p-3.5 border border-slate-200 dark:border-slate-850 text-xs">
                    <MessageSquare className="h-4.5 w-4.5 text-blue-500 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold text-slate-700 dark:text-slate-300">Saved Message / Tracking ID:</span>
                      <p className="mt-1 text-slate-600 dark:text-slate-400">{order.shippingNotes}</p>
                    </div>
                  </div>
                )}

                {/* Items Row list */}
                <div className="border-t border-slate-200 dark:border-slate-800 pt-4 space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                      Purchased Items ({order.items.reduce((sum, item) => sum + item.qty, 0)} total units)
                    </span>
                  </div>
                  <div className="space-y-3">
                    {order.items.map((item, idx) => {
                      const prod = item.product;
                      const imageUrl = getImageUrl(prod?.images?.[0]);
                      return (
                        <div key={idx} className="flex flex-col sm:flex-row items-start sm:items-center gap-4 p-4 rounded-2xl bg-slate-100/50 dark:bg-slate-900/50 border border-slate-200/80 dark:border-slate-800/80 hover:border-slate-300 dark:hover:border-slate-700 transition-all">
                          {/* Product Image Thumbnail */}
                          <div 
                            onClick={() => setLightboxImage(imageUrl)}
                            className="h-24 w-20 overflow-hidden rounded-xl bg-slate-200 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 shrink-0 cursor-pointer group relative shadow-sm"
                          >
                            <img
                              src={imageUrl}
                              alt={prod?.title || 'Product Image'}
                              className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-300"
                            />
                            <div className="absolute inset-0 bg-slate-950/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                              <span className="text-[10px] font-bold text-white bg-slate-900/80 px-2 py-1 rounded-md backdrop-blur-sm">Zoom</span>
                            </div>
                          </div>

                          {/* Product Details */}
                          <div className="flex-1 min-w-0 space-y-1.5">
                            <h4 className="font-bold text-sm text-slate-900 dark:text-white line-clamp-1">
                              {prod ? prod.title : 'Deleted Product'}
                            </h4>
                            <div className="flex flex-wrap items-center gap-2 text-xs">
                              <span className="inline-flex items-center rounded-lg bg-blue-500/10 px-2.5 py-1 text-xs font-bold text-blue-600 dark:text-blue-400 border border-blue-500/20">
                                Size: {item.size}
                              </span>
                              <span className="inline-flex items-center rounded-lg bg-purple-500/10 px-2.5 py-1 text-xs font-bold text-purple-600 dark:text-purple-400 border border-purple-500/20">
                                Quantity: {item.qty} {item.qty === 1 ? 'unit' : 'units'}
                              </span>
                              {prod?.category && (
                                <span className="inline-flex items-center rounded-lg bg-slate-200 dark:bg-slate-800 px-2.5 py-1 text-[11px] font-semibold text-slate-600 dark:text-slate-400 border border-slate-300 dark:border-slate-700 capitalize">
                                  {prod.category}
                                </span>
                              )}
                            </div>
                          </div>

                          {/* Pricing details */}
                          <div className="sm:text-right shrink-0 border-t sm:border-t-0 border-slate-200 dark:border-slate-800 pt-2 sm:pt-0 w-full sm:w-auto flex sm:flex-col justify-between sm:justify-center items-center sm:items-end">
                            <span className="text-[10px] text-slate-500 uppercase tracking-wider">Purchased Total</span>
                            <div>
                              <div className="font-extrabold text-base text-slate-900 dark:text-white">
                                ₹{item.priceAtPurchase * item.qty}
                              </div>
                              <div className="text-[11px] text-slate-500">
                                ₹{item.priceAtPurchase} each
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Confirm Refund Paid Modal */}
      {refundModalOrder && (
        <div 
          className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setRefundModalOrder(null)}
        >
          <div className="relative max-w-md w-full bg-white dark:bg-slate-900 rounded-2xl p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center border-b border-slate-200 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <CreditCard className="h-5 w-5 text-emerald-500" />
                <h3 className="text-base font-bold text-slate-900 dark:text-white">Confirm Refund Payment</h3>
              </div>
              <button
                type="button"
                onClick={() => setRefundModalOrder(null)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <p className="text-xs text-slate-500">
              Order <strong className="text-slate-800 dark:text-slate-200 uppercase">#{refundModalOrder._id.substring(0, 10)}</strong> • Total Refund: <strong className="text-emerald-600 dark:text-emerald-400">₹{refundModalOrder.totalAmount}</strong>
            </p>

            {/* Payout Destination Info */}
            <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-xs space-y-1.5">
              <span className="font-bold text-emerald-700 dark:text-emerald-300 block text-[11px] uppercase tracking-wider">
                Customer Payout Destination:
              </span>
              {(refundModalOrder.cancellationDetails?.refundMethod === 'upi' || refundModalOrder.returnDetails?.refundMethod === 'upi') ? (
                <p className="font-bold text-blue-600 dark:text-blue-400 flex items-center gap-1.5">
                  <Smartphone className="h-3.5 w-3.5" />
                  <span>UPI ID: {refundModalOrder.cancellationDetails?.upiId || refundModalOrder.returnDetails?.upiId}</span>
                </p>
              ) : (
                <div className="space-y-1 text-slate-700 dark:text-slate-300">
                  <p className="font-bold flex items-center gap-1">
                    <Building2 className="h-3.5 w-3.5 text-slate-500" />
                    <span>Bank: {refundModalOrder.cancellationDetails?.bankDetails?.bankName || refundModalOrder.returnDetails?.bankDetails?.bankName || 'Bank Transfer'}</span>
                  </p>
                  <p className="pl-5 text-slate-600 dark:text-slate-400">
                    A/C: ****{(refundModalOrder.cancellationDetails?.bankDetails?.accountNumber || refundModalOrder.returnDetails?.bankDetails?.accountNumber)?.slice(-4)} ({refundModalOrder.cancellationDetails?.bankDetails?.accountHolderName || refundModalOrder.returnDetails?.bankDetails?.accountHolderName})
                  </p>
                  <p className="pl-5 text-slate-500">
                    IFSC: {refundModalOrder.cancellationDetails?.bankDetails?.ifscCode || refundModalOrder.returnDetails?.bankDetails?.ifscCode}
                  </p>
                </div>
              )}

              <p className="text-[11px] text-slate-500 pt-1 border-t border-emerald-500/20 mt-1">
                Reason: <span className="font-medium text-slate-700 dark:text-slate-300">{refundModalOrder.cancellationDetails?.reason || refundModalOrder.returnDetails?.reason || 'Cancelled by customer'}</span>
              </p>
            </div>

            {/* Transaction Ref Input */}
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                Payment UTR / Transaction Reference ID:
              </label>
              <input
                type="text"
                placeholder="e.g. UPI Ref: 329182390123 / NEFT UTR..."
                value={refundTxnRef}
                onChange={(e) => setRefundTxnRef(e.target.value)}
                className="w-full rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 px-3 py-2 text-xs text-slate-900 dark:text-slate-200 outline-none focus:border-emerald-500"
              />
            </div>

            {/* Admin confirmation comment */}
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                Admin Confirmation Note (Sent to Customer):
              </label>
              <textarea
                rows={2}
                placeholder="e.g. Amount refunded to your submitted UPI ID successfully."
                value={refundAdminNote}
                onChange={(e) => setRefundAdminNote(e.target.value)}
                className="w-full rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 px-3 py-2 text-xs text-slate-900 dark:text-slate-200 outline-none focus:border-emerald-500 resize-none"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-200 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setRefundModalOrder(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={submittingRefund}
                onClick={handleConfirmRefund}
                className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 transition-colors flex items-center gap-1.5 shadow-md shadow-emerald-500/25 disabled:opacity-50"
              >
                {submittingRefund ? (
                  <RefreshCw className="h-4 w-4 animate-spin" />
                ) : (
                  <Check className="h-4 w-4" />
                )}
                <span>Confirm Refund Paid (₹{refundModalOrder.totalAmount})</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Lightbox Modal */}
      {lightboxImage && (
        <div 
          className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4"
          onClick={() => setLightboxImage(null)}
        >
          <div className="relative max-w-3xl w-full max-h-[85vh] flex flex-col items-center justify-center" onClick={(e) => e.stopPropagation()}>
            <button
              type="button"
              onClick={() => setLightboxImage(null)}
              className="absolute -top-12 right-0 rounded-full bg-white/10 hover:bg-white/20 p-2 text-white transition-colors"
            >
              <X className="h-6 w-6" />
            </button>
            <img
              src={lightboxImage}
              alt="Preview"
              className="max-h-[80vh] w-auto max-w-full rounded-2xl shadow-2xl object-contain border border-white/10"
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default ManageOrders;
