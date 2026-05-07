// Shows screen.
// Displays a searchable, filterable list of shows.
// Can be navigated to directly from the tab bar (all shows) or
// from a theatre card (pre-filtered to that theatre via route params).

import React, {useState, useCallback, useEffect} from 'react';
import {
    View, Text, FlatList, StyleSheet,
    TextInput, TouchableOpacity, ActivityIndicator, RefreshControl,
} from 'react-native';
import {router, useLocalSearchParams} from 'expo-router';
import {useFocusEffect} from '@react-navigation/native';
import {Ionicons} from '@expo/vector-icons';
import api from '../../lib/api';
import {Card, Badge, EmptyState, ErrorBanner} from '../../components/ui';
import {Colors, Spacing, Radii} from '../../constants/theme';

export default function ShowsScreen() {
    const params = useLocalSearchParams();
    const [shows, setShows] = useState([]);
    const [search, setSearch] = useState('');
    const [theatreFilter, setTheatreFilter] = useState(null); // { id, name } or null
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState('');

    const fetchShows = useCallback(async (title = '', theatreId = null) => {
        try {
            setError('');
            const q = {};
            if (theatreId) q.theatreId = theatreId;
            if (title) q.title = title;
            const {data} = await api.get('/shows', {params: q});
            setShows(data);
        } catch {
            setError('Could not load shows. Please try again.');
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, []);

    // useFocusEffect re-runs whenever the screen comes into focus, allowing the
    // theatre filter to be applied or cleared based on incoming route params
    useFocusEffect(
        useCallback(() => {
            if (params.theatreId && params.theatreId !== "") {
                // Navigated from a theatre card = apply filter
                setTheatreFilter({id: params.theatreId, name: params.theatreName});
                setSearch('');
                fetchShows('', params.theatreId);
            } else {
                // Tapped from tab bar = show all
                setTheatreFilter(null);
                setSearch('');
                fetchShows('', null);
            }
        }, [params.theatreId, params.theatreName])
    );

    function clearFilter() {
        setTheatreFilter(null);
        setSearch('');
        fetchShows('', null);
        // Clear the params so re-focusing the screen doesn't reapply the filter
        router.setParams({theatreId: "", theatreName: ""});
    }

    // Debounces the API call by 350ms as the user types; cleanup cancels any pending call
    useEffect(() => {
        if (!search) return;
        const t = setTimeout(() => fetchShows(search, theatreFilter?.id || null), 350);
        return () => clearTimeout(t);
    }, [search, fetchShows, theatreFilter]);

    function renderItem({item}) {
        return (
            <TouchableOpacity onPress={() => router.push({pathname: '/show-detail', params: {showId: item.show_id}})}>
                <Card style={styles.card}>
                    <View style={styles.row}>
                        <View style={{flex: 1}}>
                            <Text style={styles.title}>{item.title}</Text>
                            <Text style={styles.theatre}>{item.theatre_name}</Text>
                            <Text style={styles.location}>{item.theatre_location}</Text>
                        </View>
                        <Ionicons name="chevron-forward" size={18} color={Colors.textMuted}/>
                    </View>
                    <View style={styles.meta}>
                        <Badge label={`${item.duration_min} min`} color={Colors.textSecondary}/>
                        <Badge label={item.age_rating} color={Colors.gold}/>
                    </View>
                    {item.description && (
                        <Text style={styles.description} numberOfLines={2}>{item.description}</Text>
                    )}
                </Card>
            </TouchableOpacity>
        );
    }

    if (loading) return (
        <View style={styles.center}><ActivityIndicator color={Colors.gold} size="large"/></View>
    );

    return (
        <View style={styles.container}>

            {/* Active theatre filter chip - tap to clear */}
            {theatreFilter && (
                <TouchableOpacity style={styles.filterChip} onPress={clearFilter}>
                    <Ionicons name="location-outline" size={13} color={Colors.gold}/>
                    <Text style={styles.filterChipText}>{theatreFilter.name}</Text>
                    <Ionicons name="close-circle" size={15} color={Colors.gold}/>
                </TouchableOpacity>
            )}

            {/* Search bar */}
            <View style={styles.searchWrap}>
                <Ionicons name="search" size={16} color={Colors.textMuted} style={{marginRight: 8}}/>
                <TextInput
                    style={styles.searchInput}
                    placeholder="Search shows..."
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
                data={shows}
                keyExtractor={(s) => String(s.show_id)}
                renderItem={renderItem}
                contentContainerStyle={styles.list}
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={() => {
                            setRefreshing(true);
                            fetchShows(search, theatreFilter?.id || null);
                        }}
                        tintColor={Colors.gold}
                    />
                }
                ListEmptyComponent={
                    <EmptyState icon="🎭" title="No shows found" subtitle="Try a different search."/>
                }
                ItemSeparatorComponent={() => <View style={{height: Spacing.sm}}/>}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {flex: 1, backgroundColor: Colors.bg, padding: Spacing.md},
    center: {flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: Colors.bg},
    filterChip: {
        flexDirection: 'row', alignItems: 'center', gap: 6,
        alignSelf: 'flex-start',
        backgroundColor: Colors.surfaceAlt,
        borderWidth: 1, borderColor: Colors.gold,
        borderRadius: Radii.full,
        paddingHorizontal: 12, paddingVertical: 5,
        marginBottom: Spacing.sm,
    },
    filterChipText: {color: Colors.gold, fontSize: 13, fontWeight: '600'},
    searchWrap: {
        flexDirection: 'row', alignItems: 'center',
        backgroundColor: Colors.surfaceAlt, borderRadius: Radii.full,
        paddingHorizontal: Spacing.md, marginBottom: Spacing.md,
        borderWidth: 1, borderColor: Colors.border,
    },
    searchInput: {flex: 1, color: Colors.textPrimary, fontSize: 14, paddingVertical: 10},
    list: {paddingBottom: Spacing.xl},
    card: {},
    row: {flexDirection: 'row', alignItems: 'flex-start'},
    title: {color: Colors.textPrimary, fontSize: 16, fontWeight: '700'},
    theatre: {color: Colors.gold, fontSize: 12, fontWeight: '600', marginTop: 2},
    location: {color: Colors.textSecondary, fontSize: 12},
    meta: {flexDirection: 'row', gap: 8, marginTop: Spacing.sm},
    description: {color: Colors.textMuted, fontSize: 13, marginTop: Spacing.sm, lineHeight: 18},
});
