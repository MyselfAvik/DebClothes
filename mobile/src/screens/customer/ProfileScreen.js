import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
  Modal,
} from 'react-native';
import { useAuth } from '../../context/AuthContext';
import { useAppTheme } from '../../context/ThemeContext';
import { useAppNavigation } from '../../context/NavigationContext';
import { useToast } from '../../context/ToastContext';
import {
  User,
  Mail,
  Shield,
  MapPin,
  Phone,
  Trash2,
  Edit3,
  Moon,
  Sun,
  LogOut,
  Plus,
  X,
  Lock,
  Key,
  Eye,
  EyeOff,
  CheckCircle2,
  ChevronRight,
  ShieldCheck,
  Smartphone,
  Navigation,
} from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Location from 'expo-location';

export default function ProfileScreen() {
  const {
    user,
    logout,
    addAddress,
    updateAddress,
    deleteAddress,
    changePassword,
    requestChangePasswordOtp,
    verifyChangePasswordOtp,
    deleteAccount,
  } = useAuth();
  const { colors, themeMode, toggleTheme, isDark } = useAppTheme();
  const { resetTo, navigateTo } = useAppNavigation();
  const { showToast } = useToast();

  // Address form state (Add / Edit)
  const [showForm, setShowForm] = useState(false);
  const [editingAddressId, setEditingAddressId] = useState(null);
  const [line1, setLine1] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [pincode, setPincode] = useState('');
  const [phone, setPhone] = useState('');
  const [savingAddress, setSavingAddress] = useState(false);
  const [detectingLocation, setDetectingLocation] = useState(false);

  const handleAutoDetectLocation = async () => {
    setDetectingLocation(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        showToast('Location permission denied. Please type address manually.', 'warning');
        return;
      }

      showToast('Fetching GPS coordinates...', 'info');
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      const [geo] = await Location.reverseGeocodeAsync({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      });

      if (geo) {
        setLine1([geo.name, geo.street, geo.district, geo.subregion].filter(Boolean).join(', ') || 'Current Location');
        setCity(geo.city || geo.subregion || geo.district || '');
        setState(geo.region || '');
        setPincode(geo.postalCode || '');
        showToast('📍 Address auto-detected from GPS!', 'success');
      }
    } catch (err) {
      showToast('Failed to auto-detect location.', 'error');
    } finally {
      setDetectingLocation(false);
    }
  };

  // Change Password Modal & Form State
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [passwordMode, setPasswordMode] = useState('direct'); // 'direct' | 'otp'
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [showCurrentPass, setShowCurrentPass] = useState(false);
  const [showNewPass, setShowNewPass] = useState(false);
  const [showConfirmPass, setShowConfirmPass] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);
  const [sendingOtp, setSendingOtp] = useState(false);

  const handleLogout = () => {
    Alert.alert('Sign Out', 'Are you sure you want to log out of your session?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign Out',
        style: 'destructive',
        onPress: async () => {
          await logout();
          resetTo('LOGIN');
        },
      },
    ]);
  };

  const handleEditAddress = (addr) => {
    setEditingAddressId(addr._id);
    setLine1(addr.line1 || '');
    setCity(addr.city || '');
    setState(addr.state || '');
    setPincode(addr.pincode || '');
    setPhone(addr.phone || '');
    setShowForm(true);
  };

  const handleCancelAddressForm = () => {
    setShowForm(false);
    setEditingAddressId(null);
    setLine1('');
    setCity('');
    setState('');
    setPincode('');
    setPhone('');
  };

  const handleSaveAddress = async () => {
    if (!line1 || !city || !state || !pincode || !phone) {
      Alert.alert('Validation Error', 'All fields are required.');
      return;
    }
    if (!/^\d{6}$/.test(pincode.trim())) {
      Alert.alert('Validation Error', 'Pincode must be a valid 6-digit number.');
      return;
    }
    if (!/^\d{10}$/.test(phone.trim())) {
      Alert.alert('Validation Error', 'Phone must be a valid 10-digit number.');
      return;
    }

    setSavingAddress(true);
    try {
      if (editingAddressId) {
        await updateAddress(editingAddressId, {
          line1: line1.trim(),
          city: city.trim(),
          state: state.trim(),
          pincode: pincode.trim(),
          phone: phone.trim(),
        });
        showToast('Address updated successfully.', 'success');
      } else {
        await addAddress({
          line1: line1.trim(),
          city: city.trim(),
          state: state.trim(),
          pincode: pincode.trim(),
          phone: phone.trim(),
        });
        showToast('Address added successfully.', 'success');
      }
      handleCancelAddressForm();
    } catch (err) {
      showToast(err.response?.data?.message || err.message || 'Failed to save address.', 'error');
    } finally {
      setSavingAddress(false);
    }
  };

  const handleDeleteAddress = (id) => {
    Alert.alert('Delete Address', 'Are you sure you want to delete this address?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteAddress(id);
            if (editingAddressId === id) {
              handleCancelAddressForm();
            }
            showToast('Address deleted.', 'info');
          } catch (err) {
            showToast(err.message || 'Failed to delete address.', 'error');
          }
        },
      },
    ]);
  };

  const resetPasswordState = () => {
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
    setOtpCode('');
    setOtpSent(false);
    setShowCurrentPass(false);
    setShowNewPass(false);
    setShowConfirmPass(false);
    setPasswordMode('direct');
    setShowPasswordModal(false);
  };

  const handleChangePasswordDirect = async () => {
    if (!currentPassword.trim()) {
      showToast('Please enter your current password', 'warning');
      return;
    }
    if (!newPassword.trim()) {
      showToast('Please enter a new password', 'warning');
      return;
    }
    if (newPassword.length < 6) {
      showToast('New password must be at least 6 characters', 'warning');
      return;
    }
    if (newPassword !== confirmPassword) {
      showToast('New password and confirm password do not match', 'warning');
      return;
    }
    if (currentPassword === newPassword) {
      showToast('New password cannot be the same as current password', 'warning');
      return;
    }

    setChangingPassword(true);
    try {
      await changePassword(currentPassword, newPassword);
      showToast('Password changed successfully!', 'success');
      resetPasswordState();
    } catch (err) {
      showToast(err.response?.data?.message || err.message || 'Failed to change password', 'error');
    } finally {
      setChangingPassword(false);
    }
  };

  const handleRequestOtp = async () => {
    setSendingOtp(true);
    try {
      await requestChangePasswordOtp();
      setOtpSent(true);
      showToast(`Verification code sent to ${user?.email}`, 'success');
    } catch (err) {
      showToast(err.response?.data?.message || err.message || 'Failed to send OTP', 'error');
    } finally {
      setSendingOtp(false);
    }
  };

  const handleVerifyOtpAndChangePass = async () => {
    if (!otpCode.trim() || otpCode.trim().length < 4) {
      showToast('Please enter the 6-digit OTP code', 'warning');
      return;
    }
    if (!newPassword.trim() || newPassword.length < 6) {
      showToast('New password must be at least 6 characters', 'warning');
      return;
    }
    if (newPassword !== confirmPassword) {
      showToast('Passwords do not match', 'warning');
      return;
    }

    setChangingPassword(true);
    try {
      await verifyChangePasswordOtp(otpCode.trim(), newPassword);
      showToast('Password reset successfully via OTP!', 'success');
      resetPasswordState();
    } catch (err) {
      showToast(err.response?.data?.message || err.message || 'Failed to reset password', 'error');
    } finally {
      setChangingPassword(false);
    }
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      'Delete Account & Data',
      'Are you sure you want to permanently delete your account, addresses, and all personal data? This action is irreversible.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Permanently Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              showToast('Deleting account and data...', 'info');
              await deleteAccount();
              showToast('Your account has been permanently deleted.', 'success');
              navigateTo('HOME');
            } catch (err) {
              showToast(err.response?.data?.message || err.message || 'Failed to delete account.', 'error');
            }
          },
        },
      ]
    );
  };

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Profile Header */}
      <LinearGradient
        colors={['#7c3aed', '#a855f7', '#ec4899']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.profileHeaderGradient}
      >
        <View style={styles.headerTopRow}>
          <View style={[styles.avatar, { backgroundColor: '#ffffff' }]}>
            <Text style={[styles.avatarText, { color: themeMode === 'dark' ? '#0f172a' : '#2874f0' }]}>
              {user?.name?.substring(0, 1).toUpperCase() || 'U'}
            </Text>
          </View>
          <View style={styles.headerInfo}>
            <Text style={styles.profileNameText}>{user?.name || 'User Name'}</Text>
            <View style={styles.metaRow}>
              <Mail size={13} color="rgba(255,255,255,0.85)" />
              <Text style={styles.profileMetaEmail}>{user?.email}</Text>
            </View>
          </View>
        </View>

        {/* Info Pills */}
        <View style={styles.infoPillsRow}>
          <View style={styles.infoPill}>
            <MapPin size={11} color="#ffffff" style={{ marginRight: 4 }} />
            <Text style={styles.infoPillText}>{user?.addresses?.length || 0} Saved Addresses</Text>
          </View>
          <View style={styles.infoPill}>
            <Shield size={11} color="#ffffff" style={{ marginRight: 4 }} />
            <Text style={styles.infoPillText}>{user?.role?.toUpperCase() || 'CUSTOMER'}</Text>
          </View>
        </View>
      </LinearGradient>

      {/* Theme Settings & Preferences */}
      <View style={[styles.settingsCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <Text style={[styles.cardTitle, { color: colors.text }]}>Preferences</Text>
        <TouchableOpacity style={[styles.settingRow, { borderBottomColor: colors.border }]} onPress={toggleTheme}>
          <View style={styles.settingLeft}>
            {themeMode === 'dark' ? <Sun size={20} color={colors.text} /> : <Moon size={20} color={colors.text} />}
            <Text style={[styles.settingLabel, { color: colors.text }]}>Appearance Theme</Text>
          </View>
          <Text style={[styles.settingValue, { color: colors.primary }]}>
            {themeMode === 'dark' ? 'Dark Mode' : 'Light Mode'}
          </Text>
        </TouchableOpacity>

        {user?.role === 'admin' && (
          <TouchableOpacity
            style={[styles.settingRow, { borderBottomColor: colors.border }]}
            onPress={() => navigateTo('ADMIN_DASHBOARD')}
          >
            <View style={styles.settingLeft}>
              <Shield size={20} color={colors.success} />
              <Text style={[styles.settingLabel, { color: colors.success, fontWeight: '750' }]}>Admin Control Panel</Text>
            </View>
            <Text style={[styles.settingValue, { color: colors.success }]}>Open</Text>
          </TouchableOpacity>
        )}

        <TouchableOpacity style={styles.settingRow} onPress={handleLogout}>
          <View style={styles.settingLeft}>
            <LogOut size={20} color="#ef4444" />
            <Text style={[styles.settingLabel, { color: '#ef4444' }]}>Log Out Session</Text>
          </View>
        </TouchableOpacity>
      </View>

      {/* Security & Password Section */}
      <View style={[styles.settingsCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <Text style={[styles.cardTitle, { color: colors.text }]}>Account Security & Data</Text>
        
        <TouchableOpacity
          style={[styles.settingRow, { borderBottomColor: colors.border }]}
          onPress={() => {
            resetPasswordState();
            setShowPasswordModal(true);
          }}
        >
          <View style={styles.settingLeft}>
            <View style={[styles.iconCircle, { backgroundColor: colors.primary + '18' }]}>
              <Lock size={18} color={colors.primary} />
            </View>
            <View style={{ marginLeft: 12 }}>
              <Text style={[styles.settingLabel, { color: colors.text, marginLeft: 0 }]}>Change Password</Text>
              <Text style={[styles.settingSubLabel, { color: colors.textSecondary }]}>
                Update current password or reset via OTP
              </Text>
            </View>
          </View>
          <ChevronRight size={18} color={colors.textSecondary} />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.settingRow}
          onPress={handleDeleteAccount}
        >
          <View style={styles.settingLeft}>
            <View style={[styles.iconCircle, { backgroundColor: 'rgba(239, 68, 68, 0.15)' }]}>
              <Trash2 size={18} color="#ef4444" />
            </View>
            <View style={{ marginLeft: 12 }}>
              <Text style={[styles.settingLabel, { color: '#ef4444', marginLeft: 0 }]}>Delete My Account</Text>
              <Text style={[styles.settingSubLabel, { color: colors.textSecondary }]}>
                Permanently erase account & all personal data
              </Text>
            </View>
          </View>
          <ChevronRight size={18} color={colors.textSecondary} />
        </TouchableOpacity>
      </View>

      {/* Address Book */}
      <View style={[styles.settingsCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={styles.addressBookHeader}>
          <Text style={[styles.cardTitle, { color: colors.text }]}>Address Book</Text>
          {!showForm && (
            <TouchableOpacity
              style={styles.addBtn}
              onPress={() => {
                handleCancelAddressForm();
                setShowForm(true);
              }}
            >
              <Plus size={16} color={colors.primary} />
              <Text style={[styles.addBtnText, { color: colors.primary }]}>Add</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* New / Edit Address Collapsible Form */}
        {showForm && (
          <View style={[styles.form, { borderColor: colors.border, backgroundColor: isDark ? '#161328' : '#faf5ff' }]}>
            <View style={styles.formHeader}>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                {editingAddressId ? (
                  <Edit3 size={15} color={colors.primary} style={{ marginRight: 6 }} />
                ) : (
                  <Plus size={15} color={colors.primary} style={{ marginRight: 6 }} />
                )}
                <Text style={[styles.formTitle, { color: colors.text }]}>
                  {editingAddressId ? 'Edit Shipping Address' : 'New Shipping Address'}
                </Text>
              </View>
              <TouchableOpacity onPress={handleCancelAddressForm}>
                <X size={18} color={colors.text} />
              </TouchableOpacity>
            </View>

            {/* Auto Detect Location Button */}
            <TouchableOpacity
              onPress={handleAutoDetectLocation}
              disabled={detectingLocation}
              activeOpacity={0.85}
              style={{ marginBottom: 12, borderRadius: 10, overflow: 'hidden' }}
            >
              <LinearGradient
                colors={['#ec4899', '#f43f5e', '#fb923c']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', height: 42, paddingHorizontal: 12 }}
              >
                {detectingLocation ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <>
                    <Navigation size={15} color="#fff" style={{ marginRight: 6 }} />
                    <Text style={{ color: '#fff', fontSize: 12, fontWeight: '800' }}>
                      📍 Auto-Detect Location (GPS)
                    </Text>
                  </>
                )}
              </LinearGradient>
            </TouchableOpacity>

            <TextInput
              style={[styles.input, { color: colors.text, borderColor: colors.border, backgroundColor: isDark ? '#131122' : '#ffffff' }]}
              placeholder="Street / Locality"
              placeholderTextColor={colors.textSecondary}
              value={line1}
              onChangeText={setLine1}
            />
            <TextInput
              style={[styles.input, { color: colors.text, borderColor: colors.border, backgroundColor: isDark ? '#131122' : '#ffffff' }]}
              placeholder="City"
              placeholderTextColor={colors.textSecondary}
              value={city}
              onChangeText={setCity}
            />
            <TextInput
              style={[styles.input, { color: colors.text, borderColor: colors.border, backgroundColor: isDark ? '#131122' : '#ffffff' }]}
              placeholder="State"
              placeholderTextColor={colors.textSecondary}
              value={state}
              onChangeText={setState}
            />
            <TextInput
              style={[styles.input, { color: colors.text, borderColor: colors.border, backgroundColor: isDark ? '#131122' : '#ffffff' }]}
              placeholder="Pincode"
              placeholderTextColor={colors.textSecondary}
              keyboardType="number-pad"
              maxLength={6}
              value={pincode}
              onChangeText={setPincode}
            />
            <TextInput
              style={[styles.input, { color: colors.text, borderColor: colors.border, backgroundColor: isDark ? '#131122' : '#ffffff' }]}
              placeholder="Phone (10 digits)"
              placeholderTextColor={colors.textSecondary}
              keyboardType="phone-pad"
              maxLength={10}
              value={phone}
              onChangeText={setPhone}
            />

            <TouchableOpacity
              onPress={handleSaveAddress}
              disabled={savingAddress}
              activeOpacity={0.85}
              style={{ marginTop: 4, borderRadius: 10, overflow: 'hidden' }}
            >
              <LinearGradient
                colors={['#7c3aed', '#a855f7', '#ec4899']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={[styles.saveBtn, { backgroundColor: 'transparent' }]}
              >
                {savingAddress ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.saveBtnText}>
                    {editingAddressId ? 'Update Address' : 'Save Address'}
                  </Text>
                )}
              </LinearGradient>
            </TouchableOpacity>
          </View>
        )}

        {/* Address Cards */}
        {user?.addresses && user.addresses.length > 0 ? (
          user.addresses.map((addr) => (
            <View key={addr._id} style={[styles.addressItem, { borderBottomColor: colors.border }]}>
              <View style={styles.addressLeft}>
                <MapPin size={18} color={colors.primary} />
                <View style={styles.addressDetails}>
                  <Text style={[styles.addressLine, { color: colors.text }]}>{addr.line1}</Text>
                  <Text style={[styles.addressSub, { color: colors.textSecondary }]}>
                    {addr.city}, {addr.state} - {addr.pincode}
                  </Text>
                  <View style={styles.phoneRow}>
                    <Phone size={12} color={colors.textSecondary} />
                    <Text style={[styles.phoneVal, { color: colors.textSecondary }]}>{addr.phone}</Text>
                  </View>
                </View>
              </View>

              <View style={styles.addressActions}>
                <TouchableOpacity
                  style={[
                    styles.addressActionBtn,
                    { backgroundColor: isDark ? 'rgba(124, 58, 237, 0.15)' : '#ede9fe' },
                  ]}
                  onPress={() => handleEditAddress(addr)}
                  activeOpacity={0.7}
                >
                  <Edit3 size={15} color={colors.primary} />
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.addressActionBtn,
                    { backgroundColor: isDark ? 'rgba(239, 68, 68, 0.15)' : '#fee2e2' },
                  ]}
                  onPress={() => handleDeleteAddress(addr._id)}
                  activeOpacity={0.7}
                >
                  <Trash2 size={15} color="#ef4444" />
                </TouchableOpacity>
              </View>
            </View>
          ))
        ) : (
          <Text style={[styles.emptyText, { color: colors.textSecondary }]}>No saved addresses found.</Text>
        )}
      </View>

      {/* Change Password Modal */}
      <Modal visible={showPasswordModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalCard, { backgroundColor: colors.card }]}>
            {/* Modal Header */}
            <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <View style={[styles.iconCircle, { backgroundColor: colors.primary + '18', marginRight: 10 }]}>
                  <Key size={18} color={colors.primary} />
                </View>
                <Text style={[styles.modalTitleText, { color: colors.text }]}>Change Password</Text>
              </View>
              <TouchableOpacity onPress={resetPasswordState}>
                <X size={20} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={{ paddingVertical: 16 }}>
              {/* Tab Selector: Direct vs OTP */}
              <View style={[styles.modeTabContainer, { backgroundColor: isDark ? '#1e293b' : '#f1f5f9' }]}>
                <TouchableOpacity
                  style={[
                    styles.modeTabBtn,
                    passwordMode === 'direct' && [styles.modeTabBtnActive, { backgroundColor: colors.card }],
                  ]}
                  onPress={() => setPasswordMode('direct')}
                >
                  <Lock size={14} color={passwordMode === 'direct' ? colors.primary : colors.textSecondary} style={{ marginRight: 6 }} />
                  <Text
                    style={[
                      styles.modeTabBtnText,
                      { color: passwordMode === 'direct' ? colors.primary : colors.textSecondary },
                    ]}
                  >
                    Current Password
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.modeTabBtn,
                    passwordMode === 'otp' && [styles.modeTabBtnActive, { backgroundColor: colors.card }],
                  ]}
                  onPress={() => setPasswordMode('otp')}
                >
                  <Mail size={14} color={passwordMode === 'otp' ? colors.primary : colors.textSecondary} style={{ marginRight: 6 }} />
                  <Text
                    style={[
                      styles.modeTabBtnText,
                      { color: passwordMode === 'otp' ? colors.primary : colors.textSecondary },
                    ]}
                  >
                    Reset via OTP
                  </Text>
                </TouchableOpacity>
              </View>

              {passwordMode === 'direct' ? (
                /* DIRECT CHANGE PASSWORD MODE */
                <View style={styles.formBody}>
                  {/* Current Password */}
                  <Text style={[styles.fieldLabel, { color: colors.text }]}>Current Password</Text>
                  <View style={[styles.passwordInputWrapper, { borderColor: colors.border }]}>
                    <TextInput
                      style={[styles.passwordTextInput, { color: colors.text }]}
                      placeholder="Enter your existing password"
                      placeholderTextColor={colors.textSecondary}
                      secureTextEntry={!showCurrentPass}
                      value={currentPassword}
                      onChangeText={setCurrentPassword}
                    />
                    <TouchableOpacity
                      onPress={() => setShowCurrentPass(!showCurrentPass)}
                      style={styles.eyeBtn}
                    >
                      {showCurrentPass ? (
                        <EyeOff size={18} color={colors.textSecondary} />
                      ) : (
                        <Eye size={18} color={colors.textSecondary} />
                      )}
                    </TouchableOpacity>
                  </View>

                  {/* New Password */}
                  <Text style={[styles.fieldLabel, { color: colors.text, marginTop: 14 }]}>New Password</Text>
                  <View style={[styles.passwordInputWrapper, { borderColor: colors.border }]}>
                    <TextInput
                      style={[styles.passwordTextInput, { color: colors.text }]}
                      placeholder="Min. 6 characters"
                      placeholderTextColor={colors.textSecondary}
                      secureTextEntry={!showNewPass}
                      value={newPassword}
                      onChangeText={setNewPassword}
                    />
                    <TouchableOpacity
                      onPress={() => setShowNewPass(!showNewPass)}
                      style={styles.eyeBtn}
                    >
                      {showNewPass ? (
                        <EyeOff size={18} color={colors.textSecondary} />
                      ) : (
                        <Eye size={18} color={colors.textSecondary} />
                      )}
                    </TouchableOpacity>
                  </View>

                  {/* Confirm New Password */}
                  <Text style={[styles.fieldLabel, { color: colors.text, marginTop: 14 }]}>Confirm New Password</Text>
                  <View style={[styles.passwordInputWrapper, { borderColor: colors.border }]}>
                    <TextInput
                      style={[styles.passwordTextInput, { color: colors.text }]}
                      placeholder="Re-enter new password"
                      placeholderTextColor={colors.textSecondary}
                      secureTextEntry={!showConfirmPass}
                      value={confirmPassword}
                      onChangeText={setConfirmPassword}
                    />
                    <TouchableOpacity
                      onPress={() => setShowConfirmPass(!showConfirmPass)}
                      style={styles.eyeBtn}
                    >
                      {showConfirmPass ? (
                        <EyeOff size={18} color={colors.textSecondary} />
                      ) : (
                        <Eye size={18} color={colors.textSecondary} />
                      )}
                    </TouchableOpacity>
                  </View>

                  <TouchableOpacity
                    style={[styles.primaryActionBtn, { backgroundColor: colors.primary, marginTop: 22 }]}
                    onPress={handleChangePasswordDirect}
                    disabled={changingPassword}
                  >
                    {changingPassword ? (
                      <ActivityIndicator color="#fff" />
                    ) : (
                      <Text style={styles.primaryActionBtnText}>Update Password</Text>
                    )}
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.forgotSwitchBtn}
                    onPress={() => {
                      setPasswordMode('otp');
                      if (!otpSent) handleRequestOtp();
                    }}
                  >
                    <Text style={[styles.forgotSwitchText, { color: colors.primary }]}>
                      Forgot current password? Reset with email OTP
                    </Text>
                  </TouchableOpacity>
                </View>
              ) : (
                /* OTP RESET PASSWORD MODE */
                <View style={styles.formBody}>
                  <View style={[styles.otpInfoBox, { backgroundColor: colors.primary + '10', borderColor: colors.primary + '30' }]}>
                    <Mail size={16} color={colors.primary} style={{ marginRight: 8, marginTop: 2 }} />
                    <Text style={[styles.otpInfoText, { color: colors.text }]}>
                      We will send a 6-digit verification code to your registered email: <Text style={{ fontWeight: '800' }}>{user?.email}</Text>
                    </Text>
                  </View>

                  {!otpSent ? (
                    <TouchableOpacity
                      style={[styles.primaryActionBtn, { backgroundColor: colors.primary, marginTop: 16 }]}
                      onPress={handleRequestOtp}
                      disabled={sendingOtp}
                    >
                      {sendingOtp ? (
                        <ActivityIndicator color="#fff" />
                      ) : (
                        <Text style={styles.primaryActionBtnText}>Send OTP Code to Email</Text>
                      )}
                    </TouchableOpacity>
                  ) : (
                    <>
                      {/* OTP Code Field */}
                      <Text style={[styles.fieldLabel, { color: colors.text, marginTop: 14 }]}>Enter 6-Digit OTP Code</Text>
                      <TextInput
                        style={[styles.input, { color: colors.text, borderColor: colors.border, letterSpacing: 4, fontWeight: '800', textAlign: 'center', fontSize: 18 }]}
                        placeholder="••••••"
                        placeholderTextColor={colors.textSecondary}
                        keyboardType="number-pad"
                        maxLength={6}
                        value={otpCode}
                        onChangeText={setOtpCode}
                      />

                      {/* New Password */}
                      <Text style={[styles.fieldLabel, { color: colors.text, marginTop: 14 }]}>New Password</Text>
                      <View style={[styles.passwordInputWrapper, { borderColor: colors.border }]}>
                        <TextInput
                          style={[styles.passwordTextInput, { color: colors.text }]}
                          placeholder="Min. 6 characters"
                          placeholderTextColor={colors.textSecondary}
                          secureTextEntry={!showNewPass}
                          value={newPassword}
                          onChangeText={setNewPassword}
                        />
                        <TouchableOpacity
                          onPress={() => setShowNewPass(!showNewPass)}
                          style={styles.eyeBtn}
                        >
                          {showNewPass ? (
                            <EyeOff size={18} color={colors.textSecondary} />
                          ) : (
                            <Eye size={18} color={colors.textSecondary} />
                          )}
                        </TouchableOpacity>
                      </View>

                      {/* Confirm New Password */}
                      <Text style={[styles.fieldLabel, { color: colors.text, marginTop: 14 }]}>Confirm New Password</Text>
                      <View style={[styles.passwordInputWrapper, { borderColor: colors.border }]}>
                        <TextInput
                          style={[styles.passwordTextInput, { color: colors.text }]}
                          placeholder="Re-enter new password"
                          placeholderTextColor={colors.textSecondary}
                          secureTextEntry={!showConfirmPass}
                          value={confirmPassword}
                          onChangeText={setConfirmPassword}
                        />
                        <TouchableOpacity
                          onPress={() => setShowConfirmPass(!showConfirmPass)}
                          style={styles.eyeBtn}
                        >
                          {showConfirmPass ? (
                            <EyeOff size={18} color={colors.textSecondary} />
                          ) : (
                            <Eye size={18} color={colors.textSecondary} />
                          )}
                        </TouchableOpacity>
                      </View>

                      <TouchableOpacity
                        style={[styles.primaryActionBtn, { backgroundColor: colors.primary, marginTop: 22 }]}
                        onPress={handleVerifyOtpAndChangePass}
                        disabled={changingPassword}
                      >
                        {changingPassword ? (
                          <ActivityIndicator color="#fff" />
                        ) : (
                          <Text style={styles.primaryActionBtnText}>Verify OTP & Update Password</Text>
                        )}
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={styles.forgotSwitchBtn}
                        onPress={handleRequestOtp}
                        disabled={sendingOtp}
                      >
                        <Text style={[styles.forgotSwitchText, { color: colors.primary }]}>
                          Didn't receive code? Resend OTP
                        </Text>
                      </TouchableOpacity>
                    </>
                  )}
                </View>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  profileHeaderGradient: {
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.12,
    shadowRadius: 6,
  },
  headerTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerInfo: {
    marginLeft: 16,
    flex: 1,
  },
  profileNameText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '900',
  },
  profileMetaEmail: {
    color: 'rgba(255,255,255,0.85)',
    fontSize: 12.5,
    marginLeft: 6,
    fontWeight: '600',
  },
  infoPillsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 16,
    borderTopWidth: 0.5,
    borderTopColor: 'rgba(255,255,255,0.2)',
    paddingTop: 14,
  },
  infoPill: {
    backgroundColor: 'rgba(255,255,255,0.15)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 10,
  },
  infoPillText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '800',
  },
  avatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  avatarText: {
    color: '#fff',
    fontSize: 32,
    fontWeight: '900',
  },
  name: {
    fontSize: 20,
    fontWeight: '900',
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
  },
  metaText: {
    fontSize: 14,
    marginLeft: 6,
  },
  roleBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    marginTop: 12,
  },
  roleText: {
    fontSize: 11,
    fontWeight: 'bold',
    marginLeft: 4,
  },
  settingsCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '800',
    marginBottom: 12,
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: 1,
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  iconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  settingLabel: {
    fontSize: 14.5,
    fontWeight: '700',
    marginLeft: 12,
  },
  settingSubLabel: {
    fontSize: 11.5,
    marginTop: 2,
  },
  settingValue: {
    fontSize: 14,
    fontWeight: '700',
  },
  addressBookHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  addBtnText: {
    fontSize: 14,
    fontWeight: '700',
    marginLeft: 4,
  },
  addressItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  addressLeft: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    flex: 1,
  },
  addressDetails: {
    marginLeft: 12,
    flex: 1,
  },
  addressLine: {
    fontSize: 14,
    fontWeight: '700',
  },
  addressSub: {
    fontSize: 12,
    marginTop: 2,
  },
  phoneRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  phoneVal: {
    fontSize: 12,
    marginLeft: 4,
  },
  addressActions: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 8,
  },
  addressActionBtn: {
    width: 32,
    height: 32,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 6,
  },
  emptyText: {
    fontSize: 14,
    fontStyle: 'italic',
    paddingVertical: 10,
  },
  form: {
    borderWidth: 1,
    borderRadius: 10,
    padding: 12,
    marginBottom: 16,
  },
  formHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  formTitle: {
    fontSize: 13,
    fontWeight: '800',
  },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    height: 42,
    paddingHorizontal: 12,
    fontSize: 13.5,
    marginBottom: 10,
  },
  saveBtn: {
    height: 40,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 4,
  },
  saveBtnText: {
    color: '#fff',
    fontSize: 13.5,
    fontWeight: '700',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 18,
  },
  modalCard: {
    width: '100%',
    maxHeight: '85%',
    borderRadius: 16,
    padding: 18,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: 14,
    borderBottomWidth: 1,
  },
  modalTitleText: {
    fontSize: 17,
    fontWeight: '800',
  },
  modeTabContainer: {
    flexDirection: 'row',
    borderRadius: 10,
    padding: 4,
    marginBottom: 18,
  },
  modeTabBtn: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 8,
    borderRadius: 8,
  },
  modeTabBtnActive: {
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  modeTabBtnText: {
    fontSize: 12.5,
    fontWeight: '750',
  },
  formBody: {
    paddingHorizontal: 2,
  },
  fieldLabel: {
    fontSize: 12.5,
    fontWeight: '750',
    marginBottom: 6,
  },
  passwordInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 8,
    height: 44,
    paddingHorizontal: 12,
  },
  passwordTextInput: {
    flex: 1,
    fontSize: 13.5,
    height: '100%',
  },
  eyeBtn: {
    padding: 6,
  },
  primaryActionBtn: {
    height: 44,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  primaryActionBtnText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '800',
  },
  forgotSwitchBtn: {
    alignSelf: 'center',
    marginTop: 16,
    paddingVertical: 6,
  },
  forgotSwitchText: {
    fontSize: 12,
    fontWeight: '700',
    textDecorationLine: 'underline',
  },
  otpInfoBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    marginBottom: 10,
  },
  otpInfoText: {
    flex: 1,
    fontSize: 12,
    lineHeight: 18,
  },
});

