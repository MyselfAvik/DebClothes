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
  Dimensions,
} from 'react-native';
import { useAuth } from '../../context/AuthContext';
import { useAppTheme } from '../../context/ThemeContext';
import { useAppNavigation } from '../../context/NavigationContext';
import { useToast } from '../../context/ToastContext';
import { Mail, Lock, Key, Sparkles, Eye, EyeOff, ArrowRight } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Path } from 'react-native-svg';
import { promptGoogleOAuthAsync } from '../../api/googleAuth';

const { width } = Dimensions.get('window');

// Official Google Multi-color Logo Icon Component
const GoogleLogo = ({ size = 20 }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24">
    <Path
      fill="#4285F4"
      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
    />
    <Path
      fill="#34A853"
      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
    />
    <Path
      fill="#FBBC05"
      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
    />
    <Path
      fill="#EA4335"
      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
    />
  </Svg>
);

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loginMethod, setLoginMethod] = useState('password'); // 'password' | 'otp'
  const [emailFocused, setEmailFocused] = useState(false);
  const [passwordFocused, setPasswordFocused] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  const { login, requestLoginOtp, loginWithGoogle, loading } = useAuth();
  const { colors, isDark } = useAppTheme();
  const { navigateTo } = useAppNavigation();
  const { showToast } = useToast();

  // Primary Action: Real Google OAuth 2.0 using Browser / Custom Tabs
  const handleRealGoogleOAuth = async () => {
    setGoogleLoading(true);
    try {
      const result = await promptGoogleOAuthAsync();
      if (result.success && result.token) {
        showToast('Verifying Google credentials...', 'info');
        const user = await loginWithGoogle(result.token, result.redirectUri);
        showToast(`Welcome, ${user?.name || 'User'}!`, 'success');
        navigateTo('HOME');
      } else if (result.cancelled) {
        // User closed or dismissed the browser dialog
      } else {
        showToast(result.error || 'Google authentication was not completed', 'warning');
      }
    } catch (err) {
      showToast(err.response?.data?.message || err.message || 'Google OAuth failed', 'error');
    } finally {
      setGoogleLoading(false);
    }
  };

  const handleLogin = async () => {
    if (!email.trim()) {
      showToast('Please enter your email address', 'warning');
      return;
    }

    if (loginMethod === 'password') {
      if (!password) {
        showToast('Please enter your account password', 'warning');
        return;
      }
      try {
        await login(email.trim(), password);
        showToast('Welcome back to DEB CLOTHES!', 'success');
        navigateTo('HOME');
      } catch (err) {
        showToast(err.response?.data?.message || 'Invalid email or password', 'error');
      }
    } else {
      // OTP Method
      try {
        await requestLoginOtp(email.trim());
        showToast('Verification OTP sent to your email!', 'success');
        navigateTo('OTP_VERIFICATION', { email: email.trim(), purpose: 'Login' });
      } catch (err) {
        showToast(err.response?.data?.message || 'Failed to send OTP code', 'error');
      }
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
                <Sparkles size={28} color={isDark ? '#c084fc' : '#7c3aed'} />
              </View>
            </LinearGradient>

            <Text style={[styles.brandTitle, { color: isDark ? '#ffffff' : '#1e1b4b' }]}>
              DEB CLOTHES
            </Text>
            <Text style={[styles.brandTagline, { color: isDark ? '#a78bfa' : '#6b7280' }]}>
              HAUTE COUTURE & LUXURY RUNWAY
            </Text>
          </View>

          {/* Main Glass Card */}
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
            {/* Method Segment Tabs */}
            <View
              style={[
                styles.tabSegmentContainer,
                {
                  backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : '#f3e8ff',
                  borderColor: isDark ? 'rgba(255,255,255,0.08)' : '#e9d5ff',
                },
              ]}
            >
              <TouchableOpacity
                style={[
                  styles.tabSegmentBtn,
                  loginMethod === 'password' && [
                    styles.tabSegmentActive,
                    {
                      backgroundColor: isDark ? '#7c3aed' : '#ffffff',
                      shadowColor: isDark ? '#a855f7' : 'rgba(0,0,0,0.1)',
                    },
                  ],
                ]}
                onPress={() => setLoginMethod('password')}
                activeOpacity={0.8}
              >
                <Lock
                  size={13}
                  color={
                    loginMethod === 'password'
                      ? isDark ? '#ffffff' : '#7c3aed'
                      : isDark ? '#a78bfa' : '#6b7280'
                  }
                  style={{ marginRight: 5 }}
                />
                <Text
                  style={[
                    styles.tabSegmentText,
                    {
                      color:
                        loginMethod === 'password'
                          ? isDark ? '#ffffff' : '#7c3aed'
                          : isDark ? '#a78bfa' : '#6b7280',
                      fontFamily: loginMethod === 'password' ? 'Outfit_800ExtraBold' : 'Outfit_600SemiBold',
                    },
                  ]}
                >
                  Password
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.tabSegmentBtn,
                  loginMethod === 'otp' && [
                    styles.tabSegmentActive,
                    {
                      backgroundColor: isDark ? '#7c3aed' : '#ffffff',
                      shadowColor: isDark ? '#a855f7' : 'rgba(0,0,0,0.1)',
                    },
                  ],
                ]}
                onPress={() => setLoginMethod('otp')}
                activeOpacity={0.8}
              >
                <Key
                  size={13}
                  color={
                    loginMethod === 'otp'
                      ? isDark ? '#ffffff' : '#7c3aed'
                      : isDark ? '#a78bfa' : '#6b7280'
                  }
                  style={{ marginRight: 5 }}
                />
                <Text
                  style={[
                    styles.tabSegmentText,
                    {
                      color:
                        loginMethod === 'otp'
                          ? isDark ? '#ffffff' : '#7c3aed'
                          : isDark ? '#a78bfa' : '#6b7280',
                      fontFamily: loginMethod === 'otp' ? 'Outfit_800ExtraBold' : 'Outfit_600SemiBold',
                    },
                  ]}
                >
                  Instant OTP
                </Text>
              </TouchableOpacity>
            </View>

            {/* Email Field */}
            <View style={styles.fieldBlock}>
              <Text style={[styles.fieldLabel, { color: isDark ? '#c084fc' : '#4b5563' }]}>
                EMAIL ADDRESS
              </Text>
              <View
                style={[
                  styles.inputWrapper,
                  {
                    borderColor: emailFocused
                      ? isDark ? '#c084fc' : '#7c3aed'
                      : isDark ? 'rgba(255,255,255,0.12)' : '#e2e8f0',
                    backgroundColor: isDark ? 'rgba(255,255,255,0.04)' : '#fafafa',
                  },
                ]}
              >
                <Mail
                  size={17}
                  color={emailFocused ? (isDark ? '#c084fc' : '#7c3aed') : (isDark ? '#71717a' : '#9ca3af')}
                  style={styles.inputIcon}
                />
                <TextInput
                  style={[styles.input, { color: isDark ? '#ffffff' : '#1e1b4b' }]}
                  placeholder="name@example.com"
                  placeholderTextColor={isDark ? '#71717a' : '#9ca3af'}
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                  onFocus={() => setEmailFocused(true)}
                  onBlur={() => setEmailFocused(false)}
                />
              </View>
            </View>

            {/* Password Field */}
            {loginMethod === 'password' ? (
              <View style={styles.fieldBlock}>
                <Text style={[styles.fieldLabel, { color: isDark ? '#c084fc' : '#4b5563' }]}>
                  PASSWORD
                </Text>
                <View
                  style={[
                    styles.inputWrapper,
                    {
                      borderColor: passwordFocused
                        ? isDark ? '#c084fc' : '#7c3aed'
                        : isDark ? 'rgba(255,255,255,0.12)' : '#e2e8f0',
                      backgroundColor: isDark ? 'rgba(255,255,255,0.04)' : '#fafafa',
                    },
                  ]}
                >
                  <Lock
                    size={17}
                    color={passwordFocused ? (isDark ? '#c084fc' : '#7c3aed') : (isDark ? '#71717a' : '#9ca3af')}
                    style={styles.inputIcon}
                  />
                  <TextInput
                    style={[styles.input, { color: isDark ? '#ffffff' : '#1e1b4b' }]}
                    placeholder="Enter your password"
                    placeholderTextColor={isDark ? '#71717a' : '#9ca3af'}
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry={!showPassword}
                    autoCapitalize="none"
                    autoCorrect={false}
                    onFocus={() => setPasswordFocused(true)}
                    onBlur={() => setPasswordFocused(false)}
                  />
                  <TouchableOpacity
                    onPress={() => setShowPassword(!showPassword)}
                    style={styles.eyeBtn}
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                  >
                    {showPassword ? (
                      <EyeOff size={18} color={isDark ? '#a78bfa' : '#6b7280'} />
                    ) : (
                      <Eye size={18} color={isDark ? '#a78bfa' : '#6b7280'} />
                    )}
                  </TouchableOpacity>
                </View>
              </View>
            ) : null}

            {/* Submit Action Button */}
            <TouchableOpacity
              onPress={handleLogin}
              disabled={loading}
              activeOpacity={0.85}
              style={{ marginTop: 6 }}
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
                    <Text style={styles.primaryBtnText}>
                      {loginMethod === 'password' ? 'Sign In to Account' : 'Request Login OTP'}
                    </Text>
                    <ArrowRight size={17} color="#fff" style={{ marginLeft: 8 }} />
                  </View>
                )}
              </LinearGradient>
            </TouchableOpacity>

            {/* Subtle Divider */}
            <View style={styles.orDividerRow}>
              <View
                style={[
                  styles.dividerLine,
                  { backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : '#e2e8f0' },
                ]}
              />
              <Text style={[styles.orText, { color: isDark ? '#a78bfa' : '#94a3b8' }]}>
                OR CONTINUE WITH
              </Text>
              <View
                style={[
                  styles.dividerLine,
                  { backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : '#e2e8f0' },
                ]}
              />
            </View>

            {/* Google OAuth Button */}
            <TouchableOpacity
              style={[
                styles.googleBtn,
                {
                  backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : '#ffffff',
                  borderColor: isDark ? 'rgba(255,255,255,0.12)' : '#e2e8f0',
                  shadowColor: isDark ? '#000000' : 'rgba(0,0,0,0.08)',
                },
              ]}
              onPress={handleRealGoogleOAuth}
              disabled={googleLoading || loading}
              activeOpacity={0.8}
            >
              {googleLoading ? (
                <ActivityIndicator color="#4285F4" size="small" />
              ) : (
                <View style={styles.googleBtnRow}>
                  <GoogleLogo size={20} />
                  <Text
                    style={[
                      styles.googleBtnText,
                      { color: isDark ? '#f1f5f9' : '#1e293b' },
                    ]}
                  >
                    Continue with Google
                  </Text>
                </View>
              )}
            </TouchableOpacity>
          </View>

          {/* Footer Register Link */}
          <View style={styles.footerRow}>
            <Text style={[styles.footerText, { color: isDark ? '#94a3b8' : '#64748b' }]}>
              New to Deb Clothes?{' '}
            </Text>
            <TouchableOpacity onPress={() => navigateTo('REGISTER')} activeOpacity={0.7}>
              <Text
                style={[
                  styles.linkText,
                  { color: isDark ? '#c084fc' : '#7c3aed', fontFamily: 'Outfit_800ExtraBold' },
                ]}
              >
                Create Account
              </Text>
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
    justifyContent: 'center',
    paddingHorizontal: 22,
    paddingVertical: 36,
  },
  headerContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  logoBadge: {
    width: 66,
    height: 66,
    borderRadius: 22,
    padding: 2.5,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 14,
    elevation: 8,
    shadowColor: '#a855f7',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
  },
  logoInner: {
    width: '100%',
    height: '100%',
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  brandTitle: {
    fontSize: 26,
    fontFamily: 'Outfit_900Black',
    letterSpacing: 2.5,
    textAlign: 'center',
  },
  brandTagline: {
    fontSize: 11,
    fontFamily: 'Outfit_700Bold',
    letterSpacing: 1.5,
    marginTop: 4,
    textAlign: 'center',
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
  tabSegmentContainer: {
    flexDirection: 'row',
    borderRadius: 14,
    borderWidth: 1,
    padding: 4,
    marginBottom: 20,
  },
  tabSegmentBtn: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 9,
    borderRadius: 11,
  },
  tabSegmentActive: {
    elevation: 3,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
  },
  tabSegmentText: {
    fontSize: 12.5,
    fontFamily: 'Outfit_700Bold',
  },
  fieldBlock: {
    marginBottom: 14,
  },
  fieldLabel: {
    fontSize: 11,
    fontFamily: 'Outfit_800ExtraBold',
    letterSpacing: 0.8,
    marginBottom: 6,
    marginLeft: 2,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.2,
    borderRadius: 13,
    paddingHorizontal: 14,
    height: 48,
  },
  inputIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    fontSize: 13.5,
    fontFamily: 'Outfit_600SemiBold',
  },
  eyeBtn: {
    padding: 6,
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
    fontFamily: 'Outfit_800ExtraBold',
    letterSpacing: 0.5,
  },
  orDividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 18,
  },
  dividerLine: {
    flex: 1,
    height: 1,
  },
  orText: {
    marginHorizontal: 10,
    fontSize: 10.5,
    fontFamily: 'Outfit_800ExtraBold',
    letterSpacing: 1,
  },
  googleBtn: {
    height: 48,
    borderRadius: 13,
    borderWidth: 1.2,
    justifyContent: 'center',
    alignItems: 'center',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  googleBtnRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  googleBtnText: {
    fontSize: 13.5,
    fontFamily: 'Outfit_700Bold',
    marginLeft: 10,
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 22,
  },
  footerText: {
    fontSize: 13,
    fontFamily: 'Outfit_500Medium',
  },
  linkText: {
    fontSize: 13,
    fontFamily: 'Outfit_800ExtraBold',
  },
});
