import React from 'react';
import {
  StyleSheet,
  Text,
  View,
  FlatList,
  Image,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { useAppTheme } from '../../context/ThemeContext';
import { useAppNavigation } from '../../context/NavigationContext';
import { useWishlist } from '../../context/WishlistContext';
import { Heart, Star } from 'lucide-react-native';

const { width } = Dimensions.get('window');

const getImageUrl = (imagePath) => {
  if (!imagePath) return 'https://images.unsplash.com/photo-1523381210434-271e8be1f52b?auto=format&fit=crop&q=80&w=150';
  if (imagePath.startsWith('http')) return imagePath;
  return `https://debclothes-backend.onrender.com/${imagePath}`;
};

export default function WishlistScreen() {
  const { wishlist, toggleWishlist } = useWishlist();
  const { colors } = useAppTheme();
  const { navigateTo } = useAppNavigation();

  const renderProductItem = ({ item }) => {
    const isDiscounted = item.discountPrice && item.discountPrice < item.price;
    const finalPrice = isDiscounted ? item.discountPrice : item.price;

    return (
      <View style={[styles.productCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <TouchableOpacity
          activeOpacity={0.9}
          onPress={() => navigateTo('PRODUCT_DETAIL', { id: item._id })}
        >
          <Image source={{ uri: getImageUrl(item.images?.[0]) }} style={styles.productImage} />
          
          <TouchableOpacity
            style={styles.wishlistBadge}
            onPress={() => toggleWishlist(item)}
            activeOpacity={0.7}
          >
            <Heart size={14} color="#ef4444" fill="#ef4444" />
          </TouchableOpacity>
        </TouchableOpacity>

        <View style={styles.productInfo}>
          <Text style={[styles.productTitle, { color: colors.text }]} numberOfLines={1}>
            {item.title}
          </Text>

          <View style={styles.assuredContainer}>
            <Text style={styles.assuredText}>Assured</Text>
          </View>

          <View style={styles.priceRow}>
            <Text style={[styles.productPrice, { color: colors.text }]}>₹{finalPrice}</Text>
            {isDiscounted && (
              <>
                <Text style={styles.productMrp}>₹{item.price}</Text>
                <Text style={styles.discountPercent}>
                  {Math.round(((item.price - item.discountPrice) / item.price) * 100)}% off
                </Text>
              </>
            )}
          </View>

          <View style={styles.ratingRow}>
            <Star size={11} color="#fbbf24" fill="#fbbf24" />
            <Text style={[styles.ratingText, { color: colors.text }]}>
              {item.ratingAverage ? item.ratingAverage.toFixed(1) : '0.0'} ({item.reviews?.length || 0})
            </Text>
          </View>
        </View>
      </View>
    );
  };

  if (wishlist.length === 0) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={[styles.header, { borderBottomColor: colors.border }]}>
          <Text style={[styles.headerTitle, { color: colors.text }]}>My Wishlist</Text>
        </View>
        <View style={styles.emptyContainer}>
          <Heart size={64} color={colors.textSecondary} style={{ marginBottom: 16 }} />
          <Text style={[styles.emptyText, { color: colors.text }]}>Your Wishlist is Empty</Text>
          <Text style={[styles.emptySub, { color: colors.textSecondary }]}>
            Tap the heart icon on any product to save it to your wishlist here!
          </Text>
          <TouchableOpacity
            style={[styles.shopBtn, { backgroundColor: colors.primary }]}
            onPress={() => navigateTo('HOME')}
          >
            <Text style={styles.shopBtnText}>Explore Shop</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <Text style={[styles.headerTitle, { color: colors.text }]}>My Wishlist ({wishlist.length})</Text>
      </View>

      <FlatList
        data={wishlist}
        renderItem={renderProductItem}
        keyExtractor={(item) => item._id}
        numColumns={2}
        columnWrapperStyle={styles.columnWrapper}
        contentContainerStyle={styles.listContent}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    height: 52,
    justifyContent: 'center',
    paddingHorizontal: 16,
    borderBottomWidth: 0.5,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '900',
  },
  listContent: {
    padding: 12,
  },
  columnWrapper: {
    justifyContent: 'space-between',
  },
  productCard: {
    width: (width - 32) / 2,
    borderRadius: 8,
    borderWidth: 0.5,
    marginBottom: 12,
    overflow: 'hidden',
  },
  productImage: {
    width: '100%',
    height: 190,
  },
  wishlistBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(255,255,255,0.9)',
    width: 26,
    height: 26,
    borderRadius: 13,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 2,
  },
  productInfo: {
    padding: 10,
  },
  productTitle: {
    fontSize: 12.5,
    fontWeight: '700',
  },
  assuredContainer: {
    backgroundColor: '#fff9e6',
    borderWidth: 0.5,
    borderColor: '#fcd34d',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    alignSelf: 'flex-start',
    marginVertical: 4,
  },
  assuredText: {
    color: '#b45309',
    fontSize: 9,
    fontWeight: '900',
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    marginTop: 2,
  },
  productPrice: {
    fontSize: 14,
    fontWeight: '900',
  },
  productMrp: {
    fontSize: 11,
    color: '#878787',
    textDecorationLine: 'line-through',
    marginLeft: 6,
  },
  discountPercent: {
    fontSize: 11,
    color: '#388e3c',
    fontWeight: '800',
    marginLeft: 6,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
  },
  ratingText: {
    fontSize: 10,
    fontWeight: '700',
    marginLeft: 4,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '900',
    marginBottom: 8,
  },
  emptySub: {
    fontSize: 13.5,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
  },
  shopBtn: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  shopBtnText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '800',
  },
});
