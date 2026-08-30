import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Image,
  Dimensions,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { useAppTheme } from '../../context/ThemeContext';
import { useAppNavigation } from '../../context/NavigationContext';
import { useToast } from '../../context/ToastContext';
import API, { uploadMultipartAsync } from '../../api/api';
import { Save, ArrowLeft, Plus, X, Camera, Image as ImageIcon } from 'lucide-react-native';

const SIZE_LABELS = ['S', 'M', 'L', 'XL', 'XXL', 'Free'];

const getImageUrl = (imagePath) => {
  if (!imagePath) return 'https://images.unsplash.com/photo-1523381210434-271e8be1f52b?auto=format&fit=crop&q=80&w=150';
  if (imagePath.startsWith('http')) return imagePath;
  return `https://debclothes-backend.onrender.com/${imagePath}`;
};

const { width } = Dimensions.get('window');

export default function AddEditProduct() {
  const { colors } = useAppTheme();
  const { screenParams, goBack } = useAppNavigation();
  const { showToast } = useToast();

  const productId = screenParams.id;
  const isEditMode = !!productId;

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  // Form Fields
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [discountPrice, setDiscountPrice] = useState('');
  const [category, setCategory] = useState('men');
  const [subCategory, setSubCategory] = useState('');
  const [sizes, setSizes] = useState({
    S: '0',
    M: '0',
    L: '0',
    XL: '0',
    XXL: '0',
    Free: '0',
  });
  const [imageInput, setImageInput] = useState('');
  const [imagesList, setImagesList] = useState([]);

  useEffect(() => {
    if (isEditMode) {
      fetchProductDetails();
    }
  }, [productId]);

  const fetchProductDetails = async () => {
    setLoading(true);
    try {
      const { data } = await API.get(`/api/products/${productId}`);
      setTitle(data.title || '');
      setDescription(data.description || '');
      setPrice(data.price?.toString() || '');
      setDiscountPrice(data.discountPrice?.toString() || '');
      setCategory(data.category || 'men');
      setSubCategory(data.subCategory || '');
      setImagesList(data.images || []);

      // Map sizes from DB structure
      const sizesMap = { S: '0', M: '0', L: '0', XL: '0', XXL: '0', Free: '0' };
      if (data.sizes) {
        data.sizes.forEach((s) => {
          sizesMap[s.size] = s.stock ? s.stock.toString() : '0';
        });
      }
      setSizes(sizesMap);
    } catch (err) {
      showToast('Failed to fetch product details.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleSizeStockChange = (size, value) => {
    setSizes((prev) => ({ ...prev, [size]: value }));
  };

  const handleAddImage = () => {
    if (!imageInput.trim()) return;
    setImagesList((prev) => [...prev, imageInput.trim()]);
    setImageInput('');
    showToast('Image URL added!', 'success');
  };

  const handleRemoveImage = (index) => {
    setImagesList((prev) => prev.filter((_, i) => i !== index));
    showToast('Image removed.', 'info');
  };

  const handleSelectFromGallery = async () => {
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
        const selectedUri = result.assets[0].uri;
        if (selectedUri) {
          setImagesList((prev) => [...prev, selectedUri]);
          showToast('Photo selected from gallery!', 'success');
        }
      }
    } catch (err) {
      console.error('Gallery launch error:', err);
      showToast('Could not open gallery: ' + (err.message || 'Error'), 'error');
    }
  };

  const handleTakePhoto = async () => {
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
        const selectedUri = result.assets[0].uri;
        if (selectedUri) {
          setImagesList((prev) => [...prev, selectedUri]);
          showToast('Photo captured successfully!', 'success');
        }
      }
    } catch (err) {
      console.error('Camera launch error:', err);
      showToast('Could not open camera: ' + (err.message || 'Error'), 'error');
    }
  };

  const handleSave = async () => {
    if (!title || !description || !price || !category || !subCategory) {
      showToast('Please fill in all required fields.', 'warning');
      return;
    }

    const dbSizes = [];
    Object.keys(sizes).forEach((key) => {
      const stockVal = parseInt(sizes[key]);
      if (stockVal > 0) {
        dbSizes.push({ size: key, stock: stockVal });
      }
    });

    if (dbSizes.length === 0) {
      showToast('Please set stock for at least one size.', 'warning');
      return;
    }

    if (imagesList.length === 0) {
      showToast('Please add at least one product photo.', 'warning');
      return;
    }

    setSaving(true);

    // Build multipart FormData request
    const formData = new FormData();
    formData.append('title', title);
    formData.append('description', description);
    formData.append('price', price);
    if (discountPrice) {
      formData.append('discountPrice', discountPrice);
    }
    formData.append('category', category);
    formData.append('subCategory', subCategory);
    formData.append('sizes', JSON.stringify(dbSizes));

    // Handle images array mapping
    const remoteImages = [];
    imagesList.forEach((img, idx) => {
      const isLocal = img.startsWith('file://') || img.startsWith('content://');
      if (isLocal) {
        const rawFilename = img.split('/').pop() || `photo_${Date.now()}_${idx}.jpg`;
        const match = /\.(\w+)$/.exec(rawFilename);
        const ext = match ? match[1].toLowerCase() : 'jpg';
        const type = ext === 'png' ? 'image/png' : ext === 'webp' ? 'image/webp' : 'image/jpeg';
        const cleanFilename = rawFilename.includes('.') ? rawFilename : `${rawFilename}.${ext}`;
        formData.append('images', {
          uri: img,
          name: cleanFilename,
          type: type,
        });
      } else {
        remoteImages.push(img);
      }
    });

    try {
      if (isEditMode) {
        formData.append('existingImages', JSON.stringify(remoteImages));
        await uploadMultipartAsync(`/api/products/${productId}`, formData, 'PUT');
        showToast('Product updated successfully.', 'success');
      } else {
        await uploadMultipartAsync('/api/products', formData, 'POST');
        showToast('Product created successfully.', 'success');
      }
      goBack();
    } catch (err) {
      showToast(err.response?.data?.message || err.message || 'Failed to save product.', 'error');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={[styles.backBtn, { backgroundColor: colors.card }]} onPress={goBack}>
          <ArrowLeft size={20} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>
          {isEditMode ? 'Edit Product' : 'New Product'}
        </Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Core fields */}
        <Text style={[styles.label, { color: colors.text }]}>Title *</Text>
        <TextInput
          style={[styles.input, { color: colors.text, borderColor: colors.border }]}
          placeholder="Product Title"
          placeholderTextColor={colors.textSecondary}
          value={title}
          onChangeText={setTitle}
        />

        <Text style={[styles.label, { color: colors.text }]}>Description *</Text>
        <TextInput
          style={[styles.textarea, { color: colors.text, borderColor: colors.border }]}
          placeholder="Detailed Product Description..."
          placeholderTextColor={colors.textSecondary}
          value={description}
          onChangeText={setDescription}
          multiline
          numberOfLines={4}
        />

        <View style={styles.row}>
          <View style={styles.col}>
            <Text style={[styles.label, { color: colors.text }]}>Price (₹) *</Text>
            <TextInput
              style={[styles.input, { color: colors.text, borderColor: colors.border }]}
              placeholder="e.g. 999"
              placeholderTextColor={colors.textSecondary}
              value={price}
              onChangeText={setPrice}
              keyboardType="numeric"
            />
          </View>
          <View style={styles.col}>
            <Text style={[styles.label, { color: colors.text }]}>Discount Price (₹)</Text>
            <TextInput
              style={[styles.input, { color: colors.text, borderColor: colors.border }]}
              placeholder="e.g. 799"
              placeholderTextColor={colors.textSecondary}
              value={discountPrice}
              onChangeText={setDiscountPrice}
              keyboardType="numeric"
            />
          </View>
        </View>

        <View style={styles.row}>
          <View style={styles.col}>
            <Text style={[styles.label, { color: colors.text }]}>Category *</Text>
            <View style={styles.catTabs}>
              {['men', 'women', 'kids', 'accessories'].map((cat) => (
                <TouchableOpacity
                  key={cat}
                  style={[
                    styles.catTab,
                    category === cat
                      ? { backgroundColor: colors.primary }
                      : { backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border },
                  ]}
                  onPress={() => setCategory(cat)}
                >
                  <Text
                    style={[
                      styles.catTabText,
                      category === cat ? { color: '#fff' } : { color: colors.textSecondary },
                    ]}
                  >
                    {cat.toUpperCase()}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
          <View style={styles.col}>
            <Text style={[styles.label, { color: colors.text }]}>Sub Category *</Text>
            <TextInput
              style={[styles.input, { color: colors.text, borderColor: colors.border }]}
              placeholder="e.g. Shirt, Jeans"
              placeholderTextColor={colors.textSecondary}
              value={subCategory}
              onChangeText={setSubCategory}
            />
          </View>
        </View>

        {/* Sizes and stock configuration */}
        <Text style={[styles.sectionHeading, { color: colors.text }]}>Sizes Stock Catalog *</Text>
        <View style={styles.sizesGrid}>
          {SIZE_LABELS.map((sz) => (
            <View key={sz} style={styles.sizeStockRow}>
              <Text style={[styles.sizeLabel, { color: colors.text }]}>{sz}</Text>
              <TextInput
                style={[styles.sizeStockInput, { color: colors.text, borderColor: colors.border }]}
                keyboardType="number-pad"
                value={sizes[sz]}
                onChangeText={(val) => handleSizeStockChange(sz, val)}
              />
            </View>
          ))}
        </View>

        {/* Product Photo Upload */}
        <Text style={[styles.sectionHeading, { color: colors.text }]}>Product Photos *</Text>

        <View style={styles.pickerActionsRow}>
          <TouchableOpacity
            style={[styles.pickerBtn, { backgroundColor: colors.card, borderColor: colors.border }]}
            onPress={handleSelectFromGallery}
          >
            <ImageIcon size={18} color={colors.primary} style={{ marginRight: 6 }} />
            <Text style={[styles.pickerBtnText, { color: colors.text }]}>Gallery</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.pickerBtn, { backgroundColor: colors.card, borderColor: colors.border }]}
            onPress={handleTakePhoto}
          >
            <Camera size={18} color={colors.primary} style={{ marginRight: 6 }} />
            <Text style={[styles.pickerBtnText, { color: colors.text }]}>Camera</Text>
          </TouchableOpacity>
        </View>

        {/* Remote URL fallback input */}
        <View style={styles.imageAddRow}>
          <TextInput
            style={[styles.imageInput, { color: colors.text, borderColor: colors.border }]}
            placeholder="Or Paste Image URL Address..."
            placeholderTextColor={colors.textSecondary}
            value={imageInput}
            onChangeText={setImageInput}
          />
          <TouchableOpacity
            style={[styles.addImageBtn, { backgroundColor: colors.primary }]}
            onPress={handleAddImage}
          >
            <Plus size={20} color="#fff" />
          </TouchableOpacity>
        </View>

        {/* Thumbnail previews list */}
        {imagesList.length > 0 ? (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.previewScrollView}>
            {imagesList.map((img, idx) => {
              const isLocal = img.startsWith('file://') || img.startsWith('content://');
              const uri = isLocal ? img : getImageUrl(img);
              return (
                <View key={idx} style={[styles.previewWrapper, { borderColor: colors.border }]}>
                  <Image source={{ uri }} style={styles.previewImage} resizeMode="cover" />
                  <TouchableOpacity style={styles.removeBadge} onPress={() => handleRemoveImage(idx)}>
                    <X size={10} color="#fff" />
                  </TouchableOpacity>
                </View>
              );
            })}
          </ScrollView>
        ) : (
          <Text style={[styles.emptyPreviewText, { color: colors.textSecondary }]}>No product images uploaded yet.</Text>
        )}
      </ScrollView>

      {/* Sticky Save Action */}
      <View style={[styles.footer, { backgroundColor: colors.card, borderTopColor: colors.border }]}>
        <TouchableOpacity
          style={[styles.saveBtn, { backgroundColor: colors.primary }]}
          onPress={handleSave}
          disabled={saving}
        >
          {saving ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              <Save size={20} color="#fff" style={{ marginRight: 8 }} />
              <Text style={styles.saveBtnText}>{isEditMode ? 'Update Product' : 'Create Product'}</Text>
            </>
          )}
        </TouchableOpacity>
      </View>
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
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 100,
  },
  label: {
    fontSize: 14,
    fontFamily: 'Outfit_700Bold',
    marginBottom: 6,
  },
  input: {
    borderWidth: 1.5,
    borderRadius: 10,
    height: 46,
    paddingHorizontal: 12,
    fontSize: 14,
    fontFamily: 'Outfit_500Medium',
    marginBottom: 16,
  },
  textarea: {
    borderWidth: 1.5,
    borderRadius: 10,
    padding: 12,
    fontSize: 14,
    fontFamily: 'Outfit_400Regular',
    height: 100,
    textAlignVertical: 'top',
    marginBottom: 16,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  col: {
    width: '48%',
  },
  catTabs: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 16,
  },
  catTab: {
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
    marginRight: 6,
    marginBottom: 6,
  },
  catTabText: {
    fontSize: 11,
    fontFamily: 'Outfit_700Bold',
  },
  sectionHeading: {
    fontSize: 15,
    fontFamily: 'Outfit_800ExtraBold',
    marginTop: 12,
    marginBottom: 12,
  },
  sizesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  sizeStockRow: {
    width: '30%',
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  sizeLabel: {
    fontSize: 13,
    fontFamily: 'Outfit_700Bold',
    width: 30,
  },
  sizeStockInput: {
    flex: 1,
    borderWidth: 1.5,
    borderRadius: 8,
    height: 36,
    textAlign: 'center',
    fontSize: 13,
    fontFamily: 'Outfit_600SemiBold',
  },
  pickerActionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  pickerBtn: {
    width: '48%',
    height: 46,
    borderRadius: 10,
    borderWidth: 1.5,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  pickerBtnText: {
    fontSize: 14,
    fontFamily: 'Outfit_700Bold',
  },
  imageAddRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  imageInput: {
    flex: 1,
    borderWidth: 1.5,
    borderRadius: 10,
    height: 46,
    paddingHorizontal: 12,
    fontSize: 13,
    fontFamily: 'Outfit_500Medium',
  },
  addImageBtn: {
    width: 46,
    height: 46,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  previewScrollView: {
    flexDirection: 'row',
    marginVertical: 4,
    height: 90,
  },
  previewWrapper: {
    width: 70,
    height: 80,
    borderRadius: 10,
    borderWidth: 1.5,
    marginRight: 10,
    position: 'relative',
    overflow: 'visible',
  },
  previewImage: {
    width: '100%',
    height: '100%',
    borderRadius: 8,
  },
  removeBadge: {
    position: 'absolute',
    top: -5,
    right: -5,
    backgroundColor: '#ef4444',
    width: 18,
    height: 18,
    borderRadius: 9,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 2,
    elevation: 4,
  },
  emptyPreviewText: {
    fontSize: 13,
    fontFamily: 'Outfit_400Regular',
    fontStyle: 'italic',
    marginBottom: 16,
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 74,
    borderTopWidth: 1,
    paddingHorizontal: 16,
    justifyContent: 'center',
  },
  saveBtn: {
    height: 48,
    borderRadius: 12,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  saveBtnText: {
    color: '#fff',
    fontSize: 16,
    fontFamily: 'Outfit_800ExtraBold',
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
