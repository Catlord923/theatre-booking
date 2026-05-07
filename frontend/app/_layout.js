// Root layout. Wraps the entire app in AuthProvider and configures the top-level
// Stack navigator with shared header styles. Auth and tab screens manage their
// own headers internally, so the default header is hidden for both.
// Modal-style screens (show-detail, booking, modify-reservation) are registered
// here so they inherit the shared header styling.

import {Stack} from 'expo-router';
import {StatusBar} from 'expo-status-bar';
import {AuthProvider} from '../context/AuthContext';
import {Colors} from '../constants/theme';

export default function RootLayout() {
    return (
        <AuthProvider>
            <StatusBar style="light"/>
            <Stack
                screenOptions={{
                    headerStyle: {backgroundColor: Colors.bg},
                    headerTintColor: Colors.gold,
                    headerTitleStyle: {color: Colors.textPrimary, fontWeight: '600'},
                    contentStyle: {backgroundColor: Colors.bg},
                    headerBackTitle: 'Back',
                }}
            >
                <Stack.Screen name="(auth)" options={{headerShown: false}}/>
                <Stack.Screen name="(tabs)" options={{headerShown: false}}/>
                <Stack.Screen name="show-detail" options={{title: 'Show Details'}}/>
                <Stack.Screen name="booking" options={{title: 'Select Seats'}}/>
                <Stack.Screen name="modify-reservation" options={{title: 'Modify Reservation'}}/>
            </Stack>
        </AuthProvider>
    );
}
