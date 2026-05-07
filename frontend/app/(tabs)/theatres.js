// Theatres screen.
// Displays a searchable list of theatres.
// Tapping a theatre navigates to the shows screen pre-filtered to that theatre.

import React, {useState, useEffect, useCallback} from 'react';
import {
    View, Text, FlatList, StyleSheet,
    TextInput, TouchableOpacity, ActivityIndicator, RefreshControl,
} from 'react-native';
import {router} from 'expo-router';
import {Ionicons} from '@expo/vector-icons';
import api from '../../lib/api';
import {Card, EmptyState, ErrorBanner} from '../../components/ui';
import {Colors, Spacing, Radii} from '../../constants/theme';

export default function TheatresScreen() {
    const [theatres, setTheatres] = useState([]);
    const [search, setSearch] = useState('');
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState('');

    const fetchTheatres = useCallback(async (q = '') => {
        try {
            setError('');
            const {data} = await api.get('/theatres', {params: q ? {search: q} : {}});
            setTheatres(data);
        } catch {
            setError('Could not load theatres. Please try again.');
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, []);

    useEffect(() => {
        fetchTheatres();
    }, [fetchTheatres]);

    // Debounces the API call by 350ms as the user types; cleanup cancels any pending call
    useEffect(() => {
        if (!search) return;
        const t = setTimeout(() => fetchTheatres(search), 350);
        return () => clearTimeout(t);
    }, [search, fetchTheatres]);

    function renderItem({item}) {
        return (
            <TouchableOpacity onPress={() => router.push({
                pathname: '/shows',
                params: {theatreId: item.theatre_id, theatreName: item.name}
            })}>
                <Card style={styles.card}>
                    <View style={styles.cardHeader}>
                        <Text style={styles.cardIcon}>🏛</Text>
                        <View style={{flex: 1}}>
                            <Text style={styles.cardTitle}>{item.name}</Text>
                            <View style={styles.locationRow}>
                                <Ionicons name="location-outline" size={12} color={Colors.textSecondary}/>
                                <Text style={styles.location}> {item.location}</Text>
                            </View>
                        </View>
                        <Ionicons name="chevron-forward" size={18} color={Colors.textMuted}/>
                    </View>
                    {item.description && (
                        <Text style={styles.description} numberOfLines={2}>{item.description}</Text>
                    )}
                </Card>
            </TouchableOpacity>
        );
    }

    if (loading) return (
        <View style={styles.center}>
            <ActivityIndicator color={Colors.gold} size="large"/>
        </View>
    );

    return (
        <View style={styles.container}>
            {/* Search bar */}
            <View style={styles.searchWrap}>
                <Ionicons name="search" size={16} color={Colors.textMuted} style={styles.searchIcon}/>
                <TextInput
                    style={styles.searchInput}
                    placeholder="Search theatres or locations..."
                    placeholderTextColor={Colors.textMuted}
                    value={search}
                    onChangeText={setSearch}
                />
                {search.length > 0 && (
                    <TouchableOpacity onPress={() => setSearch('')}>
                        <Ionicons name="close-circle" size={16} color={Colors.textMuted}/>
                    </TouchableOpacity>
                )}
            </View>

            <ErrorBanner message={error}/>

            <FlatList
                data={theatres}
                keyExtractor={(t) => String(t.theatre_id)}
                renderItem={renderItem}
                contentContainerStyle={styles.list}
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={() => {
                            setRefreshing(true);
                            fetchTheatres(search);
                        }}
                        tintColor={Colors.gold}
                    />
                }
                ListEmptyComponent={
                    <EmptyState icon="🏛" title="No theatres found" subtitle="Try a different search term."/>
                }
                ItemSeparatorComponent={() => <View style={{height: Spacing.sm}}/>}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {flex: 1, backgroundColor: Colors.bg, padding: Spacing.md},
    center: {flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: Colors.bg},
    searchWrap: {
        flexDirection: 'row', alignItems: 'center',
        backgroundColor: Colors.surfaceAlt,
        borderRadius: Radii.full,
        paddingHorizontal: Spacing.md,
        marginBottom: Spacing.md,
        borderWidth: 1, borderColor: Colors.border,
    },
    searchIcon: {marginRight: 8},
    searchInput: {flex: 1, color: Colors.textPrimary, fontSize: 14, paddingVertical: 10},
    list: {paddingBottom: Spacing.xl},
    card: {},
    cardHeader: {flexDirection: 'row', alignItems: 'center', gap: Spacing.sm},
    cardIcon: {fontSize: 28},
    cardTitle: {color: Colors.textPrimary, fontSize: 16, fontWeight: '600', flex: 1},
    locationRow: {flexDirection: 'row', alignItems: 'center', marginTop: 2},
    location: {color: Colors.textSecondary, fontSize: 12},
    description: {color: Colors.textMuted, fontSize: 13, marginTop: Spacing.sm, lineHeight: 18},
});
