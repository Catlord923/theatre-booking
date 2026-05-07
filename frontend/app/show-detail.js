// Show detail screen. Displays show info and a list of available showtimes.
// Tapping a showtime navigates to the booking screen.

import React, {useState, useEffect} from 'react';
import {
    View, Text, ScrollView, StyleSheet,
    TouchableOpacity, ActivityIndicator,
} from 'react-native';
import {router, useLocalSearchParams} from 'expo-router';
import {Ionicons} from '@expo/vector-icons';
import api from '../lib/api';
import {Card, Badge, Divider, EmptyState, ErrorBanner} from '../components/ui';
import {Colors, Spacing, Radii} from '../constants/theme';

export default function ShowDetailScreen() {
    const {showId} = useLocalSearchParams();
    const [show, setShow] = useState(null);
    const [showtimes, setShowtimes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    // Fetch show details and its showtimes in parallel on mount
    useEffect(() => {
        (async () => {
            try {
                const [showRes, stRes] = await Promise.all([
                    api.get(`/shows/${showId}`),
                    api.get(`/shows/${showId}/showtimes`),
                ]);
                setShow(showRes.data);
                setShowtimes(stRes.data);
            } catch {
                setError('Could not load show details.');
            } finally {
                setLoading(false);
            }
        })();
    }, [showId]);

    if (loading) return (
        <View style={styles.center}><ActivityIndicator color={Colors.gold} size="large"/></View>
    );

    return (
        <ScrollView style={styles.container} contentContainerStyle={{padding: Spacing.md}}>
            <ErrorBanner message={error}/>

            {/* Show info */}
            {show && (
                <Card style={styles.showCard}>
                    <Text style={styles.showTitle}>{show.title}</Text>
                    <Text style={styles.theatre}>{show.theatre_name}</Text>
                    <Text style={styles.location}>{show.theatre_location}</Text>

                    <View style={styles.badges}>
                        <Badge label={`${show.duration_min} min`} color={Colors.textSecondary}/>
                        <Badge label={show.age_rating} color={Colors.gold}/>
                    </View>

                    {show.description && (
                        <>
                            <Divider/>
                            <Text style={styles.description}>{show.description}</Text>
                        </>
                    )}
                </Card>
            )}

            <Text style={styles.sectionTitle}>Available Showtimes</Text>

            {showtimes.length === 0
                ? <EmptyState icon="📅" title="No upcoming showtimes"/>
                : showtimes.map((st) => (
                    <TouchableOpacity
                        key={st.showtime_id}
                        onPress={() => router.push({
                            pathname: '/booking',
                            params: {showtimeId: st.showtime_id, showTitle: show?.title}
                        })}
                    >
                        <Card style={styles.stCard}>
                            <View style={styles.stRow}>
                                <View style={{flex: 1}}>
                                    <Text style={styles.stDate}>
                                        {new Date(st.start_time).toLocaleDateString('en-US', {
                                            weekday: 'short',
                                            month: 'short',
                                            day: 'numeric'
                                        })}
                                    </Text>
                                    <Text style={styles.stTime}>
                                        {new Date(st.start_time).toLocaleTimeString('en-US', {
                                            hour: '2-digit',
                                            minute: '2-digit'
                                        })}
                                    </Text>
                                    <Text style={styles.stHall}>{st.hall_name}</Text>
                                </View>
                                <View style={{alignItems: 'flex-end', gap: 6}}>
                                    <Text style={styles.stPrice}>From ${parseFloat(st.price_std).toFixed(2)}</Text>
                                    {/* Availability badge: amber when <= 10 seats remaining, green otherwise */}
                                    <View style={[
                                        styles.availBadge,
                                        {backgroundColor: st.seats_available > 10 ? '#1A2A1A' : '#2A1A0A'}
                                    ]}>
                                        <Text style={[
                                            styles.availText,
                                            {color: st.seats_available > 10 ? Colors.success : Colors.warning}
                                        ]}>
                                            {st.seats_available} seats left
                                        </Text>
                                    </View>
                                </View>
                                <Ionicons name="chevron-forward" size={16} color={Colors.textMuted}
                                          style={{marginLeft: 8}}/>
                            </View>
                        </Card>
                    </TouchableOpacity>
                ))
            }
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {flex: 1, backgroundColor: Colors.bg},
    center: {flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: Colors.bg},
    showCard: {marginBottom: Spacing.lg},
    showTitle: {color: Colors.textPrimary, fontSize: 22, fontWeight: '700', letterSpacing: -0.3},
    theatre: {color: Colors.gold, fontSize: 13, fontWeight: '600', marginTop: 4},
    location: {color: Colors.textSecondary, fontSize: 12, marginTop: 2},
    badges: {flexDirection: 'row', gap: 8, marginTop: Spacing.sm},
    description: {color: Colors.textSecondary, fontSize: 14, lineHeight: 20},
    sectionTitle: {
        color: Colors.textSecondary,
        fontSize: 11,
        fontWeight: '700',
        letterSpacing: 2,
        textTransform: 'uppercase',
        marginBottom: Spacing.sm
    },
    stCard: {marginBottom: Spacing.sm},
    stRow: {flexDirection: 'row', alignItems: 'center'},
    stDate: {color: Colors.textPrimary, fontSize: 15, fontWeight: '600'},
    stTime: {color: Colors.gold, fontSize: 13, marginTop: 2},
    stHall: {color: Colors.textSecondary, fontSize: 12, marginTop: 2},
    stPrice: {color: Colors.textPrimary, fontSize: 14, fontWeight: '600'},
    availBadge: {borderRadius: Radii.sm, paddingHorizontal: 8, paddingVertical: 3},
    availText: {fontSize: 11, fontWeight: '600'},
});
