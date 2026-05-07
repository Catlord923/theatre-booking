// Register screen. Validates input client-side, registers the user, then auto-logs
// them in and navigates to the main app; no manual login step required.

import React, {useState} from 'react';
import {
    View, Text, ScrollView, StyleSheet,
    TouchableOpacity, KeyboardAvoidingView, Platform,
} from 'react-native';
import {router} from 'expo-router';
import {useAuth} from '../../context/AuthContext';
import {Button, Input, ErrorBanner} from '../../components/ui';
import {Colors, Spacing, Radii} from '../../constants/theme';

export default function RegisterScreen() {
    const {register, login} = useAuth();
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirm, setConfirm] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    async function handleRegister() {
        setError('');
        if (!name || !email || !password) {
            setError('Please fill in all fields.');
            return;
        }
        if (password !== confirm) {
            setError('Passwords do not match.');
            return;
        }
        if (password.length < 6) {
            setError('Password must be at least 6 characters.');
            return;
        }

        setLoading(true);
        try {
            await register(name.trim(), email.trim().toLowerCase(), password);
            await login(email.trim().toLowerCase(), password); // auto-login after successful registration
            router.replace('/(tabs)/theatres'); // replace so the user can't navigate back to register
        } catch (e) {
            setError(e.response?.data?.error || 'Registration failed. Please try again.');
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

                <View style={styles.header}>
                    {/* Used a fitting emoji in lieu of a proper logo */}
                    <Text style={styles.logo}>🎭</Text>
                    <Text style={styles.title}>Create Account</Text>
                    <Text style={styles.subtitle}>Join to start booking shows</Text>
                </View>

                <View style={styles.form}>
                    <ErrorBanner message={error}/>

                    <Input label="Full Name" value={name} onChangeText={setName} placeholder="John Doe"/>
                    <Input label="Email" value={email} onChangeText={setEmail} placeholder="you@example.com"
                           keyboardType="email-address" autoCapitalize="none" autoCorrect={false}/>
                    <Input label="Password" value={password} onChangeText={setPassword} placeholder="Min. 6 characters"
                           secureTextEntry/>
                    <Input label="Confirm Password" value={confirm} onChangeText={setConfirm}
                           placeholder="Repeat password" secureTextEntry/>

                    <Button
                        title="Create Account"
                        onPress={handleRegister}
                        loading={loading}
                        style={{marginTop: Spacing.sm}}
                    />

                    <TouchableOpacity style={styles.link} onPress={() => router.back()}>
                        <Text style={styles.linkText}>
                            Already have an account?{' '}
                            <Text style={styles.linkAccent}>Sign In</Text>
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
