import { View, Text, Button, Alert } from 'react-native';
import { useRoute, useNavigation, CommonActions } from '@react-navigation/native';
import { arrayUnion, doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '../../firebaseConfig';
import { useUser } from '../../context/UserContext';
import { useEffect, useState } from 'react';

function InvitationDetailScreen() {
    const route = useRoute();
    const { invitationId } = route.params;
    const navigation = useNavigation();
    const { user, setUser } = useUser();

    const [invitationDetails, setInvitationDetails] = useState('');

    const invitationRef = doc(db, 'invitations', invitationId);

    useEffect(() => {
        const fetchInvitation = async () => {
            const invitationDoc = await getDoc(invitationRef);
            if (invitationDoc.exists()) {
                setInvitationDetails(invitationDoc.data());
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
            
            const updatedUserData = { 
                ...user,
                team: clubId, 
            };
            await setUser(updatedUserData);

            Alert.alert("Invitation acceptée !");

            navigation.dispatch(
                CommonActions.reset({
                    index: 0,
                    routes: [{ name: 'HomeScreen', params: { teamRefresh: true } }],
                })
            );

        } else {
            Alert.alert("Invitation refusée.");

            navigation.dispatch(
                CommonActions.reset({
                    index: 0,
                    routes: [{ name: 'HomeScreen'}],
                })
            );
        }
    };

    return (
        <View>
            <Text>Invitation de {invitationDetails.clubId}</Text>
            {invitationDetails.state === 'pending' ? (
                <View>
                    <Button title="Accepter" onPress={() => handleInvitationResponse('accepted')} />
                    <Button title="Refuser" onPress={() => handleInvitationResponse('rejected')} />
                </View>
            ) : (
                <View>
                    {invitationDetails.state === "rejected" ? (
                        <Text>Il semble que cette invitation a déjà été refusée.</Text>
                    ) : invitationDetails.state === "accepted" ? (
                        <Text>Il semble que cette invitation a déjà été acceptée.</Text>
                    ) : invitationDetails.state === "expired" && (
                        <Text>Il semble que cette invitation est expirée.</Text>
                    )}
                </View>
            )}
        </View>
    );
}

export default InvitationDetailScreen;