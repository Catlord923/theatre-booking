// Axios instance with auth token injection and automatic token refresh.
// All API calls in the app should use this instance rather than axios directly.

import axios from 'axios';
import * as SecureStore from 'expo-secure-store';
import {router} from 'expo-router';

export const BASE_URL = process.env.EXPO_PUBLIC_API_URL;

// Endpoints that don't require an access token (excluded from the 401 retry logic)
const PUBLIC_ENDPOINTS = ['/login', '/register', '/auth/refresh'];

const api = axios.create({
    baseURL: BASE_URL,
    timeout: 10000,
    headers: {'Content-Type': 'application/json'},
});

// Request interceptor; attaches the access token to every outgoing request if available
api.interceptors.request.use(async (config) => {
    const token = await SecureStore.getItemAsync('access_token');
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
});

// Clears all stored credentials and redirects to the login screen
async function forceLogout() {
    await SecureStore.deleteItemAsync('access_token');
    await SecureStore.deleteItemAsync('refresh_token');
    await SecureStore.deleteItemAsync('user');
    router.replace('/(auth)/login');
}

// Response interceptor; handles 401s by attempting a token refresh.
// If the refresh succeeds, the original request is retried with the new token
// If the refresh fails or no refresh token exists, the user is force-logged out
// _retry flag prevents infinite retry loops if the refresh request itself 401s
api.interceptors.response.use(
    (res) => res,
    async (error) => {
        const original = error.config;
        const isPublic = PUBLIC_ENDPOINTS.some(ep => original.url?.includes(ep));

        if (error.response?.status === 401 && !original._retry && !isPublic) {
            original._retry = true;
            try {
                const refreshToken = await SecureStore.getItemAsync('refresh_token');
                if (!refreshToken) {
                    await forceLogout();
                    return Promise.reject(error);
                }
                // Use plain axios (not the api instance) to avoid triggering this interceptor again
                const {data} = await axios.post(`${BASE_URL}/auth/refresh`, {
                    refresh_token: refreshToken,
                });
                await SecureStore.setItemAsync('access_token', data.access_token);
                original.headers.Authorization = `Bearer ${data.access_token}`;
                return api(original); // retry the original request with the new token
            } catch {
                await forceLogout();
                return Promise.reject(error);
            }
        }

        return Promise.reject(error);
    }
);

export default api;
