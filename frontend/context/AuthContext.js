// Auth context. Provides authentication state and actions (register, login, logout)
// to the entire app. Tokens and user data are persisted in SecureStore so the
// session survives app restarts.

import React, {createContext, useContext, useEffect, useState} from 'react';
import * as SecureStore from 'expo-secure-store';
import api from '../lib/api';

const AuthContext = createContext(null);

export function AuthProvider({children}) {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true); // true until the stored session has been checked

    // On app start, restore the session from SecureStore if tokens exist
    useEffect(() => {
        (async () => {
            try {
                const token = await SecureStore.getItemAsync('access_token');
                const stored = await SecureStore.getItemAsync('user');
                if (token && stored) setUser(JSON.parse(stored));
            } catch { /* ignore - treat as unauthenticated */
            } finally {
                setLoading(false);
            }
        })();
    }, []);

    // Registers a new account - does not log the user in automatically
    async function register(name, email, password) {
        const {data} = await api.post('/register', {name, email, password});
        return data;
    }

    // Logs in, persists tokens and user to SecureStore, and updates auth state
    async function login(email, password) {
        const {data} = await api.post('/login', {email, password});
        await SecureStore.setItemAsync('access_token', data.access_token);
        await SecureStore.setItemAsync('refresh_token', data.refresh_token);
        await SecureStore.setItemAsync('user', JSON.stringify(data.user));
        setUser(data.user);
        return data.user;
    }

    // Clears all stored credentials and resets auth state
    async function logout() {
        await SecureStore.deleteItemAsync('access_token');
        await SecureStore.deleteItemAsync('refresh_token');
        await SecureStore.deleteItemAsync('user');
        setUser(null);
    }

    return (
        <AuthContext.Provider value={{user, loading, register, login, logout}}>
            {children}
        </AuthContext.Provider>
    );
}

// Convenience hook; to be used instead of importing AuthContext and useContext directly
export const useAuth = () => useContext(AuthContext);
