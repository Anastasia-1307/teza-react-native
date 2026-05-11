import * as SecureStore from 'expo-secure-store';
import { NetworkConfig } from './NetworkConfig';

export class TokenManager {
    // Refresh access token using persistent refresh token first
    static async refreshAccessToken(): Promise<boolean> {
        try {
            const persistentRefreshToken = await SecureStore.getItemAsync('persistent_refresh_token');
            const regularRefreshToken = await SecureStore.getItemAsync('refresh_token');
            
            if (!persistentRefreshToken && !regularRefreshToken) {
                console.log('No refresh tokens available');
                return false;
            }

            const baseUrl = await NetworkConfig.getBaseUrl();

            const requestBody: {
                persistent_refresh_token?: string;
                refresh_token?: string;
            } = {};
            if (persistentRefreshToken) {
                requestBody.persistent_refresh_token = persistentRefreshToken;
            }
            if (regularRefreshToken) {
                requestBody.refresh_token = regularRefreshToken;
            }

            const response = await fetch(`${baseUrl}/auth/refresh`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(requestBody),
            });

            // Check if response is actually JSON before parsing
            const contentType = response.headers.get('content-type');
            let data;
            if (contentType && contentType.includes('application/json')) {
                data = await response.json();
            } else {
                // If not JSON, create a generic error structure
                const text = await response.text();
                data = { detail: `Server error: ${response.status}` };
                console.error('Non-JSON response from server:', text);
            }

            if (response.ok) {
                // Store new access token
                await SecureStore.setItemAsync('access_token', data.access_token);
                console.log('Access token refreshed successfully using', data.refresh_method);
                return true;
            } else {
                console.log('Token refresh failed:', data.detail);
                return false;
            }

        } catch (error) {
            console.error('Error refreshing access token:', error);
            return false;
        }
    }

    // Get current access token
    static async getAccessToken(): Promise<string | null> {
        try {
            const token = await SecureStore.getItemAsync('access_token');
            
            if (!token) {
                return null;
            }

            // Check if token is expired
            const payload = JSON.parse(atob(token.split('.')[1]));
            const currentTime = Date.now() / 1000;
            
            if (payload.exp < currentTime) {
                console.log('Access token expired, attempting refresh...');
                const refreshed = await this.refreshAccessToken();
                if (refreshed) {
                    // Get the new token
                    return await SecureStore.getItemAsync('access_token');
                } else {
                    // Token refresh failed, clear tokens
                    await this.clearTokens();
                    return null;
                }
            }

            return token;
        } catch (error) {
            console.error('Error getting access token:', error);
            return null;
        }
    }

    // Clear all tokens
    static async clearTokens(): Promise<void> {
        try {
            await SecureStore.deleteItemAsync('access_token');
            await SecureStore.deleteItemAsync('refresh_token');
            await SecureStore.deleteItemAsync('persistent_refresh_token');
            console.log('All tokens cleared');
        } catch (error) {
            console.error('Error clearing tokens:', error);
        }
    }

    // Check if user has valid authentication
    static async isAuthenticated(): Promise<boolean> {
        const token = await this.getAccessToken();
        return token !== null;
    }

    // Store tokens from login response
    static async storeTokens(tokens: {
        access_token: string;
        refresh_token?: string;
        persistent_refresh_token?: string;
    }): Promise<void> {
        try {
            await SecureStore.setItemAsync('access_token', tokens.access_token);
            
            if (tokens.refresh_token) {
                await SecureStore.setItemAsync('refresh_token', tokens.refresh_token);
            }
            
            if (tokens.persistent_refresh_token) {
                await SecureStore.setItemAsync('persistent_refresh_token', tokens.persistent_refresh_token);
            }
            
            console.log('Tokens stored successfully');
        } catch (error) {
            console.error('Error storing tokens:', error);
        }
    }
}
