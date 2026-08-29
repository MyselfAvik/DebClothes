import React, { useState, useEffect } from 'react';
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
import API from '../../api/api';
import { Trash2, Edit, Plus, ArrowLeft } from 'lucide-react-native';

export default function ManageProducts() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const { colors } = useAppTheme();
  const { navigateTo, goBack } = useAppNavigation();

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    setLoading(true);
    setError('');
    try {
      const { data } = await API.get('/api/products', { params: { limit: 100 } });
      setProducts(data.products || []);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch catalog');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = (id, name) => {
    Alert.alert('Delete Product', `Are you sure you want to delete "${name}"?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await API.delete(`/api/products/${id}`);
            Alert.alert('Success', 'Product deleted successfully.');
            fetchProducts();
          } catch (err) {
            Alert.alert('Error', err.response?.data?.message || 'Delete failed.');
          }
        },
      },
    ]);
  };

  const renderProductItem = ({ item }) => {
    const imgUrl = item.images && item.images.length > 0 ? item.images[0] : 'https://via.placeholder.com/150';

    return (
      <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <Image source={{ uri: imgUrl }} style={styles.thumb} />
        <View style={styles.meta}>
          <Text style={[styles.title, { color: colors.text }]} numberOfLines={1}>
            {item.title}
          </Text>
          <Text style={[styles.subText, { color: colors.textSecondary }]}>
            Category: {item.category} | Sub: {item.subCategory}
          </Text>
          <Text style={[styles.price, { color: colors.primary }]}>₹{item.price}</Text>
        </View>

        <View style={styles.actions}>
          <TouchableOpacity
            style={[styles.actionBtn, { borderColor: colors.border }]}
            onPress={() => navigateTo('ADMIN_ADD_EDIT_PRODUCT', { id: item._id })}
          >
            <Edit size={16} color={colors.primary} />
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.actionBtn, { borderColor: colors.border }]}
            onPress={() => handleDelete(item._id, item.title)}
          >
            <Trash2 size={16} color={colors.danger} />
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={[styles.backBtn, { backgroundColor: colors.card }]} onPress={goBack}>
          <ArrowLeft size={20} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Manage Catalog</Text>
        
        <TouchableOpacity
          style={[styles.addBtn, { backgroundColor: colors.primary }]}
          onPress={() => navigateTo('ADMIN_ADD_EDIT_PRODUCT')}
        >
          <Plus size={18} color="#fff" />
        </TouchableOpacity>
      </View>

      {loading && products.length === 0 ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : null}

      {error ? <Text style={[styles.errorText, { color: colors.danger }]}>{error}</Text> : null}

      {!loading && products.length === 0 ? (
        <Text style={[styles.emptyText, { color: colors.textSecondary }]}>No products in catalog.</Text>
      ) : (
        <FlatList
          data={products}
          renderItem={renderProductItem}
          keyExtractor={(item) => item._id}
          contentContainerStyle={styles.listContent}
          onRefresh={fetchProducts}
          refreshing={loading}
        />
      )}
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
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontFamily: 'Outfit_900Black',
    marginLeft: 16,
    flex: 1,
  },
  addBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContent: {
    padding: 16,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 14,
    borderWidth: 1,
    padding: 12,
    marginBottom: 12,
  },
  thumb: {
    width: 60,
    height: 72,
    borderRadius: 8,
  },
  meta: {
    flex: 1,
    marginLeft: 14,
  },
  title: {
    fontSize: 15,
    fontFamily: 'Outfit_700Bold',
  },
  subText: {
    fontSize: 12,
    fontFamily: 'Outfit_400Regular',
    marginTop: 2,
  },
  price: {
    fontSize: 14,
    fontFamily: 'Outfit_800ExtraBold',
    marginTop: 4,
  },
  actions: {
    flexDirection: 'row',
  },
  actionBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
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
  emptyText: {
    textAlign: 'center',
    marginTop: 40,
    fontFamily: 'Outfit_500Medium',
  },
});
