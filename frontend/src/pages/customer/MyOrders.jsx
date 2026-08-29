import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import API from '../../api/axios';
import { Package, Calendar, Clock, MapPin, CheckCircle, AlertCircle, RefreshCw, Truck, Star, X, Camera, Download, RotateCcw, Search, Smartphone, Building2, CreditCard, ShieldCheck } from 'lucide-react';
import toast from 'react-hot-toast';

const MyOrders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeOrderTab, setActiveOrderTab] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // Review states
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [reviewImages, setReviewImages] = useState([]);
  const [reviewLoading, setReviewLoading] = useState(false);
  const [reviewError, setReviewError] = useState('');

  // Return states
  const [showReturnModal, setShowReturnModal] = useState(false);
  const [selectedReturnOrder, setSelectedReturnOrder] = useState(null);
  const [returnReasonPreset, setReturnReasonPreset] = useState('Damaged or defective product');
  const [returnReasonDetails, setReturnReasonDetails] = useState('');
  const [returnPhotos, setReturnPhotos] = useState([]);
  const [returnLoading, setReturnLoading] = useState(false);
  // Lightbox & Cancel states
  const [lightboxImage, setLightboxImage] = useState(null);
  const [cancellingId, setCancellingId] = useState(null);

  // Cancellation Modal States
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [selectedCancelOrder, setSelectedCancelOrder] = useState(null);
  const [cancelReasonPreset, setCancelReasonPreset] = useState('Ordered by mistake');
  const [cancelReasonDetails, setCancelReasonDetails] = useState('');
  const [cancelRefundMethod, setCancelRefundMethod] = useState('upi'); // 'upi' | 'bank_transfer'
  const [cancelUpiId, setCancelUpiId] = useState('');
  const [cancelAccountHolder, setCancelAccountHolder] = useState('');
  const [cancelBankName, setCancelBankName] = useState('');
  const [cancelAccountNumber, setCancelAccountNumber] = useState('');
  const [cancelConfirmAccount, setCancelConfirmAccount] = useState('');
  const [cancelIfsc, setCancelIfsc] = useState('');
  const [cancelLoading, setCancelLoading] = useState(false);

  const handleOpenCancelModal = (order) => {
    setSelectedCancelOrder(order);
    setCancelReasonPreset('Ordered by mistake');
    setCancelReasonDetails('');
    setCancelRefundMethod('upi');
    setCancelUpiId('');
    setCancelAccountHolder('');
    setCancelBankName('');
    setCancelAccountNumber('');
    setCancelConfirmAccount('');
    setCancelIfsc('');
    setShowCancelModal(true);
  };

  const handleCancelSubmit = async (e) => {
    e.preventDefault();
    if (!selectedCancelOrder) return;
    const isOnlinePaid = selectedCancelOrder.paymentStatus === 'paid' || selectedCancelOrder.paymentMethod === 'ONLINE';

    const fullReason = `${cancelReasonPreset}${cancelReasonDetails.trim() ? `: ${cancelReasonDetails.trim()}` : ''}`;

    if (isOnlinePaid) {
      if (cancelRefundMethod === 'upi') {
        if (!cancelUpiId.trim() || !cancelUpiId.includes('@')) {
          toast.error('Please enter a valid UPI ID (e.g. yourname@oksbi / 9876543210@paytm)');
          return;
        }
      } else {
        if (!cancelAccountHolder.trim()) {
          toast.error('Please enter the Account Holder Name');
          return;
        }
        if (!cancelBankName.trim()) {
          toast.error('Please enter the Bank Name');
          return;
        }
        if (!cancelAccountNumber.trim() || cancelAccountNumber.trim().length < 6) {
          toast.error('Please enter a valid Bank Account Number');
          return;
        }
        if (cancelAccountNumber.trim() !== cancelConfirmAccount.trim()) {
          toast.error('Account Number and Confirm Account Number do not match');
          return;
        }
        if (!cancelIfsc.trim() || cancelIfsc.trim().length < 6) {
          toast.error('Please enter a valid IFSC Code');
          return;
        }
      }
    }

    setCancelLoading(true);
    try {
      const payload = {
        reason: fullReason || 'Order cancelled by customer before shipment',
        refundMethod: isOnlinePaid ? cancelRefundMethod : 'none',
        upiId: cancelRefundMethod === 'upi' ? cancelUpiId.trim() : '',
        accountHolderName: cancelAccountHolder.trim(),
        bankName: cancelBankName.trim(),
        accountNumber: cancelAccountNumber.trim(),
        ifscCode: cancelIfsc.trim().toUpperCase(),
      };

      const { data } = await API.put(`/api/orders/${selectedCancelOrder._id}/cancel`, payload);
      toast.success(data.message || 'Order cancelled successfully');
      setShowCancelModal(false);
      fetchOrders();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to cancel order');
    } finally {
      setCancelLoading(false);
    }
  };

  const handleOpenReturnModal = (order) => {
    setSelectedReturnOrder(order);
    setReturnReasonPreset('Damaged or defective product');
    setReturnReasonDetails('');
    setReturnPhotos([]);
    setReturnError('');
    setShowReturnModal(true);
  };

  const handleReturnSubmit = async (e) => {
    e.preventDefault();
    setReturnLoading(true);
    setReturnError('');

    if (!returnPhotos || returnPhotos.length === 0) {
      toast.error('Please upload at least one photo of the product as proof');
      setReturnLoading(false);
      return;
    }

    const fullReason = `${returnReasonPreset}${returnReasonDetails.trim() ? `: ${returnReasonDetails.trim()}` : ''}`;

    const formData = new FormData();
    formData.append('reason', fullReason);
    for (let i = 0; i < returnPhotos.length; i++) {
      formData.append('images', returnPhotos[i]);
    }

    try {
      await API.post(`/api/orders/${selectedReturnOrder._id}/return`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      toast.success('Return request submitted! Admin will review your request.');
      setShowReturnModal(false);
      fetchOrders();
    } catch (err) {
      setReturnError(err.response?.data?.message || 'Failed to submit return request');
      toast.error(err.response?.data?.message || 'Failed to submit return request');
    } finally {
      setReturnLoading(false);
    }
  };

  const isEligibleForReturn = (order) => {
    if (order.orderStatus !== 'delivered') return false;
    if (order.returnDetails?.reason) return false;
    const deliveryDate = order.deliveredAt || 
      order.statusHistory?.find(s => s.status === 'delivered')?.updatedAt || 
      order.updatedAt;
    if (!deliveryDate) return true;
    const diffInMs = Date.now() - new Date(deliveryDate).getTime();
    const diffInDays = diffInMs / (1000 * 60 * 60 * 24);
    return diffInDays <= 7;
  };

  const handleOpenReviewModal = (product) => {
    setSelectedProduct(product);
    setRating(5);
    setComment('');
    setReviewImages([]);
    setReviewError('');
    setShowReviewModal(true);
  };

  const handleReviewSubmit = async (e) => {
    e.preventDefault();
    setReviewLoading(true);
    setReviewError('');

    if (!comment.trim()) {
      toast.error('Please enter a review comment');
      setReviewLoading(false);
      return;
    }

    const formData = new FormData();
    formData.append('rating', rating);
    formData.append('comment', comment);
    
    for (let i = 0; i < reviewImages.length; i++) {
      formData.append('images', reviewImages[i]);
    }

    try {
      await API.post(`/api/products/${selectedProduct._id}/reviews`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      toast.success('Review submitted successfully!');
      setShowReviewModal(false);
    } catch (err) {
      setReviewError(err.response?.data?.message || 'Failed to submit review');
      toast.error(err.response?.data?.message || 'Failed to submit review');
    } finally {
      setReviewLoading(false);
    }
  };

  const getGroupedStatusHistory = (statusHistory) => {
    if (!statusHistory) return [];
    const groups = [];
    statusHistory.forEach((item) => {
      const lastGroup = groups[groups.length - 1];
      if (lastGroup && lastGroup.status === item.status) {
        lastGroup.updates.push({
          message: item.message,
          updatedAt: item.updatedAt
        });
        lastGroup.updatedAt = item.updatedAt;
      } else {
        groups.push({
          status: item.status,
          updatedAt: item.updatedAt,
          updates: [{
            message: item.message,
            updatedAt: item.updatedAt
          }]
        });
      }
    });
    return groups;
  };

  const handleDownloadInvoice = (order) => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      toast.error('Please allow popups to download invoices');
      return;
    }

    const itemsRows = order.items.map((item) => `
      <tr style="border-bottom: 1px solid #e2e8f0;">
        <td style="padding: 12px; font-size: 13px; text-align: left;">${item.product?.title || 'Deleted Product'}</td>
        <td style="padding: 12px; font-size: 13px; text-align: center;">${item.size}</td>
        <td style="padding: 12px; font-size: 13px; text-align: center;">${item.qty}</td>
        <td style="padding: 12px; font-size: 13px; text-align: right;">₹${item.priceAtPurchase}</td>
        <td style="padding: 12px; font-size: 13px; text-align: right;">₹${item.priceAtPurchase * item.qty}</td>
      </tr>
    `).join('');

    const invoiceHTML = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Invoice - Order #${order._id.substring(0, 10)}</title>
        <style>
          body { font-family: 'system-ui', -apple-system, sans-serif; color: #1e293b; margin: 0; padding: 40px; }
          .header { display: flex; justify-content: space-between; border-bottom: 2px solid #3b82f6; padding-bottom: 20px; margin-bottom: 30px; }
          .logo { font-size: 24px; font-weight: 800; color: #0f172a; }
          .logo span { color: #3b82f6; }
          .invoice-title { font-size: 28px; font-weight: 800; text-align: right; margin: 0; color: #1e293b; }
          .details { display: grid; grid-template-cols: 1fr 1fr; gap: 40px; margin-bottom: 40px; font-size: 14px; }
          .details h3 { margin-top: 0; font-size: 12px; text-transform: uppercase; color: #64748b; letter-spacing: 0.5px; }
          table { width: 100%; border-collapse: collapse; margin-bottom: 30px; }
          th { background-color: #f8fafc; color: #475569; font-weight: 700; text-transform: uppercase; font-size: 11px; padding: 12px; text-align: left; }
          .summary { display: flex; justify-content: flex-end; }
          .summary-table { width: 300px; font-size: 14px; }
          .summary-table tr td { padding: 8px 12px; }
          .summary-table .total-row { font-size: 18px; font-weight: 800; color: #0f172a; border-top: 2px solid #e2e8f0; }
          .footer { text-align: center; margin-top: 60px; font-size: 12px; color: #94a3b8; border-top: 1px solid #e2e8f0; padding-top: 20px; }
        </style>
      </head>
      <body>
        <div class="header">
          <div>
            <div class="logo">DEB<span>CLOTHES</span></div>
            <p style="margin: 5px 0 0 0; font-size: 12px; color: #64748b;">Premium E-Commerce clothing store</p>
          </div>
          <div>
            <h1 class="invoice-title">INVOICE</h1>
            <p style="margin: 5px 0 0 0; text-align: right; font-size: 13px;">Order ID: #${order._id}</p>
            <p style="margin: 3px 0 0 0; text-align: right; font-size: 13px;">Date: ${new Date(order.createdAt).toLocaleDateString()}</p>
          </div>
        </div>

        <div class="details">
          <div>
            <h3>Billed To:</h3>
            <p style="font-weight: 700; margin: 0 0 5px 0;">${order.shippingAddress?.name || 'Customer'}</p>
            <p style="margin: 0;">${order.shippingAddress.line1}</p>
            <p style="margin: 0;">${order.shippingAddress.city}, ${order.shippingAddress.state} - ${order.shippingAddress.pincode}</p>
            <p style="margin: 5px 0 0 0;">Phone: ${order.shippingAddress.phone}</p>
          </div>
          <div style="text-align: right;">
            <h3>Payment Details:</h3>
            <p style="margin: 0 0 5px 0;">Method: <strong>${order.paymentMethod}</strong></p>
            <p style="margin: 0 0 5px 0;">Payment Status: <strong style="text-transform: uppercase;">${order.paymentStatus}</strong></p>
            <p style="margin: 0;">Order Status: <strong>${order.orderStatus.toUpperCase()}</strong></p>
          </div>
        </div>

        <table>
          <thead>
            <tr>
              <th style="text-align: left; width: 50%;">Item</th>
              <th style="text-align: center; width: 10%;">Size</th>
              <th style="text-align: center; width: 10%;">Qty</th>
              <th style="text-align: right; width: 15%;">Unit Price</th>
              <th style="text-align: right; width: 15%;">Total</th>
            </tr>
          </thead>
          <tbody>
            ${itemsRows}
          </tbody>
        </table>

        <div class="summary">
          <table class="summary-table">
            <tr>
              <td>Subtotal</td>
              <td style="text-align: right;">₹${order.totalAmount}</td>
            </tr>
            <tr>
              <td>Shipping / Tax</td>
              <td style="text-align: right;">₹0</td>
            </tr>
            <tr class="total-row">
              <td>Total Paid</td>
              <td style="text-align: right;">₹${order.totalAmount}</td>
            </tr>
          </table>
        </div>

        <div class="footer">
          <p>Thank you for shopping at DEBCLOTHES! If you have any questions, please contact us at Debclothes.officail@gmail.com.</p>
          <p>&copy; 2026 DEBCLOTHES Ltd. All rights reserved.</p>
        </div>

        <script>
          window.onload = function() {
            window.print();
            setTimeout(function() { window.close(); }, 500);
          }
        </script>
      </body>
      </html>
    `;

    printWindow.document.write(invoiceHTML);
    printWindow.document.close();
  };

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const { data } = await API.get('/api/orders/my');
      setOrders(data);
      setLoading(false);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch order history');
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const getStatusBadge = (orderOrStatus) => {
    const status = typeof orderOrStatus === 'string' ? orderOrStatus : orderOrStatus?.orderStatus;
    const order = typeof orderOrStatus === 'object' ? orderOrStatus : null;
    switch (status) {
      case 'placed':
        return (
          <span className="rounded-full bg-blue-500/10 px-3 py-1 text-xs font-semibold text-blue-600 dark:text-blue-400 border border-blue-500/20">
            Placed
          </span>
        );
      case 'confirmed':
        return (
          <span className="rounded-full bg-indigo-500/10 px-3 py-1 text-xs font-semibold text-indigo-600 dark:text-indigo-400 border border-indigo-500/20">
            Confirmed
          </span>
        );
      case 'shipped':
        return (
          <span className="rounded-full bg-amber-500/10 px-3 py-1 text-xs font-semibold text-amber-600 dark:text-amber-400 border border-amber-500/20">
            Shipped
          </span>
        );
      case 'out_for_delivery':
        return (
          <span className="rounded-full bg-purple-500/10 px-3 py-1 text-xs font-semibold text-purple-600 dark:text-purple-400 border border-purple-500/20 animate-pulse">
            Out For Delivery
          </span>
        );
      case 'delivered':
        return (
          <span className="rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
            Delivered
          </span>
        );
      case 'return_requested':
        return (
          <span className="rounded-full bg-amber-500/10 px-3 py-1 text-xs font-semibold text-amber-600 dark:text-amber-400 border border-amber-500/20">
            Return Requested
          </span>
        );
      case 'return_approved':
        return (
          <span className="rounded-full bg-indigo-500/10 px-3 py-1 text-xs font-semibold text-indigo-600 dark:text-indigo-400 border border-indigo-500/20">
            Return Approved
          </span>
        );
      case 'out_for_pickup':
        return (
          <span className="rounded-full bg-purple-500/10 px-3 py-1 text-xs font-semibold text-purple-600 dark:text-purple-400 border border-purple-500/20 animate-pulse">
            Out For Pickup
          </span>
        );
      case 'returning_to_seller':
        return (
          <span className="rounded-full bg-indigo-500/10 px-3 py-1 text-xs font-semibold text-indigo-600 dark:text-indigo-400 border border-indigo-500/20 animate-pulse">
            In Transit to Seller
          </span>
        );
      case 'returned':
        return (
          <span className="rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
            Returned & Refunded
          </span>
        );
      case 'return_rejected':
        return (
          <span className="rounded-full bg-red-500/10 px-3 py-1 text-xs font-semibold text-red-500 border border-red-500/20">
            Return Rejected
          </span>
        );
      case 'cancelled':
        if (order?.paymentStatus === 'refund_pending') {
          return (
            <span className="rounded-full bg-amber-500/10 px-3 py-1 text-xs font-semibold text-amber-600 dark:text-amber-400 border border-amber-500/20">
              Cancelled (Refund Pending)
            </span>
          );
        }
        if (order?.paymentStatus === 'refunded') {
          return (
            <span className="rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
              Cancelled & Refunded
            </span>
          );
        }
        return (
          <span className="rounded-full bg-red-500/10 px-3 py-1 text-xs font-semibold text-red-500 border border-red-500/20">
            Cancelled
          </span>
        );
      default:
        return (
          <span className="rounded-full bg-slate-500/10 px-3 py-1 text-xs font-semibold text-slate-500 border border-slate-500/20">
            {typeof order === 'string' ? order : order?.orderStatus}
          </span>
        );
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

  const getImageUrl = (imagePath) => {
    if (!imagePath) return 'https://via.placeholder.com/150';
    if (imagePath.startsWith('http')) return imagePath;
    return `http://localhost:5000/${imagePath}`;
  };

  const getExpectedDeliveryDate = (createdAt) => {
    const orderDate = new Date(createdAt);
    orderDate.setDate(orderDate.getDate() + 5);
    return orderDate.toLocaleDateString(undefined, {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const renderTrackerProgress = (order) => {
    const isReturnFlow = order.orderStatus.includes('return') || order.orderStatus === 'out_for_pickup' || order.orderStatus === 'returning_to_seller';
    const isCancelled = order.orderStatus === 'cancelled';

    if (isCancelled) return null;

    const deliverySteps = [
      { key: 'placed', label: 'Placed' },
      { key: 'confirmed', label: 'Confirmed' },
      { key: 'shipped', label: 'Shipped' },
      { key: 'out_for_delivery', label: 'Out for Delivery' },
      { key: 'delivered', label: 'Delivered' }
    ];

    const returnSteps = [
      { key: 'return_requested', label: 'Requested' },
      { key: 'return_approved', label: 'Approved' },
      { key: 'out_for_pickup', label: 'Pickup' },
      { key: 'returning_to_seller', label: 'In Transit' },
      { key: 'returned', label: 'Refunded' }
    ];

    const steps = isReturnFlow ? returnSteps : deliverySteps;
    
    const getStepIndex = (status) => {
      switch (status) {
        case 'placed': case 'return_requested': return 0;
        case 'confirmed': case 'return_approved': return 1;
        case 'shipped': case 'out_for_pickup': return 2;
        case 'out_for_delivery': case 'returning_to_seller': return 3;
        case 'delivered': case 'returned': return 4;
        default: return 0;
      }
    };

    const currentIndex = getStepIndex(order.orderStatus);

    return (
      <div className="px-5 py-4 border-b border-slate-200/60 dark:border-slate-850/60 bg-slate-50/50 dark:bg-slate-900/30">
        <div className="flex justify-between items-center relative max-w-xl mx-auto">
          <div className="absolute top-1/2 left-0 right-0 h-1 bg-slate-200 dark:bg-slate-800 -translate-y-1/2 z-0" />
          <div 
            className="absolute top-1/2 left-0 h-1 bg-gradient-to-r from-blue-500 to-indigo-600 dark:from-blue-400 dark:to-indigo-500 -translate-y-1/2 z-0 transition-all duration-500"
            style={{ width: `${(currentIndex / (steps.length - 1)) * 100}%` }}
          />

          {steps.map((step, idx) => {
            const isDone = idx <= currentIndex;
            const isCurrent = idx === currentIndex;

            return (
              <div key={step.key} className="flex flex-col items-center relative z-10">
                <div className={`h-7 w-7 rounded-full flex items-center justify-center text-[10px] font-extrabold transition-all ${
                  isDone 
                    ? 'bg-blue-600 text-white ring-4 ring-blue-500/20 shadow-md shadow-blue-500/30'
                    : 'bg-white dark:bg-slate-900 text-slate-400 border border-slate-300 dark:border-slate-700'
                }`}>
                  {isDone ? '✓' : idx + 1}
                </div>
                <span className={`text-[10px] font-bold mt-1.5 whitespace-nowrap ${
                  isCurrent 
                    ? 'text-blue-600 dark:text-blue-400' 
                    : isDone 
                    ? 'text-slate-700 dark:text-slate-300' 
                    : 'text-slate-400 dark:text-slate-600'
                }`}>
                  {step.label}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <RefreshCw className="h-8 w-8 animate-spin text-blue-500" />
      </div>
    );
  }

  const filteredOrders = orders.filter((order) => {
    if (activeOrderTab === 'REFUND_PENDING') {
      const isPending = order.paymentStatus === 'refund_pending' || ['return_requested', 'return_approved', 'out_for_pickup', 'returning_to_seller'].includes(order.orderStatus);
      if (!isPending) return false;
    } else if (activeOrderTab === 'IN_TRANSIT') {
      if (!['placed', 'confirmed', 'shipped', 'out_for_delivery'].includes(order.orderStatus)) return false;
    } else if (activeOrderTab === 'DELIVERED') {
      if (order.orderStatus !== 'delivered') return false;
    } else if (activeOrderTab === 'CANCELLED_RETURNED') {
      if (!['cancelled', 'return_requested', 'return_approved', 'out_for_pickup', 'returning_to_seller', 'returned', 'return_rejected'].includes(order.orderStatus)) return false;
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const idMatch = order._id?.toLowerCase().includes(q);
      const itemMatch = order.items?.some((it) => it.product?.title?.toLowerCase().includes(q));
      return idMatch || itemMatch;
    }
    return true;
  });

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white">Order History</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Track shipping details, delivery status & refund processing</p>
      </div>

      {/* Search & Filter Tabs */}
      <div className="mb-6 space-y-3.5">
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by Order ID or Product name..."
            className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white/70 dark:bg-slate-900/50 text-sm text-slate-800 dark:text-slate-200 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* Tab Pills */}
        <div className="flex flex-wrap gap-2">
          {[
            { id: 'ALL', label: 'All Orders' },
            { 
              id: 'REFUND_PENDING', 
              label: 'Refund Pending', 
              count: orders.filter(o => o.paymentStatus === 'refund_pending' || ['return_requested', 'return_approved', 'out_for_pickup', 'returning_to_seller'].includes(o.orderStatus)).length 
            },
            { id: 'IN_TRANSIT', label: 'On The Way' },
            { id: 'DELIVERED', label: 'Delivered' },
            { id: 'CANCELLED_RETURNED', label: 'Cancelled & Returns' },
          ].map((tab) => {
            const isActive = activeOrderTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveOrderTab(tab.id)}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-500/25'
                    : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                }`}
              >
                <span>{tab.label}</span>
                {tab.count !== undefined && tab.count > 0 && (
                  <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-extrabold ${isActive ? 'bg-white/20 text-white' : 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30'}`}>
                    {tab.count}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {error && (
        <div className="mb-6 flex items-center gap-2 rounded-lg bg-red-500/10 p-4 text-sm text-red-400 border border-red-500/20">
          <AlertCircle className="h-5 w-5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {orders.length === 0 ? (
        <div className="text-center py-20 border border-dashed border-slate-200 dark:border-slate-800 rounded-2xl">
          <Package className="h-16 w-16 text-slate-300 dark:text-slate-600 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-slate-800 dark:text-white mb-2">No orders placed yet</h2>
          <p className="text-slate-500 dark:text-slate-405 mb-6 max-w-xs mx-auto">Browse our catalogue and find your next premium outfit.</p>
          <Link to="/" className="rounded-xl bg-blue-600 px-6 py-3 font-semibold text-white transition-all hover:bg-blue-700">
            Browse Shop
          </Link>
        </div>
      ) : filteredOrders.length === 0 ? (
        <div className="text-center py-16 border border-dashed border-slate-200 dark:border-slate-800 rounded-2xl">
          <RotateCcw className="h-12 w-12 text-slate-400 dark:text-slate-600 mx-auto mb-3" />
          <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-1">No orders found</h3>
          <p className="text-sm text-slate-500">No orders match the selected filter or search query.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {filteredOrders.map((order) => {
            const statusAccentColor = 
              order.orderStatus === 'delivered' ? 'border-t-emerald-500' :
              order.orderStatus.includes('return') ? 'border-t-amber-500' :
              order.orderStatus === 'cancelled' ? 'border-t-red-500' : 'border-t-blue-500';

            return (
              <div
                key={order._id}
                className={`glass-card rounded-2xl border border-slate-200/80 dark:border-slate-800 border-t-4 ${statusAccentColor} overflow-hidden shadow-sm hover:shadow-md transition-all duration-300`}
              >
              {/* Order Card Header */}
              <div className="flex flex-wrap items-center justify-between gap-4 bg-slate-100/50 dark:bg-[#0f172a]/20 p-5 border-b border-slate-200 dark:border-slate-850">
                <div className="flex items-center gap-4 text-xs text-slate-650 dark:text-slate-400">
                  <div>
                    <span className="block font-medium uppercase text-[10px] tracking-wider text-slate-455">Order Placed</span>
                    <span className="font-bold text-slate-800 dark:text-slate-200 mt-1 flex items-center gap-1">
                      <Calendar className="h-3.5 w-3.5" />
                      {new Date(order.createdAt).toLocaleDateString(undefined, {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                      })}
                    </span>
                  </div>
                  <div>
                    <span className="block font-medium uppercase text-[10px] tracking-wider text-slate-455">Total Price</span>
                    <span className="font-bold text-slate-800 dark:text-slate-200 mt-1">
                      ₹{order.totalAmount}
                    </span>
                  </div>
                  <div>
                    <span className="block font-medium uppercase text-[10px] tracking-wider text-slate-455">Order ID</span>
                    <span className="font-bold text-slate-500 mt-1 uppercase font-semibold">
                      #{order._id.substring(0, 10)}...
                    </span>
                  </div>
                  {['delivered', 'return_requested', 'return_approved', 'out_for_pickup', 'returning_to_seller', 'returned', 'return_rejected'].includes(order.orderStatus) ? (
                    <div>
                      <span className="block font-bold uppercase text-[10px] tracking-wider text-emerald-600 dark:text-emerald-400">Delivered On</span>
                      <span className="font-extrabold text-emerald-600 dark:text-emerald-400 mt-1 flex items-center gap-1">
                        <CheckCircle className="h-3.5 w-3.5" />
                        {order.deliveredAt ? new Date(order.deliveredAt).toLocaleDateString(undefined, {
                          weekday: 'short',
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric'
                        }) : new Date(order.updatedAt || order.createdAt).toLocaleDateString(undefined, {
                          weekday: 'short',
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric'
                        })}
                      </span>
                    </div>
                  ) : order.orderStatus !== 'cancelled' ? (
                    <div>
                      <span className="block font-medium uppercase text-[10px] tracking-wider text-slate-455">Expected Delivery</span>
                      <span className="font-bold text-blue-600 dark:text-blue-400 mt-1 flex items-center gap-1">
                        <Clock className="h-3.5 w-3.5" />
                        {getExpectedDeliveryDate(order.createdAt)}
                      </span>
                    </div>
                  ) : null}
                </div>

                <div className="flex items-center gap-3">
                  {(order.orderStatus === 'placed' || order.orderStatus === 'confirmed') && (
                    <button
                      type="button"
                      onClick={() => handleOpenCancelModal(order)}
                      className="rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-600 dark:text-red-400 border border-red-500/30 px-3 py-1.5 text-xs font-bold transition-all flex items-center gap-1.5"
                    >
                      <X className="h-3.5 w-3.5" />
                      <span>Cancel Order</span>
                    </button>
                  )}
                  {isEligibleForReturn(order) && (
                    <button
                      onClick={() => handleOpenReturnModal(order)}
                      className="rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-600 dark:text-amber-400 border border-amber-500/30 px-3 py-1.5 text-xs font-bold transition-all flex items-center gap-1.5"
                    >
                      <RotateCcw className="h-3.5 w-3.5" />
                      <span>Request Return</span>
                    </button>
                  )}
                  <button
                    onClick={() => handleDownloadInvoice(order)}
                    className="rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0f172a]/40 p-2 text-slate-500 dark:text-slate-400 hover:border-slate-350 dark:hover:border-slate-700 hover:text-slate-900 dark:hover:text-white transition-all flex items-center gap-1.5"
                    title="Download Invoice PDF"
                  >
                    <Download className="h-4 w-4 text-blue-500" />
                    <span className="text-xs font-semibold">Invoice</span>
                  </button>
                  {getStatusBadge(order)}
                </div>
              </div>

              {/* Interactive Visual Tracker Progress Bar */}
              {renderTrackerProgress(order)}

              {/* Order Card Body */}
              <div className="p-5 space-y-5">

                {/* Shipping Details */}
                <div className="flex items-start gap-2 text-xs text-slate-600 dark:text-slate-400">
                  <MapPin className="h-4.5 w-4.5 text-slate-400 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold text-slate-800 dark:text-slate-350 block">Shipping Location</span>
                    <span className="mt-1 block">
                      {order.shippingAddress.line1}, {order.shippingAddress.city}, {order.shippingAddress.state} - {order.shippingAddress.pincode}
                    </span>
                    <span className="block text-slate-450 mt-0.5">Phone: {order.shippingAddress.phone}</span>
                  </div>
                </div>

                {/* Items in order */}
                <div className="border-t border-slate-150 dark:border-slate-800 pt-4 space-y-4">
                  {order.items.map((item, idx) => {
                    const prod = item.product;
                    if (!prod) return null;
                    return (
                      <div key={idx} className="p-4 sm:p-5 rounded-2xl bg-slate-100/50 dark:bg-slate-900/40 border border-slate-200/80 dark:border-slate-800 flex flex-col sm:flex-row gap-5 items-start sm:items-center hover:border-slate-300 dark:hover:border-slate-700 transition-all">
                        {/* Larger Image Thumbnail */}
                        <div 
                          onClick={() => setLightboxImage(getImageUrl(prod.images?.[0]))}
                          className="h-28 w-24 sm:h-32 sm:w-28 overflow-hidden rounded-xl bg-slate-200 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 shrink-0 cursor-pointer group relative shadow-sm"
                        >
                          <img
                            src={getImageUrl(prod.images?.[0])}
                            alt={prod.title}
                            className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                          <div className="absolute inset-0 bg-slate-950/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                            <span className="text-[10px] font-bold text-white bg-slate-900/80 px-2 py-1 rounded-md backdrop-blur-sm">Zoom</span>
                          </div>
                        </div>

                        {/* Product Details & Badges */}
                        <div className="flex-1 min-w-0 space-y-2">
                          <h4 className="text-base font-bold text-slate-900 dark:text-white line-clamp-2">
                            {prod.title}
                          </h4>
                          
                          <div className="flex flex-wrap items-center gap-2 pt-1 text-xs">
                            <span className="inline-flex items-center gap-1 rounded-lg bg-blue-500/10 px-2.5 py-1 text-xs font-bold text-blue-600 dark:text-blue-400 border border-blue-500/20">
                              Size: {item.size}
                            </span>
                            <span className="inline-flex items-center gap-1 rounded-lg bg-purple-500/10 px-2.5 py-1 text-xs font-bold text-purple-600 dark:text-purple-400 border border-purple-500/20">
                              Qty: {item.qty} {item.qty === 1 ? 'item' : 'items'}
                            </span>
                            {prod.category && (
                              <span className="inline-flex items-center gap-1 rounded-lg bg-slate-200 dark:bg-slate-800 px-2.5 py-1 text-[11px] font-semibold text-slate-600 dark:text-slate-400 border border-slate-300 dark:border-slate-700 capitalize">
                                {prod.category}
                              </span>
                            )}
                          </div>

                          {order.orderStatus === 'delivered' && (
                            <div className="pt-1">
                              <button
                                type="button"
                                onClick={() => handleOpenReviewModal(prod)}
                                className="inline-flex items-center gap-1 text-blue-600 dark:text-blue-400 hover:text-blue-700 font-bold text-xs hover:underline transition-colors"
                              >
                                <Star className="h-3.5 w-3.5 fill-current" />
                                <span>Write a Product Review</span>
                              </button>
                            </div>
                          )}
                        </div>

                        {/* Price breakdown block */}
                        <div className="sm:text-right shrink-0 border-t sm:border-t-0 border-slate-200 dark:border-slate-800 pt-3 sm:pt-0 w-full sm:w-auto flex sm:flex-col justify-between sm:justify-center items-center sm:items-end">
                          <span className="text-[11px] text-slate-500 dark:text-slate-400">Total Price</span>
                          <div>
                            <span className="text-lg font-extrabold text-slate-900 dark:text-white block">
                              ₹{item.priceAtPurchase * item.qty}
                            </span>
                            <span className="text-[11px] text-slate-500 dark:text-slate-450 block">
                              ₹{item.priceAtPurchase} / unit
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Return Details Card */}
                {order.returnDetails?.reason && (
                  <div className="border-t border-slate-150 dark:border-slate-800 pt-4 space-y-3">
                    <div className="flex items-center gap-2 text-xs font-bold text-amber-600 dark:text-amber-400">
                      <RotateCcw className="h-4 w-4" />
                      <span>Return Request Information</span>
                    </div>
                    <div className="rounded-xl bg-amber-500/5 dark:bg-amber-500/10 border border-amber-500/20 p-4 text-xs space-y-3">
                      <div>
                        <span className="font-bold text-slate-700 dark:text-slate-300">Reason for Return:</span>
                        <p className="text-slate-600 dark:text-slate-400 mt-0.5">{order.returnDetails.reason}</p>
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
                                className="block text-left rounded-lg overflow-hidden border border-slate-200 dark:border-slate-700 hover:scale-105 transition-transform"
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

                      {order.returnDetails.adminComment && (
                        <div className="bg-white/60 dark:bg-slate-900/60 p-2.5 rounded-lg border border-amber-500/20">
                          <span className="font-bold text-slate-800 dark:text-slate-200">Admin Response / Pickup Note:</span>
                          <p className="text-slate-600 dark:text-slate-400 mt-0.5">{order.returnDetails.adminComment}</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Dedicated Refund Pending Details Section */}
                {order.paymentStatus === 'refund_pending' && (
                  <div className="border-t border-slate-150 dark:border-slate-800 pt-4">
                    <div className="rounded-xl border border-amber-500/30 bg-amber-50/70 dark:bg-amber-950/20 p-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Clock className="h-4 w-4 text-amber-500 animate-pulse" />
                          <span className="text-xs font-bold text-amber-700 dark:text-amber-300">
                            Refund Pending: ₹{order.totalAmount}
                          </span>
                        </div>
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-500/20 text-amber-600 dark:text-amber-400 border border-amber-500/30">
                          Seller Processing Payout
                        </span>
                      </div>

                      {/* Product Details Box */}
                      <div className="bg-white/70 dark:bg-slate-900/60 p-3 rounded-lg border border-amber-500/20 space-y-2">
                        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                          Refund Item(s):
                        </span>
                        <div className="space-y-2">
                          {order.items.map((item, i) => (
                            <div key={i} className="flex items-center gap-3">
                              <img
                                src={getImageUrl(item.product?.images?.[0])}
                                alt={item.product?.title || 'Product'}
                                className="h-11 w-11 object-cover rounded-md border border-slate-200 dark:border-slate-800"
                              />
                              <div className="flex-1 min-w-0">
                                <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate">
                                  {item.product?.title}
                                </h4>
                                <p className="text-[11px] text-slate-500">
                                  Size: <span className="font-semibold text-slate-700 dark:text-slate-300">{item.size}</span> • Qty: <span className="font-semibold text-slate-700 dark:text-slate-300">{item.qty}</span> • ₹{item.priceAtPurchase || item.price}
                                </p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Refund Destination Details */}
                      <div className="bg-white/70 dark:bg-slate-900/60 p-3 rounded-lg border border-amber-500/20 space-y-1 text-xs">
                        <span className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                          Payout Credit Destination:
                        </span>
                        {(order.cancellationDetails?.refundMethod === 'upi' || order.returnDetails?.refundMethod === 'upi') ? (
                          <div className="flex items-center gap-1.5 font-bold text-blue-600 dark:text-blue-400">
                            <Smartphone className="h-3.5 w-3.5" />
                            <span>UPI ID: {order.cancellationDetails?.upiId || order.returnDetails?.upiId}</span>
                          </div>
                        ) : (order.cancellationDetails?.bankDetails?.accountNumber || order.returnDetails?.bankDetails?.accountNumber) ? (
                          <div className="space-y-0.5 text-slate-600 dark:text-slate-400">
                            <p className="font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                              <Building2 className="h-3.5 w-3.5 text-slate-500" />
                              Bank: {order.cancellationDetails?.bankDetails?.bankName || order.returnDetails?.bankDetails?.bankName || 'Bank Transfer'}
                            </p>
                            <p className="pl-5">
                              A/C: ****{(order.cancellationDetails?.bankDetails?.accountNumber || order.returnDetails?.bankDetails?.accountNumber)?.slice(-4)} ({order.cancellationDetails?.bankDetails?.accountHolderName || order.returnDetails?.bankDetails?.accountHolderName})
                            </p>
                            <p className="pl-5 text-slate-500">
                              IFSC: {order.cancellationDetails?.bankDetails?.ifscCode || order.returnDetails?.bankDetails?.ifscCode}
                            </p>
                          </div>
                        ) : null}

                        {order.cancellationDetails?.reason && (
                          <p className="text-slate-500 pt-1.5 border-t border-slate-200/50 dark:border-slate-800/50 mt-1">
                            Cancellation Reason: <span className="font-medium text-slate-700 dark:text-slate-300">{order.cancellationDetails.reason}</span>
                          </p>
                        )}
                        {order.returnDetails?.reason && (
                          <p className="text-slate-500 pt-1.5 border-t border-slate-200/50 dark:border-slate-800/50 mt-1">
                            Return Reason: <span className="font-medium text-slate-700 dark:text-slate-300">{order.returnDetails.reason}</span>
                          </p>
                        )}
                      </div>

                      <p className="text-[11px] text-amber-700/80 dark:text-amber-400/80 italic">
                        ℹ️ Seller is processing this refund transfer. Amount will be credited to this destination within 24-48 business hours.
                      </p>
                    </div>
                  </div>
                )}

                {/* Completed Cancellation Details Section */}
                {order.orderStatus === 'cancelled' && order.paymentStatus === 'refunded' && order.cancellationDetails && order.cancellationDetails.refundMethod !== 'none' && (
                  <div className="border-t border-slate-150 dark:border-slate-800 pt-4">
                    <div className="rounded-xl border border-emerald-500/30 bg-emerald-50/50 dark:bg-emerald-950/20 p-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
                          <CheckCircle className="h-4 w-4" />
                          Refund Completed & Paid
                        </span>
                        <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400">
                          Refunded: ₹{order.totalAmount}
                        </span>
                      </div>

                      {order.cancellationDetails.adminComment && (
                        <div className="text-xs text-slate-700 dark:text-slate-300 bg-white/60 dark:bg-slate-900/60 p-2.5 rounded-lg border border-emerald-500/20">
                          <span className="font-semibold text-slate-500 block mb-0.5">Admin Note:</span>
                          <p>{order.cancellationDetails.adminComment}</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Status Timeline History */}
                {order.statusHistory && order.statusHistory.length > 0 && (
                  <div className="border-t border-slate-150 dark:border-slate-800 pt-4 space-y-3">
                    <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-500">Tracking Updates History</span>
                    <div className="relative pl-4 border-l border-slate-200 dark:border-slate-800 space-y-5 py-1 ml-2">
                      {getGroupedStatusHistory(order.statusHistory).map((group, idx) => (
                        <div key={idx} className="relative">
                          {/* Timeline node dot */}
                          <span className="absolute -left-[21px] top-1.5 flex h-2.5 w-2.5 items-center justify-center rounded-full bg-blue-500 dark:bg-blue-400 ring-4 ring-white dark:ring-[#0b0f19]"></span>
                          
                          <div className="text-xs space-y-2">
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="font-bold text-slate-850 dark:text-slate-200">
                                {getStatusLabel(group.status)}
                              </span>
                              <span className="text-[10px] text-slate-450">
                                Last updated: {new Date(group.updatedAt).toLocaleString(undefined, {
                                  month: 'short',
                                  day: 'numeric',
                                  hour: '2-digit',
                                  minute: '2-digit',
                                })}
                              </span>
                            </div>
                            
                            <div className="space-y-1.5 pl-1">
                              {group.updates.filter(u => u.message && u.message.trim()).map((update, uIdx) => (
                                <div key={uIdx} className="text-slate-650 dark:text-slate-400 font-medium bg-slate-100/50 dark:bg-slate-900/30 p-2.5 rounded-lg border border-slate-200/50 dark:border-slate-850">
                                  <div className="flex justify-between items-center text-[10px] text-slate-450 mb-1">
                                    <span>Update #{uIdx + 1}</span>
                                    <span>
                                      {new Date(update.updatedAt).toLocaleString(undefined, {
                                        month: 'short',
                                        day: 'numeric',
                                        hour: '2-digit',
                                        minute: '2-digit',
                                      })}
                                    </span>
                                  </div>
                                  <p className="text-xs text-slate-700 dark:text-slate-300">{update.message}</p>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        })}
        </div>
      )}
      {/* Review Submission Modal */}
      {showReviewModal && selectedProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="glass-card w-full max-w-md rounded-2xl p-6 border border-slate-200 dark:border-slate-850 bg-white dark:bg-[#0f172a] shadow-2xl relative space-y-6">
            <button
              onClick={() => setShowReviewModal(false)}
              className="absolute right-4 top-4 rounded-full p-1.5 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              <X className="h-5 w-5" />
            </button>

            <div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">Review Product</h3>
              <p className="text-xs text-slate-500 mt-1">Review for {selectedProduct.title}</p>
            </div>

            {reviewError && (
              <div className="rounded-lg bg-red-500/10 p-3 text-xs text-red-400 border border-red-500/20">
                {reviewError}
              </div>
            )}

            <form onSubmit={handleReviewSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-650 dark:text-slate-355 mb-2">
                  Your Rating
                </label>
                <div className="flex gap-1.5 items-center">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setRating(star)}
                      className="text-slate-300 transition-colors hover:text-yellow-400 focus:outline-none"
                    >
                      <Star
                        size={26}
                        className={
                          star <= rating
                            ? 'fill-yellow-400 text-yellow-400 transition-all scale-105'
                            : 'text-slate-400 dark:text-slate-700'
                        }
                      />
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-650 dark:text-slate-355 mb-2">
                  Review Description
                </label>
                <textarea
                  required
                  rows={4}
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="What did you like or dislike? How was the fit and quality?"
                  className="block w-full rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0f172a]/50 px-3.5 py-2.5 text-sm text-slate-900 dark:text-slate-200 outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-650 dark:text-slate-355 mb-2">
                  Upload Photos (Optional, max 3)
                </label>
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={(e) => {
                    const files = Array.from(e.target.files || []);
                    if (files.length > 3) {
                      toast.error('You can upload up to 3 photos only');
                      setReviewImages(files.slice(0, 3));
                    } else {
                      setReviewImages(files);
                    }
                  }}
                  className="block w-full text-xs text-slate-555 dark:text-slate-400 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-blue-600/10 file:text-blue-550 hover:file:bg-blue-600/20 file:cursor-pointer"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowReviewModal(false)}
                  className="flex-1 rounded-lg bg-slate-105 dark:bg-slate-900 border border-slate-250 dark:border-slate-850 py-2.5 text-center text-xs font-semibold text-slate-700 dark:text-slate-350 hover:bg-slate-200 dark:hover:bg-slate-850 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={reviewLoading}
                  className="flex-1 flex items-center justify-center gap-1.5 rounded-lg bg-blue-600 py-2.5 text-xs font-bold text-white hover:bg-blue-700 disabled:opacity-50"
                >
                  {reviewLoading ? 'Submitting...' : 'Submit Review'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Return Request Modal */}
      {showReturnModal && selectedReturnOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="glass-card w-full max-w-lg rounded-2xl p-6 border border-slate-200 dark:border-slate-850 bg-white dark:bg-[#0f172a] shadow-2xl relative space-y-6 max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setShowReturnModal(false)}
              className="absolute right-4 top-4 rounded-full p-1.5 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              <X className="h-5 w-5" />
            </button>

            <div>
              <div className="flex items-center gap-2 text-amber-500 font-bold text-lg">
                <RotateCcw className="h-5 w-5" />
                <h3>Request Product Return</h3>
              </div>
              <p className="text-xs text-slate-500 mt-1">
                Order #{selectedReturnOrder._id.substring(0, 12)} (Eligible within 7 days of delivery)
              </p>
            </div>

            {returnError && (
              <div className="rounded-lg bg-red-500/10 p-3 text-xs text-red-400 border border-red-500/20 flex items-center gap-2">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{returnError}</span>
              </div>
            )}

            <form onSubmit={handleReturnSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-650 dark:text-slate-355 mb-2">
                  Select Reason for Return *
                </label>
                <select
                  value={returnReasonPreset}
                  onChange={(e) => setReturnReasonPreset(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0f172a] px-3.5 py-2.5 text-xs text-slate-900 dark:text-slate-200 outline-none focus:border-blue-500"
                >
                  <option value="Damaged or defective product">Damaged or defective product</option>
                  <option value="Wrong size delivered">Wrong size delivered</option>
                  <option value="Item not as described or shown in images">Item not as described or shown in images</option>
                  <option value="Quality not satisfactory">Quality not satisfactory</option>
                  <option value="Other reason">Other reason</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-650 dark:text-slate-355 mb-2">
                  Additional Details / Explanation
                </label>
                <textarea
                  rows={3}
                  value={returnReasonDetails}
                  onChange={(e) => setReturnReasonDetails(e.target.value)}
                  placeholder="Describe the issue in detail (e.g. tear on sleeve, wrong size printed on label)..."
                  className="block w-full rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0f172a]/50 px-3.5 py-2.5 text-xs text-slate-900 dark:text-slate-200 outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-650 dark:text-slate-355 mb-2">
                  Upload Product Proof Photos * (At least 1 photo required, max 4)
                </label>
                <div className="border border-dashed border-slate-300 dark:border-slate-700 rounded-xl p-4 text-center bg-slate-50/50 dark:bg-slate-900/40 space-y-2">
                  <Camera className="h-6 w-6 text-slate-400 mx-auto" />
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={(e) => {
                      const files = Array.from(e.target.files || []);
                      if (files.length > 4) {
                        toast.error('You can upload up to 4 photos max');
                        setReturnPhotos(files.slice(0, 4));
                      } else {
                        setReturnPhotos(files);
                      }
                    }}
                    className="block w-full text-xs text-slate-555 dark:text-slate-400 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-amber-500/10 file:text-amber-600 hover:file:bg-amber-500/20 file:cursor-pointer"
                  />
                  <p className="text-[10px] text-slate-450">Clear photos of the product and defect help accelerate return approval.</p>
                </div>
              </div>

              <div className="flex gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setShowReturnModal(false)}
                  className="flex-1 rounded-lg bg-slate-105 dark:bg-slate-900 border border-slate-250 dark:border-slate-850 py-2.5 text-center text-xs font-semibold text-slate-700 dark:text-slate-350 hover:bg-slate-200 dark:hover:bg-slate-850 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={returnLoading}
                  className="flex-1 flex items-center justify-center gap-1.5 rounded-lg bg-amber-600 py-2.5 text-xs font-bold text-white hover:bg-amber-700 disabled:opacity-50 transition-colors shadow-lg shadow-amber-500/20"
                >
                  {returnLoading ? (
                    <RefreshCw className="h-4 w-4 animate-spin" />
                  ) : (
                    <RotateCcw className="h-4 w-4" />
                  )}
                  <span>{returnLoading ? 'Submitting...' : 'Submit Return Request'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Cancellation & Refund Submission Modal */}
      {showCancelModal && selectedCancelOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="glass-card w-full max-w-lg rounded-2xl p-6 border border-slate-200 dark:border-slate-850 bg-white dark:bg-[#0f172a] shadow-2xl relative space-y-6 max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setShowCancelModal(false)}
              className="absolute right-4 top-4 rounded-full p-1.5 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              <X className="h-5 w-5" />
            </button>

            <div>
              <div className="flex items-center gap-2 text-red-500 font-bold text-lg">
                <X className="h-5 w-5" />
                <h3>Cancel Order Request</h3>
              </div>
              <p className="text-xs text-slate-500 mt-1">
                Order #{selectedCancelOrder._id.substring(0, 12)} • Total: ₹{selectedCancelOrder.totalAmount}
              </p>
            </div>

            {/* Online paid alert */}
            {(selectedCancelOrder.paymentStatus === 'paid' || selectedCancelOrder.paymentMethod === 'ONLINE') ? (
              <div className="rounded-xl bg-blue-500/10 p-3.5 text-xs text-blue-700 dark:text-blue-300 border border-blue-500/20 space-y-1">
                <div className="font-bold flex items-center gap-1.5">
                  <CheckCircle className="h-4 w-4 text-blue-500" />
                  <span>Online Payment Refund (₹{selectedCancelOrder.totalAmount})</span>
                </div>
                <p className="text-[11px] opacity-90">
                  Please submit your UPI ID or Bank details below. Your refund will be processed to this destination.
                </p>
              </div>
            ) : (
              <div className="rounded-xl bg-slate-500/10 p-3 text-xs text-slate-600 dark:text-slate-400 border border-slate-500/20">
                <span>This order was placed as Cash on Delivery. No refund is required.</span>
              </div>
            )}

            <form onSubmit={handleCancelSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-650 dark:text-slate-355 mb-2">
                  Select Reason for Cancellation *
                </label>
                <select
                  value={cancelReasonPreset}
                  onChange={(e) => setCancelReasonPreset(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0f172a] px-3.5 py-2.5 text-xs text-slate-900 dark:text-slate-200 outline-none focus:border-blue-500"
                >
                  <option value="Ordered by mistake">Ordered by mistake</option>
                  <option value="Found a better price elsewhere">Found a better price elsewhere</option>
                  <option value="Delay in delivery expectation">Delay in delivery expectation</option>
                  <option value="Incorrect shipping address">Incorrect shipping address</option>
                  <option value="Changed mind">Changed mind</option>
                  <option value="Other reason">Other reason</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-650 dark:text-slate-355 mb-2">
                  Additional Comments (Optional)
                </label>
                <textarea
                  rows={2}
                  value={cancelReasonDetails}
                  onChange={(e) => setCancelReasonDetails(e.target.value)}
                  placeholder="Optional details..."
                  className="block w-full rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0f172a]/50 px-3.5 py-2.5 text-xs text-slate-900 dark:text-slate-200 outline-none focus:border-blue-500"
                />
              </div>

              {/* Refund Destination Form for Online Paid Orders */}
              {(selectedCancelOrder.paymentStatus === 'paid' || selectedCancelOrder.paymentMethod === 'ONLINE') && (
                <div className="space-y-3 pt-2 border-t border-slate-200 dark:border-slate-800">
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200">
                    Refund Payout Method *
                  </label>

                  {/* Mode selector */}
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setCancelRefundMethod('upi')}
                      className={`flex-1 py-2 px-3 rounded-lg text-xs font-bold border transition-all ${
                        cancelRefundMethod === 'upi'
                          ? 'bg-blue-600 text-white border-blue-600 shadow-md shadow-blue-500/20'
                          : 'bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300'
                      }`}
                    >
                      UPI ID (Instant)
                    </button>
                    <button
                      type="button"
                      onClick={() => setCancelRefundMethod('bank_transfer')}
                      className={`flex-1 py-2 px-3 rounded-lg text-xs font-bold border transition-all ${
                        cancelRefundMethod === 'bank_transfer'
                          ? 'bg-blue-600 text-white border-blue-600 shadow-md shadow-blue-500/20'
                          : 'bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300'
                      }`}
                    >
                      Bank Account
                    </button>
                  </div>

                  {cancelRefundMethod === 'upi' ? (
                    <div>
                      <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                        UPI ID / VPA *
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. mobile@upi or username@oksbi"
                        value={cancelUpiId}
                        onChange={(e) => setCancelUpiId(e.target.value)}
                        className="w-full rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0f172a] px-3.5 py-2.5 text-xs text-slate-900 dark:text-slate-200 outline-none focus:border-blue-500"
                      />
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <div>
                        <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                          Account Holder Name *
                        </label>
                        <input
                          type="text"
                          required
                          placeholder="Name as per Bank records"
                          value={cancelAccountHolder}
                          onChange={(e) => setCancelAccountHolder(e.target.value)}
                          className="w-full rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0f172a] px-3.5 py-2.5 text-xs text-slate-900 dark:text-slate-200 outline-none focus:border-blue-500"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                          Bank Name *
                        </label>
                        <input
                          type="text"
                          required
                          placeholder="e.g. State Bank of India / HDFC Bank"
                          value={cancelBankName}
                          onChange={(e) => setCancelBankName(e.target.value)}
                          className="w-full rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0f172a] px-3.5 py-2.5 text-xs text-slate-900 dark:text-slate-200 outline-none focus:border-blue-500"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                            Account Number *
                          </label>
                          <input
                            type="text"
                            required
                            placeholder="Account Number"
                            value={cancelAccountNumber}
                            onChange={(e) => setCancelAccountNumber(e.target.value)}
                            className="w-full rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0f172a] px-3.5 py-2.5 text-xs text-slate-900 dark:text-slate-200 outline-none focus:border-blue-500"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                            Confirm A/C Number *
                          </label>
                          <input
                            type="text"
                            required
                            placeholder="Confirm Account"
                            value={cancelConfirmAccount}
                            onChange={(e) => setCancelConfirmAccount(e.target.value)}
                            className="w-full rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0f172a] px-3.5 py-2.5 text-xs text-slate-900 dark:text-slate-200 outline-none focus:border-blue-500"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                          IFSC Code *
                        </label>
                        <input
                          type="text"
                          required
                          placeholder="e.g. SBIN0001234"
                          value={cancelIfsc}
                          onChange={(e) => setCancelIfsc(e.target.value.toUpperCase())}
                          className="w-full uppercase rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0f172a] px-3.5 py-2.5 text-xs text-slate-900 dark:text-slate-200 outline-none focus:border-blue-500"
                        />
                      </div>
                    </div>
                  )}
                </div>
              )}

              <div className="flex gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setShowCancelModal(false)}
                  className="flex-1 rounded-lg bg-slate-105 dark:bg-slate-900 border border-slate-250 dark:border-slate-850 py-2.5 text-center text-xs font-semibold text-slate-700 dark:text-slate-350 hover:bg-slate-200 dark:hover:bg-slate-850 transition-colors"
                >
                  Don't Cancel
                </button>
                <button
                  type="submit"
                  disabled={cancelLoading}
                  className="flex-1 flex items-center justify-center gap-1.5 rounded-lg bg-red-600 py-2.5 text-xs font-bold text-white hover:bg-red-700 disabled:opacity-50 transition-colors shadow-lg shadow-red-500/20"
                >
                  {cancelLoading ? (
                    <RefreshCw className="h-4 w-4 animate-spin" />
                  ) : (
                    <X className="h-4 w-4" />
                  )}
                  <span>{cancelLoading ? 'Processing...' : 'Confirm Cancellation'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Image Lightbox Modal */}
      {lightboxImage && (
        <div 
          className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4"
          onClick={() => setLightboxImage(null)}
        >
          <div className="relative max-w-3xl w-full max-h-[85vh] flex flex-col items-center justify-center" onClick={(e) => e.stopPropagation()}>
            <button
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

export default MyOrders;
