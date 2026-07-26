import React, { createContext, useState, useEffect, useContext } from 'react';
import API from '../api/axios';
import { useAuth } from './AuthContext';

const CartContext = createContext();

export const CartProvider = ({ children }) => {
  const [cart, setCart] = useState({ items: [] });
  const [cartLoading, setCartLoading] = useState(false);
  const [cartError, setCartError] = useState(null);

  const { user } = useAuth();

  // Load cart when user logs in, or clear when logged out
  useEffect(() => {
    if (user) {
      fetchCart();
    } else {
      setCart({ items: [] });
    }
  }, [user]);

  const fetchCart = async () => {
    setCartLoading(true);
    setCartError(null);
    try {
      const { data } = await API.get('/api/cart');
      setCart(data);
      setCartLoading(false);
    } catch (err) {
      setCartError(err.response?.data?.message || 'Failed to fetch cart');
      setCartLoading(false);
    }
  };

  const addToCart = async (productId, size, qty) => {
    setCartLoading(true);
    setCartError(null);
    try {
      const { data } = await API.post('/api/cart', { productId, size, qty });
      setCart(data);
      setCartLoading(false);
      return data;
    } catch (err) {
      const errMsg = err.response?.data?.message || 'Failed to add item to cart';
      setCartError(errMsg);
      setCartLoading(false);
      throw new Error(errMsg);
    }
  };

  const updateCartItemQty = async (itemId, qty) => {
    setCartLoading(true);
    setCartError(null);
    try {
      const { data } = await API.put(`/api/cart/${itemId}`, { qty });
      setCart(data);
      setCartLoading(false);
      return data;
    } catch (err) {
      const errMsg = err.response?.data?.message || 'Failed to update quantity';
      setCartError(errMsg);
      setCartLoading(false);
      throw new Error(errMsg);
    }
  };

  const removeFromCart = async (itemId) => {
    setCartLoading(true);
    setCartError(null);
    try {
      const { data } = await API.delete(`/api/cart/${itemId}`);
      setCart(data);
      setCartLoading(false);
      return data;
    } catch (err) {
      const errMsg = err.response?.data?.message || 'Failed to remove item';
      setCartError(errMsg);
      setCartLoading(false);
      throw new Error(errMsg);
    }
  };

  const clearCart = async () => {
    setCartLoading(true);
    setCartError(null);
    try {
      const { data } = await API.delete('/api/cart');
      setCart({ items: [] });
      setCartLoading(false);
      return data;
    } catch (err) {
      const errMsg = err.response?.data?.message || 'Failed to clear cart';
      setCartError(errMsg);
      setCartLoading(false);
      throw new Error(errMsg);
    }
  };

  const getCartCount = () => {
    if (!cart || !cart.items) return 0;
    return cart.items.reduce((acc, item) => acc + item.qty, 0);
  };

  return (
    <CartContext.Provider
      value={{
        cart,
        cartLoading,
        cartError,
        fetchCart,
        addToCart,
        updateCartItemQty,
        removeFromCart,
        clearCart,
        getCartCount,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => useContext(CartContext);
