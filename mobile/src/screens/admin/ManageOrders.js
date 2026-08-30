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
} from 'react-native';
import { useAppTheme } from '../../context/ThemeContext';
import { useAppNavigation } from '../../context/NavigationContext';
import { useToast } from '../../context/ToastContext';
import API from '../../api/api';
import {
  Package,
  Calendar,
  Edit3,
  X,
  ArrowLeft,
  Search,
  RotateCcw,
  CheckCircle2,
  Clock,
  Truck,
  XCircle,
  ExternalLink,
} from 'lucide-react-native';

const ORDER_STATUSES = [
  { id: 'placed', label: 'Placed' },
  { id: 'confirmed', label: 'Confirmed' },
  { id: 'shipped', label: 'Shipped' },
  { id: 'out_for_delivery', label: 'Out for Delivery' },
  { id: 'delivered', label: 'Delivered' },
  { id: 'return_requested', label: 'Return Requested' },
  { id: 'return_approved', label: 'Return Approved' },
  { id: 'out_for_pickup', label: 'Out for Pickup' },
  { id: 'returning_to_seller', label: 'Returning to Hub' },
  { id: 'returned', label: 'Returned & Refunded' },
  { id: 'return_rejected', label: 'Return Rejected' },
  { id: 'cancelled', label: 'Cancelled' },
];

const FILTER_TABS = [
  { id: 'all', label: 'All Orders' },
  { id: 'active', label: 'In Progress' },
  { id: 'delivered', label: 'Delivered' },
  { id: 'returns', label: 'Returns & Refunds' },
  { id: 'cancelled', label: 'Cancelled' },
];

const getImageUrl = (imagePath) => {
  if (!imagePath) return 'https://images.unsplash.com/photo-1523381210434-271e8be1f52b?auto=format&fit=crop&q=80&w=150';
  if (imagePath.startsWith('http')) return imagePath;
  return `https://debclothes-backend.onrender.com/${imagePath}`;
};

export default function ManageOrders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Status Change Dialog
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [chosenStatus, setChosenStatus] = useState('');
  const [shippingNotes, setShippingNotes] = useState('');
  const [updatingStatus, setUpdatingStatus] = useState(false);

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
      const errMsg = err.response?.data?.message || 'Failed to fetch customer orders';
      setError(errMsg);
      showToast(errMsg, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenStatusModal = (order) => {
    setSelectedOrder(order);
    setChosenStatus(order.orderStatus);
    setShippingNotes(order.shippingNotes || '');
  };

  const handleUpdateStatus = async () => {
    if (!selectedOrder) return;
    setUpdatingStatus(true);

    try {
      await API.put(`/api/orders/${selectedOrder._id}/status`, {
        status: chosenStatus,
        shippingNotes: shippingNotes || `Status updated by administrator to ${chosenStatus}`,
      });
      showToast('Order status updated successfully.', 'success');
      setSelectedOrder(null);
      fetchOrders();
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to update status.', 'error');
    } finally {
      setUpdatingStatus(false);
    }
  };

  // Filter orders
  const filteredOrders = orders.filter((o) => {
    // Tab filter
    if (activeTab === 'active' && !['placed', 'confirmed', 'shipped', 'out_for_delivery'].includes(o.orderStatus)) return false;
    if (activeTab === 'delivered' && o.orderStatus !== 'delivered') return false;
    if (activeTab === 'returns' && !o.orderStatus.startsWith('return') && o.orderStatus !== 'returned') return false;
    if (activeTab === 'cancelled' && o.orderStatus !== 'cancelled') return false;

    // Search filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const idMatch = o._id.toLowerCase().includes(q);
      const userMatch = o.user?.name?.toLowerCase().includes(q) || o.user?.email?.toLowerCase().includes(q);
      return idMatch || userMatch;
    }

    return true;
  });

  const getStatusColor = (status) => {
    switch (status) {
      case 'placed':
      case 'confirmed':
        return '#3b82f6';
      case 'shipped':
      case 'out_for_delivery':
        return '#8b5cf6';
      case 'delivered':
      case 'returned':
        return '#10b981';
      case 'return_requested':
      case 'return_approved':
      case 'out_for_pickup':
      case 'returning_to_seller':
        return '#f59e0b';
      case 'cancelled':
      case 'return_rejected':
        return '#ef4444';
      default:
        return colors.textSecondary;
    }
  };

  const renderOrderItem = ({ item }) => {
    const isReturn = item.orderStatus.startsWith('return') || item.orderStatus === 'returned';

    return (
      <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={styles.cardHeader}>
          <View style={{ flex: 1, marginRight: 8 }}>
            <Text style={[styles.orderId, { color: colors.text }]} numberOfLines={1}>
              Order #{item._id.slice(-8).toUpperCase()}
            </Text>
            <Text style={[styles.orderFullId, { color: colors.textSecondary }]}>ID: {item._id}</Text>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.orderStatus) + '18' }]}>
            <Text style={[styles.statusText, { color: getStatusColor(item.orderStatus) }]}>
              {item.orderStatus.replace(/_/g, ' ').toUpperCase()}
            </Text>
          </View>
        </View>

        {/* Customer Information */}
        <View style={[styles.customerCard, { backgroundColor: isDark ? 'rgba(255,255,255,0.03)' : '#f8f7ff' }]}>
          <Text style={[styles.customerName, { color: colors.text }]}>{item.user?.name || 'Customer'}</Text>
          <Text style={[styles.customerEmail, { color: colors.textSecondary }]}>{item.user?.email}</Text>
          {item.shippingAddress?.phone && (
            <Text style={[styles.customerPhone, { color: colors.textSecondary }]}>Phone: {item.shippingAddress.phone}</Text>
          )}
        </View>

        {/* Product items preview with images */}
        <View style={styles.itemsWrapper}>
          {item.items?.map((prodItem, idx) => {
            const imgUrl = getImageUrl(prodItem.product?.images?.[0]);
            return (
              <View key={idx} style={styles.productRow}>
                <Image source={{ uri: imgUrl }} style={styles.productThumb} />
                <View style={styles.productMeta}>
                  <Text style={[styles.productText, { color: colors.text }]} numberOfLines={1}>
                    {prodItem.product?.title || 'Catalog Item'}
                  </Text>
                  <Text style={[styles.productSubText, { color: colors.textSecondary }]}>
                    Size: {prodItem.size} | Qty: {prodItem.qty}
                  </Text>
                </View>
                <Text style={[styles.productPrice, { color: colors.text }]}>₹{prodItem.priceAtPurchase}</Text>
              </View>
            );
          })}
        </View>

        <View style={[styles.divider, { borderBottomColor: colors.border }]} />

        <View style={styles.footerRow}>
          <View style={styles.dateCol}>
            <Calendar size={14} color={colors.textSecondary} />
            <Text style={[styles.dateText, { color: colors.textSecondary }]}>
              {new Date(item.createdAt).toLocaleDateString()}
            </Text>
          </View>
          <View style={{ alignItems: 'flex-end' }}>
            <Text style={[styles.paymentStatusText, { color: item.paymentStatus === 'paid' ? '#10b981' : item.paymentStatus === 'refunded' ? '#8b5cf6' : '#f59e0b' }]}>
              Payment: {item.paymentStatus.toUpperCase()} ({item.paymentMethod || 'COD'})
            </Text>
            <Text style={[styles.totalAmount, { color: colors.primary }]}>₹{item.totalAmount}</Text>
          </View>
        </View>

        {/* Action Buttons */}
        <View style={styles.actionRow}>
          {isReturn && (
            <TouchableOpacity
              style={[styles.refundShortcutBtn, { backgroundColor: 'rgba(245, 158, 11, 0.12)', borderColor: '#f59e0b' }]}
              onPress={() => navigateTo('ADMIN_REFUNDS')}
            >
              <RotateCcw size={14} color="#f59e0b" style={{ marginRight: 4 }} />
              <Text style={styles.refundShortcutText}>View Refund Payout & Proof</Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity
            style={[styles.updateBtn, { borderColor: colors.border }]}
            onPress={() => handleOpenStatusModal(item)}
          >
            <Edit3 size={15} color={colors.text} style={{ marginRight: 6 }} />
            <Text style={[styles.updateBtnText, { color: colors.text }]}>Update Order Status</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
        <TouchableOpacity style={[styles.backBtn, { backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : '#f1f5f9' }]} onPress={goBack}>
          <ArrowLeft size={20} color={colors.text} />
        </TouchableOpacity>
        <View style={{ flex: 1, marginLeft: 12 }}>
          <Text style={[styles.headerTitle, { color: colors.text }]}>Manage Orders</Text>
          <Text style={[styles.headerSub, { color: colors.textSecondary }]}>
            {orders.length} total customer orders
          </Text>
        </View>
      </View>

      {/* Search Bar */}
      <View style={[styles.searchContainer, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <Search size={16} color={colors.textSecondary} style={{ marginRight: 8 }} />
        <TextInput
          style={[styles.searchInput, { color: colors.text }]}
          placeholder="Search by Order ID or Customer..."
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

      {/* Filter Tabs */}
      <View style={styles.tabsWrapper}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabsScroll}>
          {FILTER_TABS.map((tab) => (
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

      {loading && orders.length === 0 ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : null}

      {error ? <Text style={[styles.errorText, { color: colors.danger }]}>{error}</Text> : null}

      {!loading && filteredOrders.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Package size={48} color={colors.textSecondary} style={{ marginBottom: 12 }} />
          <Text style={[styles.emptyTitle, { color: colors.text }]}>No orders match your filter</Text>
          <Text style={[styles.emptySub, { color: colors.textSecondary }]}>
            Try changing the tab filter or search query.
          </Text>
        </View>
      ) : (
        <FlatList
          data={filteredOrders}
          renderItem={renderOrderItem}
          keyExtractor={(item) => item._id}
          contentContainerStyle={styles.listContent}
          onRefresh={fetchOrders}
          refreshing={loading}
        />
      )}

      {/* Status Picker Dialog Modal */}
      <Modal visible={!!selectedOrder} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.card }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>Select Order Status</Text>
              <TouchableOpacity onPress={() => setSelectedOrder(null)}>
                <X size={20} color={colors.text} />
              </TouchableOpacity>
            </View>

            {updatingStatus ? (
              <ActivityIndicator size="large" color={colors.primary} style={{ marginVertical: 20 }} />
            ) : (
              <ScrollView style={{ maxHeight: 420 }}>
                <View style={styles.statusOptions}>
                  {ORDER_STATUSES.map((statusObj) => (
                    <TouchableOpacity
                      key={statusObj.id}
                      style={[
                        styles.statusTab,
                        {
                          borderColor: colors.border,
                          backgroundColor: chosenStatus === statusObj.id ? colors.primary : colors.card,
                        },
                      ]}
                      onPress={() => setChosenStatus(statusObj.id)}
                    >
                      <Text
                        style={[
                          styles.statusTabText,
                          { color: chosenStatus === statusObj.id ? '#fff' : colors.text },
                        ]}
                      >
                        {statusObj.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>

                {/* Shipping Note Input */}
                <Text style={[styles.modalLabel, { color: colors.text }]}>Custom Status Message (Shipping Note):</Text>
                <TextInput
                  style={[styles.modalInput, { color: colors.text, borderColor: colors.border, backgroundColor: isDark ? '#131122' : '#ffffff' }]}
                  placeholder="e.g. Dispatched via BlueDart AWB: 12345"
                  placeholderTextColor={colors.textSecondary}
                  value={shippingNotes}
                  onChangeText={setShippingNotes}
                />

                <TouchableOpacity
                  style={[styles.modalSaveBtn, { backgroundColor: colors.primary }]}
                  onPress={handleUpdateStatus}
                >
                  <Text style={styles.modalSaveText}>Save Changes</Text>
                </TouchableOpacity>
              </ScrollView>
            )}
          </View>
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
    fontFamily: 'Outfit_900Black',
  },
  headerSub: {
    fontSize: 11,
    fontFamily: 'Outfit_400Regular',
    marginTop: 2,
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
    fontFamily: 'Outfit_500Medium',
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
    fontFamily: 'Outfit_800ExtraBold',
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
    shadowOpacity: 0.05,
    shadowRadius: 6,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  orderId: {
    fontSize: 14,
    fontFamily: 'Outfit_900Black',
  },
  orderFullId: {
    fontSize: 10,
    fontFamily: 'Outfit_400Regular',
    marginTop: 2,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  statusText: {
    fontSize: 10,
    fontFamily: 'Outfit_900Black',
  },
  customerCard: {
    borderRadius: 10,
    padding: 10,
    marginBottom: 10,
  },
  customerName: {
    fontSize: 13,
    fontFamily: 'Outfit_800ExtraBold',
  },
  customerEmail: {
    fontSize: 11.5,
    fontFamily: 'Outfit_400Regular',
    marginTop: 2,
  },
  customerPhone: {
    fontSize: 11.5,
    fontFamily: 'Outfit_400Regular',
    marginTop: 2,
  },
  itemsWrapper: {
    marginBottom: 8,
  },
  productRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 4,
  },
  productThumb: {
    width: 38,
    height: 46,
    borderRadius: 6,
  },
  productMeta: {
    flex: 1,
    marginLeft: 10,
  },
  productText: {
    fontSize: 12.5,
    fontFamily: 'Outfit_700Bold',
  },
  productSubText: {
    fontSize: 11,
    fontFamily: 'Outfit_400Regular',
    marginTop: 2,
  },
  productPrice: {
    fontSize: 13,
    fontFamily: 'Outfit_800ExtraBold',
  },
  divider: {
    borderBottomWidth: 1,
    marginVertical: 10,
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  dateCol: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dateText: {
    fontSize: 12,
    fontFamily: 'Outfit_500Medium',
    marginLeft: 6,
  },
  paymentStatusText: {
    fontSize: 10.5,
    fontFamily: 'Outfit_800ExtraBold',
    marginBottom: 2,
  },
  totalAmount: {
    fontSize: 16,
    fontFamily: 'Outfit_900Black',
  },
  actionRow: {
    gap: 8,
  },
  refundShortcutBtn: {
    height: 38,
    borderRadius: 8,
    borderWidth: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 8,
  },
  refundShortcutText: {
    fontSize: 12,
    fontFamily: 'Outfit_800ExtraBold',
    color: '#f59e0b',
  },
  updateBtn: {
    height: 40,
    borderRadius: 8,
    borderWidth: 1.5,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  updateBtnText: {
    fontSize: 13,
    fontFamily: 'Outfit_700Bold',
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    textAlign: 'center',
    marginVertical: 10,
    fontFamily: 'Outfit_700Bold',
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
    fontFamily: 'Outfit_800ExtraBold',
  },
  emptySub: {
    fontSize: 13,
    fontFamily: 'Outfit_400Regular',
    textAlign: 'center',
    marginTop: 6,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    padding: 20,
  },
  modalContent: {
    borderRadius: 16,
    padding: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 16,
    fontFamily: 'Outfit_900Black',
  },
  statusOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  statusTab: {
    width: '48%',
    height: 38,
    borderRadius: 8,
    borderWidth: 1.5,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  statusTabText: {
    fontSize: 11.5,
    fontFamily: 'Outfit_700Bold',
  },
  modalLabel: {
    fontSize: 12,
    fontFamily: 'Outfit_700Bold',
    marginTop: 10,
  },
  modalInput: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 10,
    height: 44,
    fontSize: 13,
    fontFamily: 'Outfit_500Medium',
    marginBottom: 16,
    marginTop: 8,
  },
  modalSaveBtn: {
    height: 44,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 6,
  },
  modalSaveText: {
    color: '#fff',
    fontSize: 14,
    fontFamily: 'Outfit_700Bold',
  },
});
