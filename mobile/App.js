import React from 'react';
import { StyleSheet, View, Text, TextInput, SafeAreaView, TouchableOpacity, StatusBar, ActivityIndicator, Platform } from 'react-native';
import {
  useFonts,
  Outfit_400Regular,
  Outfit_500Medium,
  Outfit_600SemiBold,
  Outfit_700Bold,
  Outfit_800ExtraBold,
  Outfit_900Black,
} from '@expo-google-fonts/outfit';

// Set Global Outfit typography across all Text & TextInput components
if (Text.defaultProps == null) Text.defaultProps = {};
Text.defaultProps.style = { fontFamily: 'Outfit_500Medium' };

if (TextInput.defaultProps == null) TextInput.defaultProps = {};
TextInput.defaultProps.style = { fontFamily: 'Outfit_500Medium' };
import { AuthProvider, useAuth } from './src/context/AuthContext';
import { CartProvider, useCart } from './src/context/CartContext';
import { ThemeProvider, useAppTheme } from './src/context/ThemeContext';
import { NavigationProvider, useAppNavigation } from './src/context/NavigationContext';
import { ToastProvider } from './src/context/ToastContext';
import { WishlistProvider } from './src/context/WishlistContext';

// Import Screens
import LoginScreen from './src/screens/auth/LoginScreen';
import RegisterScreen from './src/screens/auth/RegisterScreen';
import OtpVerificationScreen from './src/screens/auth/OtpVerificationScreen';

import HomeScreen from './src/screens/customer/HomeScreen';
import ProductDetailScreen from './src/screens/customer/ProductDetailScreen';
import CartScreen from './src/screens/customer/CartScreen';
import CheckoutScreen from './src/screens/checkout/CheckoutScreen';
import MyOrdersScreen from './src/screens/customer/MyOrdersScreen';
import ProfileScreen from './src/screens/customer/ProfileScreen';
import WishlistScreen from './src/screens/customer/WishlistScreen';

import AdminDashboard from './src/screens/admin/AdminDashboard';
import ManageProducts from './src/screens/admin/ManageProducts';
import AddEditProduct from './src/screens/admin/AddEditProduct';
import ManageOrders from './src/screens/admin/ManageOrders';
import ManageRefunds from './src/screens/admin/ManageRefunds';
import ManageCustomers from './src/screens/admin/ManageCustomers';

// Icons
import { Home, ShoppingCart, Briefcase, User, Shield, Moon, Sun, ArrowLeftRight, Package, Heart, Sparkles, RotateCcw } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';

function AppContent() {
  const { user, loading: authLoading } = useAuth();
  const { cart, getCartCount } = useCart();
  const { themeMode, toggleTheme, colors, isDark } = useAppTheme();
  const { currentScreen, navigateTo } = useAppNavigation();

  if (authLoading) {
    return (
      <View style={[styles.loadingCenter, { backgroundColor: isDark ? '#09090f' : '#f8f7ff' }]}>
        <View style={styles.splashLogoContainer}>
          <LinearGradient
            colors={['#7c3aed', '#a855f7', '#ec4899']}
            style={styles.splashLogoWrapper}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <Sparkles size={42} color="#ffffff" />
          </LinearGradient>
          <Text style={[styles.splashTitle, { color: isDark ? '#fdf4ff' : '#1e1b4b' }]}>DEB CLOTHES</Text>
          <Text style={[styles.splashSubtitle, { color: isDark ? '#a78bfa' : '#7c3aed' }]}>
            Haute Couture • Premium Experience
          </Text>
        </View>
        <ActivityIndicator size="large" color="#a855f7" style={{ marginTop: 24 }} />
      </View>
    );
  }

  // Redirect to login if user not authenticated and not on register/otp screens
  const isAuthScreen = ['LOGIN', 'REGISTER', 'OTP_VERIFICATION'].includes(currentScreen);
  const activeUser = !!user;

  // Decide current active page layout
  let ScreenComponent = HomeScreen;
  let layout = 'customer'; // 'auth' | 'customer' | 'admin'

  // Map public screens first
  if (currentScreen === 'HOME') {
    ScreenComponent = HomeScreen;
    layout = 'customer';
  } else if (currentScreen === 'PRODUCT_DETAIL') {
    ScreenComponent = ProductDetailScreen;
    layout = 'customer';
  } else if (!activeUser) {
    layout = 'auth';
    if (currentScreen === 'REGISTER') {
      ScreenComponent = RegisterScreen;
    } else if (currentScreen === 'OTP_VERIFICATION') {
      ScreenComponent = OtpVerificationScreen;
    } else {
      ScreenComponent = LoginScreen;
    }
  } else {
    // Authenticated screens mapping
    switch (currentScreen) {
      case 'CART':
        ScreenComponent = CartScreen;
        layout = 'customer';
        break;
      case 'WISHLIST':
        ScreenComponent = WishlistScreen;
        layout = 'customer';
        break;
      case 'CHECKOUT':
        ScreenComponent = CheckoutScreen;
        layout = 'customer';
        break;
      case 'ORDERS':
        ScreenComponent = MyOrdersScreen;
        layout = 'customer';
        break;
      case 'PROFILE':
        ScreenComponent = ProfileScreen;
        layout = 'customer';
        break;

      // Admin screens
      case 'ADMIN_DASHBOARD':
        ScreenComponent = AdminDashboard;
        layout = 'admin';
        break;
      case 'ADMIN_PRODUCTS':
        ScreenComponent = ManageProducts;
        layout = 'admin';
        break;
      case 'ADMIN_ADD_EDIT_PRODUCT':
        ScreenComponent = AddEditProduct;
        layout = 'admin';
        break;
      case 'ADMIN_ORDERS':
        ScreenComponent = ManageOrders;
        layout = 'admin';
        break;
      case 'ADMIN_REFUNDS':
        ScreenComponent = ManageRefunds;
        layout = 'admin';
        break;
      case 'ADMIN_CUSTOMERS':
        ScreenComponent = ManageCustomers;
        layout = 'admin';
        break;
      
      default:
        ScreenComponent = HomeScreen;
        layout = 'customer';
    }
  }

  const cartBadgeCount = getCartCount();
  const isAdmin = user && user.role === 'admin';

  return (
    <SafeAreaView
      style={[
        styles.safeArea,
        {
          backgroundColor:
            layout === 'auth'
              ? isDark ? '#07070d' : '#fbfaff'
              : currentScreen === 'HOME'
              ? isDark ? '#131122' : '#7c3aed'
              : colors.background,
          paddingTop: currentScreen === 'HOME' || layout === 'auth' ? 0 : (Platform.OS === 'android' ? (StatusBar.currentHeight || 28) : 0),
        },
      ]}
    >
      <StatusBar
        barStyle={currentScreen === 'HOME' || layout === 'auth' ? 'light-content' : isDark ? 'light-content' : 'dark-content'}
        backgroundColor={
          layout === 'auth'
            ? isDark ? '#07070d' : '#fbfaff'
            : currentScreen === 'HOME'
            ? isDark ? '#131122' : '#7c3aed'
            : colors.card
        }
        translucent={false}
      />



      {/* Main Body */}
      <View style={styles.body}>
        <ScreenComponent />
      </View>

      {/* Navigation Bars (Only for customer layout) */}
      {layout === 'customer' && (
        <View style={[styles.tabBar, { backgroundColor: colors.card, borderTopColor: colors.border }]}>
          <TouchableOpacity style={styles.tabItem} onPress={() => navigateTo('HOME')}>
            <Home size={22} color={currentScreen === 'HOME' ? colors.primary : colors.textSecondary} />
            <Text
              style={[
                styles.tabLabel,
                { color: currentScreen === 'HOME' ? colors.primary : colors.textSecondary },
              ]}
            >
              Shop
            </Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.tabItem} onPress={() => activeUser ? navigateTo('WISHLIST') : navigateTo('LOGIN')}>
            <Heart size={22} color={currentScreen === 'WISHLIST' ? colors.primary : colors.textSecondary} />
            <Text
              style={[
                styles.tabLabel,
                { color: currentScreen === 'WISHLIST' ? colors.primary : colors.textSecondary },
              ]}
            >
              Wishlist
            </Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.tabItem} onPress={() => activeUser ? navigateTo('CART') : navigateTo('LOGIN')}>
            <View>
              <ShoppingCart size={22} color={currentScreen === 'CART' ? colors.primary : colors.textSecondary} />
              {cartBadgeCount > 0 && (
                <View style={[styles.badge, { backgroundColor: colors.danger }]}>
                  <Text style={styles.badgeText}>{cartBadgeCount}</Text>
                </View>
              )}
            </View>
            <Text
              style={[
                styles.tabLabel,
                { color: currentScreen === 'CART' ? colors.primary : colors.textSecondary },
              ]}
            >
              Bag
            </Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.tabItem} onPress={() => activeUser ? navigateTo('ORDERS') : navigateTo('LOGIN')}>
            <Briefcase size={22} color={currentScreen === 'ORDERS' ? colors.primary : colors.textSecondary} />
            <Text
              style={[
                styles.tabLabel,
                { color: currentScreen === 'ORDERS' ? colors.primary : colors.textSecondary },
              ]}
            >
              Orders
            </Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.tabItem} onPress={() => activeUser ? navigateTo('PROFILE') : navigateTo('LOGIN')}>
            <User size={22} color={currentScreen === 'PROFILE' ? colors.primary : colors.textSecondary} />
            <Text
              style={[
                styles.tabLabel,
                { color: currentScreen === 'PROFILE' ? colors.primary : colors.textSecondary },
              ]}
            >
              Profile
            </Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Admin Tab Bar Navigation */}
      {activeUser && layout === 'admin' && (
        <View style={[styles.tabBar, { backgroundColor: colors.card, borderTopColor: colors.border }]}>
          <TouchableOpacity style={styles.tabItem} onPress={() => navigateTo('ADMIN_DASHBOARD')}>
            <Shield size={22} color={currentScreen === 'ADMIN_DASHBOARD' ? colors.success : colors.textSecondary} />
            <Text
              style={[
                styles.tabLabel,
                { color: currentScreen === 'ADMIN_DASHBOARD' ? colors.success : colors.textSecondary },
              ]}
            >
              Stats
            </Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.tabItem} onPress={() => navigateTo('ADMIN_PRODUCTS')}>
            <Package size={22} color={currentScreen === 'ADMIN_PRODUCTS' ? colors.success : colors.textSecondary} />
            <Text
              style={[
                styles.tabLabel,
                { color: currentScreen === 'ADMIN_PRODUCTS' ? colors.success : colors.textSecondary },
              ]}
            >
              Catalog
            </Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.tabItem} onPress={() => navigateTo('ADMIN_ORDERS')}>
            <ShoppingCart size={20} color={currentScreen === 'ADMIN_ORDERS' ? colors.success : colors.textSecondary} />
            <Text
              style={[
                styles.tabLabel,
                { color: currentScreen === 'ADMIN_ORDERS' ? colors.success : colors.textSecondary },
              ]}
            >
              Orders
            </Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.tabItem} onPress={() => navigateTo('ADMIN_REFUNDS')}>
            <RotateCcw size={20} color={currentScreen === 'ADMIN_REFUNDS' ? colors.success : colors.textSecondary} />
            <Text
              style={[
                styles.tabLabel,
                { color: currentScreen === 'ADMIN_REFUNDS' ? colors.success : colors.textSecondary },
              ]}
            >
              Refunds
            </Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.tabItem} onPress={() => navigateTo('ADMIN_CUSTOMERS')}>
            <User size={20} color={currentScreen === 'ADMIN_CUSTOMERS' ? colors.success : colors.textSecondary} />
            <Text
              style={[
                styles.tabLabel,
                { color: currentScreen === 'ADMIN_CUSTOMERS' ? colors.success : colors.textSecondary },
              ]}
            >
              Roles
            </Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.tabItem} onPress={() => navigateTo('HOME')}>
            <Home size={20} color={colors.textSecondary} />
            <Text style={[styles.tabLabel, { color: colors.textSecondary }]}>Shop Mode</Text>
          </TouchableOpacity>
        </View>
      )}
    </SafeAreaView>
  );
}

export default function App() {
  const [fontsLoaded, fontError] = useFonts({
    Outfit_400Regular,
    Outfit_500Medium,
    Outfit_600SemiBold,
    Outfit_700Bold,
    Outfit_800ExtraBold,
    Outfit_900Black,
  });

  if (!fontsLoaded && !fontError) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#09090f' }}>
        <ActivityIndicator size="large" color="#a855f7" />
      </View>
    );
  }

  return (
    <ThemeProvider>
      <ToastProvider>
        <AuthProvider>
          <CartProvider>
            <WishlistProvider>
              <NavigationProvider>
                <AppContent />
              </NavigationProvider>
            </WishlistProvider>
          </CartProvider>
        </AuthProvider>
      </ToastProvider>
    </ThemeProvider>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  loadingCenter: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  splashLogoContainer: {
    alignItems: 'center',
  },
  splashLogoWrapper: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    marginBottom: 18,
  },
  splashTitle: {
    fontSize: 24,
    fontWeight: '900',
    letterSpacing: 2,
  },
  splashSubtitle: {
    fontSize: 13,
    marginTop: 6,
    fontWeight: '600',
  },
  header: {
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    borderBottomWidth: 1,
  },
  logoText: {
    fontSize: 18,
    fontWeight: '900',
    letterSpacing: 1.5,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerBtn: {
    padding: 8,
    marginRight: 8,
  },
  adminToggleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  adminToggleText: {
    fontSize: 11,
    fontWeight: 'bold',
    marginLeft: 4,
  },
  body: {
    flex: 1,
  },
  tabBar: {
    height: Platform.OS === 'ios' ? 76 : 64,
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    borderTopWidth: 1,
    paddingTop: 6,
    paddingBottom: Platform.OS === 'ios' ? 20 : 8,
  },
  tabItem: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
  },
  tabLabel: {
    fontSize: 10,
    marginTop: 4,
    fontWeight: '600',
  },
  badge: {
    position: 'absolute',
    top: -4,
    right: -10,
    borderRadius: 8,
    paddingHorizontal: 5,
    paddingVertical: 1,
    minWidth: 16,
    height: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  badgeText: {
    color: '#fff',
    fontSize: 9,
    fontWeight: 'bold',
  },
});
