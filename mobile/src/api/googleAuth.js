import * as WebBrowser from 'expo-web-browser';
import * as AuthSession from 'expo-auth-session';
import API from './api';

// Complete any pending auth session in browser
WebBrowser.maybeCompleteAuthSession();

// Google OAuth Discovery Endpoints
const discovery = {
  authorizationEndpoint: 'https://accounts.google.com/o/oauth2/v2/auth',
  tokenEndpoint: 'https://oauth2.googleapis.com/token',
  revocationEndpoint: 'https://oauth2.googleapis.com/revoke',
};

const DEFAULT_CLIENT_ID = '32943367466-bpa08tvu384tpvlr1vmk6etatkfkkjce.apps.googleusercontent.com';

/**
 * Initiates the real Google OAuth 2.0 flow using system browser / custom tabs
 * Returns the Google ID token or Access token to be verified by backend
 */
export const promptGoogleOAuthAsync = async () => {
  try {
    // 1. Attempt to fetch configured Client ID from backend
    let clientId = DEFAULT_CLIENT_ID;
    try {
      const { data } = await API.get('/api/config/google-client-id');
      if (data && data.clientId) {
        clientId = data.clientId;
      }
    } catch (err) {
      console.log('Using default Google client ID:', DEFAULT_CLIENT_ID);
    }

    // 2. Generate redirect URI for Expo / Standalone app
    const redirectUri = AuthSession.makeRedirectUri({
      scheme: 'debclothes',
      preferLocalhost: false,
    });
    console.log('[Google OAuth] Generated Redirect URI:', redirectUri);

    // 3. Create Google OAuth Request
    const request = new AuthSession.AuthRequest({
      clientId,
      scopes: ['openid', 'profile', 'email'],
      responseType: AuthSession.ResponseType.Token, // Returns real Google access_token
      redirectUri,
      extraParams: {
        prompt: 'select_account',
      },
    });

    // 4. Prompt user to authenticate in real Google browser dialog
    const result = await request.promptAsync(discovery);

    if (result.type === 'success') {
      const token = result.params?.access_token || result.params?.id_token;
      if (!token) {
        return { success: false, error: 'No token returned by Google' };
      }
      return { success: true, token };
    } else if (result.type === 'cancel' || result.type === 'dismiss') {
      return { success: false, cancelled: true };
    } else {
      console.warn('[Google OAuth] Auth session result:', result);
      return {
        success: false,
        error: result.error?.message || `Google OAuth redirect mismatch. Add ${redirectUri} to Google Cloud Console Authorized Redirect URIs.`,
      };
    }
  } catch (error) {
    console.error('[Google OAuth] Error:', error);
    return {
      success: false,
      error: error.message || 'An error occurred during Google sign-in. Use Sandbox Accounts on emulators.',
    };
  }
};
