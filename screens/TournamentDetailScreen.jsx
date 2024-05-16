import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Alert, ScrollView, Modal, Button, TouchableWithoutFeedback, TouchableOpacity } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { arrayUnion, doc, getDoc, increment, updateDoc } from 'firebase/firestore';
import { db } from '../firebaseConfig';
import { useUser } from '../context/UserContext';
import FunctionButton from '../components/FunctionButton';

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
            const clubDetails = await fetchClubsDetails(data.participatingClubs || []);
            setTournament({ ...data, clubDetails });
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

    const isTournamentStarted = () => {
        const startDate = new Date(tournament.startDate);
        const currentDate = new Date();
        return currentDate > startDate;
    };

    const fetchClubsDetails = async (clubIds) => {
        const clubDetails = [];
        for (const id of clubIds) {
            const docRef = doc(db, 'equipes', id);
            const docSnap = await getDoc(docRef);
            if (docSnap.exists()) {
                clubDetails.push({ id: docSnap.id, ...docSnap.data() });
            } else {
                console.log('Aucun club trouvé avec l\'id :', id);
            }
        }
        return clubDetails;
    };

    const confirmJoin = async () => {
        if (!selectedTeam) {
            Alert.alert('Erreur', 'Aucune équipe sélectionnée');
            return;
        }

        try {
            const teamRef = doc(db, 'equipes', selectedTeam);
            const teamSnap = await getDoc(teamRef);

            if (!teamSnap.exists()) {
                Alert.alert('Erreur', 'Équipe non trouvée');
                return;
            }

            const teamData = teamSnap.data();

            // Assez de joueurs ?
            if (teamData.players.length < tournament.playersPerTeam) {
                Alert.alert('Erreur', `L'équipe doit avoir au moins ${tournament.playersPerTeam} joueurs.`);
                return;
            }

            // Catégorie ?
            const teamCategory = teamData.category;

            if (teamCategory !== tournament.category) {
                Alert.alert('Erreur', 'La catégorie ou le genre de l\'équipe ne correspond pas à celui du tournoi.');
                return;
            }

            // Place disponible ?
            if (tournament.availableSlots <= 0) {
                Alert.alert('Erreur', 'Aucune place disponible pour le tournoi.');
                return;
            }

            // Déjà participant ?
            if (tournament.participatingClubs?.includes(selectedTeam)) {
                Alert.alert('Erreur', 'Cette équipe participe déjà au tournoi.');
                return;
            }

            const tournamentRef = doc(db, 'tournois', tournamentId);
            await updateDoc(tournamentRef, {
                participatingClubs: arrayUnion(selectedTeam),
                availableSlots: increment(-1),
            });


            Alert.alert('Succès', 'Votre équipe a rejoint le tournoi!');
            console.log('Joining tournament with team ID:', selectedTeam);
            setModalVisible(false);
            fetchTournament();
        } catch (error) {
            console.error('Erreur lors de la tentative de rejoindre le tournoi:', error);
            Alert.alert('Erreur', 'Une erreur est survenue lors de la tentative de rejoindre le tournoi.');
        }
    };

    const handleClubPress = (clubId) => {
        navigation.navigate('TeamScreen', { teamId: clubId });
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
            <Text style={styles.title}>Clubs participants :</Text>
            {tournament.clubDetails ? tournament.clubDetails.map(club => (
                <TouchableOpacity key={club.id} style={styles.clubItem} onPress={() => handleClubPress(club.id)}>
                    <Text>{club.name}</Text>
                </TouchableOpacity>
            )) : (
                <Text>Aucun club ne participent actuellement au tournoi</Text>
            )}
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
            {user.accountType === 'coach' && !isTournamentStarted() && tournament.availableSlots > 0 && (
                <>
                    {user.teams.length > 0 ? (
                        <>
                            <FunctionButton
                                title="Rejoindre le tournoi"
                                onPress={() => setModalVisible(true)}
                            />
                            <Modal
                                animationType="slide"
                                transparent={true}
                                visible={modalVisible}
                                onRequestClose={() => {
                                    setModalVisible(!modalVisible);
                                }}
                            >
                                <TouchableWithoutFeedback onPress={() => setModalVisible(false)}>
                                    <View style={styles.modalOverlay}>
                                        <TouchableWithoutFeedback onPress={() => { }}>
                                            <View style={styles.modalView}>
                                                <Picker
                                                    selectedValue={selectedTeam}
                                                    onValueChange={(itemValue) => setSelectedTeam(itemValue)}
                                                    style={styles.picker}
                                                >
                                                    <Picker.Item label="Sélectionner un club" value="nullKey" />
                                                    {user.teams.filter(teamId => !tournament.participatingClubs?.includes(teamId)).map((teamId, index) => (
                                                        <Picker.Item key={index} label={`Team ${teamId}`} value={teamId} />
                                                    ))}
                                                </Picker>
                                                <Text>Si votre équipe n'apparaît pas c'est qu'elle participe déjà au tournoi !</Text>
                                                <Button title="Valider" onPress={confirmJoin} />
                                                <Button title="Fermer" onPress={() => setModalVisible(false)} />
                                            </View>
                                        </TouchableWithoutFeedback>
                                    </View>
                                </TouchableWithoutFeedback>
                            </Modal>
                        </>
                    ) : (
                        <Text>Vous n'avez pas d'équipe.</Text>
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
    clubItem: {
        padding: 10,
        borderBottomWidth: 1,
        borderBottomColor: '#ddd',
    }
});

export default TournamentDetailScreen;