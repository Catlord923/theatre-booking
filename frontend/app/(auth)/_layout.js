// Layout for the auth route group.
// Applies shared screen options to all auth screens
// (login, register, etc.) via Expo Router's Stack navigator.

import {Stack} from 'expo-router';
import {Colors} from '../../constants/theme';

export default function AuthLayout() {
    return (
        <Stack screenOptions={{
            headerShown: false, // Hide the default header on all auth screens
            contentStyle: {backgroundColor: Colors.bg},
        }}/>
    );
}
