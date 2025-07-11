import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Modal,
  TextInput,
  TouchableOpacity,
  Image,
  Alert,
  ScrollView,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import * as ImageManipulator from 'expo-image-manipulator';

import { Product } from '@/hooks/useProducts';
import { useAuth } from '@clerk/clerk-expo';
import { useCategory } from '@/hooks/useCategories';
import { useProducts } from '@/hooks/useProducts';

interface EditProductModalProps {
  visible: boolean;
  product: Product | null;
  onClose: () => void;
  onProductUpdated: () => void;
}

const EditProductModal: React.FC<EditProductModalProps> = ({ visible, product, onClose, onProductUpdated }) => {
  const { categories, loading: categoriesLoading, error: categoriesError, getCategories, addCategory } = useCategory();
  const { saveProduct } = useProducts();
  const [formData, setFormData] = useState({
    name: '',
    category: '',
    price: '',
    quantity: '',
    image: '',
    originalPrice: '',
    unit: '',
    isActive: true,
    isOpen: false,
    description: '',
  });
  const [isLoading, setIsLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [showNewCategoryInput, setShowNewCategoryInput] = useState(false);
  const { getToken } = useAuth();

  // Define available units
  const availableUnits = ['piece', 'kg', 'gram', 'liter', 'ml'];

  useEffect(() => {
    if (visible) {
      getCategories();
    }
  }, [visible, getCategories]);

  useEffect(() => {
    if (product) {
      setFormData({
        name: product.name || '',
        category: product.category || '',
        price: product.discountedPrice?.toString() || '',
        quantity: product.stock?.toString() || '',
        image: product.image_url || '',
        originalPrice: product.originalPrice?.toString() || '',
        unit: product.unit || '',
        isActive: product.isActive ?? true,
        isOpen: product.isOpen ?? false,
        description: product.description || '',
      });
      if (product.category && !categories.some(cat => cat.name.toLowerCase() === product.category.toLowerCase())) {
        setNewCategoryName(product.category);
        setShowNewCategoryInput(true);
      } else {
        setNewCategoryName('');
        setShowNewCategoryInput(false);
      }
    } else {
      setFormData({
        name: '', category: '', price: '', quantity: '', image: '',
        originalPrice: '', unit: '', isActive: true, isOpen: false, description: '',
      });
      setNewCategoryName('');
      setShowNewCategoryInput(false);
    }
  }, [product, categories]);

  const uploadToCloudinary = async (imageUri: string) => {
    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', {
        uri: imageUri,
        type: 'image/jpeg',
        name: 'product-image.jpg',
      } as any);
      formData.append('upload_preset', 'my_preset');

      const response = await fetch(
        'https://api.cloudinary.com/v1_1/dzjlp82fv/image/upload',
        {
          method: 'POST',
          body: formData,
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        }
      );

      const data = await response.json();
      if (data.secure_url) {
        return data.secure_url;
      } else {
        throw new Error(data.error?.message || 'Upload failed');
      }
    } catch (error) {
      console.error('Cloudinary upload error:', error);
      Alert.alert('Upload Error', 'Failed to upload image. Please check your Cloudinary configuration and network.');
      throw error;
    } finally {
      setIsUploading(false);
    }
  };

  const pickImage = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission needed', 'Please grant camera roll permissions to upload images.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 1,
      });

      if (!result.canceled && result.assets[0]) {
        const imageAsset = result.assets[0];

        Alert.alert('Processing Image', 'Optimizing image for faster upload...');
        const manipResult = await ImageManipulator.manipulateAsync(
          imageAsset.uri,
          [
            { resize: { width: 800 } }
          ],
          { compress: 0.7, format: ImageManipulator.SaveFormat.JPEG }
        );

        try {
          const imageUrl = await uploadToCloudinary(manipResult.uri);
          setFormData(prev => ({ ...prev, image: imageUrl }));
          Alert.alert('Success', 'Image uploaded successfully!');
        } catch (error) {
          // Error already handled in uploadToCloudinary
        }
      }
    } catch (error) {
      console.error('Error picking or manipulating image:', error);
      Alert.alert('Error', 'Failed to pick or process image. Please try again.');
    }
  };

  const handleSave = async () => {
    if (!formData.name.trim() || !formData.price || !formData.quantity || !formData.category || !formData.unit) {
      Alert.alert('Error', 'Please fill in all required fields (Name, Category, Price, Quantity, Unit).');
      return;
    }

    setIsLoading(true);
    let finalCategory = formData.category;
    const token = await getToken();
    if (showNewCategoryInput && newCategoryName.trim() &&
        !categories.some(cat => cat.name.toLowerCase() === newCategoryName.trim().toLowerCase())) {
      try {
        await addCategory(newCategoryName.trim(), token!);
        finalCategory = newCategoryName.trim();
        // No alert here, success message will be for product save
      } catch (catError: any) {
        Alert.alert('Category Error', catError.message || 'Failed to add new category. Product will be saved with current category.');
      }
    }

    try {
      const payload = {
        ...(product?._id ? { _id: product._id } : {}),
        id: product?.id ?? '',
        name: formData.name.trim(),
        category: finalCategory,
        originalPrice: parseFloat(formData.originalPrice || formData.price),
        discountedPrice: parseFloat(formData.price),
        stock: parseInt(formData.quantity),
        image_url: formData.image,
        unit: formData.unit as 'piece' | 'kg' | 'gram' | 'liter' | 'ml', // Ensure unit type is correct
        isActive: formData.isActive,
        isOpen: formData.isOpen,
        description: formData.description,
      };

      await saveProduct(payload as Product, token!);

      Alert.alert('Success', `Product ${product ? 'updated' : 'added'} successfully!`);
      onProductUpdated();
      onClose();
    } catch (error: any) {
      console.error('Product save error:', error);
      Alert.alert('Error', error.message || `Failed to ${product ? 'update' : 'add'} product. Please try again.`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <SafeAreaView className="flex-1 bg-white">
        {/* Header */}
        <View className="flex-row items-center justify-between px-4 py-4 border-b border-gray-200">
          <TouchableOpacity onPress={onClose}>
            <Feather name="x" size={24} color="#374151" />
          </TouchableOpacity>
          <Text className="text-lg font-bold text-gray-800">{product ? 'Edit Product' : 'Add New Product'}</Text>
          <TouchableOpacity
            onPress={handleSave}
            disabled={isLoading || isUploading || categoriesLoading}
            className={`px-4 py-2 rounded-lg ${isLoading || isUploading || categoriesLoading ? 'bg-gray-400' : 'bg-blue-500'}`}
          >
            {isLoading ? (
              <ActivityIndicator size="small" color="white" />
            ) : (
              <Text className="font-medium text-white">Save</Text>
            )}
          </TouchableOpacity>
        </View>

        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          className="flex-1"
        >
          <ScrollView className="flex-1 px-4 py-6">
            {/* Product Image */}
            <View className="mb-6">
              <Text className="mb-3 text-base font-medium text-gray-700">Product Image</Text>
              <TouchableOpacity
                onPress={pickImage}
                disabled={isUploading}
                className="items-center justify-center w-32 h-32 bg-gray-100 border-2 border-gray-300 border-dashed rounded-lg"
              >
                {isUploading ? (
                  <ActivityIndicator size="large" color="#8B5CF6" />
                ) : formData.image ? (
                  <Image
                    source={{ uri: formData.image }}
                    className="w-full h-full rounded-lg"
                    resizeMode="cover"
                  />
                ) : (
                  <View className="items-center">
                    <Feather name="camera" size={24} color="#9CA3AF" />
                    <Text className="mt-2 text-sm text-gray-500">Add Photo</Text>
                  </View>
                )}
              </TouchableOpacity>
            </View>

            {/* Product Name */}
            <View className="mb-4">
              <Text className="mb-2 text-base font-medium text-gray-700">Product Name *</Text>
              <TextInput
                value={formData.name}
                onChangeText={(text) => setFormData(prev => ({ ...prev, name: text }))}
                placeholder="Enter product name"
                className="px-3 py-3 text-base border border-gray-200 rounded-lg"
              />
            </View>

            {/* Category */}
            <View className="mb-4">
              <Text className="mb-2 text-base font-medium text-gray-700">Category *</Text>
              {categoriesLoading ? (
                <ActivityIndicator size="small" color="#8B5CF6" />
              ) : categoriesError ? (
                <Text className="text-red-500">Error loading categories: {categoriesError}</Text>
              ) : (
                <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-2">
                  <View className="flex-row">
                    {categories.map((category) => (
                      <TouchableOpacity
                        key={category.id}
                        onPress={() => {
                          setFormData(prev => ({ ...prev, category: category.name }));
                          setShowNewCategoryInput(false);
                          setNewCategoryName('');
                        }}
                        className={`px-4 py-2 mr-2 rounded-full border ${
                          formData.category.toLowerCase() === category.name.toLowerCase()
                            ? 'bg-blue-500 border-blue-500'
                            : 'bg-white border-gray-300'
                        }`}
                      >
                        <Text
                          className={`font-medium text-sm ${
                            formData.category.toLowerCase() === category.name.toLowerCase()
                              ? 'text-white'
                              : 'text-gray-700'
                          }`}
                        >
                          {category.name}
                        </Text>
                      </TouchableOpacity>
                    ))}
                    {/* Button to add new category */}
                    <TouchableOpacity
                      onPress={() => {
                        setShowNewCategoryInput(true);
                        setFormData(prev => ({ ...prev, category: '' }));
                      }}
                      className={`px-4 py-2 mr-2 rounded-full border ${
                        showNewCategoryInput
                          ? 'bg-purple-500 border-purple-500'
                          : 'bg-white border-gray-300'
                      }`}
                    >
                      <Text
                        className={`font-medium text-sm ${
                          showNewCategoryInput
                            ? 'text-white'
                            : 'text-gray-700'
                        }`}
                      >
                        + Add New
                      </Text>
                    </TouchableOpacity>
                  </View>
                </ScrollView>
              )}

              {showNewCategoryInput && (
                <TextInput
                  value={newCategoryName}
                  onChangeText={(text) => {
                    setNewCategoryName(text);
                    setFormData(prev => ({ ...prev, category: text }));
                  }}
                  placeholder="Enter new category name"
                  className="px-3 py-3 mt-2 text-base border border-gray-200 rounded-lg"
                />
              )}
            </View>

            {/* Original Price */}
            <View className="mb-4">
              <Text className="mb-2 text-base font-medium text-gray-700">Original Price</Text>
              <TextInput
                value={formData.originalPrice}
                onChangeText={(text) => setFormData(prev => ({ ...prev, originalPrice: text }))}
                placeholder="Enter original price (optional)"
                keyboardType="numeric"
                className="px-3 py-3 text-base border border-gray-200 rounded-lg"
              />
            </View>

            {/* Discounted Price (Price) */}
            <View className="mb-4">
              <Text className="mb-2 text-base font-medium text-gray-700">Discounted Price *</Text>
              <TextInput
                value={formData.price}
                onChangeText={(text) => setFormData(prev => ({ ...prev, price: text }))}
                placeholder="Enter discounted price"
                keyboardType="numeric"
                className="px-3 py-3 text-base border border-gray-200 rounded-lg"
              />
            </View>

            {/* Quantity */}
            <View className="mb-4">
              <Text className="mb-2 text-base font-medium text-gray-700">Stock Quantity *</Text>
              <TextInput
                value={formData.quantity}
                onChangeText={(text) => setFormData(prev => ({ ...prev, quantity: text }))}
                placeholder="Enter stock quantity"
                keyboardType="numeric"
                className="px-3 py-3 text-base border border-gray-200 rounded-lg"
              />
            </View>

            {/* Unit Selection Buttons */}
            <View className="mb-4">
              <Text className="mb-2 text-base font-medium text-gray-700">Unit *</Text>
              <View className="flex-row flex-wrap">
                {availableUnits.map((unitOption) => (
                  <TouchableOpacity
                    key={unitOption}
                    onPress={() => setFormData(prev => ({ ...prev, unit: unitOption }))}
                    className={`px-4 py-2 mr-2 mb-2 rounded-full border ${
                      formData.unit === unitOption
                        ? 'bg-blue-500 border-blue-500'
                        : 'bg-white border-gray-300'
                    }`}
                  >
                    <Text
                      className={`font-medium text-sm ${
                        formData.unit === unitOption
                          ? 'text-white'
                          : 'text-gray-700'
                      }`}
                    >
                      {unitOption}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Description */}
            <View className="mb-4">
              <Text className="mb-2 text-base font-medium text-gray-700">Description</Text>
              <TextInput
                value={formData.description}
                onChangeText={(text) => setFormData(prev => ({ ...prev, description: text }))}
                placeholder="Enter product description"
                multiline
                numberOfLines={4}
                className="h-24 px-3 py-3 text-base border border-gray-200 rounded-lg"
                style={{ textAlignVertical: 'top' }} // For Android
              />
            </View>

            {/* Is Active Toggle */}
            <View className="flex-row items-center justify-between mb-4">
              <Text className="text-base font-medium text-gray-700">Is Active</Text>
              <TouchableOpacity
                onPress={() => setFormData(prev => ({ ...prev, isActive: !prev.isActive }))}
                className={`w-12 h-6 rounded-full p-1 ${formData.isActive ? 'bg-green-500' : 'bg-gray-300'}`}
              >
                <View className={`w-4 h-4 rounded-full bg-white shadow-md ${formData.isActive ? 'ml-auto' : 'mr-auto'}`} />
              </TouchableOpacity>
            </View>

            {/* Is Open Toggle (for weight-based products) */}
            <View className="flex-row items-center justify-between mb-6">
              <Text className="text-base font-medium text-gray-700">Is Open (Weight-based)</Text>
              <TouchableOpacity
                onPress={() => setFormData(prev => ({ ...prev, isOpen: !prev.isOpen }))}
                className={`w-12 h-6 rounded-full p-1 ${formData.isOpen ? 'bg-green-500' : 'bg-gray-300'}`}
              >
                <View className={`w-4 h-4 rounded-full bg-white shadow-md ${formData.isOpen ? 'ml-auto' : 'mr-auto'}`} />
              </TouchableOpacity>
            </View>

          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </Modal>
  );
};

export default EditProductModal;