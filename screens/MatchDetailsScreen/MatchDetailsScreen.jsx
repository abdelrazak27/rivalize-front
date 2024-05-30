import React, { useEffect, useState } from 'react';
import { Alert, View, Text, StyleSheet, Button, Modal, TouchableOpacity, TextInput, ScrollView, Image } from 'react-native';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '../../firebaseConfig';
import { useUser } from '../../context/UserContext';
import { Picker } from '@react-native-picker/picker';
import { SafeAreaView } from 'react-native-safe-area-context';
import globalStyles from '../../styles/globalStyles';
import { fonts } from '../../styles/fonts';
import colors from '../../styles/colors';
import Spacer from '../../components/Spacer';
import { LinearGradient } from 'expo-linear-gradient';
import { darkenColor } from '../../utils/colors';
import { Label, PrimaryColorText, Title } from '../../components/TextComponents';
import FunctionButton from '../../components/FunctionButton';
import CustomTextInput from '../../components/CustomTextInput';
import { getTeamName } from '../../utils/teams';
import SquareButtonIcon from '../../components/SquareButtonIcon';
import Foundation from 'react-native-vector-icons/Foundation';
import { useNavigation } from '@react-navigation/native';
import { useLoading } from '../../context/LoadingContext';

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
    const [winnerName, setWinnerName] = useState('');
    const [showPenaltyModal, setShowPenaltyModal] = useState(false);
    const [inputPenaltyScoreA, setInputPenaltyScoreA] = useState('');
    const [inputPenaltyScoreB, setInputPenaltyScoreB] = useState('');
    const [teamNames, setTeamNames] = useState({});
    const [teamLogos, setTeamLogos] = useState({ clubA: null, clubB: null });
    const { setIsLoading } = useLoading();

    const navigation = useNavigation();
    const { user } = useUser();

    const hasMatchStarted = (matchDate, matchTime) => {
        const now = new Date();

        const dateParts = matchDate.split('T')[0];
        const timeParts = matchTime.split('T')[1];

        const matchDateTimeString = `${dateParts}T${timeParts}`;
        const matchDateTime = new Date(matchDateTimeString);
        return now >= matchDateTime;
    };

    const requestPenaltyScores = () => {
        setInputPenaltyScoreA('');
        setInputPenaltyScoreB('');
        setShowPenaltyModal(true);
    };

    const canManageMatch = () => {
        return hasMatchStarted(matchDetails.date, matchDetails.time) && matchDetails.clubA && matchDetails.clubB;
    };

    const handlePenaltySubmission = () => {
        const penScoreA = parseInt(inputPenaltyScoreA);
        const penScoreB = parseInt(inputPenaltyScoreB);

        if (isNaN(penScoreA) || isNaN(penScoreB)) {
            Alert.alert("Entrée invalide", "Veuillez entrer des scores valides pour le résultat des tirs au but.");
            return;
        }

        const winnerClub = penScoreA > penScoreB ? clubA : clubB;
        updateMatchWinner(winnerClub, scoreA, scoreB, penScoreA, penScoreB);
        setShowPenaltyModal(false);
    };

    const handleEndMatch = async () => {
        if (scoreA > scoreB) {
            await updateMatchWinner(clubA, scoreA, scoreB);
        } else if (scoreB > scoreA) {
            await updateMatchWinner(clubB, scoreA, scoreB);
        } else {
            requestPenaltyScores();
        }
    };

    const updateMatchWinner = async (winnerClub, finalScoreA, finalScoreB, penScoreA = 0, penScoreB = 0) => {
        setIsLoading(true);
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

            const winnerClubName = await getTeamName(winnerClub);
            setWinnerName(winnerClubName);
            setWinner(winnerClub);

            await updateDoc(tournamentRef, {
                matches: tournamentData.matches
            });
            setIsLoading(false);

            if (penScoreA > 0 || penScoreB > 0) {
                Alert.alert("Match terminé", `${winnerClubName} remporte le match avec un score final de ${finalScoreA}-${finalScoreB} et un score de tirs au but de ${penScoreA}-${penScoreB}.`, [{ text: "OK" }]);
            } else {
                Alert.alert("Match terminé", `${winnerClubName} remporte le match avec un score final de ${finalScoreA}-${finalScoreB}.`, [{ text: "OK" }]);
            }

        } catch (error) {
            setIsLoading(false);
            console.error("Failed to update match details:", error);
            Alert.alert("Erreur", "Échec de la mise à jour des détails du match.", [{ text: "Réessayer" }]);
        }
    };

    const incrementScoreA = async () => {
        setIsLoading(true);
        const newScore = scoreA + 1;
        if (await updateScoresInFirestore(newScore, scoreB)) {
            setIsLoading(false);
            setScoreA(newScore);
        } else {
            setIsLoading(false);
        }
    };

    const decrementScoreA = async () => {
        setIsLoading(true);
        const newScore = scoreA > 0 ? scoreA - 1 : 0;
        if (await updateScoresInFirestore(newScore, scoreB)) {
            setIsLoading(false);
            setScoreA(newScore);
        } else {
            setIsLoading(false);
        }
    };

    const incrementScoreB = async () => {
        setIsLoading(true);
        const newScore = scoreB + 1;
        if (await updateScoresInFirestore(scoreA, newScore)) {
            setIsLoading(false);
            setScoreB(newScore);
        } else {
            setIsLoading(false);
        }
    };

    const decrementScoreB = async () => {
        setIsLoading(true);
        const newScore = scoreB > 0 ? scoreB - 1 : 0;
        if (await updateScoresInFirestore(scoreA, newScore)) {
            setIsLoading(false);
            setScoreB(newScore);
        } else {
            setIsLoading(false);
        }
    };

    const updateScoresInFirestore = async (newScoreA, newScoreB) => {
        setIsLoading(true);
        const tournamentRef = doc(db, 'tournois', tournamentId);
        try {
            const tournamentData = (await getDoc(tournamentRef)).data();
            tournamentData.matches[roundIndex].matches[matchIndex].scoreA = newScoreA;
            tournamentData.matches[roundIndex].matches[matchIndex].scoreB = newScoreB;

            await updateDoc(tournamentRef, {
                matches: tournamentData.matches
            });
            console.log("Scores updated successfully!");
            setIsLoading(false);
            return true;
        } catch (error) {
            setIsLoading(false);
            console.error("Failed to update scores:", error);
            Alert.alert("Erreur", "Échec de la mise à jour des scores.", [{ text: "Réessayer" }]);
            return false;
        }
    };

    const fetchTeamLogo = async (teamId) => {
        setIsLoading(true);
        const teamRef = doc(db, 'equipes', teamId);
        const teamDoc = await getDoc(teamRef);
        if (teamDoc.exists()) {
            setIsLoading(false);
            return teamDoc.data().logo_link;
        } else {
            setIsLoading(false);
            return null;
        }
    };

    useEffect(() => {
        const fetchMatchDetails = async () => {
            setIsLoading(true);
            const tournamentRef = doc(db, 'tournois', tournamentId);
            const tournamentSnap = await getDoc(tournamentRef);
            if (tournamentSnap.exists()) {
                const tournamentData = tournamentSnap.data();
                const rounds = tournamentData.matches;
                const match = rounds[roundIndex].matches[matchIndex];
                setMatchDetails(match);
                setTournamentDetails(tournamentData);
                setIsOwner(tournamentData.createdBy === user.uid);

                setWinner(match.winner);
                setClubA(match.clubA);
                setClubB(match.clubB);
                setScoreA(match.scoreA || 0);
                setScoreB(match.scoreB || 0);

                if (match.clubA) {
                    const logoA = await fetchTeamLogo(match.clubA);
                    setTeamLogos(prevState => ({ ...prevState, clubA: logoA }));
                }
                if (match.clubB) {
                    const logoB = await fetchTeamLogo(match.clubB);
                    setTeamLogos(prevState => ({ ...prevState, clubB: logoB }));
                }
                if (match.winner) {
                    const winnerClubName = await getTeamName(match.winner);
                    setWinnerName(winnerClubName);
                }
            }
            setIsLoading(false);
        };

        fetchMatchDetails();
    }, [roundIndex, matchIndex, tournamentId, user.uid]);

    useEffect(() => {
        const fetchTeamNames = async () => {
            if(tournamentDetails?.participatingClubs) {
                setIsLoading(true);
                const names = {};
                const participatingClubs = tournamentDetails.participatingClubs;
                for (const clubId of participatingClubs) {
                    names[clubId] = await getTeamName(clubId);
                }
                setIsLoading(false);
                setTeamNames(names);
            }
        };

        fetchTeamNames();
    }, [tournamentDetails]);

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
        if (clubA || clubB) {
            setIsLoading(true);
            const tournamentRef = doc(db, 'tournois', tournamentId);
            const tournamentSnap = await getDoc(tournamentRef);
            if (tournamentSnap.exists()) {
                const tournamentData = tournamentSnap.data();
    
                tournamentData.matches[roundIndex].matches[matchIndex] = {
                    ...tournamentData.matches[roundIndex].matches[matchIndex],
                    clubA: clubA || null,
                    clubB: clubB || null
                };
    
                try {
                    await updateDoc(tournamentRef, {
                        matches: tournamentData.matches
                    });
                    
                    const nameA = clubA ? await getTeamName(clubA) : null;
                    const nameB = clubB ? await getTeamName(clubB) : null;
                    const logoA = clubA ? await fetchTeamLogo(clubA) : null;
                    const logoB = clubB ? await fetchTeamLogo(clubB) : null;
                    
                    setTeamNames(prevNames => ({
                        ...prevNames,
                        ...(clubA && { [clubA]: nameA }),
                        ...(clubB && { [clubB]: nameB })
                    }));
                    setTeamLogos(prevLogos => ({
                        ...prevLogos,
                        ...(clubA && { clubA: logoA }),
                        ...(clubB && { clubB: logoB })
                    }));
                    setMatchDetails(prevDetails => ({
                        ...prevDetails,
                        clubA,
                        clubB
                    }));
    
                    setIsLoading(false);
                    Alert.alert("Succès", "Les détails du match ont été mis à jour avec succès.", [{ text: "OK" }]);
                } catch (error) {
                    setIsLoading(false);
                    console.error("Failed to update the match:", error);
                    Alert.alert("Erreur", "Échec de la mise à jour du match.", [{ text: "Réessayer" }]);
                }
            }
        } else {
            Alert.alert("Erreur", "Veuillez sélectionner au moins une équipe.");
        }
    };
    

    return (
        <SafeAreaView style={globalStyles.container}>
            <View style={{ height: 1, backgroundColor: colors.lightgrey, marginHorizontal: 30 }} />
            <ScrollView contentContainerStyle={globalStyles.scrollContainer}>
                {matchDetails && (
                    <>
                        <View style={styles.imageContainer}>
                            <Image
                                source={require('../../assets/images/tournament.png')}
                                style={styles.logo}
                            />
                        </View>
                        <Text style={styles.matchName}>Match  {matchIndex + 1}</Text>
                        <Text style={styles.matchDate}>{new Date(matchDetails.date).toLocaleDateString()}</Text>
                        <Text style={styles.matchDate}>{`${new Date(matchDetails.time).getHours()}h${new Date(matchDetails.time).getMinutes().toString().padStart(2, '0')}`}</Text>
                        <Spacer />
                        <LinearGradient
                            start={{ x: 0, y: 0.5 }}
                            end={{ x: 1, y: 0.5 }}
                            colors={[darkenColor(colors.primary, -20), colors.primary]}
                            locations={[0.3, 1]}
                            style={{ borderRadius: 10 }}
                        >
                            <View style={styles.matchContainer} onPress={() => handleMatchPress(roundIndex, matchIndex, match)}>
                                <View style={[styles.matchInfoContainerTop, (!matchDetails.clubA || !matchDetails.clubB) ? { paddingVertical: 10, alignItems: 'center' } : { alignItems: 'flex-end' }]}>
                                    <View style={styles.matchInfoClubLeft}>
                                        {!matchDetails.clubA ? (
                                            <Image
                                                source={require('../../assets/images/clubTeamEmpty.png')}
                                                style={styles.matchInfoClubImage}
                                            />
                                        ) : (
                                            <TouchableOpacity onPress={() => {
                                                navigation.navigate('TeamScreen', { teamId: matchDetails.clubA });
                                            }}>
                                                <Image
                                                    source={{ uri: teamLogos.clubA }}
                                                    style={styles.matchInfoClubImage}
                                                />
                                            </TouchableOpacity>
                                        )}
                                    </View>
                                    <View>
                                        {hasMatchStarted(matchDetails.date, matchDetails.time) ? (
                                            <Text style={styles.scoreCountText}>{scoreA} : {scoreB}</Text>
                                        ) : (
                                            <Text style={styles.vsText}>VS</Text>
                                        )}
                                    </View>
                                    <View style={styles.matchInfoClubRight}>
                                        {!matchDetails.clubB ? (
                                            <Image
                                                source={require('../../assets/images/clubTeamEmpty.png')}
                                                style={styles.matchInfoClubImage}
                                            />
                                        ) : (
                                            <TouchableOpacity onPress={() => {
                                                navigation.navigate('TeamScreen', { teamId: matchDetails.clubB });
                                            }}>
                                                <Image
                                                    source={{ uri: teamLogos.clubB }}
                                                    style={styles.matchInfoClubImage}
                                                />
                                            </TouchableOpacity>
                                        )}
                                    </View>
                                </View>
                                {(matchDetails.clubA || matchDetails.clubB) && (
                                    <View style={styles.matchInfoContainerBottom}>
                                        <TouchableOpacity onPress={() => {
                                            navigation.navigate('TeamScreen', { teamId: matchDetails.clubA });
                                        }}>
                                            <Text style={styles.matchInfoContainerBottomText}>{teamNames[clubA]}</Text>
                                        </TouchableOpacity>
                                        {(matchDetails.penaltyScoreA > 0 || matchDetails.penaltyScoreB > 0) && (
                                            <Text style={styles.penaltiesScore}>({matchDetails.penaltyScoreA} : {matchDetails.penaltyScoreB})</Text>
                                        )}
                                        <TouchableOpacity onPress={() => {
                                            navigation.navigate('TeamScreen', { teamId: matchDetails.clubB });
                                        }}>
                                            <Text style={styles.matchInfoContainerBottomText}>{teamNames[clubB]}</Text>
                                        </TouchableOpacity>
                                    </View>
                                )}
                            </View>
                        </LinearGradient>

                        {winner && (
                            <View style={{ paddingTop: 25, gap: 10 }}>
                                <Text style={styles.victoryText}>Victoire pour {winnerName}</Text>
                                <Text style={[styles.victoryText, { color: colors.secondary }]}>Pour éviter toute tricherie, le match n'est plus modifiable. Contactez un administrateur en cas d'erreur.</Text>
                            </View>
                        )}

                        {isOwner && !winner && (
                            <>
                                {canManageMatch() ? (
                                    <>
                                        <View style={{ flexDirection: 'row', gap: 10, paddingVertical: 10, justifyContent: 'space-between', alignItems: 'center' }}>
                                            <View style={{ flexDirection: 'row', gap: 10 }}>
                                                <SquareButtonIcon
                                                    onPress={incrementScoreA}
                                                    IconComponent={Foundation}
                                                    iconName="plus"
                                                    iconSize={19}
                                                    isFocused={clubA}
                                                    disabled={!clubA}
                                                    iconColor={colors.primary}
                                                    height={40}
                                                    width={40}
                                                />
                                                <SquareButtonIcon
                                                    onPress={decrementScoreA}
                                                    IconComponent={Foundation}
                                                    iconName="minus"
                                                    iconSize={19}
                                                    isFocused={clubA || scoreA !== 0}
                                                    disabled={!clubA || scoreA === 0}
                                                    iconColor={colors.primary}
                                                    height={40}
                                                    width={40}
                                                />
                                            </View>
                                            <Text style={styles.scoreText}>SCORE</Text>
                                            <View style={{ flexDirection: 'row', gap: 10 }}>
                                                <SquareButtonIcon
                                                    onPress={incrementScoreB}
                                                    IconComponent={Foundation}
                                                    iconName="plus"
                                                    iconSize={19}
                                                    isFocused={clubA}
                                                    disabled={!clubA}
                                                    iconColor={colors.primary}
                                                    height={40}
                                                    width={40}
                                                />
                                                <SquareButtonIcon
                                                    onPress={decrementScoreB}
                                                    IconComponent={Foundation}
                                                    iconName="minus"
                                                    iconSize={19}
                                                    isFocused={clubB || scoreB !== 0}
                                                    disabled={!clubB || scoreB === 0}
                                                    iconColor={colors.primary}
                                                    height={40}
                                                    width={40}
                                                />
                                            </View>
                                        </View>
                                        <FunctionButton
                                            title="Terminer le match"
                                            onPress={handleEndMatch}
                                            disabled={!(clubA && clubB)}
                                        />
                                    </>
                                ) : (
                                    <Text style={styles.infoText}>
                                        Veuillez enregistrer deux clubs et attendre le début du match pour pouvoir le gérer.
                                    </Text>
                                )}
                                <Spacer />
                                <Label>Mise à jour des clubs</Label>
                                {(matchDetails.clubA || matchDetails.clubB) && (
                                    <Text style={styles.infoText}>
                                        Il n'est pas possible de modifier un club après que le match ait débuté.
                                    </Text>
                                )}
                                {(!canManageMatch() || !matchDetails.clubA || !matchDetails.clubB) && (
                                    <>
                                        <View style={{ flexDirection: 'row', gap: 10, paddingTop: 10 }}>
                                            <View style={{ flex: 1 }}>
                                                <FunctionButton
                                                    title={!matchDetails.clubA ? "Ajouter le club A" : "Modifier le club A"}
                                                    onPress={() => openModal('A')}
                                                    disabled={!!matchDetails.clubA && hasMatchStarted(matchDetails.date, matchDetails.time)}
                                                />
                                            </View>
                                            <View style={{ flex: 1 }}>
                                                <FunctionButton
                                                    title={!matchDetails.clubB ? "Ajouter le club B" : "Modifier le club B"}
                                                    onPress={() => openModal('B')}
                                                    disabled={!!matchDetails.clubB && hasMatchStarted(matchDetails.date, matchDetails.time)}
                                                />
                                            </View>
                                        </View>
                                        <View style={{ paddingVertical: 20, gap: 10 }}>
                                            <CustomTextInput
                                                label="Club A choisi"
                                                value={teamNames[clubA] ? teamNames[clubA] : "N/A"}
                                                readOnly
                                            />
                                            <CustomTextInput
                                                label="Club B choisi"
                                                value={teamNames[clubB] ? teamNames[clubB] : "N/A"}
                                                readOnly
                                            />
                                            <FunctionButton
                                                title="Sauvegarder"
                                                onPress={saveClubSelection}
                                                disabled={!(clubA || clubB)}
                                            />
                                        </View>
                                    </>
                                )}
                                <Modal
                                    animationType="slide"
                                    transparent={true}
                                    visible={showModal}
                                    onRequestClose={() => setShowModal(false)}
                                >
                                    <View style={globalStyles.modal}>
                                        <SafeAreaView style={globalStyles.container}>
                                            <View style={globalStyles.headerContainer}>
                                                <Title>Choisissez <PrimaryColorText>le club {selectingFor}</PrimaryColorText>,</Title>
                                            </View>

                                            <ScrollView
                                                contentContainerStyle={globalStyles.scrollContainer}
                                            >
                                                <Picker
                                                    selectedValue={selectedClub}
                                                    onValueChange={(itemValue) => setSelectedClub(itemValue)}
                                                >
                                                    <Picker.Item label="Choisir un club" value="" />
                                                    {tournamentDetails?.participatingClubs
                                                        ?.filter(clubId => clubId !== (selectingFor === 'A' ? clubB : clubA))
                                                        .map(clubId => (
                                                            <Picker.Item key={clubId} label={teamNames[clubId]} value={clubId} />
                                                        ))}
                                                </Picker>
                                            </ScrollView>
                                        </SafeAreaView>
                                        <View style={{ paddingHorizontal: 30, gap: 8, paddingBottom: 30 }}>
                                            <FunctionButton title="Valider" onPress={handleValidation} />
                                            <FunctionButton title="Annuler" onPress={() => setShowModal(false)} variant='primaryOutline' />
                                        </View>
                                    </View>
                                </Modal>

                                <Modal
                                    visible={showPenaltyModal}
                                    animationType="slide"
                                    transparent={true}
                                    onRequestClose={() => setShowPenaltyModal(false)}
                                >
                                    <View style={globalStyles.modal}>
                                        <SafeAreaView style={globalStyles.container}>
                                            <View style={globalStyles.headerContainer}>
                                                <Title>Indiquez les <PrimaryColorText>scores de tirs au but</PrimaryColorText>,</Title>
                                            </View>
                                            <ScrollView
                                                contentContainerStyle={globalStyles.scrollContainer}
                                            >
                                                <View style={{ gap: 10 }}>
                                                    <CustomTextInput
                                                        label="SCORE A"
                                                        placeholder="0"
                                                        value={inputPenaltyScoreA}
                                                        onChangeText={setInputPenaltyScoreA}
                                                        keyboardType="numeric"
                                                    />
                                                    <CustomTextInput
                                                        label="SCORE B"
                                                        placeholder="0"
                                                        value={inputPenaltyScoreB}
                                                        onChangeText={setInputPenaltyScoreB}
                                                        keyboardType="numeric"
                                                    />
                                                </View>
                                            </ScrollView>
                                        </SafeAreaView>
                                        <View style={{ paddingHorizontal: 30, gap: 8, paddingBottom: 30 }}>
                                            <FunctionButton title="Soumettre les scores" onPress={handlePenaltySubmission} />
                                            <FunctionButton title="Annuler" onPress={() => setShowPenaltyModal(false)} variant='primaryOutline' />
                                        </View>
                                    </View>
                                </Modal>
                            </>
                        )}
                    </>
                )}
            </ScrollView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    imageContainer: {
        alignItems: 'center',
        marginTop: 20
    },
    logo: {
        width: 150,
        height: 150,
        resizeMode: 'contain',
        borderRadius: 10,
    },
    matchName: {
        textTransform: 'uppercase',
        color: colors.primary,
        fontSize: 25,
        fontFamily: fonts.OutfitBold,
        textAlign: 'center'
    },
    matchDate: {
        fontFamily: fonts.OutfitBold,
        fontSize: 15,
        color: colors.secondary,
        textAlign: 'center'
    },
    matchContainer: {
        paddingVertical: 15,
        paddingHorizontal: 20,
        borderRadius: 10,
    },
    matchInfoContainerTop: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    matchInfoClubImage: {
        width: 50,
        height: 50,
        resizeMode: 'contain',
        borderRadius: 10,
    },
    matchInfoClubLeft: {
        paddingHorizontal: 10
    },
    matchInfoClubRight: {
        paddingHorizontal: 10
    },
    matchInfoContainerBottom: {
        flexDirection: 'row',
        gap: 20,
        justifyContent: 'space-between'
    },
    matchInfoContainerBottomText: {
        flexWrap: 'wrap',
        fontSize: 14,
        color: 'white',
        fontFamily: fonts.OutfitBold,
        paddingTop: 10,
        paddingHorizontal: 10,
    },
    vsText: {
        textAlign: 'center',
        color: "white",
        fontFamily: fonts.OutfitBold,
        textTransform: 'uppercase',
        fontSize: 30
    },
    victoryText: {
        fontSize: 16,
        fontFamily: fonts.OutfitBold,
        color: colors.primary,
        textAlign: 'center',
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
    scoreText: {
        color: colors.primary,
        fontFamily: fonts.OutfitBold,
        fontSize: 28
    },
    scoreCountText: {
        color: 'white',
        fontFamily: fonts.OutfitBold,
        fontSize: 28
    },
    penaltiesScore: {
        color: colors.lightgrey,
        fontSize: 14,
        fontFamily: fonts.OutfitBold
    },
    infoText: {
        color: colors.secondary,
        fontFamily: fonts.OutfitSemiBold,
        fontSize: 16,
        textAlign: 'center',
        paddingVertical: 10,
    },
});

export default MatchDetailsScreen;
