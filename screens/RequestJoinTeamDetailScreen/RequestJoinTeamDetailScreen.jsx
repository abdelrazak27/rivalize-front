import { View, Text, Alert, ScrollView, StyleSheet } from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import { arrayUnion, doc, getDoc, setDoc, Timestamp, updateDoc } from 'firebase/firestore';
import { useEffect, useState } from 'react';
import { db } from '../../firebaseConfig';
import uuid from 'react-native-uuid';
import { SafeAreaView } from 'react-native-safe-area-context';
import globalStyles from '../../styles/globalStyles';
import { PrimaryColorText, Subtitle, Title } from '../../components/TextComponents';
import FunctionButton from '../../components/FunctionButton';
import { getPlayerNameById } from '../../utils/users';
import { getTeamName } from '../../utils/teams';
import { fonts } from '../../styles/fonts';
import colors from '../../styles/colors';
import { useLoading } from '../../context/LoadingContext';

function RequestJoinTeamDetailScreen() {
    const route = useRoute();
    const { requestJoinClubId } = route.params;
    const navigation = useNavigation();

    const [requestDetails, setRequestDetails] = useState(null);
    const [playerName, setPlayerName] = useState('');
    const [clubName, setClubName] = useState('');
    const { setIsLoading } = useLoading();

    const requestRef = doc(db, 'requests_join_club', requestJoinClubId);

    useEffect(() => {
        const fetchRequest = async () => {
            const requestDoc = await getDoc(requestRef);
            if (requestDoc.exists()) {
                setIsLoading(true);
                const requestData = requestDoc.data();
                setRequestDetails(requestData);
                setIsLoading(false);

                const playerName = await getPlayerNameById(requestData.userId);
                setPlayerName(playerName);

                const teamName = await getTeamName(requestData.clubId)
                setClubName(teamName);
            }
        };

        fetchRequest();
    }, [requestJoinClubId]);

    const handleRequestResponse = async (newState) => {
        setIsLoading(true);
        const userRef = doc(db, 'utilisateurs', requestDetails.userId);
        const userDoc = await getDoc(userRef);
        if (!userDoc.exists()) {
            setIsLoading(false);
            Alert.alert("Erreur", "Profil utilisateur introuvable.");
            return;
        }

        const userData = userDoc.data();
        const teamRef = doc(db, 'equipes', requestDetails.clubId);
        const teamDoc = await getDoc(teamRef);
        if (!teamDoc.exists()) {
            setIsLoading(false);
            Alert.alert("Erreur", "Club introuvable.");
            return;
        }

        const teamData = teamDoc.data();

        if (newState === 'accepted') {
            if (userData.team) {
                setIsLoading(false);
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

            setIsLoading(false);
            Alert.alert("Demande acceptée", `Le joueur a été ajouté au club ${teamData.name} avec succès.`);
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

            setIsLoading(false);
            Alert.alert("Demande refusée", `Vous avez refusé la demande du joueur pour rejoindre le club ${teamData.name}.`);
        }

        navigation.goBack();
    };

    return (
        <SafeAreaView style={globalStyles.container}>
            {requestDetails && playerName && clubName && (
                <>
                    <View style={globalStyles.headerContainerWithNoBorderBottom}>
                        <Title>Oh, une <PrimaryColorText>invitation</PrimaryColorText></Title>
                        <Subtitle>Il semblerait qu'un joueur souahite être invité à rejoindre l'un de vos clubs</Subtitle>
                    </View>

                    <View
                        style={{ marginTop: 50, paddingHorizontal: 30 }}
                    >

                        <View>
                            <Title><PrimaryColorText>{playerName}</PrimaryColorText> demande à rejoindre <PrimaryColorText>{clubName}</PrimaryColorText></Title>
                            {requestDetails.state === 'pending' ? (
                                <View style={styles.buttons}>
                                    <FunctionButton
                                        title="Accepter"
                                        onPress={() => handleRequestResponse('accepted')}
                                    />
                                    <FunctionButton
                                        title="Refuser"
                                        onPress={() => handleRequestResponse('rejected')}
                                        variant='primaryOutline'
                                    />
                                    <FunctionButton
                                        title="Voir le profil du joueur"
                                        onPress={() => navigation.navigate('ProfileScreen', { userId: requestDetails.userId })}
                                        variant='secondaryOutline'
                                    />
                                </View>
                            ) : requestDetails.state === 'canceled' ? (
                                <Text style={styles.textInfos}>Cette demande a été annulée.</Text>
                            ) : (
                                <Text style={styles.textInfos}>Cette demande a déjà été traitée.</Text>
                            )}
                        </View>
                    </View>
                </>
            )}
        </SafeAreaView>
    );
}

export default RequestJoinTeamDetailScreen;

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