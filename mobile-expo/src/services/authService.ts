import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

const AUTH_KEYS = {
  ACCESS_TOKEN: 'auth_access_token',
  REFRESH_TOKEN: 'auth_refresh_token',
  TOKEN_EXPIRY: 'auth_token_expiry',
  BIOMETRIC_ENABLED: 'auth_biometric_enabled',
  SAVED_EMAIL: 'auth_saved_email',
};

// Token expiry buffer (refresh 5 minutes before expiry)
const TOKEN_REFRESH_BUFFER = 5 * 60 * 1000; // 5 minutes in ms

class AuthService {
  private refreshPromise: Promise<string | null> | null = null;

  // ==================== SECURE TOKEN STORAGE ====================

  private async secureSet(key: string, value: string): Promise<void> {
    if (Platform.OS === 'web') {
      await AsyncStorage.setItem(key, value);
    } else {
      await SecureStore.setItemAsync(key, value);
    }
  }

  private async secureGet(key: string): Promise<string | null> {
    if (Platform.OS === 'web') {
      return AsyncStorage.getItem(key);
    }
    return SecureStore.getItemAsync(key);
  }

  private async secureDelete(key: string): Promise<void> {
    if (Platform.OS === 'web') {
      await AsyncStorage.removeItem(key);
    } else {
      await SecureStore.deleteItemAsync(key);
    }
  }

  // ==================== TOKEN MANAGEMENT ====================

  async saveTokens(accessToken: string, refreshToken?: string, expiresIn?: number): Promise<void> {
    await this.secureSet(AUTH_KEYS.ACCESS_TOKEN, accessToken);

    if (refreshToken) {
      await this.secureSet(AUTH_KEYS.REFRESH_TOKEN, refreshToken);
    }

    if (expiresIn) {
      const expiry = Date.now() + expiresIn * 1000;
      await AsyncStorage.setItem(AUTH_KEYS.TOKEN_EXPIRY, expiry.toString());
    }
  }

  async getAccessToken(): Promise<string | null> {
    // Check if token needs refresh
    const needsRefresh = await this.tokenNeedsRefresh();
    if (needsRefresh) {
      const newToken = await this.refreshAccessToken();
      if (newToken) {
        return newToken;
      }
    }

    return this.secureGet(AUTH_KEYS.ACCESS_TOKEN);
  }

  async getRefreshToken(): Promise<string | null> {
    return this.secureGet(AUTH_KEYS.REFRESH_TOKEN);
  }

  async clearTokens(): Promise<void> {
    await this.secureDelete(AUTH_KEYS.ACCESS_TOKEN);
    await this.secureDelete(AUTH_KEYS.REFRESH_TOKEN);
    await AsyncStorage.removeItem(AUTH_KEYS.TOKEN_EXPIRY);
  }

  // ==================== TOKEN REFRESH ====================

  async tokenNeedsRefresh(): Promise<boolean> {
    const expiryStr = await AsyncStorage.getItem(AUTH_KEYS.TOKEN_EXPIRY);
    if (!expiryStr) return false;

    const expiry = parseInt(expiryStr, 10);

    // Handle corrupted expiry value
    if (isNaN(expiry)) {
      console.warn('[AuthService] Corrupted token expiry, forcing refresh');
      return true;
    }

    const now = Date.now();

    // Refresh if within buffer period of expiry
    return now >= expiry - TOKEN_REFRESH_BUFFER;
  }

  async refreshAccessToken(): Promise<string | null> {
    // Prevent multiple simultaneous refresh attempts
    if (this.refreshPromise) {
      return this.refreshPromise;
    }

    this.refreshPromise = this.doRefreshToken();

    try {
      return await this.refreshPromise;
    } finally {
      this.refreshPromise = null;
    }
  }

  private async doRefreshToken(): Promise<string | null> {
    try {
      const refreshToken = await this.getRefreshToken();
      if (!refreshToken) {
        console.log('[AuthService] No refresh token available');
        return null;
      }

      // Import API config dynamically to avoid circular dependency
      const { API_BASE_URL } = await import('../config/api');

      const response = await fetch(`${API_BASE_URL}/api/mobile/refresh-token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ refreshToken }),
      });

      if (!response.ok) {
        console.error('[AuthService] Token refresh failed:', response.status);
        // Clear tokens on refresh failure (force re-login)
        await this.clearTokens();
        return null;
      }

      const data = await response.json();

      if (data.accessToken) {
        await this.saveTokens(data.accessToken, data.refreshToken, data.expiresIn);
        console.log('[AuthService] Token refreshed successfully');
        return data.accessToken;
      }

      return null;
    } catch (error) {
      console.error('[AuthService] Token refresh error:', error);
      return null;
    }
  }

  // ==================== BIOMETRIC AUTH ====================

  async setBiometricEnabled(enabled: boolean): Promise<void> {
    await AsyncStorage.setItem(AUTH_KEYS.BIOMETRIC_ENABLED, enabled.toString());
  }

  async isBiometricEnabled(): Promise<boolean> {
    const value = await AsyncStorage.getItem(AUTH_KEYS.BIOMETRIC_ENABLED);
    return value === 'true';
  }

  // ==================== SAVED CREDENTIALS ====================

  async saveEmail(email: string): Promise<void> {
    await AsyncStorage.setItem(AUTH_KEYS.SAVED_EMAIL, email);
  }

  async getSavedEmail(): Promise<string | null> {
    return AsyncStorage.getItem(AUTH_KEYS.SAVED_EMAIL);
  }

  // ==================== SESSION CHECK ====================

  async isAuthenticated(): Promise<boolean> {
    const token = await this.secureGet(AUTH_KEYS.ACCESS_TOKEN);
    return !!token;
  }

  async logout(): Promise<void> {
    await this.clearTokens();
    // Keep biometric preference and saved email for convenience
  }
}

export const authService = new AuthService();
