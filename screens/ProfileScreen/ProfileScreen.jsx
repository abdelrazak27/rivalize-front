import React, { useEffect, useState } from 'react';
import { View, Text, Button, Alert, Modal } from 'react-native';
import { doc, getDoc, setDoc, Timestamp, query, collection, where, getDocs } from "firebase/firestore";
import uuid from 'react-native-uuid';
import { db } from '../../firebaseConfig';
import { useUser } from '../../context/UserContext';
import { Picker } from '@react-native-picker/picker';

function ProfileScreen({ route }) {
    const { userId } = route.params;
    const { user } = useUser();
    const [selectedTeam, setSelectedTeam] = useState('');
    const [isModalVisible, setModalVisible] = useState(false);
    const [playerDetails, setPlayerDetails] = useState(null);
    const [availableTeams, setAvailableTeams] = useState([]);

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


        fetchPlayerDetails();
        fetchPendingInvitations();
    }, [userId, user.teams]);

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



    return (
        <View>
            {playerDetails ? (
                <>
                    <Text>ProfileScreen</Text>
                    <Text>userId: {userId}</Text>
                    <Text>accountType: {user.accountType}</Text>
                    <Text>birthday: {user.birthday}</Text>
                    <Text>Ville : {user.city ? user.city : "Non renseigné"} </Text>
                    <Text>email: {user.email}</Text>
                    <Text>firstname: {user.firstname}</Text>
                    <Text>lastname: {user.lastname}</Text>
                    {user.accountType === ("player" || "coach") && (
                        <>
                            <Text>licenceNumber: {user.licenceNumber}</Text>
                            {user.accountType === "player" && (
                                <>
                                    <Text>playerName: {user.playerName}</Text>
                                    <Text>playerNumber: {user.playerNumber}</Text>
                                    <Text>Équipe : {user.team ? user.team : "Non renseigné"} </Text>
                                    {user.requestedJoinClubId && ( <Text>requestedJoinClubId: {user.requestedJoinClubId}</Text> )}
                                </>
                            )}
                            {user.accountType === "coach" && (
                                <Text>teams: {user.teams}</Text>
                            )}
                        </>
                    )}
                    {user.accountType === 'coach' && availableTeams.length > 0 && playerDetails.accountType === "player" && (
                        <>
                            <Button
                                title="Inviter le joueur"
                                onPress={() => setModalVisible(true)}
                            />
                            <Modal
                                transparent={true}
                                visible={isModalVisible}
                                onRequestClose={() => setModalVisible(false)}
                            >
                                <View style={{ marginTop: 50, padding: 20, backgroundColor: 'white' }}>
                                    <Text>Choisissez une équipe pour inviter le joueur :</Text>
                                    <Picker
                                        selectedValue={selectedTeam}
                                        onValueChange={(itemValue) => setSelectedTeam(itemValue)}
                                    >
                                        <Picker.Item label="Choisir l'équipe" value="" />
                                        {availableTeams.map((team) => (
                                            <Picker.Item key={team.id} label={team.name} value={team.id} />
                                        ))}
                                    </Picker>

                                    <Button title="Inviter" onPress={handleInvitePlayer} />
                                    <Button title="Annuler" onPress={() => setModalVisible(false)} />
                                </View>
                            </Modal>
                        </>
                    )}
                    {user.accountType === 'coach' && availableTeams.length === 0 && playerDetails.accountType === "player" && playerDetails.team === null && (
                        <Text>Il n'est pas possible d'inviter le joueur pour le moment avec les clubs possédés actuellement.</Text>
                    )}
                </>
            ) : (
                <Text>Chargement...</Text>
            )}
        </View>
    );
}

export default ProfileScreen;
