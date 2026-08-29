import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { useAppTheme } from '../../context/ThemeContext';
import { useAppNavigation } from '../../context/NavigationContext';
import API from '../../api/api';
import {
  TrendingUp,
  ShoppingBag,
  AlertTriangle,
  Users,
  ArrowRight,
  RotateCcw,
  Package,
  Shield,
  Home,
  CheckCircle,
  XCircle,
  Clock,
  Sparkles,
} from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';

export default function AdminDashboard() {
  const [orders, setOrders] = useState([]);
  const [products, setProducts] = useState([]);
  const [usersCount, setUsersCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  const { colors, isDark } = useAppTheme();
  const { navigateTo } = useAppNavigation();

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async (isPullToRefresh = false) => {
    if (isPullToRefresh) setRefreshing(true);
    else setLoading(true);
    setError('');

    try {
      const [ordersRes, productsRes, usersRes] = await Promise.all([
        API.get('/api/orders'),
        API.get('/api/products', { params: { limit: 100 } }),
        API.get('/api/auth/users'),
      ]);

      setOrders(ordersRes.data || []);
      setProducts(productsRes.data?.products || []);
      setUsersCount(usersRes.data?.length || 0);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch admin dashboard stats');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Business Analytics Calculations
  const completedOrders = orders.filter(
    (o) => o.paymentStatus === 'paid' || o.orderStatus === 'delivered'
  );
  const totalRevenue = completedOrders.reduce((sum, o) => sum + (o.totalAmount || 0), 0);
  const lowStockCount = products.filter((p) =>
    p.sizes?.some((s) => s.stock <= 3)
  ).length;

  const pendingReturns = orders.filter(
    (o) => o.orderStatus === 'return_requested' || o.orderStatus === 'return_approved' || o.orderStatus === 'out_for_pickup' || o.orderStatus === 'returning_to_seller'
  );
  const returnRequestedCount = orders.filter((o) => o.orderStatus === 'return_requested').length;
  const cancelledOrdersCount = orders.filter((o) => o.orderStatus === 'cancelled').length;

  if (loading && !refreshing) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={[styles.loadingText, { color: colors.textSecondary }]}>Loading Admin Dashboard...</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={styles.scrollContent}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={() => fetchStats(true)} colors={[colors.primary]} />
      }
    >
      {/* Hero Welcome Banner */}
      <LinearGradient
        colors={isDark ? ['#1e1b4b', '#311042', '#09090f'] : ['#ede9fe', '#fce7f3', '#ffffff']}
        style={[styles.heroCard, { borderColor: isDark ? 'rgba(168, 85, 247, 0.2)' : '#e9d5ff' }]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <View style={styles.heroHeader}>
          <View>
            <View style={styles.badgeAdmin}>
              <Shield size={12} color={colors.primary} style={{ marginRight: 4 }} />
              <Text style={[styles.badgeAdminText, { color: colors.primary }]}>ADMINISTRATION CONSOLE</Text>
            </View>
            <Text style={[styles.heroTitle, { color: colors.text }]}>Store Overview</Text>
            <Text style={[styles.heroSub, { color: colors.textSecondary }]}>Real-time sales, inventory, and refunds</Text>
          </View>
          <View style={[styles.heroLogo, { backgroundColor: isDark ? 'rgba(124, 58, 237, 0.2)' : '#ffffff' }]}>
            <Sparkles size={24} color={colors.primary} />
          </View>
        </View>

        <View style={[styles.revenueRow, { backgroundColor: isDark ? 'rgba(0,0,0,0.3)' : 'rgba(255,255,255,0.7)' }]}>
          <View>
            <Text style={[styles.revenueLabel, { color: colors.textSecondary }]}>Gross Settled Revenue</Text>
            <Text style={[styles.revenueVal, { color: colors.text }]}>₹{totalRevenue.toLocaleString()}</Text>
          </View>
          <View style={styles.revenueBadge}>
            <TrendingUp size={14} color="#10b981" style={{ marginRight: 4 }} />
            <Text style={styles.revenueBadgeText}>{completedOrders.length} Paid</Text>
          </View>
        </View>
      </LinearGradient>

      {/* Pending Return Requests Alert Card (if any pending returns exist) */}
      {returnRequestedCount > 0 && (
        <TouchableOpacity
          style={[styles.alertBanner, { backgroundColor: 'rgba(245, 158, 11, 0.12)', borderColor: 'rgba(245, 158, 11, 0.3)' }]}
          onPress={() => navigateTo('ADMIN_REFUNDS')}
        >
          <View style={styles.alertIconWrapper}>
            <RotateCcw size={18} color="#f59e0b" />
          </View>
          <View style={{ flex: 1, marginLeft: 10 }}>
            <Text style={styles.alertTitle}>{returnRequestedCount} Return Request(s) Awaiting Review</Text>
            <Text style={styles.alertSub}>Tap to view customer reasons, proof photos, and refund details.</Text>
          </View>
          <ArrowRight size={18} color="#f59e0b" />
        </TouchableOpacity>
      )}

      {error ? <Text style={[styles.errorText, { color: colors.danger }]}>{error}</Text> : null}

      {/* 4-Stat Metrics Grid */}
      <Text style={[styles.sectionTitle, { color: colors.text }]}>Key Store Metrics</Text>
      <View style={styles.grid}>
        {/* Total Orders */}
        <TouchableOpacity
          style={[styles.statCard, { backgroundColor: colors.card, borderColor: colors.border }]}
          onPress={() => navigateTo('ADMIN_ORDERS')}
        >
          <View style={[styles.statIconBg, { backgroundColor: 'rgba(59, 130, 246, 0.12)' }]}>
            <ShoppingBag size={20} color="#3b82f6" />
          </View>
          <Text style={[styles.statVal, { color: colors.text }]}>{orders.length}</Text>
          <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Total Orders</Text>
        </TouchableOpacity>

        {/* Refunds & Returns */}
        <TouchableOpacity
          style={[styles.statCard, { backgroundColor: colors.card, borderColor: colors.border }]}
          onPress={() => navigateTo('ADMIN_REFUNDS')}
        >
          <View style={[styles.statIconBg, { backgroundColor: 'rgba(245, 158, 11, 0.12)' }]}>
            <RotateCcw size={20} color="#f59e0b" />
          </View>
          <Text style={[styles.statVal, { color: colors.text }]}>{pendingReturns.length}</Text>
          <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Active Returns</Text>
        </TouchableOpacity>

        {/* Low Stock Items */}
        <TouchableOpacity
          style={[styles.statCard, { backgroundColor: colors.card, borderColor: colors.border }]}
          onPress={() => navigateTo('ADMIN_PRODUCTS')}
        >
          <View style={[styles.statIconBg, { backgroundColor: 'rgba(239, 68, 68, 0.12)' }]}>
            <AlertTriangle size={20} color="#ef4444" />
          </View>
          <Text style={[styles.statVal, { color: colors.text }]}>{lowStockCount}</Text>
          <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Low Stock Items</Text>
        </TouchableOpacity>

        {/* Customers */}
        <TouchableOpacity
          style={[styles.statCard, { backgroundColor: colors.card, borderColor: colors.border }]}
          onPress={() => navigateTo('ADMIN_CUSTOMERS')}
        >
          <View style={[styles.statIconBg, { backgroundColor: 'rgba(168, 85, 247, 0.12)' }]}>
            <Users size={20} color="#a855f7" />
          </View>
          <Text style={[styles.statVal, { color: colors.text }]}>{usersCount}</Text>
          <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Registered Users</Text>
        </TouchableOpacity>
      </View>

      {/* Management Navigation Hub */}
      <Text style={[styles.sectionTitle, { color: colors.text }]}>Management Hub</Text>
      
      <View style={styles.menuList}>
        {/* Refunds & Returns Hub */}
        <TouchableOpacity
          style={[styles.menuItem, { backgroundColor: colors.card, borderColor: colors.border }]}
          onPress={() => navigateTo('ADMIN_REFUNDS')}
        >
          <View style={[styles.menuIconBg, { backgroundColor: 'rgba(245, 158, 11, 0.12)' }]}>
            <RotateCcw size={20} color="#f59e0b" />
          </View>
          <View style={styles.menuMeta}>
            <Text style={[styles.menuItemTitle, { color: colors.text }]}>Refunds & Returns Management</Text>
            <Text style={[styles.menuItemSub, { color: colors.textSecondary }]}>
              Verify return reasons, proof photos & process payouts
            </Text>
          </View>
          {returnRequestedCount > 0 && (
            <View style={styles.badgeCount}>
              <Text style={styles.badgeCountText}>{returnRequestedCount}</Text>
            </View>
          )}
          <ArrowRight size={18} color={colors.textSecondary} />
        </TouchableOpacity>

        {/* Orders Management */}
        <TouchableOpacity
          style={[styles.menuItem, { backgroundColor: colors.card, borderColor: colors.border }]}
          onPress={() => navigateTo('ADMIN_ORDERS')}
        >
          <View style={[styles.menuIconBg, { backgroundColor: 'rgba(59, 130, 246, 0.12)' }]}>
            <ShoppingBag size={20} color="#3b82f6" />
          </View>
          <View style={styles.menuMeta}>
            <Text style={[styles.menuItemTitle, { color: colors.text }]}>Customer Orders</Text>
            <Text style={[styles.menuItemSub, { color: colors.textSecondary }]}>
              Dispatch, fulfill, and update tracking stages
            </Text>
          </View>
          <ArrowRight size={18} color={colors.textSecondary} />
        </TouchableOpacity>

        {/* Catalog Products */}
        <TouchableOpacity
          style={[styles.menuItem, { backgroundColor: colors.card, borderColor: colors.border }]}
          onPress={() => navigateTo('ADMIN_PRODUCTS')}
        >
          <View style={[styles.menuIconBg, { backgroundColor: 'rgba(16, 185, 129, 0.12)' }]}>
            <Package size={20} color="#10b981" />
          </View>
          <View style={styles.menuMeta}>
            <Text style={[styles.menuItemTitle, { color: colors.text }]}>Catalog Products</Text>
            <Text style={[styles.menuItemSub, { color: colors.textSecondary }]}>
              Add new apparel, manage size inventory & pricing
            </Text>
          </View>
          <ArrowRight size={18} color={colors.textSecondary} />
        </TouchableOpacity>

        {/* Customer Roles */}
        <TouchableOpacity
          style={[styles.menuItem, { backgroundColor: colors.card, borderColor: colors.border }]}
          onPress={() => navigateTo('ADMIN_CUSTOMERS')}
        >
          <View style={[styles.menuIconBg, { backgroundColor: 'rgba(168, 85, 247, 0.12)' }]}>
            <Users size={20} color="#a855f7" />
          </View>
          <View style={styles.menuMeta}>
            <Text style={[styles.menuItemTitle, { color: colors.text }]}>Customer & Admin Roles</Text>
            <Text style={[styles.menuItemSub, { color: colors.textSecondary }]}>
              Grant or revoke staff & administrator permissions
            </Text>
          </View>
          <ArrowRight size={18} color={colors.textSecondary} />
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  heroCard: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 20,
    marginBottom: 16,
  },
  heroHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  badgeAdmin: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  badgeAdminText: {
    fontSize: 10,
    fontFamily: 'Outfit_900Black',
    letterSpacing: 1,
  },
  heroTitle: {
    fontSize: 22,
    fontFamily: 'Outfit_900Black',
  },
  heroSub: {
    fontSize: 12,
    fontFamily: 'Outfit_500Medium',
    marginTop: 2,
  },
  heroLogo: {
    width: 44,
    height: 44,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  revenueRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderRadius: 14,
    padding: 14,
    marginTop: 18,
  },
  revenueLabel: {
    fontSize: 11,
    fontFamily: 'Outfit_700Bold',
    textTransform: 'uppercase',
  },
  revenueVal: {
    fontSize: 22,
    fontFamily: 'Outfit_900Black',
    marginTop: 2,
  },
  revenueBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  revenueBadgeText: {
    color: '#10b981',
    fontSize: 11,
    fontFamily: 'Outfit_800ExtraBold',
  },
  alertBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 14,
    borderWidth: 1,
    padding: 14,
    marginBottom: 18,
  },
  alertIconWrapper: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(245, 158, 11, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  alertTitle: {
    fontSize: 13,
    fontFamily: 'Outfit_800ExtraBold',
    color: '#f59e0b',
  },
  alertSub: {
    fontSize: 11,
    fontFamily: 'Outfit_500Medium',
    color: '#d97706',
    marginTop: 2,
  },
  sectionTitle: {
    fontSize: 16,
    fontFamily: 'Outfit_900Black',
    marginBottom: 12,
    marginTop: 6,
    letterSpacing: 0.5,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  statCard: {
    width: '48%',
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    marginBottom: 14,
    elevation: 2,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
  },
  statIconBg: {
    width: 38,
    height: 38,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  statVal: {
    fontSize: 20,
    fontFamily: 'Outfit_900Black',
  },
  statLabel: {
    fontSize: 12,
    fontFamily: 'Outfit_600SemiBold',
    marginTop: 2,
  },
  menuList: {
    marginBottom: 20,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 12,
    elevation: 1,
  },
  menuIconBg: {
    width: 42,
    height: 42,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  menuMeta: {
    flex: 1,
    marginLeft: 14,
    marginRight: 8,
  },
  menuItemTitle: {
    fontSize: 14,
    fontFamily: 'Outfit_800ExtraBold',
  },
  menuItemSub: {
    fontSize: 11,
    fontFamily: 'Outfit_400Regular',
    marginTop: 2,
    lineHeight: 15,
  },
  badgeCount: {
    backgroundColor: '#f59e0b',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    marginRight: 8,
  },
  badgeCountText: {
    color: '#ffffff',
    fontSize: 11,
    fontFamily: 'Outfit_900Black',
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
    fontFamily: 'Outfit_600SemiBold',
  },
  errorText: {
    fontFamily: 'Outfit_700Bold',
    marginBottom: 12,
    textAlign: 'center',
  },
});
