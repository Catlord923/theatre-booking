// Shared UI component library. Provides reusable primitive components used
// throughout the app. All components respect the app's theme via Colors, Spacing, and Radii.

import React from 'react';
import {
    View, Text, TextInput, TouchableOpacity,
    ActivityIndicator, StyleSheet,
} from 'react-native';
import {Colors, Spacing, Radii} from '../constants/theme';

// General-purpose button. Supports 'primary' (filled) and 'outline' variants,
// a loading state that swaps the label for a spinner, and a disabled state.
export function Button({title, onPress, variant = 'primary', loading, disabled, style}) {
    const isPrimary = variant === 'primary';
    return (
        <TouchableOpacity
            onPress={onPress}
            disabled={disabled || loading}
            style={[
                styles.btn,
                isPrimary ? styles.btnPrimary : styles.btnOutline,
                (disabled || loading) && styles.btnDisabled,
                style,
            ]}
            activeOpacity={0.75}
        >
            {loading
                ? <ActivityIndicator color={isPrimary ? Colors.bg : Colors.gold} size="small"/>
                : <Text style={[styles.btnText, !isPrimary && styles.btnTextOutline]}>{title}</Text>
            }
        </TouchableOpacity>
    );
}

// Labelled text input with optional inline error message.
export function Input({label, error, style, ...props}) {
    return (
        <View style={[styles.inputWrap, style]}>
            {label && <Text style={styles.label}>{label}</Text>}
            <TextInput
                style={[styles.input, error && styles.inputError]}
                placeholderTextColor={Colors.textMuted}
                {...props}
            />
            {error && <Text style={styles.errorText}>{error}</Text>}
        </View>
    );
}

// Styled surface container with a border and rounded corners.
export function Card({children, style}) {
    return <View style={[styles.card, style]}>{children}</View>;
}

// Uppercase section heading.
export function SectionTitle({children, style}) {
    return <Text style={[styles.sectionTitle, style]}>{children}</Text>;
}

// Small pill badge with a coloured border and label. Defaults to gold.
export function Badge({label, color = Colors.gold}) {
    return (
        <View style={[styles.badge, {borderColor: color}]}>
            <Text style={[styles.badgeText, {color}]}>{label}</Text>
        </View>
    );
}

// Full width horizontal rule.
export function Divider({style}) {
    return <View style={[styles.divider, style]}/>;
}

// Centred empty state with an icon, title, and optional subtitle.
export function EmptyState({icon = '🎭', title, subtitle}) {
    return (
        <View style={styles.empty}>
            <Text style={styles.emptyIcon}>{icon}</Text>
            <Text style={styles.emptyTitle}>{title}</Text>
            {subtitle && <Text style={styles.emptySubtitle}>{subtitle}</Text>}
        </View>
    );
}

// Renders nothing when message is empty; shows a red banner otherwise.
export function ErrorBanner({message}) {
    if (!message) return null;
    return (
        <View style={styles.errorBanner}>
            <Text style={styles.errorBannerText}>⚠ {message}</Text>
        </View>
    );
}

const styles = StyleSheet.create({
    // Button
    btn: {
        borderRadius: Radii.sm,
        paddingVertical: 14,
        paddingHorizontal: Spacing.lg,
        alignItems: 'center',
        justifyContent: 'center',
    },
    btnPrimary: {backgroundColor: Colors.gold},
    btnOutline: {borderWidth: 1, borderColor: Colors.gold},
    btnDisabled: {opacity: 0.5},
    btnText: {color: Colors.bg, fontWeight: '700', fontSize: 15, letterSpacing: 0.5},
    btnTextOutline: {color: Colors.gold},

    // Input
    inputWrap: {marginBottom: Spacing.md},
    label: {
        color: Colors.textSecondary,
        fontSize: 12,
        fontWeight: '600',
        letterSpacing: 1,
        textTransform: 'uppercase',
        marginBottom: 6,
    },
    input: {
        backgroundColor: Colors.surfaceAlt,
        borderWidth: 1,
        borderColor: Colors.border,
        borderRadius: Radii.sm,
        color: Colors.textPrimary,
        fontSize: 15,
        paddingHorizontal: Spacing.md,
        paddingVertical: 12,
    },
    inputError: {borderColor: Colors.error},
    errorText: {color: Colors.error, fontSize: 12, marginTop: 4},

    // Card
    card: {
        backgroundColor: Colors.surface,
        borderRadius: Radii.md,
        padding: Spacing.md,
        borderWidth: 1,
        borderColor: Colors.border,
    },

    // Section Title
    sectionTitle: {
        color: Colors.textSecondary,
        fontSize: 11,
        fontWeight: '700',
        letterSpacing: 2,
        textTransform: 'uppercase',
        marginBottom: Spacing.sm,
    },

    // Badge
    badge: {
        borderWidth: 1,
        borderRadius: Radii.full,
        paddingHorizontal: 8,
        paddingVertical: 2,
        alignSelf: 'flex-start',
    },
    badgeText: {fontSize: 11, fontWeight: '600', letterSpacing: 0.5},

    // Divider
    divider: {height: 1, backgroundColor: Colors.border, marginVertical: Spacing.md},

    // Empty state
    empty: {alignItems: 'center', paddingVertical: Spacing.xxl},
    emptyIcon: {fontSize: 48, marginBottom: Spacing.md},
    emptyTitle: {color: Colors.textPrimary, fontSize: 18, fontWeight: '600'},
    emptySubtitle: {color: Colors.textSecondary, fontSize: 14, marginTop: 6, textAlign: 'center'},

    // Error banner
    errorBanner: {
        backgroundColor: '#2A1010',
        borderRadius: Radii.sm,
        padding: Spacing.md,
        borderLeftWidth: 3,
        borderLeftColor: Colors.error,
        marginBottom: Spacing.md,
    },
    errorBannerText: {color: Colors.error, fontSize: 13},
});
