import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Alert, ScrollView, Modal, Button, TouchableWithoutFeedback, TouchableOpacity, Image } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { arrayUnion, doc, getDoc, increment, updateDoc } from 'firebase/firestore';
import { db } from '../firebaseConfig';
import { useUser } from '../context/UserContext';
import FunctionButton from '../components/FunctionButton';
import RedirectLinkButton from '../components/RedirectLinkButton';
import globalStyles from '../styles/globalStyles';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import colors from '../styles/colors';
import { fonts } from '../styles/fonts';
import Spacer from '../components/Spacer';
import { Label, PrimaryColorText, Subtitle, Title } from '../components/TextComponents';
import FontAwesome6 from 'react-native-vector-icons/FontAwesome6';
import FontAwesome5 from 'react-native-vector-icons/FontAwesome5';
import FontAwesome from 'react-native-vector-icons/FontAwesome';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { LinearGradient } from 'expo-linear-gradient';
import { darkenColor } from '../utils/colors';
import CustomList from '../components/CustomList';
import ItemList from '../components/ItemList';
import { BlurView } from 'expo-blur';
import { getTeamName } from '../utils/teams';

const TournamentDetailScreen = ({ route, navigation }) => {
    const { user } = useUser();
    const { tournamentId, refresh } = route.params;
    const [tournament, setTournament] = useState(null);
    const [modalVisible, setModalVisible] = useState(false);
    const [selectedTeam, setSelectedTeam] = useState(null);
    const [teamNamesModal, setTeamNamesModal] = useState({});
    const insets = useSafeAreaInsets();

    const fetchTeamNamesModal = async (teamIds) => {
        const names = {};
        for (const teamId of teamIds) {
            const name = await getTeamName(teamId);
            if (name) {
                names[teamId] = name;
            }
        }
        setTeamNamesModal(names);
    };


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

    useEffect(() => {
        if (user.teams.length > 0) {
            fetchTeamNamesModal(user.teams);
        }
    }, [user.teams]);


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
            const tournamentSnap = await getDoc(tournamentRef);
            const currentAvailableSlots = tournamentSnap.data().availableSlots;

            await updateDoc(tournamentRef, {
                participatingClubs: arrayUnion(selectedTeam),
                availableSlots: currentAvailableSlots - 1,
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

    // FOR TESTS
    // TODO : à retirer pour version finale
    const confirmJoinForce = async () => {
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

            const tournamentRef = doc(db, 'tournois', tournamentId);
            const tournamentSnap = await getDoc(tournamentRef);
            const currentAvailableSlots = tournamentSnap.data().availableSlots;

            await updateDoc(tournamentRef, {
                participatingClubs: arrayUnion(selectedTeam),
                availableSlots: currentAvailableSlots - 1,
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

    const handleMatchPress = (roundIndex, matchIndex, match) => {
        navigation.navigate('MatchDetailsScreen', {
            roundIndex: roundIndex,
            matchIndex: matchIndex,
            matchId: match.matchId,
            matchDate: match.date,
            matchTime: match.time,
            tournamentId: tournamentId
        });
    };

    return (
        <SafeAreaView style={globalStyles.container}>
            <View style={{ height: 1, backgroundColor: colors.lightgrey, marginHorizontal: 30 }} />
            <ScrollView contentContainerStyle={globalStyles.scrollContainer}>
                <View style={styles.imageContainer}>
                    <Image
                        source={require('../assets/tournament.png')}
                        style={styles.logo}
                    />
                </View>
                <Text style={styles.tournamentName}>{tournament.name}</Text>
                <Text style={styles.tournamentPlaces}>Place(s) disponible(s) : {tournament.availableSlots}</Text>
                {/* TODO : uniquement les coachs participants */}
                <View style={{ paddingTop: 20 }}>
                    <RedirectLinkButton
                        routeName="ChatScreen"
                        title="Conversation du tournoi"
                        params={{ tournamentId: tournament.id }}
                    />
                </View>
                <Spacer />

                <Label>Informations du tournoi</Label>
                <View style={styles.teamInfoContainer}>
                    <View style={styles.teamInfoItemContainer}>
                        <View style={{ width: 40, alignItems: 'center' }}>
                            <FontAwesome6 name="users-rectangle" size={24} color={colors.darkgrey} />
                        </View>
                        <Text style={styles.teamInfoItemText}>{tournament.category}</Text>
                    </View>
                    <View style={styles.teamInfoItemContainer}>
                        <View style={{ width: 40, alignItems: 'center' }}>
                            <FontAwesome name={tournament.gender === 'F' ? 'female' : 'male'} size={24} color={colors.darkgrey} />
                        </View>
                        <Text style={styles.teamInfoItemText}>{tournament.gender === 'F' ? 'Féminin' : 'Masculin'}</Text>
                    </View>
                    <View style={styles.teamInfoItemContainer}>
                        <View style={{ width: 40, alignItems: 'center' }}>
                            <FontAwesome6 name="location-dot" size={24} color={colors.darkgrey} />
                        </View>
                        <Text style={styles.teamInfoItemText}>
                            {tournament.place && `${tournament.place.charAt(0).toUpperCase()}${tournament.place.slice(1).toLowerCase()}, France`}
                        </Text>
                    </View>
                    <View style={styles.teamInfoItemContainer}>
                        <View style={{ width: 40, alignItems: 'center' }}>
                            <FontAwesome5 name="handshake" size={24} color={colors.darkgrey} />
                        </View>
                        <Text style={styles.teamInfoItemText}>{tournament.playersPerTeam} contre {tournament.playersPerTeam}</Text>
                    </View>
                    <View style={styles.teamInfoItemContainer}>
                        <View style={{ width: 40, alignItems: 'center' }}>
                            <FontAwesome6 name="stopwatch" size={24} color={colors.darkgrey} />
                        </View>
                        <Text style={styles.teamInfoItemText}>{tournament.gameDuration} par match</Text>
                    </View>
                    <View style={styles.teamInfoItemContainer}>
                        <View style={{ width: 40, alignItems: 'center' }}>
                            <FontAwesome6 name="sitemap" size={24} color={colors.darkgrey} />
                        </View>
                        <Text style={styles.teamInfoItemText}>{tournament.returnMatches ? 'Avec matchs retour' : 'Sans matchs retour'}</Text>
                    </View>
                    <View style={styles.teamInfoItemContainer}>
                        <View style={{ width: 40, alignItems: 'center' }}>
                            <FontAwesome6 name="calendar-week" size={24} color={colors.darkgrey} />
                        </View>
                        <Text style={styles.teamInfoItemText}>Du {new Date(tournament.startDate).toLocaleDateString()} au {new Date(tournament.endDate).toLocaleDateString()}</Text>
                    </View>
                </View>
                <Spacer />
                <View style={styles.matchsContainer}>
                    <Text style={styles.matchsTitle}>Match du tournois</Text>
                </View>

                {tournament.matches.map((round, roundIndex) => (
                    <View key={roundIndex} style={styles.roundContainer}>
                        <Text style={styles.roundTitle}>{round.phase}</Text>
                        {round.matches.map((match, matchIndex) => (
                            <LinearGradient
                                key={matchIndex}
                                start={{ x: 0, y: 0.5 }}
                                end={{ x: 1, y: 0.5 }}
                                colors={[darkenColor(colors.primary, -20), colors.primary]}
                                locations={[0.3, 1]}
                                style={{ borderRadius: 10 }}
                            >
                                {/* todo, faire en fonction de s'il y a un club choisi pour cette équipe ou non */}
                                {/* todo, le score si y a un score */}
                                <TouchableOpacity style={styles.matchContainer} onPress={() => handleMatchPress(roundIndex, matchIndex, match)}>
                                    <View style={styles.matchInfoContainerTop}>
                                        <View style={styles.matchInfoClubLeft}>
                                            <Image
                                                source={require('../assets/clubTeamEmpty.png')}
                                                style={styles.matchInfoClubImage}
                                            />
                                        </View>
                                        <View style={styles.matchInfoTexts}>
                                            <Text style={styles.matchDate}>{new Date(match.date).toLocaleDateString()}</Text>
                                            <Text style={styles.matchTime}>{`${new Date(match.date).getHours()}h${new Date(match.date).getMinutes().toString().padStart(2, '0')}`}</Text>
                                        </View>
                                        <View style={styles.matchInfoClubRight}>
                                            <Image
                                                source={require('../assets/clubTeamEmpty.png')}
                                                style={styles.matchInfoClubImage}
                                            />
                                        </View>
                                    </View>
                                    <View style={styles.matchInfoContainerBottom}>
                                        <Text style={styles.matchInfoContainerBottomText}>FC TEST</Text>
                                        <Text style={styles.matchInfoContainerBottomText}>FC TEST</Text>
                                    </View>
                                </TouchableOpacity>
                            </LinearGradient>

                        ))}
                    </View>
                ))}
                <Spacer top={15} />
                <Label>Clubs participants</Label>
                <Text style={styles.textInfos}>Retrouvez leurs informations en cliquant sur l’un d’eux parmi la liste ci-dessous</Text>
                {tournament.clubDetails.length > 0 ? (
                    <View style={{ paddingTop: 20 }}>
                        <CustomList>
                            {tournament.clubDetails.map(club => (
                                <ItemList
                                    key={club.id}
                                    text={club.name}
                                    onPress={() => handleClubPress(club.id)}
                                />
                            ))}
                        </CustomList>
                    </View>
                ) : (
                    <Text style={[styles.textInfos, { color: colors.darkgrey, paddingTop: 15, textAlign: 'center' }]}>Aucun club ne participe actuellement au tournoi</Text>
                )}
                {user.accountType === 'coach' && !isTournamentStarted() && tournament.availableSlots > 0 && (
                    <>
                        {user.teams.length > 0 ? (
                            <View style={{ position: 'relative', paddingVertical: 15 }}>
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
                                    <BlurView intensity={6} style={[styles.absolute, { top: insets.top + 110 }]}>
                                        <View style={styles.modalView}>
                                            <View style={styles.modalHeader}>
                                                <Title>Choisissez une <PrimaryColorText>équipe</PrimaryColorText></Title>
                                                <Subtitle>Quelle équipe sera à la hauteur de ce tournoi ?</Subtitle>
                                            </View>
                                            <ScrollView style={styles.clubsList}>
                                                <Picker
                                                    selectedValue={selectedTeam}
                                                    onValueChange={(itemValue) => setSelectedTeam(itemValue)}
                                                    style={styles.picker}
                                                >
                                                    <Picker.Item label="Sélectionner un club" value="nullKey" />
                                                    {user.teams.filter(teamId => !tournament.participatingClubs?.includes(teamId)).map((teamId, index) => (
                                                        <Picker.Item key={index} label={teamNamesModal[teamId] || 'Loading...'} value={teamId} />
                                                    ))}
                                                </Picker>

                                                <Text style={[styles.textInfos, { textAlign: 'center' }]}>Si une équipe n'apparaît pas c'est qu'elle participe déjà au tournoi</Text>
                                            </ScrollView>

                                            <View style={styles.modalFooter}>
                                                <FunctionButton
                                                    title="Valider"
                                                    onPress={confirmJoin}
                                                    disabled={selectedTeam === "nullKey"}
                                                />
                                                <FunctionButton
                                                    title="Valider Force"
                                                    onPress={confirmJoinForce}
                                                    variant='error'
                                                />
                                                <FunctionButton
                                                    title="Fermer"
                                                    onPress={() => setModalVisible(false)}
                                                    variant='primaryOutline'
                                                />
                                            </View>

                                        </View>
                                    </BlurView>
                                </Modal>
                            </View>
                        ) : (
                            <Text>Vous n'avez pas d'équipe.</Text>
                        )}
                    </>
                )}
                {((user.uid === tournament.createdBy) && (new Date() < new Date(tournament.startDate))) && (
                    <FunctionButton
                        title="Annuler le tournoi"
                        onPress={deleteTournament}
                        variant='error'
                    />
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
    tournamentName: {
        textTransform: 'uppercase',
        color: colors.primary,
        fontSize: 25,
        fontFamily: fonts.OutfitBold,
        textAlign: 'center'
    },
    tournamentPlaces: {
        fontFamily: fonts.OutfitBold,
        fontSize: 15,
        color: colors.secondary,
        textAlign: 'center'
    },
    teamInfoItemContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 15
    },
    teamInfoItemText: {
        fontSize: 14,
        fontFamily: fonts.OutfitBold,
        color: colors.darkgrey
    },
    teamInfoContainer: {
        gap: 15,
        paddingHorizontal: 5,
        paddingTop: 15
    },
    matchsContainer: {
        borderRadius: 10,
    },
    matchsTitle: {
        fontSize: 16,
        textTransform: 'uppercase',
        fontFamily: fonts.OutfitBold,
        color: colors.primary,
        textAlign: 'center',
    },
    roundContainer: {
        marginVertical: 15,
        gap: 20,
    },
    roundTitle: {
        fontSize: 14,
        textAlign: 'center',
        fontFamily: fonts.OutfitSemiBold,
        color: colors.darkgrey
    },
    matchContainer: {
        paddingVertical: 15,
        paddingHorizontal: 20,
        borderRadius: 10,
    },
    matchDate: {
        color: "white",
        fontSize: 18,
        fontFamily: fonts.OutfitBold,
        textAlign: 'center',
    },
    matchTime: {
        color: "white",
        fontSize: 16,
        fontFamily: fonts.OutfitBold,
        textAlign: 'center',
    },
    matchInfoContainerTop: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-end'
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
        gap: 10,
        justifyContent: 'space-between'
    },
    matchInfoContainerBottomText: {
        fontSize: 14,
        color: 'white',
        fontFamily: fonts.OutfitBold,
        paddingTop: 10,
        paddingHorizontal: 10,
    },
    textInfos: {
        fontSize: 14,
        fontFamily: fonts.OutfitSemiBold,
        color: colors.secondary
    },
    modalView: {
        marginHorizontal: 30,
        backgroundColor: "white",
        padding: 25,
        borderRadius: 8,
        borderColor: colors.darkgrey,
        borderWidth: 2,
        elevation: 5,
        height: '95%',
    },
    absolute: {
        position: 'absolute',
        left: 0,
        right: 0,
        bottom: 0,
        top: 0,
    },
    modalHeader: {
        paddingVertical: 15,
    },
    modalFooter: {
        paddingTop: 20,
        borderTopWidth: 1,
        borderColor: colors.lightgrey,
        alignItems: 'center',
        gap: 10
    },
    clubsList: {
        flex: 1,
        marginBottom: 15,
    },
});

export default TournamentDetailScreen;