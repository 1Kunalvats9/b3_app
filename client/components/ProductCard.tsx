import { View, Text, Image, TouchableOpacity, Alert } from 'react-native';
import React, { useState } from 'react';
import { Feather } from '@expo/vector-icons';
import { useCart } from '@/hooks/useCart';
import QuantityModal from './QuantityModal';

interface Product {
  id: string;
  name: string;
  description: string;
  originalPrice: number;
  discountedPrice: number;
  category: string;
  image_url: string;
  stock: number;
  isOpen: boolean;
  unit: string;
  isActive: boolean;
}

interface ProductCardProps {
  product: Product;
}

const ProductCard: React.FC<ProductCardProps> = ({ product }) => {
  const { addToCart, getItemQuantity, updateQuantity } = useCart();
  const [showQuantityModal, setShowQuantityModal] = useState(false);
  const cartQuantity = getItemQuantity(product.id);

  const handleAddToCart = () => {
    if (product.isOpen) {
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
    updateQuantity(product.id, cartQuantity + 1);
  };

  const handleDecrement = () => {
    if (cartQuantity > 1) {
      updateQuantity(product.id, cartQuantity - 1);
    } else {
      updateQuantity(product.id, 0);
    }
  };

  const discountPercentage = Math.round(((product.originalPrice - product.discountedPrice) / product.originalPrice) * 100);

  return (
    <>
      <View className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden mx-1 mb-3" style={{
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3
      }}>
        {/* Product Image */}
        <View className="relative">
          <Image
            source={{ uri: product.image_url || 'https://via.placeholder.com/150' }}
            className="w-full h-32"
            resizeMode="cover"
          />
          {discountPercentage > 0 && (
            <View className="absolute top-2 left-2 bg-red-500 px-2 py-1 rounded-full">
              <Text className="text-white text-xs font-bold">{discountPercentage}% OFF</Text>
            </View>
          )}
          {!product.isOpen && product.stock < 10 && product.stock > 0 && (
            <View className="absolute top-2 right-2 bg-orange-500 px-2 py-1 rounded-full">
              <Text className="text-white text-xs font-medium">Low Stock</Text>
            </View>
          )}
          {!product.isOpen && product.stock === 0 && (
            <View className="absolute inset-0 bg-black/50 items-center justify-center">
              <Text className="text-white font-bold">Out of Stock</Text>
            </View>
          )}
        </View>

        {/* Product Info */}
        <View className="p-3">
          <Text className="text-gray-800 font-semibold text-sm mb-1" numberOfLines={2}>
            {product.name}
          </Text>
          
          <View className="flex-row items-center mb-2">
            <Text className="text-green-600 font-bold text-base">
              ₹{product.discountedPrice}
            </Text>
            {product.originalPrice > product.discountedPrice && (
              <Text className="text-gray-400 text-sm line-through ml-2">
                ₹{product.originalPrice}
              </Text>
            )}
            <Text className="text-gray-500 text-xs ml-1">/{product.unit}</Text>
          </View>

          {!product.isOpen && (
            <Text className="text-gray-500 text-xs mb-2">
              Stock: {product.stock} {product.unit}s
            </Text>
          )}

          {/* Add to Cart Button */}
          {cartQuantity === 0 ? (
            <TouchableOpacity
              onPress={handleAddToCart}
              disabled={!product.isOpen && product.stock === 0}
              className={`flex-row items-center justify-center py-2 px-3 rounded-lg ${
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
                {product.isOpen ? 'Add' : 'Add to Cart'}
              </Text>
            </TouchableOpacity>
          ) : (
            <View className="flex-row items-center justify-between bg-green-50 rounded-lg p-1">
              <TouchableOpacity
                onPress={handleDecrement}
                className="bg-green-500 rounded-full p-1"
                activeOpacity={0.8}
              >
                <Feather name="minus" size={16} color="white" />
              </TouchableOpacity>
              
              <Text className="text-green-600 font-bold text-sm px-3">
                {cartQuantity} {product.unit}{cartQuantity > 1 ? 's' : ''}
              </Text>
              
              <TouchableOpacity
                onPress={handleIncrement}
                className="bg-green-500 rounded-full p-1"
                activeOpacity={0.8}
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