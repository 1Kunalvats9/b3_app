import React, { useState } from 'react';
import { View, Text, Image, TouchableOpacity, Alert, Dimensions } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useCart } from '@/hooks/useCart';
import QuantityModal from './QuantityModal';
import { Product } from '@/hooks/useProducts';


interface ProductCardProps {
  product: Product;
  isAdmin?: boolean;
  onEdit?: (product: Product) => void;
}

const ProductCard: React.FC<ProductCardProps> = ({ product, isAdmin = false, onEdit }) => { // Destructure isAdmin and onEdit, provide default false for isAdmin
  const { addToCart, getItemQuantity, updateQuantity } = useCart();
  const [showQuantityModal, setShowQuantityModal] = useState(false);
  const cartQuantity = getItemQuantity(product.id);

  const handleAddToCart = () => {
    if (product.isOpen && product.unit === 'kg') {
      setShowQuantityModal(true);
    } else {
      addToCart(product, 1);
    }
  };

  const handleQuantityConfirm = (quantity: number) => {
    addToCart(product, quantity);
    setShowQuantityModal(false);
  };

  const handleIncrement = () => {
    if (!product.isOpen && product.stock <= cartQuantity) {
      Alert.alert('Stock Limit', 'Cannot add more items. Stock limit reached.');
      return;
    }
    updateQuantity(product.id, cartQuantity + 1);
  };

  const handleDecrement = () => {
    if (cartQuantity > 1) {
      updateQuantity(product.id, cartQuantity - 1);
    } else {
      updateQuantity(product.id, 0);
    }
  };

  const handleEdit = () => { // New handleEdit function
    if (onEdit) {
      onEdit(product);
    }
  };

  const discountPercentage = Math.round(((product.originalPrice - product.discountedPrice) / product.originalPrice) * 100);

  return (
    <>
      <View
        className="mx-1 mb-3 overflow-hidden bg-white border border-gray-100 shadow-sm rounded-2xl"
        style={{
          width: (Dimensions.get('window').width - 32) / 2 - 8, 
          height: 250, 
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.1,
          shadowRadius: 4,
          elevation: 3
        }}
      >
        <View className="relative">
          <Image
            source={{ uri: product.image_url || 'https://via.placeholder.com/150' }}
            className="w-full h-28" 
            resizeMode="cover"
          />
          {discountPercentage > 0 && (
            <View className="absolute px-2 py-1 bg-red-500 rounded-full top-2 left-2">
              <Text className="text-xs font-bold text-white">{discountPercentage}% OFF</Text>
            </View>
          )}
          {!product.isOpen && product.stock < 10 && product.stock > 0 && (
            <View className="absolute px-2 py-1 bg-orange-500 rounded-full top-2 right-2">
              <Text className="text-xs font-medium text-white">Low Stock</Text>
            </View>
          )}
          {!product.isOpen && product.stock === 0 && (
            <View className="absolute inset-0 items-center justify-center bg-black/50">
              <Text className="font-bold text-white">Out of Stock</Text>
            </View>
          )}

          {isAdmin && (
            <TouchableOpacity
              onPress={handleEdit}
              className="absolute p-2 bg-blue-500 rounded-full top-2 right-2"
              style={{
                zIndex: 10
              }}
            >
              <Feather name="edit-2" size={14} color="white" />
            </TouchableOpacity>
          )}
        </View>

        <View className="justify-between flex-1 p-3">
          <View>
            <Text className="mb-1 text-sm font-semibold text-gray-800" numberOfLines={2}>
              {product.name}
            </Text>
          
            <View className="flex-row items-center mb-2">
              <Text className="text-base font-bold text-green-600">
                ₹{product.discountedPrice}
              </Text>
              {product.originalPrice > product.discountedPrice && (
                <Text className="ml-2 text-sm text-gray-400 line-through">
                  ₹{product.originalPrice}
                </Text>
              )}
              <Text className="ml-1 text-xs text-gray-500">/{product.unit}</Text>
            </View>

            {!product.isOpen && (
              <Text className="mb-2 text-xs text-gray-500">
                Stock: {product.stock} {product.unit}s
              </Text>
            )}
          </View>

          {/* Add to Cart Button */}
          {cartQuantity === 0 ? (
            <TouchableOpacity
              onPress={handleAddToCart}
              disabled={!product.isOpen && product.stock === 0}
              className={`flex-row items-center justify-center py-2 px-3 rounded-lg mt-2 ${
                !product.isOpen && product.stock === 0
                  ? 'bg-gray-300'
                  : 'bg-green-500'
              }`}
              activeOpacity={0.8}
            >
              <Feather
                name="shopping-cart"
                size={16}
                color={!product.isOpen && product.stock === 0 ? '#9CA3AF' : 'white'}
              />
              <Text className={`ml-2 font-medium text-sm ${
                !product.isOpen && product.stock === 0 ? 'text-gray-500' : 'text-white'
              }`}>
                Add to Cart
              </Text>
            </TouchableOpacity>
          ) : (
            <View className="flex-row items-center justify-between p-1 mt-2 rounded-lg bg-green-50">
              <TouchableOpacity
                onPress={handleDecrement}
                className="p-1 bg-green-500 rounded-full"
                activeOpacity={0.8}
              >
                <Feather name="minus" size={16} color="white" />
              </TouchableOpacity>
              
              <Text className="px-3 text-sm font-bold text-green-600">
                {cartQuantity} {product.unit}{cartQuantity > 1 ? 's' : ''}
              </Text>
              
              <TouchableOpacity
                onPress={handleIncrement}
                className="p-1 bg-green-500 rounded-full"
                activeOpacity={0.8}
                disabled={!product.isOpen && product.stock <= cartQuantity}
                style={{
                  opacity: (!product.isOpen && product.stock <= cartQuantity) ? 0.5 : 1
                }}
              >
                <Feather name="plus" size={16} color="white" />
              </TouchableOpacity>
            </View>
          )}
        </View>
      </View>

      <QuantityModal
        visible={showQuantityModal}
        product={product}
        onConfirm={handleQuantityConfirm}
        onCancel={() => setShowQuantityModal(false)}
      />
    </>
  );
};

export default ProductCard;