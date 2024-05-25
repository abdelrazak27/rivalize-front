import { CommonActions, useFocusEffect, useNavigation, useRoute } from "@react-navigation/native";
import { collection, getDoc, getDocs, updateDoc, doc, setDoc, Timestamp } from "firebase/firestore";
import React, { useEffect, useState } from "react";
import { Text, View, ActivityIndicator, Image, StyleSheet, Alert, TouchableOpacity, ScrollView } from "react-native";
import { db } from "../../firebaseConfig";
import { useUser } from "../../context/UserContext";
import FunctionButton from "../../components/FunctionButton";
import ListUsers from "../../components/ListUsers";
import InvitePlayers from "../../components/InvitePlayers";
import uuid from 'react-native-uuid';
import { SafeAreaView } from "react-native-safe-area-context";
import globalStyles from "../../styles/globalStyles";
import colors from "../../styles/colors";
import { fonts } from "../../styles/fonts";
import RedirectLinkButton from "../../components/RedirectLinkButton";
import RedirectLinkButtonMini from "../../components/RedirectLinkButtonMini";
import Spacer from "../../components/Spacer";
import FontAwesome6 from 'react-native-vector-icons/FontAwesome6';
import { LinearGradient } from "expo-linear-gradient";
import { darkenColor } from "../../utils/colors";
import { Label } from "../../components/TextComponents";
import CustomList from "../../components/CustomList";

function TeamScreen() {
    const { user, setUser } = useUser();
    const route = useRoute();
    const { teamId } = route.params;
    const navigation = useNavigation();

    const [teamData, setTeamData] = useState(null);
    const [coachData, setCoachData] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [requestedClubName, setRequestedClubName] = useState('');
    const [isCurrentCoach, setIsCurrentCoach] = useState(false);

    const fetchTeamDetails = async () => {
        const teamRef = doc(db, 'equipes', teamId);
        const teamDoc = await getDoc(teamRef);
        if (teamDoc.exists()) {
            setTeamData(teamDoc.data());
            await getCoachInfo(teamDoc.data().coach_id);
        } else {
            setIsLoading(false);
        }
    };

    const getCoachInfo = async (coachId) => {
        if (coachId) {
            const coachRef = doc(db, 'utilisateurs', coachId);
            const coachDoc = await getDoc(coachRef);
            if (coachDoc.exists()) {
                setCoachData({ id: coachId, ...coachDoc.data() });
                if (coachDoc.data().email === user.email) {
                    setIsCurrentCoach(true);
                }
            }
        }
        setIsLoading(false);
    };

    useEffect(() => {
        const fetchClubName = async () => {
            if (user.requestedJoinClubId) {
                const clubRef = doc(db, 'equipes', user.requestedJoinClubId);
                const clubDoc = await getDoc(clubRef);
                if (clubDoc.exists()) {
                    setRequestedClubName(clubDoc.data().name);
                }
            }
        };

        fetchClubName();
    }, [user.requestedJoinClubId]);


    useFocusEffect(
        React.useCallback(() => {
            fetchTeamDetails();
            return () => { };
        }, [teamId])
    );

    const requestJoinTeam = async () => {
        if (user.team) {
            Alert.alert("Rejoindre l'équipe", "Vous appartenez déjà à une équipe. Veuillez d'abord quitter votre équipe actuelle.");
            return;
        }

        if (user.requestedJoinClubId) {
            Alert.alert("Demande en cours", "Vous avez déjà une demande en cours pour rejoindre une équipe. Veuillez annuler cette demande avant d'en soumettre une nouvelle.");
            return;
        }

        Alert.alert(
            "Demande de rejoindre l'équipe",
            "Voulez-vous vraiment envoyer une demande pour rejoindre cette équipe ?",
            [
                {
                    text: "Annuler",
                    style: "cancel"
                },
                {
                    text: "Envoyer la demande",
                    onPress: async () => {
                        const requestJoinClubId = uuid.v4();
                        const notificationId = uuid.v4();

                        const requestJoinClubRef = doc(db, 'requests_join_club', requestJoinClubId);
                        const requestJoinClubDetails = {
                            coachId: teamData.coach_id,
                            clubId: teamId,
                            userId: user.uid,
                            timestamp: Timestamp.now(),
                            state: "pending",
                        };

                        try {
                            await setDoc(requestJoinClubRef, requestJoinClubDetails);

                            const notificationRef = doc(db, 'notifications', notificationId);
                            const notificationDetails = {
                                userId: teamData.coach_id,
                                message: `${user.firstname} ${user.lastname} souhaite rejoindre votre équipe : ${teamData.name}`,
                                hasBeenRead: false,
                                timestamp: Timestamp.now(),
                                type: "request_join_club",
                                requestJoinClubId: requestJoinClubId
                            };

                            await setDoc(notificationRef, notificationDetails);

                            await updateDoc(doc(db, 'utilisateurs', user.uid), {
                                requestedJoinClubId: requestJoinClubId,
                            });

                            setUser({ ...user, requestedJoinClubId: requestJoinClubId });

                            Alert.alert("Demande envoyée", "Votre demande pour rejoindre l'équipe a été envoyée.");
                        } catch (error) {
                            console.error("Erreur lors de l'envoi de la demande :", error);
                            Alert.alert("Erreur", "Une erreur est survenue lors de l'envoi de la demande.");
                        }
                    }
                }
            ]
        );
    };



    const deleteTeam = async () => {
        try {
            const invitationsSnapshot = await getDocs(collection(db, 'invitations'));
            const invitationsToUpdate = [];
            invitationsSnapshot.forEach((doc) => {
                const invitationData = doc.data();
                if (invitationData.clubId === teamId && invitationData.state === 'pending') {
                    invitationsToUpdate.push({ ref: doc.ref, data: { state: 'expired' } });
                }
            });

            await Promise.all(invitationsToUpdate.map(async (invitation) => {
                await updateDoc(invitation.ref, invitation.data);
            }));

            if (teamData.players && teamData.players.length > 0) {
                await Promise.all(teamData.players.map(async (playerId) => {
                    const userRef = doc(db, 'utilisateurs', playerId);
                    const userDoc = await getDoc(userRef);
                    if (userDoc.exists()) {
                        const userData = userDoc.data();
                        if (userData.accountType === 'player') {
                            await updateDoc(userRef, {
                                team: null,
                            });
                        }
                    }
                }));
            }

            if (teamData.coach_id) {
                const coachRef = doc(db, 'utilisateurs', teamData.coach_id);
                const coachDoc = await getDoc(coachRef);
                if (coachDoc.exists()) {
                    const coachData = coachDoc.data();
                    const teamIndex = coachData.teams.indexOf(teamId);
                    if (teamIndex !== -1) {
                        const updatedTeams = [...coachData.teams];
                        updatedTeams.splice(teamIndex, 1);
                        await updateDoc(coachRef, {
                            teams: updatedTeams,
                        });
                    }
                }
            }

            const teamRef = doc(db, 'equipes', teamId);
            await updateDoc(teamRef, {
                active: false,
            });

            const newTeams = user.teams.filter(team => team !== teamId);
            const updatedUserData = {
                ...user,
                teams: newTeams,
            };
            await setUser(updatedUserData);

            navigation.dispatch(
                CommonActions.reset({
                    index: 0,
                    routes: [{ name: 'HomeScreen', params: { teamRefresh: true } }],
                })
            );

        } catch (error) {
            console.error("Une erreur s'est produite lors de la suppression de l'équipe :", error);
        }
    };

    const leaveTeam = async () => {
        try {
            Alert.alert(
                "Quitter l'équipe",
                "Êtes-vous sûr de vouloir quitter cette équipe ?",
                [
                    {
                        text: "Annuler",
                        style: "cancel"
                    },
                    {
                        text: "Quitter",
                        onPress: async () => {
                            const userRef = doc(db, 'utilisateurs', user.uid);
                            await updateDoc(userRef, {
                                team: null,
                            });

                            const teamRef = doc(db, 'equipes', teamId);
                            await updateDoc(teamRef, {
                                players: teamData.players.filter(playerId => playerId !== user.uid)
                            });

                            const notificationId = uuid.v4();
                            const notificationRef = doc(db, 'notifications', notificationId);

                            const notificationDetails = {
                                userId: teamData.coach_id,
                                message: `${user.firstname} ${user.lastname} a quitté ${teamData.name}.`,
                                hasBeenRead: false,
                                timestamp: Timestamp.now(),
                                type: "info",
                            };

                            await setDoc(notificationRef, notificationDetails);

                            const updatedUserData = {
                                ...user,
                                team: null,
                            };
                            await setUser(updatedUserData);

                            Alert.alert("Vous avez quitté l'équipe.");

                            navigation.dispatch(
                                CommonActions.reset({
                                    index: 0,
                                    routes: [{ name: 'HomeScreen', params: { teamRefresh: true } }],
                                })
                            );
                        }
                    }
                ]
            );
        } catch (error) {
            console.error("Une erreur s'est produite lors de la sortie de l'équipe :", error);
        }
    };

    if (isLoading) {
        return (
            <View style={styles.centered}>
                <ActivityIndicator size="large" />
            </View>
        );
    }

    return (
        <SafeAreaView style={globalStyles.container}>
            {teamData ? (
                <>
                    <View style={{ marginHorizontal: 30 }}>
                        {teamData.logo_link && (
                            <View style={styles.imageContainer}>
                                <Image
                                    source={{ uri: teamData.logo_link }}
                                    style={styles.logo}
                                />
                            </View>
                        )}
                        <Text style={styles.teamName}>{teamData.name}</Text>
                        <Text style={styles.teamCoach}>
                            Club géré par {
                                coachData ? (
                                    isCurrentCoach ? (
                                        "vous"
                                    ) : coachData.firstname && coachData.lastname ? (
                                        `${coachData.firstname} ${coachData.lastname}`
                                    ) : (
                                        "un coach inconnu"
                                    )
                                ) : (
                                    ""
                                )
                            }
                        </Text>
                        {!isCurrentCoach && (
                            <View style={{ paddingHorizontal: 80, paddingTop: 15 }}>
                                <RedirectLinkButtonMini
                                    routeName='ProfileScreen'
                                    params={{ userId: coachData.id }}
                                    title="Voir son profil"
                                    variant="secondary"
                                />
                            </View>
                        )}
                        {user.accountType === 'player' && user.team != teamId && (
                            <View style={{ paddingTop: 15 }}>
                                <FunctionButton
                                    title="Rejoindre l'équipe"
                                    onPress={requestJoinTeam}
                                />
                            </View>
                        )}
                        {isCurrentCoach && (
                            <View style={{ paddingTop: 15 }}>
                                <RedirectLinkButton
                                    title="Modifier les informations de l'équipe"
                                />
                            </View>
                        )}
                        <Spacer bottom={0} />
                    </View>

                    <ScrollView contentContainerStyle={{ paddingHorizontal: 30, paddingTop: 25 }}>
                        <View style={styles.teamInfoContainer}>
                            <View style={{ gap: 20 }}>
                                <View style={styles.teamInfoItemContainer}>
                                    <View style={{ width: 40, alignItems: 'center' }}>
                                        <FontAwesome6 name="users-rectangle" size={24} color={colors.darkgrey} />
                                    </View>
                                    <Text style={styles.teamInfoItemText}>{teamData.category}</Text>
                                </View>
                                <View style={styles.teamInfoItemContainer}>
                                    <View style={{ width: 40, alignItems: 'center' }}>
                                        <FontAwesome6 name="location-dot" size={24} color={colors.darkgrey} />
                                    </View>
                                    <Text style={styles.teamInfoItemText}>
                                        {teamData.city && `${teamData.city.charAt(0).toUpperCase()}${teamData.city.slice(1).toLowerCase()}, France`}
                                    </Text>
                                </View>
                            </View>
                            <View style={styles.teamColorContainer}>
                                <LinearGradient
                                    colors={[teamData.color_int, darkenColor(teamData.color_int, -40)]}
                                    locations={[0.3, 1]}
                                    style={styles.squareColor}
                                />
                                <LinearGradient
                                    colors={[teamData.color_ext, darkenColor(teamData.color_ext, -40)]}
                                    locations={[0.3, 1]}
                                    style={[styles.squareColor, { top: 23, left: 30 } ]}
                                />
                            </View>
                        </View>
                        <Spacer />
                        <View style={{ paddingBottom: 25 }}>
                            <Label>Joueurs de l'équipe  ({teamData.players.length > 0 ? teamData.players.length : "0"} membre{teamData.players.length > 1 && "s"})</Label>
                            <Text style={styles.textInfos}>Retrouvez leurs informations en cliquant sur l’un d’eux parmi la liste ci-dessous</Text>
                        </View>
                        <ListUsers arrayList={teamData.players} navigation={navigation} setTeamData={setTeamData} teamId={teamId} />
                    </ScrollView>


                    {user.accountType === 'player' && !teamData.players.includes(user.uid) && !user.requestedJoinClubId && (
                        <FunctionButton
                            title="Demander à rejoindre l'équipe"
                            onPress={requestJoinTeam}
                        />
                    )}
                    {user.requestedJoinClubId && (
                        <>
                            <FunctionButton
                                disabled
                                title="Demander à rejoindre l'équipe"
                                onPress={requestJoinTeam}
                            />
                            <Text>Vous avez déjà demandé à rejoindre l'équipe {requestedClubName}, annulez votre demande depuis la page d'accueil pour pouvoir rejoindre une autre équipe.</Text>
                        </>
                    )}

                    {user.uid === teamData.coach_id && (
                        <>
                            <InvitePlayers arrayList={teamData.players} setTeamData={setTeamData} />
                            <FunctionButton
                                title="Modifier les informations de l'équipe"
                                onPress={() => navigation.navigate('EditTeamScreen', { teamData: teamData })}
                            />
                            <FunctionButton
                                title="Supprimer l'équipe"
                                onPress={deleteTeam}
                            />
                        </>
                    )}
                    {teamData.players.includes(user.uid) && user.uid !== teamData.coach_id && (
                        <FunctionButton
                            title="Quitter l'équipe"
                            onPress={leaveTeam}
                        />
                    )}
                </>
            ) : (
                <Text>Aucune donnée de l'équipe disponible</Text>
            )}
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 20
    },
    centered: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center'
    },
    imageContainer: {
        alignItems: 'center',
        marginVertical: 20
    },
    logo: {
        width: 150,
        height: 150,
        resizeMode: 'contain'
    },
    teamName: {
        textTransform: 'uppercase',
        color: colors.primary,
        fontSize: 25,
        fontFamily: fonts.OutfitBold,
        textAlign: 'center'
    },
    teamCoach: {
        fontFamily: fonts.OutfitBold,
        fontSize: 14,
        color: colors.secondary,
        textAlign: 'center'
    },
    teamInfoContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingRight: 3,
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
    teamColorContainer: {
        width: 70,
        position: 'relative'
    },
    squareColor: {
        position: 'absolute',
        width: 43,
        height: 43,
        borderWidth: 3,
        borderColor: colors.darkgrey,
        borderRadius: 8
    },
    textInfos: {
        fontFamily: fonts.OutfitBold,
        fontSize: 14,
        color: colors.secondary,
    }
});

export default TeamScreen;