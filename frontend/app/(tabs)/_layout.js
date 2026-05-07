// Layout for the main tab navigator.
// Defines the four primary app tabs and applies
// shared header and tab bar styling across all of them.

import {Tabs} from 'expo-router';
import {Ionicons} from '@expo/vector-icons';
import {Colors} from '../../constants/theme';

// Helper function to reduce boilerplate when declaring tab bar icons
function icon(name) {
    return ({color, size}) => <Ionicons name={name} size={size} color={color}/>;
}

export default function TabsLayout() {
    return (
        <Tabs
            screenOptions={{
                headerStyle: {backgroundColor: Colors.bg},
                headerTintColor: Colors.gold,
                headerTitleStyle: {color: Colors.textPrimary, fontWeight: '600', fontSize: 18},
                tabBarStyle: {
                    backgroundColor: Colors.surface,
                    borderTopColor: Colors.border,
                    borderTopWidth: 1,
                    paddingBottom: 4,
                },
                tabBarActiveTintColor: Colors.gold,
                tabBarInactiveTintColor: Colors.textMuted,
                tabBarLabelStyle: {fontSize: 11, fontWeight: '600'},
            }}
        >
            <Tabs.Screen
                name="theatres"
                options={{title: 'Theatres', tabBarIcon: icon('business-outline')}}
            />
            <Tabs.Screen
                name="shows"
                options={{title: 'Shows', tabBarIcon: icon('film-outline')}}
            />
            <Tabs.Screen
                name="reservations"
                options={{title: 'My Bookings', tabBarIcon: icon('ticket-outline')}}
            />
            <Tabs.Screen
                name="profile"
                options={{title: 'Profile', tabBarIcon: icon('person-outline')}}
            />
        </Tabs>
    );
}
