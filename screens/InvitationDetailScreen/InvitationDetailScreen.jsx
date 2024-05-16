import { View, Text, Button, Alert } from 'react-native';
import { useRoute, useNavigation, CommonActions } from '@react-navigation/native';
import { arrayUnion, collection, doc, getDoc, getDocs, query, updateDoc, where } from 'firebase/firestore';
import { db } from '../../firebaseConfig';
import { useUser } from '../../context/UserContext';
import { useEffect, useState } from 'react';

function InvitationDetailScreen() {
    const route = useRoute();
    const { invitationId } = route.params;
    const navigation = useNavigation();
    const { user, setUser } = useUser();

    const [invitationDetails, setInvitationDetails] = useState('');
    const [hasTeam, setHasTeam] = useState(false);

    const invitationRef = doc(db, 'invitations', invitationId);

    useEffect(() => {
        const fetchInvitation = async () => {
            const invitationDoc = await getDoc(invitationRef);
            if (invitationDoc.exists()) {
                setInvitationDetails(invitationDoc.data());
            }
        };

        const checkUserTeam = async () => {
            const userRef = doc(db, 'utilisateurs', user.uid);
            const userDoc = await getDoc(userRef);
            if (userDoc.exists() && userDoc.data().team) {
                setHasTeam(true);
            }
        };

        fetchInvitation();
        checkUserTeam();
    }, [invitationId, user.uid]);

    const handleInvitationResponse = async (newState) => {
        if (newState === 'accepted') {
            const userRef = doc(db, 'utilisateurs', user.uid);
            const userDoc = await getDoc(userRef);

            if (userDoc.data().team) {
                Alert.alert(
                    "Changement d'équipe",
                    "Accepter cette invitation vous fera quitter votre équipe actuelle. Voulez-vous continuer ?",
                    [
                        {
                            text: "Annuler",
                            style: "cancel"
                        },
                        {
                            text: "Continuer",
                            onPress: async () => {
                                await updateInvitationAndUser(userRef, invitationRef);
                            }
                        }
                    ]
                );
            } else {
                await updateInvitationAndUser(userRef, invitationRef);
            }
        } else {
            await updateDoc(invitationRef, { state: newState });
            Alert.alert("Invitation refusée.");

            navigation.dispatch(
                CommonActions.reset({
                    index: 0,
                    routes: [{ name: 'HomeScreen' }],
                })
            );
        }
    };

    const updateInvitationAndUser = async (userRef, invitationRef) => {
        const { clubId } = (await getDoc(invitationRef)).data();
        await updateDoc(userRef, { team: clubId, requestedJoinClubId: null });
        const teamRef = doc(db, 'equipes', clubId);
        await updateDoc(teamRef, { players: arrayUnion(user.uid) });
        await updateDoc(invitationRef, { state: 'accepted' });

        if (user.requestedJoinClubId) {
            const requestRef = doc(db, 'requests_join_club', user.requestedJoinClubId);
            await updateDoc(requestRef, { state: 'canceled' });
        }
        const invitationsQuery = query(collection(db, 'invitations'), where('invitedUid', '==', user.uid), where('state', '==', 'pending'));
        const invitationsSnapshot = await getDocs(invitationsQuery);
        invitationsSnapshot.forEach(async (doc) => {
            await updateDoc(doc.ref, { state: 'expired' });
        });

        const updatedUserData = {
            ...user,
            team: clubId,
            requestedJoinClubId: null
        };
        await setUser(updatedUserData);

        Alert.alert("Invitation acceptée !");
        navigation.dispatch(
            CommonActions.reset({
                index: 0,
                routes: [{ name: 'HomeScreen', params: { teamRefresh: true } }],
            })
        );
    };


    return (
        <View>
            <Text>Invitation de {invitationDetails.clubId}</Text>
            {invitationDetails.state === 'pending' ? (
                <View>
                    {hasTeam && (
                        <Text style={{ color: 'red', fontWeight: 'bold' }}>
                            Attention : Vous faites déjà partie d'une équipe. Accepter cette invitation vous fera quitter votre équipe actuelle.
                        </Text>
                    )}
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