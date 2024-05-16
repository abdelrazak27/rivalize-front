import { CommonActions, useFocusEffect, useNavigation, useRoute } from "@react-navigation/native";
import { collection, getDoc, getDocs, updateDoc, doc, setDoc, Timestamp } from "firebase/firestore";
import React, { useEffect, useState } from "react";
import { Text, View, ActivityIndicator, Image, StyleSheet, Alert, TouchableOpacity } from "react-native";
import { db } from "../../firebaseConfig";
import { useUser } from "../../context/UserContext";
import FunctionButton from "../../components/FunctionButton";
import ListUsers from "../../components/ListUsers";
import InvitePlayers from "../../components/InvitePlayers";
import uuid from 'react-native-uuid';

function TeamScreen() {
    const { setUser } = useUser();
    const route = useRoute();
    const { teamId } = route.params;
    const { user } = useUser();
    const navigation = useNavigation();

    const [teamData, setTeamData] = useState(null);
    const [coachData, setCoachData] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [requestedClubName, setRequestedClubName] = useState('');

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
                setCoachData(coachDoc.data());
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
        <View style={styles.container}>
            <Text>
                Team ID: {teamId}
            </Text>
            {teamData ? (
                <>
                    {teamData.logo_link && (
                        <View style={styles.imageContainer}>
                            <Image
                                source={{ uri: teamData.logo_link }}
                                style={styles.logo}
                            />
                        </View>
                    )}
                    <Text>Nom : {teamData.name}</Text>
                    <Text>Catégorie : {teamData.category}</Text>
                    <Text>Ville : {teamData.city}</Text>
                    <Text>Coach : {coachData ? `${coachData.firstname} ${coachData.lastname}` : "Inconnu"}</Text>
                    <Text>Color int : {teamData.color_int}</Text>
                    <Text>Color ext : {teamData.color_ext}</Text>
                    <Text>Nombre de joueur(s) : {teamData.players.length > 0 ? teamData.players.length : "0"}</Text>
                    <ListUsers arrayList={teamData.players} navigation={navigation} setTeamData={setTeamData} teamId={teamId} />
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
        </View>
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
        width: 200,
        height: 200,
        resizeMode: 'contain'
    }
});

export default TeamScreen;
