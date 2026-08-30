import React, { createContext, useContext, useState, useEffect } from 'react';
import { StyleSheet, Text, View, Animated, Dimensions } from 'react-native';
import { CheckCircle2, XCircle, AlertCircle, Info } from 'lucide-react-native';
import { useAppTheme } from './ThemeContext';

const ToastContext = createContext(null);

export const useToast = () => {
  const toast = useContext(ToastContext);
  if (!toast) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return toast;
};

const { width } = Dimensions.get('window');

function ToastCard({ toast }) {
  const { colors } = useAppTheme();
  const [fadeAnim] = useState(new Animated.Value(0));
  const [slideAnim] = useState(new Animated.Value(-40));

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start();

    // Fade out slightly before removal
    const fadeOutTimer = setTimeout(() => {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: -20,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();
    }, 2700);

    return () => clearTimeout(fadeOutTimer);
  }, []);

  const getToastConfig = () => {
    switch (toast.type) {
      case 'error':
        return {
          borderColor: colors.danger,
          icon: <XCircle size={20} color={colors.danger} />,
        };
      case 'warning':
        return {
          borderColor: colors.warning,
          icon: <AlertCircle size={20} color={colors.warning} />,
        };
      case 'info':
        return {
          borderColor: colors.accent,
          icon: <Info size={20} color={colors.accent} />,
        };
      case 'success':
      default:
        return {
          borderColor: colors.success,
          icon: <CheckCircle2 size={20} color={colors.success} />,
        };
    }
  };

  const config = getToastConfig();

  return (
    <Animated.View
      style={[
        styles.toastCard,
        {
          backgroundColor: colors.card,
          borderLeftColor: config.borderColor,
          shadowColor: colors.shadow || '#000',
          opacity: fadeAnim,
          transform: [{ translateY: slideAnim }],
        },
      ]}
    >
      <View style={styles.iconContainer}>{config.icon}</View>
      <Text style={[styles.toastText, { color: colors.text }]}>{toast.message}</Text>
    </Animated.View>
  );
}

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const showToast = (message, type = 'success') => {
    const id = Date.now().toString();
    setToasts((prev) => [...prev, { id, message, type }]);
  };

  useEffect(() => {
    if (toasts.length > 0) {
      const timer = setTimeout(() => {
        setToasts((prev) => prev.slice(1));
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [toasts]);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <View style={styles.toastContainer} pointerEvents="none">
        {toasts.map((t) => (
          <ToastCard key={t.id} toast={t} />
        ))}
      </View>
    </ToastContext.Provider>
  );
}

const styles = StyleSheet.create({
  toastContainer: {
    position: 'absolute',
    top: 50,
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 9999,
    paddingHorizontal: 20,
  },
  toastCard: {
    flexDirection: 'row',
    alignItems: 'center',
    width: width - 40,
    maxWidth: 400,
    backgroundColor: '#fff',
    borderRadius: 12,
    borderLeftWidth: 5,
    paddingVertical: 14,
    paddingHorizontal: 16,
    marginBottom: 10,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 8,
  },
  iconContainer: {
    marginRight: 12,
  },
  toastText: {
    fontSize: 14,
    fontFamily: 'Outfit_600SemiBold',
    flex: 1,
    lineHeight: 18,
  },
});
