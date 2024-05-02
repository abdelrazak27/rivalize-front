import { View, Text, Button, Alert } from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import { arrayUnion, doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '../../firebaseConfig';
import { useUser } from '../../context/UserContext';
import { useEffect, useState } from 'react';

function InvitationDetailScreen() {
    const route = useRoute();
    const { invitationId } = route.params;
    const navigation = useNavigation();
    const { user } = useUser();

    const [invitationState, setInvitationState] = useState('');

    const invitationRef = doc(db, 'invitations', invitationId);

    useEffect(() => {
        const fetchInvitation = async () => {
            const invitationDoc = await getDoc(invitationRef);
            if (invitationDoc.exists()) {
                setInvitationState(invitationDoc.data().state);
            }
        };

        fetchInvitation();
    }, [invitationId]);

    const handleInvitationResponse = async (newState) => {
        const invitationRef = doc(db, 'invitations', invitationId);
        await updateDoc(invitationRef, {
            state: newState
        });

        if (newState === 'accepted') {
            const { clubId } = (await getDoc(invitationRef)).data();
            const userRef = doc(db, 'utilisateurs', user.uid);
            await updateDoc(userRef, { team: clubId });
            const teamRef = doc(db, 'equipes', clubId);
            await updateDoc(teamRef, { players: arrayUnion(user.uid) });
            Alert.alert("Invitation acceptée !");
        } else {
            Alert.alert("Invitation refusée.");
        }

        navigation.goBack();
    };

    return (
        <View>
            <Text>Invitation de {invitationId}</Text>
            {invitationState === 'pending' ? (
                <View>
                    <Button title="Accepter" onPress={() => handleInvitationResponse('accepted')} />
                    <Button title="Refuser" onPress={() => handleInvitationResponse('rejected')} />
                </View>
            ) : (
                <View>
                    {invitationState === "rejected" ? (
                        <Text>Il semble que cette invitation a déjà été refusée.</Text>
                    ) : invitationState === "accepted" ? (
                        <Text>Il semble que cette invitation a déjà été acceptée.</Text>
                    ) : invitationState === "expired" && (
                        <Text>Il semble que cette invitation est expirée.</Text>
                    )}
                </View>
            )}
        </View>
    );
}

export default InvitationDetailScreen;