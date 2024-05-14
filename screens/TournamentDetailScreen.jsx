import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Alert, ScrollView, Modal, Button } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '../firebaseConfig';
import { useUser } from '../context/UserContext';
import FunctionButton from '../components/FunctionsButton';

const TournamentDetailScreen = ({ route, navigation }) => {
    const { user } = useUser();
    const { tournamentId, refresh } = route.params;
    const [tournament, setTournament] = useState(null);
    const [modalVisible, setModalVisible] = useState(false);
    const [selectedTeam, setSelectedTeam] = useState(null);

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
    };

    const joinTournament = () => {
        setModalVisible(true);
    };

    const confirmJoin = () => {
        console.log('Joining tournament with team ID:', selectedTeam);
        setModalVisible(false);
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
            <FunctionButton
                title="Rejoindre le tournoi"
                onPress={joinTournament}
            />
            <Modal
                animationType="slide"
                transparent={true}
                visible={modalVisible}
                onRequestClose={() => {
                    setModalVisible(!modalVisible);
                }}
            >
                <View style={styles.modalView}>
                    <Picker
                        selectedValue={selectedTeam}
                        onValueChange={(itemValue, itemIndex) => setSelectedTeam(itemValue)}
                        style={styles.picker}
                    >
                        {user.teams.map((teamId, index) => (
                            <Picker.Item key={index} label={`Team ${teamId}`} value={teamId} />
                        ))}
                    </Picker>
                    <Button title="Valider" onPress={confirmJoin} />
                </View>
            </Modal>
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
    modalView: {
        margin: 20,
        backgroundColor: "white",
        borderRadius: 20,
        padding: 35,
        alignItems: "center",
        shadowColor: "#000",
        shadowOffset: {
            width: 0,
            height: 2
        },
        shadowOpacity: 0.25,
        shadowRadius: 4,
        elevation: 5
    },
    picker: {
        width: 200,
        height: 44,
    },
    modalButton: {
        marginBottom: 10,
        padding: 10,
        backgroundColor: "#2196F3"
    },
});

export default TournamentDetailScreen;