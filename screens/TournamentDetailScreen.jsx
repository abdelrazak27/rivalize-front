import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebaseConfig';
import RedirectLinkButton from '../components/RedirectLinkButton';
import { useUser } from '../context/UserContext';

const TournamentDetailScreen = ({ route }) => {
    const { user } = useUser();
    const { tournamentId, refresh } = route.params;
    const [tournament, setTournament] = useState(null);

    const fetchTournament = async () => {
        const docRef = doc(db, 'tournois', tournamentId);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
            setTournament(docSnap.data());
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

    if (!tournament) {
        return (
            <View style={styles.centered}>
                <Text>Chargement...</Text>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <Text style={styles.title}>{tournament.name}</Text>
            <Text>Lieu : {tournament.place}</Text>
            <Text>Nombre de joueurs par équipe : {tournament.playersPerTeam}</Text>
            <Text>Catégorie : {tournament.category}</Text>
            <Text>Genre : {tournament.gender === 'F' ? 'Féminin' : 'Masculin'}</Text>
            <Text>Places disponibles : {tournament.availableSlots}</Text>
            <Text>Durée des jeux : {tournament.gameDuration}</Text>
            <Text>Matchs retours : {tournament.returnMatches ? 'Oui' : 'Non'}</Text>
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
            {/* {user.uid === tournament.createdBy && (
                <RedirectLinkButton
                    routeName="EditTournamentFormScreen"
                    title="Modifier un tournoi"
                    params={{ tournamentId: tournamentId }}
                />
            )} */}
        </View>
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
