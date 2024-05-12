import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Alert, ScrollView } from 'react-native';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '../firebaseConfig';
import { useUser } from '../context/UserContext';
import FunctionButton from '../components/FunctionsButton';

const TournamentDetailScreen = ({ route, navigation }) => {
    const { user } = useUser();
    const { tournamentId, refresh } = route.params;
    const [tournament, setTournament] = useState(null);

    const fetchTournament = async () => {
        const docRef = doc(db, 'tournois', tournamentId);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
            const data = docSnap.data();
            setTournament(data);
        } else {
            console.log('No such document!');
        }
    };

    useEffect(() => {
        fetchTournament();
    }, [tournamentId]);

    useEffect(() => {
        if (refresh) {
            fetchTournament();
        }
    }, [refresh]);

    const updateTournamentState = (newState) => {
        setTournament(prevTournament => ({
            ...prevTournament,
            state: newState
        }));
    };

    const deleteTournament = async () => {
        try {
            const docRef = doc(db, 'tournois', tournamentId);
            await updateDoc(docRef, { isDisabled: true });
            Alert.alert('Succès', 'Le tournoi a été annulé avec succès.', [
                {
                    text: 'OK',
                    onPress: () => {
                        updateTournamentState('disabled');
                        navigation.goBack();
                    }
                }
            ]);
        } catch (error) {
            console.error('Erreur lors de l\'annulation du tournoi :', error);
            Alert.alert('Erreur', 'Une erreur est survenue lors de l\'annulation du tournoi.');
        }
    };

    if (!tournament) {
        return (
            <View style={styles.centered}>
                <Text>Chargement...</Text>
            </View>
        );
    }

    return (
        <ScrollView style={styles.container}>
            <Text style={styles.title}>{tournament.name}</Text>
            <Text>Lieu : {tournament.place}</Text>
            <Text>Nombre de joueurs par équipe : {tournament.playersPerTeam}</Text>
            <Text>Catégorie : {tournament.category}</Text>
            <Text>Genre : {tournament.gender === 'F' ? 'Féminin' : 'Masculin'}</Text>
            <Text>Places disponibles : {tournament.availableSlots}</Text>
            <Text>Durée des jeux : {tournament.gameDuration}</Text>
            <Text>Matchs retours : {tournament.returnMatches ? 'Oui' : 'Non'}</Text>
            <Text>Début du tournoi : {new Date(tournament.startDate).toLocaleDateString()}</Text>
            <Text>Fin du tournoi : {new Date(tournament.endDate).toLocaleDateString()}</Text>
            {tournament.matches.map((round, roundIndex) => (
                <View key={roundIndex} style={styles.roundContainer}>
                    <Text style={styles.roundTitle}>{round.phase}</Text>
                    {round.matches.map((match, matchIndex) => (
                        <View key={matchIndex} style={styles.matchContainer}>
                            <Text>Match {matchIndex + 1}</Text>
                            <Text>Date : {new Date(match.date).toLocaleDateString()}</Text>
                            <Text>Heure : {new Date(match.time).toLocaleTimeString()}</Text>
                        </View>
                    ))}
                </View>
            ))}
            {user.uid === tournament.createdBy && (
                <>
                    {tournament.state === "upcoming" && (
                        <FunctionButton
                            title="Annuler le tournoi"
                            onPress={deleteTournament}
                        />
                    )}
                </>
            )}
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 20,
    },
    centered: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        marginBottom: 10,
    },
    roundContainer: {
        marginTop: 10,
    },
    roundTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        marginTop: 10,
    },
    matchContainer: {
        paddingLeft: 10,
        marginTop: 5,
    },
});

export default TournamentDetailScreen;
