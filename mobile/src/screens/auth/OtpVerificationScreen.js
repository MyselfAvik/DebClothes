import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  KeyboardAvoidingView,
  ScrollView,
  Platform,
} from 'react-native';
import { useAuth } from '../../context/AuthContext';
import { useAppTheme } from '../../context/ThemeContext';
import { useAppNavigation } from '../../context/NavigationContext';
import { useToast } from '../../context/ToastContext';
import { KeyRound, RefreshCw, ArrowLeft, ShieldCheck, CheckCircle2 } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';

export default function OtpVerificationScreen() {
  const [otp, setOtp] = useState('');
  const [otpFocused, setOtpFocused] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);

  const { verifySignupOtp, verifyLoginOtp, resendOtp, loading } = useAuth();
  const { colors, isDark } = useAppTheme();
  const { screenParams, navigateTo, goBack } = useAppNavigation();
  const { showToast } = useToast();

  const email = screenParams.email || '';
  const purpose = screenParams.purpose || 'Signup'; // 'Signup' | 'Login'

  const handleVerify = async () => {
    if (!otp.trim()) {
      showToast('Please enter the 6-digit OTP code', 'warning');
      return;
    }

    try {
      if (purpose === 'Signup') {
        await verifySignupOtp(email, otp.trim());
        showToast('Account verified! Welcome to DEB CLOTHES!', 'success');
      } else {
        await verifyLoginOtp(email, otp.trim());
        showToast('Login successful! Welcome back.', 'success');
      }
      navigateTo('HOME');
    } catch (err) {
      showToast(err.response?.data?.message || 'Invalid or expired OTP code', 'error');
    }
  };

  const handleResend = async () => {
    setResendLoading(true);
    try {
      const purposeApi = purpose === 'Signup' ? 'signup' : 'login';
      await resendOtp(email, purposeApi);
      showToast('A fresh OTP code has been sent to your inbox!', 'success');
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to resend code', 'error');
    } finally {
      setResendLoading(false);
    }
  };

  return (
    <LinearGradient
      colors={
        isDark
          ? ['#07070d', '#110d24', '#1a1033', '#090714']
          : ['#fbfaff', '#f4effe', '#fdf2f8', '#faf5ff']
      }
      style={styles.container}
      start={{ x: 0.1, y: 0 }}
      end={{ x: 0.9, y: 1 }}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Back Navigation */}
          <TouchableOpacity
            style={[
              styles.backButton,
              {
                backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : '#ffffff',
                borderColor: isDark ? 'rgba(255,255,255,0.1)' : '#e2e8f0',
              },
            ]}
            onPress={goBack}
            activeOpacity={0.7}
          >
            <ArrowLeft size={18} color={isDark ? '#f1f5f9' : '#1e1b4b'} />
            <Text style={[styles.backText, { color: isDark ? '#f1f5f9' : '#1e1b4b' }]}>
              Back
            </Text>
          </TouchableOpacity>

          {/* Header Brand Section */}
          <View style={styles.headerContainer}>
            <LinearGradient
              colors={['#7c3aed', '#a855f7', '#db2777']}
              style={styles.logoBadge}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <View
                style={[
                  styles.logoInner,
                  { backgroundColor: isDark ? '#0d0b1a' : '#ffffff' },
                ]}
              >
                <KeyRound size={28} color={isDark ? '#c084fc' : '#7c3aed'} />
              </View>
            </LinearGradient>

            <Text style={[styles.brandTitle, { color: isDark ? '#ffffff' : '#1e1b4b' }]}>
              Two-Factor Verify
            </Text>
            <Text style={[styles.brandTagline, { color: isDark ? '#a78bfa' : '#6b7280' }]}>
              Enter the 6-digit security code sent to:
            </Text>
            <View
              style={[
                styles.emailBadge,
                {
                  backgroundColor: isDark ? 'rgba(168, 85, 247, 0.12)' : '#f3e8ff',
                  borderColor: isDark ? 'rgba(168, 85, 247, 0.3)' : '#e9d5ff',
                },
              ]}
            >
              <Text style={[styles.emailText, { color: isDark ? '#c084fc' : '#7c3aed' }]}>
                {email}
              </Text>
            </View>
          </View>

          {/* Main Card */}
          <View
            style={[
              styles.card,
              {
                backgroundColor: isDark ? 'rgba(18, 14, 34, 0.92)' : 'rgba(255, 255, 255, 0.96)',
                borderColor: isDark ? 'rgba(168, 85, 247, 0.28)' : '#e9d5ff',
                shadowColor: isDark ? '#a855f7' : '#7c3aed',
              },
            ]}
          >
            <Text style={[styles.fieldLabel, { color: isDark ? '#c084fc' : '#4b5563' }]}>
              SECURITY OTP CODE
            </Text>
            <View
              style={[
                styles.inputWrapper,
                {
                  borderColor: otpFocused
                    ? isDark ? '#c084fc' : '#7c3aed'
                    : isDark ? 'rgba(255,255,255,0.12)' : '#e2e8f0',
                  backgroundColor: isDark ? 'rgba(255,255,255,0.04)' : '#fafafa',
                },
              ]}
            >
              <ShieldCheck
                size={20}
                color={otpFocused ? (isDark ? '#c084fc' : '#7c3aed') : (isDark ? '#71717a' : '#9ca3af')}
                style={styles.inputIcon}
              />
              <TextInput
                style={[
                  styles.input,
                  {
                    color: isDark ? '#ffffff' : '#1e1b4b',
                    letterSpacing: otp ? 6 : 1,
                  },
                ]}
                placeholder="• • • • • •"
                placeholderTextColor={isDark ? '#71717a' : '#9ca3af'}
                value={otp}
                onChangeText={setOtp}
                keyboardType="number-pad"
                maxLength={6}
                autoFocus
                onFocus={() => setOtpFocused(true)}
                onBlur={() => setOtpFocused(false)}
              />
            </View>

            {/* Verify Button */}
            <TouchableOpacity
              onPress={handleVerify}
              disabled={loading}
              activeOpacity={0.85}
              style={{ marginTop: 12 }}
            >
              <LinearGradient
                colors={['#7c3aed', '#9333ea', '#db2777']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.primaryButton}
              >
                {loading ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <View style={styles.primaryBtnRow}>
                    <CheckCircle2 size={18} color="#fff" style={{ marginRight: 8 }} />
                    <Text style={styles.primaryBtnText}>Verify & Continue</Text>
                  </View>
                )}
              </LinearGradient>
            </TouchableOpacity>

            {/* Resend Action */}
            <TouchableOpacity
              style={styles.resendBtn}
              onPress={handleResend}
              disabled={resendLoading}
              activeOpacity={0.7}
            >
              {resendLoading ? (
                <ActivityIndicator size="small" color={isDark ? '#c084fc' : '#7c3aed'} />
              ) : (
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <RefreshCw size={13} color={isDark ? '#c084fc' : '#7c3aed'} style={{ marginRight: 6 }} />
                  <Text style={[styles.resendText, { color: isDark ? '#c084fc' : '#7c3aed' }]}>
                    Didn't receive the code? Resend
                  </Text>
                </View>
              )}
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 22,
    paddingVertical: 36,
    justifyContent: 'center',
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 10,
    borderWidth: 1,
    marginBottom: 20,
  },
  backText: {
    fontSize: 13,
    fontWeight: '700',
    marginLeft: 6,
  },
  headerContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  logoBadge: {
    width: 64,
    height: 64,
    borderRadius: 20,
    padding: 2.5,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
    elevation: 8,
    shadowColor: '#a855f7',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
  },
  logoInner: {
    width: '100%',
    height: '100%',
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  brandTitle: {
    fontSize: 24,
    fontWeight: '900',
    letterSpacing: 1.5,
    textAlign: 'center',
  },
  brandTagline: {
    fontSize: 12.5,
    fontWeight: '600',
    marginTop: 4,
    textAlign: 'center',
  },
  emailBadge: {
    marginTop: 8,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
  },
  emailText: {
    fontSize: 12,
    fontWeight: '700',
  },
  card: {
    borderRadius: 24,
    borderWidth: 1,
    padding: 22,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.16,
    shadowRadius: 18,
    elevation: 8,
  },
  fieldLabel: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.8,
    marginBottom: 8,
    marginLeft: 2,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.2,
    borderRadius: 13,
    paddingHorizontal: 14,
    height: 52,
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    fontSize: 18,
    fontWeight: '900',
    textAlign: 'center',
  },
  primaryButton: {
    height: 48,
    borderRadius: 13,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#ec4899',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  primaryBtnRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  primaryBtnText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  resendBtn: {
    marginTop: 18,
    alignItems: 'center',
    paddingVertical: 4,
  },
  resendText: {
    fontSize: 12,
    fontWeight: '700',
  },
});
