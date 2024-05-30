import { View, Text, Alert, StyleSheet, ScrollView, ActivityIndicator } from 'react-native';
import { useRoute, useNavigation, CommonActions } from '@react-navigation/native';
import { arrayUnion, collection, doc, getDoc, getDocs, query, updateDoc, where } from 'firebase/firestore';
import { db } from '../../firebaseConfig';
import { useUser } from '../../context/UserContext';
import { useEffect, useState } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { PrimaryColorText, Subtitle, Title } from '../../components/TextComponents';
import globalStyles from '../../styles/globalStyles';
import { getTeamName } from '../../utils/teams';
import { getPlayerNameById } from '../../utils/users';
import { fonts } from '../../styles/fonts';
import colors from '../../styles/colors';
import FunctionButton from '../../components/FunctionButton';
import { useLoading } from '../../context/LoadingContext';
import LoadingOverlay from '../../components/LoadingOverlay';

function InvitationDetailScreen() {
    const route = useRoute();
    const { invitationId } = route.params;
    const navigation = useNavigation();
    const { user, setUser } = useUser();
    const { setIsLoading } = useLoading();

    const [invitationDetails, setInvitationDetails] = useState('');
    const [hasTeam, setHasTeam] = useState(false);
    const [clubName, setClubName] = useState('');

    const invitationRef = doc(db, 'invitations', invitationId);

    useEffect(() => {
        const fetchInvitation = async () => {
            const invitationDoc = await getDoc(invitationRef);
            if (invitationDoc.exists()) {
                const invitationData = invitationDoc.data();
                setInvitationDetails(invitationData);

                const teamName = await getTeamName(invitationData.clubId);
                setClubName(teamName);
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
        setIsLoading(true);
        if (newState === 'accepted') {
            const userRef = doc(db, 'utilisateurs', user.uid);
            const userDoc = await getDoc(userRef);

            if (userDoc.data().team) {
                setIsLoading(false);
                Alert.alert(
                    "Changement de club",
                    "Accepter cette invitation vous fera quitter votre club actuel. Voulez-vous continuer ?",
                    [
                        {
                            text: "Annuler",
                            style: "cancel",
                        },
                        {
                            text: "Continuer",
                            style: "destructive",
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
            setIsLoading(false);
            Alert.alert("Invitation refusée");
            navigation.dispatch(
                CommonActions.reset({
                    index: 0,
                    routes: [{ name: 'HomeScreen' }],
                })
            );
        }
    };

    const updateInvitationAndUser = async (userRef, invitationRef) => {
        setIsLoading(true);
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

        setIsLoading(false);
        Alert.alert("Invitation acceptée");
        navigation.dispatch(
            CommonActions.reset({
                index: 0,
                routes: [{ name: 'HomeScreen', params: { teamRefresh: true } }],
            })
        );
    };

    if (!invitationDetails) {
        return (
            <ActivityIndicator size="large" style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}/>
        )
    }

    return (
        <SafeAreaView style={globalStyles.container}>
            <View style={globalStyles.headerContainerWithNoBorderBottom}>
                <Title>Oh, une <PrimaryColorText>invitation</PrimaryColorText></Title>
                <Subtitle>Il semblerait que vous venez d’être invité à rejoindre un club</Subtitle>
            </View>

            <ScrollView
                style={{ marginTop: 50, paddingHorizontal: 30 }}
            >
                {invitationDetails && clubName && (
                    <View>
                        <Title>Le club <PrimaryColorText>{clubName}</PrimaryColorText> souhaite vous voir parmi ses membres</Title>
                        {invitationDetails.state === 'pending' ? (
                            <View style={styles.buttons}>
                                <FunctionButton
                                    title="Accepter"
                                    onPress={() => handleInvitationResponse('accepted')}
                                    disabled={hasTeam}
                                />
                                <FunctionButton
                                    title="Refuser"
                                    onPress={() => handleInvitationResponse('rejected')}
                                    variant='primaryOutline'
                                    disabled={hasTeam}
                                />
                                <FunctionButton
                                    title="Voir la page du club"
                                    onPress={() => navigation.navigate('TeamScreen', { teamId: invitationDetails.clubId })}
                                    variant='secondaryOutline'
                                />
                                {hasTeam && (
                                    <Text style={[styles.textInfos, { fontSize: 14, color: colors.error, textAlign: 'center' }]}>
                                        Attention : Vous faites déjà parti d'un club. Accepter cette invitation vous fera quitter votre club actuel.
                                    </Text>
                                )}
                            </View>
                        ) : (
                            <View>
                                {invitationDetails.state === "rejected" ? (
                                    <Text style={styles.textInfos}>Cette demande a déjà été refusée.</Text>
                                ) : invitationDetails.state === "accepted" ? (
                                    <Text style={styles.textInfos}>Cette demande a déjà été acceptée.</Text>
                                ) : invitationDetails.state === "expired" && (
                                    <Text style={styles.textInfos}>Cette demande a expiré.</Text>
                                )}
                            </View>
                        )}
                    </View>
                )}
            </ScrollView>
        </SafeAreaView>
    );
}

export default InvitationDetailScreen;

const styles = StyleSheet.create({
    buttons: {
        paddingVertical: 25,
        gap: 15,
    },
    textInfos: {
        paddingTop: 15,
        fontSize: 16,
        fontFamily: fonts.OutfitSemiBold,
        color: colors.secondary
    },
});