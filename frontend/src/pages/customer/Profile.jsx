import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { User, Mail, MapPin, Key, Trash, Plus, Shield, Navigation, AlertCircle, CheckCircle, RefreshCw, Edit2 } from 'lucide-react';
import toast from 'react-hot-toast';

const Profile = () => {
  const { user, addAddress, updateAddress, deleteAddress, requestChangePasswordOtp, verifyChangePasswordOtp } = useAuth();

  // Address Form States
  const [showAddAddress, setShowAddAddress] = useState(false);
  const [editingAddressId, setEditingAddressId] = useState(null);
  const [line1, setLine1] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [pincode, setPincode] = useState('');
  const [phone, setPhone] = useState('');
  
  const [addressLoading, setAddressLoading] = useState(false);
  const [addressError, setAddressError] = useState('');
  const [addressSuccess, setAddressSuccess] = useState('');
  const [geoLoading, setGeoLoading] = useState(false);

  // Change Password States
  const [showPasswordOtp, setShowPasswordOtp] = useState(false);
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordError, setPasswordError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState('');

  // Handle Geolocation reverse geocoding
  const handleUseCurrentLocation = () => {
    setAddressError('');
    if (!navigator.geolocation) {
      const msg = 'Geolocation is not supported by your browser';
      setAddressError(msg);
      toast.error(msg);
      return;
    }

    setGeoLoading(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        try {
          const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`,
            {
              headers: {
                'Accept-Language': 'en',
              },
            }
          );
          const data = await response.json();
          if (data && data.address) {
            const addr = data.address;
            
            const road = addr.road || '';
            const neighborhood = addr.neighbourhood || addr.suburb || '';
            const line = [road, neighborhood].filter(Boolean).join(', ');
            
            setLine1(line || data.display_name || '');
            setCity(addr.city || addr.town || addr.village || addr.county || '');
            setState(addr.state || '');
            setPincode(addr.postcode || '');
            
            const successMsg = 'Location detected successfully!';
            setAddressSuccess(successMsg);
            toast.success(successMsg);
            setTimeout(() => setAddressSuccess(''), 3000);
          } else {
            const err = 'Could not resolve coordinates into an address';
            setAddressError(err);
            toast.error(err);
          }
        } catch (err) {
          const err2 = 'Failed to fetch address details from location service';
          setAddressError(err2);
          toast.error(err2);
        } finally {
          setGeoLoading(false);
        }
      },
      (error) => {
        setGeoLoading(false);
        let errMsg = '';
        switch (error.code) {
          case error.PERMISSION_DENIED:
            errMsg = 'Location permission denied. Please allow access in browser settings.';
            break;
          case error.POSITION_UNAVAILABLE:
            errMsg = 'Location information is unavailable.';
            break;
          case error.TIMEOUT:
            errMsg = 'Request to get location timed out.';
            break;
          default:
            errMsg = 'An unknown location error occurred.';
            break;
        }
        setAddressError(errMsg);
        toast.error(errMsg);
      },
      { timeout: 10000 }
    );
  };

  const handleEditAddress = (addr) => {
    setEditingAddressId(addr._id);
    setLine1(addr.line1 || '');
    setCity(addr.city || '');
    setState(addr.state || '');
    setPincode(addr.pincode || '');
    setPhone(addr.phone || '');
    setShowAddAddress(true);
    setAddressError('');
    setAddressSuccess('');
  };

  const handleCancelAddressForm = () => {
    setShowAddAddress(false);
    setEditingAddressId(null);
    setLine1('');
    setCity('');
    setState('');
    setPincode('');
    setPhone('');
    setAddressError('');
  };

  // Submit new / updated address
  const handleAddAddressSubmit = async (e) => {
    e.preventDefault();
    setAddressError('');
    setAddressSuccess('');

    if (!line1 || !city || !state || !pincode || !phone) {
      const err = 'All address fields are required';
      setAddressError(err);
      toast.error(err);
      return;
    }

    setAddressLoading(true);
    try {
      if (editingAddressId) {
        await updateAddress(editingAddressId, { line1, city, state, pincode, phone });
        const successMsg = 'Address updated successfully!';
        setAddressSuccess(successMsg);
        toast.success(successMsg);
      } else {
        await addAddress({ line1, city, state, pincode, phone });
        const successMsg = 'Address saved successfully!';
        setAddressSuccess(successMsg);
        toast.success(successMsg);
      }
      
      handleCancelAddressForm();
    } catch (err) {
      const err2 = err.response?.data?.message || 'Failed to save address';
      setAddressError(err2);
      toast.error(err2);
    } finally {
      setAddressLoading(false);
    }
  };

  // Delete saved address
  const handleDeleteAddress = async (addrId) => {
    if (!window.confirm('Are you sure you want to delete this saved address?')) return;
    
    setAddressError('');
    try {
      await deleteAddress(addrId);
      if (editingAddressId === addrId) {
        handleCancelAddressForm();
      }
      const successMsg = 'Address deleted successfully.';
      setAddressSuccess(successMsg);
      toast.success(successMsg);
      setTimeout(() => setAddressSuccess(''), 3000);
    } catch (err) {
      const err2 = err.response?.data?.message || 'Failed to delete address';
      setAddressError(err2);
      toast.error(err2);
    }
  };

  // Request password change OTP
  const handleRequestPasswordOtp = async () => {
    setPasswordError('');
    setPasswordSuccess('');
    setPasswordLoading(true);
    try {
      const data = await requestChangePasswordOtp();
      setShowPasswordOtp(true);
      const successMsg = data.message || 'OTP code sent successfully!';
      setPasswordSuccess(successMsg);
      toast.success(successMsg);
    } catch (err) {
      const err2 = err.response?.data?.message || 'Failed to request password reset OTP';
      setPasswordError(err2);
      toast.error(err2);
    } finally {
      setPasswordLoading(false);
    }
  };

  // Verify OTP and change password
  const handleChangePasswordSubmit = async (e) => {
    e.preventDefault();
    setPasswordError('');
    setPasswordSuccess('');

    if (!otp || !newPassword) {
      const err = 'Please fill in both fields';
      setPasswordError(err);
      toast.error(err);
      return;
    }

    if (newPassword.length < 6) {
      const err = 'Password must be at least 6 characters long';
      setPasswordError(err);
      toast.error(err);
      return;
    }

    setPasswordLoading(true);
    try {
      const data = await verifyChangePasswordOtp(otp, newPassword);
      const successMsg = data.message || 'Password updated successfully!';
      setPasswordSuccess(successMsg);
      toast.success(successMsg);
      setOtp('');
      setNewPassword('');
      setShowPasswordOtp(false);
    } catch (err) {
      const err2 = err.response?.data?.message || 'Failed to change password';
      setPasswordError(err2);
      toast.error(err2);
    } finally {
      setPasswordLoading(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      {/* Page Title Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white">Account Settings</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Manage saved addresses and secure your login parameters</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Account Details & Security */}
        <div className="space-y-6 lg:col-span-1">
          {/* User Info Card */}
          <div className="glass-card rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-xl space-y-6">
            <div className="flex items-center gap-4">
              <div className="relative">
                <div className="h-16 w-16 rounded-2xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-purple-600 p-0.5 shadow-lg shadow-blue-500/30">
                  <div className="h-full w-full rounded-[14px] bg-white dark:bg-[#0f172a] flex items-center justify-center text-blue-600 dark:text-blue-400 font-black text-2xl">
                    {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
                  </div>
                </div>
                <span className="absolute -bottom-1 -right-1 flex h-4 w-4">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-4 w-4 bg-emerald-500 border-2 border-white dark:border-[#0f172a]"></span>
                </span>
              </div>
              <div>
                <h2 className="text-xl font-extrabold text-slate-900 dark:text-white">{user?.name}</h2>
                <div className="flex items-center gap-2 mt-1">
                  <span className="inline-flex items-center gap-1 rounded-full bg-blue-500/10 px-2.5 py-0.5 text-[10px] font-extrabold text-blue-600 dark:text-blue-400 uppercase tracking-wider border border-blue-500/20">
                    {user?.role}
                  </span>
                  <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-600 dark:text-emerald-400">
                    <CheckCircle className="h-3.5 w-3.5" />
                    <span>Verified</span>
                  </span>
                </div>
              </div>
            </div>

            <div className="space-y-3 pt-3 border-t border-slate-150 dark:border-slate-800 text-sm">
              <div className="flex items-center gap-3 text-slate-700 dark:text-slate-200 font-medium">
                <Mail className="h-4.5 w-4.5 text-blue-500" />
                <span className="truncate">{user?.email}</span>
              </div>
              <div className="flex items-center gap-3 text-slate-700 dark:text-slate-200 font-medium">
                <Shield className="h-4.5 w-4.5 text-emerald-500" />
                <span>Verified Account</span>
              </div>
            </div>
          </div>

          {/* Change Password Card */}
          <div className="glass-card rounded-2xl p-6 border border-slate-200 dark:border-slate-850 space-y-6">
            <div>
              <h2 className="text-md font-bold text-slate-900 dark:text-white">Security & Password</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Change password via verified email OTP token</p>
            </div>

            {passwordSuccess && (
              <div className="flex items-center gap-2 rounded-lg bg-emerald-500/10 p-4 text-xs text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                <CheckCircle className="h-4.5 w-4.5 shrink-0" />
                <span>{passwordSuccess}</span>
              </div>
            )}

            {passwordError && (
              <div className="flex items-center gap-2 rounded-lg bg-red-500/10 p-4 text-xs text-red-400 border border-red-500/20">
                <AlertCircle className="h-4.5 w-4.5 shrink-0" />
                <span>{passwordError}</span>
              </div>
            )}

            {!showPasswordOtp ? (
              <button
                type="button"
                onClick={handleRequestPasswordOtp}
                disabled={passwordLoading}
                className="w-full flex items-center justify-center gap-2 rounded-xl bg-blue-600/10 border border-blue-500/20 py-3 text-sm font-semibold text-blue-500 dark:text-blue-400 transition-all hover:bg-blue-650/20 disabled:opacity-50"
              >
                {passwordLoading ? (
                  <RefreshCw className="h-4 w-4 animate-spin" />
                ) : (
                  <Key className="h-4 w-4" />
                )}
                <span>Request Change Password OTP</span>
              </button>
            ) : (
              <form onSubmit={handleChangePasswordSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-355">
                    OTP Verification Code
                  </label>
                  <input
                    type="text"
                    required
                    maxLength={6}
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                    className="mt-2 block w-full rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0f172a]/50 px-4 py-2.5 text-slate-900 dark:text-slate-200 outline-none focus:border-blue-500 text-center font-bold tracking-[6px]"
                    placeholder="123456"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-355">
                    New Password
                  </label>
                  <input
                    type="password"
                    required
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="mt-2 block w-full rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0f172a]/50 px-4 py-2.5 text-slate-900 dark:text-slate-200 outline-none focus:border-blue-500"
                    placeholder="At least 6 characters"
                  />
                </div>

                <div className="flex gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setShowPasswordOtp(false);
                      setOtp('');
                      setNewPassword('');
                      setPasswordError('');
                      setPasswordSuccess('');
                    }}
                    className="flex-1 rounded-lg bg-slate-100 dark:bg-slate-900 border border-slate-250 dark:border-slate-800 py-2.5 text-center text-xs font-semibold text-slate-700 dark:text-slate-350 hover:bg-slate-200 dark:hover:bg-slate-850"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={passwordLoading}
                    className="flex-1 flex items-center justify-center gap-1.5 rounded-lg bg-blue-600 py-2.5 text-xs font-bold text-white hover:bg-blue-700 disabled:opacity-50"
                  >
                    <span>Update Password</span>
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>

        {/* Right Column: Address Management */}
        <div className="space-y-6 lg:col-span-2">
          <div className="glass-card rounded-2xl p-6 border border-slate-200 dark:border-slate-850">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-lg font-bold text-slate-900 dark:text-white">Shipping Addresses</h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Manage up to 5 saved address cards for checkout fast-selection</p>
              </div>

              {user?.addresses && user.addresses.length < 5 && !showAddAddress && (
                <button
                  onClick={() => {
                    handleCancelAddressForm();
                    setShowAddAddress(true);
                  }}
                  className="flex items-center gap-1 text-xs font-bold text-blue-600 dark:text-blue-500 hover:text-blue-500 dark:hover:text-blue-450"
                >
                  <Plus className="h-4 w-4" />
                  <span>Add Address</span>
                </button>
              )}
            </div>

            {addressSuccess && (
              <div className="mb-6 flex items-center gap-2 rounded-lg bg-emerald-500/10 p-4 text-xs text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                <CheckCircle className="h-4.5 w-4.5 shrink-0" />
                <span>{addressSuccess}</span>
              </div>
            )}

            {addressError && (
              <div className="mb-6 flex items-center gap-2 rounded-lg bg-red-500/10 p-4 text-xs text-red-400 border border-red-500/20">
                <AlertCircle className="h-4.5 w-4.5 shrink-0" />
                <span>{addressError}</span>
              </div>
            )}

            {/* Max address limit notice */}
            {user?.addresses && user.addresses.length >= 5 && (
              <div className="mb-6 rounded-lg bg-amber-500/10 p-4 text-xs text-amber-600 dark:text-amber-400 border border-amber-500/20">
                Maximum limit of 5 saved addresses has been reached. Please delete an existing address to register a new one.
              </div>
            )}

            {/* Add / Edit Address Form panel */}
            {showAddAddress && (
              <form onSubmit={handleAddAddressSubmit} className="mb-8 p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-[#0f172a]/20 space-y-4">
                <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-2">
                  <div className="flex items-center gap-1.5">
                    {editingAddressId ? (
                      <Edit2 className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
                    ) : (
                      <Plus className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
                    )}
                    <h3 className="text-xs font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400">
                      {editingAddressId ? 'Edit Shipping Address' : 'New Address Form'}
                    </h3>
                  </div>
                  <button
                    type="button"
                    onClick={handleUseCurrentLocation}
                    disabled={geoLoading}
                    className="flex items-center gap-1 rounded bg-blue-600/10 px-2.5 py-1 text-[10px] font-bold text-blue-500 dark:text-blue-400 hover:bg-blue-600/20 transition-all disabled:opacity-50"
                  >
                    {geoLoading ? (
                      <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <Navigation className="h-3.5 w-3.5" />
                    )}
                    <span>Use Current Location</span>
                  </button>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-450">
                      Street Address <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={line1}
                      onChange={(e) => setLine1(e.target.value)}
                      placeholder="Flat No, Apartment, Street Name"
                      className="mt-1 block w-full rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0f172a] px-3 py-2 text-sm text-slate-900 dark:text-slate-200 outline-none focus:border-blue-500"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-455">
                        City <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        value={city}
                        onChange={(e) => setCity(e.target.value)}
                        placeholder="Mumbai"
                        className="mt-1 block w-full rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0f172a] px-3 py-2 text-sm text-slate-900 dark:text-slate-200 outline-none focus:border-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-455">
                        State <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        value={state}
                        onChange={(e) => setState(e.target.value)}
                        placeholder="Maharashtra"
                        className="mt-1 block w-full rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0f172a] px-3 py-2 text-sm text-slate-900 dark:text-slate-200 outline-none focus:border-blue-500"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-455">
                        Pin Code <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        value={pincode}
                        onChange={(e) => setPincode(e.target.value)}
                        placeholder="400001"
                        className="mt-1 block w-full rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0f172a] px-3 py-2 text-sm text-slate-900 dark:text-slate-200 outline-none focus:border-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-455">
                        Contact Phone <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="9876543210"
                        className="mt-1 block w-full rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0f172a] px-3 py-2 text-sm text-slate-900 dark:text-slate-200 outline-none focus:border-blue-500"
                      />
                    </div>
                  </div>
                </div>

                <div className="flex gap-2 justify-end pt-2">
                  <button
                    type="button"
                    onClick={handleCancelAddressForm}
                    className="rounded-lg bg-slate-105 dark:bg-slate-900 border border-slate-250 dark:border-slate-800 px-4 py-2 text-xs font-semibold text-slate-700 dark:text-slate-355 hover:bg-slate-200 dark:hover:bg-slate-850"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={addressLoading}
                    className="rounded-lg bg-blue-600 px-4 py-2 text-xs font-bold text-white hover:bg-blue-700 disabled:opacity-50"
                  >
                    {addressLoading ? 'Saving...' : editingAddressId ? 'Update Address' : 'Save Address'}
                  </button>
                </div>
              </form>
            )}

            {/* List saved addresses */}
            {user?.addresses && user.addresses.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {user.addresses.map((addr) => (
                  <div
                    key={addr._id}
                    className="relative flex flex-col justify-between border border-slate-200 dark:border-slate-800 rounded-xl p-4 bg-slate-100/30 dark:bg-[#0f172a]/10 hover:border-slate-300 dark:hover:border-slate-700 transition-all"
                  >
                    <div className="space-y-1.5 text-slate-755 dark:text-slate-300 pr-16">
                      <div className="flex items-start gap-2">
                        <MapPin className="h-4.5 w-4.5 text-blue-500 shrink-0 mt-0.5" />
                        <span className="text-sm font-semibold">{addr.line1}</span>
                      </div>
                      <p className="text-xs text-slate-500 dark:text-slate-455 pl-6.5">
                        {addr.city}, {addr.state} - {addr.pincode}
                      </p>
                      <p className="text-xs text-slate-450 dark:text-slate-500 pl-6.5">
                        Phone: {addr.phone}
                      </p>
                    </div>

                    <div className="absolute right-3 top-3 flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => handleEditAddress(addr)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-blue-500 hover:bg-blue-500/10 transition-colors"
                        title="Edit address"
                      >
                        <Edit2 className="h-4 w-4" />
                      </button>

                      <button
                        type="button"
                        onClick={() => handleDeleteAddress(addr._id)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-500/10 transition-colors"
                        title="Delete saved address"
                      >
                        <Trash className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 border border-dashed border-slate-200 dark:border-slate-800 rounded-xl">
                <MapPin className="h-8 w-8 text-slate-300 dark:text-slate-600 mx-auto mb-2" />
                <p className="text-sm text-slate-500 dark:text-slate-405 font-medium">No saved addresses found</p>
                <p className="text-xs text-slate-450 dark:text-slate-500 mt-1">Add an address to make checking out fast and easy</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
