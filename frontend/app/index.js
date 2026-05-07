// App entry point. Redirects to the main app if the user is authenticated,
// or to the login screen if not. Shows a spinner while the auth state is loading.

import {Redirect} from 'expo-router';
import {useAuth} from '../context/AuthContext';
import {ActivityIndicator, View} from 'react-native';
import {Colors} from '../constants/theme';

export default function Index() {
    const {user, loading} = useAuth();

    if (loading) {
        return (
            <View style={{flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: Colors.bg}}>
                <ActivityIndicator color={Colors.gold} size="large"/>
            </View>
        );
    }

    return <Redirect href={user ? '/(tabs)/theatres' : '/(auth)/login'}/>;
}
