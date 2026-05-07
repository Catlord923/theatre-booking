// Profile screen.
// Displays the current user's info and provides
// navigation shortcuts and a sign out option.

import React from 'react';
import {View, Text, StyleSheet, TouchableOpacity, Alert} from 'react-native';
import {router} from 'expo-router';
import {Ionicons} from '@expo/vector-icons';
import {useAuth} from '../../context/AuthContext';
import {Card, Divider} from '../../components/ui';
import {Colors, Spacing, Radii} from '../../constants/theme';

// Reusable menu row with an icon, label, and chevron
function MenuItem({icon, label, onPress, danger}) {
    return (
        <TouchableOpacity style={styles.menuItem} onPress={onPress}>
            <Ionicons name={icon} size={20} color={danger ? Colors.error : Colors.textSecondary}/>
            <Text style={[styles.menuLabel, danger && {color: Colors.error}]}>{label}</Text>
            <Ionicons name="chevron-forward" size={16} color={Colors.textMuted}/>
        </TouchableOpacity>
    );
}

export default function ProfileScreen() {
    const {user, logout} = useAuth();

    // Prompts for confirmation before signing out
    function handleLogout() {
        Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
            {text: 'Cancel', style: 'cancel'},
            {
                text: 'Sign Out',
                style: 'destructive',
                onPress: async () => {
                    await logout();
                    router.replace('/(auth)/login');
                },
            },
        ]);
    }

    return (
        <View style={styles.container}>
            {/* Avatar - uses the first letter of the user's name as a placeholder */}
            <View style={styles.avatarWrap}>
                <View style={styles.avatar}>
                    <Text style={styles.avatarText}>
                        {user?.name?.charAt(0).toUpperCase() || '?'}
                    </Text>
                </View>
                <Text style={styles.name}>{user?.name}</Text>
                <Text style={styles.email}>{user?.email}</Text>
                {user?.role === 'admin' && (
                    <View style={styles.adminBadge}>
                        <Text style={styles.adminBadgeText}>Admin</Text>
                    </View>
                )}
            </View>

            {/* Menu */}
            <Card style={styles.menu}>
                <MenuItem
                    icon="ticket-outline"
                    label="My Bookings"
                    onPress={() => router.push('/(tabs)/reservations')}
                />
                <Divider style={{marginVertical: 0}}/>
                <MenuItem
                    icon="film-outline"
                    label="Browse Shows"
                    onPress={() => router.push('/(tabs)/shows')}
                />
                <Divider style={{marginVertical: 0}}/>
                <MenuItem
                    icon="business-outline"
                    label="Browse Theatres"
                    onPress={() => router.push('/(tabs)/theatres')}
                />
            </Card>

            <Card style={[styles.menu, {marginTop: Spacing.md}]}>
                <MenuItem icon="log-out-outline" label="Sign Out" onPress={handleLogout} danger/>
            </Card>

            <Text style={styles.version}>Theatre Booking · CN6035 · v1.0.0</Text>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {flex: 1, backgroundColor: Colors.bg, padding: Spacing.md},
    avatarWrap: {alignItems: 'center', paddingVertical: Spacing.xl},
    avatar: {
        width: 80, height: 80, borderRadius: 40,
        backgroundColor: Colors.surfaceAlt,
        borderWidth: 2, borderColor: Colors.gold,
        justifyContent: 'center', alignItems: 'center',
        marginBottom: Spacing.md,
    },
    avatarText: {color: Colors.gold, fontSize: 32, fontWeight: '700'},
    name: {color: Colors.textPrimary, fontSize: 20, fontWeight: '700'},
    email: {color: Colors.textSecondary, fontSize: 14, marginTop: 4},
    adminBadge: {
        marginTop: 8,
        backgroundColor: Colors.goldDim,
        borderRadius: Radii.full,
        paddingHorizontal: 12,
        paddingVertical: 4
    },
    adminBadgeText: {color: Colors.gold, fontSize: 11, fontWeight: '700', letterSpacing: 1},
    menu: {},
    menuItem: {flexDirection: 'row', alignItems: 'center', gap: Spacing.md, paddingVertical: Spacing.md},
    menuLabel: {flex: 1, color: Colors.textPrimary, fontSize: 15},
    version: {color: Colors.textMuted, fontSize: 11, textAlign: 'center', marginTop: Spacing.xl},
});
