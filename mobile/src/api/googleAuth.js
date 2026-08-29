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
 * Initiates standard Google OAuth 2.0 PKCE Authorization Code flow
 * Compliant with Google's modern security policy
 */
export const promptGoogleOAuthAsync = async () => {
  try {
    let clientId = DEFAULT_CLIENT_ID;
    try {
      const { data } = await API.get('/api/config/google-client-id');
      if (data && data.clientId) {
        clientId = data.clientId;
      }
    } catch (err) {
      console.log('Using default Google client ID:', DEFAULT_CLIENT_ID);
    }

    // Use AuthSession.makeRedirectUri with project scheme
    const redirectUri = AuthSession.makeRedirectUri({
      scheme: 'debclothes',
      preferLocalhost: false,
    });
    console.log('[Google OAuth] Using Redirect URI:', redirectUri);

    // Create Authorization Code request with PKCE
    const request = new AuthSession.AuthRequest({
      clientId,
      scopes: ['openid', 'profile', 'email'],
      responseType: AuthSession.ResponseType.Code,
      usePKCE: true,
      redirectUri,
      extraParams: {
        prompt: 'select_account',
      },
    });

    const result = await request.promptAsync(discovery);

    if (result.type === 'success' && result.params?.code) {
      // Exchange Authorization Code for Access / ID Token using PKCE
      try {
        const tokenResult = await AuthSession.exchangeCodeAsync(
          {
            clientId,
            code: result.params.code,
            redirectUri,
            extraParams: {
              code_verifier: request.codeVerifier,
            },
          },
          discovery
        );

        const token = tokenResult.idToken || tokenResult.accessToken;
        if (!token) {
          return { success: false, error: 'Failed to retrieve auth token from Google' };
        }
        return { success: true, token };
      } catch (exchangeErr) {
        console.error('[Google OAuth] Token exchange error:', exchangeErr);
        // Fallback: send code to backend
        return { success: true, token: result.params.code, isCode: true };
      }
    } else if (result.type === 'cancel' || result.type === 'dismiss') {
      return { success: false, cancelled: true };
    } else {
      console.warn('[Google OAuth] Auth session result:', result);
      return {
        success: false,
        error: result.error?.message || result.params?.error_description || 'Google authorization could not be completed.',
      };
    }
  } catch (error) {
    console.error('[Google OAuth] Error:', error);
    return {
      success: false,
      error: error.message || 'An error occurred during Google sign-in.',
    };
  }
};
