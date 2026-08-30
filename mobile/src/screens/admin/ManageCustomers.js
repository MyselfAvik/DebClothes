import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useAppTheme } from '../../context/ThemeContext';
import { useAppNavigation } from '../../context/NavigationContext';
import API from '../../api/api';
import { User, Shield, ShieldAlert, ArrowLeft } from 'lucide-react-native';

export default function ManageCustomers() {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [updatingId, setUpdatingId] = useState(null);

  const { colors } = useAppTheme();
  const { goBack } = useAppNavigation();

  useEffect(() => {
    fetchCustomers();
  }, []);

  const fetchCustomers = async () => {
    setLoading(true);
    setError('');
    try {
      const { data } = await API.get('/api/auth/users');
      setCustomers(data || []);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch customers registry');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleRole = (userId, currentRole, name) => {
    const newRole = currentRole === 'admin' ? 'customer' : 'admin';
    Alert.alert(
      'Change User Role',
      `Are you sure you want to change "${name}" to a ${newRole.toUpperCase()}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Change',
          onPress: async () => {
            setUpdatingId(userId);
            try {
              await API.put(`/api/auth/users/${userId}/role`, { role: newRole });
              Alert.alert('Success', `Role updated to ${newRole}.`);
              fetchCustomers();
            } catch (err) {
              Alert.alert('Failed', err.response?.data?.message || 'Role modification failed.');
            } finally {
              setUpdatingId(null);
            }
          },
        },
      ]
    );
  };

  const renderCustomerItem = ({ item }) => {
    const isAdmin = item.role === 'admin';

    return (
      <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={[styles.avatar, { backgroundColor: isAdmin ? colors.primary + '20' : colors.border }]}>
          {isAdmin ? (
            <ShieldAlert size={20} color={colors.primary} />
          ) : (
            <User size={20} color={colors.textSecondary} />
          )}
        </View>

        <View style={styles.meta}>
          <Text style={[styles.name, { color: colors.text }]}>{item.name}</Text>
          <Text style={[styles.email, { color: colors.textSecondary }]}>{item.email}</Text>
          <Text style={[styles.role, { color: isAdmin ? colors.primary : colors.textSecondary }]}>
            Role: {item.role?.toUpperCase()}
          </Text>
        </View>

        {updatingId === item._id ? (
          <ActivityIndicator size="small" color={colors.primary} />
        ) : (
          <TouchableOpacity
            style={[styles.toggleBtn, { borderColor: colors.border }]}
            onPress={() => handleToggleRole(item._id, item.role, item.name)}
          >
            <Shield size={16} color={colors.text} style={{ marginRight: 6 }} />
            <Text style={[styles.toggleText, { color: colors.text }]}>Toggle Role</Text>
          </TouchableOpacity>
        )}
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
        <Text style={[styles.headerTitle, { color: colors.text }]}>Manage Customers</Text>
      </View>

      {loading && customers.length === 0 ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : null}

      {error ? <Text style={[styles.errorText, { color: colors.danger }]}>{error}</Text> : null}

      {!loading && customers.length === 0 ? (
        <Text style={[styles.emptyText, { color: colors.textSecondary }]}>No registered customers found.</Text>
      ) : (
        <FlatList
          data={customers}
          renderItem={renderCustomerItem}
          keyExtractor={(item) => item._id}
          contentContainerStyle={styles.listContent}
          onRefresh={fetchCustomers}
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
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  meta: {
    flex: 1,
    marginLeft: 12,
  },
  name: {
    fontSize: 14,
    fontFamily: 'Outfit_700Bold',
  },
  email: {
    fontSize: 12,
    fontFamily: 'Outfit_400Regular',
    marginTop: 2,
  },
  role: {
    fontSize: 11,
    fontFamily: 'Outfit_800ExtraBold',
    marginTop: 4,
  },
  toggleBtn: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  toggleText: {
    fontSize: 12,
    fontFamily: 'Outfit_700Bold',
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
