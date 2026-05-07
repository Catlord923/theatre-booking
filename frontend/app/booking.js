// Booking screen. Displays an interactive seat map for a given showtime and allows
// the user to select seats and confirm a reservation.

import React, {useState, useEffect} from 'react';
import {
    View, Text, ScrollView, StyleSheet,
    TouchableOpacity, ActivityIndicator, Alert,
} from 'react-native';
import {router, useLocalSearchParams} from 'expo-router';
import {Ionicons} from '@expo/vector-icons';
import api from '../lib/api';
import {Button, Card, ErrorBanner, Divider} from '../components/ui';
import {Colors, Spacing, Radii} from '../constants/theme';

// Maps seat category to its display colour in the seat map
const CATEGORY_COLORS = {
    standard: Colors.textSecondary,
    vip: Colors.gold,
    wheelchair: Colors.success,
};

export default function BookingScreen() {
    const {showtimeId, showTitle} = useLocalSearchParams();
    const [showtime, setShowtime] = useState(null);
    const [seats, setSeats] = useState([]);
    const [selected, setSelected] = useState([]);
    const [loading, setLoading] = useState(true);
    const [booking, setBooking] = useState(false);
    const [error, setError] = useState('');

    // Fetch showtime details and available seats in parallel on mount
    useEffect(() => {
        (async () => {
            try {
                const [stRes, seatsRes] = await Promise.all([
                    api.get(`/showtimes/${showtimeId}`),
                    api.get(`/showtimes/${showtimeId}/seats`),
                ]);
                setShowtime(stRes.data);
                setSeats(seatsRes.data);
            } catch {
                setError('Could not load seat availability.');
            } finally {
                setLoading(false);
            }
        })();
    }, [showtimeId]);

    // Toggle a seat in/out of the selection
    function toggleSeat(seat) {
        setSelected((prev) =>
            prev.find((s) => s.seat_id === seat.seat_id)
                ? prev.filter((s) => s.seat_id !== seat.seat_id)
                : [...prev, seat]
        );
    }

    function totalPrice() {
        return selected.reduce((sum, s) => sum + parseFloat(s.price), 0).toFixed(2);
    }

    async function confirmBooking() {
        if (selected.length === 0) {
            setError('Please select at least one seat.');
            return;
        }
        setBooking(true);
        setError('');
        try {
            await api.post('/reservations', {
                showtime_id: parseInt(showtimeId),
                seat_ids: selected.map((s) => s.seat_id),
            });
            Alert.alert(
                '🎭 Booking Confirmed!',
                `You've reserved ${selected.length} seat(s) for ${showTitle}.\n\nTotal: $${totalPrice()}`,
                [{text: 'View My Bookings', onPress: () => router.replace('/(tabs)/reservations')}]
            );
        } catch (e) {
            const msg = e.response?.data?.error || 'Booking failed. Some seats may have just been taken.';
            setError(msg);
        } finally {
            setBooking(false);
        }
    }

    // Group seats by row label for rendering the seat map row by row
    const rows = seats.reduce((acc, seat) => {
        const r = seat.row_label;
        if (!acc[r]) acc[r] = [];
        acc[r].push(seat);
        return acc;
    }, {});

    if (loading) return (
        <View style={styles.center}><ActivityIndicator color={Colors.gold} size="large"/></View>
    );

    return (
        <View style={styles.wrapper}>
            <ScrollView contentContainerStyle={styles.container}>
                <ErrorBanner message={error}/>

                {/* Showtime info */}
                {showtime && (
                    <Card style={styles.stCard}>
                        <Text style={styles.showTitle}>{showTitle}</Text>
                        <Text style={styles.stInfo}>
                            {new Date(showtime.start_time).toLocaleDateString('en-US', {
                                weekday: 'long',
                                month: 'long',
                                day: 'numeric'
                            })}
                            {'  ·  '}
                            {new Date(showtime.start_time).toLocaleTimeString('en-US', {
                                hour: '2-digit',
                                minute: '2-digit'
                            })}
                        </Text>
                        <Text style={styles.stHall}>{showtime.hall_name} · {showtime.theatre_name}</Text>
                    </Card>
                )}

                {/* Legend */}
                <View style={styles.legend}>
                    {Object.entries(CATEGORY_COLORS).map(([cat, color]) => (
                        <View key={cat} style={styles.legendItem}>
                            <View style={[
                                styles.legendDot,
                                cat === 'vip'
                                    ? {backgroundColor: 'transparent', borderWidth: 2, borderColor: color}
                                    : {backgroundColor: color}
                            ]}/>
                            <Text style={styles.legendLabel}>{cat.charAt(0).toUpperCase() + cat.slice(1)}</Text>
                        </View>
                    ))}
                    <View style={styles.legendItem}>
                        <View style={[styles.legendDot, {backgroundColor: Colors.gold}]}/>
                        <Text style={styles.legendLabel}>Selected</Text>
                    </View>
                </View>

                {/* Stage indicator */}
                <View style={styles.stage}>
                    <Text style={styles.stageText}>STAGE</Text>
                </View>

                {/* Seat map - one row per row label, seats rendered left to right */}
                {Object.entries(rows).map(([row, rowSeats]) => (
                    <View key={row} style={styles.row}>
                        <Text style={styles.rowLabel}>{row}</Text>
                        <View style={styles.rowSeats}>
                            {rowSeats.map((seat) => {
                                const isSelected = !!selected.find((s) => s.seat_id === seat.seat_id);
                                const catColor = CATEGORY_COLORS[seat.category] || Colors.textSecondary;
                                return (
                                    <TouchableOpacity
                                        key={seat.seat_id}
                                        style={[
                                            styles.seat,
                                            {borderColor: catColor},
                                            seat.category === 'vip' && !isSelected && {backgroundColor: 'transparent', borderColor: Colors.gold, borderWidth: 2},
                                            isSelected && {backgroundColor: Colors.gold, borderColor: Colors.gold},
                                        ]}
                                        onPress={() => toggleSeat(seat)}
                                    >
                                        <Text style={[styles.seatNum, isSelected && {color: Colors.bg}]}>
                                            {seat.seat_number}
                                        </Text>
                                    </TouchableOpacity>
                                );
                            })}
                        </View>
                    </View>
                ))}

                {/* Spacer to prevent content sitting behind the sticky footer */}
                <View style={{height: 120}}/>
            </ScrollView>

            {/* Sticky booking footer */}
            <View style={styles.footer}>
                <View>
                    <Text style={styles.footerLabel}>
                        {selected.length === 0 ? 'No seats selected' : `${selected.length} seat(s) selected`}
                    </Text>
                    {selected.length > 0 && (
                        <Text style={styles.footerPrice}>Total: ${totalPrice()}</Text>
                    )}
                </View>
                <Button
                    title="Confirm Booking"
                    onPress={confirmBooking}
                    loading={booking}
                    disabled={selected.length === 0}
                    style={{flex: 1, marginLeft: Spacing.md}}
                />
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    wrapper: {flex: 1, backgroundColor: Colors.bg},
    container: {padding: Spacing.md},
    center: {flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: Colors.bg},

    stCard: {marginBottom: Spacing.md},
    showTitle: {color: Colors.textPrimary, fontSize: 18, fontWeight: '700'},
    stInfo: {color: Colors.gold, fontSize: 13, marginTop: 4},
    stHall: {color: Colors.textSecondary, fontSize: 12, marginTop: 2},

    legend: {flexDirection: 'row', gap: Spacing.md, marginBottom: Spacing.md, flexWrap: 'wrap'},
    legendItem: {flexDirection: 'row', alignItems: 'center', gap: 4},
    legendDot: {width: 10, height: 10, borderRadius: 5},
    legendLabel: {color: Colors.textSecondary, fontSize: 11},

    stage: {
        backgroundColor: Colors.surfaceAlt,
        borderRadius: Radii.sm,
        paddingVertical: 6,
        alignItems: 'center',
        marginBottom: Spacing.lg,
        borderWidth: 1,
        borderColor: Colors.border,
    },
    stageText: {color: Colors.textMuted, fontSize: 11, fontWeight: '700', letterSpacing: 3},

    row: {flexDirection: 'row', alignItems: 'center', marginBottom: 8},
    rowLabel: {color: Colors.textMuted, fontSize: 12, width: 20, fontWeight: '600'},
    rowSeats: {flexDirection: 'row', flexWrap: 'wrap', gap: 6, flex: 1},
    seat: {
        width: 36, height: 36,
        borderRadius: 6,
        borderWidth: 1.5,
        borderColor: Colors.border,
        justifyContent: 'center',
        alignItems: 'center',
    },
    seatNum: {color: Colors.textSecondary, fontSize: 11, fontWeight: '600'},

    footer: {
        position: 'absolute', bottom: 0, left: 0, right: 0,
        backgroundColor: Colors.surface,
        borderTopWidth: 1, borderTopColor: Colors.border,
        padding: Spacing.md,
        flexDirection: 'row',
        alignItems: 'center',
    },
    footerLabel: {color: Colors.textSecondary, fontSize: 13},
    footerPrice: {color: Colors.gold, fontSize: 17, fontWeight: '700'},
});
