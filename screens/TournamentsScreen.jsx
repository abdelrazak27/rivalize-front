import React, { useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import RedirectLinkButton from '../components/RedirectLinkButton';
import { useFocusEffect } from '@react-navigation/native';
import TournamentList from './TournamentList';
import { useUser } from '../context/UserContext';

function TournamentsScreen() {
    const { user } = useUser();
    const [refresh, setRefresh] = useState(false);

    useFocusEffect(
        React.useCallback(() => {
            setRefresh(prev => !prev);
        }, [])
    );

    return (
        <View style={styles.container}>
            {user.accountType === "coach" && (
                <>
                    <RedirectLinkButton
                        routeName="CreateTournamentFormScreen"
                        title="Créer un tournoi"
                        params={{ user: user }}
                    />
                </>
            )}
            <TournamentList refresh={refresh} />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 10,
    }
});

export default TournamentsScreen;
