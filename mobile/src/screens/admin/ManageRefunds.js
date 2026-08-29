import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Modal,
  Image,
  TextInput,
  ScrollView,
  Dimensions,
} from 'react-native';
import { useAppTheme } from '../../context/ThemeContext';
import { useAppNavigation } from '../../context/NavigationContext';
import { useToast } from '../../context/ToastContext';
import API from '../../api/api';
import {
  ArrowLeft,
  RotateCcw,
  CheckCircle2,
  XCircle,
  Clock,
  Truck,
  Copy,
  CreditCard,
  Building2,
  Phone,
  Mail,
  User,
  Calendar,
  AlertTriangle,
  X,
  Search,
  Check,
  ExternalLink,
} from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';

const { width } = Dimensions.get('window');

const getImageUrl = (imagePath) => {
  if (!imagePath) return 'https://images.unsplash.com/photo-1523381210434-271e8be1f52b?auto=format&fit=crop&q=80&w=150';
  if (imagePath.startsWith('http')) return imagePath;
  return `https://debclothes-backend.onrender.com/${imagePath}`;
};

const REFUND_TABS = [
  { id: 'all', label: 'All Refunds & Cancels' },
  { id: 'pending', label: 'Refund Pending' },
  { id: 'pickup', label: 'Pickup / In-Transit' },
  { id: 'refunded', label: 'Refunded / Completed' },
  { id: 'cancelled', label: 'Cancelled Orders' },
  { id: 'rejected', label: 'Rejected' },
];

export default function ManageRefunds() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Action Dialog & Photo Preview States
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [targetStatus, setTargetStatus] = useState('');
  const [adminNote, setAdminNote] = useState('');
  const [updating, setUpdating] = useState(false);
  const [previewPhoto, setPreviewPhoto] = useState(null);

  // Refund Confirmation Modal States
  const [refundModalOrder, setRefundModalOrder] = useState(null);
  const [refundTxnRef, setRefundTxnRef] = useState('');
  const [refundAdminNote, setRefundAdminNote] = useState('');
  const [submittingRefund, setSubmittingRefund] = useState(false);

  const { colors, isDark } = useAppTheme();
  const { goBack, navigateTo } = useAppNavigation();
  const { showToast } = useToast();

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    setLoading(true);
    setError('');
    try {
      const { data } = await API.get('/api/orders');
      setOrders(data || []);
    } catch (err) {
      const errMsg = err.response?.data?.message || 'Failed to fetch refund orders';
      setError(errMsg);
      showToast(errMsg, 'error');
    } finally {
      setLoading(false);
    }
  };

  // Filter orders that have return/refund requests or cancellations
  const refundAndCancelOrders = orders.filter((o) => {
    const isReturn = [
      'return_requested',
      'return_approved',
      'out_for_pickup',
      'returning_to_seller',
      'returned',
      'return_rejected',
    ].includes(o.orderStatus) || !!o.returnDetails;

    const isCancelled = o.orderStatus === 'cancelled';
    const isRefundPendingOrDone = ['refund_pending', 'refunded'].includes(o.paymentStatus);

    return isReturn || isCancelled || isRefundPendingOrDone;
  });

  // Filter by Tab & Search
  const filteredOrders = refundAndCancelOrders.filter((o) => {
    // Tab filter
    if (activeTab === 'pending') {
      const isPending = o.orderStatus === 'return_requested' || o.paymentStatus === 'refund_pending';
      if (!isPending) return false;
    }
    if (activeTab === 'pickup' && !['return_approved', 'out_for_pickup', 'returning_to_seller'].includes(o.orderStatus)) return false;
    if (activeTab === 'refunded' && o.orderStatus !== 'returned' && o.paymentStatus !== 'refunded') return false;
    if (activeTab === 'cancelled' && o.orderStatus !== 'cancelled') return false;
    if (activeTab === 'rejected' && o.orderStatus !== 'return_rejected') return false;

    // Search query filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const idMatch = o._id.toLowerCase().includes(q);
      const userMatch = o.user?.name?.toLowerCase().includes(q) || o.user?.email?.toLowerCase().includes(q);
      const upiMatch = o.returnDetails?.upiId?.toLowerCase().includes(q) || o.cancellationDetails?.upiId?.toLowerCase().includes(q);
      const bankMatch = o.returnDetails?.bankDetails?.accountNumber?.includes(q) || o.cancellationDetails?.bankDetails?.accountNumber?.includes(q);
      return idMatch || userMatch || upiMatch || bankMatch;
    }

    return true;
  });

  const handleOpenActionModal = (order, newStatus) => {
    setSelectedOrder(order);
    setTargetStatus(newStatus);
    setAdminNote(order.returnDetails?.adminComment || order.shippingNotes || '');
  };

  const handleUpdateReturnStatus = async () => {
    if (!selectedOrder || !targetStatus) return;
    setUpdating(true);

    try {
      await API.put(`/api/orders/${selectedOrder._id}/status`, {
        status: targetStatus,
        shippingNotes: adminNote || `Status updated to ${targetStatus.replace(/_/g, ' ')} by Admin`,
      });

      showToast(`Order status updated to ${targetStatus.toUpperCase()}`, 'success');
      setSelectedOrder(null);
      fetchOrders();
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to update return status.', 'error');
    } finally {
      setUpdating(false);
    }
  };

  const handleConfirmProcessRefund = async () => {
    if (!refundModalOrder) return;
    setSubmittingRefund(true);

    try {
      await API.put(`/api/orders/${refundModalOrder._id}/refund`, {
        paymentStatus: 'refunded',
        transactionReference: refundTxnRef,
        adminComment: refundAdminNote,
      });

      showToast(`Refund of ₹${refundModalOrder.totalAmount} marked as refunded!`, 'success');
      setRefundModalOrder(null);
      setRefundTxnRef('');
      setRefundAdminNote('');
      fetchOrders();
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to process refund.', 'error');
    } finally {
      setSubmittingRefund(false);
    }
  };

  const getStatusBadge = (item) => {
    if (item.orderStatus === 'cancelled') {
      if (item.paymentStatus === 'refund_pending') {
        return { label: 'Cancel (Refund Pending)', bg: '#f59e0b20', color: '#f59e0b', icon: Clock };
      }
      if (item.paymentStatus === 'refunded') {
        return { label: 'Cancelled & Refunded', bg: '#10b98120', color: '#10b981', icon: CheckCircle2 };
      }
      return { label: 'Order Cancelled', bg: '#ef444420', color: '#ef4444', icon: XCircle };
    }
    switch (item.orderStatus) {
      case 'return_requested':
        return { label: 'Return Requested', bg: '#f59e0b20', color: '#f59e0b', icon: Clock };
      case 'return_approved':
        return { label: 'Return Approved', bg: '#3b82f620', color: '#3b82f6', icon: CheckCircle2 };
      case 'out_for_pickup':
        return { label: 'Out for Pickup', bg: '#8b5cf620', color: '#8b5cf6', icon: Truck };
      case 'returning_to_seller':
        return { label: 'Returning to Hub', bg: '#a855f720', color: '#a855f7', icon: Truck };
      case 'returned':
        return { label: 'Returned & Refunded', bg: '#10b98120', color: '#10b981', icon: CheckCircle2 };
      case 'return_rejected':
        return { label: 'Return Rejected', bg: '#ef444420', color: '#ef4444', icon: XCircle };
      default:
        return { label: item.orderStatus.toUpperCase(), bg: colors.border, color: colors.textSecondary, icon: Clock };
    }
  };

  const renderOrderCard = ({ item }) => {
    const badge = getStatusBadge(item);
    const StatusIcon = badge.icon;
    const isReturnFlow = item.returnDetails || item.orderStatus.startsWith('return');
    const isPaidOrder = item.paymentStatus === 'paid' || item.paymentMethod === 'ONLINE' || (item.cancellationDetails?.refundMethod && item.cancellationDetails.refundMethod !== 'none');
    const isReturnOrder = ['return_requested', 'return_approved', 'out_for_pickup', 'returning_to_seller', 'returned'].includes(item.orderStatus);
    const needsRefund = item.paymentStatus === 'refund_pending' || (item.orderStatus === 'cancelled' && isPaidOrder && item.paymentStatus !== 'refunded') || (isReturnOrder && item.paymentStatus !== 'refunded');

    return (
      <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
        {/* Card Header */}
        <View style={styles.cardHeader}>
          <View style={{ flex: 1, marginRight: 8 }}>
            <Text style={[styles.orderIdText, { color: colors.text }]} numberOfLines={1}>
              Order #{item._id.slice(-8).toUpperCase()}
            </Text>
            <View style={styles.dateRow}>
              <Calendar size={12} color={colors.textSecondary} style={{ marginRight: 4 }} />
              <Text style={[styles.dateText, { color: colors.textSecondary }]}>
                {new Date(item.createdAt).toLocaleDateString()} • ₹{item.totalAmount}
              </Text>
            </View>
          </View>

          <View style={[styles.badgePill, { backgroundColor: badge.bg }]}>
            <StatusIcon size={12} color={badge.color} style={{ marginRight: 4 }} />
            <Text style={[styles.badgePillText, { color: badge.color }]}>{badge.label}</Text>
          </View>
        </View>

        {/* Customer Information */}
        <View style={[styles.customerBox, { backgroundColor: isDark ? 'rgba(255,255,255,0.03)' : '#f8f7ff' }]}>
          <View style={styles.customerRow}>
            <User size={13} color={colors.primary} style={{ marginRight: 6 }} />
            <Text style={[styles.customerName, { color: colors.text }]}>{item.user?.name || 'Customer'}</Text>
          </View>
          <View style={styles.customerRow}>
            <Mail size={13} color={colors.textSecondary} style={{ marginRight: 6 }} />
            <Text style={[styles.customerSub, { color: colors.textSecondary }]}>{item.user?.email}</Text>
          </View>
          {item.shippingAddress?.phone ? (
            <View style={styles.customerRow}>
              <Phone size={13} color={colors.textSecondary} style={{ marginRight: 6 }} />
              <Text style={[styles.customerSub, { color: colors.textSecondary }]}>{item.shippingAddress.phone}</Text>
            </View>
          ) : null}
        </View>

        {/* Product Items Summary */}
        <View style={styles.itemsSection}>
          {item.items?.map((prodItem, idx) => (
            <View key={idx} style={styles.itemRow}>
              <Image source={{ uri: getImageUrl(prodItem.product?.images?.[0]) }} style={styles.itemThumb} />
              <View style={styles.itemMeta}>
                <Text style={[styles.itemTitle, { color: colors.text }]} numberOfLines={1}>
                  {prodItem.product?.title || 'Catalog Item'}
                </Text>
                <Text style={[styles.itemSub, { color: colors.textSecondary }]}>
                  Size: {prodItem.size} | Qty: {prodItem.qty}
                </Text>
              </View>
              <Text style={[styles.itemPrice, { color: colors.primary }]}>₹{prodItem.priceAtPurchase}</Text>
            </View>
          ))}
        </View>

        {/* Return Details & Reason (if return requested) */}
        {item.returnDetails ? (
          <View style={[styles.returnDetailsCard, { borderColor: isDark ? '#2e2448' : '#e9d5ff', backgroundColor: isDark ? '#161328' : '#faf5ff' }]}>
            <View style={styles.returnHeaderRow}>
              <AlertTriangle size={15} color={colors.warning} style={{ marginRight: 6 }} />
              <Text style={[styles.returnHeaderTitle, { color: colors.text }]}>Return Reason & Request</Text>
            </View>
            <Text style={[styles.returnReasonText, { color: colors.text }]}>
              "{item.returnDetails.reason}"
            </Text>

            {/* Proof Photos */}
            {item.returnDetails.photos && item.returnDetails.photos.length > 0 && (
              <View style={{ marginTop: 10 }}>
                <Text style={[styles.proofLabel, { color: colors.textSecondary }]}>Customer Proof Photos:</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 6 }}>
                  {item.returnDetails.photos.map((photo, pIdx) => (
                    <TouchableOpacity
                      key={pIdx}
                      onPress={() => setPreviewPhoto(getImageUrl(photo))}
                      style={styles.photoThumbWrapper}
                    >
                      <Image source={{ uri: getImageUrl(photo) }} style={styles.photoThumb} />
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            )}

            {/* Refund Payout Destination */}
            <View style={[styles.payoutBox, { borderColor: colors.border, backgroundColor: isDark ? '#131122' : '#ffffff' }]}>
              <Text style={[styles.payoutHeader, { color: colors.text }]}>Refund Payout Destination:</Text>
              {item.returnDetails.refundMethod === 'upi' ? (
                <View style={styles.payoutDetailRow}>
                  <CreditCard size={14} color={colors.primary} style={{ marginRight: 6 }} />
                  <Text style={[styles.payoutValue, { color: colors.text }]}>
                    UPI ID: <Text style={{ fontWeight: '900', color: colors.primary }}>{item.returnDetails.upiId}</Text>
                  </Text>
                </View>
              ) : item.returnDetails.bankDetails ? (
                <View style={{ marginTop: 4 }}>
                  <View style={styles.payoutDetailRow}>
                    <Building2 size={14} color={colors.primary} style={{ marginRight: 6 }} />
                    <Text style={[styles.payoutValue, { color: colors.text }]}>
                      Bank: {item.returnDetails.bankDetails.bankName || 'N/A'}
                    </Text>
                  </View>
                  <Text style={[styles.payoutSubValue, { color: colors.textSecondary }]}>
                    A/C: {item.returnDetails.bankDetails.accountNumber} ({item.returnDetails.bankDetails.accountHolderName})
                  </Text>
                  <Text style={[styles.payoutSubValue, { color: colors.textSecondary }]}>
                    IFSC: {item.returnDetails.bankDetails.ifscCode}
                  </Text>
                </View>
              ) : (
                <Text style={{ fontSize: 12, color: colors.textSecondary }}>Original Payment Method</Text>
              )}
            </View>

            {item.returnDetails.adminComment ? (
              <View style={styles.adminCommentRow}>
                <Text style={[styles.adminCommentLabel, { color: colors.textSecondary }]}>Admin Note:</Text>
                <Text style={[styles.adminCommentText, { color: colors.text }]}>{item.returnDetails.adminComment}</Text>
              </View>
            ) : null}
          </View>
        ) : null}

        {/* Cancellation Notice & Refund Payout Details */}
        {item.orderStatus === 'cancelled' && (
          <View style={[styles.cancelledBox, { backgroundColor: isDark ? 'rgba(239, 68, 68, 0.08)' : '#fef2f2', borderColor: 'rgba(239, 68, 68, 0.3)' }]}>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
              <XCircle size={16} color="#ef4444" style={{ marginRight: 6 }} />
              <Text style={styles.cancelledText}>
                Order Cancelled • Payment: <Text style={{ fontWeight: 'bold' }}>{item.paymentStatus.toUpperCase()}</Text>
              </Text>
            </View>

            {item.cancellationDetails?.reason ? (
              <Text style={[styles.returnReasonText, { color: colors.text, marginTop: 4, fontStyle: 'normal' }]}>
                Reason: <Text style={{ fontWeight: '700' }}>{item.cancellationDetails.reason}</Text>
              </Text>
            ) : null}

            {/* Payout destination for cancelled online order */}
            {item.cancellationDetails && item.cancellationDetails.refundMethod !== 'none' && (
              <View style={[styles.payoutBox, { borderColor: colors.border, backgroundColor: isDark ? '#131122' : '#ffffff', marginTop: 8 }]}>
                <Text style={[styles.payoutHeader, { color: colors.text }]}>Cancellation Refund Payout:</Text>
                {item.cancellationDetails.refundMethod === 'upi' ? (
                  <View style={styles.payoutDetailRow}>
                    <CreditCard size={14} color={colors.primary} style={{ marginRight: 6 }} />
                    <Text style={[styles.payoutValue, { color: colors.text }]}>
                      UPI ID: <Text style={{ fontWeight: '900', color: colors.primary }}>{item.cancellationDetails.upiId}</Text>
                    </Text>
                  </View>
                ) : item.cancellationDetails.bankDetails ? (
                  <View style={{ marginTop: 4 }}>
                    <View style={styles.payoutDetailRow}>
                      <Building2 size={14} color={colors.primary} style={{ marginRight: 6 }} />
                      <Text style={[styles.payoutValue, { color: colors.text }]}>
                        Bank: {item.cancellationDetails.bankDetails.bankName || 'Bank Transfer'}
                      </Text>
                    </View>
                    <Text style={[styles.payoutSubValue, { color: colors.textSecondary }]}>
                      A/C: {item.cancellationDetails.bankDetails.accountNumber} ({item.cancellationDetails.bankDetails.accountHolderName})
                    </Text>
                    <Text style={[styles.payoutSubValue, { color: colors.textSecondary }]}>
                      IFSC: {item.cancellationDetails.bankDetails.ifscCode}
                    </Text>
                  </View>
                ) : null}
              </View>
            )}
          </View>
        )}

        {/* Quick Admin Action Buttons */}
        <View style={styles.actionsGrid}>
          {needsRefund && (
            <TouchableOpacity
              style={[styles.actionBtnFull, { backgroundColor: '#10b981', marginBottom: 8 }]}
              onPress={() => {
                setRefundModalOrder(item);
                setRefundTxnRef('');
                setRefundAdminNote('');
              }}
            >
              <CheckCircle2 size={15} color="#fff" style={{ marginRight: 6 }} />
              <Text style={styles.actionBtnText}>Confirm Refund Paid (₹{item.totalAmount})</Text>
            </TouchableOpacity>
          )}

          {item.orderStatus === 'return_requested' && (
            <>
              <TouchableOpacity
                style={[styles.actionBtn, { backgroundColor: '#3b82f6' }]}
                onPress={() => handleOpenActionModal(item, 'return_approved')}
              >
                <Check size={14} color="#fff" style={{ marginRight: 4 }} />
                <Text style={styles.actionBtnText}>Approve Return</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.actionBtn, { backgroundColor: '#ef4444' }]}
                onPress={() => handleOpenActionModal(item, 'return_rejected')}
              >
                <X size={14} color="#fff" style={{ marginRight: 4 }} />
                <Text style={styles.actionBtnText}>Reject</Text>
              </TouchableOpacity>
            </>
          )}

          {item.orderStatus === 'return_approved' && (
            <TouchableOpacity
              style={[styles.actionBtnFull, { backgroundColor: '#8b5cf6' }]}
              onPress={() => handleOpenActionModal(item, 'out_for_pickup')}
            >
              <Truck size={14} color="#fff" style={{ marginRight: 6 }} />
              <Text style={styles.actionBtnText}>Assign Pickup Agent</Text>
            </TouchableOpacity>
          )}

          {item.orderStatus === 'out_for_pickup' && (
            <TouchableOpacity
              style={[styles.actionBtnFull, { backgroundColor: '#a855f7' }]}
              onPress={() => handleOpenActionModal(item, 'returning_to_seller')}
            >
              <Truck size={14} color="#fff" style={{ marginRight: 6 }} />
              <Text style={styles.actionBtnText}>Mark Returning to Hub</Text>
            </TouchableOpacity>
          )}

          {item.orderStatus === 'returning_to_seller' && (
            <TouchableOpacity
              style={[styles.actionBtnFull, { backgroundColor: '#10b981' }]}
              onPress={() => handleOpenActionModal(item, 'returned')}
            >
              <CheckCircle2 size={14} color="#fff" style={{ marginRight: 6 }} />
              <Text style={styles.actionBtnText}>Confirm Return & Process Refund</Text>
            </TouchableOpacity>
          )}

          {item.orderStatus !== 'returned' && item.orderStatus !== 'cancelled' && item.orderStatus !== 'return_rejected' && (
            <TouchableOpacity
              style={[styles.actionBtnOutline, { borderColor: colors.border }]}
              onPress={() => handleOpenActionModal(item, item.orderStatus)}
            >
              <Text style={[styles.actionBtnOutlineText, { color: colors.text }]}>Add Note / Change Status</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Top Header */}
      <View style={[styles.header, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
        <TouchableOpacity style={[styles.backBtn, { backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : '#f1f5f9' }]} onPress={goBack}>
          <ArrowLeft size={20} color={colors.text} />
        </TouchableOpacity>
        <View style={{ flex: 1, marginLeft: 12 }}>
          <Text style={[styles.headerTitle, { color: colors.text }]}>Refunds & Returns</Text>
          <Text style={[styles.headerSub, { color: colors.textSecondary }]}>
            {refundAndCancelOrders.length} total return & cancellation requests
          </Text>
        </View>
        <TouchableOpacity style={styles.refreshBtn} onPress={fetchOrders}>
          <RotateCcw size={18} color={colors.primary} />
        </TouchableOpacity>
      </View>

      {/* Search Bar */}
      <View style={[styles.searchContainer, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <Search size={16} color={colors.textSecondary} style={{ marginRight: 8 }} />
        <TextInput
          style={[styles.searchInput, { color: colors.text }]}
          placeholder="Search by Order ID, Customer, UPI, or A/C..."
          placeholderTextColor={colors.textSecondary}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        {searchQuery ? (
          <TouchableOpacity onPress={() => setSearchQuery('')}>
            <X size={16} color={colors.textSecondary} />
          </TouchableOpacity>
        ) : null}
      </View>

      {/* Filter Tabs Horizontal Scroll */}
      <View style={styles.tabsWrapper}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabsScroll}>
          {REFUND_TABS.map((tab) => (
            <TouchableOpacity
              key={tab.id}
              style={[
                styles.tabPill,
                activeTab === tab.id
                  ? { backgroundColor: colors.primary, borderColor: colors.primary }
                  : { backgroundColor: colors.card, borderColor: colors.border },
              ]}
              onPress={() => setActiveTab(tab.id)}
            >
              <Text
                style={[
                  styles.tabPillText,
                  { color: activeTab === tab.id ? '#ffffff' : colors.textSecondary },
                ]}
              >
                {tab.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Main List */}
      {loading && orders.length === 0 ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.loadingText, { color: colors.textSecondary }]}>Loading refund records...</Text>
        </View>
      ) : error ? (
        <View style={styles.center}>
          <Text style={[styles.errorText, { color: colors.danger }]}>{error}</Text>
          <TouchableOpacity style={[styles.retryBtn, { backgroundColor: colors.primary }]} onPress={fetchOrders}>
            <Text style={{ color: '#fff', fontWeight: 'bold' }}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : filteredOrders.length === 0 ? (
        <View style={styles.emptyContainer}>
          <RotateCcw size={48} color={colors.textSecondary} style={{ marginBottom: 12 }} />
          <Text style={[styles.emptyTitle, { color: colors.text }]}>No matching records found</Text>
          <Text style={[styles.emptySub, { color: colors.textSecondary }]}>
            All return requests and cancellations are up to date.
          </Text>
        </View>
      ) : (
        <FlatList
          data={filteredOrders}
          renderItem={renderOrderCard}
          keyExtractor={(item) => item._id}
          contentContainerStyle={styles.listContent}
          onRefresh={fetchOrders}
          refreshing={loading}
        />
      )}

      {/* Action Dialog Modal */}
      <Modal visible={!!selectedOrder} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalCard, { backgroundColor: colors.card }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>Update Return Status</Text>
              <TouchableOpacity onPress={() => setSelectedOrder(null)}>
                <X size={20} color={colors.text} />
              </TouchableOpacity>
            </View>

            <Text style={[styles.modalSub, { color: colors.textSecondary }]}>
              Selected Order: #{selectedOrder?._id.slice(-8).toUpperCase()}
            </Text>

            {/* Target Status Selector */}
            <Text style={[styles.inputLabel, { color: colors.text, marginTop: 14 }]}>Target Status:</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginVertical: 8 }}>
              {[
                { id: 'return_approved', label: 'Approve Return' },
                { id: 'out_for_pickup', label: 'Out for Pickup' },
                { id: 'returning_to_seller', label: 'Returning to Hub' },
                { id: 'returned', label: 'Return Received & Refunded' },
                { id: 'return_rejected', label: 'Reject Return' },
              ].map((st) => (
                <TouchableOpacity
                  key={st.id}
                  style={[
                    styles.statusPill,
                    targetStatus === st.id
                      ? { backgroundColor: colors.primary, borderColor: colors.primary }
                      : { backgroundColor: colors.card, borderColor: colors.border },
                  ]}
                  onPress={() => setTargetStatus(st.id)}
                >
                  <Text style={{ fontSize: 12, fontWeight: '700', color: targetStatus === st.id ? '#fff' : colors.text }}>
                    {st.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            {/* Admin Note Input */}
            <Text style={[styles.inputLabel, { color: colors.text, marginTop: 10 }]}>
              Admin Message / Tracking Note:
            </Text>
            <TextInput
              style={[styles.modalInput, { color: colors.text, borderColor: colors.border, backgroundColor: isDark ? '#131122' : '#ffffff' }]}
              placeholder="e.g. Courier agent assigned for pickup on tomorrow"
              placeholderTextColor={colors.textSecondary}
              value={adminNote}
              onChangeText={setAdminNote}
              multiline
            />

            <TouchableOpacity
              style={[styles.modalSubmitBtn, { backgroundColor: colors.primary }]}
              onPress={handleUpdateReturnStatus}
              disabled={updating}
            >
              {updating ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.modalSubmitBtnText}>Confirm Status Update</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Confirm Refund Paid Modal */}
      <Modal visible={!!refundModalOrder} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalCard, { backgroundColor: colors.card }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>Confirm Refund Payment</Text>
              <TouchableOpacity onPress={() => setRefundModalOrder(null)}>
                <X size={20} color={colors.text} />
              </TouchableOpacity>
            </View>

            <Text style={[styles.modalSub, { color: colors.textSecondary }]}>
              Order #{refundModalOrder?._id.slice(-8).toUpperCase()} • Amount: ₹{refundModalOrder?.totalAmount}
            </Text>

            {/* Payout Destination Info in Modal */}
            <View style={[styles.customerBox, { backgroundColor: isDark ? 'rgba(34, 197, 94, 0.1)' : '#f0fdf4', borderColor: '#22c55e', borderWidth: 1, marginTop: 10 }]}>
              <Text style={[styles.payoutHeader, { color: isDark ? '#4ade80' : '#15803d' }]}>Payout Destination:</Text>
              {refundModalOrder?.cancellationDetails?.refundMethod === 'upi' || refundModalOrder?.returnDetails?.refundMethod === 'upi' ? (
                <Text style={{ fontSize: 13, fontWeight: '850', color: colors.text, marginTop: 3 }}>
                  UPI ID: {refundModalOrder?.cancellationDetails?.upiId || refundModalOrder?.returnDetails?.upiId}
                </Text>
              ) : (
                <View style={{ marginTop: 3 }}>
                  <Text style={{ fontSize: 12.5, fontWeight: '800', color: colors.text }}>
                    Bank: {refundModalOrder?.cancellationDetails?.bankDetails?.bankName || refundModalOrder?.returnDetails?.bankDetails?.bankName || 'Bank Transfer'}
                  </Text>
                  <Text style={{ fontSize: 11.5, color: colors.textSecondary, marginTop: 1 }}>
                    A/C: {refundModalOrder?.cancellationDetails?.bankDetails?.accountNumber || refundModalOrder?.returnDetails?.bankDetails?.accountNumber} ({refundModalOrder?.cancellationDetails?.bankDetails?.accountHolderName || refundModalOrder?.returnDetails?.bankDetails?.accountHolderName})
                  </Text>
                  <Text style={{ fontSize: 11.5, color: colors.textSecondary }}>
                    IFSC: {refundModalOrder?.cancellationDetails?.bankDetails?.ifscCode || refundModalOrder?.returnDetails?.bankDetails?.ifscCode}
                  </Text>
                </View>
              )}
            </View>

            <Text style={[styles.inputLabel, { color: colors.text, marginTop: 14 }]}>
              Payment UTR / Transaction Ref:
            </Text>
            <TextInput
              style={[styles.modalInput, { color: colors.text, borderColor: colors.border, backgroundColor: isDark ? '#131122' : '#ffffff', height: 42 }]}
              placeholder="e.g. UPI/UTR: 329182390123"
              placeholderTextColor={colors.textSecondary}
              value={refundTxnRef}
              onChangeText={setRefundTxnRef}
            />

            <Text style={[styles.inputLabel, { color: colors.text, marginTop: 10 }]}>
              Admin Confirmation Note:
            </Text>
            <TextInput
              style={[styles.modalInput, { color: colors.text, borderColor: colors.border, backgroundColor: isDark ? '#131122' : '#ffffff' }]}
              placeholder="e.g. Refund of ₹... transferred successfully"
              placeholderTextColor={colors.textSecondary}
              value={refundAdminNote}
              onChangeText={setRefundAdminNote}
              multiline
            />

            <TouchableOpacity
              style={[styles.modalSubmitBtn, { backgroundColor: '#10b981' }]}
              onPress={handleConfirmProcessRefund}
              disabled={submittingRefund}
            >
              {submittingRefund ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.modalSubmitBtnText}>Confirm Refund Paid (₹{refundModalOrder?.totalAmount})</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Full Photo Zoom Modal */}
      <Modal visible={!!previewPhoto} transparent animationType="fade">
        <View style={styles.photoModalOverlay}>
          <TouchableOpacity style={styles.photoCloseBtn} onPress={() => setPreviewPhoto(null)}>
            <X size={24} color="#ffffff" />
          </TouchableOpacity>
          {previewPhoto && (
            <Image source={{ uri: previewPhoto }} style={styles.fullPhoto} resizeMode="contain" />
          )}
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
  },
  backBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '900',
  },
  headerSub: {
    fontSize: 11,
    marginTop: 2,
  },
  refreshBtn: {
    padding: 8,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 16,
    marginTop: 12,
    marginBottom: 8,
    paddingHorizontal: 12,
    height: 42,
    borderRadius: 10,
    borderWidth: 1,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    height: '100%',
  },
  tabsWrapper: {
    marginBottom: 8,
  },
  tabsScroll: {
    paddingHorizontal: 16,
    paddingVertical: 4,
  },
  tabPill: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    marginRight: 8,
  },
  tabPillText: {
    fontSize: 12,
    fontWeight: '800',
  },
  listContent: {
    padding: 16,
    paddingBottom: 40,
  },
  card: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    marginBottom: 16,
    elevation: 2,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  orderIdText: {
    fontSize: 14,
    fontWeight: '900',
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  dateText: {
    fontSize: 11.5,
    fontWeight: '600',
  },
  badgePill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  badgePillText: {
    fontSize: 11,
    fontWeight: '800',
  },
  customerBox: {
    borderRadius: 10,
    padding: 10,
    marginBottom: 12,
  },
  customerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 2,
  },
  customerName: {
    fontSize: 13,
    fontWeight: '800',
  },
  customerSub: {
    fontSize: 12,
  },
  itemsSection: {
    borderTopWidth: 0.5,
    borderTopColor: 'rgba(0,0,0,0.06)',
    paddingTop: 8,
    marginBottom: 10,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 4,
  },
  itemThumb: {
    width: 36,
    height: 44,
    borderRadius: 6,
  },
  itemMeta: {
    flex: 1,
    marginLeft: 10,
  },
  itemTitle: {
    fontSize: 12.5,
    fontWeight: '700',
  },
  itemSub: {
    fontSize: 11,
    marginTop: 2,
  },
  itemPrice: {
    fontSize: 13,
    fontWeight: '800',
  },
  returnDetailsCard: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 12,
    marginBottom: 12,
  },
  returnHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  returnHeaderTitle: {
    fontSize: 12.5,
    fontWeight: '800',
  },
  returnReasonText: {
    fontSize: 13,
    fontStyle: 'italic',
    lineHeight: 18,
    marginBottom: 8,
  },
  proofLabel: {
    fontSize: 11.5,
    fontWeight: '700',
  },
  photoThumbWrapper: {
    marginRight: 8,
    borderRadius: 8,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.1)',
  },
  photoThumb: {
    width: 54,
    height: 64,
  },
  payoutBox: {
    borderRadius: 8,
    borderWidth: 1,
    padding: 10,
    marginTop: 10,
  },
  payoutHeader: {
    fontSize: 11.5,
    fontWeight: '800',
    marginBottom: 6,
  },
  payoutDetailRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  payoutValue: {
    fontSize: 12.5,
    fontWeight: '700',
  },
  payoutSubValue: {
    fontSize: 11.5,
    marginTop: 2,
    paddingLeft: 20,
  },
  adminCommentRow: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 0.5,
    borderTopColor: 'rgba(0,0,0,0.06)',
  },
  adminCommentLabel: {
    fontSize: 11,
    fontWeight: '700',
  },
  adminCommentText: {
    fontSize: 12,
    marginTop: 2,
  },
  cancelledBox: {
    borderRadius: 8,
    borderWidth: 1,
    padding: 10,
    marginBottom: 12,
  },
  cancelledText: {
    fontSize: 12,
    color: '#ef4444',
    flex: 1,
  },
  actionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 4,
  },
  actionBtn: {
    flex: 1,
    height: 40,
    borderRadius: 8,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 8,
  },
  actionBtnFull: {
    width: '100%',
    height: 42,
    borderRadius: 8,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 12,
  },
  actionBtnOutline: {
    width: '100%',
    height: 38,
    borderRadius: 8,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 4,
  },
  actionBtnText: {
    color: '#ffffff',
    fontSize: 12.5,
    fontWeight: '800',
  },
  actionBtnOutlineText: {
    fontSize: 12.5,
    fontWeight: '700',
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 13,
  },
  errorText: {
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 12,
  },
  retryBtn: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
    marginTop: 40,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '800',
  },
  emptySub: {
    fontSize: 13,
    textAlign: 'center',
    marginTop: 6,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    padding: 20,
  },
  modalCard: {
    borderRadius: 16,
    padding: 20,
    maxHeight: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '900',
  },
  modalSub: {
    fontSize: 12,
    marginBottom: 6,
  },
  inputLabel: {
    fontSize: 12.5,
    fontWeight: '800',
  },
  statusPill: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    borderWidth: 1,
    marginRight: 8,
  },
  modalInput: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 10,
    height: 72,
    textAlignVertical: 'top',
    fontSize: 13,
    marginVertical: 10,
  },
  modalSubmitBtn: {
    height: 44,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 6,
  },
  modalSubmitBtnText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '800',
  },
  photoModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.92)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  photoCloseBtn: {
    position: 'absolute',
    top: 50,
    right: 20,
    zIndex: 10,
    padding: 10,
  },
  fullPhoto: {
    width: width - 32,
    height: width * 1.3,
    borderRadius: 12,
  },
});
