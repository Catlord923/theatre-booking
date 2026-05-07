// Login screen. Validates input client-side,
// calls the auth context login function,
// and navigates to the main app on success.

import React, {useState} from 'react';
import {
    View, Text, ScrollView, StyleSheet,
    TouchableOpacity, KeyboardAvoidingView, Platform,
} from 'react-native';
import {router} from 'expo-router';
import {useAuth} from '../../context/AuthContext';
import {Button, Input, ErrorBanner} from '../../components/ui';
import {Colors, Spacing, Radii} from '../../constants/theme';

export default function LoginScreen() {
    const {login} = useAuth();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    async function handleLogin() {
        setError('');
        if (!email || !password) {
            setError('Please fill in all fields.');
            return;
        }
        setLoading(true);
        try {
            await login(email.trim().toLowerCase(), password);
            // replace so that the user can't navigate back to login
            router.replace('/(tabs)/theatres');
        } catch (e) {
            setError(e.response?.data?.error || 'Login failed. Please try again.');
        } finally {
            setLoading(false);
        }
    }

    return (
        // KeyboardAvoidingView shifts the layout up when the keyboard appears on iOS
        <KeyboardAvoidingView
            style={{flex: 1, backgroundColor: Colors.bg}}
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
            <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">

                {/* Header */}
                <View style={styles.header}>
                    <Text style={styles.logo}>🎭</Text>
                    <Text style={styles.title}>Welcome Back</Text>
                    <Text style={styles.subtitle}>Sign in to your account</Text>
                </View>

                {/* Form */}
                <View style={styles.form}>
                    <ErrorBanner message={error}/>

                    <Input
                        label="Email"
                        value={email}
                        onChangeText={setEmail}
                        placeholder="you@example.com"
                        keyboardType="email-address"
                        autoCapitalize="none"
                        autoCorrect={false}
                    />
                    <Input
                        label="Password"
                        value={password}
                        onChangeText={setPassword}
                        placeholder="••••••••"
                        secureTextEntry
                    />

                    <Button
                        title="Sign In"
                        onPress={handleLogin}
                        loading={loading}
                        style={{marginTop: Spacing.sm}}
                    />

                    <TouchableOpacity
                        style={styles.link}
                        onPress={() => router.push('/(auth)/register')}
                    >
                        <Text style={styles.linkText}>
                            Don't have an account?{' '}
                            <Text style={styles.linkAccent}>Register</Text>
                        </Text>
                    </TouchableOpacity>
                </View>

            </ScrollView>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: {flexGrow: 1, justifyContent: 'center', padding: Spacing.lg},
    header: {alignItems: 'center', marginBottom: Spacing.xxl},
    logo: {fontSize: 56, marginBottom: Spacing.md},
    title: {color: Colors.textPrimary, fontSize: 28, fontWeight: '700', letterSpacing: -0.5},
    subtitle: {color: Colors.textSecondary, fontSize: 15, marginTop: 6},
    form: {
        backgroundColor: Colors.surface,
        borderRadius: Radii.lg,
        padding: Spacing.lg,
        borderWidth: 1,
        borderColor: Colors.border
    },
    link: {alignItems: 'center', marginTop: Spacing.lg},
    linkText: {color: Colors.textSecondary, fontSize: 14},
    linkAccent: {color: Colors.gold, fontWeight: '600'},
});
