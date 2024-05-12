import React, { useState, useCallback, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Switch } from 'react-native';
import RedirectLinkButton from '../components/RedirectLinkButton';
import { useFocusEffect, useRoute } from '@react-navigation/native';
import TournamentList from './TournamentList';
import { useUser } from '../context/UserContext';

function TournamentsScreen() {
    const { user } = useUser();
    const route = useRoute();
    const [refresh, setRefresh] = useState(false);
    const [activeSection, setActiveSection] = useState('current');
    const [showMyTournaments, setShowMyTournaments] = useState(false);

    useEffect(() => {
        if (route.params?.initialSection) {
            setActiveSection(route.params.initialSection);
        }
    }, [route.params?.initialSection]);

    useFocusEffect(
        useCallback(() => {
            setRefresh(prev => !prev);
        }, [activeSection, showMyTournaments])
    );

    const renderSection = () => {
        return <TournamentList refresh={refresh} state={activeSection} showMyTournaments={showMyTournaments} userId={user.uid} />;
    };

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
            <View style={styles.navbar}>
                <TouchableOpacity
                    style={[styles.navButton, activeSection === 'past' && styles.activeButton]}
                    onPress={() => setActiveSection('past')}
                >
                    <Text style={styles.navButtonText}>Past</Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[styles.navButton, activeSection === 'current' && styles.activeButton]}
                    onPress={() => setActiveSection('current')}
                >
                    <Text style={styles.navButtonText}>Current</Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[styles.navButton, activeSection === 'upcoming' && styles.activeButton]}
                    onPress={() => setActiveSection('upcoming')}
                >
                    <Text style={styles.navButtonText}>Upcoming</Text>
                </TouchableOpacity>
            </View>
            <View style={styles.checkboxContainer}>
                <Text>Afficher uniquement mes tournois</Text>
                <Switch
                    value={showMyTournaments}
                    onValueChange={(value) => setShowMyTournaments(value)}
                />
            </View>
            <View style={styles.sectionContainer}>
                {renderSection()}
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 10,
    },
    navbar: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        marginBottom: 10,
    },
    navButton: {
        padding: 10,
        borderRadius: 5,
        backgroundColor: '#ccc',
    },
    activeButton: {
        backgroundColor: '#007bff',
    },
    navButtonText: {
        color: 'white',
    },
    checkboxContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 10,
        marginBottom: 10,
    },
    sectionContainer: {
        flex: 1,
    }
});

export default TournamentsScreen;
