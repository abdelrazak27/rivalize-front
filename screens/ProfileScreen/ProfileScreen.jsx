import React, { useEffect, useState } from 'react';
import { View, Text, Button, Alert, Modal, ScrollView, StyleSheet } from 'react-native';
import { doc, getDoc, setDoc, Timestamp, query, collection, where, getDocs, updateDoc } from "firebase/firestore";
import uuid from 'react-native-uuid';
import { auth, db } from '../../firebaseConfig';
import { useUser } from '../../context/UserContext';
import { Picker } from '@react-native-picker/picker';
import { SafeAreaView } from 'react-native-safe-area-context';
import globalStyles from '../../styles/globalStyles';
import { Label, PrimaryColorText, Subtitle, Title } from '../../components/TextComponents';
import { fonts } from '../../styles/fonts';
import Spacer from '../../components/Spacer';
import CustomTextInput from '../../components/CustomTextInput';
import FunctionButton from '../../components/FunctionButton';
import { signOut } from 'firebase/auth';
import { CommonActions, useNavigation } from '@react-navigation/native';
import colors from '../../styles/colors';
import { getTeamName } from '../../utils/teams';
import ItemList from '../../components/ItemList';

function ProfileScreen({ route }) {
    const { userId } = route.params;
    const { user, setUser } = useUser();
    const [selectedTeam, setSelectedTeam] = useState('');
    const [isModalVisible, setModalVisible] = useState(false);
    const [playerDetails, setPlayerDetails] = useState(null);
    const [availableTeams, setAvailableTeams] = useState([]);
    const [teamName, setTeamName] = useState('');
    const isCurrentUserProfile = user.uid === userId;
    const navigation = useNavigation();
    const [requestedClubName, setRequestedClubName] = useState('');

    useEffect(() => {
        const fetchRequestedClubName = async () => {
            if (user && user.requestedJoinClubId) {
                const requestRef = doc(db, 'requests_join_club', user.requestedJoinClubId);
                const requestDoc = await getDoc(requestRef);
                if (requestDoc.exists()) {
                    const clubId = requestDoc.data().clubId;
                    const clubRef = doc(db, 'equipes', clubId);
                    const clubDoc = await getDoc(clubRef);
                    if (clubDoc.exists()) {
                        setRequestedClubName(clubDoc.data().name);
                    }
                }
            }
        };

        fetchRequestedClubName();
    }, [user.requestedJoinClubId]);

    useEffect(() => {
        const fetchPlayerDetails = async () => {
            const userRef = doc(db, 'utilisateurs', userId);
            const userSnapshot = await getDoc(userRef);
            if (userSnapshot.exists()) {
                setPlayerDetails(userSnapshot.data());
            }
        };

        const fetchPendingInvitations = async () => {
            if (user.teams?.length > 0) {
                const teamsRef = collection(db, "equipes");
                const teamsSnapshot = await getDocs(teamsRef);
                const teamsInfo = teamsSnapshot.docs.reduce((acc, doc) => {
                    acc[doc.id] = doc.data().name;
                    return acc;
                }, {});
                const invitationsQuery = query(
                    collection(db, "invitations"),
                    where("invitedUid", "==", userId),
                    where("state", "==", "pending")
                );
                const querySnapshot = await getDocs(invitationsQuery);
                const pendingTeams = new Set(querySnapshot.docs.map(doc => doc.data().clubId));
                setAvailableTeams(user.teams.filter(teamId => !pendingTeams.has(teamId)).map(teamId => ({
                    id: teamId,
                    name: teamsInfo[teamId]
                })));
            }
        };

        const fetchTeamName = async () => {
            if (playerDetails && playerDetails.accountType === 'player' && playerDetails.team) {
                const name = await getTeamName(playerDetails.team);
                setTeamName(name);
            }
        };

        fetchPlayerDetails();
        fetchPendingInvitations();
        fetchTeamName();
    }, [userId, user.teams, playerDetails]);

    const handleInvitePlayer = async () => {
        if (!selectedTeam) {
            Alert.alert("Erreur", "Veuillez sélectionner une équipe.");
            return;
        }

        const teamName = availableTeams.find(team => team.id === selectedTeam)?.name;

        const invitationId = uuid.v4();
        const notificationId = uuid.v4();
        const invitationRef = doc(db, 'invitations', invitationId);
        const notificationRef = doc(db, 'notifications', notificationId);

        const invitationDetails = {
            invitedUid: userId,
            timestamp: Timestamp.now(),
            clubId: selectedTeam,
            state: 'pending',
        };

        const notificationDetails = {
            userId: userId,
            message: `Vous êtes invité à rejoindre l'équipe ${teamName}`,
            hasBeenRead: false,
            timestamp: Timestamp.now(),
            type: "invitation",
            invitationId: invitationId,
        };

        try {
            await setDoc(invitationRef, invitationDetails);
            await setDoc(notificationRef, notificationDetails);

            setAvailableTeams(prev => prev.filter(team => team.id !== selectedTeam));

            setSelectedTeam('');

            Alert.alert("Invitation envoyée", "L'invitation a été envoyée avec succès.");
            setModalVisible(false);
        } catch (error) {
            console.error("Erreur lors de l'envoi de l'invitation :", error);
            Alert.alert("Erreur", "Une erreur est survenue lors de l'envoi de l'invitation.");
        }
    };

    const calculateAge = (birthday) => {
        if (!birthday) return "Non renseigné";

        const [year, month, day] = birthday.split('-').map(Number);
        const birthDate = new Date(year, month - 1, day);
        const today = new Date();
        let age = today.getFullYear() - birthDate.getFullYear();
        const m = today.getMonth() - birthDate.getMonth();

        if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
            age--;
        }

        return age.toString();
    };

    const handleCancelRequest = async () => {
        if (!user.requestedJoinClubId) {
            Alert.alert("Aucune demande active", "Vous n'avez pas de demande active à annuler.");
            return;
        }

        try {
            const requestRef = doc(db, 'requests_join_club', user.requestedJoinClubId);
            await updateDoc(requestRef, { state: "canceled" });

            const userRef = doc(db, 'utilisateurs', user.uid);
            await updateDoc(userRef, { requestedJoinClubId: null });

            setUser(prevState => ({ ...prevState, requestedJoinClubId: null }));

            Alert.alert("Demande annulée", "Votre demande pour rejoindre l'équipe a été annulée avec succès.");
        } catch (error) {
            console.error("Erreur lors de l'annulation de la demande :", error);
            Alert.alert("Erreur", "Une erreur est survenue lors de l'annulation de la demande.");
        }
    };

    return (
        <SafeAreaView style={globalStyles.container}>
            {user && playerDetails ? (
                <>
                    <View style={globalStyles.headerContainer}>
                        {isCurrentUserProfile ? (
                            <Title>Vos <PrimaryColorText>informations et données</PrimaryColorText></Title>
                        ) : (
                            <Title><PrimaryColorText>{playerDetails.firstname} {playerDetails.lastname}</PrimaryColorText></Title>
                        )}
                    </View>

                    <ScrollView
                        contentContainerStyle={globalStyles.scrollContainer}
                    >
                        {playerDetails ? (
                            <>
                                {isCurrentUserProfile && (
                                    <View style={styles.section}>
                                        <Text style={styles.sectionTitle}>Vos informations de connexion</Text>
                                        <CustomTextInput label="Email" value={playerDetails.email} readOnly />
                                        <Spacer top={12} />
                                    </View>
                                )}
                                <View style={styles.section}>
                                    <Text style={styles.sectionTitle}>{isCurrentUserProfile ? "Vos informations personnelles" : "Informations personnelles"}</Text>
                                    <View style={{ flexDirection: 'row', gap: 20 }}>
                                        <View style={{ flex: 1 }}>
                                            <CustomTextInput label="Prénom" value={playerDetails.firstname} readOnly />
                                        </View>
                                        <View style={{ flex: 1 }}>
                                            <CustomTextInput label="Nom" value={playerDetails.lastname} readOnly />
                                        </View>
                                    </View>
                                    <View style={{ flexDirection: 'row', gap: 20 }}>
                                        <View style={{ flex: 1 }}>
                                            <CustomTextInput label="Âge" value={calculateAge(playerDetails.birthday)} readOnly />
                                        </View>
                                        <View style={{ flex: 1 }}>
                                            <CustomTextInput label="Ville" value={playerDetails.city ? playerDetails.city : "Non renseigné"} readOnly />
                                        </View>
                                    </View>
                                    <Spacer top={12} />
                                </View>
                                <View style={styles.section}>
                                    <Text style={styles.sectionTitle}>{isCurrentUserProfile ? "Vos informations professionnelles" : "Informations professionnelles"}</Text>
                                    <CustomTextInput label="Type de compte" value={playerDetails.accountType === 'player' ? ("Joueur") : playerDetails.accountType === 'coach' ? ("Coach") : playerDetails.accountType === 'visitor' && ("Visiteur")} readOnly />
                                    {playerDetails.accountType === 'player' && (
                                        <>
                                            <View style={{ flexDirection: 'row', gap: 20 }}>
                                                <View style={{ flex: 1 }}>
                                                    <CustomTextInput label="Nom de joueur" value={playerDetails.playerName} readOnly />
                                                </View>
                                                <View style={{ flex: 1 }}>
                                                    <CustomTextInput label="Numéro" value={playerDetails.playerNumber} readOnly />
                                                </View>
                                            </View>
                                            <CustomTextInput label="Licence" value={playerDetails.licenceNumber} readOnly />
                                            <View>
                                                <Label color={colors.secondary}>Équipe</Label>
                                                <ItemList
                                                    text={playerDetails.team ? teamName : "N/A"}
                                                    onPress={() => {
                                                        if(playerDetails.team) {
                                                            navigation.navigate('TeamScreen', { teamId: playerDetails.team });
                                                        }
                                                    }}
                                                />
                                            </View>
                                        </>
                                    )}
                                    {playerDetails.accountType === 'coach' && (
                                        <>
                                            <CustomTextInput label="Licence" value={playerDetails.licenceNumber} readOnly />
                                            <Label color={colors.secondary}>Équipes</Label>
                                            {playerDetails.teams.length > 0 ? (
                                                <View>
                                                    <View style={{ gap: 5 }}>
                                                        {playerDetails.teams.map((team, index) => (
                                                            <ItemList
                                                                key={index}
                                                                text={team}
                                                                onPress={() => {
                                                                    navigation.navigate('TeamScreen', { teamId: team });
                                                                }}
                                                            />
                                                        ))}
                                                    </View>
                                                </View>
                                            ) : (
                                                <View>
                                                    <ItemList
                                                        text="N/A"
                                                    />
                                                </View>
                                            )}
                                        </>
                                    )}
                                    <Spacer top={12} />
                                </View>
                                {isCurrentUserProfile && playerDetails.accountType === 'player' && playerDetails.requestedJoinClubId && requestedClubName && (
                                    <View style={styles.section}>
                                        <Text style={styles.sectionTitle}>Demande en cours</Text>
                                        <Text style={styles.sectionSubtitle}>Votre demande concernant le club {requestedClubName} est toujours en attente.</Text>
                                        <FunctionButton title="Annuler ma demande" onPress={handleCancelRequest} variant="primaryOutline" />
                                        <Spacer />
                                    </View>
                                )}
                                {user.accountType === 'coach' && availableTeams.length > 0 && playerDetails.accountType === "player" && (
                                    <>
                                        <FunctionButton title="Inviter ce joueur" onPress={() => setModalVisible(true)} />
                                        <Modal
                                            transparent={true}
                                            visible={isModalVisible}
                                            onRequestClose={() => setModalVisible(false)}
                                        >
                                            <View style={globalStyles.modal}>
                                                <SafeAreaView style={globalStyles.container}>
                                                    <View style={globalStyles.headerContainer}>
                                                        <Title>Choisissez <PrimaryColorText>une équipe</PrimaryColorText>,</Title>
                                                    </View>

                                                    <ScrollView
                                                        contentContainerStyle={globalStyles.scrollContainer}
                                                    >
                                                        <Picker
                                                            selectedValue={selectedTeam}
                                                            onValueChange={(itemValue) => setSelectedTeam(itemValue)}
                                                        >
                                                            <Picker.Item label="Choisir l'équipe" value="" />
                                                            {availableTeams.map((team) => (
                                                                <Picker.Item key={team.id} label={team.name} value={team.id} />
                                                            ))}
                                                        </Picker>
                                                    </ScrollView>
                                                </SafeAreaView>
                                                <View style={{ paddingHorizontal: 30, gap: 8 }}>
                                                    <FunctionButton title="Inviter" onPress={handleInvitePlayer} />
                                                    <FunctionButton title="Annuler" onPress={() => setModalVisible(false)} variant='primaryOutline' />
                                                </View>
                                            </View>
                                        </Modal>
                                    </>
                                )}
                                {user.accountType === 'coach' && availableTeams.length === 0 && playerDetails.accountType === "player" && playerDetails.team === null && (
                                    <FunctionButton title="Aucun club possédé compatible" onPress={() => setModalVisible(true)} disabled />
                                )}
                                {isCurrentUserProfile && (
                                    <FunctionButton title="Se déconnecter" onPress={async () => {
                                        try {
                                            Alert.alert("Déconnexion", "Vous avez été déconnecté avec succès.");
                                            navigation.dispatch(
                                                CommonActions.reset({
                                                    index: 0,
                                                    routes: [{ name: 'ConnexionScreen' }],
                                                })
                                            );
                                            await setUser(null);
                                            await signOut(auth);
                                        } catch (error) {
                                            console.log(error);
                                            Alert.alert("Erreur", "Une erreur est survenue lors de la déconnexion.");
                                        }
                                    }} />
                                )}
                            </>
                        ) : (
                            <Text>Chargement...</Text>
                        )}
                    </ScrollView>
                </>
            ) : (
                <Text>Chargement...</Text>
            )}
        </SafeAreaView>
    );
}

export default ProfileScreen;

const styles = StyleSheet.create({
    section: {
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        gap: 13,
    },
    sectionTitle: {
        fontSize: 15,
        fontFamily: fonts.OutfitBold,
    },
    sectionSubtitle: {
        fontSize: 14,
        fontFamily: fonts.OutfitSemiBold,
        color: colors.secondary,
        marginBottom: 5,
    },
});
