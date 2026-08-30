import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Modal,
  SafeAreaView,
  Platform,
} from 'react-native';
import { WebView } from 'react-native-webview';
import * as Location from 'expo-location';
import { LinearGradient } from 'expo-linear-gradient';
import { useAppTheme } from '../../context/ThemeContext';
import { useAppNavigation } from '../../context/NavigationContext';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';
import { useToast } from '../../context/ToastContext';
import API from '../../api/api';
import {
  MapPin,
  Phone,
  CreditCard,
  ChevronRight,
  Check,
  X,
  ShieldCheck,
  Navigation,
  Sparkles,
  Plus,
  Truck,
  Building2,
  CheckCircle2,
  Clock,
  Edit3,
} from 'lucide-react-native';

export default function CheckoutScreen() {
  const { user, addAddress } = useAuth();
  const { cart, clearCart, fetchCart } = useCart();
  const { colors, isDark } = useAppTheme();
  const { navigateTo, goBack } = useAppNavigation();
  const { showToast } = useToast();

  // Address Selection
  const [selectedAddressIndex, setSelectedAddressIndex] = useState(
    user && user.addresses && user.addresses.length > 0 ? 0 : -1
  );
  const [showAddressPickerModal, setShowAddressPickerModal] = useState(false);

  // Add / Auto-Detect Address Form
  const [showAddAddress, setShowAddAddress] = useState(
    !user?.addresses || user?.addresses?.length === 0
  );
  const [line1, setLine1] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [pincode, setPincode] = useState('');
  const [phone, setPhone] = useState('');
  const [addressSaving, setAddressSaving] = useState(false);
  const [detectingLocation, setDetectingLocation] = useState(false);

  // Pincode Serviceability
  const [checkingPincode, setCheckingPincode] = useState(false);
  const [pincodeStatus, setPincodeStatus] = useState(null);

  // Payment Options
  const [paymentMethod, setPaymentMethod] = useState('COD'); // 'COD' | 'RAZORPAY'

  // Placement / Simulation State
  const [placingOrder, setPlacingOrder] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [activeRazorpayOrder, setActiveRazorpayOrder] = useState(null);
  const [activeCreatedOrder, setActiveCreatedOrder] = useState(null);
  const [verifyingPayment, setVerifyingPayment] = useState(false);
  const [razorpayKeyId, setRazorpayKeyId] = useState('');

  const items = cart?.items || [];
  const itemsPrice = items.reduce((acc, item) => {
    const prod = item.product || {};
    const price =
      prod.discountPrice && prod.discountPrice < prod.price
        ? prod.discountPrice
        : prod.price || 0;
    return acc + price * item.qty;
  }, 0);
  const shippingPrice = 0; // FREE
  const discountSavings = items.reduce((acc, item) => {
    const prod = item.product || {};
    if (prod.discountPrice && prod.discountPrice < prod.price) {
      return acc + (prod.price - prod.discountPrice) * item.qty;
    }
    return acc;
  }, 0);
  const totalPrice = itemsPrice + shippingPrice;

  // Auto-Detect Location using GPS & Reverse Geocoding
  const handleAutoDetectLocation = async () => {
    setDetectingLocation(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        showToast('Location permission was denied. Please fill address manually.', 'warning');
        return;
      }

      showToast('Detecting current GPS location...', 'info');
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      const [geo] = await Location.reverseGeocodeAsync({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      });

      if (geo) {
        const detectedLine1 =
          [geo.name, geo.street, geo.district, geo.subregion]
            .filter(Boolean)
            .join(', ') || 'Current Location';
        const detectedCity = geo.city || geo.subregion || geo.district || '';
        const detectedState = geo.region || '';
        const detectedPincode = geo.postalCode || '';

        setLine1(detectedLine1);
        setCity(detectedCity);
        setState(detectedState);
        setPincode(detectedPincode);
        if (!phone && user?.addresses?.[0]?.phone) {
          setPhone(user.addresses[0].phone);
        }
        setShowAddAddress(true);

        if (detectedPincode && /^\d{6}$/.test(detectedPincode)) {
          handleCheckPincode(detectedPincode);
        }

        showToast('📍 Location auto-detected! You can refine or save below.', 'success');
      } else {
        showToast('Could not resolve street address from GPS coordinates.', 'warning');
      }
    } catch (err) {
      console.error('Location detection error:', err);
      showToast('Failed to auto-detect location. Please enter address manually.', 'error');
    } finally {
      setDetectingLocation(false);
    }
  };

  const handleCheckPincode = async (codeToCheck) => {
    if (!codeToCheck || !/^\d{6}$/.test(codeToCheck.trim())) {
      showToast('Please enter a valid 6-digit pincode.', 'warning');
      return;
    }

    setCheckingPincode(true);
    setPincodeStatus(null);
    try {
      const { data } = await API.post('/api/shipping/check-pincode', {
        pincode: codeToCheck,
      });
      setPincodeStatus({
        serviceable: data.serviceable,
        deliveryDays: data.deliveryDays || 3,
        courier: data.courier,
      });
    } catch (err) {
      setPincodeStatus({ serviceable: false });
    } finally {
      setCheckingPincode(false);
    }
  };

  const handleSaveAddress = async () => {
    if (!line1 || !city || !state || !pincode || !phone) {
      showToast('All address fields including phone are required.', 'warning');
      return;
    }
    if (!/^\d{6}$/.test(pincode.trim())) {
      showToast('Pincode must be exactly 6 digits.', 'warning');
      return;
    }
    if (!/^\d{10}$/.test(phone.trim())) {
      showToast('Phone must be a valid 10-digit number.', 'warning');
      return;
    }

    setAddressSaving(true);
    try {
      await addAddress({
        line1: line1.trim(),
        city: city.trim(),
        state: state.trim(),
        pincode: pincode.trim(),
        phone: phone.trim(),
      });
      setShowAddAddress(false);
      setSelectedAddressIndex(user?.addresses?.length || 0);
      setLine1('');
      setCity('');
      setState('');
      setPincode('');
      setPhone('');
      showToast('Address saved successfully!', 'success');
    } catch (err) {
      showToast(err.message || 'Failed to save address.', 'error');
    } finally {
      setAddressSaving(false);
    }
  };

  const handlePlaceOrder = async () => {
    if (selectedAddressIndex === -1 || !user.addresses[selectedAddressIndex]) {
      showToast('Please select or add a shipping address first.', 'warning');
      return;
    }

    const addr = user.addresses[selectedAddressIndex];
    setPlacingOrder(true);

    try {
      const { data } = await API.post('/api/orders', {
        shippingAddress: {
          line1: addr.line1,
          city: addr.city,
          state: addr.state,
          pincode: addr.pincode,
          phone: addr.phone,
        },
        paymentMethod,
      });

      if (paymentMethod === 'COD') {
        showToast('🎉 Order placed successfully! Thank you for choosing DEB CLOTHES.', 'success');
        clearCart();
        navigateTo('ORDERS');
      } else {
        setActiveCreatedOrder(data.order);
        setActiveRazorpayOrder(data.razorpayOrder);
        setShowPaymentModal(true);
      }
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to place order.', 'error');
    } finally {
      setPlacingOrder(false);
    }
  };

  const fetchKeyAndPlaceOrder = async () => {
    setPlacingOrder(true);
    try {
      const { data } = await API.get('/api/config/razorpay-key');
      setRazorpayKeyId(data.keyId);
    } catch (err) {
      setRazorpayKeyId('rzp_test_TFRco6NSCJg4ww');
    }
    handlePlaceOrder();
  };

  const handleWebViewMessage = async (event) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      if (data.status === 'success') {
        await handlePaymentSuccess(data);
      } else if (data.status === 'cancelled' || data.status === 'failed') {
        await handlePaymentFailed();
      }
    } catch (err) {
      console.log('Error parsing WebView message', err);
    }
  };

  const handlePaymentSuccess = async (paymentDetails) => {
    if (!activeCreatedOrder) return;
    setVerifyingPayment(true);
    try {
      await API.post('/api/orders/verify', {
        orderId: activeCreatedOrder._id,
        razorpay_order_id: paymentDetails.razorpay_order_id,
        razorpay_payment_id: paymentDetails.razorpay_payment_id,
        razorpay_signature: paymentDetails.razorpay_signature,
      });

      setShowPaymentModal(false);
      clearCart();
      showToast('Payment verified! Your order is confirmed.', 'success');
      navigateTo('ORDERS');
    } catch (err) {
      showToast(err.response?.data?.message || 'Signature verification failed.', 'error');
    } finally {
      setVerifyingPayment(false);
    }
  };

  const handlePaymentFailed = async () => {
    if (!activeCreatedOrder) return;
    setVerifyingPayment(true);
    try {
      await API.post(`/api/orders/${activeCreatedOrder._id}/payment-failed`);
      setShowPaymentModal(false);
      showToast('Payment was cancelled or failed.', 'error');
      await fetchCart();
      navigateTo('CART');
    } catch (err) {
      setShowPaymentModal(false);
      await fetchCart();
      navigateTo('CART');
    } finally {
      setVerifyingPayment(false);
    }
  };

  const getRazorpayHtml = () => {
    if (!activeRazorpayOrder) return '';

    const keyId = razorpayKeyId || 'rzp_test_TFRco6NSCJg4ww';
    const amount = activeRazorpayOrder.amount;
    const orderId = activeRazorpayOrder.id;
    const uName = user?.name || 'Customer';
    const uEmail = user?.email || 'customer@gmail.com';
    const uPhone =
      user?.addresses?.[selectedAddressIndex]?.phone || '9999999999';

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <script src="https://checkout.razorpay.com/v1/checkout.js"></script>
      </head>
      <body style="margin: 0; padding: 0; background-color: #0f172a; color: #fff; font-family: sans-serif;">
        <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100vh;">
          <h3 style="color: #a855f7; margin-bottom: 8px;">DEB CLOTHES</h3>
          <p style="color: #94a3b8; font-size: 14px;">Opening Secure Payment Gateway...</p>
        </div>
        <script>
          const options = {
            key: "${keyId}",
            amount: "${amount}",
            currency: "INR",
            name: "DEB CLOTHES",
            description: "Luxury Apparel Purchase",
            order_id: "${orderId}",
            handler: function (response) {
              window.ReactNativeWebView.postMessage(JSON.stringify({
                status: 'success',
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_order_id: response.razorpay_order_id,
                razorpay_signature: response.razorpay_signature
              }));
            },
            prefill: {
              name: "${uName}",
              email: "${uEmail}",
              contact: "${uPhone}"
            },
            theme: {
              color: "#7c3aed"
            },
            modal: {
              ondismiss: function() {
                window.ReactNativeWebView.postMessage(JSON.stringify({
                  status: 'cancelled'
                }));
              }
            }
          };
          const rzp = new Razorpay(options);
          rzp.on('payment.failed', function (response){
            window.ReactNativeWebView.postMessage(JSON.stringify({
              status: 'failed',
              error: response.error
            }));
          });
          window.onload = function() {
            rzp.open();
          };
        </script>
      </body>
      </html>
    `;
  };

  const currentAddress =
    user?.addresses && selectedAddressIndex >= 0
      ? user.addresses[selectedAddressIndex]
      : null;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header with Luxury Gradient Accent */}
      <LinearGradient
        colors={isDark ? ['#131122', '#1c1733'] : ['#ffffff', '#f5f3ff']}
        style={[styles.header, { borderBottomColor: colors.border }]}
      >
        <TouchableOpacity
          style={[
            styles.backBtn,
            { backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : '#ede9fe' },
          ]}
          onPress={goBack}
        >
          <X size={20} color={colors.primary} />
        </TouchableOpacity>
        <View style={styles.headerTitleGroup}>
          <Text style={[styles.headerTitle, { color: colors.text }]}>
            Secure Checkout
          </Text>
          <View style={styles.assuredBadge}>
            <Sparkles size={11} color="#ec4899" />
            <Text style={styles.assuredText}>100% Authentic & Protected</Text>
          </View>
        </View>
      </LinearGradient>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Step 1: Delivery Address & Auto Location */}
        <View
          style={[
            styles.card,
            {
              backgroundColor: colors.card,
              borderColor: colors.border,
              shadowColor: colors.primary,
            },
          ]}
        >
          <View style={styles.cardHeaderRow}>
            <View style={styles.stepBadge}>
              <Text style={styles.stepBadgeText}>1</Text>
            </View>
            <Text style={[styles.cardTitle, { color: colors.text }]}>
              Delivery Address
            </Text>
            {user?.addresses?.length > 1 && (
              <TouchableOpacity
                style={styles.changeAddressBtn}
                onPress={() => setShowAddressPickerModal(true)}
              >
                <Edit3 size={13} color={colors.primary} style={{ marginRight: 4 }} />
                <Text style={[styles.changeAddressText, { color: colors.primary }]}>
                  Change
                </Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Current Active Address Display */}
          {currentAddress ? (
            <View
              style={[
                styles.activeAddressBox,
                {
                  backgroundColor: isDark ? 'rgba(124, 58, 237, 0.08)' : '#f5f3ff',
                  borderColor: colors.primary,
                },
              ]}
            >
              <View style={styles.activeAddressHeader}>
                <View style={styles.activeAddressTitleRow}>
                  <MapPin size={16} color={colors.primary} />
                  <Text style={[styles.activeAddressTitle, { color: colors.text }]}>
                    Delivering To:
                  </Text>
                </View>
                <View style={[styles.selectedCheck, { backgroundColor: colors.primary }]}>
                  <Check size={11} color="#fff" />
                </View>
              </View>
              <Text style={[styles.activeAddressLine, { color: colors.text }]}>
                {currentAddress.line1}
              </Text>
              <Text style={[styles.activeAddressCity, { color: colors.textSecondary }]}>
                {currentAddress.city}, {currentAddress.state} - {currentAddress.pincode}
              </Text>
              <View style={styles.phoneRow}>
                <Phone size={13} color={colors.textSecondary} />
                <Text style={[styles.phoneText, { color: colors.textSecondary }]}>
                  {currentAddress.phone}
                </Text>
              </View>

              {/* Delivery Speed / Pincode Status */}
              <TouchableOpacity
                style={[styles.speedCheckBtn, { borderColor: isDark ? '#2e2448' : '#e9d5ff' }]}
                onPress={() => handleCheckPincode(currentAddress.pincode)}
              >
                <Truck size={14} color={colors.accent} />
                <Text style={[styles.speedCheckText, { color: colors.accent }]}>
                  Check Delivery Time to {currentAddress.pincode}
                </Text>
              </TouchableOpacity>
            </View>
          ) : (
            <Text style={[styles.noAddressNotice, { color: colors.textSecondary }]}>
              No delivery address chosen yet. Use GPS auto-detect or enter below.
            </Text>
          )}

          {/* Auto-Detect Location Button (One-Tap Instant GPS) */}
          <TouchableOpacity
            onPress={handleAutoDetectLocation}
            disabled={detectingLocation}
            activeOpacity={0.85}
            style={styles.autoDetectBtnWrapper}
          >
            <LinearGradient
              colors={['#ec4899', '#f43f5e', '#fb923c']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.autoDetectGradient}
            >
              {detectingLocation ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <>
                  <Navigation size={16} color="#fff" style={{ marginRight: 8 }} />
                  <Text style={styles.autoDetectText}>
                    📍 Auto-Detect My Current GPS Location
                  </Text>
                </>
              )}
            </LinearGradient>
          </TouchableOpacity>

          {/* Collapsible Manual Address Form */}
          {!showAddAddress ? (
            <TouchableOpacity
              style={[
                styles.manualToggleBtn,
                {
                  borderColor: isDark ? '#2e2448' : '#e9d5ff',
                  backgroundColor: isDark ? 'rgba(255,255,255,0.03)' : '#fff',
                },
              ]}
              onPress={() => setShowAddAddress(true)}
            >
              <Plus size={16} color={colors.primary} style={{ marginRight: 6 }} />
              <Text style={[styles.manualToggleText, { color: colors.primary }]}>
                Add Another Address Manually
              </Text>
            </TouchableOpacity>
          ) : (
            <View
              style={[
                styles.manualFormBox,
                {
                  backgroundColor: isDark ? '#161328' : '#faf5ff',
                  borderColor: isDark ? '#2e2448' : '#e9d5ff',
                },
              ]}
            >
              <View style={styles.formHeader}>
                <Text style={[styles.formTitle, { color: colors.text }]}>
                  {line1 ? 'Refine Auto-Detected Address' : 'Enter New Address'}
                </Text>
                {user?.addresses?.length > 0 && (
                  <TouchableOpacity onPress={() => setShowAddAddress(false)}>
                    <X size={18} color={colors.textSecondary} />
                  </TouchableOpacity>
                )}
              </View>

              <TextInput
                style={[
                  styles.formInput,
                  {
                    color: colors.text,
                    borderColor: isDark ? '#2e2448' : '#e9d5ff',
                    backgroundColor: isDark ? '#131122' : '#ffffff',
                  },
                ]}
                placeholder="House / Flat / Street / Landmark"
                placeholderTextColor={colors.textSecondary}
                value={line1}
                onChangeText={setLine1}
              />

              <View style={styles.formRow}>
                <TextInput
                  style={[
                    styles.formInputHalf,
                    {
                      color: colors.text,
                      borderColor: isDark ? '#2e2448' : '#e9d5ff',
                      backgroundColor: isDark ? '#131122' : '#ffffff',
                    },
                  ]}
                  placeholder="City"
                  placeholderTextColor={colors.textSecondary}
                  value={city}
                  onChangeText={setCity}
                />
                <TextInput
                  style={[
                    styles.formInputHalf,
                    {
                      color: colors.text,
                      borderColor: isDark ? '#2e2448' : '#e9d5ff',
                      backgroundColor: isDark ? '#131122' : '#ffffff',
                    },
                  ]}
                  placeholder="State"
                  placeholderTextColor={colors.textSecondary}
                  value={state}
                  onChangeText={setState}
                />
              </View>

              <View style={styles.formRow}>
                <TextInput
                  style={[
                    styles.formInputHalf,
                    {
                      color: colors.text,
                      borderColor: isDark ? '#2e2448' : '#e9d5ff',
                      backgroundColor: isDark ? '#131122' : '#ffffff',
                    },
                  ]}
                  placeholder="6-Digit Pincode"
                  placeholderTextColor={colors.textSecondary}
                  keyboardType="number-pad"
                  maxLength={6}
                  value={pincode}
                  onChangeText={(val) => {
                    setPincode(val);
                    if (val.length === 6) handleCheckPincode(val);
                  }}
                />
                <TextInput
                  style={[
                    styles.formInputHalf,
                    {
                      color: colors.text,
                      borderColor: isDark ? '#2e2448' : '#e9d5ff',
                      backgroundColor: isDark ? '#131122' : '#ffffff',
                    },
                  ]}
                  placeholder="10-Digit Mobile"
                  placeholderTextColor={colors.textSecondary}
                  keyboardType="phone-pad"
                  maxLength={10}
                  value={phone}
                  onChangeText={setPhone}
                />
              </View>

              <TouchableOpacity
                onPress={handleSaveAddress}
                disabled={addressSaving}
                activeOpacity={0.85}
                style={{ marginTop: 4 }}
              >
                <LinearGradient
                  colors={['#7c3aed', '#a855f7', '#ec4899']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.saveAddressGradient}
                >
                  {addressSaving ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <Text style={styles.saveAddressText}>Save & Use This Address</Text>
                  )}
                </LinearGradient>
              </TouchableOpacity>
            </View>
          )}

          {/* Delivery Pincode Status */}
          {pincodeStatus ? (
            <View
              style={[
                styles.pincodeResultBox,
                {
                  backgroundColor: pincodeStatus.serviceable
                    ? 'rgba(16, 185, 129, 0.12)'
                    : 'rgba(239, 68, 68, 0.12)',
                  borderColor: pincodeStatus.serviceable
                    ? colors.success
                    : colors.danger,
                },
              ]}
            >
              <Text
                style={[
                  styles.pincodeResultText,
                  {
                    color: pincodeStatus.serviceable
                      ? colors.success
                      : colors.danger,
                  },
                ]}
              >
                {pincodeStatus.serviceable
                  ? `⚡ Express Delivery available! Expected delivery in ~${pincodeStatus.deliveryDays} business days via ${pincodeStatus.courier || 'Express Hub'}.`
                  : '⚠️ Pincode is currently unserviceable for express delivery.'}
              </Text>
            </View>
          ) : checkingPincode ? (
            <ActivityIndicator
              size="small"
              color={colors.primary}
              style={{ marginTop: 10 }}
            />
          ) : null}
        </View>

        {/* Step 2: Payment Method */}
        <View
          style={[
            styles.card,
            {
              backgroundColor: colors.card,
              borderColor: colors.border,
              shadowColor: colors.primary,
            },
          ]}
        >
          <View style={styles.cardHeaderRow}>
            <View style={styles.stepBadge}>
              <Text style={styles.stepBadgeText}>2</Text>
            </View>
            <Text style={[styles.cardTitle, { color: colors.text }]}>
              Payment Option
            </Text>
          </View>

          {/* COD Option */}
          <TouchableOpacity
            style={[
              styles.paymentCard,
              {
                backgroundColor:
                  paymentMethod === 'COD'
                    ? isDark
                      ? 'rgba(124, 58, 237, 0.12)'
                      : '#f5f3ff'
                    : isDark
                    ? '#161328'
                    : '#fafafa',
                borderColor:
                  paymentMethod === 'COD' ? colors.primary : colors.border,
              },
            ]}
            onPress={() => setPaymentMethod('COD')}
            activeOpacity={0.85}
          >
            <View
              style={[
                styles.radioCircle,
                {
                  borderColor:
                    paymentMethod === 'COD' ? colors.primary : colors.textSecondary,
                },
              ]}
            >
              {paymentMethod === 'COD' && (
                <View
                  style={[
                    styles.radioInner,
                    { backgroundColor: colors.primary },
                  ]}
                />
              )}
            </View>
            <View style={styles.paymentInfo}>
              <View style={styles.paymentTitleRow}>
                <Truck size={18} color={colors.primary} style={{ marginRight: 8 }} />
                <Text style={[styles.paymentTitle, { color: colors.text }]}>
                  Cash on Delivery (COD)
                </Text>
              </View>
              <Text style={[styles.paymentDesc, { color: colors.textSecondary }]}>
                Pay cash at your doorstep when your package arrives.
              </Text>
            </View>
          </TouchableOpacity>

          {/* Online Payment Option */}
          <TouchableOpacity
            style={[
              styles.paymentCard,
              {
                backgroundColor:
                  paymentMethod === 'RAZORPAY'
                    ? isDark
                      ? 'rgba(124, 58, 237, 0.12)'
                      : '#f5f3ff'
                    : isDark
                    ? '#161328'
                    : '#fafafa',
                borderColor:
                  paymentMethod === 'RAZORPAY' ? colors.primary : colors.border,
              },
            ]}
            onPress={() => setPaymentMethod('RAZORPAY')}
            activeOpacity={0.85}
          >
            <View
              style={[
                styles.radioCircle,
                {
                  borderColor:
                    paymentMethod === 'RAZORPAY'
                      ? colors.primary
                      : colors.textSecondary,
                },
              ]}
            >
              {paymentMethod === 'RAZORPAY' && (
                <View
                  style={[
                    styles.radioInner,
                    { backgroundColor: colors.primary },
                  ]}
                />
              )}
            </View>
            <View style={styles.paymentInfo}>
              <View style={styles.paymentTitleRow}>
                <CreditCard size={18} color="#ec4899" style={{ marginRight: 8 }} />
                <Text style={[styles.paymentTitle, { color: colors.text }]}>
                  UPI / Cards / Net Banking
                </Text>
              </View>
              <Text style={[styles.paymentDesc, { color: colors.textSecondary }]}>
                Instant secure checkout via Google Pay, PhonePe, Paytm & Cards.
              </Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* Step 3: Luxury Price Summary */}
        <View
          style={[
            styles.card,
            {
              backgroundColor: colors.card,
              borderColor: colors.border,
              shadowColor: colors.primary,
            },
          ]}
        >
          <View style={styles.cardHeaderRow}>
            <View style={styles.stepBadge}>
              <Text style={styles.stepBadgeText}>3</Text>
            </View>
            <Text style={[styles.cardTitle, { color: colors.text }]}>
              Price Breakdown
            </Text>
          </View>

          <View style={styles.priceRow}>
            <Text style={[styles.priceLabel, { color: colors.textSecondary }]}>
              Items Total ({items.length} {items.length === 1 ? 'item' : 'items'})
            </Text>
            <Text style={[styles.priceValue, { color: colors.text }]}>
              ₹{itemsPrice + discountSavings}
            </Text>
          </View>

          {discountSavings > 0 && (
            <View style={styles.priceRow}>
              <Text style={[styles.priceLabel, { color: colors.success }]}>
                Special Discount Savings
              </Text>
              <Text style={[styles.priceValue, { color: colors.success }]}>
                - ₹{discountSavings}
              </Text>
            </View>
          )}

          <View style={styles.priceRow}>
            <Text style={[styles.priceLabel, { color: colors.textSecondary }]}>
              Express Delivery Charges
            </Text>
            <View style={styles.freeBadge}>
              <Text style={styles.freeBadgeText}>FREE</Text>
            </View>
          </View>

          <View
            style={[
              styles.priceDivider,
              { borderBottomColor: isDark ? '#2e2448' : '#e9d5ff' },
            ]}
          />

          <View style={styles.totalRow}>
            <View>
              <Text style={[styles.totalLabel, { color: colors.text }]}>
                Total Payable Amount
              </Text>
              <Text style={[styles.totalSub, { color: colors.textSecondary }]}>
                Inclusive of all taxes
              </Text>
            </View>
            <Text style={[styles.totalAmount, { color: colors.primary }]}>
              ₹{totalPrice}
            </Text>
          </View>
        </View>
      </ScrollView>

      {/* Fixed Luxury Bottom Checkout Bar */}
      <View
        style={[
          styles.footer,
          {
            backgroundColor: colors.card,
            borderTopColor: colors.border,
            shadowColor: '#000',
          },
        ]}
      >
        <View style={styles.footerPriceGroup}>
          <Text style={[styles.footerPriceLabel, { color: colors.textSecondary }]}>
            Total Amount
          </Text>
          <Text style={[styles.footerPriceValue, { color: colors.primary }]}>
            ₹{totalPrice}
          </Text>
        </View>

        <TouchableOpacity
          style={styles.placeOrderBtnWrapper}
          onPress={fetchKeyAndPlaceOrder}
          disabled={placingOrder}
          activeOpacity={0.85}
        >
          <LinearGradient
            colors={['#7c3aed', '#a855f7', '#ec4899']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.placeOrderGradient}
          >
            {placingOrder ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <>
                <Text style={styles.placeOrderBtnText}>Place Order Now</Text>
                <ChevronRight size={18} color="#fff" style={{ marginLeft: 4 }} />
              </>
            )}
          </LinearGradient>
        </TouchableOpacity>
      </View>

      {/* Saved Addresses Modal (Change Address Later) */}
      <Modal
        visible={showAddressPickerModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowAddressPickerModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View
            style={[
              styles.modalContent,
              { backgroundColor: isDark ? '#131122' : '#ffffff' },
            ]}
          >
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>
                Select Delivery Address
              </Text>
              <TouchableOpacity
                onPress={() => setShowAddressPickerModal(false)}
              >
                <X size={20} color={colors.text} />
              </TouchableOpacity>
            </View>

            <ScrollView style={{ maxHeight: 380 }}>
              {user?.addresses?.map((addr, idx) => (
                <TouchableOpacity
                  key={idx}
                  style={[
                    styles.modalAddressItem,
                    {
                      borderColor:
                        selectedAddressIndex === idx
                          ? colors.primary
                          : colors.border,
                      backgroundColor:
                        selectedAddressIndex === idx
                          ? isDark
                            ? 'rgba(124, 58, 237, 0.12)'
                            : '#f5f3ff'
                          : isDark
                          ? '#161328'
                          : '#fff',
                    },
                  ]}
                  onPress={() => {
                    setSelectedAddressIndex(idx);
                    setShowAddressPickerModal(false);
                    setPincodeStatus(null);
                    showToast(`Delivery switched to Address #${idx + 1}`, 'info');
                  }}
                >
                  <View style={styles.modalAddressHeader}>
                    <MapPin size={16} color={colors.primary} />
                    <Text style={[styles.modalAddressLabel, { color: colors.text }]}>
                      Address #{idx + 1}
                    </Text>
                    {selectedAddressIndex === idx && (
                      <View
                        style={[
                          styles.selectedCheck,
                          { backgroundColor: colors.primary },
                        ]}
                      >
                        <Check size={10} color="#fff" />
                      </View>
                    )}
                  </View>
                  <Text style={[styles.modalAddressText, { color: colors.textSecondary }]}>
                    {addr.line1}, {addr.city}, {addr.state} - {addr.pincode}
                  </Text>
                  <Text style={[styles.modalAddressPhone, { color: colors.textSecondary }]}>
                    📞 {addr.phone}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <TouchableOpacity
              style={styles.modalAddNewBtn}
              onPress={() => {
                setShowAddressPickerModal(false);
                setShowAddAddress(true);
              }}
            >
              <Text style={[styles.modalAddNewText, { color: colors.primary }]}>
                + Add a New Address Instead
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Razorpay WebView Payment Modal */}
      <Modal visible={showPaymentModal} transparent={false} animationType="slide">
        <SafeAreaView
          style={{ flex: 1, backgroundColor: isDark ? '#09090f' : '#ffffff' }}
        >
          <View
            style={[
              styles.webviewHeader,
              {
                backgroundColor: isDark ? '#131122' : '#ffffff',
                borderBottomColor: colors.border,
              },
            ]}
          >
            <Text style={[styles.webviewTitle, { color: colors.text }]}>
              Razorpay Secure Checkout
            </Text>
            <TouchableOpacity
              onPress={async () => {
                await handlePaymentFailed();
              }}
              style={styles.webviewCloseBtn}
            >
              <X size={20} color={colors.text} />
            </TouchableOpacity>
          </View>
          {activeRazorpayOrder && activeCreatedOrder && (
            <WebView
              source={{ html: getRazorpayHtml() }}
              onMessage={handleWebViewMessage}
              style={{ flex: 1 }}
              javaScriptEnabled={true}
              domStorageEnabled={true}
              originWhitelist={['*']}
            />
          )}
          {verifyingPayment && (
            <View style={styles.webviewLoadingOverlay}>
              <ActivityIndicator size="large" color="#a855f7" />
              <Text
                style={{
                  marginTop: 12,
                  fontFamily: 'Outfit_700Bold',
                  color: isDark ? '#fff' : '#000',
                }}
              >
                Verifying transaction security...
              </Text>
            </View>
          )}
        </SafeAreaView>
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
    paddingTop: Platform.OS === 'ios' ? 12 : 16,
    paddingBottom: 14,
    borderBottomWidth: 1,
  },
  backBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitleGroup: {
    marginLeft: 14,
    flex: 1,
  },
  headerTitle: {
    fontSize: 18,
    fontFamily: 'Outfit_900Black',
    letterSpacing: 0.5,
  },
  assuredBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  assuredText: {
    fontSize: 11,
    color: '#ec4899',
    fontFamily: 'Outfit_700Bold',
    marginLeft: 4,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 120,
  },
  card: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 18,
    marginBottom: 18,
    elevation: 3,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
  },
  stepBadge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#7c3aed',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  stepBadgeText: {
    color: '#fff',
    fontSize: 12,
    fontFamily: 'Outfit_900Black',
  },
  cardTitle: {
    fontSize: 16,
    fontFamily: 'Outfit_800ExtraBold',
    flex: 1,
  },
  changeAddressBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  changeAddressText: {
    fontSize: 13,
    fontFamily: 'Outfit_800ExtraBold',
  },
  activeAddressBox: {
    borderRadius: 14,
    borderWidth: 1.5,
    padding: 14,
    marginBottom: 14,
  },
  activeAddressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  activeAddressTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  activeAddressTitle: {
    fontSize: 13,
    fontFamily: 'Outfit_800ExtraBold',
    marginLeft: 6,
  },
  selectedCheck: {
    width: 18,
    height: 18,
    borderRadius: 9,
    justifyContent: 'center',
    alignItems: 'center',
  },
  activeAddressLine: {
    fontSize: 14,
    fontFamily: 'Outfit_600SemiBold',
    lineHeight: 20,
  },
  activeAddressCity: {
    fontSize: 13,
    fontFamily: 'Outfit_400Regular',
    marginTop: 2,
  },
  phoneRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  phoneText: {
    fontSize: 12,
    marginLeft: 6,
    fontFamily: 'Outfit_600SemiBold',
  },
  speedCheckBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
  },
  speedCheckText: {
    fontSize: 12,
    fontFamily: 'Outfit_700Bold',
    marginLeft: 6,
  },
  noAddressNotice: {
    fontSize: 13,
    marginBottom: 12,
    fontFamily: 'Outfit_500Medium',
    fontStyle: 'italic',
  },
  autoDetectBtnWrapper: {
    borderRadius: 14,
    overflow: 'hidden',
    marginBottom: 12,
  },
  autoDetectGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 48,
    paddingHorizontal: 16,
  },
  autoDetectText: {
    color: '#fff',
    fontSize: 13,
    fontFamily: 'Outfit_800ExtraBold',
    letterSpacing: 0.3,
  },
  manualToggleBtn: {
    height: 44,
    borderRadius: 12,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  manualToggleText: {
    fontSize: 13,
    fontFamily: 'Outfit_700Bold',
  },
  manualFormBox: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 14,
    marginTop: 8,
  },
  formHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  formTitle: {
    fontSize: 13,
    fontFamily: 'Outfit_800ExtraBold',
  },
  formInput: {
    borderWidth: 1,
    borderRadius: 10,
    height: 44,
    paddingHorizontal: 12,
    fontSize: 13,
    fontFamily: 'Outfit_500Medium',
    marginBottom: 10,
  },
  formRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  formInputHalf: {
    width: '48%',
    borderWidth: 1,
    borderRadius: 10,
    height: 44,
    paddingHorizontal: 12,
    fontSize: 13,
    fontFamily: 'Outfit_500Medium',
  },
  saveAddressGradient: {
    height: 44,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  saveAddressText: {
    color: '#fff',
    fontSize: 13,
    fontFamily: 'Outfit_800ExtraBold',
  },
  pincodeResultBox: {
    borderWidth: 1,
    borderRadius: 10,
    padding: 10,
    marginTop: 12,
  },
  pincodeResultText: {
    fontSize: 12,
    fontFamily: 'Outfit_700Bold',
    lineHeight: 18,
  },
  paymentCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderRadius: 14,
    padding: 14,
    marginBottom: 12,
  },
  radioCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  radioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  paymentInfo: {
    marginLeft: 12,
    flex: 1,
  },
  paymentTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  paymentTitle: {
    fontSize: 14,
    fontFamily: 'Outfit_800ExtraBold',
  },
  paymentDesc: {
    fontSize: 12,
    fontFamily: 'Outfit_400Regular',
    marginTop: 2,
    lineHeight: 16,
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  priceLabel: {
    fontSize: 13,
    fontFamily: 'Outfit_500Medium',
  },
  priceValue: {
    fontSize: 13,
    fontFamily: 'Outfit_700Bold',
  },
  freeBadge: {
    backgroundColor: '#10b98120',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  freeBadgeText: {
    color: '#10b981',
    fontSize: 11,
    fontFamily: 'Outfit_900Black',
  },
  priceDivider: {
    borderBottomWidth: 1,
    marginVertical: 10,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
  },
  totalLabel: {
    fontSize: 15,
    fontFamily: 'Outfit_900Black',
  },
  totalSub: {
    fontSize: 11,
    fontFamily: 'Outfit_400Regular',
    marginTop: 2,
  },
  totalAmount: {
    fontSize: 20,
    fontFamily: 'Outfit_900Black',
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: Platform.OS === 'ios' ? 28 : 16,
    borderTopWidth: 1,
    elevation: 8,
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
  },
  footerPriceGroup: {
    flex: 1,
  },
  footerPriceLabel: {
    fontSize: 11,
    fontFamily: 'Outfit_600SemiBold',
  },
  footerPriceValue: {
    fontSize: 20,
    fontFamily: 'Outfit_900Black',
  },
  placeOrderBtnWrapper: {
    borderRadius: 14,
    overflow: 'hidden',
    flex: 1.4,
  },
  placeOrderGradient: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    height: 48,
    paddingHorizontal: 16,
  },
  placeOrderBtnText: {
    color: '#fff',
    fontSize: 15,
    fontFamily: 'Outfit_900Black',
    letterSpacing: 0.5,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.65)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 17,
    fontFamily: 'Outfit_900Black',
  },
  modalAddressItem: {
    borderRadius: 14,
    borderWidth: 1.5,
    padding: 14,
    marginBottom: 12,
  },
  modalAddressHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  modalAddressLabel: {
    fontSize: 13,
    fontFamily: 'Outfit_800ExtraBold',
    marginLeft: 6,
    flex: 1,
  },
  modalAddressText: {
    fontSize: 13,
    fontFamily: 'Outfit_500Medium',
    lineHeight: 18,
  },
  modalAddressPhone: {
    fontSize: 12,
    fontFamily: 'Outfit_600SemiBold',
    marginTop: 4,
  },
  modalAddNewBtn: {
    paddingVertical: 14,
    alignItems: 'center',
  },
  modalAddNewText: {
    fontSize: 14,
    fontFamily: 'Outfit_800ExtraBold',
  },
  webviewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
  },
  webviewTitle: {
    fontSize: 16,
    fontFamily: 'Outfit_800ExtraBold',
  },
  webviewCloseBtn: {
    padding: 4,
  },
  webviewLoadingOverlay: {
    position: 'absolute',
    top: 60,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
});
