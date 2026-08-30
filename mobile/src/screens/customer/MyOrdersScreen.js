import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  TextInput,
  Image,
  Modal,
  ScrollView,
} from 'react-native';
import { useAppTheme } from '../../context/ThemeContext';
import { useToast } from '../../context/ToastContext';
import API, { uploadMultipartAsync } from '../../api/api';
import {
  Package,
  Calendar,
  AlertTriangle,
  XCircle,
  ArrowLeftRight,
  CheckCircle2,
  Star,
  Camera,
  Image as ImageIcon,
  ChevronRight,
  Truck,
  Clock,
  Search,
  X,
  CreditCard,
  Building2,
  Smartphone,
  ShieldCheck,
  RotateCcw,
  MapPin,
  FileText,
  HelpCircle,
  Copy,
} from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';

const getImageUrl = (imagePath) => {
  if (!imagePath) return 'https://images.unsplash.com/photo-1523381210434-271e8be1f52b?auto=format&fit=crop&q=80&w=150';
  if (imagePath.startsWith('http')) return imagePath;
  return `https://debclothes-backend.onrender.com/${imagePath}`;
};

// Helper to format dates nicely
const formatDate = (dateString, options = { month: 'short', day: 'numeric', year: 'numeric' }) => {
  if (!dateString) return '';
  try {
    return new Date(dateString).toLocaleDateString(undefined, options);
  } catch (e) {
    return '';
  }
};

// Helper to format full date with time
const formatDateTime = (dateString) => {
  if (!dateString) return '';
  try {
    return new Date(dateString).toLocaleString(undefined, {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch (e) {
    return '';
  }
};

// Helper to calculate or get expected delivery date
const getExpectedDeliveryDate = (order) => {
  if (order.deliveredAt) {
    return new Date(order.deliveredAt);
  }
  if (order.expectedDeliveryDate) {
    return new Date(order.expectedDeliveryDate);
  }
  const created = new Date(order.createdAt || Date.now());
  created.setDate(created.getDate() + 4);
  return created;
};

export default function MyOrdersScreen() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL'); // 'ALL' | 'IN_TRANSIT' | 'DELIVERED' | 'CANCELLED_RETURNED'

  // Selected Order for Full Flipkart Tracking View Modal
  const [selectedOrder, setSelectedOrder] = useState(null);

  // Return & Refund Form State
  const [returningOrder, setReturningOrder] = useState(null); // The full item/order object
  const [returnReason, setReturnReason] = useState('');
  const [selectedReasonChip, setSelectedReasonChip] = useState('');
  const [refundMethod, setRefundMethod] = useState('upi'); // 'upi' | 'bank_transfer'
  const [upiId, setUpiId] = useState('');
  const [bankAccountHolder, setBankAccountHolder] = useState('');
  const [bankName, setBankName] = useState('');
  const [bankAccountNumber, setBankAccountNumber] = useState('');
  const [bankConfirmAccount, setBankConfirmAccount] = useState('');
  const [bankIfsc, setBankIfsc] = useState('');
  const [returnPhoto, setReturnPhoto] = useState(null);
  const [submittingReturn, setSubmittingReturn] = useState(false);

  // Cancellation & Refund Form State
  const [cancellingOrder, setCancellingOrder] = useState(null);
  const [cancelReason, setCancelReason] = useState('');
  const [selectedCancelChip, setSelectedCancelChip] = useState('');
  const [cancelRefundMethod, setCancelRefundMethod] = useState('upi'); // 'upi' | 'bank_transfer'
  const [cancelUpiId, setCancelUpiId] = useState('');
  const [cancelAccountHolder, setCancelAccountHolder] = useState('');
  const [cancelBankName, setCancelBankName] = useState('');
  const [cancelAccountNumber, setCancelAccountNumber] = useState('');
  const [cancelConfirmAccount, setCancelConfirmAccount] = useState('');
  const [cancelIfsc, setCancelIfsc] = useState('');
  const [submittingCancel, setSubmittingCancel] = useState(false);

  // Review Form State
  const [reviewProduct, setReviewProduct] = useState(null);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState('');
  const [reviewPhoto, setReviewPhoto] = useState(null);
  const [submittingReview, setSubmittingReview] = useState(false);

  const { colors, isDark } = useAppTheme();
  const { showToast } = useToast();

  const returnReasonChips = [
    'Size does not fit',
    'Defective or damaged item',
    'Wrong item delivered',
    'Quality not as expected',
    'Item looks different from photos',
    'Other reason',
  ];

  const cancelReasonChips = [
    'Ordered by mistake',
    'Found a better price elsewhere',
    'Delay in estimated delivery',
    'Incorrect shipping address / details',
    'Changed mind',
    'Other reason',
  ];

  useEffect(() => {
    fetchMyOrders();
  }, []);

  const fetchMyOrders = async () => {
    setLoading(true);
    setError('');
    try {
      const { data } = await API.get('/api/orders/my');
      setOrders(data);
    } catch (err) {
      const errMsg = err.response?.data?.message || 'Failed to fetch orders';
      setError(errMsg);
      showToast(errMsg, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenReviewModal = (product) => {
    setReviewProduct(product);
    setReviewRating(5);
    setReviewComment('');
    setReviewPhoto(null);
  };

  const handleOpenReturnModal = (item) => {
    setReturningOrder(item);
    setReturnReason('');
    setSelectedReasonChip('');
    setRefundMethod('upi');
    setUpiId('');
    setBankAccountHolder('');
    setBankName('');
    setBankAccountNumber('');
    setBankConfirmAccount('');
    setBankIfsc('');
    setReturnPhoto(null);
  };

  const handleCloseReturnModal = () => {
    setReturningOrder(null);
    setReturnReason('');
    setSelectedReasonChip('');
    setReturnPhoto(null);
  };

  const handleReturnSelectGallery = async () => {
    try {
      if (Platform.OS === 'ios') {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
          showToast('Permission to access gallery is required.', 'warning');
          return;
        }
      }
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: false,
        quality: 0.8,
      });
      if (!result.canceled && result.assets && result.assets.length > 0) {
        setReturnPhoto(result.assets[0].uri);
        showToast('Proof photo attached successfully!', 'success');
      }
    } catch (err) {
      console.error('Return gallery error:', err);
      showToast('Could not open gallery: ' + (err.message || 'Error'), 'error');
    }
  };

  const handleReturnTakePhoto = async () => {
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        showToast('Permission to access camera is required.', 'warning');
        return;
      }
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: false,
        quality: 0.8,
      });
      if (!result.canceled && result.assets && result.assets.length > 0) {
        setReturnPhoto(result.assets[0].uri);
        showToast('Proof photo captured successfully!', 'success');
      }
    } catch (err) {
      console.error('Return camera error:', err);
      showToast('Could not open camera: ' + (err.message || 'Error'), 'error');
    }
  };

  const handleReviewSelectGallery = async () => {
    try {
      if (Platform.OS === 'ios') {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
          showToast('Permission to access gallery is required.', 'warning');
          return;
        }
      }
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: false,
        quality: 0.8,
      });
      if (!result.canceled && result.assets && result.assets.length > 0) {
        setReviewPhoto(result.assets[0].uri);
        showToast('Photo attached to review!', 'success');
      }
    } catch (err) {
      console.error('Review gallery error:', err);
      showToast('Could not open gallery: ' + (err.message || 'Error'), 'error');
    }
  };

  const handleReviewTakePhoto = async () => {
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        showToast('Permission to access camera is required.', 'warning');
        return;
      }
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: false,
        quality: 0.8,
      });
      if (!result.canceled && result.assets && result.assets.length > 0) {
        setReviewPhoto(result.assets[0].uri);
        showToast('Photo captured!', 'success');
      }
    } catch (err) {
      console.error('Review camera error:', err);
      showToast('Could not open camera: ' + (err.message || 'Error'), 'error');
    }
  };

  const handleSubmitReview = async () => {
    if (!reviewComment.trim()) {
      showToast('Please write some review feedback.', 'warning');
      return;
    }

    setSubmittingReview(true);
    const formData = new FormData();
    formData.append('rating', reviewRating.toString());
    formData.append('comment', reviewComment.trim());

    if (reviewPhoto) {
      const rawFilename = reviewPhoto.split('/').pop() || `review_${Date.now()}.jpg`;
      const match = /\.(\w+)$/.exec(rawFilename);
      const ext = match ? match[1].toLowerCase() : 'jpg';
      const type = ext === 'png' ? 'image/png' : ext === 'webp' ? 'image/webp' : 'image/jpeg';
      const cleanFilename = rawFilename.includes('.') ? rawFilename : `${rawFilename}.${ext}`;
      formData.append('images', {
        uri: reviewPhoto,
        name: cleanFilename,
        type: type,
      });
    }

    try {
      await uploadMultipartAsync(`/api/products/${reviewProduct._id}/reviews`, formData, 'POST');
      showToast('Review submitted successfully!', 'success');
      setReviewProduct(null);
      setReviewComment('');
      setReviewRating(5);
      setReviewPhoto(null);
      fetchMyOrders();
    } catch (err) {
      showToast(err.response?.data?.message || err.message || 'Failed to submit review.', 'error');
    } finally {
      setSubmittingReview(false);
    }
  };

  const handleOpenCancelModal = (item) => {
    setCancellingOrder(item);
    setCancelReason('');
    setSelectedCancelChip('');
    setCancelRefundMethod('upi');
    setCancelUpiId('');
    setCancelAccountHolder('');
    setCancelBankName('');
    setCancelAccountNumber('');
    setCancelConfirmAccount('');
    setCancelIfsc('');
  };

  const handleCloseCancelModal = () => {
    setCancellingOrder(null);
    setCancelReason('');
    setSelectedCancelChip('');
    setCancelUpiId('');
    setCancelAccountHolder('');
    setCancelBankName('');
    setCancelAccountNumber('');
    setCancelConfirmAccount('');
    setCancelIfsc('');
  };

  const handleSubmitCancelOrder = async () => {
    if (!cancellingOrder) return;
    const isOnlinePaid = cancellingOrder.paymentStatus === 'paid' || cancellingOrder.paymentMethod === 'ONLINE';

    const finalReason = selectedCancelChip
      ? `${selectedCancelChip}${cancelReason.trim() ? ': ' + cancelReason.trim() : ''}`
      : cancelReason.trim();

    if (isOnlinePaid) {
      if (cancelRefundMethod === 'upi') {
        if (!cancelUpiId.trim() || !cancelUpiId.includes('@')) {
          showToast('Please enter a valid UPI ID (e.g. yourname@oksbi / 9876543210@paytm)', 'warning');
          return;
        }
      } else {
        if (!cancelAccountHolder.trim()) {
          showToast('Please enter the Account Holder Name', 'warning');
          return;
        }
        if (!cancelBankName.trim()) {
          showToast('Please enter the Bank Name', 'warning');
          return;
        }
        if (!cancelAccountNumber.trim() || cancelAccountNumber.trim().length < 6) {
          showToast('Please enter a valid Bank Account Number', 'warning');
          return;
        }
        if (cancelAccountNumber.trim() !== cancelConfirmAccount.trim()) {
          showToast('Account Number and Confirm Account Number do not match', 'warning');
          return;
        }
        if (!cancelIfsc.trim() || cancelIfsc.trim().length < 6) {
          showToast('Please enter a valid IFSC Code (e.g. SBIN0001234)', 'warning');
          return;
        }
      }
    }

    setSubmittingCancel(true);
    try {
      const payload = {
        reason: finalReason || 'Order cancelled by customer before shipment',
        refundMethod: isOnlinePaid ? cancelRefundMethod : 'none',
        upiId: cancelRefundMethod === 'upi' ? cancelUpiId.trim() : '',
        accountHolderName: cancelAccountHolder.trim(),
        bankName: cancelBankName.trim(),
        accountNumber: cancelAccountNumber.trim(),
        ifscCode: cancelIfsc.trim().toUpperCase(),
      };

      const { data } = await API.put(`/api/orders/${cancellingOrder.orderId}/cancel`, payload);
      showToast(data.message || 'Order cancelled successfully.', 'success');
      handleCloseCancelModal();
      if (selectedOrder && selectedOrder.orderId === cancellingOrder.orderId) {
        setSelectedOrder(null);
      }
      fetchMyOrders();
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to cancel order.', 'error');
    } finally {
      setSubmittingCancel(false);
    }
  };

  const handleSubmitReturnWithRefund = async () => {
    const finalReason = selectedReasonChip
      ? `${selectedReasonChip}${returnReason.trim() ? ': ' + returnReason.trim() : ''}`
      : returnReason.trim();

    if (!finalReason) {
      showToast('Please select or enter the reason for return.', 'warning');
      return;
    }

    if (!returnPhoto) {
      showToast('Please attach a photo of the product as proof for return.', 'warning');
      return;
    }

    // Validate Refund Details
    if (refundMethod === 'upi') {
      if (!upiId.trim() || !upiId.includes('@')) {
        showToast('Please enter a valid UPI ID (e.g. mobile@upi / name@oksbi)', 'warning');
        return;
      }
    } else {
      if (!bankAccountHolder.trim()) {
        showToast('Please enter the Account Holder Name', 'warning');
        return;
      }
      if (!bankName.trim()) {
        showToast('Please enter the Bank Name', 'warning');
        return;
      }
      if (!bankAccountNumber.trim() || bankAccountNumber.trim().length < 6) {
        showToast('Please enter a valid Bank Account Number', 'warning');
        return;
      }
      if (bankAccountNumber.trim() !== bankConfirmAccount.trim()) {
        showToast('Account Number and Confirm Account Number do not match', 'warning');
        return;
      }
      if (!bankIfsc.trim() || bankIfsc.trim().length < 6) {
        showToast('Please enter a valid IFSC Code (e.g. SBIN0001234)', 'warning');
        return;
      }
    }

    setSubmittingReturn(true);
    try {
      const formData = new FormData();
      formData.append('reason', finalReason);
      formData.append('refundMethod', refundMethod);

      if (refundMethod === 'upi') {
        formData.append('upiId', upiId.trim());
      } else {
        formData.append('accountHolderName', bankAccountHolder.trim());
        formData.append('bankName', bankName.trim());
        formData.append('accountNumber', bankAccountNumber.trim());
        formData.append('ifscCode', bankIfsc.trim().toUpperCase());
      }

      const rawFilename = returnPhoto.split('/').pop() || `return_${Date.now()}.jpg`;
      const match = /\.(\w+)$/.exec(rawFilename);
      const ext = match ? match[1].toLowerCase() : 'jpg';
      const type = ext === 'png' ? 'image/png' : ext === 'webp' ? 'image/webp' : 'image/jpeg';
      const cleanFilename = rawFilename.includes('.') ? rawFilename : `${rawFilename}.${ext}`;

      formData.append('images', {
        uri: returnPhoto,
        name: cleanFilename,
        type: type,
      });

      await uploadMultipartAsync(`/api/orders/${returningOrder.orderId}/return`, formData, 'POST');

      showToast('Return request with refund details submitted successfully!', 'success');
      handleCloseReturnModal();
      if (selectedOrder && selectedOrder.orderId === returningOrder.orderId) {
        setSelectedOrder(null);
      }
      fetchMyOrders();
    } catch (err) {
      showToast(err.response?.data?.message || err.message || 'Failed to submit return request.', 'error');
    } finally {
      setSubmittingReturn(false);
    }
  };

  // Flatten orders for clean Flipkart card view
  const flattenedItems = [];
  orders.forEach((order) => {
    const expectedDelivery = getExpectedDeliveryDate(order);
    order.items.forEach((prodItem) => {
      flattenedItems.push({
        ...prodItem,
        orderId: order._id,
        orderStatus: order.orderStatus,
        paymentStatus: order.paymentStatus,
        paymentMethod: order.paymentMethod,
        createdAt: order.createdAt,
        deliveredAt: order.deliveredAt,
        expectedDeliveryDate: expectedDelivery,
        shippingAddress: order.shippingAddress,
        returnDetails: order.returnDetails,
        cancellationDetails: order.cancellationDetails,
        statusHistory: order.statusHistory || [],
        shippingNotes: order.shippingNotes,
        totalAmount: order.totalAmount,
      });
    });
  });

  // Filter flattened items based on search query and status filter
  const filteredItems = flattenedItems.filter((item) => {
    // Status tab filter
    if (statusFilter === 'REFUND_PENDING') {
      const isPending = item.paymentStatus === 'refund_pending' || ['return_requested', 'return_approved', 'out_for_pickup', 'returning_to_seller'].includes(item.orderStatus);
      if (!isPending) return false;
    } else if (statusFilter === 'IN_TRANSIT') {
      if (!['placed', 'confirmed', 'shipped', 'out_for_delivery'].includes(item.orderStatus)) return false;
    } else if (statusFilter === 'DELIVERED') {
      if (item.orderStatus !== 'delivered') return false;
    } else if (statusFilter === 'CANCELLED_RETURNED') {
      if (!['cancelled', 'return_requested', 'return_approved', 'out_for_pickup', 'returning_to_seller', 'returned', 'return_rejected'].includes(item.orderStatus)) return false;
    }

    // Search Query filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const titleMatch = item.product?.title?.toLowerCase().includes(q);
      const idMatch = item.orderId?.toLowerCase().includes(q);
      return titleMatch || idMatch;
    }
    return true;
  });

  // Render a Flipkart-Style Order Card
  const renderFlipkartOrderCard = ({ item }) => {
    const isCancellable = ['placed', 'confirmed'].includes(item.orderStatus);
    const isReturnable = item.orderStatus === 'delivered';
    const isDelivered = item.orderStatus === 'delivered';
    const isCancelled = item.orderStatus === 'cancelled';
    const isReturned = ['return_requested', 'return_approved', 'out_for_pickup', 'returning_to_seller', 'returned'].includes(item.orderStatus);

    let statusDotColor = '#10b981'; // green
    let statusHeading = '';
    let statusSubtext = '';

    if (isDelivered) {
      statusDotColor = '#10b981';
      statusHeading = `Delivered on ${formatDate(item.deliveredAt || item.createdAt)}`;
      statusSubtext = 'Your item has been delivered';
    } else if (isCancelled) {
      if (item.paymentStatus === 'refund_pending') {
        statusDotColor = '#f59e0b';
        statusHeading = 'Cancelled • Refund Pending';
        statusSubtext = `Refund of ₹${item.totalAmount} pending seller payout`;
      } else if (item.paymentStatus === 'refunded') {
        statusDotColor = '#10b981';
        statusHeading = 'Cancelled & Refunded';
        statusSubtext = `Refund of ₹${item.totalAmount} has been credited`;
      } else {
        statusDotColor = '#ef4444';
        statusHeading = `Cancelled on ${formatDate(item.createdAt)}`;
        statusSubtext = 'Order cancelled';
      }
    } else if (isReturned) {
      statusDotColor = '#3b82f6';
      if (item.orderStatus === 'returned') {
        statusHeading = 'Return Completed & Refunded';
        statusSubtext = 'Refund credited to your submitted bank/UPI';
      } else {
        statusHeading = 'Return in Progress';
        statusSubtext = 'Refund will be credited upon pickup';
      }
    } else {
      // In transit
      statusDotColor = '#f59e0b'; // amber
      statusHeading = `Arriving by ${formatDate(item.expectedDeliveryDate, { weekday: 'short', month: 'short', day: 'numeric' })}`;
      if (item.orderStatus === 'out_for_delivery') {
        statusSubtext = 'Out for delivery today';
      } else if (item.orderStatus === 'shipped') {
        statusSubtext = 'Shipped from warehouse';
      } else {
        statusSubtext = 'Order confirmed & packed';
      }
    }

    return (
      <View style={[styles.flipkartCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        {/* Flipkart Status Header Line */}
        <TouchableOpacity
          style={styles.cardHeaderPress}
          onPress={() => setSelectedOrder(item)}
          activeOpacity={0.7}
        >
          <View style={styles.cardStatusRow}>
            <View style={[styles.statusDot, { backgroundColor: statusDotColor }]} />
            <View style={{ flex: 1 }}>
              <Text style={[styles.statusHeadingText, { color: isDark ? '#f8fafc' : '#0f172a' }]}>
                {statusHeading}
              </Text>
              <Text style={[styles.statusSubText, { color: colors.textSecondary }]}>
                {statusSubtext}
              </Text>
            </View>
            <ChevronRight size={18} color={colors.textSecondary} />
          </View>

          {/* Product Body Row */}
          <View style={styles.cardBodyRow}>
            <Image
              source={{ uri: getImageUrl(item.product?.images?.[0]) }}
              style={[styles.productImage, { borderColor: colors.border }]}
            />
            <View style={styles.productInfoCol}>
              <Text style={[styles.productTitle, { color: colors.text }]} numberOfLines={2}>
                {item.product?.title || 'Garment Product'}
              </Text>
              <View style={styles.productMetaRow}>
                <Text style={[styles.productMetaText, { color: colors.textSecondary }]}>
                  Size: <Text style={{ fontFamily: 'Outfit_700Bold', color: colors.text }}>{item.size}</Text>
                </Text>
                <Text style={[styles.productMetaText, { color: colors.textSecondary, marginLeft: 12 }]}>
                  Qty: <Text style={{ fontFamily: 'Outfit_700Bold', color: colors.text }}>{item.qty}</Text>
                </Text>
              </View>
              <View style={styles.priceRow}>
                <Text style={[styles.priceText, { color: colors.text }]}>
                  ₹{item.priceAtPurchase}
                </Text>
                <View style={styles.assuredBadge}>
                  <ShieldCheck size={11} color="#2563eb" style={{ marginRight: 3 }} />
                  <Text style={styles.assuredBadgeText}>Assured</Text>
                </View>
              </View>
            </View>
          </View>
        </TouchableOpacity>

        {/* Refund Pending Information Section */}
        {item.paymentStatus === 'refund_pending' && (
          <View style={[styles.refundPendingCardBox, { backgroundColor: isDark ? 'rgba(245, 158, 11, 0.08)' : '#fffbeb', borderColor: isDark ? 'rgba(245, 158, 11, 0.3)' : '#fde68a' }]}>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Clock size={14} color="#d97706" style={{ marginRight: 6 }} />
                <Text style={[styles.refundPendingCardTitle, { color: isDark ? '#fbbf24' : '#b45309' }]}>
                  Refund Pending: ₹{item.totalAmount || item.priceAtPurchase}
                </Text>
              </View>
              <View style={styles.refundPendingStatusBadge}>
                <Text style={styles.refundPendingStatusText}>Processing</Text>
              </View>
            </View>

            {item.cancellationDetails?.reason ? (
              <Text style={[styles.refundPendingDesc, { color: isDark ? '#cbd5e1' : '#78350f' }]}>
                Reason: <Text style={{ fontFamily: 'Outfit_700Bold' }}>{item.cancellationDetails.reason}</Text>
              </Text>
            ) : item.returnDetails?.reason ? (
              <Text style={[styles.refundPendingDesc, { color: isDark ? '#cbd5e1' : '#78350f' }]}>
                Return Reason: <Text style={{ fontFamily: 'Outfit_700Bold' }}>{item.returnDetails.reason}</Text>
              </Text>
            ) : null}

            {/* Payout Destination */}
            {(item.cancellationDetails?.refundMethod === 'upi' || item.returnDetails?.refundMethod === 'upi') ? (
              <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 4 }}>
                <Smartphone size={13} color="#d97706" style={{ marginRight: 5 }} />
                <Text style={[styles.refundPendingDestText, { color: isDark ? '#f1f5f9' : '#451a03' }]}>
                  Destination: <Text style={{ fontFamily: 'Outfit_800ExtraBold' }}>UPI ({item.cancellationDetails?.upiId || item.returnDetails?.upiId})</Text>
                </Text>
              </View>
            ) : (item.cancellationDetails?.bankDetails?.accountNumber || item.returnDetails?.bankDetails?.accountNumber) ? (
              <View style={{ marginTop: 4 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <Building2 size={13} color="#d97706" style={{ marginRight: 5 }} />
                  <Text style={[styles.refundPendingDestText, { color: isDark ? '#f1f5f9' : '#451a03' }]}>
                    Bank: <Text style={{ fontFamily: 'Outfit_800ExtraBold' }}>{item.cancellationDetails?.bankDetails?.bankName || item.returnDetails?.bankDetails?.bankName || 'Bank Transfer'}</Text>
                  </Text>
                </View>
                <Text style={[styles.refundPendingSubText, { color: isDark ? '#94a3b8' : '#92400e' }]}>
                  A/C: ****{(item.cancellationDetails?.bankDetails?.accountNumber || item.returnDetails?.bankDetails?.accountNumber)?.slice(-4)} | IFSC: {item.cancellationDetails?.bankDetails?.ifscCode || item.returnDetails?.bankDetails?.ifscCode}
                </Text>
              </View>
            ) : null}

            <Text style={[styles.refundPendingEta, { color: isDark ? '#94a3b8' : '#b45309' }]}>
              ℹ️ Seller is processing this refund. Transfer will be credited to this destination within 24-48 business hours.
            </Text>
          </View>
        )}

        {/* Flipkart Rating & Action Section */}
        {isDelivered && item.product && (
          <View style={[styles.ratingPromptRow, { borderTopColor: colors.border }]}>
            <Text style={[styles.ratingPromptLabel, { color: colors.textSecondary }]}>Rate this product:</Text>
            <View style={styles.starsPromptRow}>
              {[1, 2, 3, 4, 5].map((star) => (
                <TouchableOpacity
                  key={star}
                  onPress={() => {
                    setReviewProduct(item.product);
                    setReviewRating(star);
                    setReviewComment('');
                    setReviewPhoto(null);
                  }}
                  style={{ paddingHorizontal: 3 }}
                >
                  <Star size={20} color="#fbbf24" fill="#fbbf24" />
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {/* Card Action Buttons Footer */}
        <View style={[styles.cardFooterActions, { borderTopColor: colors.border }]}>
          {isCancellable && (
            <TouchableOpacity
              style={[styles.quickActionBtn, { borderColor: '#ef4444' }]}
              onPress={() => handleOpenCancelModal(item)}
            >
              <X size={14} color="#ef4444" style={{ marginRight: 4 }} />
              <Text style={[styles.quickActionText, { color: '#ef4444' }]}>Cancel Order</Text>
            </TouchableOpacity>
          )}

          {isReturnable && (
            <TouchableOpacity
              style={[styles.quickActionBtn, { borderColor: colors.primary }]}
              onPress={() => handleOpenReturnModal(item)}
            >
              <RotateCcw size={14} color={colors.primary} style={{ marginRight: 4 }} />
              <Text style={[styles.quickActionText, { color: colors.primary }]}>Return & Refund</Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity
            style={[styles.quickActionBtn, { borderColor: colors.border }]}
            onPress={() => setSelectedOrder(item)}
          >
            <Truck size={14} color={colors.primary} style={{ marginRight: 4 }} />
            <Text style={[styles.quickActionText, { color: colors.text }]}>Track Order</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  // Helper for Order Tracking step progression
  const renderTrackingSteps = (order) => {
    const status = order.orderStatus;
    const isReturnFlow = ['return_requested', 'return_approved', 'out_for_pickup', 'returning_to_seller', 'returned'].includes(status);

    if (status === 'cancelled') {
      const isRefundPending = order.paymentStatus === 'refund_pending';
      const isRefunded = order.paymentStatus === 'refunded';

      return (
        <View style={styles.trackingTimelineWrapper}>
          <View style={styles.stepItemRow}>
            <View style={styles.stepIconCol}>
              <View style={[styles.stepDot, { backgroundColor: '#10b981' }]}>
                <CheckCircle2 size={16} color="#fff" />
              </View>
              <View style={[styles.stepLine, { backgroundColor: '#ef4444' }]} />
            </View>
            <View style={styles.stepContentCol}>
              <Text style={[styles.stepTitle, { color: colors.text }]}>Order Placed</Text>
              <Text style={[styles.stepSub, { color: colors.textSecondary }]}>
                {formatDateTime(order.createdAt)}
              </Text>
            </View>
          </View>

          <View style={styles.stepItemRow}>
            <View style={styles.stepIconCol}>
              <View style={[styles.stepDot, { backgroundColor: '#ef4444' }]}>
                <X size={16} color="#fff" />
              </View>
              {(isRefundPending || isRefunded) && (
                <View style={[styles.stepLine, { backgroundColor: isRefunded ? '#10b981' : '#f59e0b' }]} />
              )}
            </View>
            <View style={styles.stepContentCol}>
              <Text style={[styles.stepTitle, { color: '#ef4444' }]}>Order Cancelled</Text>
              <Text style={[styles.stepSub, { color: colors.textSecondary }]}>
                {order.cancellationDetails?.reason || 'Cancelled by customer'}
              </Text>
            </View>
          </View>

          {(isRefundPending || isRefunded) && (
            <View style={styles.stepItemRow}>
              <View style={styles.stepIconCol}>
                <View style={[styles.stepDot, { backgroundColor: isRefunded ? '#10b981' : '#f59e0b' }]}>
                  {isRefunded ? <CheckCircle2 size={16} color="#fff" /> : <Clock size={14} color="#fff" />}
                </View>
              </View>
              <View style={styles.stepContentCol}>
                <Text style={[styles.stepTitle, { color: isRefunded ? '#10b981' : '#f59e0b' }]}>
                  {isRefunded ? 'Refund Paid & Completed' : 'Refund Processing Pending'}
                </Text>
                <Text style={[styles.stepSub, { color: colors.textSecondary }]}>
                  {isRefunded
                    ? `Refund of ₹${order.totalAmount} transferred to your submitted details.${order.cancellationDetails?.adminComment ? ' (' + order.cancellationDetails.adminComment + ')' : ''}`
                    : `Seller is processing your refund of ₹${order.totalAmount} to your submitted ${order.cancellationDetails?.refundMethod === 'bank_transfer' ? 'Bank Account' : 'UPI ID'}.`}
                </Text>
              </View>
            </View>
          )}
        </View>
      );
    }

    if (isReturnFlow) {
      const isReturnApproved = ['return_approved', 'out_for_pickup', 'returning_to_seller', 'returned'].includes(status);
      const isOutForPickup = ['out_for_pickup', 'returning_to_seller', 'returned'].includes(status);
      const isCompleted = status === 'returned';

      return (
        <View style={styles.trackingTimelineWrapper}>
          {/* Step 1: Delivered */}
          <View style={styles.stepItemRow}>
            <View style={styles.stepIconCol}>
              <View style={[styles.stepDot, { backgroundColor: '#10b981' }]}>
                <CheckCircle2 size={16} color="#fff" />
              </View>
              <View style={[styles.stepLine, { backgroundColor: '#10b981' }]} />
            </View>
            <View style={styles.stepContentCol}>
              <Text style={[styles.stepTitle, { color: colors.text }]}>Product Delivered</Text>
              <Text style={[styles.stepSub, { color: colors.textSecondary }]}>
                {formatDate(order.deliveredAt || order.createdAt)}
              </Text>
            </View>
          </View>

          {/* Step 2: Return Requested */}
          <View style={styles.stepItemRow}>
            <View style={styles.stepIconCol}>
              <View style={[styles.stepDot, { backgroundColor: '#10b981' }]}>
                <CheckCircle2 size={16} color="#fff" />
              </View>
              <View style={[styles.stepLine, { backgroundColor: isReturnApproved ? '#10b981' : colors.border }]} />
            </View>
            <View style={styles.stepContentCol}>
              <Text style={[styles.stepTitle, { color: colors.text }]}>Return & Refund Requested</Text>
              <Text style={[styles.stepSub, { color: colors.textSecondary }]}>
                Reason: {order.returnDetails?.reason || 'Customer request'}
              </Text>
            </View>
          </View>

          {/* Step 3: Out for Pickup */}
          <View style={styles.stepItemRow}>
            <View style={styles.stepIconCol}>
              <View style={[styles.stepDot, { backgroundColor: isOutForPickup ? '#10b981' : isReturnApproved ? '#f59e0b' : colors.border }]}>
                <Truck size={14} color="#fff" />
              </View>
              <View style={[styles.stepLine, { backgroundColor: isCompleted ? '#10b981' : colors.border }]} />
            </View>
            <View style={styles.stepContentCol}>
              <Text style={[styles.stepTitle, { color: isReturnApproved ? colors.text : colors.textSecondary }]}>
                Pickup by Courier Executive
              </Text>
              <Text style={[styles.stepSub, { color: colors.textSecondary }]}>
                {isOutForPickup ? 'Courier is arriving for pickup' : isReturnApproved ? 'Return approved, awaiting pickup assignment' : 'Pending verification'}
              </Text>
            </View>
          </View>

          {/* Step 4: Refund Credited */}
          <View style={styles.stepItemRow}>
            <View style={styles.stepIconCol}>
              <View style={[styles.stepDot, { backgroundColor: isCompleted ? '#10b981' : colors.border }]}>
                <CreditCard size={14} color="#fff" />
              </View>
            </View>
            <View style={styles.stepContentCol}>
              <Text style={[styles.stepTitle, { color: isCompleted ? '#10b981' : colors.textSecondary }]}>
                {isCompleted ? 'Refund Credited' : 'Refund in Process'}
              </Text>
              <Text style={[styles.stepSub, { color: colors.textSecondary }]}>
                Refund of ₹{order.totalAmount} will be transferred to your specified Bank/UPI.
              </Text>
            </View>
          </View>
        </View>
      );
    }

    // Standard Delivery Flow
    const isConfirmed = ['placed', 'confirmed', 'shipped', 'out_for_delivery', 'delivered'].includes(status);
    const isShipped = ['shipped', 'out_for_delivery', 'delivered'].includes(status);
    const isOutForDelivery = ['out_for_delivery', 'delivered'].includes(status);
    const isDelivered = status === 'delivered';

    return (
      <View style={styles.trackingTimelineWrapper}>
        {/* Step 1: Order Placed / Confirmed */}
        <View style={styles.stepItemRow}>
          <View style={styles.stepIconCol}>
            <View style={[styles.stepDot, { backgroundColor: '#10b981' }]}>
              <CheckCircle2 size={16} color="#fff" />
            </View>
            <View style={[styles.stepLine, { backgroundColor: isShipped ? '#10b981' : colors.border }]} />
          </View>
          <View style={styles.stepContentCol}>
            <Text style={[styles.stepTitle, { color: colors.text }]}>Order Confirmed</Text>
            <Text style={[styles.stepSub, { color: colors.textSecondary }]}>
              {formatDateTime(order.createdAt)} • Order received and verified
            </Text>
          </View>
        </View>

        {/* Step 2: Shipped */}
        <View style={styles.stepItemRow}>
          <View style={styles.stepIconCol}>
            <View style={[styles.stepDot, { backgroundColor: isShipped ? '#10b981' : colors.border }]}>
              {isShipped ? <CheckCircle2 size={16} color="#fff" /> : <Package size={14} color="#fff" />}
            </View>
            <View style={[styles.stepLine, { backgroundColor: isOutForDelivery ? '#10b981' : colors.border }]} />
          </View>
          <View style={styles.stepContentCol}>
            <Text style={[styles.stepTitle, { color: isShipped ? colors.text : colors.textSecondary }]}>
              Shipped from Hub
            </Text>
            <Text style={[styles.stepSub, { color: colors.textSecondary }]}>
              {isShipped
                ? 'Item packed and handed over to logistics partner'
                : 'Expected to ship within 24 hours'}
            </Text>
          </View>
        </View>

        {/* Step 3: Out for Delivery */}
        <View style={styles.stepItemRow}>
          <View style={styles.stepIconCol}>
            <View style={[styles.stepDot, { backgroundColor: isOutForDelivery ? '#10b981' : colors.border }]}>
              {isOutForDelivery ? <CheckCircle2 size={16} color="#fff" /> : <Truck size={14} color="#fff" />}
            </View>
            <View style={[styles.stepLine, { backgroundColor: isDelivered ? '#10b981' : colors.border }]} />
          </View>
          <View style={styles.stepContentCol}>
            <Text style={[styles.stepTitle, { color: isOutForDelivery ? colors.text : colors.textSecondary }]}>
              Out for Delivery
            </Text>
            <Text style={[styles.stepSub, { color: colors.textSecondary }]}>
              {isOutForDelivery
                ? 'Courier partner is delivering your package today'
                : 'Arriving soon at your nearest delivery hub'}
            </Text>
          </View>
        </View>

        {/* Step 4: Delivered */}
        <View style={styles.stepItemRow}>
          <View style={styles.stepIconCol}>
            <View style={[styles.stepDot, { backgroundColor: isDelivered ? '#10b981' : colors.border }]}>
              {isDelivered ? <CheckCircle2 size={16} color="#fff" /> : <Clock size={14} color="#fff" />}
            </View>
          </View>
          <View style={styles.stepContentCol}>
            <Text style={[styles.stepTitle, { color: isDelivered ? '#10b981' : colors.textSecondary }]}>
              {isDelivered ? 'Delivered' : `Expected by ${formatDate(order.expectedDeliveryDate, { weekday: 'short', month: 'short', day: 'numeric' })}`}
            </Text>
            <Text style={[styles.stepSub, { color: colors.textSecondary }]}>
              {isDelivered
                ? `Delivered on ${formatDateTime(order.deliveredAt || order.createdAt)}`
                : 'Item will be delivered to your shipping address'}
            </Text>
          </View>
        </View>
      </View>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Luxury Orders Header */}
      <View style={[styles.topHeader, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
        <View style={styles.topHeaderTitleRow}>
          <Text style={[styles.topHeaderTitle, { color: colors.text }]}>My Orders</Text>
          <View style={[styles.orderCountBadge, { backgroundColor: isDark ? 'rgba(124, 58, 237, 0.2)' : '#ede9fe' }]}>
            <Text style={[styles.orderCountText, { color: colors.primary }]}>{flattenedItems.length} items</Text>
          </View>
        </View>

        {/* Search in orders bar */}
        <View style={[styles.searchBar, { backgroundColor: isDark ? '#1a162b' : '#f5f3ff', borderColor: colors.border }]}>
          <Search size={16} color={colors.primary} style={{ marginRight: 8 }} />
          <TextInput
            style={[styles.searchInput, { color: colors.text }]}
            placeholder="Search by product name or order ID..."
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

        {/* Filter Pills */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterPillsScroll}>
          {[
            { key: 'ALL', label: 'All Orders' },
            { key: 'REFUND_PENDING', label: 'Refund Pending' },
            { key: 'IN_TRANSIT', label: 'On The Way' },
            { key: 'DELIVERED', label: 'Delivered' },
            { key: 'CANCELLED_RETURNED', label: 'Cancelled & Returns' },
          ].map((pill) => {
            const active = statusFilter === pill.key;
            return (
              <TouchableOpacity
                key={pill.key}
                style={[
                  styles.filterPillBtn,
                  active
                    ? { backgroundColor: colors.primary, borderColor: colors.primary }
                    : { backgroundColor: isDark ? '#161328' : '#ffffff', borderColor: colors.border },
                ]}
                onPress={() => setStatusFilter(pill.key)}
              >
                <Text
                  style={[
                    styles.filterPillText,
                    { color: active ? '#ffffff' : colors.textSecondary, fontFamily: active ? 'Outfit_800ExtraBold' : 'Outfit_600SemiBold' },
                  ]}
                >
                  {pill.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* Main Order List */}
      {loading && orders.length === 0 ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.loadingText, { color: colors.textSecondary }]}>Loading your orders...</Text>
        </View>
      ) : null}

      {error ? <Text style={[styles.errorText, { color: colors.danger }]}>{error}</Text> : null}

      {!loading && filteredItems.length === 0 ? (
        <View style={styles.center}>
          <Package size={56} color={colors.textSecondary} style={{ marginBottom: 14, opacity: 0.7 }} />
          <Text style={[styles.emptyTitle, { color: colors.text }]}>No Orders Found</Text>
          <Text style={[styles.emptySubtitle, { color: colors.textSecondary }]}>
            {searchQuery ? 'No orders match your search criteria.' : 'You haven’t placed any orders yet.'}
          </Text>
        </View>
      ) : (
        <FlatList
          data={filteredItems}
          renderItem={renderFlipkartOrderCard}
          keyExtractor={(item, index) => `${item.orderId}-${item.product?._id || index}-${index}`}
          contentContainerStyle={styles.listContent}
          onRefresh={fetchMyOrders}
          refreshing={loading}
        />
      )}

      {/* ========================================================================= */}
      {/* FULL FLIPKART ORDER DETAILS & LIVE TRACKING MODAL ("CURRENT SITUATION") */}
      {/* ========================================================================= */}
      <Modal visible={!!selectedOrder} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={[styles.detailModalCard, { backgroundColor: colors.card }]}>
            {/* Modal Header */}
            <View style={[styles.detailHeader, { borderBottomColor: colors.border }]}>
              <View>
                <Text style={[styles.detailHeaderTitle, { color: colors.text }]}>Order Tracking & Details</Text>
                <Text style={[styles.detailHeaderSub, { color: colors.textSecondary }]}>
                  ID: {selectedOrder?.orderId}
                </Text>
              </View>
              <TouchableOpacity onPress={() => setSelectedOrder(null)} style={styles.closeBtn}>
                <X size={22} color={colors.text} />
              </TouchableOpacity>
            </View>

            <ScrollView
              style={styles.modalScrollView}
              contentContainerStyle={styles.modalScrollContent}
              showsVerticalScrollIndicator={true}
              nestedScrollEnabled={true}
              keyboardShouldPersistTaps="handled"
              bounces={true}
            >
              {selectedOrder && (
                <>
                  {/* Expected Delivery & Current Situation Card */}
                  <View style={[styles.situationCard, { backgroundColor: isDark ? '#1e293b' : '#eff6ff', borderColor: '#3b82f6' }]}>
                    <View style={styles.situationHeaderRow}>
                      <Truck size={22} color="#2563eb" style={{ marginRight: 10 }} />
                      <View style={{ flex: 1 }}>
                        <Text style={[styles.situationTitle, { color: isDark ? '#ffffff' : '#1e3a8a' }]}>
                          {selectedOrder.orderStatus === 'delivered'
                            ? `Delivered on ${formatDate(selectedOrder.deliveredAt || selectedOrder.createdAt)}`
                            : selectedOrder.orderStatus === 'cancelled'
                            ? `Cancelled on ${formatDate(selectedOrder.createdAt)}`
                            : `Expected Delivery: ${formatDate(selectedOrder.expectedDeliveryDate, { weekday: 'long', month: 'short', day: 'numeric' })}`}
                        </Text>
                        <Text style={[styles.situationSubtitle, { color: isDark ? '#94a3b8' : '#3b82f6' }]}>
                          Current Situation:{' '}
                          <Text style={{ fontFamily: 'Outfit_700Bold' }}>
                            {selectedOrder.shippingNotes ||
                              (selectedOrder.orderStatus === 'delivered'
                                ? 'Package handed over to recipient'
                                : selectedOrder.orderStatus === 'out_for_delivery'
                                ? 'Courier executive is on the way to your address'
                                : selectedOrder.orderStatus === 'shipped'
                                ? 'Package in transit via express logistics'
                                : 'Order verified and preparing for dispatch')}
                          </Text>
                        </Text>
                      </View>
                    </View>
                  </View>

                  {/* Product Summary Card */}
                  <Text style={[styles.sectionHeading, { color: colors.text }]}>Item Summary</Text>
                  <View style={[styles.detailProductBox, { backgroundColor: isDark ? '#1e293b' : '#f8fafc', borderColor: colors.border }]}>
                    <Image
                      source={{ uri: getImageUrl(selectedOrder.product?.images?.[0]) }}
                      style={styles.detailProductThumb}
                    />
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.detailProductTitle, { color: colors.text }]} numberOfLines={2}>
                        {selectedOrder.product?.title || 'Garment Product'}
                      </Text>
                      <Text style={[styles.detailProductMeta, { color: colors.textSecondary }]}>
                        Size: {selectedOrder.size} | Quantity: {selectedOrder.qty}
                      </Text>
                      <Text style={[styles.detailProductPrice, { color: colors.text }]}>
                        ₹{selectedOrder.priceAtPurchase}
                      </Text>
                      <Text style={[styles.detailSellerText, { color: colors.textSecondary }]}>
                        Seller: <Text style={{ color: colors.primary, fontFamily: 'Outfit_700Bold' }}>Deb Clothes India</Text>
                      </Text>
                    </View>
                  </View>

                  {/* Order Progress / Current Situation Multi-Step Tracker */}
                  <Text style={[styles.sectionHeading, { color: colors.text, marginTop: 18 }]}>
                    Delivery Tracking Timeline
                  </Text>
                  <View style={[styles.timelineCard, { backgroundColor: isDark ? '#1e293b' : '#ffffff', borderColor: colors.border }]}>
                    {renderTrackingSteps(selectedOrder)}
                  </View>

                  {/* Refund Information Card (if return/refund requested) */}
                  {selectedOrder.returnDetails && (
                    <>
                      <Text style={[styles.sectionHeading, { color: colors.text, marginTop: 18 }]}>
                        Return Refund Destination
                      </Text>
                      <View style={[styles.refundCard, { backgroundColor: isDark ? '#1e293b' : '#f0fdf4', borderColor: '#22c55e' }]}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
                          <CheckCircle2 size={18} color="#16a34a" style={{ marginRight: 8 }} />
                          <Text style={[styles.refundCardTitle, { color: isDark ? '#ffffff' : '#15803d' }]}>
                            Refund of ₹{selectedOrder.totalAmount}
                          </Text>
                        </View>

                        {selectedOrder.returnDetails.refundMethod === 'upi' ? (
                          <View style={styles.refundRow}>
                            <Smartphone size={16} color={colors.primary} style={{ marginRight: 8 }} />
                            <Text style={[styles.refundValText, { color: colors.text }]}>
                              UPI ID: <Text style={{ fontFamily: 'Outfit_800ExtraBold' }}>{selectedOrder.returnDetails.upiId || 'Provided at request'}</Text>
                            </Text>
                          </View>
                        ) : (
                          <View>
                            <View style={styles.refundRow}>
                              <Building2 size={16} color={colors.primary} style={{ marginRight: 8 }} />
                              <Text style={[styles.refundValText, { color: colors.text }]}>
                                Bank: <Text style={{ fontFamily: 'Outfit_800ExtraBold' }}>{selectedOrder.returnDetails.bankDetails?.bankName || 'Bank Transfer'}</Text>
                              </Text>
                            </View>
                            <Text style={[styles.refundSubDetail, { color: colors.textSecondary }]}>
                              A/C: ****{selectedOrder.returnDetails.bankDetails?.accountNumber?.slice(-4) || '****'} | IFSC: {selectedOrder.returnDetails.bankDetails?.ifscCode || ''}
                            </Text>
                            <Text style={[styles.refundSubDetail, { color: colors.textSecondary }]}>
                              Holder: {selectedOrder.returnDetails.bankDetails?.accountHolderName || ''}
                            </Text>
                          </View>
                        )}

                        <Text style={[styles.refundNotice, { color: isDark ? '#94a3b8' : '#166534' }]}>
                          ℹ️ Amount will be credited to this destination within 24-48 hours of item pickup and inspection.
                        </Text>
                      </View>
                    </>
                  )}

                  {/* Refund Information Card (if cancellation refund registered) */}
                  {selectedOrder.cancellationDetails && selectedOrder.cancellationDetails.refundMethod !== 'none' && (
                    <>
                      <Text style={[styles.sectionHeading, { color: colors.text, marginTop: 18 }]}>
                        Cancellation Refund Destination
                      </Text>
                      <View style={[styles.refundCard, { backgroundColor: isDark ? '#1e293b' : '#f0fdf4', borderColor: '#22c55e' }]}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
                          <CheckCircle2 size={18} color="#16a34a" style={{ marginRight: 8 }} />
                          <Text style={[styles.refundCardTitle, { color: isDark ? '#ffffff' : '#15803d' }]}>
                            Refund of ₹{selectedOrder.totalAmount}
                          </Text>
                        </View>

                        {selectedOrder.cancellationDetails.refundMethod === 'upi' ? (
                          <View style={styles.refundRow}>
                            <Smartphone size={16} color={colors.primary} style={{ marginRight: 8 }} />
                            <Text style={[styles.refundValText, { color: colors.text }]}>
                              UPI ID: <Text style={{ fontFamily: 'Outfit_800ExtraBold' }}>{selectedOrder.cancellationDetails.upiId}</Text>
                            </Text>
                          </View>
                        ) : (
                          <View>
                            <View style={styles.refundRow}>
                              <Building2 size={16} color={colors.primary} style={{ marginRight: 8 }} />
                              <Text style={[styles.refundValText, { color: colors.text }]}>
                                Bank: <Text style={{ fontFamily: 'Outfit_800ExtraBold' }}>{selectedOrder.cancellationDetails.bankDetails?.bankName || 'Bank Transfer'}</Text>
                              </Text>
                            </View>
                            <Text style={[styles.refundSubDetail, { color: colors.textSecondary }]}>
                              A/C: ****{selectedOrder.cancellationDetails.bankDetails?.accountNumber?.slice(-4) || '****'} | IFSC: {selectedOrder.cancellationDetails.bankDetails?.ifscCode || ''}
                            </Text>
                            <Text style={[styles.refundSubDetail, { color: colors.textSecondary }]}>
                              Holder: {selectedOrder.cancellationDetails.bankDetails?.accountHolderName || ''}
                            </Text>
                          </View>
                        )}

                        <Text style={[styles.refundNotice, { color: isDark ? '#94a3b8' : '#166534' }]}>
                          ℹ️ Refund has been initiated and will be credited to this destination within 24-48 business hours.
                        </Text>
                      </View>
                    </>
                  )}

                  {/* Delivery Address */}
                  <Text style={[styles.sectionHeading, { color: colors.text, marginTop: 18 }]}>
                    Delivery Address
                  </Text>
                  <View style={[styles.addressBox, { backgroundColor: isDark ? '#1e293b' : '#f8fafc', borderColor: colors.border }]}>
                    <View style={{ flexDirection: 'row', alignItems: 'flex-start' }}>
                      <MapPin size={18} color={colors.primary} style={{ marginRight: 10, marginTop: 2 }} />
                      <View style={{ flex: 1 }}>
                        <Text style={[styles.addressText, { color: colors.text }]}>
                          {selectedOrder.shippingAddress?.line1}
                        </Text>
                        <Text style={[styles.addressText, { color: colors.text }]}>
                          {selectedOrder.shippingAddress?.city}, {selectedOrder.shippingAddress?.state} - {selectedOrder.shippingAddress?.pincode}
                        </Text>
                        <Text style={[styles.addressPhone, { color: colors.textSecondary, marginTop: 6 }]}>
                          Phone: <Text style={{ fontFamily: 'Outfit_700Bold', color: colors.text }}>{selectedOrder.shippingAddress?.phone}</Text>
                        </Text>
                      </View>
                    </View>
                  </View>

                  {/* Price Breakdown */}
                  <Text style={[styles.sectionHeading, { color: colors.text, marginTop: 18 }]}>
                    Price Details
                  </Text>
                  <View style={[styles.priceBreakdownBox, { backgroundColor: isDark ? '#1e293b' : '#f8fafc', borderColor: colors.border }]}>
                    <View style={styles.priceLine}>
                      <Text style={[styles.priceLineLabel, { color: colors.textSecondary }]}>List Price</Text>
                      <Text style={[styles.priceLineVal, { color: colors.text }]}>₹{selectedOrder.priceAtPurchase}</Text>
                    </View>
                    <View style={styles.priceLine}>
                      <Text style={[styles.priceLineLabel, { color: colors.textSecondary }]}>Delivery Fee</Text>
                      <Text style={[styles.priceLineVal, { color: '#10b981', fontFamily: 'Outfit_800ExtraBold' }]}>FREE</Text>
                    </View>
                    <View style={styles.priceLine}>
                      <Text style={[styles.priceLineLabel, { color: colors.textSecondary }]}>Payment Mode</Text>
                      <Text style={[styles.priceLineVal, { color: colors.text }]}>{selectedOrder.paymentMethod || 'COD'}</Text>
                    </View>
                    <View style={[styles.priceLine, styles.totalLine, { borderTopColor: colors.border }]}>
                      <Text style={[styles.totalLabel, { color: colors.text }]}>Total Amount</Text>
                      <Text style={[styles.totalVal, { color: colors.primary }]}>₹{selectedOrder.totalAmount || selectedOrder.priceAtPurchase}</Text>
                    </View>
                  </View>

                  {/* Actions in Detail Modal */}
                  <View style={{ marginTop: 20 }}>
                    {['placed', 'confirmed'].includes(selectedOrder.orderStatus) && (
                      <TouchableOpacity
                        style={[styles.modalActionFullBtn, { backgroundColor: '#ef4444' }]}
                        onPress={() => {
                          const item = selectedOrder;
                          setSelectedOrder(null);
                          handleOpenCancelModal(item);
                        }}
                      >
                        <Text style={styles.modalActionFullBtnText}>Cancel Order</Text>
                      </TouchableOpacity>
                    )}

                    {selectedOrder.orderStatus === 'delivered' && (
                      <TouchableOpacity
                        style={[styles.modalActionFullBtn, { backgroundColor: colors.primary }]}
                        onPress={() => {
                          const item = selectedOrder;
                          setSelectedOrder(null);
                          handleOpenReturnModal(item);
                        }}
                      >
                        <Text style={styles.modalActionFullBtnText}>Request Return / Refund</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                </>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* ========================================================================= */}
      {/* FLIPKART RETURN & REFUND MODAL (WITH BANK / UPI SUBMISSION) */}
      {/* ========================================================================= */}
      <Modal visible={!!returningOrder} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={[styles.detailModalCard, { backgroundColor: colors.card }]}>
            {/* Modal Header */}
            <View style={[styles.detailHeader, { borderBottomColor: colors.border }]}>
              <View>
                <Text style={[styles.detailHeaderTitle, { color: colors.text }]}>Return & Refund Request</Text>
                <Text style={[styles.detailHeaderSub, { color: colors.textSecondary }]}>
                  Refund Amount: ₹{returningOrder?.priceAtPurchase || returningOrder?.totalAmount}
                </Text>
              </View>
              <TouchableOpacity onPress={handleCloseReturnModal} style={styles.closeBtn}>
                <X size={22} color={colors.text} />
              </TouchableOpacity>
            </View>

            <ScrollView
              style={styles.modalScrollView}
              contentContainerStyle={styles.modalScrollContent}
              showsVerticalScrollIndicator={true}
              nestedScrollEnabled={true}
              keyboardShouldPersistTaps="handled"
              bounces={true}
            >
              {returningOrder && (
                <>
                  {/* Step 1: Select Reason */}
                  <Text style={[styles.sectionHeading, { color: colors.text }]}>1. Select Reason for Return</Text>
                  <View style={styles.chipsContainer}>
                    {returnReasonChips.map((chip) => {
                      const active = selectedReasonChip === chip;
                      return (
                        <TouchableOpacity
                          key={chip}
                          style={[
                            styles.chipBtn,
                            active
                              ? { backgroundColor: colors.primary, borderColor: colors.primary }
                              : { backgroundColor: isDark ? '#1e293b' : '#f8fafc', borderColor: colors.border },
                          ]}
                          onPress={() => setSelectedReasonChip(chip)}
                        >
                          <Text
                            style={[
                              styles.chipBtnText,
                              { color: active ? '#ffffff' : colors.text, fontFamily: active ? 'Outfit_800ExtraBold' : 'Outfit_600SemiBold' },
                            ]}
                          >
                            {chip}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>

                  <TextInput
                    style={[styles.returnTextarea, { color: colors.text, borderColor: colors.border, backgroundColor: isDark ? '#1e293b' : '#f8fafc' }]}
                    placeholder="Additional comments / details about the issue..."
                    placeholderTextColor={colors.textSecondary}
                    value={returnReason}
                    onChangeText={setReturnReason}
                    multiline
                    numberOfLines={3}
                  />

                  {/* Step 2: Proof Photo */}
                  <Text style={[styles.sectionHeading, { color: colors.text, marginTop: 18 }]}>
                    2. Add Product Proof Photo (Required)
                  </Text>
                  <View style={styles.photoPickerRow}>
                    <TouchableOpacity
                      style={[styles.photoPickerBtn, { borderColor: colors.border, backgroundColor: isDark ? '#1e293b' : '#f8fafc' }]}
                      onPress={handleReturnSelectGallery}
                    >
                      <ImageIcon size={18} color={colors.primary} style={{ marginRight: 6 }} />
                      <Text style={[styles.photoPickerBtnText, { color: colors.text }]}>Choose from Gallery</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={[styles.photoPickerBtn, { borderColor: colors.border, backgroundColor: isDark ? '#1e293b' : '#f8fafc' }]}
                      onPress={handleReturnTakePhoto}
                    >
                      <Camera size={18} color={colors.primary} style={{ marginRight: 6 }} />
                      <Text style={[styles.photoPickerBtnText, { color: colors.text }]}>Take Camera Photo</Text>
                    </TouchableOpacity>
                  </View>

                  {returnPhoto ? (
                    <View style={[styles.returnPhotoPreviewBox, { borderColor: colors.border }]}>
                      <Image source={{ uri: returnPhoto }} style={styles.returnPreviewImg} />
                      <TouchableOpacity style={styles.removePhotoBadge} onPress={() => setReturnPhoto(null)}>
                        <X size={14} color="#ffffff" />
                      </TouchableOpacity>
                    </View>
                  ) : null}

                  {/* Step 3: Refund Destination (UPI ID or Bank Details) */}
                  <Text style={[styles.sectionHeading, { color: colors.text, marginTop: 18 }]}>
                    3. Refund Payment Destination
                  </Text>
                  <Text style={[styles.refundSubtitle, { color: colors.textSecondary }]}>
                    Where would you like the refunded amount of ₹{returningOrder.priceAtPurchase} to be credited?
                  </Text>

                  {/* Mode Selector Tabs */}
                  <View style={[styles.refundTabsContainer, { backgroundColor: isDark ? '#1e293b' : '#e2e8f0' }]}>
                    <TouchableOpacity
                      style={[
                        styles.refundTabBtn,
                        refundMethod === 'upi' && [styles.refundTabBtnActive, { backgroundColor: colors.card }],
                      ]}
                      onPress={() => setRefundMethod('upi')}
                    >
                      <Smartphone size={16} color={refundMethod === 'upi' ? colors.primary : colors.textSecondary} style={{ marginRight: 6 }} />
                      <Text
                        style={[
                          styles.refundTabBtnText,
                          { color: refundMethod === 'upi' ? colors.primary : colors.textSecondary },
                        ]}
                      >
                        UPI ID (Instant)
                      </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={[
                        styles.refundTabBtn,
                        refundMethod === 'bank_transfer' && [styles.refundTabBtnActive, { backgroundColor: colors.card }],
                      ]}
                      onPress={() => setRefundMethod('bank_transfer')}
                    >
                      <Building2 size={16} color={refundMethod === 'bank_transfer' ? colors.primary : colors.textSecondary} style={{ marginRight: 6 }} />
                      <Text
                        style={[
                          styles.refundTabBtnText,
                          { color: refundMethod === 'bank_transfer' ? colors.primary : colors.textSecondary },
                        ]}
                      >
                        Bank Account
                      </Text>
                    </TouchableOpacity>
                  </View>

                  {/* UPI Inputs */}
                  {refundMethod === 'upi' ? (
                    <View style={styles.refundInputsGroup}>
                      <Text style={[styles.inputLabel, { color: colors.text }]}>Enter your UPI ID / VPA</Text>
                      <TextInput
                        style={[styles.formInput, { color: colors.text, borderColor: colors.border, backgroundColor: isDark ? '#1e293b' : '#f8fafc' }]}
                        placeholder="e.g. mobile@upi or username@oksbi"
                        placeholderTextColor={colors.textSecondary}
                        value={upiId}
                        onChangeText={setUpiId}
                        autoCapitalize="none"
                      />
                      <Text style={[styles.inputHelper, { color: colors.textSecondary }]}>
                        Verified UPI IDs receive instant refund credit once pickup is completed.
                      </Text>
                    </View>
                  ) : (
                    /* Bank Account Inputs */
                    <View style={styles.refundInputsGroup}>
                      <Text style={[styles.inputLabel, { color: colors.text }]}>Account Holder Name</Text>
                      <TextInput
                        style={[styles.formInput, { color: colors.text, borderColor: colors.border, backgroundColor: isDark ? '#1e293b' : '#f8fafc' }]}
                        placeholder="Name as per Bank records"
                        placeholderTextColor={colors.textSecondary}
                        value={bankAccountHolder}
                        onChangeText={setBankAccountHolder}
                      />

                      <Text style={[styles.inputLabel, { color: colors.text, marginTop: 10 }]}>Bank Name</Text>
                      <TextInput
                        style={[styles.formInput, { color: colors.text, borderColor: colors.border, backgroundColor: isDark ? '#1e293b' : '#f8fafc' }]}
                        placeholder="e.g. State Bank of India / HDFC Bank"
                        placeholderTextColor={colors.textSecondary}
                        value={bankName}
                        onChangeText={setBankName}
                      />

                      <Text style={[styles.inputLabel, { color: colors.text, marginTop: 10 }]}>Bank Account Number</Text>
                      <TextInput
                        style={[styles.formInput, { color: colors.text, borderColor: colors.border, backgroundColor: isDark ? '#1e293b' : '#f8fafc' }]}
                        placeholder="Account Number"
                        placeholderTextColor={colors.textSecondary}
                        keyboardType="number-pad"
                        value={bankAccountNumber}
                        onChangeText={setBankAccountNumber}
                      />

                      <Text style={[styles.inputLabel, { color: colors.text, marginTop: 10 }]}>Confirm Account Number</Text>
                      <TextInput
                        style={[styles.formInput, { color: colors.text, borderColor: colors.border, backgroundColor: isDark ? '#1e293b' : '#f8fafc' }]}
                        placeholder="Re-enter Account Number"
                        placeholderTextColor={colors.textSecondary}
                        keyboardType="number-pad"
                        value={bankConfirmAccount}
                        onChangeText={setBankConfirmAccount}
                      />

                      <Text style={[styles.inputLabel, { color: colors.text, marginTop: 10 }]}>IFSC Code</Text>
                      <TextInput
                        style={[styles.formInput, { color: colors.text, borderColor: colors.border, backgroundColor: isDark ? '#1e293b' : '#f8fafc' }]}
                        placeholder="e.g. SBIN0001234"
                        placeholderTextColor={colors.textSecondary}
                        autoCapitalize="characters"
                        value={bankIfsc}
                        onChangeText={setBankIfsc}
                      />
                    </View>
                  )}

                    {/* Action Buttons */}
                  <View style={styles.modalActionButtonsRow}>
                    <TouchableOpacity
                      style={[styles.cancelModalBtn, { borderColor: colors.border }]}
                      onPress={handleCloseReturnModal}
                    >
                      <Text style={[styles.cancelModalBtnText, { color: colors.textSecondary }]}>Cancel</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={[styles.submitModalBtn, { backgroundColor: colors.primary }]}
                      onPress={handleSubmitReturnWithRefund}
                      disabled={submittingReturn}
                    >
                      {submittingReturn ? (
                        <ActivityIndicator color="#fff" />
                      ) : (
                        <Text style={styles.submitModalBtnText}>Submit Return Request</Text>
                      )}
                    </TouchableOpacity>
                  </View>
                </>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* ========================================================================= */}
      {/* ORDER CANCELLATION & REFUND MODAL */}
      {/* ========================================================================= */}
      <Modal visible={!!cancellingOrder} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={[styles.detailModalCard, { backgroundColor: colors.card }]}>
            {/* Modal Header */}
            <View style={[styles.detailHeader, { borderBottomColor: colors.border }]}>
              <View>
                <Text style={[styles.detailHeaderTitle, { color: colors.text }]}>Cancel Order Request</Text>
                <Text style={[styles.detailHeaderSub, { color: colors.textSecondary }]}>
                  Order #{cancellingOrder?.orderId?.slice(-8).toUpperCase()} • Amount: ₹{cancellingOrder?.totalAmount || cancellingOrder?.priceAtPurchase}
                </Text>
              </View>
              <TouchableOpacity onPress={handleCloseCancelModal} style={styles.closeBtn}>
                <X size={22} color={colors.text} />
              </TouchableOpacity>
            </View>

            <ScrollView
              style={styles.modalScrollView}
              contentContainerStyle={styles.modalScrollContent}
              showsVerticalScrollIndicator={true}
              nestedScrollEnabled={true}
              keyboardShouldPersistTaps="handled"
              bounces={true}
            >
              {cancellingOrder && (
                <>
                  {/* Notice for Online Paid vs COD */}
                  {(cancellingOrder.paymentStatus === 'paid' || cancellingOrder.paymentMethod === 'ONLINE') ? (
                    <View style={[styles.alertInfoBox, { backgroundColor: isDark ? 'rgba(59, 130, 246, 0.12)' : '#eff6ff', borderColor: '#3b82f6' }]}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
                        <ShieldCheck size={18} color="#2563eb" style={{ marginRight: 6 }} />
                        <Text style={[styles.alertInfoTitle, { color: isDark ? '#60a5fa' : '#1e40af' }]}>
                          Paid Online (₹{cancellingOrder.totalAmount || cancellingOrder.priceAtPurchase})
                        </Text>
                      </View>
                      <Text style={[styles.alertInfoSub, { color: isDark ? '#94a3b8' : '#1d4ed8' }]}>
                        Since you paid online, please submit your UPI ID or Bank Details below to receive your immediate refund.
                      </Text>
                    </View>
                  ) : (
                    <View style={[styles.alertInfoBox, { backgroundColor: isDark ? 'rgba(239, 68, 68, 0.1)' : '#fef2f2', borderColor: '#ef4444' }]}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
                        <AlertTriangle size={18} color="#ef4444" style={{ marginRight: 6 }} />
                        <Text style={[styles.alertInfoTitle, { color: '#ef4444' }]}>Cash on Delivery Order</Text>
                      </View>
                      <Text style={[styles.alertInfoSub, { color: colors.textSecondary }]}>
                        No payment was made. The order will be cancelled and items returned to stock.
                      </Text>
                    </View>
                  )}

                  {/* Step 1: Select Reason */}
                  <Text style={[styles.sectionHeading, { color: colors.text, marginTop: 12 }]}>
                    1. Reason for Cancellation
                  </Text>
                  <View style={styles.chipsContainer}>
                    {cancelReasonChips.map((chip) => {
                      const active = selectedCancelChip === chip;
                      return (
                        <TouchableOpacity
                          key={chip}
                          style={[
                            styles.chipBtn,
                            active
                              ? { backgroundColor: '#ef4444', borderColor: '#ef4444' }
                              : { backgroundColor: isDark ? '#1e293b' : '#f8fafc', borderColor: colors.border },
                          ]}
                          onPress={() => setSelectedCancelChip(chip)}
                        >
                          <Text
                            style={[
                              styles.chipBtnText,
                              { color: active ? '#ffffff' : colors.text, fontFamily: active ? 'Outfit_800ExtraBold' : 'Outfit_600SemiBold' },
                            ]}
                          >
                            {chip}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>

                  <TextInput
                    style={[styles.returnTextarea, { color: colors.text, borderColor: colors.border, backgroundColor: isDark ? '#1e293b' : '#f8fafc' }]}
                    placeholder="Additional comments (optional)..."
                    placeholderTextColor={colors.textSecondary}
                    value={cancelReason}
                    onChangeText={setCancelReason}
                    multiline
                    numberOfLines={3}
                  />

                  {/* Step 2: Refund Destination (Only if paid online) */}
                  {(cancellingOrder.paymentStatus === 'paid' || cancellingOrder.paymentMethod === 'ONLINE') && (
                    <>
                      <Text style={[styles.sectionHeading, { color: colors.text, marginTop: 18 }]}>
                        2. Refund Payment Destination
                      </Text>
                      <Text style={[styles.refundSubtitle, { color: colors.textSecondary }]}>
                        Where should we transfer your ₹{cancellingOrder.totalAmount || cancellingOrder.priceAtPurchase} refund?
                      </Text>

                      {/* Mode Selector Tabs */}
                      <View style={[styles.refundTabsContainer, { backgroundColor: isDark ? '#1e293b' : '#e2e8f0' }]}>
                        <TouchableOpacity
                          style={[
                            styles.refundTabBtn,
                            cancelRefundMethod === 'upi' && [styles.refundTabBtnActive, { backgroundColor: colors.card }],
                          ]}
                          onPress={() => setCancelRefundMethod('upi')}
                        >
                          <Smartphone size={16} color={cancelRefundMethod === 'upi' ? colors.primary : colors.textSecondary} style={{ marginRight: 6 }} />
                          <Text
                            style={[
                              styles.refundTabBtnText,
                              { color: cancelRefundMethod === 'upi' ? colors.primary : colors.textSecondary },
                            ]}
                          >
                            UPI ID (Instant)
                          </Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                          style={[
                            styles.refundTabBtn,
                            cancelRefundMethod === 'bank_transfer' && [styles.refundTabBtnActive, { backgroundColor: colors.card }],
                          ]}
                          onPress={() => setCancelRefundMethod('bank_transfer')}
                        >
                          <Building2 size={16} color={cancelRefundMethod === 'bank_transfer' ? colors.primary : colors.textSecondary} style={{ marginRight: 6 }} />
                          <Text
                            style={[
                              styles.refundTabBtnText,
                              { color: cancelRefundMethod === 'bank_transfer' ? colors.primary : colors.textSecondary },
                            ]}
                          >
                            Bank Account
                          </Text>
                        </TouchableOpacity>
                      </View>

                      {/* UPI Inputs */}
                      {cancelRefundMethod === 'upi' ? (
                        <View style={styles.refundInputsGroup}>
                          <Text style={[styles.inputLabel, { color: colors.text }]}>Enter your UPI ID / VPA</Text>
                          <TextInput
                            style={[styles.formInput, { color: colors.text, borderColor: colors.border, backgroundColor: isDark ? '#1e293b' : '#f8fafc' }]}
                            placeholder="e.g. mobile@upi or username@oksbi"
                            placeholderTextColor={colors.textSecondary}
                            value={cancelUpiId}
                            onChangeText={setCancelUpiId}
                            autoCapitalize="none"
                          />
                          <Text style={[styles.inputHelper, { color: colors.textSecondary }]}>
                            Refund will be processed directly to this UPI address within 24-48 business hours.
                          </Text>
                        </View>
                      ) : (
                        /* Bank Account Inputs */
                        <View style={styles.refundInputsGroup}>
                          <Text style={[styles.inputLabel, { color: colors.text }]}>Account Holder Name</Text>
                          <TextInput
                            style={[styles.formInput, { color: colors.text, borderColor: colors.border, backgroundColor: isDark ? '#1e293b' : '#f8fafc' }]}
                            placeholder="Name as per Bank records"
                            placeholderTextColor={colors.textSecondary}
                            value={cancelAccountHolder}
                            onChangeText={setCancelAccountHolder}
                          />

                          <Text style={[styles.inputLabel, { color: colors.text, marginTop: 10 }]}>Bank Name</Text>
                          <TextInput
                            style={[styles.formInput, { color: colors.text, borderColor: colors.border, backgroundColor: isDark ? '#1e293b' : '#f8fafc' }]}
                            placeholder="e.g. State Bank of India / HDFC Bank"
                            placeholderTextColor={colors.textSecondary}
                            value={cancelBankName}
                            onChangeText={setCancelBankName}
                          />

                          <Text style={[styles.inputLabel, { color: colors.text, marginTop: 10 }]}>Bank Account Number</Text>
                          <TextInput
                            style={[styles.formInput, { color: colors.text, borderColor: colors.border, backgroundColor: isDark ? '#1e293b' : '#f8fafc' }]}
                            placeholder="Account Number"
                            placeholderTextColor={colors.textSecondary}
                            keyboardType="number-pad"
                            value={cancelAccountNumber}
                            onChangeText={setCancelAccountNumber}
                          />

                          <Text style={[styles.inputLabel, { color: colors.text, marginTop: 10 }]}>Confirm Account Number</Text>
                          <TextInput
                            style={[styles.formInput, { color: colors.text, borderColor: colors.border, backgroundColor: isDark ? '#1e293b' : '#f8fafc' }]}
                            placeholder="Re-enter Account Number"
                            placeholderTextColor={colors.textSecondary}
                            keyboardType="number-pad"
                            value={cancelConfirmAccount}
                            onChangeText={setCancelConfirmAccount}
                          />

                          <Text style={[styles.inputLabel, { color: colors.text, marginTop: 10 }]}>IFSC Code</Text>
                          <TextInput
                            style={[styles.formInput, { color: colors.text, borderColor: colors.border, backgroundColor: isDark ? '#1e293b' : '#f8fafc' }]}
                            placeholder="e.g. SBIN0001234"
                            placeholderTextColor={colors.textSecondary}
                            autoCapitalize="characters"
                            value={cancelIfsc}
                            onChangeText={setCancelIfsc}
                          />
                        </View>
                      )}
                    </>
                  )}

                  {/* Action Buttons */}
                  <View style={styles.modalActionButtonsRow}>
                    <TouchableOpacity
                      style={[styles.cancelModalBtn, { borderColor: colors.border }]}
                      onPress={handleCloseCancelModal}
                    >
                      <Text style={[styles.cancelModalBtnText, { color: colors.textSecondary }]}>Don't Cancel</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={[styles.submitModalBtn, { backgroundColor: '#ef4444' }]}
                      onPress={handleSubmitCancelOrder}
                      disabled={submittingCancel}
                    >
                      {submittingCancel ? (
                        <ActivityIndicator color="#fff" />
                      ) : (
                        <Text style={styles.submitModalBtnText}>Confirm Cancel & Refund</Text>
                      )}
                    </TouchableOpacity>
                  </View>
                </>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* ========================================================================= */}
      {/* RATE & REVIEW MODAL */}
      {/* ========================================================================= */}
      <Modal visible={!!reviewProduct} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={[styles.detailModalCard, { backgroundColor: colors.card, maxHeight: '80%' }]}>
            <View style={[styles.detailHeader, { borderBottomColor: colors.border }]}>
              <Text style={[styles.detailHeaderTitle, { color: colors.text }]}>Rate & Review Product</Text>
              <TouchableOpacity onPress={() => setReviewProduct(null)}>
                <X size={22} color={colors.text} />
              </TouchableOpacity>
            </View>

            <ScrollView
              style={styles.modalScrollView}
              contentContainerStyle={styles.modalScrollContent}
              showsVerticalScrollIndicator={true}
              nestedScrollEnabled={true}
              keyboardShouldPersistTaps="handled"
              bounces={true}
            >
              {reviewProduct && (
                <>
                  <View style={styles.reviewProductHeader}>
                    <Image
                      source={{ uri: getImageUrl(reviewProduct.images?.[0]) }}
                      style={styles.reviewProductThumb}
                    />
                    <Text style={[styles.reviewProductTitle, { color: colors.text }]} numberOfLines={2}>
                      {reviewProduct.title}
                    </Text>
                  </View>

                  <Text style={[styles.inputLabel, { color: colors.text, marginTop: 12 }]}>Your Star Rating</Text>
                  <View style={styles.reviewStarsRow}>
                    {[1, 2, 3, 4, 5].map((star) => (
                      <TouchableOpacity
                        key={star}
                        onPress={() => setReviewRating(star)}
                        style={{ padding: 6 }}
                      >
                        <Star
                          size={32}
                          color={star <= reviewRating ? '#fbbf24' : colors.border}
                          fill={star <= reviewRating ? '#fbbf24' : 'none'}
                        />
                      </TouchableOpacity>
                    ))}
                  </View>

                  <Text style={[styles.inputLabel, { color: colors.text, marginTop: 16 }]}>Write Your Feedback</Text>
                  <TextInput
                    style={[styles.returnTextarea, { color: colors.text, borderColor: colors.border, backgroundColor: isDark ? '#1e293b' : '#f8fafc' }]}
                    placeholder="Share your experience with fit, fabric quality, and finish..."
                    placeholderTextColor={colors.textSecondary}
                    value={reviewComment}
                    onChangeText={setReviewComment}
                    multiline
                    numberOfLines={4}
                  />

                  {/* Photo picker */}
                  <Text style={[styles.inputLabel, { color: colors.text, marginTop: 14 }]}>Add Photos (Optional)</Text>
                  <View style={styles.photoPickerRow}>
                    <TouchableOpacity
                      style={[styles.photoPickerBtn, { borderColor: colors.border, backgroundColor: isDark ? '#1e293b' : '#f8fafc' }]}
                      onPress={handleReviewSelectGallery}
                    >
                      <ImageIcon size={16} color={colors.primary} style={{ marginRight: 6 }} />
                      <Text style={[styles.photoPickerBtnText, { color: colors.text }]}>Gallery</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={[styles.photoPickerBtn, { borderColor: colors.border, backgroundColor: isDark ? '#1e293b' : '#f8fafc' }]}
                      onPress={handleReviewTakePhoto}
                    >
                      <Camera size={16} color={colors.primary} style={{ marginRight: 6 }} />
                      <Text style={[styles.photoPickerBtnText, { color: colors.text }]}>Camera</Text>
                    </TouchableOpacity>
                  </View>

                  {reviewPhoto ? (
                    <View style={[styles.returnPhotoPreviewBox, { borderColor: colors.border }]}>
                      <Image source={{ uri: reviewPhoto }} style={styles.returnPreviewImg} />
                      <TouchableOpacity style={styles.removePhotoBadge} onPress={() => setReviewPhoto(null)}>
                        <X size={14} color="#ffffff" />
                      </TouchableOpacity>
                    </View>
                  ) : null}

                  <View style={[styles.modalActionButtonsRow, { marginTop: 24 }]}>
                    <TouchableOpacity
                      style={[styles.cancelModalBtn, { borderColor: colors.border }]}
                      onPress={() => setReviewProduct(null)}
                    >
                      <Text style={[styles.cancelModalBtnText, { color: colors.textSecondary }]}>Cancel</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={[styles.submitModalBtn, { backgroundColor: colors.primary }]}
                      onPress={handleSubmitReview}
                      disabled={submittingReview}
                    >
                      {submittingReview ? (
                        <ActivityIndicator color="#fff" />
                      ) : (
                        <Text style={styles.submitModalBtnText}>Submit Review</Text>
                      )}
                    </TouchableOpacity>
                  </View>
                </>
              )}
            </ScrollView>
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
  topHeader: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 10,
    borderBottomWidth: 1,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
  topHeaderTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  topHeaderTitle: {
    fontSize: 19,
    fontFamily: 'Outfit_900Black',
    letterSpacing: 0.3,
  },
  orderCountBadge: {
    backgroundColor: '#2563eb18',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  orderCountText: {
    color: '#2563eb',
    fontSize: 12,
    fontFamily: 'Outfit_800ExtraBold',
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    height: 40,
    marginBottom: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    fontFamily: 'Outfit_500Medium',
    height: '100%',
  },
  filterPillsScroll: {
    flexDirection: 'row',
    paddingVertical: 2,
  },
  filterPillBtn: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    marginRight: 8,
  },
  filterPillText: {
    fontSize: 12,
    fontFamily: 'Outfit_600SemiBold',
  },
  listContent: {
    padding: 12,
    paddingBottom: 28,
  },
  flipkartCard: {
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 12,
    padding: 14,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
  },
  cardHeaderPress: {},
  cardStatusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  statusDot: {
    width: 9,
    height: 9,
    borderRadius: 4.5,
    marginRight: 10,
  },
  statusHeadingText: {
    fontSize: 13.5,
    fontFamily: 'Outfit_800ExtraBold',
  },
  statusSubText: {
    fontSize: 11.5,
    fontFamily: 'Outfit_400Regular',
    marginTop: 1,
  },
  cardBodyRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  productImage: {
    width: 68,
    height: 82,
    borderRadius: 8,
    borderWidth: 0.8,
    resizeMode: 'cover',
    marginRight: 12,
  },
  productInfoCol: {
    flex: 1,
  },
  productTitle: {
    fontSize: 13.5,
    fontFamily: 'Outfit_700Bold',
    lineHeight: 18,
    marginBottom: 4,
  },
  productMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  productMetaText: {
    fontSize: 11.5,
    fontFamily: 'Outfit_400Regular',
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  priceText: {
    fontSize: 15,
    fontFamily: 'Outfit_900Black',
  },
  assuredBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2563eb15',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginLeft: 10,
  },
  assuredBadgeText: {
    fontSize: 10,
    fontFamily: 'Outfit_800ExtraBold',
    color: '#2563eb',
  },
  ratingPromptRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: 0.8,
  },
  ratingPromptLabel: {
    fontSize: 12,
    fontFamily: 'Outfit_600SemiBold',
  },
  starsPromptRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  cardFooterActions: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: 0.8,
    flexWrap: 'wrap',
  },
  quickActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    borderWidth: 1,
    marginLeft: 8,
    marginTop: 4,
  },
  quickActionText: {
    fontSize: 11.5,
    fontFamily: 'Outfit_700Bold',
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 30,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 13,
    fontFamily: 'Outfit_600SemiBold',
  },
  errorText: {
    textAlign: 'center',
    marginVertical: 10,
    fontFamily: 'Outfit_700Bold',
  },
  emptyTitle: {
    fontSize: 17,
    fontFamily: 'Outfit_800ExtraBold',
    marginBottom: 6,
  },
  emptySubtitle: {
    fontSize: 13,
    fontFamily: 'Outfit_400Regular',
    textAlign: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'flex-end',
  },
  detailModalCard: {
    width: '100%',
    maxHeight: '92%',
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    overflow: 'hidden',
  },
  modalScrollView: {
    flexShrink: 1,
    width: '100%',
  },
  modalScrollContent: {
    padding: 16,
    paddingBottom: 80,
  },
  detailHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 18,
    paddingVertical: 14,
    borderBottomWidth: 1,
  },
  detailHeaderTitle: {
    fontSize: 16,
    fontFamily: 'Outfit_900Black',
  },
  detailHeaderSub: {
    fontSize: 11.5,
    fontFamily: 'Outfit_400Regular',
    marginTop: 2,
  },
  closeBtn: {
    padding: 4,
  },
  situationCard: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 14,
    marginBottom: 16,
  },
  situationHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  situationTitle: {
    fontSize: 14.5,
    fontFamily: 'Outfit_900Black',
    marginBottom: 3,
  },
  situationSubtitle: {
    fontSize: 12,
    fontFamily: 'Outfit_400Regular',
    lineHeight: 17,
  },
  sectionHeading: {
    fontSize: 14,
    fontFamily: 'Outfit_800ExtraBold',
    marginBottom: 10,
  },
  detailProductBox: {
    flexDirection: 'row',
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    marginBottom: 16,
  },
  detailProductThumb: {
    width: 64,
    height: 78,
    borderRadius: 6,
    marginRight: 12,
    resizeMode: 'cover',
  },
  detailProductTitle: {
    fontSize: 13.5,
    fontFamily: 'Outfit_700Bold',
    lineHeight: 18,
  },
  detailProductMeta: {
    fontSize: 12,
    fontFamily: 'Outfit_400Regular',
    marginVertical: 4,
  },
  detailProductPrice: {
    fontSize: 14.5,
    fontFamily: 'Outfit_900Black',
  },
  detailSellerText: {
    fontSize: 11,
    fontFamily: 'Outfit_400Regular',
    marginTop: 4,
  },
  timelineCard: {
    borderRadius: 10,
    borderWidth: 1,
    padding: 14,
    marginBottom: 16,
  },
  trackingTimelineWrapper: {
    paddingLeft: 4,
  },
  stepItemRow: {
    flexDirection: 'row',
    minHeight: 52,
  },
  stepIconCol: {
    alignItems: 'center',
    marginRight: 14,
    width: 22,
  },
  stepDot: {
    width: 22,
    height: 22,
    borderRadius: 11,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 2,
  },
  stepLine: {
    width: 2,
    flex: 1,
    marginVertical: 2,
  },
  stepContentCol: {
    flex: 1,
    paddingBottom: 12,
  },
  stepTitle: {
    fontSize: 13.5,
    fontFamily: 'Outfit_800ExtraBold',
  },
  stepSub: {
    fontSize: 11.5,
    fontFamily: 'Outfit_400Regular',
    marginTop: 2,
    lineHeight: 16,
  },
  refundCard: {
    borderRadius: 10,
    borderWidth: 1,
    padding: 14,
    marginBottom: 16,
  },
  refundCardTitle: {
    fontSize: 14,
    fontFamily: 'Outfit_800ExtraBold',
  },
  refundRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 2,
  },
  refundValText: {
    fontSize: 12.5,
    fontFamily: 'Outfit_500Medium',
  },
  refundSubDetail: {
    fontSize: 11.5,
    fontFamily: 'Outfit_400Regular',
    marginLeft: 24,
    marginTop: 2,
  },
  refundNotice: {
    fontSize: 11.5,
    fontFamily: 'Outfit_400Regular',
    marginTop: 8,
    lineHeight: 16,
  },
  addressBox: {
    borderRadius: 10,
    borderWidth: 1,
    padding: 14,
    marginBottom: 16,
  },
  addressText: {
    fontSize: 13,
    lineHeight: 18,
    fontFamily: 'Outfit_600SemiBold',
  },
  addressPhone: {
    fontSize: 12,
    fontFamily: 'Outfit_400Regular',
  },
  priceBreakdownBox: {
    borderRadius: 10,
    borderWidth: 1,
    padding: 14,
    marginBottom: 16,
  },
  priceLine: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  priceLineLabel: {
    fontSize: 12.5,
    fontFamily: 'Outfit_400Regular',
  },
  priceLineVal: {
    fontSize: 13,
    fontFamily: 'Outfit_700Bold',
  },
  totalLine: {
    borderTopWidth: 1,
    paddingTop: 10,
    marginTop: 4,
    marginBottom: 0,
  },
  totalLabel: {
    fontSize: 14,
    fontFamily: 'Outfit_800ExtraBold',
  },
  totalVal: {
    fontSize: 16,
    fontFamily: 'Outfit_900Black',
  },
  modalActionFullBtn: {
    height: 44,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  modalActionFullBtnText: {
    color: '#ffffff',
    fontSize: 14,
    fontFamily: 'Outfit_800ExtraBold',
  },
  chipsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 10,
  },
  chipBtn: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 18,
    borderWidth: 1,
    marginRight: 8,
    marginBottom: 8,
  },
  chipBtnText: {
    fontSize: 12,
    fontFamily: 'Outfit_500Medium',
  },
  returnTextarea: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    fontSize: 13,
    fontFamily: 'Outfit_400Regular',
    height: 80,
    textAlignVertical: 'top',
    marginBottom: 10,
  },
  photoPickerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  photoPickerBtn: {
    width: '48%',
    height: 40,
    borderRadius: 8,
    borderWidth: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  photoPickerBtnText: {
    fontSize: 11.5,
    fontFamily: 'Outfit_700Bold',
  },
  returnPhotoPreviewBox: {
    width: 72,
    height: 72,
    borderRadius: 8,
    borderWidth: 1,
    position: 'relative',
    marginBottom: 12,
  },
  returnPreviewImg: {
    width: '100%',
    height: '100%',
    borderRadius: 7,
  },
  removePhotoBadge: {
    position: 'absolute',
    top: -6,
    right: -6,
    backgroundColor: '#ef4444',
    width: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  refundSubtitle: {
    fontSize: 12,
    fontFamily: 'Outfit_400Regular',
    marginBottom: 10,
  },
  refundTabsContainer: {
    flexDirection: 'row',
    borderRadius: 8,
    padding: 3,
    marginBottom: 14,
  },
  refundTabBtn: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 8,
    borderRadius: 6,
  },
  refundTabBtnActive: {
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  refundTabBtnText: {
    fontSize: 12.5,
    fontFamily: 'Outfit_700Bold',
  },
  refundInputsGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 12.5,
    fontFamily: 'Outfit_700Bold',
    marginBottom: 5,
  },
  formInput: {
    borderWidth: 1,
    borderRadius: 8,
    height: 42,
    paddingHorizontal: 12,
    fontSize: 13,
    fontFamily: 'Outfit_500Medium',
  },
  inputHelper: {
    fontSize: 11,
    fontFamily: 'Outfit_400Regular',
    marginTop: 4,
  },
  modalActionButtonsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
    marginBottom: 20,
  },
  cancelModalBtn: {
    width: '38%',
    height: 42,
    borderRadius: 8,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cancelModalBtnText: {
    fontSize: 13.5,
    fontFamily: 'Outfit_700Bold',
  },
  submitModalBtn: {
    width: '58%',
    height: 42,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  submitModalBtnText: {
    color: '#ffffff',
    fontSize: 13.5,
    fontFamily: 'Outfit_800ExtraBold',
  },
  reviewProductHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)',
  },
  reviewProductThumb: {
    width: 48,
    height: 58,
    borderRadius: 6,
    marginRight: 12,
  },
  reviewProductTitle: {
    flex: 1,
    fontSize: 13.5,
    fontFamily: 'Outfit_700Bold',
  },
  reviewStarsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 6,
  },
  alertInfoBox: {
    borderRadius: 10,
    borderWidth: 1,
    padding: 12,
    marginBottom: 14,
  },
  alertInfoTitle: {
    fontSize: 13,
    fontFamily: 'Outfit_800ExtraBold',
  },
  alertInfoSub: {
    fontSize: 11.5,
    fontFamily: 'Outfit_400Regular',
    marginTop: 2,
    lineHeight: 16,
  },
  refundPendingCardBox: {
    borderRadius: 8,
    borderWidth: 1,
    padding: 10,
    marginTop: 10,
  },
  refundPendingCardTitle: {
    fontSize: 12.5,
    fontFamily: 'Outfit_800ExtraBold',
  },
  refundPendingStatusBadge: {
    backgroundColor: 'rgba(245, 158, 11, 0.2)',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 10,
  },
  refundPendingStatusText: {
    fontSize: 10.5,
    fontFamily: 'Outfit_800ExtraBold',
    color: '#d97706',
  },
  refundPendingDesc: {
    fontSize: 11.5,
    fontFamily: 'Outfit_400Regular',
    marginTop: 3,
    lineHeight: 16,
  },
  refundPendingDestText: {
    fontSize: 12,
    fontFamily: 'Outfit_500Medium',
  },
  refundPendingSubText: {
    fontSize: 11,
    fontFamily: 'Outfit_400Regular',
    marginLeft: 18,
    marginTop: 1,
  },
  refundPendingEta: {
    fontSize: 10.5,
    fontFamily: 'Outfit_400Regular',
    marginTop: 6,
    lineHeight: 14,
  },
});
