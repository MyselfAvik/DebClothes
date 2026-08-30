import { Platform } from 'react-native';
import { GoogleSignin, statusCodes } from '@react-native-google-signin/google-signin';
import API from './api';

// Google OAuth 2.0 Web Client ID
// (Google Play Services uses this Web Client ID to generate backend-verifiable ID tokens)
const WEB_CLIENT_ID = '32943367466-bpa08tvu384tpvlr1vmk6etatkfkkjce.apps.googleusercontent.com';

try {
  GoogleSignin.configure({
    webClientId: WEB_CLIENT_ID,
    offlineAccess: true,
    scopes: ['profile', 'email'],
  });
} catch (e) {
  console.log('[Google Sign-In] Configure error:', e);
}

/**
 * Initiates native Google Play Services Sign-In on Android/iOS
 * 100% compliant with Google Play Store guidelines (No custom browser schemes)
 */
export const promptGoogleOAuthAsync = async () => {
  try {
    await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });

    // Clear previous session so user can pick an account if requested
    try {
      await GoogleSignin.signOut();
    } catch (e) {}

    const response = await GoogleSignin.signIn();
    console.log('[Google Sign-In] Success response received');

    // Extract ID token (supported in both v12 and v13 data structures)
    const idToken = response.data?.idToken || response.idToken;

    if (idToken) {
      return { success: true, token: idToken };
    }

    // Secondary fallback: fetch tokens explicitly
    try {
      const tokens = await GoogleSignin.getTokens();
      if (tokens && (tokens.idToken || tokens.accessToken)) {
        return { success: true, token: tokens.idToken || tokens.accessToken };
      }
    } catch (tokErr) {
      console.warn('[Google Sign-In] getTokens error:', tokErr);
    }

    return {
      success: false,
      error: 'Google sign-in completed but ID token could not be retrieved.',
    };
  } catch (error) {
    console.error('[Google Sign-In] Error:', error);

    if (error.code === statusCodes.SIGN_IN_CANCELLED) {
      return { success: false, cancelled: true };
    } else if (error.code === statusCodes.IN_PROGRESS) {
      return { success: false, error: 'Google sign in is already in progress.' };
    } else if (error.code === statusCodes.PLAY_SERVICES_NOT_AVAILABLE) {
      return {
        success: false,
        error: 'Google Play Services is not available or requires an update on your device.',
      };
    } else {
      return {
        success: false,
        error: error.message || 'Google sign-in failed. Please try again.',
      };
    }
  }
};
