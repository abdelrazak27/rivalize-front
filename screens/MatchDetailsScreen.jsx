import React, { useEffect, useState } from 'react';
import { Alert, View, Text, StyleSheet, Button, Modal, TouchableOpacity, TextInput } from 'react-native';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '../firebaseConfig';
import { useUser } from '../context/UserContext';
import { Picker } from '@react-native-picker/picker';

const MatchDetailsScreen = ({ route }) => {
    const { roundIndex, matchIndex, tournamentId } = route.params;
    const [matchDetails, setMatchDetails] = useState(null);
    const [tournamentDetails, setTournamentDetails] = useState([]);
    const [isOwner, setIsOwner] = useState(false);
    const [clubA, setClubA] = useState('');
    const [clubB, setClubB] = useState('');
    const [selectedClub, setSelectedClub] = useState('');
    const [showModal, setShowModal] = useState(false);
    const [selectingFor, setSelectingFor] = useState(null);
    const [scoreA, setScoreA] = useState(0);
    const [scoreB, setScoreB] = useState(0);
    const [winner, setWinner] = useState('');
    const [showPenaltyModal, setShowPenaltyModal] = useState(false);
    const [inputPenaltyScoreA, setInputPenaltyScoreA] = useState('');
    const [inputPenaltyScoreB, setInputPenaltyScoreB] = useState('');

    const { user } = useUser();

    const requestPenaltyScores = () => {
        setInputPenaltyScoreA('');
        setInputPenaltyScoreB('');
        setShowPenaltyModal(true);
    };

    const handlePenaltySubmission = () => {
        const penScoreA = parseInt(inputPenaltyScoreA);
        const penScoreB = parseInt(inputPenaltyScoreB);
    
        if (isNaN(penScoreA) || isNaN(penScoreB)) {
            Alert.alert("Entrée invalide", "Veuillez entrer des scores valides pour les pénalités.");
            return;
        }
    
        const winnerClub = penScoreA > penScoreB ? clubA : clubB;
        setWinner(winnerClub);
        updateMatchWinner(winnerClub, scoreA, scoreB, penScoreA, penScoreB);
        setShowPenaltyModal(false);
    };


    const handleEndMatch = async () => {
        if (scoreA > scoreB) {
            setWinner(clubA);
            await updateMatchWinner(clubA, scoreA, scoreB);
        } else if (scoreB > scoreA) {
            setWinner(clubB);
            await updateMatchWinner(clubB, scoreA, scoreB);
        } else {
            requestPenaltyScores();
        }
    };

    const updateMatchWinner = async (winnerClub, finalScoreA, finalScoreB, penScoreA = 0, penScoreB = 0) => {
        const tournamentRef = doc(db, 'tournois', tournamentId);
        try {
            const tournamentData = (await getDoc(tournamentRef)).data();
            tournamentData.matches[roundIndex].matches[matchIndex] = {
                ...tournamentData.matches[roundIndex].matches[matchIndex],
                winner: winnerClub,
                scoreA: finalScoreA,
                scoreB: finalScoreB,
                penaltyScoreA: penScoreA,
                penaltyScoreB: penScoreB
            };
    
            await updateDoc(tournamentRef, {
                matches: tournamentData.matches
            });
            Alert.alert("Match terminé", `Le vainqueur est ${winnerClub} avec un score final de ${finalScoreA}-${finalScoreB} et un score de pénalité de ${penScoreA}-${penScoreB}.`, [{ text: "OK" }]);
        } catch (error) {
            console.error("Failed to update match details:", error);
            Alert.alert("Erreur", "Échec de la mise à jour des détails du match.", [{ text: "Réessayer" }]);
        }
    };

    const incrementScoreA = async () => {
        const newScore = scoreA + 1;
        if (await updateScoresInFirestore(newScore, scoreB)) {
            setScoreA(newScore);
        }
    };

    const decrementScoreA = async () => {
        const newScore = scoreA > 0 ? scoreA - 1 : 0;
        if (await updateScoresInFirestore(newScore, scoreB)) {
            setScoreA(newScore);
        }
    };

    const incrementScoreB = async () => {
        const newScore = scoreB + 1;
        if (await updateScoresInFirestore(scoreA, newScore)) {
            setScoreB(newScore);
        }
    };

    const decrementScoreB = async () => {
        const newScore = scoreB > 0 ? scoreB - 1 : 0;
        if (await updateScoresInFirestore(scoreA, newScore)) {
            setScoreB(newScore);
        }
    };

    const updateScoresInFirestore = async (newScoreA, newScoreB) => {
        const tournamentRef = doc(db, 'tournois', tournamentId);
        try {
            const tournamentData = (await getDoc(tournamentRef)).data();
            tournamentData.matches[roundIndex].matches[matchIndex].scoreA = newScoreA;
            tournamentData.matches[roundIndex].matches[matchIndex].scoreB = newScoreB;

            await updateDoc(tournamentRef, {
                matches: tournamentData.matches
            });
            console.log("Scores updated successfully!");
            return true;
        } catch (error) {
            console.error("Failed to update scores:", error);
            Alert.alert("Erreur", "Échec de la mise à jour des scores.", [{ text: "Réessayer" }]);
            return false;
        }
    };


    useEffect(() => {
        const fetchMatchDetails = async () => {
            const tournamentRef = doc(db, 'tournois', tournamentId);
            const tournamentSnap = await getDoc(tournamentRef);
            if (tournamentSnap.exists()) {
                const tournamentData = tournamentSnap.data();
                const rounds = tournamentData.matches;
                const match = rounds[roundIndex].matches[matchIndex];
                setMatchDetails(match);
                setTournamentDetails(tournamentData);
                setIsOwner(tournamentData.createdBy === user.uid);

                setWinner(match.winner || '');
                setClubA(match.clubA || '');
                setClubB(match.clubB || '');
                setScoreA(match.scoreA || 0);
                setScoreB(match.scoreB || 0);
            }
        };

        fetchMatchDetails();
    }, [roundIndex, matchIndex, tournamentId, user.uid]);


    const openModal = (team) => {
        setSelectingFor(team);
        setSelectedClub(team === 'A' ? clubA : clubB);
        setShowModal(true);
    };

    const handleValidation = () => {
        if (selectingFor === 'A') {
            setClubA(selectedClub);
        } else {
            setClubB(selectedClub);
        }
        setShowModal(false);
    };

    const saveClubSelection = async () => {
        if (clubA && clubB) {
            const tournamentRef = doc(db, 'tournois', tournamentId);
            const tournamentSnap = await getDoc(tournamentRef);
            if (tournamentSnap.exists()) {
                const tournamentData = tournamentSnap.data();

                tournamentData.matches[roundIndex].matches[matchIndex] = {
                    ...tournamentData.matches[roundIndex].matches[matchIndex],
                    clubA: clubA,
                    clubB: clubB
                };

                try {
                    await updateDoc(tournamentRef, {
                        matches: tournamentData.matches
                    });
                    Alert.alert("Succès", "Les détails du match, y compris les scores, ont été mis à jour avec succès.", [{ text: "OK" }]);
                } catch (error) {
                    console.error("Failed to update the match:", error);
                    Alert.alert("Erreur", "Échec de la mise à jour des détails du match.", [{ text: "Réessayer" }]);
                }
            }
        }
    };


    return (
        <View style={styles.container}>
            {matchDetails ? (
                <>
                    <Text>Date du match: {new Date(matchDetails.date).toLocaleDateString()}</Text>
                    <Text>Heure du match: {new Date(matchDetails.time).toLocaleTimeString()}</Text>
                    <Text>Équipes A : {matchDetails.clubA}</Text>
                    <Text>Équipes B : {matchDetails.clubB}</Text>
                    {winner && (
                        <View>
                            <Text>Vainqueur : {winner}</Text>
                            <Text>Pour éviter toute tricherie, le match n'est plus modifiable. Contactez un administrateur en cas d'erreur.</Text>
                        </View>
                    )}
                    {isOwner && !winner && (
                        <>
                            <Button title="Ajouter Club A" onPress={() => openModal('A')} />
                            <Button title="Ajouter Club B" onPress={() => openModal('B')} />
                            <Text>Club A choisi : {clubA}</Text>
                            <Text>Club B choisi : {clubB}</Text>
                            <Button title="Sauvegarder les clubs" onPress={saveClubSelection} disabled={!(clubA && clubB)} />
                            <View>
                                <Text>Score de l'équipe A : {scoreA}</Text>
                                <Button title="Ajouter Point A" onPress={incrementScoreA} disabled={!clubA} />
                                <Button title="Annuler Point A" onPress={decrementScoreA} disabled={!clubA || scoreA === 0} />

                                <Text>Score de l'équipe B : {scoreB}</Text>
                                <Button title="Ajouter Point B" onPress={incrementScoreB} disabled={!clubB} />
                                <Button title="Annuler Point B" onPress={decrementScoreB} disabled={!clubB || scoreB === 0} />
                            </View>
                            <Button title="Terminer le Match" onPress={handleEndMatch} disabled={!(clubA && clubB)} />
                            <Modal
                                animationType="slide"
                                transparent={true}
                                visible={showModal}
                                onRequestClose={() => setShowModal(false)}
                            >
                                <View style={styles.modalView}>
                                    <Text style={styles.modalText}>Choisir Club {selectingFor}</Text>
                                    <Picker
                                        selectedValue={selectedClub}
                                        onValueChange={(itemValue) => setSelectedClub(itemValue)}
                                        style={styles.picker}
                                    >
                                        {tournamentDetails?.participatingClubs?.map(clubId => (
                                            <Picker.Item key={clubId} label={clubId} value={clubId} />
                                        ))}
                                    </Picker>
                                    <View style={styles.buttonRow}>
                                        <TouchableOpacity
                                            style={styles.button}
                                            onPress={handleValidation}
                                        >
                                            <Text style={styles.textStyle}>Valider</Text>
                                        </TouchableOpacity>
                                        <TouchableOpacity
                                            style={styles.button}
                                            onPress={() => setShowModal(false)}
                                        >
                                            <Text style={styles.textStyle}>Annuler</Text>
                                        </TouchableOpacity>
                                    </View>
                                </View>
                            </Modal>
                            <Modal
                                visible={showPenaltyModal}
                                animationType="slide"
                                transparent={true}
                                onRequestClose={() => setShowPenaltyModal(false)}
                            >
                                <View style={styles.modalView}>
                                    <Text style={styles.modalText}>Entrez les scores de pénalty</Text>
                                    <TextInput
                                        style={styles.input}
                                        onChangeText={setInputPenaltyScoreA}
                                        value={inputPenaltyScoreA}
                                        placeholder="Score A"
                                        keyboardType="numeric"
                                    />
                                    <TextInput
                                        style={styles.input}
                                        onChangeText={setInputPenaltyScoreB}
                                        value={inputPenaltyScoreB}
                                        placeholder="Score B"
                                        keyboardType="numeric"
                                    />
                                    <Button
                                        title="Soumettre les scores"
                                        onPress={handlePenaltySubmission}
                                    />
                                </View>
                            </Modal>

                        </>
                    )}
                </>
            ) : (
                <Text>Chargement des détails du match...</Text>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 20,
        justifyContent: 'center',
        alignItems: 'center'
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
    modalText: {
        marginBottom: 15,
        textAlign: "center"
    },
    buttonRow: {
        flexDirection: 'row',
        marginTop: 10
    },
    button: {
        backgroundColor: "#2196F3",
        borderRadius: 20,
        padding: 10,
        marginHorizontal: 5,
        elevation: 2
    },
    textStyle: {
        color: "white",
        fontWeight: "bold",
        textAlign: "center"
    },
    picker: {
        width: 150,
        height: 180,
    },
    input: {
        height: 40,
        margin: 12,
        borderWidth: 1,
        padding: 10,
        backgroundColor: 'white',
        borderRadius: 5
    },

});

export default MatchDetailsScreen;