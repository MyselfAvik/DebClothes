import React, { createContext, useState, useEffect, useContext } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from './AuthContext';
import { useToast } from './ToastContext';

const WishlistContext = createContext();

export const WishlistProvider = ({ children }) => {
  const [wishlist, setWishlist] = useState([]);
  const { user } = useAuth();
  const { showToast } = useToast();

  useEffect(() => {
    if (user) {
      loadWishlist();
    } else {
      setWishlist([]);
    }
  }, [user]);

  const loadWishlist = async () => {
    try {
      const stored = await AsyncStorage.getItem(`@wishlist_${user._id}`);
      if (stored) {
        setWishlist(JSON.parse(stored));
      } else {
        setWishlist([]);
      }
    } catch (err) {
      console.log('Failed to load wishlist', err);
    }
  };

  const toggleWishlist = async (product) => {
    if (!user) {
      showToast('Please sign in to save items to your wishlist.', 'warning');
      return;
    }

    try {
      let updatedList = [...wishlist];
      const index = updatedList.findIndex((item) => item._id === product._id);

      if (index >= 0) {
        updatedList.splice(index, 1);
        showToast('Item removed from wishlist.', 'info');
      } else {
        updatedList.push(product);
        showToast('Item added to wishlist!', 'success');
      }

      setWishlist(updatedList);
      await AsyncStorage.setItem(`@wishlist_${user._id}`, JSON.stringify(updatedList));
    } catch (err) {
      console.log('Failed to toggle wishlist', err);
    }
  };

  const isWishlisted = (productId) => {
    return wishlist.some((item) => item._id === productId);
  };

  return (
    <WishlistContext.Provider value={{ wishlist, toggleWishlist, isWishlisted }}>
      {children}
    </WishlistContext.Provider>
  );
};

export const useWishlist = () => useContext(WishlistContext);
