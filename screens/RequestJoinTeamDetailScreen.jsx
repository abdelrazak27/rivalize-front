import { View, Text, Button, Alert } from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import { arrayUnion, doc, getDoc, setDoc, Timestamp, updateDoc } from 'firebase/firestore';
import { useEffect, useState } from 'react';
import { db } from '../firebaseConfig';
import uuid from 'react-native-uuid';

function RequestJoinTeamDetailScreen() {
    const route = useRoute();
    const { requestJoinClubId } = route.params;
    const navigation = useNavigation();

    const [requestDetails, setRequestDetails] = useState(null);

    const requestRef = doc(db, 'requests_join_club', requestJoinClubId);

    useEffect(() => {
        const fetchRequest = async () => {
            const requestDoc = await getDoc(requestRef);
            if (requestDoc.exists()) {
                setRequestDetails(requestDoc.data());
            }
        };

        fetchRequest();
    }, [requestJoinClubId]);

    const handleRequestResponse = async (newState) => {
        const userRef = doc(db, 'utilisateurs', requestDetails.userId);
        const userDoc = await getDoc(userRef);
        if (!userDoc.exists()) {
            Alert.alert("Erreur", "Profil utilisateur non trouvé.");
            return;
        }

        const userData = userDoc.data();
        const teamRef = doc(db, 'equipes', requestDetails.clubId);
        const teamDoc = await getDoc(teamRef);
        if (!teamDoc.exists()) {
            Alert.alert("Erreur", "Détails du club non trouvés.");
            return;
        }

        const teamData = teamDoc.data();

        if (newState === 'accepted') {
            if (userData.team) {
                Alert.alert("Erreur", "L'utilisateur appartient déjà à un autre club.");
                return;
            }

            await updateDoc(userRef, { team: requestDetails.clubId, requestedJoinClubId: null });
            await updateDoc(teamRef, { players: arrayUnion(requestDetails.userId) });
            await updateDoc(requestRef, { state: newState });

            const acceptNotificationId = uuid.v4();
            const acceptNotificationRef = doc(db, 'notifications', acceptNotificationId);
            const acceptNotificationDetails = {
                userId: requestDetails.userId,
                message: `Votre demande pour rejoindre le club ${teamData.name} a été acceptée.`,
                hasBeenRead: false,
                timestamp: Timestamp.now(),
                type: "info"
            };
            await setDoc(acceptNotificationRef, acceptNotificationDetails);

            Alert.alert("Demande acceptée", `Le joueur a été ajouté au club ${teamData.name}.`);
        } else {
            await updateDoc(userRef, { requestedJoinClubId: null });
            await updateDoc(requestRef, { state: newState });

            const rejectNotificationId = uuid.v4();
            const rejectNotificationRef = doc(db, 'notifications', rejectNotificationId);
            const rejectNotificationDetails = {
                userId: requestDetails.userId,
                message: `Votre demande pour rejoindre le club ${teamData.name} a été refusée.`,
                hasBeenRead: false,
                timestamp: Timestamp.now(),
                type: "info"
            };
            await setDoc(rejectNotificationRef, rejectNotificationDetails);

            Alert.alert("Demande refusée", `Vous avez refusé la demande du joueur pour rejoindre le club ${teamData.name}.`);
        }

        navigation.goBack();
    };

    return (
        <View>
            {requestDetails && (
                <>
                    <Text>Demande de {requestDetails.userId} pour rejoindre {requestDetails.clubId}</Text>
                    {requestDetails.state === 'pending' ? (
                        <View>
                            <Button title="Accepter" onPress={() => handleRequestResponse('accepted')} />
                            <Button title="Refuser" onPress={() => handleRequestResponse('rejected')} />
                        </View>
                    ) : requestDetails.state === 'canceled' ? (
                        <Text>Il semble que cette demande a été annulée.</Text>
                    ) : (
                        <Text>Il semble que cette demande a déjà été traitée.</Text>
                    )}
                </>
            )}
            {!requestDetails && <Text>Chargement des détails de la demande...</Text>}
        </View>
    );
}

export default RequestJoinTeamDetailScreen;
