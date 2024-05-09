import { CommonActions, useFocusEffect, useNavigation, useRoute } from "@react-navigation/native";
import { collection, deleteDoc, doc, getDoc, getDocs, updateDoc } from "firebase/firestore";
import React, { useState } from "react";
import { Text, View, ActivityIndicator, Image, StyleSheet } from "react-native";
import { db } from "../../firebaseConfig";
import { useUser } from "../../context/UserContext";
import FunctionButton from "../../components/FunctionsButton";
import ListUsers from "../../components/ListUsers";
import InvitePlayers from "../../components/InvitePlayers";

function TeamScreen() {
    const { setUser } = useUser();
    const route = useRoute();
    const { teamId } = route.params;
    const { user } = useUser();
    const navigation = useNavigation();

    const [teamData, setTeamData] = useState(null);
    const [coachData, setCoachData] = useState(null);
    const [isLoading, setIsLoading] = useState(true);

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

    useFocusEffect(
        React.useCallback(() => {
            fetchTeamDetails();
            return () => { };
        }, [teamId])
    );

    const deleteTeam = async () => {
        try {
            // Invitations expirent
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

            // Les joueurs perdent l'équipe
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

            // Le coach perd son équipe KO
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

            // Désactive l'équipe OK
            const teamRef = doc(db, 'equipes', teamId);
            await updateDoc(teamRef, {
                active: false,
            });

            // Suppression de l'équipe localement
            const newTeams = user.teams.filter(team => team !== teamId);
            const updatedUserData = { 
                ...user, 
                teams: newTeams, 
            };
            await setUser(updatedUserData);

            // Redirection, quand tout est ok
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
                    <ListUsers arrayList={teamData.players} navigation={navigation} setTeamData={setTeamData} teamId={teamId}/>
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
