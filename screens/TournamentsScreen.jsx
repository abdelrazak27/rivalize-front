import React, { useState, useCallback, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Switch, ScrollViewBase, ScrollView } from 'react-native';
import RedirectLinkButton from '../components/RedirectLinkButton';
import { useFocusEffect, useRoute } from '@react-navigation/native';
import TournamentList from './TournamentList';
import { useUser } from '../context/UserContext';
import { SafeAreaView } from 'react-native-safe-area-context';
import globalStyles from '../styles/globalStyles';
import { Label, PrimaryColorText, Subtitle, Title } from '../components/TextComponents';
import CustomTextInput from '../components/CustomTextInput';
import Spacer from '../components/Spacer';
import colors from '../styles/colors';
import { fonts } from '../styles/fonts';

function TournamentsScreen() {
    const { user } = useUser();
    const route = useRoute();
    const [refresh, setRefresh] = useState(false);
    const [activeSection, setActiveSection] = useState('current');
    const [showMyTournaments, setShowMyTournaments] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');

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
        return <TournamentList refresh={refresh} state={activeSection} showMyTournaments={showMyTournaments} userId={user.uid} searchQuery={searchQuery} />;
    };

    return (
        <SafeAreaView style={globalStyles.container}>
            <View style={[globalStyles.headerContainer, { paddingBottom: 25 }]}>
                <Title>Les <PrimaryColorText>tournois</PrimaryColorText></Title>
                <Subtitle>Retrouvez leurs informations en cliquant sur l’un d’eux parmi la liste ci-dessous</Subtitle>
                {user.accountType === "coach" && (
                    <View style={{ paddingTop: 20 }}>
                        <RedirectLinkButton
                            routeName="CreateTournamentFormScreen"
                            title="Créer un tournoi"
                            params={{ user: user }}
                        />
                    </View>
                )}
                <View style={styles.navbar}>
                    <TouchableOpacity
                        style={[styles.navButton, activeSection === 'past' && styles.activeButton]}
                        onPress={() => setActiveSection('past')}
                    >
                        <Text style={[styles.navButtonText, activeSection === 'past' && styles.activeButtonText]}>Passés</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[styles.navButton, activeSection === 'current' && styles.activeButton]}
                        onPress={() => setActiveSection('current')}
                    >
                        <Text style={[styles.navButtonText, activeSection === 'current' && styles.activeButtonText]}>En cours</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[styles.navButton, activeSection === 'upcoming' && styles.activeButton]}
                        onPress={() => setActiveSection('upcoming')}
                    >
                        <Text style={[styles.navButtonText, activeSection === 'upcoming' && styles.activeButtonText]}>Prochains</Text>
                    </TouchableOpacity>
                </View>
                <View style={styles.checkboxContainer}>
                    <Switch
                        value={showMyTournaments}
                        onValueChange={(value) => setShowMyTournaments(value)}
                        trackColor={{ true: colors.primary }}
                        style={{ transform: [{ scaleX: 0.9 }, { scaleY: 0.9 }] }}
                    />
                    <Text style={[styles.textCheckbox, showMyTournaments && { color: colors.primary }]}>Afficher uniquement mes tournois</Text>
                </View>
                <CustomTextInput
                    label="Rechercher un tournoi par son nom"
                    placeholder="Recherche par nom de tournoi..."
                    value={searchQuery}
                    onChangeText={setSearchQuery}
                />
            </View>

            <ScrollView
                contentContainerStyle={[globalStyles.scrollContainer, {marginTop: 10}]}
            >
                <Label>Liste des tournois</Label>
                {renderSection()}
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 10,
    },
    navbar: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingTop: 20
    },
    navButton: {
        borderRadius: 8,
        borderWidth: 2,
        borderColor: colors.secondary,
        backgroundColor: 'white',
        width: '30%',
        padding: 5,
    },
    activeButton: {
        borderColor: colors.primary,
    },
    activeButtonText: {
        color: colors.primary,
    },
    navButtonText: {
        fontSize: 14,
        color: colors.secondary,
        textAlign: 'center',
        fontFamily: fonts.OutfitSemiBold
    },
    checkboxContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 15,
        gap: 15,
    },
    sectionContainer: {
        flex: 1,
    },
    textCheckbox: {
        fontSize: 16,
        fontFamily: fonts.OutfitSemiBold,
        color: colors.secondary
    },
});

export default TournamentsScreen;
