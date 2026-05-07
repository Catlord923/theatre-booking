// Reservations screen. Displays the current user's
// bookings with options to modify or cancel any that
// are upcoming and not already cancelled.

import React, {useState, useEffect, useCallback} from 'react';
import {
    View, Text, FlatList, StyleSheet,
    TouchableOpacity, ActivityIndicator, Alert, RefreshControl,
} from 'react-native';
import {router} from 'expo-router';
import {Ionicons} from '@expo/vector-icons';
import api from '../../lib/api';
import {Card, Badge, EmptyState, ErrorBanner, Divider} from '../../components/ui';
import {Colors, Spacing, Radii} from '../../constants/theme';

// Maps reservation status to a display colour
const STATUS_COLORS = {
    confirmed: Colors.success,
    pending: Colors.warning,
    cancelled: Colors.textMuted,
};

export default function ReservationsScreen() {
    const [reservations, setReservations] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState('');

    // Wrapped in useCallback so it can be safely listed as a useEffect dependency
    const fetchReservations = useCallback(async () => {
        try {
            setError('');
            const {data} = await api.get('/user/reservations');
            setReservations(data);
        } catch {
            setError('Could not load your bookings.');
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, []);

    useEffect(() => {
        fetchReservations();
    }, [fetchReservations]);

    // Prompts for confirmation before cancelling
    async function cancelReservation(id) {
        Alert.alert(
            'Cancel Reservation',
            'Are you sure you want to cancel this booking?',
            [
                {text: 'Keep It', style: 'cancel'},
                {
                    text: 'Cancel Booking',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            await api.patch(`/reservations/${id}/cancel`);
                            fetchReservations();
                        } catch (e) {
                            Alert.alert('Error', e.response?.data?.error || 'Could not cancel booking.');
                        }
                    },
                },
            ]
        );
    }

    function renderItem({item}) {
        const isPast = new Date(item.start_time) <= new Date();
        const isCancelled = item.status === 'cancelled';
        // seats may arrive as a JSON string from the API depending on the driver
        const seats = typeof item.seats === 'string' ? JSON.parse(item.seats) : item.seats;

        return (
            <Card style={[styles.card, isCancelled && styles.cardCancelled]}>
                {/* Header */}
                <View style={styles.cardHeader}>
                    <View style={{flex: 1}}>
                        <Text style={styles.showTitle}>{item.show_title}</Text>
                        <Text style={styles.theatre}>{item.theatre_name}</Text>
                    </View>
                    <Badge
                        label={item.status.charAt(0).toUpperCase() + item.status.slice(1)}
                        color={STATUS_COLORS[item.status]}
                    />
                </View>

                <Divider style={{marginVertical: Spacing.sm}}/>

                {/* Details */}
                <View style={styles.detailRow}>
                    <Ionicons name="calendar-outline" size={14} color={Colors.textSecondary}/>
                    <Text style={styles.detailText}>
                        {new Date(item.start_time).toLocaleDateString('en-US', {
                            weekday: 'long',
                            month: 'long',
                            day: 'numeric'
                        })}
                        {'  '}
                        {new Date(item.start_time).toLocaleTimeString('en-US', {hour: '2-digit', minute: '2-digit'})}
                    </Text>
                </View>

                <View style={styles.detailRow}>
                    <Ionicons name="ticket-outline" size={14} color={Colors.textSecondary}/>
                    <Text style={styles.detailText}>
                        {seats?.length || 0} seat(s):{' '}
                        {seats?.map((s) => `${s.row_label}${s.seat_number}`).join(', ')}
                    </Text>
                </View>

                <View style={styles.detailRow}>
                    <Ionicons name="cash-outline" size={14} color={Colors.textSecondary}/>
                    <Text style={[styles.detailText, {color: Colors.gold, fontWeight: '600'}]}>
                        ${parseFloat(item.total_price).toFixed(2)}
                    </Text>
                </View>

                {/* Modify/cancel actions - hidden for past or already cancelled reservations */}
                {!isCancelled && !isPast && (
                    <View style={styles.actions}>
                        <TouchableOpacity
                            style={styles.actionBtn}
                            onPress={() => router.push({
                                pathname: '/modify-reservation',
                                params: {reservationId: item.reservation_id, showtimeId: item.showtime_id}
                            })}
                        >
                            <Ionicons name="pencil-outline" size={14} color={Colors.gold}/>
                            <Text style={styles.actionText}>Modify</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[styles.actionBtn, styles.actionBtnDanger]}
                            onPress={() => cancelReservation(item.reservation_id)}
                        >
                            <Ionicons name="close-circle-outline" size={14} color={Colors.error}/>
                            <Text style={[styles.actionText, {color: Colors.error}]}>Cancel</Text>
                        </TouchableOpacity>
                    </View>
                )}
            </Card>
        );
    }

    if (loading) return (
        <View style={styles.center}><ActivityIndicator color={Colors.gold} size="large"/></View>
    );

    return (
        <View style={styles.container}>
            <ErrorBanner message={error}/>
            <FlatList
                data={reservations}
                keyExtractor={(r) => String(r.reservation_id)}
                renderItem={renderItem}
                contentContainerStyle={styles.list}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={() => {
                        setRefreshing(true);
                        fetchReservations();
                    }} tintColor={Colors.gold}/>
                }
                ListEmptyComponent={
                    <EmptyState icon="🎟" title="No bookings yet" subtitle="Browse shows and reserve your seats."/>
                }
                ItemSeparatorComponent={() => <View style={{height: Spacing.sm}}/>}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {flex: 1, backgroundColor: Colors.bg, padding: Spacing.md},
    center: {flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: Colors.bg},
    list: {paddingBottom: Spacing.xl},
    card: {},
    cardCancelled: {opacity: 0.55},
    cardHeader: {flexDirection: 'row', alignItems: 'flex-start'},
    showTitle: {color: Colors.textPrimary, fontSize: 16, fontWeight: '700'},
    theatre: {color: Colors.textSecondary, fontSize: 12, marginTop: 2},
    detailRow: {flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4},
    detailText: {color: Colors.textSecondary, fontSize: 13},
    actions: {flexDirection: 'row', gap: Spacing.sm, marginTop: Spacing.sm},
    actionBtn: {
        flexDirection: 'row', alignItems: 'center', gap: 4,
        borderWidth: 1, borderColor: Colors.gold,
        borderRadius: Radii.sm, paddingHorizontal: 10, paddingVertical: 6,
    },
    actionBtnDanger: {borderColor: Colors.error},
    actionText: {color: Colors.gold, fontSize: 12, fontWeight: '600'},
});
