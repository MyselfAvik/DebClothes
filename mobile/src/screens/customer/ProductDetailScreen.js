import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  Image,
  TouchableOpacity,
  ActivityIndicator,
  Dimensions,
  TextInput,
  Alert,
  Modal,
} from 'react-native';
import { useAppTheme } from '../../context/ThemeContext';
import { useAppNavigation } from '../../context/NavigationContext';
import { useCart } from '../../context/CartContext';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { useWishlist } from '../../context/WishlistContext';
import API from '../../api/api';
import { ArrowLeft, Star, ShoppingCart, Minus, Plus, Heart, XCircle } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';

const getImageUrl = (imagePath) => {
  if (!imagePath) return 'https://images.unsplash.com/photo-1523381210434-271e8be1f52b?auto=format&fit=crop&q=80&w=600';
  if (imagePath.startsWith('http')) return imagePath;
  return `https://debclothes-backend.onrender.com/${imagePath}`;
};

const { width } = Dimensions.get('window');

export default function ProductDetailScreen() {
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedImage, setSelectedImage] = useState('');
  const [selectedSize, setSelectedSize] = useState('');
  const [qty, setQty] = useState(1);
  const [adding, setAdding] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);



  const { colors, isDark } = useAppTheme();
  const { screenParams, navigateTo, goBack } = useAppNavigation();
  const { user } = useAuth();
  const { addToCart, cart } = useCart();
  const { showToast } = useToast();
  const { toggleWishlist, isWishlisted } = useWishlist();
  const [fullscreenImage, setFullscreenImage] = useState(null);

  const wishlisted = product ? isWishlisted(product._id) : false;

  const productId = screenParams.id;

  useEffect(() => {
    fetchProductDetails();
  }, [productId]);

  const fetchProductDetails = async () => {
    setLoading(true);
    setError('');
    try {
      const { data } = await API.get(`/api/products/${productId}`);
      const mappedImages = data.images?.map(img => getImageUrl(img)) || [];
      setProduct({ ...data, images: mappedImages });
      if (mappedImages.length > 0) {
        setSelectedImage(mappedImages[0]);
      }
      if (data.sizes && data.sizes.length > 0) {
        setSelectedSize(data.sizes[0].size);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load details');
    } finally {
      setLoading(false);
    }
  };

  const handleAddToCart = async () => {
    if (!user) {
      showToast('Please sign in to add items to your shopping bag.', 'warning');
      navigateTo('LOGIN');
      return;
    }

    if (!selectedSize) {
      showToast('Please select a size first.', 'warning');
      return;
    }

    const selectedSizeConfig = product?.sizes?.find(s => s.size === selectedSize);
    const selectedSizeStock = selectedSizeConfig ? selectedSizeConfig.stock : 0;

    if (selectedSizeStock < qty) {
      showToast('Insufficient stock for this size.', 'error');
      return;
    }

    const cartItem = cart?.items?.find(i => i.product?._id === productId && i.size === selectedSize);
    const currentCartQty = cartItem ? cartItem.qty : 0;

    if (currentCartQty + qty > 5) {
      showToast(`You can purchase a maximum of 5 units of this item. You already have ${currentCartQty} in your bag.`, 'warning');
      return;
    }

    if (currentCartQty + qty > selectedSizeStock) {
      showToast(`Insufficient stock! You already have ${currentCartQty} in your bag and only ${selectedSizeStock} are available.`, 'error');
      return;
    }

    setAdding(true);
    try {
      await addToCart(productId, selectedSize, qty);
      showToast('Item successfully added to your bag!', 'success');
    } catch (err) {
      showToast(err.message || 'Failed to add item', 'error');
    } finally {
      setAdding(false);
    }
  };

  const handleBuyNow = async () => {
    if (!user) {
      showToast('Please sign in to make a purchase.', 'warning');
      navigateTo('LOGIN');
      return;
    }

    if (!selectedSize) {
      showToast('Please select a size first.', 'warning');
      return;
    }

    const selectedSizeConfig = product?.sizes?.find(s => s.size === selectedSize);
    const selectedSizeStock = selectedSizeConfig ? selectedSizeConfig.stock : 0;

    if (selectedSizeStock < qty) {
      showToast('Insufficient stock for this size.', 'error');
      return;
    }

    const cartItem = cart?.items?.find(i => i.product?._id === productId && i.size === selectedSize);
    const currentCartQty = cartItem ? cartItem.qty : 0;

    if (currentCartQty + qty > 5) {
      showToast(`You can purchase a maximum of 5 units of this item. You already have ${currentCartQty} in your bag.`, 'warning');
      return;
    }

    if (currentCartQty + qty > selectedSizeStock) {
      showToast(`Insufficient stock! You already have ${currentCartQty} in your bag and only ${selectedSizeStock} are available.`, 'error');
      return;
    }

    setAdding(true);
    try {
      await addToCart(productId, selectedSize, qty);
      showToast('Redirecting to checkout...', 'success');
      navigateTo('CART');
    } catch (err) {
      showToast(err.message || 'Failed to add item', 'error');
    } finally {
      setAdding(false);
    }
  };



  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.header}>
          <TouchableOpacity style={[styles.backBtnWrapper, { backgroundColor: colors.card }]} onPress={goBack}>
            <ArrowLeft size={20} color={colors.text} />
          </TouchableOpacity>
        </View>
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <View style={[styles.skeletonHero, { backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)' }]} />
          <View style={{ padding: 16 }}>
            <View style={[styles.skeletonLine, { width: '70%', height: 24, borderRadius: 6, backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)' }]} />
            <View style={[styles.skeletonLine, { width: '40%', height: 20, marginTop: 12, borderRadius: 6, backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)' }]} />
            <View style={[styles.skeletonLine, { width: '90%', height: 12, marginTop: 24, borderRadius: 4, backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)' }]} />
            <View style={[styles.skeletonLine, { width: '85%', height: 12, marginTop: 8, borderRadius: 4, backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)' }]} />
            <View style={[styles.skeletonLine, { width: '60%', height: 12, marginTop: 8, borderRadius: 4, backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)' }]} />
          </View>
        </ScrollView>
      </View>
    );
  }

  if (error || !product) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <Text style={[styles.errorText, { color: colors.danger }]}>{error || 'Product not found'}</Text>
        <TouchableOpacity style={[styles.backBtn, { backgroundColor: colors.primary }]} onPress={goBack}>
          <Text style={{ color: '#fff', fontWeight: 'bold' }}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Back Header */}
      <View style={styles.header}>
        <TouchableOpacity style={[styles.iconButton, { backgroundColor: colors.card }]} onPress={goBack}>
          <ArrowLeft size={20} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]} numberOfLines={1}>
          {product.title}
        </Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Main Product Image */}
        {/* Swiper Image Gallery */}
        <View style={styles.mainImageContainer}>
          <ScrollView
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onScroll={(e) => {
              const contentOffset = e.nativeEvent.contentOffset.x;
              const viewSize = e.nativeEvent.layoutMeasurement.width;
              const index = Math.round(contentOffset / viewSize);
              setCurrentImageIndex(index);
            }}
            scrollEventThrottle={16}
          >
            {product.images?.map((img, idx) => (
              <Image key={idx} source={{ uri: img }} style={styles.mainImage} resizeMode="cover" />
            ))}
          </ScrollView>

          {/* Dots Indicator Overlay */}
          {product.images && product.images.length > 1 && (
            <View style={styles.galleryIndicatorsRow}>
              {product.images.map((_, idx) => (
                <View
                  key={idx}
                  style={[
                    styles.galleryDot,
                    {
                      backgroundColor: currentImageIndex === idx ? '#2874f0' : 'rgba(0,0,0,0.2)',
                      width: currentImageIndex === idx ? 16 : 6,
                    },
                  ]}
                />
              ))}
            </View>
          )}

          {/* Wishlist Heart Icon Badge */}
          <TouchableOpacity
            style={[styles.detailsWishlistBadge, { backgroundColor: isDark ? '#1e293b' : 'rgba(255,255,255,0.9)' }]}
            onPress={() => toggleWishlist(product)}
            activeOpacity={0.8}
          >
            <Heart size={20} color={wishlisted ? '#ef4444' : (isDark ? '#fff' : '#666')} fill={wishlisted ? '#ef4444' : 'none'} />
          </TouchableOpacity>
        </View>

        {/* Product Details Section */}
        <View style={styles.detailsContainer}>
          <Text style={[styles.category, { color: colors.textSecondary }]}>
            {product.category?.toUpperCase()}
          </Text>
          <Text style={[styles.name, { color: colors.text }]}>{product.title}</Text>

          {/* Pricing & Rating */}
          <View style={styles.row}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Text style={[styles.price, { color: colors.primary }]}>
                ₹{product.discountPrice && product.discountPrice < product.price ? product.discountPrice : product.price}
              </Text>
              {product.discountPrice && product.discountPrice < product.price && (
                <Text style={[styles.detailMrpText, { color: colors.textSecondary }]}>
                  ₹{product.price}
                </Text>
              )}
            </View>
            <View style={styles.ratingBox}>
              <Star size={16} color="#fbbf24" fill="#fbbf24" />
              <Text style={[styles.ratingVal, { color: colors.text }]}>
                {product.ratingAverage ? product.ratingAverage.toFixed(1) : '0.0'} ({product.reviews?.length || 0})
              </Text>
            </View>
          </View>

          <Text style={[styles.sectionHeading, { color: colors.text }]}>Description</Text>
          <Text style={[styles.description, { color: colors.textSecondary }]}>
            {product.description || 'No description available for this premium garment.'}
          </Text>

          {/* Sizes Selector */}
          {product.sizes && product.sizes.length > 0 ? (
            <>
              <Text style={[styles.sectionHeading, { color: colors.text }]}>Select Size</Text>
              <View style={styles.sizeRow}>
                {product.sizes.map((sz) => {
                  const isOutOfStock = sz.stock <= 0;
                  return (
                    <TouchableOpacity
                      key={sz.size}
                      style={[
                        styles.sizeBox,
                        {
                          borderColor: selectedSize === sz.size ? colors.primary : colors.border,
                          backgroundColor: selectedSize === sz.size ? colors.primary : colors.card,
                          opacity: isOutOfStock ? 0.35 : 1,
                        },
                      ]}
                      onPress={() => {
                        if (isOutOfStock) {
                          showToast(`Size ${sz.size} is currently out of stock.`, 'info');
                          return;
                        }
                        setSelectedSize(sz.size);
                      }}
                    >
                      <Text
                        style={[
                          styles.sizeText,
                          {
                            color: selectedSize === sz.size ? '#fff' : colors.text,
                            textDecorationLine: isOutOfStock ? 'line-through' : 'none',
                          },
                        ]}
                      >
                        {sz.size}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </>
          ) : null}

          {/* Quantity Selector */}
          <Text style={[styles.sectionHeading, { color: colors.text }]}>Quantity</Text>
          <View style={[styles.qtyRow, { borderColor: colors.border }]}>
            <TouchableOpacity
              style={styles.qtyBtn}
              onPress={() => qty > 1 && setQty(qty - 1)}
            >
              <Minus size={18} color={colors.text} />
            </TouchableOpacity>
            <Text style={[styles.qtyVal, { color: colors.text }]}>{qty}</Text>
            <TouchableOpacity
              style={styles.qtyBtn}
              onPress={() => {
                const selectedSizeConfig = product?.sizes?.find(s => s.size === selectedSize);
                const selectedSizeStock = selectedSizeConfig ? selectedSizeConfig.stock : 0;

                if (qty >= 5) {
                  showToast('Maximum quantity of 5 items reached.', 'warning');
                  return;
                }
                if (qty >= selectedSizeStock) {
                  showToast(`Only ${selectedSizeStock} items left in stock for size ${selectedSize || 'selected'}.`, 'warning');
                  return;
                }
                setQty(qty + 1);
              }}
            >
              <Plus size={18} color={colors.text} />
            </TouchableOpacity>
          </View>

          <View style={[styles.divider, { borderBottomColor: colors.border }]} />

          {/* Product Reviews */}
          <Text style={[styles.sectionHeading, { color: colors.text, marginBottom: 12 }]}>
            Customer Reviews
          </Text>

          {product.reviews && product.reviews.length > 0 ? (
            product.reviews.map((rev) => (
              <View
                key={rev._id}
                style={[styles.reviewCard, { backgroundColor: colors.card, borderColor: colors.border }]}
              >
                <View style={styles.reviewHeader}>
                  <Text style={[styles.reviewUser, { color: colors.text }]}>{rev.name}</Text>
                  <View style={styles.ratingBox}>
                    <Star size={12} color="#fbbf24" fill="#fbbf24" />
                    <Text style={[styles.ratingVal, { color: colors.text }]}>{rev.rating}</Text>
                  </View>
                </View>
                <Text style={[styles.reviewComment, { color: colors.textSecondary }]}>
                  {rev.comment}
                </Text>
                {rev.images && rev.images.length > 0 && (
                  <View style={{ flexDirection: 'row', marginTop: 8 }}>
                    {rev.images.map((imgUrl, imgIdx) => (
                      <TouchableOpacity
                        key={imgIdx}
                        onPress={() => setFullscreenImage(getImageUrl(imgUrl))}
                        activeOpacity={0.8}
                      >
                        <Image
                          source={{ uri: getImageUrl(imgUrl) }}
                          style={{ width: 60, height: 60, borderRadius: 6, marginRight: 8 }}
                          resizeMode="cover"
                        />
                      </TouchableOpacity>
                    ))}
                  </View>
                )}
              </View>
            ))
          ) : (
            <Text style={[styles.noReviews, { color: colors.textSecondary }]}>
              Be the first to review this product!
            </Text>
          )}


        </View>
      </ScrollView>

      {/* Sticky Bottom Purchase Action */}
      <View style={[styles.purchaseFooter, { backgroundColor: colors.card, borderTopColor: colors.border }]}>
        <TouchableOpacity
          style={[styles.addToBagBtnDual, { borderColor: colors.border }]}
          onPress={handleAddToCart}
          disabled={adding}
        >
          {adding ? (
            <ActivityIndicator color={colors.text} />
          ) : (
            <>
              <ShoppingCart size={18} color={colors.text} style={{ marginRight: 6 }} />
              <Text style={[styles.addToBagBtnTextDual, { color: colors.text }]}>ADD TO BAG</Text>
            </>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.buyNowBtnDual}
          onPress={handleBuyNow}
          disabled={adding}
        >
          <LinearGradient
            colors={['#7c3aed', '#a855f7', '#ec4899']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.buyNowGradient}
          >
            <Text style={styles.buyNowBtnTextDual}>BUY NOW</Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>

      {/* Fullscreen Image Viewer Modal */}
      <Modal visible={!!fullscreenImage} transparent animationType="fade">
        <View style={styles.fullscreenOverlay}>
          <TouchableOpacity
            style={styles.fullscreenCloseArea}
            onPress={() => setFullscreenImage(null)}
            activeOpacity={1}
          />
          {fullscreenImage && (
            <Image
              source={{ uri: fullscreenImage }}
              style={styles.fullscreenImg}
              resizeMode="contain"
            />
          )}
          <TouchableOpacity
            style={styles.fullscreenCloseBtn}
            onPress={() => setFullscreenImage(null)}
          >
            <XCircle size={32} color="#ffffff" />
          </TouchableOpacity>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 12,
  },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 2,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginLeft: 16,
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 100, // Make room for footer
  },
  mainImage: {
    width: width,
    height: 380,
  },
  thumbnailList: {
    marginVertical: 12,
  },
  thumbnailContent: {
    paddingHorizontal: 16,
  },
  thumbnailWrapper: {
    width: 60,
    height: 60,
    borderRadius: 10,
    borderWidth: 2,
    marginRight: 10,
    overflow: 'hidden',
  },
  thumbnail: {
    width: '100%',
    height: '100%',
  },
  detailsContainer: {
    padding: 16,
  },
  category: {
    fontSize: 12,
    fontWeight: 'bold',
    letterSpacing: 1,
    marginBottom: 4,
  },
  name: {
    fontSize: 22,
    fontWeight: '900',
    lineHeight: 28,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: 12,
  },
  price: {
    fontSize: 24,
    fontWeight: '900',
  },
  ratingBox: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ratingVal: {
    fontSize: 14,
    fontWeight: '700',
    marginLeft: 4,
  },
  sectionHeading: {
    fontSize: 16,
    fontWeight: '800',
    marginTop: 16,
    marginBottom: 8,
  },
  description: {
    fontSize: 14,
    lineHeight: 20,
  },
  sizeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  sizeBox: {
    width: 50,
    height: 50,
    borderRadius: 25,
    borderWidth: 1.5,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
    marginBottom: 10,
  },
  sizeText: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  qtyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 10,
    width: 120,
    height: 40,
  },
  qtyBtn: {
    width: 38,
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  qtyVal: {
    flex: 1,
    textAlign: 'center',
    fontSize: 16,
    fontWeight: 'bold',
  },
  divider: {
    borderBottomWidth: 1,
    marginVertical: 20,
  },
  reviewCard: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 12,
    marginBottom: 10,
  },
  reviewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  reviewUser: {
    fontSize: 14,
    fontWeight: '700',
  },
  reviewComment: {
    fontSize: 13,
    lineHeight: 18,
  },
  noReviews: {
    fontSize: 14,
    fontStyle: 'italic',
  },
  addReviewBox: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 16,
    marginTop: 20,
  },
  addReviewTitle: {
    fontSize: 15,
    fontWeight: '800',
    marginBottom: 10,
  },
  ratingInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  ratingLabel: {
    fontSize: 14,
    marginRight: 6,
  },
  commentInput: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 10,
    fontSize: 14,
    textAlignVertical: 'top',
    height: 80,
    marginBottom: 12,
  },
  submitReviewBtn: {
    height: 40,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  submitReviewText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
  },
  purchaseFooter: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 74,
    borderTopWidth: 1,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  addToBagBtnDual: {
    flex: 1,
    height: 48,
    borderRadius: 8,
    borderWidth: 1.5,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  addToBagBtnTextDual: {
    fontSize: 14,
    fontWeight: '800',
  },
  buyNowBtnDual: {
    flex: 1,
    height: 48,
    borderRadius: 8,
    overflow: 'hidden',
  },
  buyNowGradient: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  buyNowBtnTextDual: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '800',
  },
  mainImageContainer: {
    width: width,
    height: 380,
    position: 'relative',
  },
  galleryIndicatorsRow: {
    position: 'absolute',
    bottom: 16,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  galleryDot: {
    height: 6,
    borderRadius: 3,
    marginHorizontal: 3,
  },
  detailsWishlistBadge: {
    position: 'absolute',
    top: 16,
    right: 16,
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
  },
  fullscreenOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.95)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  fullscreenCloseArea: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
  },
  fullscreenImg: {
    width: width,
    height: width * 1.5,
    maxHeight: '80%',
  },
  fullscreenCloseBtn: {
    position: 'absolute',
    top: 40,
    right: 20,
    zIndex: 10,
  },
  addToCartBtn: {
    height: 48,
    borderRadius: 12,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cartIcon: {
    marginRight: 8,
  },
  addToCartText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '800',
  },
  backBtn: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
    marginTop: 12,
  },
  errorText: {
    fontWeight: 'bold',
    marginBottom: 10,
  },
  backBtnWrapper: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  skeletonHero: {
    width: width,
    height: width - 40,
  },
  skeletonLine: {
    borderRadius: 4,
  },
  detailMrpText: {
    fontSize: 14,
    marginLeft: 8,
    textDecorationLine: 'line-through',
  },
});
