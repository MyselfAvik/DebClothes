import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  FlatList,
  Image,
  ActivityIndicator,
  ScrollView,
  Dimensions,
} from 'react-native';
import { useAppTheme } from '../../context/ThemeContext';
import { useAppNavigation } from '../../context/NavigationContext';
import { useToast } from '../../context/ToastContext';
import { useWishlist } from '../../context/WishlistContext';
import API from '../../api/api';
import { Search, SlidersHorizontal, Star, ShoppingBag, X, Heart, Truck, ShieldCheck, Sun, Moon } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';

const getImageUrl = (imagePath) => {
  if (!imagePath) return 'https://images.unsplash.com/photo-1523381210434-271e8be1f52b?auto=format&fit=crop&q=80&w=150';
  if (imagePath.startsWith('http')) return imagePath;
  return `https://debclothes-backend.onrender.com/${imagePath}`;
};

const { width } = Dimensions.get('window');

const CATEGORIES = [
  { id: 'all', name: 'All' },
  { id: 'men', name: 'Men' },
  { id: 'women', name: 'Women' },
  { id: 'kids', name: 'Kids' },
  { id: 'accessories', name: 'Accessories' },
];

const DEALS = [
  {
    id: 1,
    title: 'HAUTE COUTURE SALE',
    subText: 'Up to 60% Off Luxury Apparel & Collections',
    colors: ['#7c3aed', '#a855f7', '#ec4899'],
    tag: 'FLAT 60% OFF',
  },
  {
    id: 2,
    title: 'TRENDING RUNWAY',
    subText: 'Fresh Arrivals in Designer Styles & Casuals',
    colors: ['#ec4899', '#f43f5e', '#fb923c'],
    tag: 'NEW ARRIVAL',
  },
  {
    id: 3,
    title: 'VIP EXCLUSIVES',
    subText: 'Express Free Delivery & Assured Quality',
    colors: ['#6366f1', '#8b5cf6', '#06b6d4'],
    tag: 'DEB VIP',
  },
  {
    id: 4,
    title: 'GOLDEN FESTIVE',
    subText: 'Exclusive Ethnic & Modern Fusion Wear',
    colors: ['#f59e0b', '#d97706', '#fbbf24'],
    tag: 'FESTIVE 2026',
  },
];

const SUB_CATEGORIES = ['All', 'Shirts', 'T-Shirts', 'Jeans', 'Trousers', 'Dresses', 'Kurtas', 'Sarees', 'Jackets', 'Shoes', 'Accessories'];

export default function HomeScreen() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [showFilters, setShowFilters] = useState(false);
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedSubCategory, setSelectedSubCategory] = useState('All');
  const { colors, isDark, toggleTheme } = useAppTheme();
  const { navigateTo } = useAppNavigation();
  const { showToast } = useToast();
  const { toggleWishlist, isWishlisted } = useWishlist();

  useEffect(() => {
    fetchProducts();
  }, [selectedCategory]);

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      if (search.trim()) {
        fetchSuggestions();
      } else {
        setSuggestions([]);
        setShowSuggestions(false);
      }
    }, 400);

    return () => clearTimeout(delayDebounceFn);
  }, [search]);

  const fetchProducts = async (applyFilters = false, overrides = {}) => {
    setLoading(true);
    setError('');
    try {
      const params = {
        limit: 10,
        page: 1,
      };

      if (search) params.search = search;
      if (selectedCategory && selectedCategory !== 'all') params.category = selectedCategory;

      const activeMin = 'minPrice' in overrides ? overrides.minPrice : minPrice;
      const activeMax = 'maxPrice' in overrides ? overrides.maxPrice : maxPrice;
      const activeSub = 'subCategory' in overrides ? overrides.subCategory : selectedSubCategory;

      if (applyFilters && activeMin) params.minPrice = activeMin;
      if (applyFilters && activeMax) params.maxPrice = activeMax;
      if (applyFilters && activeSub && activeSub !== 'All') {
        params.subCategory = activeSub.toLowerCase();
      }

      const { data } = await API.get('/api/products', { params });
      setProducts(data.products || []);
    } catch (err) {
      const errMsg = err.response?.data?.message || 'Failed to load products';
      setError(errMsg);
      showToast(errMsg, 'error');
    } finally {
      setLoading(false);
    }
  };

  const fetchSuggestions = async () => {
    try {
      const { data } = await API.get('/api/products', {
        params: { search: search, limit: 5 },
      });
      setSuggestions(data.products || []);
      setShowSuggestions(true);
    } catch (err) {
      // Ignore
    }
  };

  const handleApplyFilters = () => {
    setShowFilters(false);
    fetchProducts(true);
  };

  const handleClearFilters = () => {
    setMinPrice('');
    setMaxPrice('');
    setSelectedSubCategory('All');
    setSearch('');
    fetchProducts(false);
  };

  const renderProductItem = ({ item }) => {
    if (item.isSkeleton) {
      return (
        <View style={[styles.skeletonCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={[styles.skeletonImage, { backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)' }]} />
          <View style={styles.skeletonInfo}>
            <View style={[styles.skeletonTextLine, { width: '40%', height: 10, backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)' }]} />
            <View style={[styles.skeletonTextLine, { width: '85%', height: 14, marginTop: 8, backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)' }]} />
            <View style={[styles.skeletonTextLine, { width: '50%', height: 12, marginTop: 8, backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)' }]} />
          </View>
        </View>
      );
    }

    const imageUrl = getImageUrl(item.images?.[0]);
    const hasDiscount = item.discountPrice && item.discountPrice < item.price;
    const activePrice = hasDiscount ? item.discountPrice : item.price;
    const discountPercent = hasDiscount ? Math.round(((item.price - item.discountPrice) / item.price) * 100) : 0;
    const totalStock = item.sizes ? item.sizes.reduce((acc, s) => acc + (s.stock || 0), 0) : 0;
    const wishlisted = isWishlisted(item._id);

    return (
      <TouchableOpacity
        style={[styles.productCard, { backgroundColor: colors.card, borderColor: colors.border }]}
        onPress={() => navigateTo('PRODUCT_DETAIL', { id: item._id })}
        activeOpacity={0.9}
      >
        {/* Top Overlay Badges */}
        <View style={styles.cardOverlayTop}>
          <TouchableOpacity
            style={[styles.wishlistBadge, { backgroundColor: wishlisted ? '#ef4444' : 'rgba(255,255,255,0.85)' }]}
            onPress={() => toggleWishlist(item)}
          >
            <Heart size={13} color={wishlisted ? '#fff' : '#666'} fill={wishlisted ? '#fff' : 'none'} />
          </TouchableOpacity>
        </View>

        {/* Left Deal Tags */}
        <View style={styles.cardOverlayLeft}>
          {hasDiscount && discountPercent >= 20 ? (
            <View style={styles.dealTag}>
              <Text style={styles.dealTagText}>SPECIAL DEAL</Text>
            </View>
          ) : null}
          {totalStock > 0 && totalStock <= 5 ? (
            <View style={[styles.dealTag, { backgroundColor: '#f59e0b' }]}>
              <Text style={styles.dealTagText}>LOW STOCK</Text>
            </View>
          ) : null}
        </View>

        <Image source={{ uri: imageUrl }} style={styles.productImage} resizeMode="cover" />

        <View style={styles.productInfo}>
          {/* Brand & Assured Row */}
          <View style={styles.brandRow}>
            <Text style={[styles.brandText, { color: colors.textSecondary }]} numberOfLines={1}>
              {item.category ? item.category.toUpperCase() : 'CLOTHING'}
            </Text>
            <View style={[styles.assuredBadge, { borderColor: isDark ? '#333' : '#e0e0e0' }]}>
              <Text style={styles.assuredText}>Assured</Text>
            </View>
          </View>

          {/* Title */}
          <Text style={[styles.productName, { color: colors.text }]} numberOfLines={1}>
            {item.title}
          </Text>

          {/* Rating Capsule */}
          <View style={styles.ratingRow}>
            <View style={styles.ratingCapsule}>
              <Text style={styles.ratingValText}>
                {item.ratingAverage ? item.ratingAverage.toFixed(1) : '0.0'}
              </Text>
              <Star size={9} color="#fff" fill="#fff" style={{ marginLeft: 2 }} />
            </View>
            <Text style={[styles.reviewCountText, { color: colors.textSecondary }]}>
              ({item.ratingCount || 0})
            </Text>
          </View>

          {/* Sizes Row */}
          <View style={styles.sizesRow}>
            {item.sizes && item.sizes.slice(0, 4).map((s, idx) => (
              <View
                key={idx}
                style={[
                  styles.sizePill,
                  {
                    borderColor: s.stock > 0 ? colors.border : 'rgba(0,0,0,0.05)',
                    backgroundColor: s.stock > 0 ? colors.card : 'rgba(0,0,0,0.02)',
                  }
                ]}
              >
                <Text
                  style={[
                    styles.sizePillText,
                    {
                      color: s.stock > 0 ? colors.text : colors.textSecondary,
                      textDecorationLine: s.stock > 0 ? 'none' : 'line-through',
                    }
                  ]}
                >
                  {s.size}
                </Text>
              </View>
            ))}
          </View>

          {/* Price Row */}
          <View style={styles.priceRow}>
            <Text style={[styles.productPrice, { color: colors.text }]}>₹{activePrice}</Text>
            {hasDiscount && (
              <>
                <Text style={[styles.mrpText, { color: colors.textSecondary }]}>₹{item.price}</Text>
                <Text style={styles.discountPercentText}>{discountPercent}% off</Text>
              </>
            )}
          </View>

          {/* Free Delivery Tag */}
          <View style={styles.deliveryTagRow}>
            <Truck size={12} color="#388e3c" style={{ marginRight: 4 }} />
            <Text style={styles.deliveryTagText}>Free Delivery</Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Branded Luxury Header */}
      <LinearGradient
        colors={isDark ? ['#131122', '#1c1733', '#251c42'] : ['#7c3aed', '#a855f7', '#ec4899']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.headerContainer}
      >
        {/* Row 1: Brand Logo & Theme Switcher */}
        <View style={styles.topHeaderRow}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Text style={styles.brandLogoText}>DEB CLOTHES</Text>
            <View style={styles.headerAssuredPill}>
              <Text style={styles.headerAssuredPillText}>COUTURE</Text>
            </View>
          </View>
          <TouchableOpacity onPress={toggleTheme} style={styles.themeToggleBtn}>
            {isDark ? <Sun size={18} color="#fff" /> : <Moon size={18} color="#fff" />}
          </TouchableOpacity>
        </View>

        {/* Row 2: Search Bar & Filter */}
        <View style={styles.searchRow}>
          <View style={[styles.searchContainer, { backgroundColor: isDark ? '#1a162b' : '#ffffff' }]}>
            <Search size={16} color={isDark ? '#a78bfa' : '#7c3aed'} style={styles.searchIcon} />
            <TextInput
              style={[styles.searchInput, { color: isDark ? '#ffffff' : '#1e1b4b' }]}
              placeholder="Search designer styles, jeans, shirts..."
              placeholderTextColor={isDark ? '#a78bfa80' : '#6b7280'}
              value={search}
              onChangeText={setSearch}
              onSubmitEditing={() => {
                setShowSuggestions(false);
                fetchProducts();
              }}
            />
            {search ? (
              <TouchableOpacity onPress={() => setSearch('')}>
                <X size={16} color={isDark ? '#a78bfa' : '#6b7280'} />
              </TouchableOpacity>
            ) : null}
          </View>
          <TouchableOpacity
            style={styles.filterBtn}
            onPress={() => setShowFilters(!showFilters)}
          >
            <SlidersHorizontal size={18} color="#ffffff" />
          </TouchableOpacity>
        </View>
      </LinearGradient>

      {/* Suggestions Overlay */}
      {showSuggestions && suggestions.length > 0 ? (
        <View style={[styles.suggestionsBox, { backgroundColor: colors.card, borderColor: colors.border }]}>
          {suggestions.map((item) => (
            <TouchableOpacity
              key={item._id}
              style={[styles.suggestionItem, { borderBottomColor: colors.border }]}
              onPress={() => {
                setSearch(item.title);
                setShowSuggestions(false);
                navigateTo('PRODUCT_DETAIL', { id: item._id });
              }}
            >
              <Text style={{ color: colors.text }}>{item.title}</Text>
            </TouchableOpacity>
          ))}
        </View>
      ) : null}

      {/* Main List */}
      <FlatList
        data={
          loading && products.length === 0
            ? [
                { _id: 's1', isSkeleton: true },
                { _id: 's2', isSkeleton: true },
                { _id: 's3', isSkeleton: true },
                { _id: 's4', isSkeleton: true },
                { _id: 's5', isSkeleton: true },
                { _id: 's6', isSkeleton: true },
              ]
            : products
        }
        renderItem={renderProductItem}
        keyExtractor={(item) => item._id}
        numColumns={2}
        columnWrapperStyle={styles.columnWrapper}
        contentContainerStyle={styles.listContent}
        ListHeaderComponent={
          <>
            {/* Promo Banner Carousel Slider */}
            <ScrollView
              horizontal
              pagingEnabled
              showsHorizontalScrollIndicator={false}
              style={styles.dealsCarousel}
              contentContainerStyle={styles.dealsCarouselContent}
            >
              {DEALS.map((deal) => (
                <LinearGradient
                  key={deal.id}
                  colors={deal.colors}
                  style={styles.bannerCard}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                >
                  <View style={styles.bannerLeft}>
                    <View style={styles.dealTagBadge}>
                      <Text style={styles.dealTagText}>{deal.tag}</Text>
                    </View>
                    <Text style={styles.bannerText}>{deal.title}</Text>
                    <Text style={styles.bannerSubText}>{deal.subText}</Text>
                  </View>
                  <ShoppingBag size={48} color="rgba(255,255,255,0.25)" />
                </LinearGradient>
              ))}
            </ScrollView>

            {/* Active Filters Indicators Row */}
            {(selectedSubCategory !== 'All' || minPrice || maxPrice) && (
              <View style={styles.activeFiltersRow}>
                {selectedSubCategory !== 'All' && (
                  <View style={[styles.filterChip, { backgroundColor: colors.primary + '15', borderColor: colors.primary }]}>
                    <Text style={[styles.filterChipText, { color: colors.primary }]}>
                      Sub: {selectedSubCategory}
                    </Text>
                    <TouchableOpacity
                      onPress={() => {
                        setSelectedSubCategory('All');
                        fetchProducts(true, { subCategory: 'All' });
                      }}
                      style={styles.filterChipClose}
                    >
                      <X size={12} color={colors.primary} />
                    </TouchableOpacity>
                  </View>
                )}

                {(minPrice || maxPrice) && (
                  <View style={[styles.filterChip, { backgroundColor: colors.primary + '15', borderColor: colors.primary }]}>
                    <Text style={[styles.filterChipText, { color: colors.primary }]}>
                      Price: ₹{minPrice || '0'} - ₹{maxPrice || '∞'}
                    </Text>
                    <TouchableOpacity
                      onPress={() => {
                        setMinPrice('');
                        setMaxPrice('');
                        fetchProducts(true, { minPrice: '', maxPrice: '' });
                      }}
                      style={styles.filterChipClose}
                    >
                      <X size={12} color={colors.primary} />
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            )}

            {/* Horizontal Categories */}
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.categoriesContainer}
              contentContainerStyle={styles.categoriesContent}
            >
              {CATEGORIES.map((cat) => (
                <TouchableOpacity
                  key={cat.id}
                  style={[
                    styles.categoryTab,
                    selectedCategory === cat.id
                      ? { backgroundColor: isDark ? colors.primary : '#2874f0' }
                      : { backgroundColor: colors.card, borderWidth: 0.5, borderColor: colors.border },
                  ]}
                  onPress={() => setSelectedCategory(cat.id)}
                >
                  <Text
                    style={[
                      styles.categoryTabText,
                      selectedCategory === cat.id
                        ? { color: '#fff', fontWeight: 'bold' }
                        : { color: colors.textSecondary },
                    ]}
                  >
                    {cat.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            {/* Active section title */}
            <View style={styles.sectionHeader}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>Featured Collections</Text>
            </View>

            {error ? (
              <Text style={[styles.errorText, { color: colors.danger }]}>{error}</Text>
            ) : null}

            {!loading && products.length === 0 ? (
              <Text style={[styles.emptyText, { color: colors.textSecondary }]}>No products found.</Text>
            ) : null}
          </>
        }
        onRefresh={fetchProducts}
        refreshing={loading}
      />

      {/* Filter Modal Slider */}
      {showFilters ? (
        <View style={[styles.filterDrawer, { backgroundColor: colors.card, borderTopColor: colors.border }]}>
          <View style={styles.filterHeader}>
            <Text style={[styles.filterTitle, { color: colors.text }]}>Filter Options</Text>
            <TouchableOpacity onPress={() => setShowFilters(false)}>
              <X size={20} color={colors.text} />
            </TouchableOpacity>
          </View>
          <View style={styles.filterContent}>
            <Text style={[styles.filterLabel, { color: colors.text, marginBottom: 8 }]}>Sub-Category</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 16 }}>
              {SUB_CATEGORIES.map((sub) => (
                <TouchableOpacity
                  key={sub}
                  style={[
                    styles.subCatFilterTab,
                    {
                      backgroundColor: selectedSubCategory === sub ? colors.primary : colors.card,
                      borderColor: selectedSubCategory === sub ? colors.primary : colors.border,
                    },
                  ]}
                  onPress={() => setSelectedSubCategory(sub)}
                >
                  <Text
                    style={[
                      styles.subCatFilterText,
                      { color: selectedSubCategory === sub ? '#fff' : colors.text },
                    ]}
                  >
                    {sub}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <Text style={[styles.filterLabel, { color: colors.text }]}>Price Range</Text>
            <View style={styles.priceRangeContainer}>
              <TextInput
                style={[styles.filterInput, { color: colors.text, borderColor: colors.border }]}
                placeholder="Min Price"
                placeholderTextColor={colors.textSecondary}
                keyboardType="number-pad"
                value={minPrice}
                onChangeText={setMinPrice}
              />
              <Text style={{ color: colors.textSecondary, marginHorizontal: 8 }}>to</Text>
              <TextInput
                style={[styles.filterInput, { color: colors.text, borderColor: colors.border }]}
                placeholder="Max Price"
                placeholderTextColor={colors.textSecondary}
                keyboardType="number-pad"
                value={maxPrice}
                onChangeText={setMaxPrice}
              />
            </View>
            <View style={styles.filterActions}>
              <TouchableOpacity
                style={[styles.filterBtnClear, { borderColor: colors.border }]}
                onPress={handleClearFilters}
              >
                <Text style={{ color: colors.textSecondary }}>Clear All</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.filterBtnApply, { backgroundColor: colors.primary }]}
                onPress={handleApplyFilters}
              >
                <Text style={{ color: '#fff', fontWeight: 'bold' }}>Apply</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  headerContainer: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 12,
    zIndex: 10,
  },
  topHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  brandLogoText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '900',
    letterSpacing: 1.5,
    fontStyle: 'italic',
  },
  headerAssuredPill: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    marginLeft: 8,
  },
  headerAssuredPillText: {
    color: '#ffffff',
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 1,
  },
  themeToggleBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  searchContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 6,
    paddingHorizontal: 10,
    height: 38,
  },
  searchIcon: {
    marginRight: 6,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    paddingVertical: 0,
  },
  filterBtn: {
    width: 38,
    height: 38,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 6,
  },
  suggestionsBox: {
    position: 'absolute',
    top: 104,
    left: 16,
    right: 70,
    borderRadius: 8,
    borderWidth: 1,
    elevation: 5,
    zIndex: 999,
  },
  suggestionItem: {
    padding: 12,
    borderBottomWidth: 1,
  },
  dealsCarousel: {
    marginVertical: 12,
  },
  dealsCarouselContent: {
    paddingLeft: 16,
  },
  bannerCard: {
    width: width - 32,
    borderRadius: 12,
    padding: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginRight: 16,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
  },
  bannerLeft: {
    flex: 1,
    paddingRight: 10,
  },
  dealTagBadge: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    alignSelf: 'flex-start',
    marginBottom: 8,
  },
  dealTagText: {
    color: '#ffffff',
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  bannerText: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '900',
    letterSpacing: 1,
  },
  bannerSubText: {
    color: 'rgba(255,255,255,0.85)',
    fontSize: 12,
    marginTop: 4,
    fontWeight: '600',
  },
  categoriesContainer: {
    marginVertical: 6,
  },
  categoriesContent: {
    paddingHorizontal: 16,
  },
  categoryTab: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    marginRight: 8,
  },
  categoryTabText: {
    fontSize: 14,
  },
  sectionHeader: {
    paddingHorizontal: 16,
    marginVertical: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '800',
  },
  columnWrapper: {
    justifyContent: 'space-between',
    paddingHorizontal: 8,
  },
  listContent: {
    paddingBottom: 24,
  },
  productCard: {
    width: (width - 24) / 2,
    borderRadius: 4,
    borderWidth: 0.5,
    marginBottom: 8,
    overflow: 'hidden',
    position: 'relative',
  },
  productImage: {
    width: '100%',
    aspectRatio: 3 / 4,
  },
  cardOverlayTop: {
    position: 'absolute',
    top: 8,
    right: 8,
    zIndex: 10,
  },
  wishlistBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1.5,
    elevation: 3,
  },
  cardOverlayLeft: {
    position: 'absolute',
    top: 8,
    left: 8,
    zIndex: 10,
    alignItems: 'flex-start',
  },
  dealTag: {
    backgroundColor: '#388e3c',
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 4,
    marginBottom: 4,
  },
  dealTagText: {
    color: '#fff',
    fontSize: 8,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  productInfo: {
    padding: 10,
    flex: 1,
  },
  brandRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  brandText: {
    fontSize: 10,
    fontWeight: '850',
    letterSpacing: 0.5,
  },
  assuredBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderWidth: 0.5,
    borderRadius: 2,
    paddingHorizontal: 4,
    paddingVertical: 1,
  },
  assuredText: {
    color: '#fbbf24',
    fontSize: 8,
    fontWeight: '800',
    fontStyle: 'italic',
    marginLeft: 0,
  },
  productName: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 6,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  ratingCapsule: {
    backgroundColor: '#388e3c',
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 3,
    paddingHorizontal: 5,
    paddingVertical: 2,
  },
  ratingValText: {
    color: '#fff',
    fontSize: 9,
    fontWeight: '900',
  },
  reviewCountText: {
    fontSize: 9,
    fontWeight: '600',
    marginLeft: 4,
  },
  sizesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 8,
  },
  sizePill: {
    borderWidth: 1,
    borderRadius: 3,
    paddingHorizontal: 4,
    paddingVertical: 2,
    marginRight: 4,
    marginBottom: 2,
  },
  sizePillText: {
    fontSize: 8,
    fontWeight: '800',
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: 4,
  },
  productPrice: {
    fontSize: 14,
    fontWeight: '900',
  },
  mrpText: {
    fontSize: 10,
    marginLeft: 4,
    textDecorationLine: 'line-through',
  },
  discountPercentText: {
    fontSize: 10,
    marginLeft: 6,
    color: '#388e3c',
    fontWeight: '900',
  },
  deliveryTagRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  deliveryTagText: {
    fontSize: 9,
    color: '#388e3c',
    fontWeight: '800',
  },
  errorText: {
    textAlign: 'center',
    marginVertical: 20,
    fontWeight: 'bold',
  },
  emptyText: {
    textAlign: 'center',
    marginVertical: 40,
    fontSize: 15,
  },
  filterDrawer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    borderTopWidth: 2,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    elevation: 10,
    zIndex: 1000,
  },
  filterHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  filterTitle: {
    fontSize: 18,
    fontWeight: '800',
  },
  filterBody: {},
  filterLabel: {
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 8,
  },
  priceRangeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  filterInput: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 8,
    height: 40,
    paddingHorizontal: 12,
  },
  filterActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  filterBtnClear: {
    flex: 1,
    height: 44,
    borderWidth: 1,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  filterBtnApply: {
    flex: 1.5,
    height: 44,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  skeletonCard: {
    width: (width - 24) / 2,
    height: 250,
    borderRadius: 4,
    borderWidth: 0.5,
    marginBottom: 8,
    overflow: 'hidden',
  },
  skeletonImage: {
    width: '100%',
    height: 160,
  },
  skeletonInfo: {
    padding: 12,
  },
  skeletonTextLine: {
    borderRadius: 4,
  },
  subCatFilterTab: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    marginRight: 8,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  subCatFilterText: {
    fontSize: 12,
    fontWeight: '700',
  },
  activeFiltersRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 16,
    marginBottom: 10,
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
    borderWidth: 1,
    marginRight: 8,
    marginBottom: 6,
  },
  filterChipText: {
    fontSize: 11,
    fontWeight: '800',
  },
  filterChipClose: {
    marginLeft: 6,
    backgroundColor: 'rgba(255,255,255,0.4)',
    borderRadius: 8,
    padding: 1,
  },
});
