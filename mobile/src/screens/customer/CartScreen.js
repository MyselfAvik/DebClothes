import React from 'react';
import {
  StyleSheet,
  Text,
  View,
  FlatList,
  Image,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useAppTheme } from '../../context/ThemeContext';
import { useAppNavigation } from '../../context/NavigationContext';
import { useCart } from '../../context/CartContext';
import { useToast } from '../../context/ToastContext';
import { Trash2, Minus, Plus, ShoppingCart, ArrowRight, Sparkles } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';

const getImageUrl = (imagePath) => {
  if (!imagePath) return 'https://images.unsplash.com/photo-1523381210434-271e8be1f52b?auto=format&fit=crop&q=80&w=150';
  if (imagePath.startsWith('http')) return imagePath;
  return `https://debclothes-backend.onrender.com/${imagePath}`;
};

export default function CartScreen() {
  const { cart, cartLoading, updateCartItemQty, removeFromCart, getCartCount } = useCart();
  const { colors } = useAppTheme();
  const { navigateTo } = useAppNavigation();
  const { showToast } = useToast();

  const handleQtyChange = async (itemId, currentQty, delta) => {
    const newQty = currentQty + delta;
    if (newQty < 1) return;

    const item = items.find(i => i._id === itemId);
    if (!item) return;

    const prod = item.product || {};
    const sizeConfig = prod.sizes?.find(s => s.size === item.size);
    const stock = sizeConfig ? sizeConfig.stock : 0;

    if (newQty > 5) {
      showToast('Maximum quantity of 5 items reached.', 'warning');
      return;
    }
    if (newQty > stock) {
      showToast(`Only ${stock} items left in stock for size ${item.size}.`, 'warning');
      return;
    }

    try {
      await updateCartItemQty(itemId, newQty);
    } catch (err) {
      showToast(err.message || 'Failed to update quantity', 'error');
    }
  };

  const handleRemove = (itemId) => {
    Alert.alert('Remove Item', 'Are you sure you want to remove this item from your cart?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove',
        style: 'destructive',
        onPress: async () => {
          try {
            await removeFromCart(itemId);
            showToast('Item removed from cart.', 'info');
          } catch (err) {
            showToast(err.message || 'Failed to remove item', 'error');
          }
        },
      },
    ]);
  };

  const items = cart?.items || [];
  const itemsPrice = items.reduce((acc, item) => {
    const prod = item.product || {};
    const price = prod.discountPrice && prod.discountPrice < prod.price ? prod.discountPrice : (prod.price || 0);
    return acc + price * item.qty;
  }, 0);
  const shippingPrice = 0;
  const totalPrice = itemsPrice + shippingPrice;

  const renderCartItem = ({ item }) => {
    const prod = item.product || {};
    const imgUrl = getImageUrl(prod.images?.[0]);

    return (
      <View style={[styles.cartItem, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <Image source={{ uri: imgUrl }} style={styles.itemImage} />
        <View style={styles.itemInfo}>
          <Text style={[styles.itemName, { color: colors.text }]} numberOfLines={1}>
            {prod.title}
          </Text>
          <Text style={[styles.itemDetail, { color: colors.textSecondary }]}>
            Size: <Text style={{ fontFamily: 'Outfit_700Bold', color: colors.text }}>{item.size}</Text>
          </Text>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Text style={[styles.itemPrice, { color: colors.primary }]}>
              ₹{prod.discountPrice && prod.discountPrice < prod.price ? prod.discountPrice : prod.price}
            </Text>
            {prod.discountPrice && prod.discountPrice < prod.price && (
              <Text style={{ fontSize: 11, marginLeft: 6, color: colors.textSecondary, textDecorationLine: 'line-through' }}>
                ₹{prod.price}
              </Text>
            )}
          </View>

          {/* Quantity Actions */}
          <View style={styles.actionsRow}>
            <View style={[styles.qtyControl, { borderColor: colors.border }]}>
              <TouchableOpacity
                style={styles.qtyBtn}
                onPress={() => handleQtyChange(item._id, item.qty, -1)}
              >
                <Minus size={16} color={colors.text} />
              </TouchableOpacity>
              <Text style={[styles.qtyVal, { color: colors.text }]}>{item.qty}</Text>
              <TouchableOpacity
                style={styles.qtyBtn}
                onPress={() => handleQtyChange(item._id, item.qty, 1)}
              >
                <Plus size={16} color={colors.text} />
              </TouchableOpacity>
            </View>

            <TouchableOpacity style={styles.deleteBtn} onPress={() => handleRemove(item._id)}>
              <Trash2 size={18} color="#ef4444" />
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  };

  if (items.length === 0) {
    return (
      <View style={[styles.emptyContainer, { backgroundColor: colors.background }]}>
        <ShoppingCart size={64} color={colors.textSecondary} style={{ marginBottom: 16 }} />
        <Text style={[styles.emptyText, { color: colors.text }]}>Your Cart is Empty</Text>
        <Text style={[styles.emptySub, { color: colors.textSecondary }]}>
          Explore our premium clothing products and add style to your wardrobe!
        </Text>
        <TouchableOpacity
          style={[styles.shopBtn, { backgroundColor: colors.primary }]}
          onPress={() => navigateTo('HOME')}
        >
          <Text style={styles.shopBtnText}>Shop Now</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Text style={[styles.pageTitle, { color: colors.text }]}>Shopping Bag</Text>

      <FlatList
        data={items}
        renderItem={renderCartItem}
        keyExtractor={(item) => item._id}
        contentContainerStyle={styles.listContent}
        ListHeaderComponent={
          <View style={[styles.progressCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[styles.progressSuccessText, { color: colors.success }]}>
              🎉 Yay! Enjoy FREE Delivery on all orders today!
            </Text>
          </View>
        }
        ListFooterComponent={
          <View style={[styles.summaryCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[styles.summaryTitle, { color: colors.text }]}>Order Summary</Text>
            
            <View style={styles.summaryRow}>
              <Text style={{ color: colors.textSecondary, fontFamily: 'Outfit_400Regular' }}>Items Subtotal</Text>
              <Text style={{ color: colors.text, fontFamily: 'Outfit_700Bold' }}>₹{itemsPrice}</Text>
            </View>

            <View style={styles.summaryRow}>
              <Text style={{ color: colors.textSecondary, fontFamily: 'Outfit_400Regular' }}>Shipping Fee</Text>
              <Text style={{ color: colors.text, fontFamily: 'Outfit_700Bold' }}>
                {shippingPrice === 0 ? 'FREE' : `₹${shippingPrice}`}
              </Text>
            </View>

            <View style={[styles.divider, { borderBottomColor: colors.border }]} />

            <View style={styles.summaryRow}>
              <Text style={[styles.totalLabel, { color: colors.text }]}>Total Amount</Text>
              <Text style={[styles.totalVal, { color: colors.primary }]}>₹{totalPrice}</Text>
            </View>

            {cartLoading ? (
              <ActivityIndicator size="small" color={colors.primary} style={{ marginVertical: 10 }} />
            ) : null}
          </View>
        }
      />

      {/* Sticky Bottom Checkout Footer */}
      <View style={[styles.checkoutFooter, { backgroundColor: colors.card, borderTopColor: colors.border }]}>
        <TouchableOpacity
          style={styles.checkoutBtnWrapper}
          onPress={() => navigateTo('CHECKOUT')}
          activeOpacity={0.85}
        >
          <LinearGradient
            colors={['#7c3aed', '#a855f7', '#ec4899']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.checkoutBtn}
          >
            <Text style={styles.checkoutBtnText}>Proceed to Checkout (₹{totalPrice})</Text>
            <ArrowRight size={20} color="#fff" style={styles.checkoutIcon} />
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  pageTitle: {
    fontSize: 24,
    fontFamily: 'Outfit_900Black',
    padding: 16,
  },
  listContent: {
    padding: 16,
    paddingBottom: 100,
  },
  cartItem: {
    flexDirection: 'row',
    borderRadius: 14,
    borderWidth: 1,
    padding: 12,
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
  itemImage: {
    width: 90,
    height: 110,
    borderRadius: 10,
  },
  itemInfo: {
    flex: 1,
    marginLeft: 14,
    justifyContent: 'space-between',
  },
  itemName: {
    fontSize: 16,
    fontFamily: 'Outfit_700Bold',
  },
  itemDetail: {
    fontSize: 13,
    fontFamily: 'Outfit_500Medium',
  },
  itemPrice: {
    fontSize: 16,
    fontFamily: 'Outfit_800ExtraBold',
  },
  actionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  qtyControl: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 8,
    width: 100,
    height: 32,
  },
  qtyBtn: {
    width: 30,
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  qtyVal: {
    flex: 1,
    textAlign: 'center',
    fontSize: 14,
    fontFamily: 'Outfit_700Bold',
  },
  deleteBtn: {
    padding: 6,
  },
  summaryCard: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 16,
    marginTop: 10,
  },
  summaryTitle: {
    fontSize: 16,
    fontFamily: 'Outfit_800ExtraBold',
    marginBottom: 12,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: 6,
  },
  divider: {
    borderBottomWidth: 1,
    marginVertical: 10,
  },
  totalLabel: {
    fontSize: 16,
    fontFamily: 'Outfit_800ExtraBold',
  },
  totalVal: {
    fontSize: 18,
    fontFamily: 'Outfit_900Black',
  },
  checkoutFooter: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 74,
    borderTopWidth: 1,
    paddingHorizontal: 16,
    justifyContent: 'center',
  },
  checkoutBtnWrapper: {
    borderRadius: 14,
    overflow: 'hidden',
  },
  checkoutBtn: {
    height: 48,
    borderRadius: 14,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  progressCard: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 14,
    marginBottom: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
  },
  progressSuccessText: {
    fontSize: 13,
    fontFamily: 'Outfit_800ExtraBold',
    textAlign: 'center',
  },
  progressInfoText: {
    fontSize: 12.5,
    fontFamily: 'Outfit_700Bold',
    marginBottom: 8,
    textAlign: 'center',
  },
  progressBarTrack: {
    height: 6,
    borderRadius: 3,
    width: '100%',
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 3,
  },
  checkoutBtnText: {
    color: '#fff',
    fontSize: 16,
    fontFamily: 'Outfit_800ExtraBold',
  },
  checkoutIcon: {
    marginLeft: 8,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 30,
  },
  emptyText: {
    fontSize: 22,
    fontFamily: 'Outfit_900Black',
    marginBottom: 8,
  },
  emptySub: {
    fontSize: 14,
    fontFamily: 'Outfit_400Regular',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
  },
  shopBtn: {
    paddingHorizontal: 28,
    paddingVertical: 12,
    borderRadius: 10,
  },
  shopBtnText: {
    color: '#fff',
    fontSize: 15,
    fontFamily: 'Outfit_700Bold',
  },
});
