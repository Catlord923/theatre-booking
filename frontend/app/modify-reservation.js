// Modify reservation screen. Displays the seat map for an existing reservation,
// pre-selecting the user's current seats, and allows them to swap to different seats.

import React, {useState, useEffect} from 'react';
import {
    View, Text, ScrollView, StyleSheet,
    TouchableOpacity, ActivityIndicator, Alert,
} from 'react-native';
import {router, useLocalSearchParams} from 'expo-router';
import api from '../lib/api';
import {Button, ErrorBanner} from '../components/ui';
import {Colors, Spacing, Radii} from '../constants/theme';

// Maps seat category to its display colour in the seat map
const CATEGORY_COLORS = {
    standard: Colors.textSecondary,
    vip: Colors.gold,
    wheelchair: Colors.success,
};

export default function ModifyReservationScreen() {
    const {reservationId, showtimeId} = useLocalSearchParams();
    const [allSeats, setAllSeats] = useState([]);
    const [currentIds, setCurrentIds] = useState([]); // seat IDs from the existing reservation
    const [selected, setSelected] = useState([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        (async () => {
            try {
                // Fetch available seats and the user's reservations in parallel
                const [availRes, myRes] = await Promise.all([
                    api.get(`/showtimes/${showtimeId}/seats`),
                    api.get('/user/reservations'),
                ]);

                const available = availRes.data;

                const thisReservation = myRes.data.find(
                    r => r.reservation_id === parseInt(reservationId)
                );
                const currentSeats = thisReservation?.seats || [];
                const currentSeatIds = currentSeats.map(s => s.seat_id);
                setCurrentIds(currentSeatIds);

                // Reshape current seats to match the available seats schema so they
                // can be rendered on the seat map alongside the available seats
                const currentAsMapSeats = currentSeats.map(s => ({
                    seat_id: s.seat_id,
                    row_label: s.row_label,
                    seat_number: s.seat_number,
                    category: s.category,
                    price: s.price_paid,
                    showtime_id: parseInt(showtimeId),
                }));

                // Merge available seats with current seats; current seats won't appear
                // in the available list since they're already booked, so they are added
                // back so the user can see and re-select them
                const merged = [
                    ...available,
                    ...currentAsMapSeats.filter(
                        cs => !available.find(a => a.seat_id === cs.seat_id)
                    ),
                ];

                setAllSeats(merged);
                setSelected(currentAsMapSeats); // pre-select current seats

            } catch (e) {
                setError('Could not load seat data.');
                console.log('Modify load error:', e.message, e.response?.data);
            } finally {
                setLoading(false);
            }
        })();
    }, [showtimeId, reservationId]);

    // Toggle a seat in/out of the selection
    function toggleSeat(seat) {
        setSelected(prev =>
            prev.find(s => s.seat_id === seat.seat_id)
                ? prev.filter(s => s.seat_id !== seat.seat_id)
                : [...prev, seat]
        );
    }

    async function saveChanges() {
        if (selected.length === 0) {
            setError('Please select at least one seat.');
            return;
        }
        setSaving(true);
        setError('');
        try {
            await api.put(`/reservations/${reservationId}`, {
                seat_ids: selected.map(s => s.seat_id),
            });
            Alert.alert('Updated!', 'Your reservation has been updated.', [
                {text: 'OK', onPress: () => router.back()},
            ]);
        } catch (e) {
            setError(e.response?.data?.error || 'Update failed.');
        } finally {
            setSaving(false);
        }
    }

    // Group seats by row label for rendering the seat map row by row
    const rows = allSeats.reduce((acc, seat) => {
        if (!acc[seat.row_label]) acc[seat.row_label] = [];
        acc[seat.row_label].push(seat);
        return acc;
    }, {});

    if (loading) return (
        <View style={styles.center}>
            <ActivityIndicator color={Colors.gold} size="large"/>
        </View>
    );

    return (
        <View style={styles.wrapper}>
            <ScrollView contentContainerStyle={styles.container}>
                <ErrorBanner message={error}/>

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
                <Text style={styles.hint}>Your current seats are pre-selected. Tap to change.</Text>

                {/* Stage indicator */}
                <View style={styles.stage}>
                    <Text style={styles.stageText}>STAGE</Text>
                </View>

                {/* Seat map; rows sorted alphabetically, seats sorted numerically */}
                {Object.entries(rows).sort().map(([row, rowSeats]) => (
                    <View key={row} style={styles.row}>
                        <Text style={styles.rowLabel}>{row}</Text>
                        <View style={styles.rowSeats}>
                            {rowSeats.sort((a, b) => a.seat_number - b.seat_number).map(seat => {
                                const isSelected = !!selected.find(s => s.seat_id === seat.seat_id);
                                const isCurrent = currentIds.includes(seat.seat_id);
                                const catColor = CATEGORY_COLORS[seat.category] || Colors.textSecondary;
                                return (
                                    <TouchableOpacity
                                        key={seat.seat_id}
                                        style={[
                                            styles.seat,
                                            {borderColor: catColor},
                                            seat.category === 'vip' && !isSelected && {backgroundColor: 'transparent', borderColor: Colors.gold, borderWidth: 2},
                                            isCurrent && !isSelected && {
                                                backgroundColor: '#1A1A0A',
                                                borderColor: Colors.goldDim
                                            }, // dimmed gold = previously selected but deselected
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

            {/* Sticky footer */}
            <View style={styles.footer}>
                <Text style={styles.footerLabel}>{selected.length} seat(s) selected</Text>
                <Button
                    title="Save Changes"
                    onPress={saveChanges}
                    loading={saving}
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
    hint: {color: Colors.textSecondary, fontSize: 13, marginBottom: Spacing.md, lineHeight: 18},
    legend: {flexDirection: 'row', gap: Spacing.md, marginBottom: Spacing.sm, flexWrap: 'wrap'},
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
        borderColor: Colors.border
    },
    stageText: {color: Colors.textMuted, fontSize: 11, fontWeight: '700', letterSpacing: 3},
    row: {flexDirection: 'row', alignItems: 'center', marginBottom: 8},
    rowLabel: {color: Colors.textMuted, fontSize: 12, width: 20, fontWeight: '600'},
    rowSeats: {flexDirection: 'row', flexWrap: 'wrap', gap: 6, flex: 1},
    seat: {width: 36, height: 36, borderRadius: 6, borderWidth: 1.5, justifyContent: 'center', alignItems: 'center'},
    seatNum: {color: Colors.textSecondary, fontSize: 11, fontWeight: '600'},
    footer: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: Colors.surface,
        borderTopWidth: 1,
        borderTopColor: Colors.border,
        padding: Spacing.md,
        flexDirection: 'row',
        alignItems: 'center'
    },
    footerLabel: {color: Colors.textSecondary, fontSize: 13},
});
